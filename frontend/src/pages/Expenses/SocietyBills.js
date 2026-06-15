import React, { useEffect, useState } from "react";
import "../../Styles/Expences.css";
import { BASE_URL } from "../../Components/Baseurl";

const SocietyBills = () => {
  const [societyBills, setSocietyBills] = useState([]);
  const [showBillModal, setShowBillModal] = useState(false);
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [billForm, setBillForm] = useState({
    apartmentId: "",
    category: "",
    expenseDate: new Date().toISOString().split("T")[0],
    vendor: "",
    amount: "",
    notes: ""
  });

  const CATEGORIES = ["Plumbing", "Electrical", "Cleaning", "Lift Maintenance", "Gardening", "Others"];

  const fetchApartments = async () => {
    try {
      const res = await fetch(`${BASE_URL}/allappartments`);
      const data = await res.json();
      setApartments(data.appartments || data.data || []);
    } catch (err) {
      console.error("Error fetching apartments:", err);
    }
  };

  const fetchSocietyBills = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/allexpences`);
      const data = await res.json();
      const sortedBills = (data.expenses || data.data || (Array.isArray(data) ? data : [])).sort((a, b) => new Date(b.expenseDate) - new Date(a.expenseDate));
      setSocietyBills(sortedBills);
    } catch (err) {
      console.error("Error fetching society bills:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApartments();
    fetchSocietyBills();
  }, []);

  const createSocietyBill = async () => {
    try {
      if (!billForm.apartmentId || !billForm.category || !billForm.amount || !billForm.expenseDate) {
        return alert("Apartment, Category, Date, and Amount are required");
      }

      const res = await fetch(`${BASE_URL}/createexpences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...billForm, createdBy: "6a227ccae519e1b70ae43356" }) // using hardcoded admin ID for now
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create bill");

      setShowBillModal(false);
      setBillForm({ apartmentId: "", category: "", expenseDate: new Date().toISOString().split("T")[0], vendor: "", amount: "", notes: "" });
      fetchSocietyBills();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteSocietyBill = async (id) => {
    if (!window.confirm("Delete this bill?")) return;
    try {
      const res = await fetch(`${BASE_URL}/deleteexpences/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      fetchSocietyBills();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#1e40af', margin: 0 }}>🏢 Society General Bills</h2>
        <button 
          style={{ padding: '10px 15px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }} 
          onClick={() => setShowBillModal(true)}
        >
          ➕ Add Society Bill
        </button>
      </div>

      {/* Main Summary Table */}
      <div style={{ background: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Apartment</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Date</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Category</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Vendor</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Amount</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Notes</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Loading bills...</td></tr>
            ) : societyBills.length === 0 ? (
              <tr><td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No bills recorded yet. Click the button above to add one!</td></tr>
            ) : (
              societyBills.map((b) => (
                <tr key={b._id} style={{ borderBottom: '1px solid #f1f5f9', background: 'white' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500', color: '#1e293b' }}>{b.apartmentId?.name || b.apartmentId}</td>
                  <td style={{ padding: '12px 16px', color: '#475569' }}>{b.expenseDate ? new Date(b.expenseDate).toLocaleDateString() : "-"}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '4px 10px', background: '#f1f5f9', color: '#334155', borderRadius: '12px', fontSize: '13px', fontWeight: '500' }}>
                      {b.category}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#475569' }}>{b.vendor || "-"}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#0f172a' }}>₹{(b.amount || 0).toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '14px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={b.notes}>{b.notes || "-"}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button 
                      style={{ padding: '6px 12px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                      onClick={() => deleteSocietyBill(b._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modern Modal */}
      {showBillModal && (
        <div className="popup-overlay" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '500px', maxWidth: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1e40af', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              📝 Log Society Bill
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', fontSize: '14px', fontWeight: '500', color: '#475569' }}>
                Apartment *
                <select
                  style={{ padding: '10px', marginTop: '6px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  value={billForm.apartmentId}
                  onChange={(e) => setBillForm({ ...billForm, apartmentId: e.target.value })}
                >
                  <option value="">-- Select Apartment --</option>
                  {apartments.map((a) => (
                    <option key={a._id} value={a._id}>{a.name}</option>
                  ))}
                </select>
              </label>

              <div style={{ display: 'flex', gap: '15px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', fontSize: '14px', fontWeight: '500', color: '#475569', flex: 1 }}>
                  Category *
                  <select
                    style={{ padding: '10px', marginTop: '6px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    value={billForm.category}
                    onChange={(e) => setBillForm({ ...billForm, category: e.target.value })}
                  >
                    <option value="">-- Select Category --</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', fontSize: '14px', fontWeight: '500', color: '#475569', flex: 1 }}>
                  Expense Date *
                  <input
                    type="date"
                    style={{ padding: '10px', marginTop: '6px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    value={billForm.expenseDate}
                    onChange={(e) => setBillForm({ ...billForm, expenseDate: e.target.value })}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', fontSize: '14px', fontWeight: '500', color: '#475569', flex: 1 }}>
                  Total Amount (₹) *
                  <input
                    type="number"
                    placeholder="e.g. 1500"
                    style={{ padding: '10px', marginTop: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}
                    value={billForm.amount}
                    onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', fontSize: '14px', fontWeight: '500', color: '#475569', flex: 1 }}>
                  Vendor / Service Provider
                  <input
                    type="text"
                    placeholder="e.g. UrbanCompany"
                    style={{ padding: '10px', marginTop: '6px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    value={billForm.vendor}
                    onChange={(e) => setBillForm({ ...billForm, vendor: e.target.value })}
                  />
                </label>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', fontSize: '14px', fontWeight: '500', color: '#475569' }}>
                Additional Notes
                <textarea
                  placeholder="Describe the expense..."
                  rows="3"
                  style={{ padding: '10px', marginTop: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                  value={billForm.notes}
                  onChange={(e) => setBillForm({ ...billForm, notes: e.target.value })}
                />
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button 
                style={{ flex: 1, padding: '12px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }} 
                onClick={() => setShowBillModal(false)}
              >
                Cancel
              </button>
              <button 
                style={{ flex: 1, padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }} 
                onClick={createSocietyBill}
              >
                ✅ Save Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocietyBills;
