require("dotenv").config();
const mongoose = require('mongoose');
const connectDB = require('./db');
const User = require('./Models/users');

const run = async () => {
    try {
        await connectDB();
        
        const updatedAdmin = await User.findOneAndUpdate(
            { email: "rajarapumanoj1999@gmail.com" }, 
            { email: "admin@apartment.com" },
            { new: true }
        );
        
        if (updatedAdmin) {
            console.log("\n✅ Successfully updated admin email in the database!");
            console.log("Old Email: rajarapumanoj1999@gmail.com");
            console.log(`New Email: ${updatedAdmin.email}`);
            console.log("Password remains: admin123");
        } else {
            console.log("\n⚠️ Admin not found, or email was already updated.");
        }
    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit(0);
    }
};

run();
