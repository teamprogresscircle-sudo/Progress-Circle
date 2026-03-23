const jwt = require('jsonwebtoken');
const User = require('../models/User');
const GlobalSettings = require('../models/GlobalSettings');

const maintenanceMiddleware = async (req, res, next) => {
    try {
        const settings = await GlobalSettings.getSettings();
        
        if (settings.maintenanceMode) {
            // Check for admin token even if 'protect' hasn't run yet
            let isAdmin = false;
            
            if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
                try {
                    const token = req.headers.authorization.split(' ')[1];
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    const user = await User.findById(decoded.id);
                    if (user && user.isAdmin) isAdmin = true;
                } catch (e) {
                    // Invalid token, treat as non-admin
                }
            }

            if (isAdmin) return next();

            // Allow essential endpoints: settings/stats (admin only usually), login, getMe, and public pricing
            const publicGetRoutes = ['/api/auth/me', '/api/subscription/pricing'];
            if (req.method === 'GET' && publicGetRoutes.some(route => req.path.startsWith(route))) {
                return next();
            }

            if (req.path.startsWith('/api/admin') || req.path.startsWith('/api/auth/login')) {
                return next();
            }

            return res.status(503).json({ 
                success: false, 
                message: settings.broadcastMessage || 'System is currently undergoing a neural upgrade. Please stand by.',
                maintenance: true
            });
        }
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = maintenanceMiddleware;
