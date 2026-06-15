const multer = require('multer');

// Keep files in memory so we can pipe buffer to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = upload;   // export the multer *instance*
