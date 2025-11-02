# Airbnb 

### For Travelers
-  **Property Search** - Search properties by location, price, amenities, bedrooms, bathrooms
-  **Booking Management** - Create, view, and cancel bookings
-  **Favorites** - Save favorite properties for later
-  **Profile Management** - Update personal information and profile picture
-  **Dashboard** - View booking statistics and upcoming trips
-  **AI Travel Assistant** - Get personalized recommendations and help

### For Property Owners
-  **Property Management** - Add, edit, delete properties
-  **Image Upload** - Upload multiple property images
-  **Booking Requests** - Accept or decline booking requests
-  **Owner Dashboard** - View property statistics and revenue
-  **Booking Management** - Manage all incoming reservations

### AI Features
-  **Intelligent Chatbot** - Powered by Ollama (Llama 3.2)
-  **Smart Property Search** - Natural language property queries
-  **Booking Assistance** - Help with bookings and cancellations
-  **Travel Planning** - Trip recommendations and itinerary suggestions

##  Technology Stack

### Frontend
- **React** 18.x - UI framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **CSS3** - Styling with custom components

### Backend (API)
- **Node.js** 18.x - Runtime environment
- **Express** 4.x - Web framework
- **MySQL** 8.x - Relational database
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File upload handling
- **CORS** - Cross-origin resource sharing

### AI Service
- **Python** 3.11+
- **FastAPI** - Modern Python web framework
- **Ollama** - Local LLM runtime
- **Llama 3.2** - Language model
- **MySQL Connector** - Database integration

##  Project Structure
```
airbnb_prototype/
├── frontend/                 # React frontend application
│   ├── public/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   ├── common/      # Common components (Header, Footer, etc.)
│   │   │   └── ChatWidget/  # AI chatbot widget
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service files
│   │   ├── context/         # React context (Auth)
│   │   ├── utils/           # Utility functions
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── README.md
│
├── backend/                  # Node.js/Express backend
│   ├── server.js            # Main server file
│   ├── .env                 # Environment variables
│   ├── package.json
│   └── README.md
│
└── agent-service/           # Python AI service
    ├── main.py              # FastAPI application
    ├── requirements.txt     # Python dependencies
    ├── .env                 # Environment variables
    └── README.md
```
```bash
git clone https://github.com/yourusername/airbnb-clone.git
cd airbnb-clone
```

#### 2. Database Setup
```bash
# Start MySQL
mysql -u root -p

# Create database
CREATE DATABASE airbnb_db;

# Copy schemas from DATABASE_SETUP.md
mysql -u root -p
USE airbnb_db;
# Paste into the airbnb_db database
```

#### 3. Backend Setup
```bash
cd backend
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
# Then start the server
npm run dev
```

Backend runs on: `http://localhost:5000`

#### 4. Frontend Setup
```bash
cd frontend
npm install

# Create .env file
cp .env.example .env

# Start the development server
npm start
```

Frontend runs on: `http://localhost:3000`

#### 5. AI Service Setup
```bash

# Pull the model
ollama pull llama3.2:1b

# Start Ollama (in separate terminal)
ollama serve

# Setup Python environment
cd agent-service
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the AI service
python main.py
```

AI Service runs on: `http://localhost:8001`

## Configuration

### Backend (.env)
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=airbnb_db
JWT_SECRET=your_jwt_secret_key
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000
```

### AI Service (.env)
```env
OLLAMA_URL=http://localhost:11434
MODEL_NAME=llama3.2:1b
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=airbnb_db
PORT=8001
```

##  API Documentation

### Backend API Endpoints

#### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

#### Properties
- `GET /api/properties` - Get all properties
- `GET /api/properties/:id` - Get property by ID
- `POST /api/properties` - Create property (Owner only)
- `PUT /api/properties/:id` - Update property (Owner only)
- `DELETE /api/properties/:id` - Delete property (Owner only)
- `POST /api/properties/:id/images` - Upload property images

#### Bookings
- `GET /api/bookings/traveler` - Get traveler's bookings
- `GET /api/bookings/owner` - Get owner's bookings
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id/accept` - Accept booking (Owner)
- `PUT /api/bookings/:id/cancel` - Cancel booking

#### Favorites
- `GET /api/favorites` - Get user's favorites
- `POST /api/favorites/:propertyId` - Add to favorites
- `DELETE /api/favorites/:propertyId` - Remove from favorites

#### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/profile-picture` - Upload profile picture

### AI Service API Endpoints

- `POST /chat` - Send message to AI assistant
- `GET /health` - Health check
- `GET /` - API information






