const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI)
        console.log (`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error:${error.message}`);
        process.exit(1);
        
    }
};

module.exports = connectDB;








// const mongoose = require('mongoose');

// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI, {
//       serverSelectionTimeoutMS: 5000
//     });
//     console.log("MongoDB Connected");
//   } catch (error) {
//     console.error("❌ DB Connection Error:", error.message);
//     // Do NOT exit on Render
//   }
// };

// module.exports = connectDB;
