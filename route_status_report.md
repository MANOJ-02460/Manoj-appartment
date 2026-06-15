# Apartment Management System - Route Audit & Status Report

This document outlines the routing compatibility and integration status between the **React Frontend** and the **Express Backend** of the Apartment Management System. It highlights working routes, structural mismatches, severe formatting bugs, and unused endpoints.

---

## 🚨 Critical Integration Bugs & Missing Routes

The following endpoints called by the frontend are **broken** or **missing** on the backend:

### 1. Missing OTP Authentication Backend Endpoints
* **Frontend Calls:**
  * `POST ${API_URL}/send-otp` (in `frontend/src/Service/Auth.js`)
  * `POST ${API_URL}/verify-otp` (in `frontend/src/Service/Auth.js`)
* **Backend Status:** ❌ **NOT IMPLEMENTED**
* **Impact:** OTP-based login for Residents and Vendors (using their phone number) is completely non-functional. Only email/password auth is supported on the backend.

### 2. Malformed Request URLs (Newline Backtick Bug)
* **Frontend Calls:**
  * `DELETE \n        ${BASE_URL}/deletenotification/${notificationId}` (in `frontend/src/pages/Resident.js`)
  * `GET \n            ${BASE_URL}/onenotification/${selectedResidentForNotifications._id}` (in `frontend/src/pages/Resident.js`)
* **Backend Status:** ❌ **BROKEN**
* **Impact:** The template strings in `Resident.js` contain leading newlines and indent spaces before `${BASE_URL}` inside the backticks. This produces malformed request URLs (e.g., `\n        http://localhost:4000/deletenotification/xyz`), causing either browser network errors or 404s.

### 3. Casing Inconsistency
* **Frontend Call:** `PUT ${BASE_URL}/updateresident/${id}` (in `frontend/src/pages/Resident.js`)
* **Backend Route:** `PUT /updateResident/:id` (in `backend/Routs/routs.js`)
* **Backend Status:** ⚠️ **CASING MISMATCH**
* **Impact:** Express routing is case-insensitive by default, so this might route successfully. However, it is an inconsistency that could fail under strict routing setups (`case sensitive routing` flag enabled).

---

## 🟢 Fully Working & Integrated Routes

These routes are defined in the backend and correctly called by the frontend:

| Frontend Page / Service | Request Method | API Endpoint | Backend Controller Handler | Status |
| :--- | :---: | :--- | :--- | :---: |
| **Auth Service** (`Auth.js`) | `POST` | `/registers` | `registerUser` | **Working** |
| | `POST` | `/logins` | `loginUser` | **Working** |
| **Community Management** (`Community.js`) | `GET` | `/getAllCommunity` | `getAllCommunities` | **Working** |
| | `GET` | `/allusers` | `getAllUsers` | **Working** |
| | `GET` | `/allappartments` | `getApartments` | **Working** |
| | `GET` | `/allresidents` | `getAllResidents` | **Working** |
| | `GET` | `/allflats` | `getAllFlats` | **Working** |
| | `POST` | `/createCommunity` | `createCommunity` | **Working** |
| | `PUT` | `/updateCommunity/:id` | `updateCommunity` | **Working** |
| | `DELETE` | `/deleteCommunity/:id` | `deleteCommunity` | **Working** |
| | `POST` | `/createappartment` | `createApartment` | **Working** |
| | `PUT` | `/updateappartment/:id` | `updateApartment` | **Working** |
| | `DELETE` | `/deleteappartment/:id` | `deleteApartment` | **Working** |
| | `GET` | `/apartment/:apartmentId` | `getFlatsByApartmentId` | **Working** |
| **Dashboard** (`Dashboard.js`) | `GET` | `/allvendors` | `getAllVendors` | **Working** |
| | `GET` | `/allservices` | `getAllServiceRequests` | **Working** |
| **Flat Management** (`Flat.js`) | `POST` | `/createflat` | `createFlat` | **Working** |
| | `PUT` | `/updateflat/:id` | `updateFlat` | **Working** |
| | `DELETE` | `/deleteflat/:id` | `deleteFlat` | **Working** |
| **Resident Management** (`Resident.js`) | `POST` | `/createresident` | `createResident` | **Working** |
| | `DELETE` | `/deleteresident/:id` | `deleteResident` | **Working** |
| | `POST` | `/createservice` | `createServiceRequest` | **Working** |
| | `GET` | `/specificNotification/:userId` | `getNotificationsByUserId` | **Working** |
| | `GET` | `/servicedetails/:id` | `getServiceDetails` | **Working** |
| | `POST` | `/createfeedback` | `createFeedback` | **Working** |
| **Service Requests** (`Servicerequest.js`) | `PUT` | `/services/:id/read` | `markServiceAsRead` | **Working** |
| | `GET` | `/oneservice/:id` | `getServiceRequestById` | **Working** |
| | `PUT` | `/updateservice/:id/assign` | `assignVendor` | **Working** |
| | `PUT` | `/updatestatus/:id/status` | `updateStatus` | **Working** |
| | `DELETE` | `/deleteservice/:id` | `deleteServiceRequest` | **Working** |
| **Vendor Management** (`Vendor.js`) | `POST` | `/createvendors` | `createVendor` | **Working** |
| | `PUT` | `/updatevendors/:id` | `updateVendor` | **Working** |
| | `DELETE` | `/deletevendors/:id` | `deleteVendor` | **Working** |
| **Feedback Management** (`Feedback.js`) | `GET` | `/onefeedback/:id` | `getFeedbackById` | **Working** |
| | `DELETE` | `/deletefeedback/:id` | `deleteFeedback` | **Working** |
| **Expenses & Maintenance** (`Expences.js`) | `GET` | `/allwater` | `getAllWaterExpenses` | **Working** |
| | `PUT` | `/updatewater/:id` | `updateWaterExpense` | **Working** |
| | `POST` | `/createwater` | `createWaterExpense` | **Working** |
| | `DELETE` | `/deleteTanker/:expenseId/:type/:tankerId` | `deleteSingleTanker` | **Working** |
| | `GET` | `/allelectricity` | `getAllElectricityExpenses` | **Working** |
| | `POST` | `/createmaintanance` | `createMaintenance` | **Working** |
| | `GET` | `/allmaintanance` | `getAllMaintenance` | **Working** |
| | `POST` | `/createelectricity` | `createElectricityExpense` | **Working** |
| | `PUT` | `/updateelectricity/:id` | `updateElectricityExpense` | **Working** |
| | `DELETE` | `/deleteelectricity/:id` | `deleteElectricityExpense` | **Working** |
| **Notifications** (`Notification.js`) | `GET` | `/allnotifications` | `getAllNotifications` | **Working** |
| | `POST` | `/createnotification` | `createNotification` | **Working** |
| | `DELETE` | `/deletenotification/:id` | `deleteNotification` | **Working** |
| | `PUT` | `/notifications/:id/read` | `markOneAsRead` | **Working** |

