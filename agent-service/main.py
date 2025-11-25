import os
import re
import sys
from datetime import datetime
from typing import List, Optional

import requests
from bson.objectid import ObjectId
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pymongo import MongoClient

app = FastAPI(title="Airbnb AI Travel Assistant")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ollama configuration
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "localhost")
OLLAMA_PORT = int(os.getenv("OLLAMA_PORT", 11434))
OLLAMA_URL = f"http://{OLLAMA_HOST}:{OLLAMA_PORT}/api/generate"
MODEL_NAME = "llama3.2:1b"
REQUEST_TIMEOUT = 60
PORT = int(os.getenv("PORT", 8001))

# Database configuration
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "database": os.getenv("DB_NAME", "airbnb_db"),
    "port": int(os.getenv("DB_PORT", 27017)),
}

try:
    mongo_client = MongoClient(host=DB_CONFIG["host"], port=DB_CONFIG["port"])
    db = mongo_client.get_database(DB_CONFIG["database"])
    print("✅ Successfully connected to MongoDB database")
except Exception as e:
    print(f"❌ Error connecting to MongoDB database: {e}")
    sys.exit(1)


class ChatMessage(BaseModel):
    role: str = Field(..., description="Role of the message sender")
    content: str = Field(..., description="Content of the message")


class ChatRequest(BaseModel):
    message: str = Field(..., description="User's message")
    conversation_history: List[ChatMessage] = Field(default_factory=list)
    user_context: Optional[dict] = None


class ChatResponse(BaseModel):
    response: str = Field(..., description="AI assistant's response")
    suggestions: List[str] = Field(default_factory=list)


# Improved system prompt
SYSTEM_PROMPT = """You are a friendly AI travel assistant for a vacation rental platform.

Your role:
- Help users search for vacation rental properties
- Answer questions about bookings and amenities
- Provide travel recommendations

Be helpful, concise, and professional.

Current date: {current_date}
"""


# Database helper functions
def get_user_properties(user_email: str = None, user_type: str = None):
    """Get properties from database"""
    try:
        properties_collection = db.properties
        users_collection = db.users

        query_filter = {}

        if user_type == "owner" and user_email:
            # Find the owner's user_id first
            user_doc = users_collection.find_one({"email": user_email})
            if user_doc:
                query_filter = {"owner_id": user_doc["_id"]}
            else:
                return []  # Owner not found

            # Additional fields to select for owner properties
            projection = {
                "property_id": "$_id",  # Rename _id to property_id for consistency
                "property_name": 1,
                "city": 1,
                "country": 1,
                "price_per_night": 1,
                "bedrooms": 1,
                "bathrooms": 1,
                "property_type": 1,
                "is_available": 1,
            }

            properties = list(
                properties_collection.find(query_filter, projection)
                .sort("created_at", -1)
                .limit(10)
            )

            # Map _id to property_id in each document
            for prop in properties:
                prop["property_id"] = str(prop["_id"])
                del prop["_id"]

        else:
            query_filter = {"is_available": True}
            projection = {
                "property_id": "$_id",  # Rename _id to property_id
                "property_name": 1,
                "city": 1,
                "country": 1,
                "price_per_night": 1,
                "bedrooms": 1,
                "bathrooms": 1,
                "property_type": 1,
            }
            properties = list(
                properties_collection.find(query_filter, projection)
                .sort("created_at", -1)
                .limit(10)
            )

            # Map _id to property_id in each document
            for prop in properties:
                prop["property_id"] = str(prop["_id"])
                del prop["_id"]

        return properties
    except Exception as e:  # Catch broader exceptions for MongoDB errors
        print(f"Database error: {e}")
        return []


