const express = require('express');
const { body } = require('express-validator');
const routs = express.Router();
const { registerUser, loginUser, getAllUsers, getUserById, updateUser, deleteUser } = require('../Controllers/usercontrollers');
const { createApartment, getApartments, getApartmentById, updateApartment, deleteApartment, addFlatToApartment } = require('../Controllers/apartments');
const { createFlat, getAllFlats, getFlatsByApartmentId, getFlatById, updateFlat, deleteFlat, updateMeterReading, resetMeterAfterBilling } = require('../Controllers/flatControllers');
const { createResident, getAllResidents, getResidentById, updateResident, deleteResident, verifyResident } = require('../Controllers/residentController');
const { createVendor, getAllVendors, getVendorById, updateVendor, deleteVendor, updateVendorRating } = require('../Controllers/vendorcontroller');
const { createServiceRequest, getAllServiceRequests, getServiceRequestById, assignVendor, updateStatus, deleteServiceRequest, getServiceDetails, markServiceAsRead } = require('../Controllers/serviceRequestcontroller');
const { createTimeline, getAllTimelines, getTimelineById, updateTimeline, deleteTimeline } = require('../Controllers/timelineControllers');
const { createFeedback, getAllFeedbacks, getFeedbackById, updateFeedback, deleteFeedback, getFeedbackForVendor } = require('../Controllers/feedbackControllers');
const { createExpense, getAllExpenses, getExpenseById, updateExpense, deleteExpense } = require('../Controllers/expenseControllers');
const { createNotification, getAllNotifications, getNotificationById, updateNotificationStatus, deleteNotification, getNotificationsByUserId, markAllAsRead, markOneAsRead } = require('../Controllers/notificationControllers');
const { getAllAuditLogs, getAuditLogById, clearAuditLogs } = require('../Controllers/auditlogController');
const { createCommunity, getAllCommunities, getCommunityById, updateCommunity, deleteCommunity, addAdminToCommunity } = require('../Controllers/commuityController');
const { getFlatMaintenance, createMaintenance, getAllMaintenance, getMaintenanceById, updateMaintenance, deleteMaintenance, sendBillNotifications } = require('../Controllers/maintenanceExpenseController');
const { createWaterExpense, getAllWaterExpenses, getWaterExpenseById, updateWaterExpense, deleteWaterExpense, deleteSingleTanker, getApartmentDateWise } = require('../Controllers/waterExpenseController');
const { createElectricityExpense, getAllElectricityExpenses, getElectricityExpenseById, updateElectricityExpense, deleteElectricityExpense } = require('../Controllers/electricityExpenseController');
const { createWaterReading, getWaterReadingsByApartmentAndMonth, getWaterReadingsByFlat, deleteWaterReading, getWaterReadingHistory } = require('../Controllers/waterReadingController');
const { uploadImage } = require('../Controllers/uploadController');
const { recordPayment, getAllPayments, getPendingCollections, deletePayment } = require('../Controllers/paymentController');






// Public routes
routs.post('/registers',
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Valid email required'),
        body('phone').notEmpty().withMessage('Phone is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('role').isIn(['admin', 'subadmin', 'owners', 'resident', 'vendor']).withMessage('Invalid role')
    ], registerUser);
routs.post('/logins',
    [
        body('email').isEmail().withMessage('Valid email required'),
        body('password').notEmpty().withMessage('Password is required')
    ], loginUser);

// Apply authenticate middleware to all routes below this line
const { authenticate } = require('../middilewares/authMiddleware');
routs.use(authenticate);

routs.get('/allusers', getAllUsers);
routs.get('/allusers/:id', getUserById);
routs.put('/updateuser/:id', updateUser);
routs.delete('/deleteuser/:id', deleteUser);



routs.post('/createCommunity', createCommunity);
routs.get('/getAllCommunity', getAllCommunities);
routs.get('/oneCommunity/:id', getCommunityById);
routs.put('/updateCommunity/:id', updateCommunity);
routs.delete('/deleteCommunity/:id', deleteCommunity);
routs.put('/addAdmin/:id', addAdminToCommunity);



// Appartment of the routs //
routs.post('/createappartment', createApartment);
routs.get('/allappartments', getApartments);
routs.get('/oneappartment/:id', getApartmentById);
routs.put('/updateappartment/:id', updateApartment);
routs.delete('/deleteappartment/:id', deleteApartment);
routs.put('/addFlat/:id', addFlatToApartment);



// Flts of the css //
routs.post("/createflat", createFlat);
routs.get("/allflats", getAllFlats);
routs.get("/apartment/:apartmentId", getFlatsByApartmentId);      //  Get Flats by ApartmentId (URL param)
routs.get("/oneflat/:id", getFlatById);                           // Get Flat by ID //
routs.put("/updateflat/:id", updateFlat);                         // Update Flat    //
routs.put("/flat/updateReading/:flatId", updateMeterReading);
routs.put("/flat/resetMeter/:flatId", resetMeterAfterBilling);
routs.delete("/deleteflat/:id", deleteFlat);                      //  Delete Flat   //


// resident of the routs //
routs.post("/createresident", createResident);
routs.get("/allresidents", getAllResidents);
routs.get("/oneresident/:id", getResidentById);
routs.put('/updateResident/:id', updateResident);
routs.delete("/deleteresident/:id", deleteResident);
routs.patch("/residentadmin/:id/verify", verifyResident);             // Verify Resident (Admin action)


