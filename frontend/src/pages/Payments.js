import React, { useState, useEffect, useCallback } from "react";
import "../Styles/Payments.css";

import { BASE_URL } from "../Components/Baseurl";

const PAYMENT_MODES = ["UPI", "Cash", "Cheque", "Bank Transfer"];

export default function Payments() {
  const [activeTab, setActiveTab] = useState("pending");

  // Apartments for filter
  const [apartments, setApartments] = useState([]);
  const [selectedApartmentId, setSelectedApartmentId] = useState("");

  // Pending collections
  const [maintenanceId, setMaintenanceId] = useState(null);
  const [billDate, setBillDate] = useState(null);
  const [pendingList, setPendingList] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);

  // Payment history
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Record payment popup
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [selectedFlat, setSelectedFlat] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    mode: "UPI",
    transactionId: "",
    paidDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Delete confirm
  const [deleteId, setDeleteId] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);

  // ── Fetch apartments ────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${BASE_URL}/allappartments`)
      .then((r) => r.json())
      .then((d) => setApartments(d.data || d.apartments || []))
      .catch(console.error);
  }, []);

  // ── Fetch pending collections ────────────────────────────────────────────────
  const fetchPending = useCallback(async () => {
    if (!selectedApartmentId) return;
    setLoadingPending(true);
    try {
      const res = await fetch(
        `${BASE_URL}/pendingcollections?apartmentId=${selectedApartmentId}`
      );
      const data = await res.json();
      if (data.success) {
        setPendingList(data.pendingCollections || []);
        setMaintenanceId(data.maintenanceId);
        setBillDate(data.billDate);
      } else {
        setPendingList([]);
        setMaintenanceId(null);
      }
    } catch (err) {
      console.error("Error fetching pending collections:", err);
    } finally {
      setLoadingPending(false);
    }
  }, [selectedApartmentId]);

  // ── Fetch payment history ────────────────────────────────────────────────────
  const fetchPayments = useCallback(async () => {
    setLoadingPayments(true);
    try {
      const url = selectedApartmentId
        ? `${BASE_URL}/allpayments?apartmentId=${selectedApartmentId}`
        : `${BASE_URL}/allpayments`;
      const res = await fetch(url);
      const data = await res.json();
      setPayments(data.payments || []);
    } catch (err) {
      console.error("Error fetching payments:", err);
    } finally {
      setLoadingPayments(false);
    }
  }, [selectedApartmentId]);

  useEffect(() => {
    fetchPending();
    fetchPayments();
  }, [fetchPending, fetchPayments]);

  // ── Open record payment popup ────────────────────────────────────────────────
  const openRecordPayment = (flatEntry) => {
    setSelectedFlat(flatEntry);
    setPaymentForm({
      amount: flatEntry.balance || "",
      mode: "UPI",
      transactionId: "",
      paidDate: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setShowPaymentPopup(true);
  };

  // ── Submit payment ───────────────────────────────────────────────────────────
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFlat || !maintenanceId) return;

    try {
      const payload = {
        maintenanceId,
        flatId:
          selectedFlat.flatId?._id || selectedFlat.flatId,
        amount: Number(paymentForm.amount),
        mode: paymentForm.mode,
        transactionId: paymentForm.transactionId,
        paidDate: paymentForm.paidDate,
        notes: paymentForm.notes,
      };

      const res = await fetch(`${BASE_URL}/recordpayment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        alert(`✅ Payment recorded! Bill is now "${data.newStatus}"`);
        setShowPaymentPopup(false);
        setSelectedFlat(null);
        fetchPending();
        fetchPayments();
      } else {
        alert("❌ " + (data.message || "Failed to record payment"));
      }
    } catch (err) {
      console.error("Payment error:", err);
      alert("Server error while recording payment");
    }
  };

  // ── Delete payment ───────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    try {
      const res = await fetch(`${BASE_URL}/deletepayment/${deleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        alert("Payment deleted");
        setShowDeletePopup(false);
        fetchPayments();
        fetchPending();
      } else {
        alert(data.message || "Failed to delete");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ── Status badge ─────────────────────────────────────────────────────────────
  const StatusBadge = ({ status }) => {
    const colors = {
      paid: { bg: "#d1fae5", color: "#065f46" },
      partial: { bg: "#fef3c7", color: "#92400e" },
      unpaid: { bg: "#fee2e2", color: "#991b1b" },
    };
    const s = colors[status] || colors.unpaid;
    return (
      <span
        style={{
          padding: "3px 10px",
          borderRadius: "99px",
          fontSize: "12px",
          fontWeight: 600,
          background: s.bg,
          color: s.color,
        }}
      >
        {status?.toUpperCase()}
      </span>
    );
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");

  return (
    <div className="payments-container">
      <h1 className="page-title">💳 Payments & Collections</h1>

      {/* Apartment Selector */}
      <div className="payments-filter-bar">
        <select
          value={selectedApartmentId}
          onChange={(e) => setSelectedApartmentId(e.target.value)}
          className="payments-select"
        >
          <option value="">— Select Apartment —</option>
          {apartments.map((apt) => (
            <option key={apt._id} value={apt._id}>
              {apt.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="payments-tabs">
        <button
          className={`payments-tab ${activeTab === "pending" ? "active" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          🔴 Pending Collections
        </button>
        <button
          className={`payments-tab ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          ✅ Payment History
        </button>
      </div>

      {/* ── PENDING COLLECTIONS TAB ─────────────────────────────────────────── */}
      {activeTab === "pending" && (
        <div className="payments-tab-content">
          {!selectedApartmentId ? (
            <div className="payments-empty">
              Please select an apartment to view pending collections.
            </div>
          ) : loadingPending ? (
            <div className="payments-empty">Loading...</div>
          ) : pendingList.length === 0 ? (
            <div className="payments-empty">
              🎉 All bills are paid for the latest maintenance cycle!
            </div>
          ) : (
            <>
              <div className="payments-bill-info">
                <span>
                  Latest Bill Date:{" "}
                  <strong>{fmtDate(billDate)}</strong>
                </span>
                <span>
                  Pending Flats:{" "}
                  <strong>{pendingList.length}</strong>
                </span>
              </div>
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>Flat No</th>
                    <th>Total Due</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Arrears</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingList.map((entry, i) => (
                    <tr key={i}>
                      <td>
                        <strong>
                          {entry.flatNo ||
                            entry.flatId?.number ||
                            "—"}
                        </strong>
                      </td>
                      <td>{fmt(entry.totalDue)}</td>
                      <td>{fmt(entry.totalPaid)}</td>
                      <td style={{ color: "#dc2626", fontWeight: 600 }}>
                        {fmt(entry.balance)}
                      </td>
                      <td>{fmt(entry.arrears)}</td>
                      <td>
                        <StatusBadge status={entry.status} />
                      </td>
                      <td>
                        <button
                          className="payments-record-btn"
                          onClick={() => openRecordPayment(entry)}
                        >
                          💰 Record Payment
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {/* ── PAYMENT HISTORY TAB ─────────────────────────────────────────────── */}
      {activeTab === "history" && (
        <div className="payments-tab-content">
          {loadingPayments ? (
            <div className="payments-empty">Loading...</div>
          ) : payments.length === 0 ? (
            <div className="payments-empty">No payments recorded yet.</div>
          ) : (
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Apartment</th>
                  <th>Flat</th>
                  <th>Amount</th>
                  <th>Mode</th>
                  <th>Transaction ID</th>
                  <th>Notes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id}>
                    <td>{fmtDate(p.paidDate)}</td>
                    <td>{p.apartmentId?.name || "—"}</td>
                    <td>
                      {p.flatId?.number || "—"}{" "}
                      {p.flatId?.block ? `(${p.flatId.block})` : ""}
                    </td>
                    <td style={{ fontWeight: 600, color: "#059669" }}>
                      {fmt(p.amount)}
                    </td>
                    <td>
                      <span className="payments-mode-badge">{p.mode}</span>
                    </td>
                    <td>{p.transactionId || "—"}</td>
                    <td>{p.notes || "—"}</td>
                    <td>
                      <button
                        className="payments-delete-btn"
                        onClick={() => {
                          setDeleteId(p._id);
                          setShowDeletePopup(true);
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── RECORD PAYMENT POPUP ─────────────────────────────────────────────── */}
      {showPaymentPopup && selectedFlat && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h3>
              💰 Record Payment — Flat{" "}
              {selectedFlat.flatNo || selectedFlat.flatId?.number}
            </h3>
            <div className="payments-popup-summary">
              <span>Total Due: <strong>{fmt(selectedFlat.totalDue)}</strong></span>
              <span>Already Paid: <strong>{fmt(selectedFlat.totalPaid)}</strong></span>
              <span>Balance: <strong style={{ color: "#dc2626" }}>{fmt(selectedFlat.balance)}</strong></span>
            </div>
            <form className="details-form" onSubmit={handlePaymentSubmit}>
              <label>
                Amount (₹)
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedFlat.balance}
                  value={paymentForm.amount}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, amount: e.target.value })
                  }
                />
              </label>
              <label>
                Payment Mode
                <select
                  value={paymentForm.mode}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, mode: e.target.value })
                  }
                >
                  {PAYMENT_MODES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Transaction ID (optional)
                <input
                  type="text"
                  placeholder="UPI ref / Cheque no / etc."
                  value={paymentForm.transactionId}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      transactionId: e.target.value,
                    })
                  }
                />
              </label>
              <label>
                Payment Date
                <input
                  type="date"
                  value={paymentForm.paidDate}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, paidDate: e.target.value })
                  }
                />
              </label>
              <label>
                Notes (optional)
                <input
                  type="text"
                  placeholder="Any remarks..."
                  value={paymentForm.notes}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, notes: e.target.value })
                  }
                />
              </label>
              <div className="form-actions">
                <button type="submit" className="save-btn">
                  Save Payment
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowPaymentPopup(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM POPUP ─────────────────────────────────────────────── */}
      {showDeletePopup && (
        <div className="popup-overlay">
          <div className="popup-box" style={{ textAlign: "center" }}>
            <h3>🗑️ Delete Payment?</h3>
            <p>
              This will remove the payment record and revert the flat's bill
              status. Are you sure?
            </p>
            <div className="form-actions" style={{ justifyContent: "center" }}>
              <button className="save-btn" onClick={confirmDelete}>
                Yes, Delete
              </button>
              <button
                className="cancel-btn"
                onClick={() => setShowDeletePopup(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
