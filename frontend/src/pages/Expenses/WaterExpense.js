import React, { useState, useEffect } from "react";
import "../../Styles/Expences.css";
import { BASE_URL } from "../../Components/Baseurl";

const WaterExpense = () => {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  
  const [apartments, setApartments] = useState([]);
  const [selectedApartment, setSelectedApartment] = useState("");

  const [showRecordModal, setShowRecordModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editType, setEditType] = useState(""); 
  const [editSummaryId, setEditSummaryId] = useState(null); 
  const [editRecordId, setEditRecordId] = useState(null); 
  
  const [recordForm, setRecordForm] = useState({
    apartmentId: "",
    date: "",
    tankers: "",
    capacity: "",
    perLiterCost: "",
  });

  const fetchWater = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/allwater`);
      const data = await res.json();
      setSummaries(data.data || data.waterExpenses || data || []);
    } catch (err) {
      console.error("Error fetching water:", err);
      setSummaries([]);
    } finally {
      setLoading(false);
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
    fetchWater();
    fetchApartments();
  }, []);

  const openAddModal = (type, apartmentId = "") => {
    setEditMode(false);
    setEditType(type);
    setEditSummaryId(null);
    setEditRecordId(null);
    setRecordForm({
      apartmentId: apartmentId || "",
      date: new Date().toISOString().split("T")[0],
      tankers: "",
      capacity: "",
      perLiterCost: "",
    });
    setShowRecordModal(true);
  };

  const openEditModal = (summaryId, type, tankerRecord) => {
    setEditMode(true);
    setEditType(type);
    setEditSummaryId(summaryId);
    setEditRecordId(tankerRecord._id);
    setRecordForm({
      apartmentId: "", 
      date: tankerRecord.date ? tankerRecord.date.substring(0, 10) : "",
      tankers: tankerRecord.tankers ?? "",
      capacity: tankerRecord.capacity ?? tankerRecord.totalLitres ?? "",
      perLiterCost: tankerRecord.perLiterCost ?? "",
    });
    setShowRecordModal(true);
  };

  const createRecord = async () => {
    try {
      if (!recordForm.apartmentId) return alert("Please select apartment");
      if (!recordForm.date) return alert("Please select a date");
      
      const monthStr = recordForm.date.substring(0, 7); // e.g. "2025-08"

      const summary = summaries.find(
        (s) =>
          ((s.apartmentId && (s.apartmentId._id || s.apartmentId) === recordForm.apartmentId) ||
          s.apartmentId === recordForm.apartmentId) && s.month === monthStr
      );

      const payloadTanker = {
        date: recordForm.date,
        tankerType: editType,
        tankers: Number(recordForm.tankers),
        capacity: Number(recordForm.capacity),
        perLiterCost: Number(recordForm.perLiterCost),
        totalLitres: Number(recordForm.capacity) * Number(recordForm.tankers),
        totalCost:
          Number(recordForm.capacity) *
          Number(recordForm.tankers) *
          Number(recordForm.perLiterCost),
      };

      if (summary) {
        const updatedBore = summary.bore ? [...summary.bore] : [];
        const updatedManjeera = summary.manjeera ? [...summary.manjeera] : [];

        if (editType === "bore") updatedBore.push(payloadTanker);
        else updatedManjeera.push(payloadTanker);

        await fetch(`${BASE_URL}/updatewater/${summary._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apartmentId: summary.apartmentId._id || summary.apartmentId, month: summary.month, bore: updatedBore, manjeera: updatedManjeera }),
        });
      } else {
        await fetch(`${BASE_URL}/createwater`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apartmentId: recordForm.apartmentId,
            month: monthStr,
            bore: editType === "bore" ? [payloadTanker] : [],
            manjeera: editType === "manjeera" ? [payloadTanker] : [],
          }),
        });
      }

      setShowRecordModal(false);
      fetchWater();
    } catch (err) {
      alert(err.message || "Failed to save record");
    }
  };

  const updateRecord = async () => {
    try {
      const summary = summaries.find((s) => s._id === editSummaryId);
      const updatedTanker = {
        _id: editRecordId,
        date: recordForm.date,
        tankers: Number(recordForm.tankers),
        capacity: Number(recordForm.capacity),
        perLiterCost: Number(recordForm.perLiterCost),
        totalLitres: Number(recordForm.capacity) * Number(recordForm.tankers),
        totalCost:
          Number(recordForm.capacity) *
          Number(recordForm.tankers) *
          Number(recordForm.perLiterCost),
      };

      let boreList = [...(summary.bore || [])];
      let manjeeraList = [...(summary.manjeera || [])];

      if (editType === "bore") {
        boreList = boreList.map((t) => String(t._id) === String(editRecordId) ? updatedTanker : t);
      } else {
        manjeeraList = manjeeraList.map((t) => String(t._id) === String(editRecordId) ? updatedTanker : t);
      }

      await fetch(`${BASE_URL}/updatewater/${summary._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apartmentId: summary.apartmentId._id || summary.apartmentId, bore: boreList, manjeera: manjeeraList }),
      });

      setShowRecordModal(false);
      fetchWater();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteWaterRecord = async (summaryId, type, tankerId) => {
    try {
      if (!window.confirm("Delete this tanker record?")) return;
      await fetch(`${BASE_URL}/deleteTanker/${summaryId}/${type}/${tankerId}`, { method: "DELETE" });
      fetchWater();
    } catch (err) {
      alert(err.message || "Delete failed");
    }
  };

  const deleteWaterSummary = async (summaryId) => {
    try {
      if (!window.confirm("Are you sure you want to delete ALL water data for this apartment? This cannot be undone.")) return;
      await fetch(`${BASE_URL}/deletewater/${summaryId}`, { method: "DELETE" });
      fetchWater();
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const handleApartmentSelect = async (apartmentId) => {
    setSelectedApartment(apartmentId);
    if (!apartmentId) return;
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#1e40af', margin: 0 }}>💧 Water Management</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{ padding: '10px 15px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => openAddModal("bore")}>➕ Add Bore</button>
          <button style={{ padding: '10px 15px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => openAddModal("manjeera")}>➕ Add Manjeera</button>
        </div>
      </div>

      {/* Main Summary Table */}
      <div style={{ background: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Apartment</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Month</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Tankers (B/M)</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Consumed (Ltr)</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Total Cost</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Avg Rate/Ltr</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center' }}>Loading...</td></tr>
            ) : summaries.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center' }}>No water data found. Click the buttons above to add some!</td></tr>
            ) : (
              summaries.map((s) => {
                const boreTankers = (s.bore || []).reduce((acc, it) => acc + (Number(it.tankers) || 0), 0);
                const manjeeraTankers = (s.manjeera || []).reduce((acc, it) => acc + (Number(it.tankers) || 0), 0);
                
                const totalLitres = [...(s.bore||[]), ...(s.manjeera||[])]
                  .reduce((sum, t) => sum + ((t.totalLitres) || (t.capacity * t.tankers) || 0), 0);

                const totalCost = s.totalCost ?? 
                  (s.bore || []).reduce((acc, it) => acc + (Number(it.totalCost) || 0), 0) +
                  (s.manjeera || []).reduce((acc, it) => acc + (Number(it.totalCost) || 0), 0);

                const ratePerLiter = totalLitres ? (totalCost / totalLitres).toFixed(3) : s.ratePerLitre ?? 0;
                const isExpanded = selectedRow && selectedRow._id === s._id;

                return (
                  <React.Fragment key={s._id}>
                    <tr style={{ borderBottom: '1px solid #f1f5f9', background: isExpanded ? '#f8fafc' : 'white' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '500', color: '#1e293b' }}>{s.apartmentId?.name || s.apartmentId}</td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>{s.month || "Older (No Month)"}</td>
                      <td style={{ padding: '12px 16px' }}>{boreTankers + manjeeraTankers} <span style={{ color: '#64748b', fontSize: '12px' }}>({boreTankers}B / {manjeeraTankers}M)</span></td>
                      <td style={{ padding: '12px 16px' }}>{(totalLitres || 0).toLocaleString()} L</td>
                      <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#0f172a' }}>₹{(totalCost || 0).toLocaleString()}</td>
                      <td style={{ padding: '12px 16px' }}>₹{Number(ratePerLiter).toFixed ? Number(ratePerLiter).toFixed(2) : ratePerLiter}</td>
                      <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                        <button 
                          style={{ padding: '6px 12px', background: isExpanded ? '#e2e8f0' : '#f1f5f9', color: '#0f172a', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                          onClick={() => setSelectedRow(isExpanded ? null : s)}
                        >
                          {isExpanded ? 'Hide Details' : 'View Details'}
                        </button>
                        <button 
                          style={{ padding: '6px 12px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                          onClick={() => deleteWaterSummary(s._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                    
                    {isExpanded && (
                      <tr style={{ background: '#f8fafc' }}>
                        <td colSpan="7" style={{ padding: '20px', borderBottom: '2px solid #e2e8f0' }}>
                          <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                            <h4 style={{ margin: '0 0 15px 0', color: '#334155' }}>Detailed Tanker Log</h4>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                              <thead style={{ background: '#f1f5f9' }}>
                                <tr>
                                  <th style={{ padding: '8px' }}>Date</th>
                                  <th style={{ padding: '8px' }}>Type</th>
                                  <th style={{ padding: '8px' }}>Tankers</th>
                                  <th style={{ padding: '8px' }}>Capacity</th>
                                  <th style={{ padding: '8px' }}>Total Cost</th>
                                  <th style={{ padding: '8px', textAlign: 'right' }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[...(s.bore || []).map(b => ({ ...b, type: 'Bore' })), ...(s.manjeera || []).map(m => ({ ...m, type: 'Manjeera' }))]
                                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                                  .map((t, i) => (
                                  <tr key={t._id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '8px' }}>{t.date?.substring?.(0, 10) || t.date}</td>
                                    <td style={{ padding: '8px' }}><span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '12px', background: t.type === 'Bore' ? '#dbeafe' : '#e0f2fe', color: t.type === 'Bore' ? '#1e40af' : '#0369a1' }}>{t.type}</span></td>
                                    <td style={{ padding: '8px' }}>{t.tankers}</td>
                                    <td style={{ padding: '8px' }}>{t.capacity} L</td>
                                    <td style={{ padding: '8px' }}>₹{t.totalCost || Number(t.capacity) * Number(t.tankers) * Number(t.perLiterCost) || 0}</td>
                                    <td style={{ padding: '8px', textAlign: 'right' }}>
                                      <button style={{ marginRight: '8px', padding: '4px 8px', border: '1px solid #cbd5e1', background: 'white', borderRadius: '4px', cursor: 'pointer' }} onClick={() => openEditModal(s._id, t.type.toLowerCase(), t)}>Edit</button>
                                      <button style={{ padding: '4px 8px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#b91c1c', borderRadius: '4px', cursor: 'pointer' }} onClick={() => deleteWaterRecord(s._id, t.type.toLowerCase(), t._id)}>Delete</button>
                                    </td>
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

      {showRecordModal && (
        <div className="popup-overlay" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '90%', maxWidth: '550px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1e40af', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              💧 {editMode ? `Edit ${editType} Record` : `Add ${editType} Record`}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', gap: '15px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', fontSize: '14px', fontWeight: '500', color: '#475569', flex: 1 }}>
                  Apartment *
                  <select
                    style={{ padding: '10px', marginTop: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' }}
                    value={recordForm.apartmentId}
                    onChange={(e) => setRecordForm({ ...recordForm, apartmentId: e.target.value })}
                    disabled={editMode}
                  >
                    <option value="">-- Select Apartment --</option>
                    {apartments.map((apt) => (
                      <option key={apt._id} value={apt._id}>{apt.name}</option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', fontSize: '14px', fontWeight: '500', color: '#475569', flex: 1 }}>
                  Delivery Date *
                  <input type="date" style={{ padding: '10px', marginTop: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' }} value={recordForm.date} onChange={(e) => setRecordForm({ ...recordForm, date: e.target.value })} />
                </label>
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', fontSize: '14px', fontWeight: '500', color: '#475569', flex: 1 }}>
                  No. of Tankers *
                  <input type="number" placeholder="e.g. 2" style={{ padding: '10px', marginTop: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' }} value={recordForm.tankers} onChange={(e) => setRecordForm({ ...recordForm, tankers: e.target.value })} />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', fontSize: '14px', fontWeight: '500', color: '#475569', flex: 1 }}>
                  Capacity (Liters) *
                  <input type="number" placeholder="e.g. 5000" style={{ padding: '10px', marginTop: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' }} value={recordForm.capacity} onChange={(e) => setRecordForm({ ...recordForm, capacity: e.target.value })} />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', fontSize: '14px', fontWeight: '500', color: '#475569', flex: 1 }}>
                  Cost Per Liter (₹) *
                  <input type="number" placeholder="e.g. 0.15" step="0.01" style={{ padding: '10px', marginTop: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' }} value={recordForm.perLiterCost} onChange={(e) => setRecordForm({ ...recordForm, perLiterCost: e.target.value })} />
                </label>
              </div>
              
              <div style={{ background: '#f0f9ff', padding: '16px', borderRadius: '8px', fontSize: '15px', color: '#0369a1', border: '1px solid #bae6fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Estimated Total Cost:</span>
                <strong style={{ fontSize: '18px' }}>₹{(Number(recordForm.tankers) * Number(recordForm.capacity) * Number(recordForm.perLiterCost)) || 0}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button style={{ flex: 1, padding: '10px', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }} onClick={() => setShowRecordModal(false)}>Cancel</button>
              <button style={{ flex: 1, padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }} onClick={editMode ? updateRecord : createRecord}>{editMode ? "Update Record" : "Save Record"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaterExpense;
