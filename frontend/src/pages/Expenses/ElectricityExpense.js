import React, { useState, useEffect } from "react";
import "../../Styles/Expences.css";
import { BASE_URL } from "../../Components/Baseurl";

const ElectricityExpense = () => {
  const [electricityExpenses, setElectricityExpenses] = useState([]);
  const [users, setUsers] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [expandedElectricity, setExpandedElectricity] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    apartmentId: "",
    billingMonth: "",
    createdBy: "",
    readings: [
      { meterId: "", block: "", previousReading: "", currentReading: "", ratePerUnit: "", date: new Date().toISOString().split("T")[0] }
    ]
  });

  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${BASE_URL}/allusers`);
      if (!response.ok) return;
      const data = await response.json();
      setUsers(data.users || data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchElectricity = async () => {
    try {
      const res = await fetch(`${BASE_URL}/allelectricity`);
      const data = await res.json();
      setElectricityExpenses(data.records || data.data || data.electricityExpenses || (Array.isArray(data) ? data : []));
    } catch (err) {
      console.error("Error fetching electricity:", err);
      setElectricityExpenses([]);
    }
  };

  const fetchApartments = async () => {
    try {
      const res = await fetch(`${BASE_URL}/allappartments`);
      const data = await res.json();
      setApartments(data.appartments || data.data || []);
    } catch (err) {
      console.error("Error fetching apartments:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchElectricity();
    fetchApartments();
  }, []);

  const handleReadingChange = (index, field, value) => {
    const updated = [...form.readings];
    updated[index][field] = value;

    // Auto-fill previous reading, block, and rate when a meterId is entered
    if (field === "meterId" && value.trim() !== "") {
      let latestReading = null;
      let latestDate = 0;

      electricityExpenses.forEach(exp => {
        exp.readings?.forEach(r => {
          if (r.meterId === value.trim()) {
            const rDate = new Date(r.date || exp.createdAt || 0).getTime();
            if (rDate > latestDate) {
              latestDate = rDate;
              latestReading = r;
            }
          }
        });
      });

      if (latestReading) {
        // Only override previousReading if the user hasn't manually typed something yet (or if it's 0/empty)
        if (!updated[index].previousReading || updated[index].previousReading == 0) {
          updated[index].previousReading = latestReading.currentReading;
        }
        if (!updated[index].block) updated[index].block = latestReading.block;
        if (!updated[index].ratePerUnit) updated[index].ratePerUnit = latestReading.ratePerUnit;
      }
    }

    setForm({ ...form, readings: updated });
  };

  const addReadingRow = () => {
    setForm({
      ...form,
      readings: [
        ...form.readings,
        { meterId: "", block: "", previousReading: "", currentReading: "", ratePerUnit: "", date: new Date().toISOString().split("T")[0] }
      ]
    });
  };

  const deleteReadingRow = (index) => {
    if (form.readings.length === 1) return alert("At least one reading is required");
    const updated = form.readings.filter((_, i) => i !== index);
    setForm({ ...form, readings: updated });
  };

  const openAddModal = () => {
    setEditMode(false);
    setEditId(null);
    setForm({
      apartmentId: "",
      billingMonth: "",
      createdBy: "",
      readings: [{ meterId: "", block: "", previousReading: "", currentReading: "", ratePerUnit: "", date: new Date().toISOString().split("T")[0] }]
    });
    setShowModal(true);
  };

  const openEditModal = (exp) => {
    setEditMode(true);
    setEditId(exp._id);
    setForm({
      apartmentId: exp.apartmentId?._id || exp.apartmentId,
      billingMonth: exp.billingMonth || "",
      createdBy: exp.createdBy?._id || exp.createdBy,
      readings: exp.readings.map((r) => ({
        _id: r._id,
        meterId: r.meterId,
        block: r.block,
        previousReading: r.previousReading || 0,
        currentReading: r.currentReading || 0,
        ratePerUnit: r.ratePerUnit || 0,
        date: r.date ? r.date.split("T")[0] : new Date().toISOString().split("T")[0]
      }))
    });
    setShowModal(true);
  };

  const saveElectricity = async () => {
    if (!form.apartmentId || !form.billingMonth) {
      return alert("Please select an Apartment and a Billing Month.");
    }
    
    for (let r of form.readings) {
      if (!r.meterId || !r.block || !r.currentReading || !r.date) {
        return alert("Please fill all required reading fields (Meter ID, Block, Current Reading, Date) before submitting.");
      }
    }

    try {
      const url = editMode ? `${BASE_URL}/updateelectricity/${editId}` : `${BASE_URL}/createelectricity`;
      const method = editMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error(`Failed to ${editMode ? "update" : "create"} electricity expense`);

      fetchElectricity();
      setShowModal(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteElectricity = async (id) => {
    if (!window.confirm("Are you sure you want to delete this electricity record?")) return;
    try {
      const res = await fetch(`${BASE_URL}/deleteelectricity/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete record.");
      fetchElectricity();
    } catch (error) {
      alert(error.message);
    }
  };

  const paginatedData = electricityExpenses.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(electricityExpenses.length / itemsPerPage);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#1e40af', margin: 0 }}>⚡ Electricity Management</h2>
        <button
          style={{ padding: '10px 15px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          onClick={openAddModal}
        >
          ➕ Add Electricity Record
        </button>
      </div>

      <div style={{ background: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Apartment</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Billing Month</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Total Usage</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Total Cost</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No electricity records found.</td></tr>
            ) : (
              paginatedData.map((exp) => {
                const isExpanded = expandedElectricity === exp._id;
                return (
                  <React.Fragment key={exp._id}>
                    <tr style={{ borderBottom: '1px solid #f1f5f9', background: isExpanded ? '#f8fafc' : 'white' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '500', color: '#1e293b' }}>{exp.apartmentId?.name || "Unknown"}</td>
                      <td style={{ padding: '12px 16px' }}>{exp.billingMonth || exp.readings?.[0]?.date?.substring(0, 7) || "-"}</td>
                      <td style={{ padding: '12px 16px' }}>{exp.totalUsage || 0} Units</td>
                      <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#0f172a' }}>₹{(exp.totalCost || 0).toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                        <button
                          style={{ padding: '6px 12px', background: isExpanded ? '#e2e8f0' : '#f1f5f9', color: '#0f172a', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                          onClick={() => setExpandedElectricity(isExpanded ? null : exp._id)}
                        >
                          {isExpanded ? 'Hide Details' : 'View Details'}
                        </button>
                        <button
                          style={{ padding: '6px 12px', background: 'white', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                          onClick={() => openEditModal(exp)}
                        >
                          Edit
                        </button>
                        <button
                          style={{ padding: '6px 12px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                          onClick={() => deleteElectricity(exp._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr style={{ background: '#f8fafc' }}>
                        <td colSpan="5" style={{ padding: '20px', borderBottom: '2px solid #e2e8f0' }}>
                          <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                            <h4 style={{ margin: '0 0 15px 0', color: '#334155' }}>Meter Readings</h4>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                              <thead style={{ background: '#f1f5f9' }}>
                                <tr>
                                  <th style={{ padding: '8px', textAlign: 'left' }}>Meter ID</th>
                                  <th style={{ padding: '8px', textAlign: 'left' }}>Block</th>
                                  <th style={{ padding: '8px', textAlign: 'left' }}>Prev Reading</th>
                                  <th style={{ padding: '8px', textAlign: 'left' }}>Curr Reading</th>
                                  <th style={{ padding: '8px', textAlign: 'left' }}>Usage</th>
                                  <th style={{ padding: '8px', textAlign: 'left' }}>Rate/Unit</th>
                                  <th style={{ padding: '8px', textAlign: 'left' }}>Cost</th>
                                </tr>
                              </thead>
                              <tbody>
                                {exp.readings.map((reading, i) => (
                                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '8px', fontWeight: '500' }}>{reading.meterId}</td>
                                    <td style={{ padding: '8px' }}>{reading.block}</td>
                                    <td style={{ padding: '8px', color: '#64748b' }}>{reading.previousReading}</td>
                                    <td style={{ padding: '8px', color: '#0f172a' }}>{reading.currentReading}</td>
                                    <td style={{ padding: '8px', fontWeight: '500', color: '#0369a1' }}>{reading.usage || (reading.currentReading - reading.previousReading)}</td>
                                    <td style={{ padding: '8px' }}>₹{reading.ratePerUnit}</td>
                                    <td style={{ padding: '8px', fontWeight: 'bold' }}>₹{(reading.cost || 0).toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '8px' }}>
          <button
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            disabled={page === 1}
            style={{ padding: "8px 16px", border: "1px solid #cbd5e1", background: page === 1 ? "#f1f5f9" : "white", color: page === 1 ? "#94a3b8" : "#334155", borderRadius: "6px", cursor: page === 1 ? "not-allowed" : "pointer" }}
          >
            Prev
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              style={{ padding: "8px 16px", border: page === i + 1 ? "none" : "1px solid #cbd5e1", background: page === i + 1 ? "#3b82f6" : "white", color: page === i + 1 ? "white" : "#334155", borderRadius: "6px", cursor: "pointer", fontWeight: page === i + 1 ? "bold" : "normal" }}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            style={{ padding: "8px 16px", border: "1px solid #cbd5e1", background: page === totalPages ? "#f1f5f9" : "white", color: page === totalPages ? "#94a3b8" : "#334155", borderRadius: "6px", cursor: page === totalPages ? "not-allowed" : "pointer" }}
          >
            Next
          </button>
        </div>
      )}

      {showModal && (
        <div className="popup-overlay" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '90%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1e40af', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              ⚡ {editMode ? "Edit Electricity Bill" : "Add Electricity Bill"}
            </h3>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', fontSize: '14px', fontWeight: '500', color: '#475569', flex: 1 }}>
                Apartment
                <select
                  style={{ padding: '10px', marginTop: '6px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  value={form.apartmentId}
                  onChange={(e) => setForm({ ...form, apartmentId: e.target.value })}
                  disabled={editMode}
                >
                  <option value="">Select Apartment</option>
                  {apartments.map((apt) => (
                    <option key={apt._id} value={apt._id}>{apt.name}</option>
                  ))}
                </select>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', fontSize: '14px', fontWeight: '500', color: '#475569', flex: 1 }}>
                Billing Month
                <input
                  type="month"
                  style={{ padding: '10px', marginTop: '6px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  value={form.billingMonth}
                  onChange={(e) => setForm({ ...form, billingMonth: e.target.value })}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', fontSize: '14px', fontWeight: '500', color: '#475569', flex: 1 }}>
                Created By
                <select
                  style={{ padding: '10px', marginTop: '6px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  value={form.createdBy}
                  onChange={(e) => setForm({ ...form, createdBy: e.target.value })}
                >
                  <option value="">Select User</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>
              </label>
            </div>

            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '20px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#334155' }}>Meter Readings</h4>
              {form.readings.map((row, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 0.5fr 1fr 1fr 0.8fr 1.2fr auto', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
                  <input type="text" placeholder="Meter ID" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} value={row.meterId} onChange={(e) => handleReadingChange(index, "meterId", e.target.value)} />
                  <input type="text" placeholder="Block" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} value={row.block} onChange={(e) => handleReadingChange(index, "block", e.target.value)} />
                  <input type="number" placeholder="Prev Read" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} value={row.previousReading} onChange={(e) => handleReadingChange(index, "previousReading", e.target.value)} />
                  <input type="number" placeholder="Curr Read" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} value={row.currentReading} onChange={(e) => handleReadingChange(index, "currentReading", e.target.value)} />
                  <input type="number" placeholder="₹ Rate" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} value={row.ratePerUnit} onChange={(e) => handleReadingChange(index, "ratePerUnit", e.target.value)} />
                  <input type="date" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} value={row.date} onChange={(e) => handleReadingChange(index, "date", e.target.value)} />
                  <button type="button" style={{ padding: '8px 12px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => deleteReadingRow(index)}>X</button>
                </div>
              ))}
              <button type="button" style={{ padding: '8px 12px', background: '#f1f5f9', color: '#3b82f6', border: '1px dashed #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', width: '100%' }} onClick={addReadingRow}>
                ➕ Add Another Reading
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button style={{ flex: 1, padding: '12px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={{ flex: 1, padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }} onClick={saveElectricity}>✅ {editMode ? "Update Bill" : "Save Bill"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElectricityExpense;
