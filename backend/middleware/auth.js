// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Please login to access this resource' 
    });
};

// Middleware to check if user is a traveler
const isTraveler = (req, res, next) => {
  console.log(req.session)
    if (req.session && req.session.userType === 'traveler') {
        return next();
    }
    return res.status(403).json({ 
        error: 'Forbidden',
        message: 'This resource is only accessible to travelers' 
    });
};

// Middleware to check if user is an owner
const isOwner = (req, res, next) => {
    if (req.session && req.session.userType === 'owner') {
        return next();
    }
    return res.status(403).json({ 
        error: 'Forbidden',
        message: 'This resource is only accessible to property owners' 
    });
};

// Middleware to check if user owns a resource
const isResourceOwner = (resourceOwnerId) => {
    return (req, res, next) => {
        if (req.session.userId === resourceOwnerId) {
            return next();
        }
        return res.status(403).json({ 
            error: 'Forbidden',
            message: 'You do not have permission to access this resource' 
        });
    };
};

module.exports = {
    isAuthenticated,
    isTraveler,
    isOwner,
    isResourceOwner
};