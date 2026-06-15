import React from "react";


const AuditLog = () => {
  const logs = [
    { id: "#AL001", user: "Ravi Kumar", role: "Admin", action: "Added new Vendor", module: "Vendor", date: "2025-10-05 11:30 AM" },
    { id: "#AL002", user: "Priya Sharma", role: "Sub Admin", action: "Updated Resident Info", module: "Resident", date: "2025-10-04 03:15 PM" },
    { id: "#AL003", user: "Vijay Rao", role: "Admin", action: "Deleted Expense Record", module: "Expense", date: "2025-10-03 10:20 AM" },
    { id: "#AL004", user: "System", role: "Auto", action: "Sent Notification to all Residents", module: "Notification", date: "2025-10-02 09:00 AM" },
  ];

  return (
    <div className="auditlog-container">
      <h1 className="page-title">Audit Log Management</h1>

      <table className="auditlog-table">
        <thead>
          <tr>
            <th>Log ID</th>
            <th>User</th>
            <th>Role</th>
            <th>Action</th>
            <th>Module</th>
            <th>Date & Time</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, index) => (
            <tr key={index}>
              <td>{log.id}</td>
              <td>{log.user}</td>
              <td>{log.role}</td>
              <td>{log.action}</td>
              <td>{log.module}</td>
              <td>{log.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AuditLog;