---

## 🟡 Unused / Backend-Only Routes

These routes are defined in the backend routing file (`backend/Routs/routs.js`), but they are **not currently requested by the React frontend**:

### 1. Pages Displaying Hardcoded/Static Data
* **Audit Log Page** (`Auditlog.js`) uses static logs and does not fetch from:
  * `GET /auditlogs` (`getAllAuditLogs`)
  * `GET /auditlogs/:id` (`getAuditLogById`)
  * `DELETE /auditlogs` (`clearAuditLogs`)
* **Timeline Page** (`Timeline.js`) uses static timeline arrays and does not fetch from:
  * `POST /createtimeline` (`createTimeline`)
  * `GET /alltimelines` (`getAllTimelines`)
  * `GET /onetimeline/:id` (`getTimelineById`)
  * `PUT /updatetimeline/:id` (`updateTimeline`)
  * `DELETE /deletetimeline/:id` (`deleteTimeline`)

### 2. General Unused Operations
* **Users:**
  * `GET /allusers/:id` (`getUserById`)
  * `DELETE /deleteuser/:id` (`deleteUser`)
* **Community:**
  * `GET /oneCommunity/:id` (`getCommunityById`)
  * `PUT /addAdmin/:id` (`addAdminToCommunity`)
* **Apartment:**
  * `GET /oneappartment/:id` (`getApartmentById`)
  * `PUT /addFlat/:id` (`addFlatToApartment`)
* **Flats:**
  * `GET /oneflat/:id` (`getFlatById`)
  * `PUT /flat/updateReading/:flatId` (`updateMeterReading`)
  * `PUT /flat/resetMeter/:flatId` (`resetMeterAfterBilling`)
* **Residents:**
  * `GET /oneresident/:id` (`getResidentById`)
  * `PATCH /residentadmin/:id/verify` (`verifyResident`)
* **Vendors:**
  * `GET /onevendor/:id` (`getVendorById`)
  * `PATCH /vendors/:id/rating` (`updateVendorRating`)
* **Feedbacks:**
  * `GET /vendor/feedbacks` (`getFeedbackForVendor`)
* **Expenses:**
  * The generic expense routes are completely unused (the frontend uses `water`, `electricity`, and `maintenance` modules instead):
    * `POST /createexpences` (`createExpense`)
    * `GET /allexpences` (`getAllExpenses`)
    * `GET /oneexpences/:id` (`getExpenseById`)
    * `PUT /updateexpences/:id` (`updateExpense`)
    * `DELETE /deleteexpences/:id` (`deleteExpense`)
* **Water Expenses:**
  * `GET /onewater/:id` (`getWaterExpenseById`)
  * `GET /water/datewise/:apartmentId` (`getApartmentDateWise`)
  * `DELETE /deletewater/:id` (`deleteWaterExpense`)
* **Electricity Expenses:**
  * `GET /oneelectricity/:id` (`getElectricityExpenseById`)
* **Notifications:**
  * `PUT /notifications/markAllAsRead` (`markAllAsRead`)
  * `PUT /updatenotification/:id/status` (`updateNotificationStatus`)
