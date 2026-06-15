import React, { useState, useEffect } from "react";
import "../Styles/Vendor.css";

import { BASE_URL } from "../Components/Baseurl";

const Vendor = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [showServicePopup, setShowServicePopup] = useState(false);
  const [serviceDetails, setServiceDetails] = useState(null);
  const [users, setUsers] = useState([]);
  const [allServices, setAllServices] = useState([]);

  const [newVendor, setNewVendor] = useState({
    createdBy: "",
    name: "",
    phone: "",
    email: "",
    category: "",
    services: "",
    assignments: [{ apartmentId: "", flats: [""] }],
    documents: [{ url: "", type: "" }],
  });

  const [deleteId, setDeleteId] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);

  const fetchAllServices = async () => {
    try {
      const res = await fetch(`${BASE_URL}/allservices`);
      const data = await res.json();
      console.log("All Services Response:", data);
        
      if (data?.success && Array.isArray(data.requests)) {
        setAllServices(data.requests);
      } else {
        setAllServices([]);
      }
    } catch (error) {
      console.error("Failed to fetch services:", error);
    }
  };

  // Fetch vendors
  const fetchVendors = async () => {
    try {
      const response = await fetch(`${BASE_URL}/allvendors`);
      const json = await response.json();
      console.log("Vendor API Response:", json);
      setVendors(Array.isArray(json.vendors) ? json.vendors : []);
    } catch (error) {
      console.error("Failed to fetch vendors:", error);
    }
  };
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/allusers`);
      const data = await res.json();
      setUsers(data.users || data || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const handleStatusChange = async (serviceId, newStatus) => {
    try {
      console.log(`Updating service ${serviceId} → ${newStatus}...`);

      const response = await fetch(
        `${BASE_URL}/updatestatus/${serviceId}/status`,
        {
          method: "PUT",
          headers: { "Content-type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "failed to update service request");
      }

      setServiceDetails((prev) =>
        prev.map((s) => (s._id === serviceId ? { ...s, status: newStatus } : s))
      );
      console.log(`Service ${serviceId} marked as ${newStatus}`);
    } catch (error) {
      console.error(`❌ Failed to update service ${serviceId}:`, error.message);
      alert("Error updating service status. Please try again.");
    }
  };

  useEffect(() => {
    fetchVendors();
    fetchUsers();
    fetchAllServices();
    fetchFeedbacks();
  }, []);

  // Search filter
  const filteredVendor = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Input change (basic fields)
  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setNewVendor((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setSelectedVendor((prev) => ({ ...prev, [name]: value }));
  };

  // Assignment change
  const handleAssignmentChange = (e, index, field, mode = "add") => {
    const { value } = e.target;
    if (mode === "add") {
      setNewVendor((prev) => {
        const updated = [...prev.assignments];
        updated[index][field] =
          field === "flats" ? value.split(",").map((f) => f.trim()) : value;
        return { ...prev, assignments: updated };
      });
    } else {
      setSelectedVendor((prev) => {
        const updated = [...prev.assignments];
        updated[index][field] =
          field === "flats" ? value.split(",").map((f) => f.trim()) : value;
        return { ...prev, assignments: updated };
      });
    }
  };

  const addAssignmentField = (mode = "add") => {
    if (mode === "add") {
      setNewVendor((prev) => ({
        ...prev,
        assignments: [...prev.assignments, { apartmentId: "", flats: [""] }],
      }));
    } else {
      setSelectedVendor((prev) => ({
        ...prev,
        assignments: [...prev.assignments, { apartmentId: "", flats: [""] }],
      }));
    }
  };

  // Document change
  const handleDocumentChange = (e, index, field, mode = "add") => {
    const { value } = e.target;
    if (mode === "add") {
      setNewVendor((prev) => {
        const updated = [...prev.documents];
        updated[index][field] = value;
        return { ...prev, documents: updated };
      });
    } else {
      setSelectedVendor((prev) => {
        const updated = [...prev.documents];
        updated[index][field] = value;
        return { ...prev, documents: updated };
      });
    }
  };

  const addDocumentField = (mode = "add") => {
    if (mode === "add") {
      setNewVendor((prev) => ({
        ...prev,
        documents: [...prev.documents, { url: "", type: "" }],
      }));
    } else {
      setSelectedVendor((prev) => ({
        ...prev,
        documents: [...prev.documents, { url: "", type: "" }],
      }));
    }
  };

  //  Add Vendor
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newVendor,
        createdBy:
          typeof newVendor.createdBy === "object"
            ? newVendor.createdBy._id
            : newVendor.createdBy,

        name: newVendor.name?.trim() || "",
        phone: newVendor.phone?.trim() || "",
        email: newVendor.email?.trim() || "",
        category: newVendor.category?.trim() || "",

        services:
          typeof newVendor.services === "string" &&
          newVendor.services.trim() !== ""
            ? newVendor.services
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],

        assignments: (newVendor.assignments || [])
          .filter(
            (a) =>
              a.apartmentId?.trim() ||
              (Array.isArray(a.flats) && a.flats.length > 0)
          )
          .map((a) => ({
            apartmentId: a.apartmentId?.trim() || null,
            flats: Array.isArray(a.flats)
              ? a.flats.map((f) => String(f).trim()).filter((f) => f)
              : [],
          })),

        documents: (newVendor.documents || [])
          .filter((d) => d.url?.trim() && d.type?.trim())
          .map((d) => ({
            url: d.url.trim(),
            type: d.type.trim(),
          })),
      };

      console.log("Sending Payload:", payload);

      const response = await fetch(`${BASE_URL}/createvendors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("Add Vendor Response:", data);

      if (response.ok && data?.success) {
        alert("Vendor added successfully");
        setShowAddPopup(false);
        setNewVendor({
          createdBy: "",
          name: "",
          phone: "",
          email: "",
          category: "",
          services: "",
          assignments: [{ apartmentId: "", flats: [""] }],
          documents: [{ url: "", type: "" }],
        });
        await fetchVendors();
      } else {
        alert("Failed to add vendor:" + (data?.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Add vendor error:", error);
      alert("Server error while adding vendor");
    }
  };

  // Edit
  const handleEditClick = (vendor) => {
    setSelectedVendor(vendor);
    setShowEditPopup(true);
  };

  // Update Vendor
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedVendor) return alert("No vendor selected");

    try {
      const id = selectedVendor._id || selectedVendor.id;
      const updatedData = {
        ...selectedVendor,
        createdBy:
          typeof selectedVendor.createdBy === "object"
            ? selectedVendor.createdBy._id
            : selectedVendor.createdBy,
      };

      const response = await fetch(`${BASE_URL}/updatevendors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        alert("Vendor updated successfully");
        setShowEditPopup(false);
        fetchVendors();
      } else {
        alert("Failed to update vendor");
      }
    } catch (error) {
      console.error("Update vendor error:", error);
    }
  };

  // Delete
  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowDeletePopup(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`${BASE_URL}/deletevendors/${deleteId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        alert("Vendor deleted successfully");
        setShowDeletePopup(false);
        fetchVendors();
      } else {
        alert("Failed to delete vendor");
      }
    } catch (error) {
      console.error("Delete vendor error:", error);
    }
  };

  const handleViewServiceDetails = async (vendorId) => {
    try {
      if (!Array.isArray(allServices) || allServices.length === 0) {
        console.warn("allServices is empty — fetching again...");
        await fetchAllServices();
      }

      //  finding all service requests that belong to this vendor
      const vendorServices = allServices.filter((s) => {
        const vId =
          s.vendor?._id ||
          s.assignedVendorId?._id ||
          s.vendorId?._id ||
          s.vendorId;
        return String(vId).toLowerCase() === String(vendorId).toLowerCase();
      });

      if (vendorServices.length === 0) {
        console.warn("No service requests found for this vendor");
        setServiceDetails([]);
        setShowServicePopup(true);
        return;
      }

      const detailedRequests = await Promise.all(
        vendorServices.map(async (s) => {
          const res = await fetch(`${BASE_URL}/servicedetails/${s._id}`);
          const data = await res.json();
          return data?.serviceRequest || null;
        })
      );

      const validDetails = detailedRequests.filter(Boolean);
      console.log(
        `Service details fetched for vendor: ${vendorId}`,
        validDetails
      );
      setServiceDetails(validDetails);
      setShowServicePopup(true);
    } catch (error) {
      console.error("Error displaying service details:", error);
      setServiceDetails([]);
      setShowServicePopup(true);
    }
  };

  const cancelDelete = () => setShowDeletePopup(false);

  // Feedback //

  const [feedbacks, setFeedbacks] = useState([]);

  const fetchFeedbacks = async () => {
    try {
      const res = await fetch(`${BASE_URL}/allfeedbacks`);
      const data = await res.json();

      if (data.success) {
        setFeedbacks(data.feedbacks || data.success || []);
      }
    } catch (err) {
      console.error("Failed to fetch feedbacks:", err);
    }
  };

  const getVendorFeedback = (vendorId) => {
    if (!Array.isArray(feedbacks)) return [];

    return feedbacks.filter(
      (f) => String(f.vendorId?._id) === String(vendorId)
    );
  };

  const getVendorAverageRating = (vendorId) => {
    const fb = getVendorFeedback(vendorId);
    if (fb.length === 0) return 0;

    const total = fb.reduce((sum, f) => sum + f.rating, 0);
    return (total / fb.length).toFixed(1);
  };

  const RatingStars = ({ rating }) => {
    return (
      <span>
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            style={{ color: i < rating ? "gold" : "#ccc", fontSize: "20px" }}
          >
            ★
          </span>
        ))}
      </span>
    );
  };

  return (
    <div className="vendor-container">
      <h1 className="page-title">Vendor Management</h1>

      {/* Search + Add */}
      <div className="filter-search">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="add-btn" onClick={() => setShowAddPopup(true)}>
          + Add Vendor
        </button>
      </div>

      {/* Table */}
      <table className="vendor-table">
        <thead>
          <tr>
            <th>Vendor Name</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Category</th>
            <th>Service Type</th>
            <th>Actions</th>
            <th>Residence Details</th>
            <th>Feedback</th>
          </tr>
        </thead>
        <tbody>
          {filteredVendor.map((v) => (
            <tr key={v._id || v.id}>
              <td>{v.name}</td>
              <td>{v.phone}</td>
              <td>{v.email}</td>
              <td>{v.category}</td>
              <td>
                {Array.isArray(v.services) ? v.services.join(", ") : v.services}
              </td>
              <td>
                <button className="edit-btn" onClick={() => handleEditClick(v)} style={{marginBottom:'4px'}}>
                  Edit
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteClick(v._id || v.id)}
                >
                  Delete
                </button>
              </td>
              <td>
                <button
                  className="vendor-view-btn"
                  onClick={() => handleViewServiceDetails(v._id)}
                >
                  View
                </button>
              </td>
              <td>
                {getVendorFeedback(v._id).length === 0 ? (
                  <span style={{ fontSize: "14px" }}>No feedback</span>
                ) : (
                  <>
                    <RatingStars rating={getVendorAverageRating(v._id)} />
                    <div style={{ fontSize: "12px" }}>
                      {getVendorAverageRating(v._id)} (
                      {getVendorFeedback(v._id).length} reviews)
                    </div>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ADD POPUP */}
      {showAddPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h2>Add New Vendor</h2>
            <form className="details-form" onSubmit={handleAddSubmit}>
              <label>
                Created By:
                <select
                  name="createdBy"
                  value={newVendor.createdBy}
                  onChange={handleAddChange}
                  className="form-select"
                >
                  <option value="">Select a user</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Name:
                <input
                  type="text"
                  name="name"
                  value={newVendor.name}
                  onChange={handleAddChange}
                  required
                />
              </label>
              <label>
                Phone:
                <input
                  type="text"
                  name="phone"
                  value={newVendor.phone}
                  onChange={handleAddChange}
                  required
                />
              </label>
              <label>
                Email:
                <input
                  type="email"
                  name="email"
                  value={newVendor.email}
                  onChange={handleAddChange}
                />
              </label>
              <label>
                Category:
                <select
                  type="text"
                  name="category"
                  value={newVendor.category}
                  onChange={handleAddChange}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="individual">Individual</option>
                  <option value="store">Store</option>
                  <option value="supermarket">Supermarket</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="maid">Maid</option>
                  <option value="plumber">Plumber</option>
                  <option value="electrician">Electrician</option>
                </select>
              </label>
              <label>
                Services:
                <input
                  type="text"
                  name="services"
                  value={newVendor.services}
                  onChange={handleAddChange}
                />
              </label>

              {/* Assignments */}
              <h3>Assignments</h3>
              {newVendor.assignments.map((a, i) => (
                <div key={i}>
                  <label>
                    Apartment ID:
                    <input
                      type="text"
                      value={a.apartmentId}
                      onChange={(e) =>
                        handleAssignmentChange(e, i, "apartmentId", "add")
                      }
                    />
                  </label>
                  <label>
                    Flats (comma separated):
                    <input
                      type="text"
                      value={a.flats.join(", ")}
                      onChange={(e) =>
                        handleAssignmentChange(e, i, "flats", "add")
                      }
                    />
                  </label>
                </div>
              ))}
              <button type="button" onClick={() => addAssignmentField("add")}>
                + Add Assignment
              </button>

              {/* Documents */}
              <h3>Documents</h3>
              {newVendor.documents.map((d, i) => (
                <div key={i}>
                  <label>
                    Document URL:
                    <input
                      type="text"
                      value={d.url}
                      onChange={(e) => handleDocumentChange(e, i, "url", "add")}
                    />
                  </label>
                  <label>
                    Type:
                    <input
                      type="text"
                      value={d.type}
                      onChange={(e) =>
                        handleDocumentChange(e, i, "type", "add")
                      }
                    />
                  </label>
                </div>
              ))}
              <button type="button" onClick={() => addDocumentField("add")}>
                + Add Document
              </button>

              <div className="popup-actions">
                <button className="update-btn" type="submit">
                  Add Vendor
                </button>
                <button
                  className="cancel-btn"
                  type="button"
                  onClick={() => setShowAddPopup(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT POPUP */}
      {showEditPopup && selectedVendor && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h2>Edit Vendor</h2>
            <form className="details-form" onSubmit={handleUpdate}>
              <label>
                Created By:
                <select>
                  <input
                    type="text"
                    name="createdBy"
                    value={
                      selectedVendor.createdBy?.role ||
                      selectedVendor.createdBy ||
                      ""
                    }
                    onChange={handleEditChange}
                  />
                  <option value="">Select a user</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Name:
                <input
                  type="text"
                  name="name"
                  value={selectedVendor.name}
                  onChange={handleEditChange}
                />
              </label>
              <label>
                Phone:
                <input
                  type="text"
                  name="phone"
                  value={selectedVendor.phone}
                  onChange={handleEditChange}
                />
              </label>
              <label>
                Email:
                <input
                  type="email"
                  name="email"
                  value={selectedVendor.email}
                  onChange={handleEditChange}
                />
              </label>
              <label>
                Category:
                <select
                  type="text"
                  name="category"
                  value={selectedVendor.category}
                  onChange={handleEditChange}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="individual">Individual</option>
                  <option value="store">Store</option>
                  <option value="supermarket">Supermarket</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="maid">Maid</option>
                  <option value="plumber">Plumber</option>
                  <option value="electrician">Electrician</option>
                </select>
              </label>
              <label>
                Services:
                <input
                  type="text"
                  name="services"
                  value={
                    Array.isArray(selectedVendor.services)
                      ? selectedVendor.services.join(", ")
                      : selectedVendor.services
                  }
                  onChange={handleEditChange}
                />
              </label>

              {/* Edit Assignments */}
              <h3>Assignments</h3>
              {Array.isArray(selectedVendor.assignments) &&
                selectedVendor.assignments.map((a, i) => (
                  <div key={i}>
                    <label>
                      Apartment ID:
                      <input
                        type="text"
                        value={a.apartmentId || ""}
                        onChange={(e) =>
                          handleAssignmentChange(e, i, "apartmentId", "edit")
                        }
                      />
                    </label>
                    <label>
                      Flats:
                      <input
                        type="text"
                        value={a.flats?.join(", ") || ""}
                        onChange={(e) =>
                          handleAssignmentChange(e, i, "flats", "edit")
                        }
                      />
                    </label>
                  </div>
                ))}
              <button type="button" onClick={() => addAssignmentField("edit")}>
                + Add Assignment
              </button>

              {/* Edit Documents */}
              <h3>Documents</h3>
              {Array.isArray(selectedVendor.documents) &&
                selectedVendor.documents.map((d, i) => (
                  <div key={i}>
                    <label>
                      Document URL:
                      <input
                        type="text"
                        value={d.url || ""}
                        onChange={(e) =>
                          handleDocumentChange(e, i, "url", "edit")
                        }
                      />
                    </label>
                    <label>
                      Type:
                      <input
                        type="text"
                        value={d.type || ""}
                        onChange={(e) =>
                          handleDocumentChange(e, i, "type", "edit")
                        }
                      />
                    </label>
                  </div>
                ))}
              <button type="button" onClick={() => addDocumentField("edit")}>
                + Add Document
              </button>

              <div className="popup-actions">
                <button className="update-btn" type="submit">
                  Update Vendor
                </button>
                <button
                  className="cancel-btn"
                  type="button"
                  onClick={() => setShowEditPopup(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {showDeletePopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h2>Confirm Delete</h2>
            <p>Are you sure you want to delete this vendor?</p>
            <div className="popup-actions">
              <button
                className="delete-btn"
                type="button"
                onClick={confirmDelete}
              >
                Yes, Delete
              </button>
              <button
                className="cancel-btn"
                type="button"
                onClick={cancelDelete}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SERVICE DETAILS POPUP */}

      {showServicePopup && serviceDetails && (
        <div className="popup-overlay-service">
          <div className="popup-box-service slide-in">
            <h2 className="popup-title">Service Request Details</h2>

            {Array.isArray(serviceDetails) && serviceDetails.length > 0 ? (
              <table className="modern-table-service">
                <thead>
                  <tr>
                    <th>Resident Name</th>
                    <th>Phone</th>
                    <th>Apartment</th>
                    <th>Flat</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Preferred Time</th>
                    <th>Vendor Name</th>
                    <th>Vendor Phone</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {serviceDetails.map((s, index) => (
                    <tr key={index}>
                      <td>{s.createdBy?.name || "N/A"}</td>
                      <td>{s.createdBy?.phone || "N/A"}</td>
                      <td>
                        {s.apartment ? (
                          <>
                            <span>{s.apartment?.name || "N/A"}</span>
                            <br />
                            <span className="apartment-address">
                              {s.apartment?.address || "No address"}
                            </span>
                          </>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td>{s.flat?.number || "N/A"}</td>
                      <td>{s.description || "N/A"}</td>
                      <td className={`status ${s.status?.toLowerCase()}`}>
                        {s.status || "N/A"}
                      </td>
                      <td>
                        {s.preferredTime
                          ? new Date(s.preferredTime).toLocaleString()
                          : "N/A"}
                      </td>
                      <td>{s.vendor?.name || "N/A"}</td>
                      <td>{s.vendor?.phone || "N/A"}</td>
                      <td>
                        {["pending", "assigned"].includes(
                          s.status?.toLowerCase()
                        ) ? (
                          <>
                            <button
                              className="vendor-accept-btn"
                              onClick={() =>
                                handleStatusChange(s._id, "InProgress")
                              }
                            >
                              Accept
                            </button>
                            {/* <button
															className="vendor-reject-btn"
															onClick={() => handleStatusChange(s._id, "Cancelled")}
														>
															Reject
														</button> */}
                          </>
                        ) : s.status?.toLowerCase() === "inprogress" ? (
                          <>
                            <button
                              className="complete-btn-service"
                              onClick={() =>
                                handleStatusChange(s._id, "Completed")
                              }
                            >
                              Mark Complete
                            </button>
                            <span className="action-note">
                              Work in progress…
                            </span>
                          </>
                        ) : s.status?.toLowerCase() === "completed" ? (
                          <span className="status-badge completed">
                            ✅ Completed
                          </span>
                        ) : s.status?.toLowerCase() === "cancelled" ? (
                          <span className="status-badge cancelled">
                            ❌ Cancelled
                          </span>
                        ) : (
                          <span className="status-badge neutral">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="modern-table-service">
                <thead>
                  <tr>
                    <th>Resident Name</th>
                    <th>Phone</th>
                    <th>Apartment</th>
                    <th>Flat</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Preferred Time</th>
                    <th>Vendor Name</th>
                    <th>Vendor Phone</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="10" className="no-service-message">
                      No service request found
                    </td>
                  </tr>
                </tbody>
              </table>
            )}

            <div
              className="popup-actions-service"
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "flex-end",
				marginTop:'10px'
              }}
            >
              <button
                className="cancel-btn"
                onClick={() => setShowServicePopup(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vendor;