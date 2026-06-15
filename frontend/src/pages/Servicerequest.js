import React, { useState, useEffect } from "react";
import "../Styles/Servicerequest.css";
import { BASE_URL } from "../Components/Baseurl";


const Servicerequest = () => {
  const [vendors, setVendors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [assignPopupOpen, setAssignPopupOpen] = useState(false);
  const [viewPopupOpen, setViewPopupOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedRequestIndex, setSelectedRequestIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("Service Requests");


  useEffect(() => {
    fetchServiceRequests();
    fetchVendors();
  }, []);

  const fetchServiceRequests = async () => {
    try {
      const res = await fetch(`${BASE_URL}/allservices`);
      const data = await res.json();
      const serviceList = data.requests || data.services || data.data || data || [];
      const sortedList = Array.isArray(serviceList)
        ? serviceList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        : [];
      setRequests(sortedList);
    } catch (error) {
      console.error("Error fetching service requests:", error);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await fetch(`${BASE_URL}/allvendors`);
      const data = await res.json();
      setVendors(data.vendors || data.data || []);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  // Mark a service as read before showing details
  const markServiceAsRead = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/services/${id}/read`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) console.error("Failed to mark service as read:", res.status);
    } catch (error) {
      console.error("Error marking service as read:", error);
    }
  };

  // Show popup with details and mark as read
  const handleViewServiceDetails = async (id) => {
    try {
      await markServiceAsRead(id);
      const res = await fetch(`${BASE_URL}/oneservice/${id}`);
      const data = await res.json();
      const service = data.request || data.service || data;
      setSelectedRequest(service);
      setViewPopupOpen(true);
      console.log("Service details response:", data);

      // Mark locally as read for better UI feedback
      setRequests((prev) =>
        prev.map((req) => (req._id === id ? { ...req, read: true, is_read: true } : req))
      );
      window.dispatchEvent(new Event("serviceUpdated"));
    } catch (error) {
      console.error("Error fetching service details:", error);
      alert("Unable to fetch service details.");
    }
  };


  const getFriendlyStatus = (status) => {
    if (status === "Assigned" || status === "InProgress") return "In Progress";
    if (status === "Pending") return "Pending";
    if (status === "Completed" || status?.toLowerCase() === "complete") return "Completed";
    return status || "Unknown";
  };

  const updateServiceStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`${BASE_URL}/updatestatus/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      fetchServiceRequests();
      window.dispatchEvent(new Event("serviceUpdated"));
    } catch (err) {
      alert("Error updating status: " + err.message);
    }
  };



  const assignVendorAndNotify = async (serviceId, vendorId) => {
    try {
      const assignRes = await fetch(`${BASE_URL}/updateservice/${serviceId}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId }),
      });
      if (!assignRes.ok) {
        const errorText = await assignRes.text();
        throw new Error(`Failed to assign vendor: ${errorText}`);
      }
      const statusRes = await fetch(`${BASE_URL}/updatestatus/${serviceId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Assigned" }),
      });
      if (!statusRes.ok) {
        const errorText = await statusRes.text();
        throw new Error(`Failed to update status: ${errorText}`);
      }
      setAssignPopupOpen(false);
      setSelectedRequestIndex(null);
      await fetchServiceRequests();
      window.dispatchEvent(new Event("serviceUpdated"));
    } catch (err) {
      console.error("Error in assignVendorAndNotify:", err);
      alert(`Vendor assignment failed: ${err.message}`);
    }
  };
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const [deletePopupOpen, setDeletePopupOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const handleDeleteService = async () => {
    try {
      const res = await fetch(`${BASE_URL}/deleteservice/${deleteId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      setDeletePopupOpen(false);
      setDeleteId(null);

      fetchServiceRequests();
      window.dispatchEvent(new Event("serviceUpdated"));
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  };
  const filteredRequests = requests.filter((item) => {
    const term = searchTerm.toLowerCase();

    const apartmentMatch = item.apartmentId?.name?.toLowerCase().includes(term);
    const flatMatch = item.flatId?.number?.toString().toLowerCase().includes(term);
    const floorMatch = item.flatId?.floor?.toString().toLowerCase().includes(term);
    const residentMatch = item.createdBy?.name?.toLowerCase().includes(term);

    const matchesSearch = apartmentMatch || flatMatch || floorMatch || residentMatch;
    
    if (activeTab === "Complaints") {
      return matchesSearch && item.type === "Complaint";
    } else {
      return matchesSearch && item.type !== "Complaint";
    }
  });

  const currentRequests = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);


  return (
    <>
      <div className="service">
        <h1>🛠 Service Requests & Complaints</h1>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', padding: '0 20px' }}>
          <button 
            style={{ padding: '8px 16px', cursor: 'pointer', fontWeight: '500', background: activeTab === 'Service Requests' ? '#1e40af' : '#e2e8f0', color: activeTab === 'Service Requests' ? 'white' : '#1e293b', border: 'none', borderRadius: '4px' }}
            onClick={() => { setActiveTab('Service Requests'); setCurrentPage(1); }}
          >
            Service Requests
          </button>
          <button 
            style={{ padding: '8px 16px', cursor: 'pointer', fontWeight: '500', background: activeTab === 'Complaints' ? '#1e40af' : '#e2e8f0', color: activeTab === 'Complaints' ? 'white' : '#1e293b', border: 'none', borderRadius: '4px' }}
            onClick={() => { setActiveTab('Complaints'); setCurrentPage(1); }}
          >
            Complaints
          </button>
        </div>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by Apartment, Flat, Floor, Resident..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page when filtering
            }}
            className="search-input"
          />
        </div>

        <table className="table-responsive">
          <thead>
            <tr>

              <th>Apartment</th>
              <th>Flat</th>
              <th>Floor</th>
              <th>Resident</th>
              <th>Created</th>
              <th>Service</th>
              <th>Vendor</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentRequests.map((item, idx) => (
              <tr key={item._id}>
                <td>{item.apartmentId?.name || "—"}<br /></td>

                <td>{item.flatId?.number || "—"}</td>
                <td>{item.flatId?.floor != null ? item.flatId.floor : "—"}</td>
                <td>{item.createdBy?.name || item.createdBy?.message || "—"}</td>
                <td>{new Date(item.createdAt).toLocaleString()}</td>
                <td>
                  <button
                    className="view-btn"

                    onClick={() => handleViewServiceDetails(item._id)}
                  >
                    View
                  </button>
                </td>
                <td>
                  {item.assignedVendorId ? (
                    <>
                      <div>Assigned to: {item.assignedVendorId.name}</div>
                      <button
                        className="edit-btn"
                        style={{ marginTop: "6px" }}
                        onClick={() => {
                          setAssignPopupOpen(true);
                          setSelectedRequestIndex(idx);
                        }}
                      >
                        Edit
                      </button>
                    </>
                  ) : (
                    <>
                      <div>Not Assigned</div>
                      <button
                        className="assign-btn"
                        onClick={() => {
                          setAssignPopupOpen(true);
                          setSelectedRequestIndex(idx);
                        }}
                      >
                        Assign
                      </button>
                    </>
                  )}
                </td>
                <td style={{ minWidth: '120px' }}>
                  <select 
                    value={item.status || "Pending"} 
                    onChange={(e) => updateServiceStatus(item._id, e.target.value)}
                    style={{
                      padding: '4px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      fontWeight: '500',
                      color:
                        item.status === "InProgress" || item.status === "Assigned"
                          ? "#6495ED"
                          : item.status === "Completed" || item.status?.toLowerCase() === "complete"
                            ? "green"
                            : "gray",
                    }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Assigned">Assigned</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Closed">Closed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => {
                      setDeleteId(item._id);
                      setDeletePopupOpen(true);
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>
      <div className="pagination-container">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
          className="pagination-btn"
        >
          Prev
        </button>

        <span className="pagination-info">Page {currentPage} of {totalPages}</span>

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
          className="pagination-btn"

        >
          Next
        </button>
      </div>

      {viewPopupOpen && selectedRequest && (
        <div className="view-request-popup-overlay">
          <div className="view-request-popup-content">
            <h3>Service Request Details</h3>
            <table className="view-request-details-table">
              <tbody>

                <tr>
                  <th>Resident Name</th>
                  <td>{selectedRequest.createdBy?.name || "—"}</td>
                </tr>

                <tr>
                  <th>Type</th>
                  <td>{selectedRequest.type ?? "—"}</td>
                </tr>
                <tr>
                  <th>Subtype</th>
                  <td>{selectedRequest.subType ?? selectedRequest.subtype ?? "—"}</td>
                </tr>
                <tr>
                  <th>Description</th>
                  <td>{selectedRequest.description ?? "—"}</td>
                </tr>
                <tr>
                  <th>Preferred Time</th>
                  <td>
                    {(selectedRequest.preferredTime &&
                      !isNaN(new Date(selectedRequest.preferredTime).getTime()))
                      ? new Date(selectedRequest.preferredTime).toLocaleString()
                      : "Not specified"}
                  </td>
                </tr>


              </tbody>
            </table>

            {/* Attachments Section */}
            <div className="attachments-section">
              <h4>Attachments:</h4>
              <div className="view-request-attachments">
                {Array.isArray(selectedRequest.attachments) && selectedRequest.attachments.length > 0 ? (
                  selectedRequest.attachments.map((att) => (
                    <a key={att._id} href={att.url} target="_blank" rel="noopener noreferrer">
                      <img src={att.url} alt="attachment" className="attachment-img" />
                    </a>
                  ))
                ) : (
                  <p>No attachments available.</p>
                )}
              </div>
            </div>
            <button className="close"
              onClick={() => {
                setViewPopupOpen(false);
                setSelectedRequest(null);
              }}

            >
              Close
            </button>
          </div>
        </div>
      )}




      {/* Assign Vendor Popup */}
      {
        assignPopupOpen && (
          <div className="popup-overlay">
            <div className="popup-content">
              <h3>Assign Vendor</h3>
              <table className="vendor-popup-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Category</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((vendor) => (
                    <tr key={vendor._id}>
                      <td>{vendor.name}</td>
                      <td>{vendor.phone}</td>
                      <td>{vendor.email}</td>
                      <td>{vendor.category}</td>
                      <td>
                        <button
                          className="assign-btn"
                          onClick={() =>
                            assignVendorAndNotify(requests[selectedRequestIndex]._id, vendor._id)
                          }
                        >
                          Assign
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="popup-buttons">
                <button onClick={() => setAssignPopupOpen(false)} className="cancel-btn">Cancel</button>
              </div>
            </div>
          </div>
        )
      }
      {deletePopupOpen && (
        <div className="popup-overlay">
          <div className="popup-box">

            <h2>Confirm Delete</h2>
            <p>Are you sure you want to delete this notification?</p>

            <div className="form-actions">
              <button
                className="delete-btn"
                onClick={handleDeleteService}
              >
                Yes, Delete
              </button>
              <button
                className="cancel-btn"
                onClick={() => {
                  setDeletePopupOpen(false);
                  setDeleteId(null);
                }}
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default Servicerequest;