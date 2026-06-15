# Apartment Management System - Requirements Analysis

Based on the provided PDF (`Document Version: 2.0`), here is the comprehensive analysis of the project requirements mapped against our current MongoDB-based implementation.

*(Note: The PDF specifies PostgreSQL, but the actual codebase uses MongoDB. The schemas have been adapted to Mongoose models accordingly.)*

## 🔴 Phase 1: Core Billing & Expenses (P0)

### 1. Expense Management
**Goal:** Track all miscellaneous apartment expenses.
- **Backend APIs:** CRUD operations for expenses (`/createexpences`, `/allexpences`, etc.). ✅ *Implemented*
- **Model:** `Expense` (category, date, vendor, amount, attachment, notes). ✅ *Implemented*
- **Frontend (Admin):** Add/Edit/Delete expenses, filter by category/date. ✅ *Implemented (Society Bills Tab)*

### 2. Water Meter Calculation
**Goal:** Calculate water costs based on tanker deliveries and flat meter readings.
- **Backend APIs:** Submit reading, calculate costs, fetch readings. ✅ *Implemented*
- **Models:** `WaterExpense` (Tankers) & `WaterReading` (Meter readings). ✅ *Implemented*
- **Business Logic:**
  - One reading per flat per month. ✅
  - Previous reading = last month's current reading. ✅
- **Frontend (Admin):** View readings, enter tanker cost, run calculation. ✅ *Implemented*
- **Frontend (Resident Mobile):** Submit reading with photo, view history. 🔲 *Pending Mobile App*

### 3. Maintenance Billing
**Goal:** Generate monthly maintenance bills per flat.
- **Backend APIs:** Generate bill (`/createMaintenance`), fetch bills. ✅ *Implemented*
- **Model:** `MaintenanceExpense` (Acts as the Bill). ✅ *Implemented*
- **Business Logic:**
  - Generate only once per month.
  - Common Maintenance = Total Expenses ÷ Total Flats. ✅
  - Water Bill = (Usage × PerLiterCost) + (Manjeera ÷ Total Flats). ✅ *(Currently Manjeera is combined with Bore, ready for fixed split in future)*
  - Arrears = Previous month unpaid amount. ✅ *Implemented*
- **Frontend (Admin):** Select month, generate bills, view all bills. ✅ *Implemented in `Expences.js`*
- **PDF Generation:** Generate PDF for the bill. ✅ *Implemented (jsPDF on frontend)*

---

## 🟡 Phase 2: Payments & Complaints (P1)

### 4. Payments Collection
**Goal:** Record resident payments against generated bills.
- **Backend APIs:** Record payment (`POST /payments`), fetch pending/history. ✅ *Implemented*
- **Model:** `Payment` (bill_id, amount, mode, transaction_id, paid_date). ✅ *Implemented*
- **Business Logic:**
  - Allow partial payments. ✅ *Implemented*
  - Update bill status to 'partial' or 'paid'. ✅ *Implemented*
  - Unpaid balances carry over to the next month as arrears. ✅ *Implemented*
- **Frontend (Admin):** Record payments, view pending collections, view collection reports. ✅ *Implemented*
- **Frontend (Resident Mobile):** Make payment, view history. 🔲 *Pending Mobile App*

### 5. Complaints Management
**Goal:** Residents can raise complaints; Admins can assign and track them.
- **Backend APIs:** CRUD for complaints, update status. 🔲 *Pending*
- **Model:** `Complaint` (flat_id, category, description, priority, photo_url, status, assigned_to, remark). 🔲 *Pending*
- **Business Logic:**
  - Residents can edit only if status is "open".
  - Admin can update status anytime.
  - Status change triggers notification.
- **Frontend (Admin):** List complaints, update status, assign vendor. 🔲 *Pending*
- **Frontend (Resident Mobile):** Raise complaint, track status. 🔲 *Pending Mobile App*

---

## 🟢 Phase 3: Notifications & Integrations (P2)

### 6. Notifications (Auto-triggered)
**Goal:** Send alerts via WhatsApp Business API and Email (Nodemailer).
- **Triggers:**
  - Bill generated (Admin clicks generate)
  - Payment reminder (Daily cron job)
  - Complaint status change (Admin updates status)
- **Status:** 🔲 *Pending integration*

### 7. Existing Modules Integration
**Goal:** Connect missing frontend pages for existing backend modules.
- **Audit Logs:** Connect frontend to view logs. 🔲 *Pending*
- **Timeline Page:** Connect frontend to view timelines. 🔲 *Pending*

---

## Next Steps Recommendation
Based on this analysis, the immediate priorities should be:
1. **Start Phase 2 (P1): Complaints Management**
   - Create `Complaint` models and APIs.
   - Build a `Complaints` UI in the Admin Dashboard.
2. **Start Phase 3 (P2): Notifications**
   - Integrate Nodemailer/WhatsApp API to send alerts when bills are generated.

