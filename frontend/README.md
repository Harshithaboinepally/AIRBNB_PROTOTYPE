# Airbnb - Frontend

React-based frontend application

##  Quick Start
```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

##  Project Structure
```
src/
├── components/
│   ├── common/
│   │   ├── Header.js
│   │   ├── Header.css
│   │   ├── LoadingSpinner.js
│   │   ├── ErrorMessage.js
│   │   ├── SuccessMessage.js
│   │   └── ProtectedRoute.js
│   └── ChatWidget/
│       ├── ChatWidget.js
│       └── ChatWidget.css
│
├── pages/
│   ├── Home.js / Home.css
│   ├── Login.js / Login.css
│   ├── Signup.js / Signup.css
│   ├── PropertySearch.js / PropertySearch.css
│   ├── PropertyDetails.js / PropertyDetails.css
│   ├── TravelerDashboard.js / TravelerDashboard.css
│   ├── Bookings.js / Bookings.css
│   ├── Favorites.js / Favorites.css
│   ├── Profile.js / Profile.css
│   ├── OwnerDashboard.js / OwnerDashboard.css
│   ├── OwnerProperties.js / OwnerProperties.css
│   └── OwnerBookings.js / OwnerBookings.css
│
├── services/
│   ├── authService.js
│   ├── propertyService.js
│   ├── bookingService.js
│   ├── favoriteService.js
│   ├── userService.js
│   ├── dashboardService.js
│   └── chatService.js
│
├── context/
│   └── AuthContext.js
│
├── utils/
│   ├── priceUtils.js
│   ├── dateUtils.js
│   └── countries.js
│
├── App.js
├── App.css
├── index.js
└── index.css
```

##  Key Features

### Pages

1. **Home** - Landing page with hero section
2. **Property Search** - Search and filter properties
3. **Property Details** - Detailed property view with booking
4. **Login/Signup** - Authentication pages
5. **Traveler Dashboard** - Booking statistics and overview
6. **Bookings** - Manage reservations
7. **Favorites** - Saved properties
8. **Profile** - User profile management
9. **Owner Dashboard** - Property and booking management
10. **Owner Properties** - CRUD for properties
11. **Owner Bookings** - Accept/decline requests

### Components

- **Header** - Navigation with user menu
- **LoadingSpinner** - Loading state indicator
- **ErrorMessage** - Error display component
- **SuccessMessage** - Success notification
- **ProtectedRoute** - Route protection by user type
- **ChatWidget** - AI assistant chatbot

##  Environment Variables

Create `.env` file:
```env
REACT_APP_API_URL=http://localhost:5000
```

## Dependencies
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.x",
  "axios": "^1.x"
}
```

## Available Scripts

- `npm start` - Run development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## Routing
```javascript
/                    - Home page
/login               - Login page
/signup              - Signup page
/properties          - Property search
/properties/:id      - Property details
/dashboard           - Traveler dashboard
/bookings            - Traveler bookings
/favorites           - User favorites
/profile             - User profile
/owner/dashboard     - Owner dashboard
/owner/properties    - Owner properties
/owner/bookings      - Owner bookings
```

