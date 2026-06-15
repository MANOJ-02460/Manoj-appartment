require("dotenv").config();
const mongoose = require('mongoose');
const connectDB = require('./db');
const User = require('./Models/users');
const bcrypt = require('bcryptjs');

const run = async () => {
    try {
        await connectDB();
        const admins = await User.find({ role: 'admin' });
        
        if (admins.length > 0) {
            console.log("\n==============================");
            console.log("✅ FOUND EXISTING ADMIN USERS");
            console.log("==============================");
            admins.forEach(admin => {
                console.log(`Email: ${admin.email}`);
                console.log(`Name: ${admin.name}`);
                console.log("------------------------------");
            });

            // Reset password for the primary admin account for convenience
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash("admin123", salt);
            await User.findOneAndUpdate({ email: "rajarapumanoj1999@gmail.com" }, { passwordHash });
            
            console.log("\n🔑 I have reset the password for your main account so you can log in easily:");
            console.log("Email: rajarapumanoj1999@gmail.com");
            console.log("Password: admin123");
        } else {
            console.log("\n⚠️ NO ADMIN FOUND. Creating a default admin...");
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash("admin123", salt);
            
            const newAdmin = new User({
                name: "System Admin",
                email: "admin@apartment.com",
                phone: "1234567890",
                passwordHash: passwordHash,
                role: "admin"
            });
            await newAdmin.save();
            
            console.log("✅ Default admin created successfully!");
            console.log("Email: admin@apartment.com");
            console.log("Password: admin123");
        }
    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit(0);
    }
};

run();
