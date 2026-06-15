# 💧 Complete Water Billing API Guide

This guide explains the exact flow to test your newly built **Monthly Water Reading** architecture. This 3-step process completely separates apartment-level tanker costs from flat-level meter readings.

---

## Step 1: Add Apartment Water Expenses (The Tankers)
First, you record the total water tankers the building purchased for the month. This calculates the `ratePerLitre`.

**Request:** `POST http://localhost:4000/createwater`
**Headers:** `Content-Type: application/json`

**Body:**
```json
{
  "apartmentId": "← paste your apartmentId here",
  "createdBy": "← paste your admin user _id here",
  "bore": [
    {
      "date": "2025-08-05",
      "tankerType": "bore",
      "tankers": 2,
      "capacity": 5000,
      "perLiterCost": 0.12
    }
  ],
  "manjeera": [
    {
      "date": "2025-08-10",
      "tankerType": "manjeera",
      "tankers": 1,
      "capacity": 5000,
      "perLiterCost": 0.15
    }
  ]
}
```
**Important Response Value:** Copy the `_id` of this created Water Expense!

---

## Step 2: Add Flat Water Readings (The Meters)
Next, you record the physical meter readings for each flat for the same month.

**Request:** `POST http://localhost:4000/createwaterreading`
**Headers:** `Content-Type: application/json`

**Body:**
```json
{
  "flatId": "← paste your flatId here",
  "apartmentId": "← paste your apartmentId here",
  "month": "2025-08",
  "previousReading": 1200,
  "currentReading": 1350,
  "photoUrl": "https://imgur.com/example_photo.jpg"
}
```
*(The backend will automatically subtract 1350 - 1200 to find the flat used `150` units of water this month).*

---

## Step 3: Generate the Final Maintenance Bill
Now we bring it all together. By passing `"month": "2025-08"` in the maintenance request, the backend will fetch the meter reading from Step 2 and multiply it by the tanker cost from Step 1!

**Request:** `POST http://localhost:4000/createMaintenance`
**Headers:** `Content-Type: application/json`

**Body:**
```json
{
  "apartmentId": "← paste your apartmentId here",
  "month": "2025-08",
  "waterExpenseId": "← paste the _id from Step 1",
  "electricityExpenseId": "← paste your electricityExpense _id here (optional)",
  "common": 5000,
  "security": 10000,
  "createdBy": "← paste your admin user _id here"
}
```

### Expected Result
In the final `flatExpenses` array, you will see exactly how much water cost this flat incurred based on their specific meter reading!
