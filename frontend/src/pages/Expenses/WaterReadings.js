import React, { useState, useEffect } from "react";
import { BASE_URL } from "../../Components/Baseurl";

const WaterReadings = () => {
  const [apartments, setApartments] = useState([]);
  const [selectedApartment, setSelectedApartment] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [flats, setFlats] = useState([]);
  const [readings, setReadings] = useState({}); // { flatId: { previous, current, meterPhoto, status, notes } }
  const [loading, setLoading] = useState(false);
  const [historyDrawer, setHistoryDrawer] = useState(null); // stores flatId
  const [historyData, setHistoryData] = useState([]);
  const [uploading, setUploading] = useState({}); // tracking upload status per flat

  useEffect(() => {
    fetchApartments();
  }, []);

  const fetchApartments = async () => {
    try {
      const res = await fetch(`${BASE_URL}/allappartments`);
      const data = await res.json();
      setApartments(data.appartments || data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFlatsAndReadings = async (apartmentId, month) => {
    if (!apartmentId || !month) return;
    setLoading(true);
    try {
      // Fetch flats for the apartment
      const flatRes = await fetch(`${BASE_URL}/apartment/${apartmentId}`);
      const flatData = await flatRes.json();
      const fetchedFlats = flatData.flats || [];

      // Fetch existing readings for this month
      const readRes = await fetch(`${BASE_URL}/waterreadings/apartment/${apartmentId}/${month}`);
      const readData = await readRes.json();
      const existingReadings = readData.readings || [];

      // Build initial state
      const newReadings = {};
      fetchedFlats.forEach(f => {
        const existing = existingReadings.find(r => (r.flatId?._id || r.flatId) === f._id);
        newReadings[f._id] = {
          previous: existing ? existing.previousReading : (f.waterMeter?.current || 0),
          current: existing ? existing.currentReading : (f.waterMeter?.current || 0),
          meterPhoto: existing?.meterPhoto || null,
          status: existing?.status || 'Pending',
          notes: existing?.notes || ''
        };
      });

      setFlats(fetchedFlats.sort((a, b) => a.number.localeCompare(b.number)));
      setReadings(newReadings);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlatsAndReadings(selectedApartment, selectedMonth);
  }, [selectedApartment, selectedMonth]);

  const handleReadingChange = (flatId, field, value) => {
    setReadings(prev => ({
      ...prev,
      [flatId]: {
        ...prev[flatId],
        [field]: field === "previous" || field === "current" ? (value === "" ? "" : Number(value)) : value
      }
    }));
  };

  const handleFileUpload = async (flatId, file) => {
    if (!file) return;
    setUploading(prev => ({ ...prev, [flatId]: true }));
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${BASE_URL}/upload-meter-photo`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setReadings(prev => ({
          ...prev,
          [flatId]: {
            ...prev[flatId],
            meterPhoto: { imageUrl: data.imageUrl, uploadedAt: new Date() }
          }
        }));
      } else {
        alert("Upload failed");
      }
    } catch (error) {
      console.error(error);
      alert("Error uploading image");
    } finally {
      setUploading(prev => ({ ...prev, [flatId]: false }));
    }
  };

  const fetchHistory = async (flatId) => {
    try {
      const res = await fetch(`${BASE_URL}/waterreadings/history/${flatId}`);
      const data = await res.json();
      setHistoryData(data.history || []);
      setHistoryDrawer(flatId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAll = async () => {
    if (!selectedApartment || !selectedMonth) return alert("Select apartment and month");
    
    // Check for validation errors locally before saving
    for (const flat of flats) {
      const r = readings[flat._id];
      if (Number(r.current) < Number(r.previous)) {
        return alert(`Cannot save: Flat ${flat.number} has a current reading lower than previous.`);
      }
    }

    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    for (const flat of flats) {
      const r = readings[flat._id];
      try {
        const payload = {
          flatId: flat._id,
          apartmentId: selectedApartment,
          month: selectedMonth,
          previousReading: Number(r.previous) || 0,
          currentReading: Number(r.current) || 0,
          meterPhoto: r.meterPhoto,
          status: r.status,
          notes: r.notes
        };

        const res = await fetch(`${BASE_URL}/createwaterreading`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) successCount++;
        else failCount++;
      } catch (err) {
        failCount++;
      }
    }

    setLoading(false);
    alert(`Saved! Success: ${successCount}, Failed: ${failCount}`);
    fetchFlatsAndReadings(selectedApartment, selectedMonth);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', color: '#0f172a' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#1e40af', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          📊 Flat Water Meters
        </h2>
        <button 
          onClick={handleSaveAll}
          style={{ 
            padding: '10px 20px', 
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer', 
            fontWeight: 'bold',
            boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)',
            transition: 'all 0.2s ease',
            opacity: loading || flats.length === 0 ? 0.7 : 1,
            transform: loading || flats.length === 0 ? 'none' : 'translateY(-1px)'
          }}
          disabled={loading || flats.length === 0}
        >
          {loading ? 'Saving Changes...' : 'Save All Readings'}
        </button>
      </div>

      <div style={{ 
        display: 'flex', gap: '15px', marginBottom: '20px', 
        background: 'rgba(255, 255, 255, 0.8)', 
        backdropFilter: 'blur(10px)',
        padding: '15px', 
        borderRadius: '8px', 
        border: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)'
      }}>
        <label style={{ display: 'flex', flexDirection: 'column', fontWeight: '500', color: '#475569', flex: 1 }}>
          Select Apartment
          <select 
            style={{ 
              padding: '10px', marginTop: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', 
              color: '#0f172a', backgroundColor: '#f8fafc', outline: 'none', cursor: 'pointer'
            }}
            value={selectedApartment} 
            onChange={e => setSelectedApartment(e.target.value)}
          >
            <option value="">-- Choose Apartment --</option>
            {apartments.map(a => (
              <option key={a._id} value={a._id}>{a.name}</option>
            ))}
          </select>
        </label>
        
        <label style={{ display: 'flex', flexDirection: 'column', fontWeight: '500', color: '#475569', flex: 1 }}>
          Billing Month
          <input 
            type="month" 
            style={{ 
              padding: '10px', marginTop: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', 
              color: '#0f172a', backgroundColor: '#f8fafc', outline: 'none', cursor: 'text'
            }}
            value={selectedMonth} 
            onChange={e => setSelectedMonth(e.target.value)}
          />
        </label>
      </div>

      <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Flat No</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Prev Reading</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Current Reading</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Consumed</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Photo Proof</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Notes</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && flats.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>Loading...</td></tr>
            ) : flats.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Select an apartment and month to load flats.</td></tr>
            ) : (
              flats.map(f => {
                const r = readings[f._id] || { previous: 0, current: 0, status: 'Pending', notes: '' };
                const consumed = (Number(r.current) || 0) - (Number(r.previous) || 0);
                const isInvalid = consumed < 0;
                const isHigh = consumed > 2500;

                return (
                  <tr key={f._id} style={{ borderBottom: '1px solid #f1f5f9', background: isInvalid ? '#fef2f2' : (isHigh ? '#fffbeb' : 'transparent'), transition: 'background 0.2s' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#1e293b' }}>{f.number}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <input 
                        type="number" 
                        value={r.previous}
                        onChange={e => handleReadingChange(f._id, 'previous', e.target.value)}
                        style={{ padding: '8px', width: '80px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#f8fafc', outline: 'none' }}
                      />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <input 
                        type="number" 
                        value={r.current}
                        onChange={e => handleReadingChange(f._id, 'current', e.target.value)}
                        style={{ padding: '8px', width: '80px', border: `1px solid ${isInvalid ? '#ef4444' : '#cbd5e1'}`, borderRadius: '4px', background: isInvalid ? '#fee2e2' : '#f0fdf4', fontWeight: 'bold', outline: 'none' }}
                      />
                      {isInvalid && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>Cannot be &lt; previous</div>}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 'bold', color: isInvalid ? '#ef4444' : (consumed > 0 ? '#0284c7' : '#94a3b8') }}>
                      {isInvalid ? 'Invalid' : `${consumed.toLocaleString()} L`}
                      {isHigh && <div style={{ color: '#d97706', fontSize: '11px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><span>⚠️</span> High Usage</div>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {r.meterPhoto?.imageUrl ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <a href={r.meterPhoto.imageUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#2563eb', fontSize: '12px', textDecoration: 'none', background: '#eff6ff', padding: '6px 10px', borderRadius: '4px' }}>
                            📸 View Photo
                          </a>
                          <button 
                            onClick={() => handleReadingChange(f._id, 'meterPhoto', null)}
                            style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#ef4444', cursor: 'pointer', fontSize: '14px', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Remove Photo"
                          >
                            ✖
                          </button>
                        </div>
                      ) : (
                        <div>
                          <label style={{
                            cursor: uploading[f._id] ? 'wait' : 'pointer', 
                            background: '#f1f5f9', 
                            padding: '6px 10px', 
                            borderRadius: '4px', 
                            fontSize: '12px', 
                            color: '#475569', 
                            border: '1px solid #cbd5e1', 
                            display: 'inline-flex', 
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            width: '100px',
                            transition: 'all 0.2s',
                            opacity: uploading[f._id] ? 0.6 : 1
                          }}>
                            {uploading[f._id] ? 'Uploading...' : '📁 Upload'}
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={e => handleFileUpload(f._id, e.target.files[0])}
                              style={{ display: 'none' }}
                              disabled={uploading[f._id]}
                            />
                          </label>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <input 
                        type="text" 
                        placeholder="House Vacant..."
                        value={r.notes || ''}
                        onChange={e => handleReadingChange(f._id, 'notes', e.target.value)}
                        style={{ padding: '8px', width: '120px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#f8fafc', outline: 'none' }}
                      />
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button onClick={() => fetchHistory(f._id)} style={{ padding: '6px 10px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#475569', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', transition: 'all 0.2s' }}>
                        🕒 History
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        
        {/* SUMMARY FOOTER */}
        {flats.length > 0 && (
          <div style={{ padding: '15px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '30px', color: '#0f172a' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>Total Flats</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{flats.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>Total Consumption</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#0284c7' }}>
                {flats.reduce((sum, f) => {
                  const r = readings[f._id] || { previous: 0, current: 0 };
                  const consumed = (Number(r.current) || 0) - (Number(r.previous) || 0);
                  return sum + (consumed > 0 ? consumed : 0);
                }, 0).toLocaleString()} <span style={{ fontSize: '14px', color: '#94a3b8' }}>L</span>
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>Avg Per Flat</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                {flats.length > 0 ? Math.round(flats.reduce((sum, f) => {
                  const r = readings[f._id] || { previous: 0, current: 0 };
                  const consumed = (Number(r.current) || 0) - (Number(r.previous) || 0);
                  return sum + (consumed > 0 ? consumed : 0);
                }, 0) / flats.length).toLocaleString() : 0} <span style={{ fontSize: '14px', color: '#94a3b8' }}>L</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* HISTORY DRAWER MODAL */}
      {historyDrawer && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', width: '500px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#1e40af' }}>Reading History</h3>
              <button onClick={() => setHistoryDrawer(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px' }}>✖</button>
            </div>
            
            {historyData.length === 0 ? (
              <p style={{ color: '#64748b' }}>No history found for this flat.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#f1f5f9' }}>
                  <tr>
                    <th style={{ padding: '8px' }}>Month</th>
                    <th style={{ padding: '8px' }}>Usage</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.map((h, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px' }}>{h.month}</td>
                      <td style={{ padding: '8px', fontWeight: 'bold', color: '#0284c7' }}>{h.usage || Math.max(0, h.currentReading - h.previousReading)} L</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default WaterReadings;
