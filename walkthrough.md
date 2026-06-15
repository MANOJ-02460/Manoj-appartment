# Apartment Management System — Full Workflow Analysis

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│                    localhost:3000                               │
│  Login → Dashboard → Community → Flats → Residents →           │
│  Expenses → Vendors → Service Requests → Notifications          │
└──────────────────────────┬──────────────────────────────────────┘
                           │  HTTP / REST API calls
                           │  BASE_URL = http://localhost:4000
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js + Express)                  │
│                       localhost:4000                            │
│  index.js → routs.js → Controllers → Models                    │
│  + Socket.IO (real-time notifications)                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │  Mongoose ODM
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              MongoDB Atlas (Cloud Database)                     │
│       cluster0.6p6juik.mongodb.net / Apartment DB              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 👥 User Roles

| Role | Access |
|---|---|
| `admin` | Full access — create apartments, manage flats, generate bills |
| `subadmin` | Apartment-level admin — manage residents, expenses |
| `owners` | Can view their flat info and bills |
| `resident` | Can view bills, raise service requests |
| `vendor` | Handles service requests assigned to them |

---

## 📦 Backend Module Map

### 15 Models  →  15 Controllers  →  184 Routes

| Module | Model | Key Routes |
|---|---|---|
| Users | `users.js` | `/registers`, `/logins`, `/allusers` |
| Community | `community.js` | `/createCommunity`, `/getAllCommunity` |
| Apartments | `apartments.js` | `/createappartment`, `/allappartments` |
| Flats | `flat.js` | `/createflat`, `/allflats`, `/apartment/:id` |
| Residents | `resident.js` | `/createresident`, `/allresidents` |
| Vendors | `vendor.js` | `/createvendors`, `/allvendors` |
| Service Requests | `serviceRequest.js` | `/createservice`, `/updatestatus/:id/status` |
| **General Expenses** | `expense.js` | `/createexpences`, `/allexpences` |
| **Water Expenses** | `WaterExpense.js` | `/createwater`, `/allwater` |
| **Electricity Expenses** | `ElectricityExpense.js` | `/createelectricity`, `/allelectricity` |
| **Maintenance Bills** | `MaintenanceExpense.js` | `/createmaintanance`, `/allmaintanance` |
| Notifications | `notifications.js` | `/createnotification`, `/allnotifications` |
| Feedback | `feedback.js` | `/createfeedback`, `/allfeedbacks` |
| Timeline | `timeline.js` | `/createtimeline`, `/alltimelines` |
| Audit Logs | `auditlog.js` | `/auditlogs` |

---

## 🔄 Complete Workflow — Step by Step

### Phase 1: Setup (One Time)

```
1. Admin Registers
   POST /registers → User created (role: admin)
        ↓
2. Admin Creates Community
   POST /createCommunity → Community created
        ↓
3. Admin Creates Apartment under Community
   POST /createappartment → Apartment created (linked to Community)
        ↓
4. Admin Creates Flats inside Apartment
   POST /createflat → Flat created (linked to Apartment)
        ↓
5. Admin Creates Residents for each Flat
   POST /createresident → Resident created (linked to Flat)
```

---

### Phase 2: Monthly Expense Recording (Every Month)

```
Admin Records Water Expenses
  POST /createwater
  → Bore tankers + Manjeera tankers entered
  → WaterExpense.totalCost, totalLitres auto-calculated
        ↓
Admin Records Electricity Expenses
  POST /createelectricity
  → Meter readings entered (previousReading, currentReading, ratePerUnit)
  → Pre-save hook auto-calculates: usage, cost per meter, totalUsage, totalCost
        ↓
Admin Records General/Misc Expenses
  POST /createexpences
  → Category (maintenance/misc), vendor, amount, date
        ↓
Admin Generates Monthly Maintenance Bill
  POST /createmaintanance
  → Links waterExpenseId + electricityExpenseId
  → Sets common charges + security charges
  → Divides total among all flats
  → Creates per-flat invoices (FlatExpense[])
```

---

### Phase 3: Resident Flow