// vendors of the routs //
routs.post("/createvendors", createVendor);
routs.get("/allvendors", getAllVendors);
routs.get("/onevendor/:id", getVendorById);
routs.put("/updatevendors/:id", updateVendor);
routs.delete("/deletevendors/:id", deleteVendor);
routs.patch("/vendors/:id/rating", updateVendorRating);



//service request of the routs //
routs.post("/createservice", createServiceRequest);
routs.get("/allservices", getAllServiceRequests);
routs.get("/oneservice/:id", getServiceRequestById);
routs.put("/updateservice/:id/assign", assignVendor);
routs.get("/servicedetails/:id", getServiceDetails);
routs.put("/updatestatus/:id/status", updateStatus);
routs.delete("/deleteservice/:id", deleteServiceRequest);
routs.put("/services/:id/read", markServiceAsRead);


// timeline of the routs //
routs.post('/createtimeline', createTimeline);
routs.get('/alltimelines', getAllTimelines);
routs.get('/onetimeline/:id', getTimelineById);
routs.put('/updatetimeline/:id', updateTimeline);
routs.delete('/deletetimeline/:id', deleteTimeline);


// feedback of the routs //
routs.post("/createfeedback", createFeedback);
routs.get("/allfeedbacks", getAllFeedbacks);
routs.get("/vendor/feedbacks", getFeedbackForVendor)
routs.get("/onefeedback/:id", getFeedbackById);
routs.put("/updatefeedback/:id", updateFeedback);
routs.delete("/deletefeedback/:id", deleteFeedback);


// expenses of the routs //
routs.post('/createexpences', createExpense);
routs.get('/allexpences', getAllExpenses);
routs.get('/oneexpences/:id', getExpenseById);
routs.put('/updateexpences/:id', updateExpense);
routs.delete('/deleteexpences/:id', deleteExpense);


// Maintanance expences //
routs.post('/createMaintenance', createMaintenance);
routs.put('/updateMaintenance/:id', updateMaintenance);
routs.delete('/deleteMaintenance/:id', deleteMaintenance);
routs.get('/allMaintenance', getAllMaintenance);
routs.get('/oneMaintenance/:id', getMaintenanceById);
routs.get('/flat/:flatId', getFlatMaintenance);
routs.post('/maintenance/:id/send-notifications', sendBillNotifications);


// water expences //
routs.post('/createwater', createWaterExpense);                                        // Create Water Expense // 
routs.get('/allwater', getAllWaterExpenses);                                          // (/water/all)     Get All Water Expenses (with optional apartmentId filter)//
routs.get('/onewater/:id', getWaterExpenseById);                                     // Get Single Water Expense By ID //
routs.get('/water/datewise/:apartmentId', getApartmentDateWise);                    // Get Apartment Water Date-wise report //
routs.put('/updatewater/:id', updateWaterExpense);                                  // update ( tankers) water expeces //
routs.delete('/deletewater/:id', deleteWaterExpense);                              // delete entaire water expences recard //
routs.delete('/deleteTanker/:expenseId/:type/:tankerId', deleteSingleTanker);       // delete  single tanker //

// water readings //
routs.post('/createwaterreading', createWaterReading);
routs.get('/waterreadings/apartment/:apartmentId/:month', getWaterReadingsByApartmentAndMonth);
routs.get('/waterreadings/flat/:flatId', getWaterReadingsByFlat);
routs.get('/waterreadings/history/:flatId', getWaterReadingHistory);
routs.delete('/waterreading/:id', deleteWaterReading);
routs.post('/upload-meter-photo', uploadImage);

// electricity expencess //
routs.post('/createelectricity', createElectricityExpense);
routs.get('/allelectricity', getAllElectricityExpenses);
routs.get('/oneelectricity/:id', getElectricityExpenseById);
routs.put('/updateelectricity/:id', updateElectricityExpense);
routs.delete('/deleteelectricity/:id', deleteElectricityExpense);



// notification of the  routs //
routs.post('/createnotification', createNotification);                            //  Create a new notification //
routs.put('/notifications/markAllAsRead', markAllAsRead);
routs.put('/notifications/:id/read', markOneAsRead);
routs.get('/allnotifications', getAllNotifications);                            //  Get all notifications (with optional filters: toUser, toRole, status) //
routs.get('/onenotification/:id', getNotificationById);                        //  Get a single notification by ID  //
routs.get('/specificNotification/:userId', getNotificationsByUserId);
routs.put('/updatenotification/:id/status', updateNotificationStatus);               //  Update notification status (queued, sent, failed)  //
routs.delete('/deletenotification/:id', deleteNotification);




// auditlog of the routs //
routs.get("/auditlogs", getAllAuditLogs);
routs.get("/auditlogs/:id", getAuditLogById);
routs.delete("/auditlogs", clearAuditLogs);             //  (Super Admin only)  //




// Payment collection routes //
routs.post('/recordpayment', recordPayment);
routs.get('/allpayments', getAllPayments);
routs.get('/pendingcollections', getPendingCollections);
routs.delete('/deletepayment/:id', deletePayment);



module.exports = routs;