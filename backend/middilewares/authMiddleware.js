const jwt = require('jsonwebtoken');
const User = require('../Models/users');



//  Authenticate JWT Token //
exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ 
      success: false, message: 'No token provided' 
    });

    const token = authHeader.split(' ')[1];                            // Bearer <token>
    if (!token) return res.status(401).json({
       success: false, message: 'Unauthorized: Token missing' 
      });

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-passwordHash');
    if (!req.user) return res.status(401).json({
       success: false, message: 'User not found' 
      });

    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({
       success: false, message: 'Invalid or expired token' 
      });
  }
};




// Role-based Authorization //
exports.authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({
       success: false, message: 'Unauthorized' 
      });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
         success: false, message: 'Forbidden: Access denied' 
        });
    }
    next();
  };
};