```
Resident Logs In
        ↓
Resident Views Their Monthly Bill
  GET /flat/:flatId → sees their FlatExpense record
        ↓
Resident Raises Service Request (optional)
  POST /createservice → service request created
        ↓
Admin Assigns Vendor
  PUT /updateservice/:id/assign → vendor assigned
        ↓
Vendor Completes Work
  PUT /updatestatus/:id/status → status = "completed"
        ↓
Resident Gives Feedback
  POST /createfeedback → feedback recorded
```

---

### Phase 4: Notifications (Real-time)

```
Any Action (bill generated, service assigned, etc.)
        ↓
Backend emits Socket.IO event
        ↓
Frontend receives notification instantly (no page refresh)
        ↓
GET /specificNotification/:userId → shows unread count
PUT /notifications/markAllAsRead → clears all
```

---

## 💰 Expense Management Deep Dive

This is the most complex part of the system:

```
                    Monthly Billing Breakdown
                    ─────────────────────────
Water Cost          = totalCost from WaterExpense
                      (bore tankers + manjeera tankers)
                      
Electricity Cost    = totalCost from ElectricityExpense
                      (sum of all meter readings × rate)
                      
Common Charges      = Fixed amount (entered by admin)
                      e.g., housekeeping, gardening

Security Charges    = Fixed amount (entered by admin)

Misc Expenses       = sum of Expense records for the month
                      (⚠️ currently NOT linked — planned)
                      
Arrears             = previous unpaid balance per flat
                      
Buffer              = extra reserve amount

─────────────────────────────────────────────────────
Per Flat Total = (Water + Electricity + Common + Security) / totalFlats
              + Arrears + Buffer
```

---

## 🌐 Frontend Pages

| Page | Role | Purpose |
|---|---|---|
| `Login.js` | All roles | Login with email + password |
| `Register.js` | All roles | Create account |
| `Dashboard.js` | Admin | Summary cards: communities, flats, residents, vendors |
| `Community.js` | Admin | Manage communities and apartments |
| `Flat.js` | Admin | Manage flats and meter readings |
| `Resident.js` | Admin | Manage residents |
| `Expences.js` | Admin | Water, Electricity, Maintenance tabs |
| `Vendor.js` | Admin | Manage vendors |
| `Servicerequest.js` | Admin/Vendor | Handle maintenance requests |
| `Notification.js` | All | View and manage notifications |
| `Feedback.js` | Admin | View resident/vendor feedback |
| `Auditlog.js` | Admin | View system action logs |

---

## ✅ What Is Working

| Feature | Status |
|---|---|
| User registration & login | ✅ Working |
| JWT Auth token generation | ✅ Working |
| Socket.IO real-time setup | ✅ Working |
| Community CRUD | ✅ Working |
| Apartment CRUD | ✅ Working |
| Flat CRUD + meter reading | ✅ Working |
| Resident management | ✅ Working |
| Vendor management | ✅ Working |
| Service requests | ✅ Working |
| Water expense tracking | ✅ Working |
| **Electricity expense** | ✅ Fixed & improved (pre-save hook) |
| General expense ledger | ✅ Model + controller refactored |
| Maintenance billing | ⚠️ Works but not connected to misc expenses |
| Notifications | ✅ Working |
| Feedback | ✅ Working |

---

## 🔴 What Is Still Pending

| Feature | Priority |
|---|---|
| Connect misc `Expense` records to maintenance billing | 🔴 High |
| Add pre-save hook to `WaterExpense` model | 🔴 High |
| Add `billingMonth` field to `MaintenanceExpense` | 🔴 High |
| General Expenses UI tab in frontend (`Expences.js`) | 🟡 Medium |
| Role-based route protection (authMiddleware) | 🟡 Medium |
| OTP login implementation | 🟢 Low |

---

## 🗺️ Data Creation Order (for fresh database)

```
1. Register Admin User     → POST /registers
2. Create Community        → POST /createCommunity
3. Create Apartment        → POST /createappartment
4. Create Flats (A-101 etc)→ POST /createflat
5. Create Residents        → POST /createresident
6. Record Water Expense    → POST /createwater
7. Record Electricity      → POST /createelectricity
8. Generate Monthly Bill   → POST /createmaintanance
```
