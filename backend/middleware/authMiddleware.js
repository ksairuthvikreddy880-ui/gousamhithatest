const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    try {
        // Try to get token from cookies first (HTTP-only)
        let token = req.cookies.auth_token;

        // If not in cookies, try Authorization header (for API clients)
        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7); // Remove 'Bearer ' prefix
            }
        }

        if (!token) {
            return res.status(401).json({ 
                success: false,
                error: 'No token provided' 
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user to request
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false,
                error: 'Invalid token' 
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                error: 'Token expired' 
            });
        }
        return res.status(500).json({ 
            success: false,
            error: 'Authentication failed' 
        });
    }
};

// Middleware to check if user is admin
const verifyAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false,
            error: 'Access denied. Admin only.' 
        });
    }
    next();
};

module.exports = {
    verifyToken,
    verifyAdmin
};
