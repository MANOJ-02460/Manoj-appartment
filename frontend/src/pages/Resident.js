import React, { useState, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";
import { BsEmojiSurprise } from "react-icons/bs";
import "../Styles/Resident.css";

import { BASE_URL } from "../Components/Baseurl";

const servicesList = [
  "Electrician",
  "Plumber",
  "Cleaner",
  "Gardener",
  "Security",
  "Painter",
  "Carpenter",
  "Complaint",
];

const Resident = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [residents, setResidents] = useState([]);

  const [deleteId, setDeleteId] = useState(null);

  const [showServicePopup, setShowServicePopup] = useState(false);
  const [selectedResidentForService, setSelectedResidentForService] =
    useState(null);

  const [showServiceDetailPopup, setShowServiceDetailPopup] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [selectedService, setSelectedService] = useState("");

  const [serviceStatuses, setServiceStatuses] = useState({});

  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [showSendNotificationPopup, setShowSendNotificationPopup] =
    useState(false);
  const [residentNotifications, setResidentNotifications] = useState([]);
  const [
    selectedResidentForNotifications,
    setSelectedResidentForNotifications,
  ] = useState(null);

  const [notificationsByResident, setNotificationsByResident] = useState({});

  const [serviceDetails, setServiceDetails] = useState({
    date: "",
    time: "",
    beforeImage: null,
    afterImage: null,
    assignedVendorId: "",
    subType: "",
    description: "",
    createdBy: "",
    flatId: "",
    apartmentId: "",
  });

  const [selectedResident, setSelectedResident] = useState({
    user: "",
    apartment: "",
    flat: "",
    community: "",
    role: "",
    roleInCommittee: "",
    isVerified: false,
    isActive: true,
    joinedDate: new Date().toISOString().split("T")[0],
    emergencyContactname: "",
    emergencyContactphone: "",
  });

  // Fetch all residents
  const fetchResidents = async () => {
    try {
      const response = await fetch(`${BASE_URL}/allresidents`);
      const json = await response.json();
      console.log("Residents fetched:", json);

      if (json.success && Array.isArray(json.residents)) {
        setResidents(json.residents);
      } else {
        setResidents([]);
      }
    } catch (error) {
      console.error("Failed to fetch residents:", error);
    }
  };

  useEffect(() => {
    fetchResidents();
  }, []);

  // Search Filter
  const filteredResidents = residents.filter((r) => {
    const name = r.user?.name?.toLowerCase() || "";
    const apartment = r.apartment?.name?.toLowerCase() || "";
    const flat = r.flat?.number?.toLowerCase() || "";
    const role = r.role?.toLowerCase() || "";
    const community = r.community?.name?.toLowerCase() || "";
    return (
      name.includes(searchTerm.toLowerCase()) ||
      apartment.includes(searchTerm.toLowerCase()) ||
      flat.includes(searchTerm.toLowerCase()) ||
      community.includes(searchTerm.toLowerCase()) ||
      role.includes(searchTerm.toLowerCase())
    );
  });

  // Handle input changes
  const handleAddChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewResident((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSelectedResident((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Add Resident
  const [newResident, setNewResident] = useState({
    user: "",
    apartment: "",
    flat: "",
    community: "",
    role: "",
    roleInCommittee: "",
    isVerified: false,
    isActive: false,
    joinedDate: "",
    emergencyContactname: "",
    emergencyContactphone: "",
  });

  const handleAddSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${BASE_URL}/createresident`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newResident),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Resident added successfully!");
        setShowAddPopup(false);
        fetchResidents();
        setNewResident({
          user: "",
          apartment: "",
          flat: "",
          community: "",
          role: "",
          roleInCommittee: "",
          isVerified: false,
          isActive: false,
          joinedDate: "",
          emergencyContactname: "",
          emergencyContactphone: "",
        });
      } else {
        alert(data.message || "Failed to add resident");
      }
    } catch (err) {
      console.error("Error adding resident:", err);
      alert("An error occurred while adding the resident.");
    }
  };

  // Edit Resident
  const handleEditClick = (resident) => {
    setSelectedResident({
      _id: resident._id || "",
      user: resident.user?._id || "",
      apartment: resident.apartment?._id || "",
      flat: resident.flat?._id || "",
      community: resident.community?._id || "",
      role: resident.role || "",
      roleInCommittee: resident.roleInCommittee || "",
      isVerified: !!resident.isVerified,
      isActive: !!resident.isActive,
      joinedDate: resident.joinedDate
        ? resident.joinedDate.split("T")[0]
        : new Date().toISOString().split("T")[0],
      emergencyContactname: resident.emergencyContact?.name || "",
      emergencyContactphone: resident.emergencyContact?.phone || "",
    });
    setShowEditPopup(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const id = selectedResident._id;
      const payload = {
        ...selectedResident,
        emergencyContact: {
          name: selectedResident.emergencyContactname,
          phone: selectedResident.emergencyContactphone,
        },
      };

      const response = await fetch(`${BASE_URL}/updateresident/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("Update Response:", data);

      if (response.ok) {
        alert("Resident updated successfully");
        setShowEditPopup(false);
        fetchResidents();
      } else {
        alert(data.message || "Failed to update resident");
      }
    } catch (error) {
      console.error("Update resident error:", error);
    }
  };

  // Delete Resident
  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowDeletePopup(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`${BASE_URL}/deleteresident/${deleteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Resident deleted successfully");
        setShowDeletePopup(false);
        fetchResidents();
      } else {
        alert("Failed to delete resident");
      }
    } catch (error) {
      console.error("Delete resident error:", error);
    }
  };

  const cancelDelete = () => setShowDeletePopup(false);

  // Open service selection popup
  const handleServiceRequestClick = (resident) => {
    setSelectedResidentForService(resident);
    setShowServicePopup(true);
  };

  // On selecting a service from list
  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setShowServicePopup(false);
    setServiceDetails({
      date: "",
      time: "",
      beforeImage: null,
      afterImage: null,
    });
    setShowServiceDetailPopup(true);
  };

  // Handle form changes including file inputs

  // Handle form changes including file inputs
  const handleServiceDetailChange = (e) => {
    const { name, value, files, type } = e.target;
    setServiceDetails((prev) => ({
      ...prev,
      [name]: type === "file" ? files[0] : value,
    }));
  };

  // Submit handler
  const handleServiceSubmit = async (e) => {
    e.preventDefault();

    // Use dropdown values first, fallback to selectedResidentForService
    const flatId =
      serviceDetails.flatId || selectedResidentForService?.flat?._id;
    const apartmentId =
      serviceDetails.apartmentId || selectedResidentForService?.apartment?._id;
    const createdBy =
      serviceDetails.userId || selectedResidentForService?.user?._id;

    if (!flatId) {
      alert("Flat is required for the service request.");
      return;
    }
    if (!apartmentId) {
      alert("Apartment is required for the service request.");
      return;
    }

    const payload = {
      // date: serviceDetails.date,
      // time: serviceDetails.time,
      preferredTime: `${serviceDetails.date} ${serviceDetails.time}`,
      type: selectedService,
      subType: serviceDetails.subType,
      description: serviceDetails.description,
      attachments: [
        { url: "https://example.com/image1.jpg" },
        { url: "https://example.com/image2.jpg" },
      ],
      flatId,
      apartmentId,
      createdBy,
    };

    console.log("Submitting service payload:", payload);

    try {
      const response = await fetch(`${BASE_URL}/createservice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log("Service create response:", result);

      if (response.ok) {
        alert("Service request submitted successfully");
        // Reset form

        setServiceStatuses((prev) => ({
          ...prev,
          [selectedResidentForService._id]: "Pending",
        }));
        setShowServiceDetailPopup(false);
        setSelectedResidentForService(null);
        setSelectedService("");
        setServiceDetails({
          date: "",
          time: "",
          beforeImage: null,
          afterImage: null,
          subType: "",
          description: "",
          userId: "",
          flatId: "",
          apartmentId: "",
        });
      } else {
        alert(result.message || "Failed to submit service request");
      }
    } catch (error) {
      console.error("Error submitting service request:", error);
      alert("Error submitting service request");
    }
  };

  // fetch allservices
  // Add this state near your other useStates
  // const [vendorAssignments, setVendorAssignments] = useState({});

  // stauts for update

  // status code

  // Fetch notifications for a specific resident
  // ✅ Fetch and show notifications for one resident
  const handleViewNotifications = async (resident) => {
    try {
      const userId = resident.user?._id || resident._id;
      if (!userId) {
        alert("User ID not found for this resident.");
        return;
      }

      setSelectedResidentForNotifications(resident);
      setShowNotificationPopup(true);

      const response = await fetch(
        `${BASE_URL}/specificNotification/${userId}`
      );
      const data = await response.json();

      if (!response.ok) {
        console.warn("No notifications found or error fetching.");
        setResidentNotifications([]);
        return;
      }

      const allNotes = data.notifications || data.data || data || [];
      const filteredNotes = Array.isArray(allNotes)
        ? allNotes.filter(
            (n) => n.toUser?._id === userId || n.toUser === userId
          )
        : [];

      setResidentNotifications(filteredNotes);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setResidentNotifications([]);
    }
  };

  // delete notification

  const handleDeleteNotification = async (notificationId) => {
    try {
      const response = await fetch(
        `${BASE_URL}/deletenotification/${notificationId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        alert("Notification deleted successfully");
        // Refresh list
        if (selectedResidentForNotifications) {
          const res = await fetch(
            `${BASE_URL}/onenotification/${selectedResidentForNotifications._id}`
          );
          const data = await res.json();
          setResidentNotifications(data.notifications || []);
        }
      } else {
        alert("Failed to delete notification");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const [users, setUsers] = useState([]);
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${BASE_URL}/allusers`);
        const data = await res.json();
        const usersArray = Array.isArray(data)
          ? data
          : Array.isArray(data.users)
          ? data.users
          : Array.isArray(data.data)
          ? data.data
          : [];

        setUsers(usersArray);
      } catch (err) {
        console.error("Error fetching users:", err);
        setUsers([]);
      }
    };

    fetchUsers();
  }, []);

  // fetch flats appatments community //
  const [flat, setFlats] = useState([]);
  const [appartments, setAppartments] = useState([]);
  const [community, setCommunity] = useState([]);
  const fetchFlats = async () => {
    try {
      const res = await fetch(`${BASE_URL}/allflats`);
      const data = await res.json();
      setFlats(data.flats || []);
    } catch (err) {
      console.error("Error fetching flats:", err);
    }
  };

  const fetchAppartments = async () => {
    try {
      const res = await fetch(`${BASE_URL}/allappartments`);
      const data = await res.json();
      setAppartments(data.appartments || data.data || []);
    } catch (err) {
      console.error("Error fetching appartments:", err);
    }
  };

  const fetchcommunity = async () => {
    try {
      const res = await fetch(`${BASE_URL}/getAllCommunity`);
      const data = await res.json();
      setCommunity(data.communities || data.data || []);
    } catch (err) {
      console.error("Error fetching appartments:", err);
    }
  };

  useEffect(() => {
    fetchFlats();
    fetchAppartments();
    fetchcommunity();
  }, []);

  useEffect(() => {
    const fetchAllNotifications = async () => {
      try {
        const response = await fetch(`${BASE_URL}/allnotifications`);
        const data = await response.json();
        if (response.ok && Array.isArray(data.notifications)) {
          const grouped = data.notifications.reduce((acc, note) => {
            const userId = note.toUser?._id || note.toUser;
            if (!userId) return acc;
            if (!acc[userId]) acc[userId] = [];
            acc[userId].push(note);
            return acc;
          }, {});
          setNotificationsByResident(grouped);
        } else {
          setNotificationsByResident({});
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        setNotificationsByResident({});
      }
    };

    fetchAllNotifications();
  }, []);

  const [notificationsMessage, setNotificationsMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleEmojiClick = (emojiData) => {
    setNotificationMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false); // hide picker after selecting
  };

  const [notificationMessage, setNotificationMessage] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("firebase"); // 👈 new
  const [selectedRole, setSelectedRole] = useState(""); // 👈 optional if needed
  const [title, setTitle] = useState("Manual Notification"); // 👈 custom title

  const handleSendNotification = async () => {
    try {
      if (!notificationMessage.trim()) {
        alert("Please enter a message before sending.");
        return;
      }

      if (!selectedUserId) {
        alert("No user selected to send notification.");
        return;
      }

      const payload = {
        toUser: selectedUserId,
        toRole: selectedRole || "User",
        title,
        body: notificationMessage,
        payload: { sentBy: "manual", timestamp: new Date() },
        channel: selectedChannel,
        status: "queued",
        sentAt: new Date(),
      };

      const response = await fetch(`${BASE_URL}/createnotification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to send notification");

      alert("✅ Notification sent successfully!");
      setNotificationMessage("");
      setShowSendNotificationPopup(false);
    } catch (error) {
      console.error("Error sending notification:", error);
      alert("❌ Failed to send notification");
    }
  };

  const [residentServiceMap, setResidentServiceMap] = useState({});

  // Then replace your existing fetchServices() with this version:
  const fetchServices = async () => {
    try {
      const res = await fetch(`${BASE_URL}/allservices`);
      const data = await res.json();

      const serviceMap = {}; // 👈 This will store which vendors are assigned to which residents

      if (Array.isArray(data.requests)) {
        data.requests.forEach((service) => {
          const flatId = service.flatId?._id;

          if (flatId) {
            serviceMap[flatId] = service._id;
          }
        });
      }

      // ✅ Update your React state here

      setResidentServiceMap(serviceMap); // 👈 THIS IS WHERE YOU ADD IT
    } catch (error) {
      console.error("Failed to fetch services:", error);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const [serviceStatus, setServiceStatus] = useState({});
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
      console.log(data.success);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "failed to update service request");
      }
      setServiceStatus((prev) => ({
        ...prev,
        [serviceId]: newStatus,
      }));

      alert(`Service ${serviceId} marked as ${newStatus}`);
    } catch (error) {
      console.error(`❌ Failed to update service ${serviceId}:`, error.message);
      alert("Error updating service status. Please try again.");
    }
  };

  // ✅ Fetch vendor by service ID
  const [vendorDetails, setVendorDetails] = useState(null);
  const [showVendorPopup, setShowVendorPopup] = useState(false);
  // ✅ Fetch vendor assigned to resident's service
  const handleViewVendors = async (resident) => {
    try {
      const flatId = resident.flat?._id;
      if (!flatId) {
        alert("Flat ID missing for this resident.");
      }

      const serviceId = residentServiceMap[flatId];

      if (!serviceId) {
        alert("No Service request found for this resident.");
        return;
      }

      const res = await fetch(`${BASE_URL}/servicedetails/${serviceId}`);
      const data = await res.json();

      if (!data.success || !data.serviceRequest) {
        alert("Service details not found.");
        return;
      }
      const vendor = data.serviceRequest.vendor;

      if (!vendor) {
        alert("vendor not assigned by admin to this resident.");
        return;
      }

      // Save vendor details for popup
      setVendorDetails(vendor);
      setShowVendorPopup(true);
    } catch (err) {
      console.error("Error fetching vendor details:", err);
      alert("Error fetching vendor details");
    }
  };

  const closePopup = () => {
    setShowVendorPopup(false);
    setVendorDetails(null);
  };

  // Feedback form states and handlers

  const [showFeedback, setShowFeedback] = useState(false);
  // const [selectedResidentId, setSelectedResidentId] = useState(null);
  const [defaultUserName, setDefaultUserName] = useState("");

  const [feedbackData, setFeedbackData] = useState({
    serviceRequestId: "", // will set this when opening the form
    rating: 5,
    comment: "",
    givenBy: "",
  });

  // Open feedback form
  const openFeedbackForm = (serviceRequestId, residentId, userName) => {
    setFeedbackData({
      serviceRequestId,
      givenBy: residentId,
      rating: 1,
      comment: "",
    });

    setDefaultUserName(userName); // <-- store username for showing in input
    setShowFeedback(true);
  };

  // Handle input changes
  const handleChange = (e) => {
    setFeedbackData({
      ...feedbackData,
      [e.target.name]: e.target.value,
    });
  };

  // Submit feedback
  const submitFeedback = async () => {
    try {
      const payload = {
        serviceRequestId: feedbackData.serviceRequestId,
        rating: feedbackData.rating,
        comment: feedbackData.comment,
        givenBy: feedbackData.givenBy,
      };

      console.log("FINAL PAYLOAD:", payload);

      const res = await fetch(`${BASE_URL}/createfeedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        alert("Feedback saved successfully!");
        setShowFeedback(false);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting feedback");
    }
  };

  // Handle rating click
  const handleStarClick = (value) => {
    setFeedbackData((prev) => ({
      ...prev,
      rating: value,
    }));
  };

  return (
    <div className="resident-container">
      <h1 className="page-title">Resident Management</h1>

      {/* Search + Add */}
      <div className="filter-search">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="add-btn" onClick={() => setShowAddPopup(true)}>
          + Add Resident
        </button>
      </div>

      {/* Table */}
      <div className="table-wrapper" >
      <table className="resident-table">
        <thead>
          <tr>
            <th>Community</th>
            <th>Apartment</th>
            <th>Flat</th>
            <th>Name</th>
            {/* <th>Email</th> */}
            {/* <th>Phone</th> */}
            {/* <th>Role</th>
            <th>Committee Role</th> */}
            {/* <th>Active</th> */}
            <th>Joined Date</th>
            <th>Services</th>
            <th>Status</th>
            <th>Notification</th>
            <th>Vendor Notification</th>
            <th>Emergency Contact</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredResidents.length > 0 ? (
            filteredResidents.map((res) => (
              <tr key={res._id} className="residentdispaly">
                <td>{res.community?.name || "N/A"}</td>
                <td>{res.apartment?.name || "N/A"}</td>
                <td>{res.flat?.number || "N/A"}</td>
                <td>{res.user?.name || "N/A"}</td>
                {/* <td>{res.user?.email || "N/A"}</td> */}
                {/* <td>{res.user?.phone || "N/A"}</td> */}
                {/* <td>{res.role || "N/A"}</td>
                <td>{res.roleInCommittee || "N/A"}</td> */}
                {/* <td>{res.isActive ? "✅" : "❌"}</td> */}
                <td>
                  {res.joinedDate
                    ? new Date(res.joinedDate).toLocaleDateString()
                    : "N/A"}
                </td>
                <td className="services">
                  <button
                    className="request-btn"
                    onClick={() => handleServiceRequestClick(res)}
                  >
                    Request
                  </button>

                  <div>
                    <button
                      onClick={() =>
                        openFeedbackForm(
                          residentServiceMap[res.flat?._id], // service request ID
                          res.user?._id, // user ID of this resident
                          res.user?.name || "" // resident name
                        )
                      }
                      className="feedback-btn"
                    >
                      Rating
                    </button>
                  </div>
                </td>

                <td>
                  {(() => {
                    const flatId = res.flat?._id;
                    const info = residentServiceMap[flatId];

                    if (!info) return "No Request";

                    const label =
                      serviceStatus[info.serviceId] || info.status || "Pending";

                    return (
                      <div>
                        {/* STATUS DISPLAY */}
                        <span>{label === "Completed" ? "Closed" : label}</span>

                        {/* Pending → Cancel */}
                        {label === "Pending" && (
                          <button
                            className="cancel-btn"
                            onClick={() =>
                              handleStatusChange(info.serviceId, "Cancelled")
                            }
                          >
                            Cancel
                          </button>
                        )}

                        {/* InProgress → Mark Completed */}
                        {label === "InProgress" && (
                          <button
                            className="statusupdate-btn"
                            onClick={() =>
                              handleStatusChange(info.serviceId, "Completed")
                            }
                          >
                            Mark Completed
                          </button>
                        )}

                        {/* Completed → No Buttons */}
                        {label === "Completed" && null}

                        {/* Cancelled → No Buttons */}
                        {label === "Cancelled" && null}
                      </div>
                    );
                  })()}
                </td>

                <td className="actions" >
                  <button
                    className="view-btn"
                    onClick={() => handleViewNotifications(res)}
                    style={{marginBottom:'4px'}}
                  >
                    View
                  </button>
                  <button
                    className="update-btn"
                    onClick={() => {
                      setSelectedResidentForNotifications(res);
                      setSelectedUserId(res.user?._id || res._id);
                      setShowSendNotificationPopup(true);
                    }}
                    
                  >
                    Send
                  </button>
                </td>

                <td>
                  <button onClick={() => handleViewVendors(res)} className="view-btn">
                    View
                  </button>
                </td>

                <td>
                  {res.emergencyContact?.name} <br />
                  {res.emergencyContact?.phone}
                </td>
                <td className="actions">
                  <button
                    className="edit-btn"
                    style={{marginBottom:'4px'}}
                    onClick={() => handleEditClick(res)}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteClick(res._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="14" style={{ textAlign: "center" }}>
                No residents found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      </div>

      {showNotificationPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h2>
              Notifications for{" "}
              {selectedResidentForNotifications?.user?.name || "Resident"}
            </h2>

            {loadingNotifications ? (
              <p>Loading notifications...</p>
            ) : residentNotifications.length > 0 ? (
              <ul className="notification-list">
                {residentNotifications.map((note, index) => (
                  <li key={note._id || index} className="notification-item">
                    <span>
                      <strong>Title:</strong> {note.title}
                    </span>
                    <br />
                    <span>
                      <strong>Description:</strong> {note.body}
                    </span>
                    <br />
                    <span>
                      <strong>Date:</strong>{" "}
                      {new Date(note.createdAt).toLocaleString()}
                    </span>
                    <br />
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteNotification(note._id)}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No notifications found</p>
            )}

            <div className="notifiction-btn">
              <button
                onClick={() => {
                  setShowNotificationPopup(false);
                  setResidentNotifications([]);
                }}
                className="cancel-btn"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showSendNotificationPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h2>
              Send Notification to{" "}
              {selectedResidentForNotifications?.user?.name || "Resident"}
            </h2>

            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">-- Select User --</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Enter notification title"
              className="notification-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
            >
              <option value="firebase">Firebase</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
            </select>

            <div className="textarea-container">
              <textarea
                className="notification-textarea"
                placeholder="Type a message..."
                value={notificationsMessage}
                onChange={(e) => setNotificationsMessage(e.target.value)}
              />

              <div className="textarea-actions">
                <button
                  type="button"
                  className="emoji-btn"
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                >
                  <BsEmojiSurprise size={24} color="black" />
                </button>

                {showEmojiPicker && (
                  <div className="emoji-picker-box">
                    <EmojiPicker onEmojiClick={handleEmojiClick} />
                  </div>
                )}
              </div>
            </div>

            <div className="notifiction-btn">
              <button
                onClick={() => {
                  setShowSendNotificationPopup(false);
                  setNotificationMessage("");
                }}
                className="cancel-btn"
              >
                Close
              </button>

              <button onClick={handleSendNotification} className="update-btn">Send</button>
            </div>
          </div>
        </div>
      )}

      {showFeedback && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h3>Give Feedback</h3>
            <input
              type="text"
              value={defaultUserName}
              onChange={(e) => setDefaultUserName(e.target.value)}
            />

            <label>Rating:</label>

            <div style={{ fontSize: "24px", cursor: "pointer" }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => handleStarClick(star)}
                  style={{
                    color: star <= feedbackData.rating ? "gold" : "#ccc",
                    marginRight: "5px",
                  }}
                >
                  ★
                </span>
              ))}
            </div>

            <label>Comment:</label>
            <textarea
              name="comment"
              value={feedbackData.comment}
              onChange={handleChange}
              placeholder="Write your feedback..."
            />

            <button onClick={submitFeedback} className="update-btn">Submit</button>
            <button onClick={() => setShowFeedback(false)} className="cancel-btn">Cancel</button>
          </div>
        </div>
      )}

      {/* Services selection popup */}
      {showServicePopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h2>Select a Service or Complaint</h2>
            <ul className="service-list">
              {servicesList.map((service) => (
                <li key={service}>
                  <button
                    className="service-option"
                    onClick={() => handleServiceSelect(service)}
                  >
                    {service}
                  </button>
                </li>
              ))}
            </ul>
            <button onClick={() => setShowServicePopup(false)} className="cancel-btn">Cancel</button>
          </div>
        </div>
      )}

      {/* Service detail popup */}
      {showServiceDetailPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h2>Submit Request: {selectedService}</h2>
            <form onSubmit={handleServiceSubmit} className="details-form">
              <label>
                {" "}
                Date
                <input
                  type="date"
                  name="date"
                  value={serviceDetails.date}
                  onChange={handleServiceDetailChange}
                />
              </label>

              <label>
                {" "}
                Time :
                <input
                  type="time"
                  name="time"
                  value={serviceDetails.time}
                  onChange={handleServiceDetailChange}
                />
              </label>

              <select
                name="userId"
                value={serviceDetails.userId}
                onChange={handleServiceDetailChange}
              >
                <option value="">User</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name}
                  </option>
                ))}
              </select>

              <select
                name="flatId"
                value={serviceDetails.flatId}
                onChange={handleServiceDetailChange}
              >
                <option value="">Select Flat</option>
                {flat.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.number}
                  </option>
                ))}
              </select>

              <select
                name="apartmentId"
                value={serviceDetails.apartmentId}
                onChange={handleServiceDetailChange}
              >
                <option value="">Select Apartment</option>
                {appartments.map((apt) => (
                  <option key={apt._id} value={apt._id}>
                    {apt.name}
                  </option>
                ))}
              </select>

              <label>
                Sub Type
                <input
                  type="text"
                  name="subType"
                  value={serviceDetails.subType}
                  onChange={handleServiceDetailChange}
                />
              </label>

              <label>
                {" "}
                Description
                <textarea
                  name="description"
                  value={serviceDetails.description}
                  onChange={handleServiceDetailChange}
                />
              </label>

              <label>
                Before Image:
                <input
                  type="file"
                  name="beforeImage"
                  accept="image/*"
                  onChange={handleServiceDetailChange}
                />
              </label>
              <label>
                After Image:
                <input
                  type="file"
                  name="afterImage"
                  accept="image/*"
                  onChange={handleServiceDetailChange}
                />
              </label>
              <div className="popup-actions">
                <button type="submit" className="update-btn">
                  Submit Request
                </button>
                <button
                  type="button"
                  onClick={() => setShowServiceDetailPopup(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* {//vendors details//} */}
      {showVendorPopup && vendorDetails && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h3>Assigned Vendor</h3>

            <p>
              <strong>Name:</strong> {vendorDetails.name}
            </p>
            <p>
              <strong>Phone:</strong> {vendorDetails.phone}
            </p>
            <p>
              <strong>Category:</strong> {vendorDetails.category}
            </p>
            <p>
              <strong>Service:</strong> {vendorDetails.services}
            </p>

            <button onClick={closePopup} className="cancel-btn">Close</button>
          </div>
        </div>
      )}

      {/*  Add Popup */}
      {showAddPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h2>Add New Resident</h2>
            <form onSubmit={handleAddSubmit} className="details-form">
              <select
                name="user"
                value={newResident.user}
                onChange={handleAddChange}
                required
              >
                <option value="">User</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name}
                  </option>
                ))}
              </select>
              <select
                name="apartment"
                value={newResident.apartment}
                onChange={handleAddChange}
                required
              >
                <option value="">Apartment</option>
                {appartments.map((apt) => (
                  <option key={apt._id} value={apt._id}>
                    {apt.name}
                  </option>
                ))}
              </select>

              <select
                name="flat"
                value={newResident.flat}
                onChange={handleAddChange}
                required
              >
                <option value="">Flat</option>
                {flat.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.number}
                  </option>
                ))}
              </select>

              <select
                name="community"
                value={newResident.community}
                onChange={handleAddChange}
                required
              >
                <option value="">Community</option>
                {community.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                name="role"
                value={newResident.role}
                onChange={handleAddChange}
                required
              >
                <option>Role</option>
                <option>Owner</option>
                <option>Tenant</option>
              </select>

              <select
                name="roleInCommittee"
                placeholder="Committee Role"
                value={newResident.roleInCommittee}
                onChange={handleAddChange}
              >
                <option>President</option>
                <option>Treasure</option>
                <option>None</option>
              </select>
              <label>
                <input
                  type="checkbox"
                  name="isVerified"
                  checked={newResident.isVerified}
                  onChange={handleAddChange}
                />
                Verified
              </label>
              <label>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={newResident.isActive}
                  onChange={handleAddChange}
                />
                Active
              </label>
              <input
                type="date"
                name="joinedDate"
                value={newResident.joinedDate}
                onChange={handleAddChange}
              />
              <input
                name="emergencyContactname"
                placeholder="Emergency Contact Name"
                value={newResident.emergencyContactname}
                onChange={handleAddChange}
              />
              <input
                name="emergencyContactphone"
                placeholder="Emergency Contact Phone"
                value={newResident.emergencyContactphone}
                onChange={handleAddChange}
              />
              <div className="popup-actions">
                <button type="submit" className="update-btn">
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddPopup(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Popup */}
      {showEditPopup && selectedResident && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h2>Edit Resident</h2>
            <form onSubmit={handleUpdate} className="details-form">
              <input
                name="user"
                placeholder="User ID"
                value={selectedResident.user ?? ""}
                onChange={handleEditChange}
              />
              <select
                name="apartment"
                value={selectedResident.apartment}
                onChange={handleAddChange}
                required
              >
                <option value="">Apartment</option>
                {appartments.map((apt) => (
                  <option key={apt._id} value={apt._id}>
                    {apt.name}
                  </option>
                ))}
              </select>

              <select
                name="flat"
                value={selectedResident.flat}
                onChange={handleAddChange}
                required
              >
                <option value="">Flat</option>
                {flat.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.number}
                  </option>
                ))}
              </select>

              <select
                name="community"
                value={selectedResident.community}
                onChange={handleAddChange}
                required
              >
                <option value="">Community</option>
                {community.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <input
                name="role"
                placeholder="Role"
                value={selectedResident.role ?? ""}
                onChange={handleEditChange}
              />
              <input
                name="roleInCommittee"
                placeholder="Committee Role"
                value={selectedResident.roleInCommittee ?? ""}
                onChange={handleEditChange}
              />
              <input
                type="date"
                name="joinedDate"
                value={selectedResident.joinedDate ?? ""}
                onChange={handleEditChange}
              />
              <input
                name="emergencyContactname"
                placeholder="Emergency Contact Name"
                value={selectedResident.emergencyContactname ?? ""}
                onChange={handleEditChange}
              />
              <input
                name="emergencyContactphone"
                placeholder="Emergency Contact Phone"
                value={selectedResident.emergencyContactphone ?? ""}
                onChange={handleEditChange}
              />

              <input
                type="checkbox"
                name="isVerified"
                checked={!!selectedResident.isVerified}
                onChange={handleEditChange}
              />
              
              <input
                type="checkbox"
                name="isActive"
                checked={!!selectedResident.isActive}
                onChange={handleEditChange}
              />

              <div className="popup-actions">
                <button type="submit" className="update-btn">
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditPopup(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*  Delete Popup */}
      {showDeletePopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h2>Confirm Delete</h2>
            <p>Are you sure you want to delete this resident?</p>
            <div className="popup-actions">
              <button className="delete-btn" onClick={confirmDelete}>
                Yes, Delete
              </button>
              <button className="cancel-btn" onClick={cancelDelete}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resident;