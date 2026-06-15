require("dotenv").config();
const mongoose = require('mongoose');
const connectDB = require('./db');
const User = require('./Models/users');
const Community = require('./Models/community');

const run = async () => {
    try {
        await connectDB();
        const admins = await User.find({ role: 'admin' }).populate('community');
        console.log("=== Admins in System ===");
        admins.forEach(admin => {
            console.log(`Email: ${admin.email}`);
            console.log(`Community ID: ${admin.community ? admin.community._id : 'UNDEFINED'}`);
            if (admin.community) {
                console.log(`Community Name: ${admin.community.name}`);
            }
            console.log("------------------------");
        });

        const communities = await Community.find();
        console.log(`Total Communities in DB: ${communities.length}`);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
};

run();
