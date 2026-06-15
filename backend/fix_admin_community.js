require("dotenv").config();
const mongoose = require('mongoose');
const connectDB = require('./db');
const User = require('./Models/users');
const Community = require('./Models/community');

const run = async () => {
    try {
        await connectDB();
        const adminsWithoutCommunity = await User.find({ role: 'admin', community: { $exists: false } });
        console.log(`Found ${adminsWithoutCommunity.length} admins without a community.`);

        for (const admin of adminsWithoutCommunity) {
            // Check if there is already a community where this admin is in the `admins` array
            let community = await Community.findOne({ admins: admin._id });

            if (!community) {
                // Create one
                community = new Community({
                    name: `${admin.name || 'Admin'}'s Community`,
                    address: 'To Be Updated',
                    admins: [admin._id]
                });
                await community.save();
                console.log(`Created new community for ${admin.email}: ${community.name}`);
            }

            admin.community = community._id;
            await admin.save();
            console.log(`Updated admin ${admin.email} with community ${community._id}`);
        }

        console.log("Community fix complete!");
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
};

run();