def get_user_favorites(user_email: str):
    """Get user's favorite properties"""
    try:
        favorites_collection = db.favorites
        users_collection = db.users

        # Find the user's _id first
        user_doc = users_collection.find_one({"email": user_email})
        if not user_doc:
            return []  # User not found

        user_id = user_doc["_id"]

        pipeline = [
            {"$match": {"user_id": user_id}},
            {
                "$lookup": {
                    "from": "properties",  # The collection to join with
                    "localField": "property_id",
                    "foreignField": "_id",
                    "as": "propertyDetails",
                }
            },
            {
                "$unwind": "$propertyDetails"  # Deconstruct the propertyDetails array
            },
            {
                "$project": {
                    "_id": 0,  # Exclude the favorite's _id
                    "property_id": "$propertyDetails._id",  # Map property _id to property_id
                    "property_name": "$propertyDetails.property_name",
                    "city": "$propertyDetails.city",
                    "country": "$propertyDetails.country",
                    "price_per_night": "$propertyDetails.price_per_night",
                    "bedrooms": "$propertyDetails.bedrooms",
                    "bathrooms": "$propertyDetails.bathrooms",
                    "property_type": "$propertyDetails.property_type",
                    "created_at": "$created_at",  # Include favorite created_at for sorting
                }
            },
            {
                "$sort": {"created_at": -1}  # Sort by favorite created_at
            },
            {"$limit": 10},
        ]

        properties = list(favorites_collection.aggregate(pipeline))

        # Convert ObjectId to string for property_id
        for prop in properties:
            if "_id" in prop:
                del prop["_id"]  # Ensure _id is removed
            prop["property_id"] = str(prop["property_id"])
            # Remove created_at if it's not needed in the final output, as it was just for sorting
            if "created_at" in prop:
                del prop["created_at"]

        return properties
    except Exception as e:
        print(f"Database error in get_user_favorites: {e}")
        return []


def search_properties(
    city: str = None,
    max_price: float = None,
    amenity: str = None,
    bedrooms: int = None,
    bathrooms: int = None,
):
    """Search properties based on criteria"""
    try:
        properties_collection = db.properties

        query_filter = {"is_available": True}

        if city:
            query_filter["$or"] = [
                {"city": {"$regex": city, "$options": "i"}},  # Case-insensitive search
                {
                    "country": {"$regex": city, "$options": "i"}
                },  # Case-insensitive search
            ]

        if (
            max_price is not None
        ):  # Check for None explicitly to allow 0 as a valid price
            query_filter["price_per_night"] = {"$lte": max_price}

        if amenity:
            # Assuming amenities is an array of strings in MongoDB
            # This will match if any amenity in the array contains the substring
            query_filter["amenities"] = {"$regex": amenity, "$options": "i"}

        if bedrooms is not None:
            query_filter["bedrooms"] = bedrooms

        if bathrooms is not None:
            query_filter["bathrooms"] = bathrooms

        projection = {
            "property_id": "$_id",  # Rename _id to property_id
            "property_name": 1,
            "city": 1,
            "country": 1,
            "price_per_night": 1,
            "bedrooms": 1,
            "bathrooms": 1,
            "property_type": 1,
            "amenities": 1,  # Include amenities in the projection
        }

        properties = list(
            properties_collection.find(query_filter, projection)
            .sort("created_at", -1)
            .limit(10)
        )

        # Map _id to property_id in each document
        for prop in properties:
            prop["property_id"] = str(prop["_id"])
            del prop["_id"]

        return properties
    except Exception as e:
        print(f"Database error in search_properties: {e}")
        return []


def get_user_bookings(user_email: str):
    """Get user's bookings"""
    try:
        bookings_collection = db.bookings
        users_collection = db.users

        # Find the user's _id first
        user_doc = users_collection.find_one({"email": user_email})
        if not user_doc:
            return []  # User not found

        user_id = user_doc["_id"]

        pipeline = [
            {"$match": {"traveler_id": user_id}},
            {
                "$lookup": {
                    "from": "properties",  # The collection to join with
                    "localField": "property_id",
                    "foreignField": "_id",
                    "as": "propertyDetails",
                }
            },
            {
                "$unwind": "$propertyDetails"  # Deconstruct the propertyDetails array
            },
            {
                "$project": {
                    "_id": 0,  # Exclude the booking's _id
                    "booking_id": "$_id",  # Map booking _id to booking_id
                    "check_in_date": 1,
                    "check_out_date": 1,
                    "num_guests": 1,
                    "total_price": 1,
                    "status": 1,
                    "property_name": "$propertyDetails.property_name",
                    "city": "$propertyDetails.city",
                    "country": "$propertyDetails.country",
                    "booking_date": 1,  # Include booking_date for sorting
                }
            },
            {
                "$sort": {"booking_date": -1}  # Sort by booking_date
            },
            {"$limit": 5},
        ]

        bookings = list(bookings_collection.aggregate(pipeline))

        # Convert ObjectId to string for booking_id
        for booking in bookings:
            if "booking_id" in booking:
                booking["booking_id"] = str(booking["booking_id"])
            # Remove booking_date if it's not needed in the final output, as it was just for sorting
            if "booking_date" in booking:
                del booking["booking_date"]

        return bookings
    except Exception as e:
        print(f"Database error in get_user_bookings: {e}")
        return []


