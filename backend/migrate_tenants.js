require("dotenv").config();
const mongoose = require('mongoose');
const connectDB = require('./db');

// Models
const Community = require('./Models/community');
const User = require('./Models/users');
const Apartment = require('./Models/apartments');
const Flat = require('./Models/flat');
const Resident = require('./Models/resident');
const Expense = require('./Models/expense');
const MaintenanceExpense = require('./Models/MaintenanceExpense');
const WaterExpense = require('./Models/WaterExpense');
const ElectricityExpense = require('./Models/ElectricityExpense');
const WaterReading = require('./Models/WaterReading');
const ServiceRequest = require('./Models/serviceRequest');
const Vendor = require('./Models/vendor');
const Payment = require('./Models/Payment');

const run = async () => {
    try {
        await connectDB();
        console.log("Starting Tenant Migration...");

        // 1. Process all communities
        const communities = await Community.find();
        console.log(`Found ${communities.length} communities.`);

        for (const community of communities) {
            console.log(`Processing Community: ${community.name} (${community._id})`);

            // A. Update Admins (and any other users they created)
            // For now, let's just assign all admins of this community to it.
            for (const adminId of community.admins) {
                await User.findByIdAndUpdate(adminId, { community: community._id });
                
                // Also update any Vendors created by this admin
                await Vendor.updateMany(
                    { createdBy: adminId, communityId: { $exists: false } }, 
                    { communityId: community._id }
                );
            }

            // B. Find Apartments in this community
            const apartments = await Apartment.find({ community: community._id });
            for (const apt of apartments) {
                const aptId = apt._id;

                // Update Flats
                await Flat.updateMany({ apartment: aptId }, { community: community._id });
                
                // Update Residents
                await Resident.updateMany({ apartment: aptId }, { community: community._id });
                
                // Update Expenses
                await Expense.updateMany({ apartmentId: aptId }, { communityId: community._id });
                await MaintenanceExpense.updateMany({ apartmentId: aptId }, { communityId: community._id });
                await WaterExpense.updateMany({ apartmentId: aptId }, { communityId: community._id });
                await ElectricityExpense.updateMany({ apartmentId: aptId }, { communityId: community._id });
                await WaterReading.updateMany({ apartmentId: aptId }, { communityId: community._id });
                await ServiceRequest.updateMany({ apartmentId: aptId }, { communityId: community._id });
                await Payment.updateMany({ apartmentId: aptId }, { communityId: community._id });
            }
        }

        // 2. What if some users were created by an admin but are not admins themselves?
        // Let's find all subadmins, owners, residents, and assign them based on their flat/resident record
        const allResidents = await Resident.find().populate('apartment');
        for (const res of allResidents) {
            if (res.apartment && res.apartment.community) {
                await User.findByIdAndUpdate(res.user, { community: res.apartment.community });
            }
        }

        console.log("Migration Complete! All existing records now have a communityId.");
    } catch (error) {
        console.error("Migration Failed:", error);
    } finally {
        process.exit(0);
    }
};

run();
