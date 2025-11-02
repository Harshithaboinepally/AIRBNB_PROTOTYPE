# Airbnb Backend 
##  Quick Start
```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Start development server
npm run dev

# Start production server
npm start
```

##  Project Structure
```
backend/
├── server.js          # Main application file
├── .env               # Environment variables
├── package.json       # Dependencies
└── uploads/           # File upload directory
    ├── properties/    # Property images
    └── profiles/      # Profile pictures
```

##  Environment Variables
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=airbnb_db
JWT_SECRET=your_secret_key_here
```


## API Routes

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (Protected)

### Properties
- `GET /api/properties` - Get all properties (with filters)
- `GET /api/properties/:id` - Get property by ID
- `GET /api/properties/owner/my-properties` - Get owner's properties
- `POST /api/properties` - Create property (Owner)
- `PUT /api/properties/:id` - Update property (Owner)
- `DELETE /api/properties/:id` - Delete property (Owner)
- `POST /api/properties/:id/images` - Upload images (Owner)

### Bookings
- `GET /api/bookings/traveler` - Get traveler's bookings
- `GET /api/bookings/owner` - Get owner's bookings
- `POST /api/bookings` - Create booking (Traveler)
- `PUT /api/bookings/:id/accept` - Accept booking (Owner)
- `PUT /api/bookings/:id/cancel` - Cancel booking

### Favorites
- `GET /api/favorites` - Get user's favorites
- `GET /api/favorites/check/:propertyId` - Check if favorited
- `POST /api/favorites/:propertyId` - Add to favorites
- `DELETE /api/favorites/:propertyId` - Remove from favorites

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/profile-picture` - Upload profile picture

### Dashboard
- `GET /api/dashboard/traveler` - Traveler dashboard data
- `GET /api/dashboard/owner` - Owner dashboard data



## File Uploads

Uses Multer for file handling.

**Accepted Formats:**
- Images: JPG, JPEG, PNG, GIF, WEBP
- Max Size: 5MB per file
- Max Files: 10 images per property


##  Dependencies
```json
{
  "express": "^4.18.x",
  "mysql2": "^3.6.x",
  "bcryptjs": "^2.4.x",
  "jsonwebtoken": "^9.0.x",
  "dotenv": "^16.3.x",
  "cors": "^2.8.x",
  "multer": "^1.4.x"
}
```

npm test