def format_properties_for_ai(properties: list) -> str:
    """Format properties list for AI response"""
    if not properties:
        return "No properties found matching your criteria."

    result = f"I found {len(properties)} properties for you:\n\n"
    for i, prop in enumerate(properties, 1):
        status = " (Unavailable)" if not prop.get("is_available", True) else ""
        result += f"{i}. **{prop['property_name']}**{status}\n"
        result += f"    {prop['city']}, {prop['country']}\n"
        result += f"    ${prop['price_per_night']}/night\n"
        result += f"    {prop['bedrooms']} bed • 🚿 {prop['bathrooms']} bath\n"
        result += f"    {prop['property_type'].title()}\n\n"

    return result


def format_bookings_for_ai(bookings: list) -> str:
    """Format bookings list for AI response"""
    if not bookings:
        return "You don't have any bookings yet."

    result = f"Here are your recent bookings:\n\n"
    for i, booking in enumerate(bookings, 1):
        result += f"{i}. **{booking['property_name']}**\n"
        result += f"    {booking['city']}, {booking['country']}\n"
        result += f"    {booking['check_in_date']} to {booking['check_out_date']}\n"
        result += f"    {booking['num_guests']} guests\n"
        result += f"    ${booking['total_price']}\n"
        result += f"    Status: {booking['status']}\n\n"

    return result


def extract_number(text: str, keywords: list) -> int:
    """Extract number near keywords"""
    text_lower = text.lower()
    for keyword in keywords:
        if keyword in text_lower:
            # Find numbers near the keyword
            pattern = rf"(\d+)\s*{keyword}|{keyword}\s*(\d+)"
            match = re.search(pattern, text_lower)
            if match:
                num = match.group(1) or match.group(2)
                return int(num)
    return None


def extract_search_params(message: str) -> dict:
    """Extract search parameters from user message"""
    message_lower = message.lower()
    params = {}

    # Extract bedrooms
    bedrooms = extract_number(message, ["bedroom", "bed", "br"])
    if bedrooms:
        params["bedrooms"] = bedrooms

    # Extract bathrooms
    bathrooms = extract_number(message, ["bathroom", "bath", "ba"])
    if bathrooms:
        params["bathrooms"] = bathrooms

    # Extract city - improved logic
    city_keywords = ["in", "near", "at", "around"]
    for keyword in city_keywords:
        if keyword + " " in message_lower:
            parts = message_lower.split(keyword + " ")
            if len(parts) > 1:
                # Get the next 1-3 words after the keyword
                city_words = parts[1].strip().split()[:3]
                # Remove common words
                stop_words = ["a", "the", "with", "and", "or", "property", "properties"]
                city_words = [w for w in city_words if w not in stop_words]
                if city_words:
                    params["city"] = (
                        " ".join(city_words).replace(",", "").replace(".", "")
                    )
                    break

    # Extract price
    if any(
        word in message_lower
        for word in ["under", "below", "less than", "max", "maximum"]
    ):
        # Find price with $ or just number
        price_match = re.search(r"\$?(\d+)", message_lower)
        if price_match:
            params["max_price"] = float(price_match.group(1))

    # Extract amenities
    amenities = [
        "pool",
        "wifi",
        "parking",
        "kitchen",
        "gym",
        "beach",
        "balcony",
        "ac",
        "garden",
    ]
    for amenity in amenities:
        if amenity in message_lower:
            params["amenity"] = amenity
            break

    return params


