# Airbnb Clone - AI Travel Assistant

Python FastAPI service with Ollama integration 

## Quick Start
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the service
python main.py
```

##  AI Model Setup

### Install Ollama
```
### Pull the Model
```bash
# Pull the lightweight model
ollama pull llama3.2:1b

# Start Ollama server
ollama serve
```

## 📁 Project Structure
```
agent-service/
├── main.py              # FastAPI application
├── requirements.txt     # Python dependencies
├── .env                 # Environment variables
└── venv/               # Virtual environment
```

## 🔧 Configuration

Create `.env` file:
```env
OLLAMA_URL=http://localhost:11434
MODEL_NAME=llama3.2:1b
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=airbnb_db
PORT=8001
```

## 📦 Dependencies
```txt
fastapi==0.115.5
uvicorn[standard]==0.32.1
pydantic==2.10.3
requests==2.32.3
python-dotenv==1.0.1
typing-extensions==4.12.2
mysql-connector-python==8.2.0
```

## 🛣️ API Endpoints

### POST /chat
Send a message to the AI assistant.

**Request:**
```json
{
  "message": "Find properties in Paris",
  "conversation_history": [
    {
      "role": "user",
      "content": "Hello"
    },
    {
      "role": "assistant",
      "content": "Hi! How can I help?"
    }
  ],
  "user_context": {
    "name": "John Doe",
    "email": "john@example.com",
    "user_type": "traveler"
  }
}
```

**Response:**
```json
{
  "response": "I found 5 properties in Paris...",
  "suggestions": [
    "Show me more details",
    "Filter by price",
    "Properties with WiFi"
  ]
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "ollama": "connected",
  "database": "connected",
  "model": "llama3.2:1b",
  "available_models": ["llama3.2:1b", "llama3.2"]
}
```



