import React, { useState } from "react";
import "../../Styles/Expences.css";
import MaintenanceExpense from "./MaintenanceExpense";
import SocietyBills from "./SocietyBills";
import WaterExpense from "./WaterExpense";
import ElectricityExpense from "./ElectricityExpense";
import WaterReadings from "./WaterReadings";

const ExpensesContainer = () => {
  const [activeTab, setActiveTab] = useState("maintenance");

  return (
    <div className="expense-container">
      <h1 className="page-title">Expense Management Dashboard</h1>

      {/* MAIN TABS */}
      <div className="tabs">
        <button
          className={activeTab === "maintenance" ? "tab active" : "tab"}
          onClick={() => setActiveTab("maintenance")}
        >
          🧰 Maintenance
        </button>

        <button
          className={activeTab === "society_bills" ? "tab active" : "tab"}
          onClick={() => setActiveTab("society_bills")}
        >
          🧾 Society Bills
        </button>

        <button
          className={activeTab === "water" ? "tab active" : "tab"}
          onClick={() => setActiveTab("water")}
        >
          💧 Water
        </button>

        <button
          className={activeTab === "electricity" ? "tab active" : "tab"}
          onClick={() => setActiveTab("electricity")}
        >
          ⚡ Electricity
        </button>

        <button
          className={activeTab === "water_readings" ? "tab active" : "tab"}
          onClick={() => setActiveTab("water_readings")}
        >
          📊 Flat Meters
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === "maintenance" && <MaintenanceExpense />}
      {activeTab === "society_bills" && <SocietyBills />}
      {activeTab === "water" && <WaterExpense />}
      {activeTab === "electricity" && <ElectricityExpense />}
      {activeTab === "water_readings" && <WaterReadings />}
    </div>
  );
};

export default ExpensesContainer;