def create_prompt(
    message: str,
    conversation_history: List[ChatMessage],
    user_context: Optional[dict] = None,
) -> str:
    """Create a formatted prompt for Ollama"""
    current_date = datetime.now().strftime("%Y-%m-%d")
    prompt = SYSTEM_PROMPT.format(current_date=current_date)

    if user_context:
        prompt += f"\nUser: {user_context.get('name', 'Guest')}"
        if user_context.get("user_type"):
            prompt += f" ({user_context['user_type']})"
        prompt += "\n"

    if conversation_history:
        prompt += "\nRecent conversation:\n"
        for msg in conversation_history[-3:]:
            prompt += f"{msg.role.capitalize()}: {msg.content}\n"

    prompt += f"\nUser: {message}\nAssistant:"
    return prompt


def get_suggestions(message: str, has_results: bool = False) -> List[str]:
    """Generate follow-up suggestions"""
    message_lower = message.lower()

    if "property" in message_lower or "properties" in message_lower:
        if has_results:
            return [
                "Show me more details",
                "Filter by different criteria",
                "Properties in another city",
            ]
        else:
            return [
                "Show all properties",
                "Properties in Paris",
                "Properties under $200",
            ]
    elif "booking" in message_lower:
        return ["Cancel a booking", "Modify my booking", "Refund policy"]
    elif "favorite" in message_lower:
        return ["Add to favorites", "Remove from favorites", "Show property details"]
    else:
        return ["Search for properties", "View my bookings", "Show my favorites"]


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Main chat endpoint with property integration"""
    try:
        message_lower = request.message.lower()

        # Handle "my properties" queries (for owners)
        if any(phrase in message_lower for phrase in ["my propert", "my listing"]):
            if request.user_context and request.user_context.get("email"):
                properties = get_user_properties(
                    request.user_context.get("email"),
                    request.user_context.get("user_type"),
                )

                if properties:
                    properties_text = format_properties_for_ai(properties)
                    ai_response = properties_text
                    suggestions = [
                        "Add new property",
                        "View bookings",
                        "Update details",
                    ]
                else:
                    ai_response = "You don't have any properties listed yet."
                    suggestions = ["Add a property", "Get started guide", "Help"]

                return ChatResponse(response=ai_response, suggestions=suggestions)

        # Handle favorites queries
        elif any(
            phrase in message_lower
            for phrase in ["favorite", "favourite", "fav", "liked"]
        ):
            if request.user_context and request.user_context.get("email"):
                properties = get_user_favorites(request.user_context.get("email"))

                if properties:
                    properties_text = format_properties_for_ai(properties)
                    ai_response = (
                        f"Here are your favorite properties:\n\n{properties_text}"
                    )
                    suggestions = ["View details", "Remove favorite", "Book now"]
                else:
                    ai_response = (
                        "You haven't added any properties to your favorites yet."
                    )
                    suggestions = [
                        "Browse properties",
                        "Popular destinations",
                        "Help me search",
                    ]

                return ChatResponse(response=ai_response, suggestions=suggestions)

        # Handle "my bookings" queries (for travelers)
        elif any(
            phrase in message_lower
            for phrase in ["my booking", "my reservation", "my trip", "show booking"]
        ):
            if request.user_context and request.user_context.get("email"):
                bookings = get_user_bookings(request.user_context.get("email"))

                if bookings:
                    bookings_text = format_bookings_for_ai(bookings)
                    ai_response = bookings_text
                    suggestions = ["Cancel booking", "Modify dates", "Contact host"]
                else:
                    ai_response = "You don't have any bookings yet."
                    suggestions = ["Find properties", "Popular destinations", "Help"]

                return ChatResponse(response=ai_response, suggestions=suggestions)

        # Handle property search queries
        elif any(
            word in message_lower
            for word in [
                "find",
                "search",
                "show",
                "properties",
                "property",
                "hotel",
                "accommodation",
            ]
        ):
            params = extract_search_params(request.message)

            print(f"Extracted params: {params}")  # Debug

            properties = search_properties(
                city=params.get("city"),
                max_price=params.get("max_price"),
                amenity=params.get("amenity"),
                bedrooms=params.get("bedrooms"),
                bathrooms=params.get("bathrooms"),
            )

            if properties:
                properties_text = format_properties_for_ai(properties)
                ai_response = properties_text
            else:
                search_criteria = []
                if params.get("bedrooms"):
                    search_criteria.append(f"{params['bedrooms']} bedrooms")
                if params.get("bathrooms"):
                    search_criteria.append(f"{params['bathrooms']} bathrooms")
                if params.get("city"):
                    search_criteria.append(f"in {params['city']}")
                if params.get("max_price"):
                    search_criteria.append(f"under ${params['max_price']}")
                if params.get("amenity"):
                    search_criteria.append(f"with {params['amenity']}")

                criteria_text = (
                    ", ".join(search_criteria)
                    if search_criteria
                    else "matching your criteria"
                )
                ai_response = f"I couldn't find any properties {criteria_text}.\n\nTry:\n• Adjusting your filters\n• Searching in a different city\n• Increasing your budget"

            suggestions = get_suggestions(
                request.message, has_results=len(properties) > 0
            )
            return ChatResponse(response=ai_response, suggestions=suggestions)

        # For general questions, use AI
        prompt = create_prompt(
            request.message, request.conversation_history, request.user_context
        )

        ollama_request = {
            "model": MODEL_NAME,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.7,
                "top_p": 0.9,
                "num_predict": 300,
                "stop": ["\nUser:", "\nHuman:"],
                "num_ctx": 2048,
            },
        }

        response = requests.post(
            OLLAMA_URL, json=ollama_request, timeout=REQUEST_TIMEOUT
        )
        response.raise_for_status()

        result = response.json()
        ai_response = result.get("response", "").strip()

        if not ai_response:
            ai_response = "I apologize, but I couldn't generate a response. Please try rephrasing."

        suggestions = get_suggestions(request.message)

        return ChatResponse(response=ai_response, suggestions=suggestions)

    except requests.exceptions.ConnectionError:
        raise HTTPException(
            status_code=503,
            detail="AI service unavailable. Please ensure Ollama is running.",
        )
    except requests.exceptions.Timeout:
        raise HTTPException(
            status_code=504, detail="Request took too long. Try a shorter message."
        )
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        ollama_response = requests.get("http://ollama:11434/api/tags", timeout=5)
        ollama_status = (
            "connected" if ollama_response.status_code == 200 else "disconnected"
        )

        try:
            # Attempt to ping the MongoDB server
            mongo_client.admin.command("ping")
            db_status = "connected"
        except Exception as e:
            print(f"MongoDB health check error: {e}")
            db_status = "disconnected"

        models = []
        if ollama_response.status_code == 200:
            data = ollama_response.json()
            models = [model.get("name") for model in data.get("models", [])]

        return {
            "status": "healthy",
            "ollama": ollama_status,
            "database": db_status,
            "model": MODEL_NAME,  # Assuming MODEL_NAME is globally available
            "available_models": models,
        }
    except Exception as e:
        print(f"Health check main error: {e}")
        return {
            "status": "degraded",
            "ollama": "unknown",
            "database": "unknown",
            "model": MODEL_NAME,  # Assuming MODEL_NAME is globally available
        }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AI Travel Assistant API",
        "version": "2.1.0",
        "model": MODEL_NAME,
        "features": [
            "Smart property search",
            "Booking management",
            "Favorites tracking",
            "Travel recommendations",
        ],
        "endpoints": {
            "chat": "/chat (POST)",
            "health": "/health (GET)",
            "docs": "/docs (GET)",
        },
    }


if __name__ == "__main__":
    import uvicorn

    print("=" * 60)
    print("🤖 AI Travel Assistant v2.1")
    print(f"📍 http://localhost:{PORT}")
    print(f"🧠 Model: {MODEL_NAME}")
    print(f"💾 Database: {DB_CONFIG['database']}")
    print("=" * 60)
    uvicorn.run(app, host="0.0.0.0", port=PORT, log_level="info")
