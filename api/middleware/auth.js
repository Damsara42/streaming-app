const jwt = require('jsonwebtoken');

// A secure secret key. In production, this should be in an environment variable!
const JWT_SECRET = 'your-super-secret-key-for-jwt-12345';
const ADMIN_SECRET = 'your-super-secure-admin-key-67890';

// Middleware to verify a standard user's JWT
function userAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided, authorization denied.' });
    }

    const token = authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
        return res.status(401).json({ error: 'Token malformed, authorization denied.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Token is not valid.' });
    }
}

// Middleware to verify an admin's JWT
function adminAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided, authorization denied.' });
    }

    const token = authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
        return res.status(401).json({ error: 'Token malformed, authorization denied.' });
    }

    try {
        // Admins use a different secret to ensure they can't be impersonated by users
        const decoded = jwt.verify(token, ADMIN_SECRET);
        
        // We also check for an 'isAdmin' flag in the token payload
        if (!decoded.user || !decoded.user.isAdmin) {
             return res.status(403).json({ error: 'Access denied. Not an admin.' });
        }
        
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Token is not valid.' });
    }
}

module.exports = {
    userAuth,
    adminAuth,
    JWT_SECRET,
    ADMIN_SECRET
};