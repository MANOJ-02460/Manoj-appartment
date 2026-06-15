import React, { useState, useEffect } from "react";
import "../../Styles/Expences.css";
import { BASE_URL } from "../../Components/Baseurl";
import { generateInvoice } from "../../utils/generateInvoice";

const MaintenanceExpense = () => {
  const [maintenanceList, setMaintenanceList] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [expandedFlat, setExpandedFlat] = useState(null);
  const [apartments, setApartments] = useState([]);
  const [globalSocietyExpenses, setGlobalSocietyExpenses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Notification state
  const [notifConfirm, setNotifConfirm] = useState(null); // { id, month, flatCount }
  const [notifSending, setNotifSending] = useState(false);
  const [notifResult, setNotifResult] = useState(null);   // { summary, details }

  const [showMaintModal, setShowMaintModal] = useState(false);
  const [editMaintId, setEditMaintId] = useState(null);
  const [maintForm, setMaintForm] = useState({
    apartmentId: "",
    month: "",
    waterExpenseId: "",
    electricityExpenseId: "",
    common: "",
    security: "",
    waterTotal: 0,
    electricityTotal: 0,
    societyBillsTotal: 0,
  });

  const fetchMaintenance = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/allMaintenance`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data || [];
      // Sort by newest first
      const sorted = list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setMaintenanceList(sorted);
    } catch (err) {
      console.error("Error fetching maintenance:", err);
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

  const fetchGlobalExpenses = async () => {
    try {
      const res = await fetch(`${BASE_URL}/allexpences`);
      const data = await res.json();
      setGlobalSocietyExpenses(data.expenses || data.data || (Array.isArray(data) ? data : []));
    } catch (err) {
      console.error("Error fetching global expenses:", err);
    }
  };

  useEffect(() => {
    fetchMaintenance();
    fetchApartments();
    fetchGlobalExpenses();
  }, []);

  const fetchUtilitiesForApartment = async (apartmentId, selectedMonth, isEdit = false) => {
    try {
      // 1. Fetch Water
      const w = await fetch(`${BASE_URL}/allwater`);
      const wData = await w.json();
      const waterList = Array.isArray(wData) ? wData : wData.data || wData.waterExpenses || [];
      let waterDoc = null;
      if (selectedMonth) {
        waterDoc = waterList.find(
          w => (w.apartmentId?._id === apartmentId || w.apartmentId === apartmentId) && w.month === selectedMonth
        );
      } else {
        waterDoc = waterList.find(
          w => w.apartmentId?._id === apartmentId || w.apartmentId === apartmentId
        );
      }

      // 2. Fetch Electricity
      const e = await fetch(`${BASE_URL}/allelectricity`);
      const eData = await e.json();
      const eleList = eData.records || eData.data || (Array.isArray(eData) ? eData : []);
      
      let eleDoc = null;
      if (selectedMonth) {
        eleDoc = eleList.find(
          e => (e.apartmentId?._id === apartmentId || e.apartmentId === apartmentId) && e.billingMonth === selectedMonth
        );
      } else {
        eleDoc = eleList.find(
          e => e.apartmentId?._id === apartmentId || e.apartmentId === apartmentId
        );
      }

      // 3. Fetch Society Bills (General Expenses)
      const soc = await fetch(`${BASE_URL}/allexpences`);
      const socData = await soc.json();
      const societyBills = socData.expenses || socData.data || (Array.isArray(socData) ? socData : []);
      
      let filteredBills = societyBills.filter(b => b.apartmentId?._id === apartmentId || b.apartmentId === apartmentId);
      if (selectedMonth) {
        filteredBills = filteredBills.filter(b => b.expenseDate && b.expenseDate.startsWith(selectedMonth));
      }
      const totalSocietyBills = filteredBills.reduce((sum, b) => sum + Number(b.amount || 0), 0);

      setMaintForm(prev => ({
        ...prev,
        waterExpenseId: waterDoc?._id || null,
        waterTotal: waterDoc?.totalCost || 0,
        electricityExpenseId: eleDoc?._id || null,
        electricityTotal: eleDoc?.totalCost || 0,
        societyBillsTotal: totalSocietyBills,
        // Only override common if not in edit mode
        common: !isEdit ? (totalSocietyBills || prev.common) : prev.common,
      }));
    } catch (err) {
      console.error("Utility fetch error:", err);
    }
  };

  const handleMaintApartmentChange = (id) => {
    setMaintForm(prev => ({ ...prev, apartmentId: id }));
    if (id) fetchUtilitiesForApartment(id, maintForm.month);
  };

  const handleMaintMonthChange = (month) => {
    setMaintForm(prev => ({ ...prev, month }));
    if (maintForm.apartmentId) fetchUtilitiesForApartment(maintForm.apartmentId, month);
  };

  const createMaintenance = async () => {
    try {
      if (!maintForm.apartmentId) return alert("Select apartment");

      const payload = {
        apartmentId: maintForm.apartmentId,
        month: maintForm.month || undefined,
        common: Number(maintForm.societyBillsTotal || 0),
        security: Number(maintForm.security),
        waterExpenseId: maintForm.waterExpenseId || null,
        electricityExpenseId: maintForm.electricityExpenseId || null,
      };

      const res = await fetch(`${BASE_URL}/createMaintenance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Creation failed");

      setShowMaintModal(false);
      setMaintForm({ apartmentId: "", month: "", waterExpenseId: "", electricityExpenseId: "", common: "", security: "", waterTotal: 0, electricityTotal: 0, societyBillsTotal: 0 });
      fetchMaintenance();
    } catch (err) {
      alert(err.message);
    }
  };

  const updateMaintenance = async () => {
    try {
      const payload = {
        common: Number(maintForm.societyBillsTotal || 0),
        security: Number(maintForm.security),
        waterExpenseId: maintForm.waterExpenseId || null,
        electricityExpenseId: maintForm.electricityExpenseId || null,
      };

      const res = await fetch(`${BASE_URL}/updateMaintenance/${editMaintId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");

      setShowMaintModal(false);
      setEditMaintId(null);
      setMaintForm({ apartmentId: "", month: "", waterExpenseId: "", electricityExpenseId: "", common: "", security: "", waterTotal: 0, electricityTotal: 0, societyBillsTotal: 0 });
      fetchMaintenance();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteMaintenance = async (id) => {
    if (!window.confirm("Are you sure you want to delete this maintenance record?")) return;
    try {
      const res = await fetch(`${BASE_URL}/deleteMaintenance/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      fetchMaintenance();
    } catch (err) {
      alert(err.message);
    }
  };

  const sendNotifications = async () => {
    if (!notifConfirm || !notifConfirm.data) return;
    setNotifSending(true);
    try {
      const m = notifConfirm.data;
      const aptId = m.apartmentId?._id || m.apartmentId;
      const aptName = m.apartmentId?.name || "Apartment";
      
      // Filter society bills for this specific apartment & month
      let socBillsForMonth = globalSocietyExpenses.filter(b => b.apartmentId?._id === aptId || b.apartmentId === aptId);
      if (m.month) {
        socBillsForMonth = socBillsForMonth.filter(b => b.expenseDate && b.expenseDate.startsWith(m.month));
      }

      // Generate base64 PDFs for all flats using jsPDF
      const pdfs = [];
      for (const flatBill of m.flatExpenses) {
        const pdfBase64 = generateInvoice({
          flatData: flatBill,
          apartmentName: aptName,
          month: m.month,
          numFlats: m.flatExpenses.length,
          societyBills: socBillsForMonth,
          paymentStatus: (flatBill.status || 'unpaid').toUpperCase(),
          returnBase64: true
        });
        pdfs.push({ flatId: flatBill.flatId, pdfBase64 });
      }

      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/maintenance/${notifConfirm.id}/send-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ pdfs })
      });
      
      const data = await res.json();
      setNotifConfirm(null);
      setNotifResult(data);
    } catch (err) {
      alert('Failed to send notifications: ' + err.message);
    } finally {
      setNotifSending(false);
    }
  };

  const handleEdit = async (m) => {
    const aptId = m.apartmentId?._id || m.apartmentId;
    const month = m.month || "";

    setEditMaintId(m._id);
    
    // Set initial state from the snapshot
    setMaintForm({
      apartmentId: aptId,
      month: month,
      waterExpenseId: m.waterExpenseId?._id || m.waterExpenseId,
      electricityExpenseId: m.electricityExpenseId?._id || m.electricityExpenseId,
      common: m.common || "",
      security: m.security || "",
      waterTotal: m.waterExpenseId?.totalCost || 0,
      electricityTotal: m.electricityExpenseId?.totalCost || 0,
      societyBillsTotal: 0,
    });

    // Fire the dynamic fetch to pull in any new electricity/water bills!
    fetchUtilitiesForApartment(aptId, month, true);
    
    setShowMaintModal(true);
  };

  const toggleFlat = (flatNo) => {
    setExpandedFlat(expandedFlat === flatNo ? null : flatNo);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#1e40af', margin: 0 }}>🧰 Maintenance Bills</h2>
        <button 
          style={{ padding: '10px 15px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }} 
          onClick={() => {
            setEditMaintId(null);
            setMaintForm({ apartmentId: "", month: "", waterExpenseId: "", electricityExpenseId: "", common: "", security: "", waterTotal: 0, electricityTotal: 0, societyBillsTotal: 0 });
            setShowMaintModal(true);
          }}
        >
          ➕ Generate Bill
        </button>
      </div>

      <div style={{ background: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Apartment</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Month</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Common (₹)</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Security (₹)</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Total Billed</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Loading bills...</td></tr>
            ) : maintenanceList.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No maintenance bills generated yet.</td></tr>
            ) : (
              maintenanceList.map((m) => {
                const isExpanded = selectedRow && selectedRow._id === m._id;
                return (
                  <React.Fragment key={m._id}>
                    <tr style={{ borderBottom: '1px solid #f1f5f9', background: isExpanded ? '#f8fafc' : 'white' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '500', color: '#1e293b' }}>{m.apartmentId?.name || "Unknown"}</td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>{m.month || (m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : "-")}</td>
                      <td style={{ padding: '12px 16px', color: '#84cc16' }}>₹{(m.common || 0).toLocaleString()}</td>
                      <td style={{ padding: '12px 16px' }}>₹{(m.security || 0).toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#0f172a' }}>₹{(m.totalMaintenance || 0).toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                        <button 
                          style={{ padding: '6px 12px', background: isExpanded ? '#e2e8f0' : '#f1f5f9', color: '#0f172a', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                          onClick={() => setSelectedRow(isExpanded ? null : m)}
                        >
                          {isExpanded ? 'Hide Flats' : 'View Flats'}
                        </button>
                        <button 
                          style={{ padding: '6px 12px', background: 'white', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                          onClick={() => handleEdit(m)}
                        >
                          Edit
                        </button>
                        <button 
                          style={{ padding: '6px 12px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                          onClick={() => deleteMaintenance(m._id)}
                        >
                          Delete
                        </button>
                        <button
                          style={{ padding: '6px 12px', background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => setNotifConfirm({ id: m._id, month: m.month, flatCount: m.flatExpenses?.length || 0, data: m })}
                          title="Send bill notification emails to all flat owners"
                        >
                          📧 Notify All
                        </button>
                      </td>
                    </tr>
                    
                    {isExpanded && (
                      <tr style={{ background: '#f8fafc' }}>
                        <td colSpan="6" style={{ padding: '20px', borderBottom: '2px solid #e2e8f0' }}>
                          <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                              <h4 style={{ margin: 0, color: '#334155' }}>Flat-wise Bill Breakdown</h4>
                              <button style={{ padding: '6px 12px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }} onClick={() => window.print()}>🖨️ Print List</button>
                            </div>
                            
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                              <thead style={{ background: '#f1f5f9' }}>
                                <tr>
                                  <th style={{ padding: '8px' }}>Flat</th>
                                  <th style={{ padding: '8px' }}>Owner</th>
                                  <th style={{ padding: '8px' }}>Cmn</th>
                                  <th style={{ padding: '8px' }}>Water</th>
                                  <th style={{ padding: '8px' }}>Elec</th>
                                  <th style={{ padding: '8px' }}>Sec</th>
                                  <th style={{ padding: '8px', color: '#b91c1c' }}>Arrears</th>
                                  <th style={{ padding: '8px', fontWeight: 'bold' }}>Total</th>
                                  <th style={{ padding: '8px', textAlign: 'center' }}>Status</th>
                                  <th style={{ padding: '8px', textAlign: 'right' }}>More</th>
                                </tr>
                              </thead>
                              <tbody>
                                {m.flatExpenses?.map((f) => {
                                  let statusColor = '#94a3b8'; // default grey
                                  let statusText = (f.status || 'unpaid').toUpperCase();
                                  if (statusText === 'PAID') statusColor = '#22c55e'; // green
                                  if (statusText === 'PARTIAL') statusColor = '#f59e0b'; // orange
                                  if (statusText === 'UNPAID') statusColor = '#ef4444'; // red

                                  return (
                                    <React.Fragment key={f._id}>
                                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                      <td style={{ padding: '8px', fontWeight: 'bold' }}>{f.flatNo}</td>
                                      <td style={{ padding: '8px', color: '#475569' }}>{f.owner || "Owner"}</td>
                                      <td style={{ padding: '8px' }}>₹{Math.round(f.common + (f.commonWater || 0))}</td>
                                      <td style={{ padding: '8px', color: '#0284c7' }}>₹{Math.round(f.waterCost)}</td>
                                      <td style={{ padding: '8px', color: '#d97706' }}>₹{Math.round(f.electricity)}</td>
                                      <td style={{ padding: '8px' }}>₹{Math.round(f.security)}</td>
                                      <td style={{ padding: '8px', color: '#b91c1c' }}>₹{Math.round(f.arrears)}</td>
                                      <td style={{ padding: '8px', fontWeight: 'bold', color: '#0f172a' }}>₹{Math.round(f.total)}</td>
                                      <td style={{ padding: '8px', textAlign: 'center' }}>
                                        <span style={{ 
                                          background: `${statusColor}20`, 
                                          color: statusColor, 
                                          padding: '2px 6px', 
                                          borderRadius: '4px', 
                                          fontSize: '11px', 
                                          fontWeight: 'bold' 
                                        }}>
                                          {statusText}
                                        </span>
                                      </td>
                                      <td style={{ padding: '8px', textAlign: 'right', display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                                        <button 
                                          style={{ padding: '4px 8px', border: '1px solid #cbd5e1', background: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                                          onClick={() => toggleFlat(f.flatNo)}
                                        >
                                          {expandedFlat === f.flatNo ? "Less" : "Info"}
                                        </button>
                                        <button 
                                          style={{ padding: '4px 8px', border: 'none', background: '#e11d48', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                          onClick={() => {
                                            const aptIdStr = typeof m.apartmentId === 'object' ? m.apartmentId._id : m.apartmentId;
                                            const aptName = typeof m.apartmentId === 'object' ? m.apartmentId.name : "Apartment";
                                            const thisMonthBills = globalSocietyExpenses.filter(b => 
                                              (b.apartmentId?._id === aptIdStr || b.apartmentId === aptIdStr) &&
                                              (m.month ? (b.expenseDate && new Date(b.expenseDate).toISOString().startsWith(m.month)) : true)
                                            );
                                            generateInvoice({
                                              flatData: f,
                                              apartmentName: aptName,
                                              month: m.month,
                                              societyBills: thisMonthBills,
                                              numFlats: m.flatExpenses?.length || 1,
                                              paymentStatus: statusText
                                            });
                                          }}
                                          title="Download PDF Invoice"
                                        >
                                          📄 PDF
                                        </button>
                                      </td>
                                    </tr>
                                    {expandedFlat === f.flatNo && (
                                      <tr>
                                        <td colSpan="9" style={{ padding: '0', borderBottom: '1px solid #e2e8f0' }}>
                                          <div style={{ background: '#f8fafc', padding: '15px 25px', display: 'flex', gap: '50px' }}>
                                            
                                            {/* Common Charge Breakdown */}
                                            <div style={{ flex: 1, borderRight: '1px solid #e2e8f0', paddingRight: '30px' }}>
                                              <h4 style={{ margin: '0 0 10px 0', color: '#334155', borderBottom: '1px solid #cbd5e1', paddingBottom: '5px' }}>🏢 Common Charge Breakdown</h4>
                                              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: '#475569' }}>
                                                {(() => {
                                                  // Dynamically group society expenses for this month
                                                  const aptIdStr = typeof m.apartmentId === 'object' ? m.apartmentId._id : m.apartmentId;
                                                  const thisMonthBills = globalSocietyExpenses.filter(b => 
                                                    (b.apartmentId?._id === aptIdStr || b.apartmentId === aptIdStr) &&
                                                    (m.month ? (b.expenseDate && new Date(b.expenseDate).toISOString().startsWith(m.month)) : true)
                                                  );
                                                  
                                                  const grouped = {};
                                                  thisMonthBills.forEach(b => {
                                                    const cat = b.category || 'Other';
                                                    grouped[cat] = (grouped[cat] || 0) + Number(b.amount || 0);
                                                  });

                                                  const numFlats = m.flatExpenses?.length || 1;
                                                  
                                                  const rows = Object.entries(grouped).map(([cat, total]) => (
                                                    <li key={cat} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                      <span>{cat}</span>
                                                      <span>₹{Math.round(total / numFlats)}</span>
                                                    </li>
                                                  ));

                                                  rows.push(
                                                    <li key="cmn-water" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                      <span>Common Area Water</span>
                                                      <span>₹{Math.round(f.commonWater || 0)}</span>
                                                    </li>
                                                  );

                                                  return rows;
                                                })()}
                                                <li style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1', fontWeight: 'bold', color: '#0f172a' }}>
                                                  <span>Total Common</span>
                                                  <span>₹{Math.round(f.common + (f.commonWater || 0))}</span>
                                                </li>
                                              </ul>
                                            </div>

                                            {/* Water Bill Breakdown */}
                                            <div style={{ flex: 1 }}>
                                              <h4 style={{ margin: '0 0 10px 0', color: '#0369a1', borderBottom: '1px solid #bae6fd', paddingBottom: '5px' }}>💧 Water Bill Breakdown</h4>
                                              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: '#0284c7' }}>
                                                <li style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                  <span>Previous Reading</span>
                                                  <span>{f.previousReading}</span>
                                                </li>
                                                <li style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                  <span>Current Reading</span>
                                                  <span>{f.currentReading}</span>
                                                </li>
                                                <li style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                  <span>Usage</span>
                                                  <span>{f.consumedLiters} L</span>
                                                </li>
                                                <li style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                  <span>Rate Per Liter</span>
                                                  <span>₹{f.ratePerLiter}</span>
                                                </li>
                                                <li style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #bae6fd', fontWeight: 'bold' }}>
                                                  <span>Metered Water Cost</span>
                                                  <span>₹{Math.round(f.waterCost)}</span>
                                                </li>
                                              </ul>
                                            </div>

                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                )})}
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

      {showMaintModal && (
        <div className="popup-overlay" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '550px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1e40af', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              🧰 {editMaintId ? "Update Maintenance Bill" : "Generate Maintenance Bill"}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', gap: '15px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', fontSize: '14px', fontWeight: '500', color: '#475569', flex: 1 }}>
                  Apartment *
                  <select
                    style={{ padding: '10px', marginTop: '6px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    value={maintForm.apartmentId}
                    onChange={e => handleMaintApartmentChange(e.target.value)}
                    disabled={!!editMaintId}
                  >
                    <option value="">-- Select Apartment --</option>
                    {apartments.map(a => (
                      <option key={a._id} value={a._id}>{a.name}</option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', fontSize: '14px', fontWeight: '500', color: '#475569', flex: 1 }}>
                  Billing Month *
                  <input
                    type="month"
                    style={{ padding: '10px', marginTop: '6px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    value={maintForm.month}
                    onChange={e => handleMaintMonthChange(e.target.value)}
                    disabled={!!editMaintId}
                  />
                </label>
              </div>

              {maintForm.apartmentId && (
                <div style={{ background: '#f0f9ff', padding: '16px', borderRadius: '8px', border: '1px solid #bae6fd', marginTop: '5px' }}>
                  <strong style={{ color: '#0369a1', display: 'block', marginBottom: '8px' }}>📊 Auto-fetched Data for Calculation:</strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#0284c7' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #bae6fd', paddingBottom: '4px' }}>
                      <span>💧 Total Water Cost:</span> <strong>₹{(maintForm.waterTotal || 0).toLocaleString()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #bae6fd', paddingBottom: '4px' }}>
                      <span>⚡ Total Electricity Cost:</span> <strong>₹{(maintForm.electricityTotal || 0).toLocaleString()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                      <span>🏢 Society Operational Bills:</span> <strong>₹{(maintForm.societyBillsTotal || 0).toLocaleString()}</strong>
                    </div>
                  </div>
                  {!maintForm.waterExpenseId && <p style={{ color: '#ea580c', marginTop: '10px', fontSize: '12px', margin: 0 }}>⚠️ No water expense found for this apartment.</p>}
                  {!maintForm.electricityExpenseId && <p style={{ color: '#ea580c', marginTop: '4px', fontSize: '12px', margin: 0 }}>⚠️ No electricity expense found for this apartment.</p>}
                </div>
              )}

              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', fontSize: '14px', fontWeight: '500', color: '#475569', flex: 1 }}>
                  Security Charges (₹)
                  <input
                    type="number"
                    placeholder="e.g. 1500"
                    style={{ padding: '10px', marginTop: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}
                    value={maintForm.security}
                    onChange={e => setMaintForm(p => ({ ...p, security: e.target.value }))}
                  />
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button 
                style={{ flex: 1, padding: '12px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                onClick={() => {
                  setShowMaintModal(false);
                  setEditMaintId(null);
                  setMaintForm({ apartmentId: '', month: '', waterExpenseId: '', electricityExpenseId: '', common: '', security: '', waterTotal: 0, electricityTotal: 0, societyBillsTotal: 0 });
                }}
              >
                Cancel
              </button>
              <button 
                style={{ flex: 1, padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                onClick={editMaintId ? updateMaintenance : createMaintenance}
              >
                ✅ {editMaintId ? "Update Bill" : "Generate Flat Bills"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Notification Confirmation Modal ───────────────────────────────── */}
      {notifConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '420px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '12px' }}>📧</div>
            <h3 style={{ margin: '0 0 8px', textAlign: 'center', color: '#0f172a', fontSize: '18px' }}>Send Bill Notifications</h3>
            <p style={{ color: '#64748b', textAlign: 'center', fontSize: '14px', margin: '0 0 20px' }}>
              This will email the maintenance bill invoice (PDF) to all registered owners and residents of <strong>{notifConfirm.flatCount}</strong> flat{notifConfirm.flatCount !== 1 ? 's' : ''} for <strong>{notifConfirm.month}</strong>.
            </p>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: '#1e40af', marginBottom: '24px' }}>
              ⚡ All emails are sent in parallel — even {notifConfirm.flatCount} flats will complete in ~3 seconds.
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
                onClick={() => setNotifConfirm(null)}
                disabled={notifSending}
              >
                Cancel
              </button>
              <button
                style={{ flex: 1, padding: '12px', background: notifSending ? '#93c5fd' : '#1e40af', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={sendNotifications}
                disabled={notifSending}
              >
                {notifSending ? (
                  <><span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Sending...</>
                ) : '📤 Send Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Notification Results Modal ─────────────────────────────────────── */}
      {notifResult && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '520px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', maxHeight: '80vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 20px', color: '#0f172a', fontSize: '18px' }}>📊 Notification Results</h3>
            {/* Summary badges */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <span style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>✅ {notifResult.summary?.sent || 0} Sent</span>
              <span style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fdba74', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>⚠️ {notifResult.summary?.skipped || 0} Skipped</span>
              {notifResult.summary?.partial > 0 && (
                <span style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fcd34d', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>📩 {notifResult.summary.partial} Partial</span>
              )}
            </div>
            {/* Per-flat detail table */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569', fontWeight: '600', borderBottom: '1px solid #e2e8f0' }}>Flat</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', color: '#475569', fontWeight: '600', borderBottom: '1px solid #e2e8f0' }}>Status</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569', fontWeight: '600', borderBottom: '1px solid #e2e8f0' }}>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {(notifResult.details || []).map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '9px 12px', fontWeight: '600', color: '#0f172a' }}>{r.flatNo}</td>
                      <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700',
                          background: r.status === 'sent' ? '#f0fdf4' : r.status === 'skipped' ? '#fef2f2' : '#fffbeb',
                          color: r.status === 'sent' ? '#15803d' : r.status === 'skipped' ? '#b91c1c' : '#b45309',
                        }}>
                          {r.status === 'sent' ? '✅ Sent' : r.status === 'skipped' ? '⏭ Skipped' : '⚠️ Partial'}
                        </span>
                      </td>
                      <td style={{ padding: '9px 12px', color: '#64748b' }}>
                        {r.status === 'sent' ? `${r.sent} email${r.sent !== 1 ? 's' : ''} sent` : r.reason || `${r.sent} sent, ${r.failed} failed`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              style={{ marginTop: '20px', width: '100%', padding: '12px', background: '#1e40af', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
              onClick={() => setNotifResult(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default MaintenanceExpense;
