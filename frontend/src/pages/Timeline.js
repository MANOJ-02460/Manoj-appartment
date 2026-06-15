import React from "react";
import '../Styles/Timeline.css'


const Timeline = () => {
  const timelineData = [
    {
      requestId: "#SR001",
      resident: "Ravi Kumar",
      updates: [
        { time: "10:00 AM", event: "Request Created", user: "Ravi Kumar" },
        { time: "10:30 AM", event: "Assigned to Vendor", user: "Ramesh" },
        { time: "12:00 PM", event: "Work Completed", user: "Ramesh" },
      ],
    },
    {
      requestId: "#SR002",
      resident: "Anjali Mehta",
      updates: [
        { time: "09:15 AM", event: "Request Created", user: "Anjali Mehta" },
        { time: "09:45 AM", event: "Assigned to Vendor", user: "Suresh" },
      ],
    },
  ];

  return (
    <div className="timeline-container">
      <h1 className="page-title">Service Request Timeline</h1>

      <table className="timeline-table">
        <thead>
          <tr>
            <th>Request ID</th>
            <th>Resident</th>
            <th>Activity Timeline</th>
          </tr>
        </thead>
        <tbody>
          {timelineData.map((t, index) => (
            <tr key={index}>
              <td>{t.requestId}</td>
              <td>{t.resident}</td>
              <td>
                <ul className="timeline-list">
                  {t.updates.map((u, i) => (
                    <li key={i} className="timeline-item">
                      <span className="timeline-time">{u.time}</span>
                      <span className="timeline-event">{u.event}</span>
                      <span className="timeline-user">({u.user})</span>
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Timeline;
