import React, { useState, useEffect } from "react";
import "../Styles/Flat.css";
import { BASE_URL } from "../Components/Baseurl";

const Flat = () => {
  const [flats, setFlats] = useState([]);
  const [appartments, setAppartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedFlat, setSelectedFlat] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  

  const [flatData, setFlatData] = useState({
    apartment: "",
    number: "",
    block: "",
    floor: 0,
    flatType: "",
    sizeSqFt: 0,
    parkingSlots: [{ number: "", type: "Car" }],
    isRented: false,
    maintenanceDue: 0,
    status: "",
    lastMaintenancePaidDate: "",
    notes: "",
  });

  //  Fetch flats
  const fetchFlats = async () => {
    try {
      const res = await fetch(`${BASE_URL}/allflats`);
      const data = await res.json();
      setFlats(data.flats || []);
    } catch (err) {
      console.error("Error fetching flats:", err);
    }
  };

  //  Fetch apartments
  const fetchAppartments = async () => {
    try {
      const res = await fetch(`${BASE_URL}/allappartments`);
      const data = await res.json();
      setAppartments(data.appartments || data.data || []);
    } catch (err) {
      console.error("Error fetching appartments:", err);
    }
  };

  useEffect(() => {
    fetchFlats();
    fetchAppartments();
  }, []);

  //  Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFlatData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  //  Parking Slot Handlers
  const handleParkingChange = (index, key, value) => {
    const newParking = [...flatData.parkingSlots];
    newParking[index][key] = value;
    setFlatData((prev) => ({ ...prev, parkingSlots: newParking }));
  };

  const addParkingSlot = () => {
    setFlatData((prev) => ({
      ...prev,
      parkingSlots: [...prev.parkingSlots, { number: "", type: "Car" }],
    }));
  };

  const removeParkingSlot = (index) => {
    const newParking = [...flatData.parkingSlots];
    newParking.splice(index, 1);
    setFlatData((prev) => ({ ...prev, parkingSlots: newParking }));
  };

  //  Create or Update Flat
  const handleSubmit = async () => {
    try {
      const method = editMode ? "PUT" : "POST";
      const endpoint = editMode
        ? `${BASE_URL}/updateflat/${selectedFlat._id}`
        : `${BASE_URL}/createflat`;

      const payload = {
        apartment: flatData.apartment?._id || flatData.apartment,
        number: flatData.number.trim(),
        block: flatData.block.trim(),
        floor: Number(flatData.floor),
        flatType: flatData.flatType,
        sizeSqFt: Number(flatData.sizeSqFt),
        parkingSlots: flatData.parkingSlots
          .filter((p) => p.number && p.number.trim() !== "")
          .map((p) => ({
            number: p.number.trim(),
            type: p.type,
          })),
        isRented: Boolean(flatData.isRented),
        maintenanceDue: Number(flatData.maintenanceDue),
        status: flatData.status || "Vacant",
        lastMaintenancePaidDate: flatData.lastMaintenancePaidDate,
        notes: flatData.notes.trim(),
      };

      console.log(" Sending payload:", payload);

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        alert(
          editMode
            ? " Flat updated successfully!"
            : " Flat created successfully!"
        );
        fetchFlats();
        setShowPopup(false);
      } else {
        console.error("Server error:", data);
        alert(` Failed: ${data.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error(" Error saving flat:", err);
      alert("Error occurred while saving flat");
    }
  };

  const handleEdit = (flat) => {
    setFlatData({
      apartment: flat.apartment?._id || flat.apartment,
      number: flat.number,
      block: flat.block,
      floor: flat.floor,
      flatType: flat.flatType,
      sizeSqFt: flat.sizeSqFt,
      parkingSlots: flat.parkingSlots || [{ number: "", type: "Car" }],
      isRented: flat.isRented,
      maintenanceDue: flat.maintenanceDue,
      status: flat.status,
      lastMaintenancePaidDate: flat.lastMaintenancePaidDate?.slice(0, 10) || "",
      notes: flat.notes,
    });
    setSelectedFlat(flat);
    setEditMode(true);
    setShowPopup(true);
  };

  const handleDelete = async (id) => {
    // if (!window.confirm("Are you sure you want to delete this flat?")) return;
    try {
      const res = await fetch(`${BASE_URL}/deleteflat/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setShowDeletePopup(false);
        setDeleteId(null);
        // alert("Flat deleted successfully!");
        fetchFlats();
      }
    } catch (err) {
      console.error("Error deleting flat:", err);
    }
  };

  const cancelDelete = () => setShowDeletePopup(false);

  const filteredFlats = flats.filter((flat) => {
    const search = searchTerm.toLowerCase();

    return (
      flat.number?.toLowerCase().includes(search) ||                  // Flat Number
      flat.apartment?.name?.toLowerCase().includes(search)           // Apartment Name
    );
  });

const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  // Pagination Logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;

  const currentFlats = filteredFlats.slice(indexOfFirstRow, indexOfLastRow);

  const totalPages = Math.ceil(filteredFlats.length / rowsPerPage);
  return (
    <div className="flat-page">
      <div className="flat-container">
        <h1>Flat Management</h1>

        <div className="filter-searchc">
          <input
            type="text"
            placeholder="Search flat no,appartment name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            className="add-btn"
            onClick={() => {
              setFlatData({
                apartment: "",
                number: "",
                block: "",
                floor: 0,
                flatType: "",
                sizeSqFt: 0,
                parkingSlots: [{ number: "", type: "Car" }],
                isRented: false,
                maintenanceDue: 0,
                status: "",
                lastMaintenancePaidDate: "",
                notes: "",
              });
              setEditMode(false);
              setShowPopup(true);
            }}
          >
            + Add Flat
          </button>
        </div>

        {/*Flats Table */}
        <div class="flat-table-responsive">

          <table className="flat-table">
            <thead className="flat-fix">
              <tr>

                <th>Flat No</th>
                <th>Appartment</th>
                <th>Type</th>
                <th>Status</th>
                <th>Rented</th>
                <th>Floor</th>
                <th>Size</th>
                <th>Actions</th>

              </tr>
            </thead>

            <tbody>
              {currentFlats.map((flat) => (
                <tr key={flat._id}>
                  <td>{flat.number}</td>
                  <td>{flat.apartment?.name || "-"}</td>

                  <td>{flat.flatType}</td>
                  <td>{flat.status}</td>
                  <td>{flat.isRented ? "Yes" : "No"}</td>
                  <td>{flat.floor}</td>
                  <td>{flat.sizeSqFt}</td>
                  <td >


                    <button className="edit-btn" onClick={() => handleEdit(flat)} style={{ margin: "5px" }}>
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => {
                        setDeleteId(flat._id);
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
        </div>
        <div className="pagination-container">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Prev
          </button>

          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>

        {/* 🪟 Popup Form */}
        {showPopup && (
          <div className="popup-overlay">
            <div className="popup-box">
              <h2>{editMode ? "Edit Flat" : "Add New Flat"}</h2>

              <div className="form-grid">
                {/* Apartment Dropdown */}
                <label>Apartment</label>
                <select
                  name="apartment"
                  value={flatData.apartment}
                  onChange={handleChange}
                >
                  <option value="">Select Apartment</option>
                  {appartments.map((apt) => (
                    <option key={apt._id} value={apt._id}>
                      {apt.name} ({apt.location})
                    </option>
                  ))}
                </select>

                <label>Flat Number</label>
                <input
                  name="number"
                  value={flatData.number}
                  onChange={handleChange}
                />

                <label>Block</label>
                <input
                  name="block"
                  value={flatData.block}
                  onChange={handleChange}
                />

                <label>Floor</label>
                <input
                  name="floor"
                  type="number"
                  value={flatData.floor}
                  onChange={handleChange}
                />

                <label>Flat Type</label>
                <select
                  name="flatType"
                  value={flatData.flatType}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option value="1BHK">1BHK</option>
                  <option value="2BHK">2BHK</option>
                  <option value="3BHK">3BHK</option>
                  <option value="Villa">Villa</option>
                  <option value="Penthouse">Penthouse</option>
                </select>

                <label>Size (sqft)</label>
                <input
                  name="sizeSqFt"
                  type="number"
                  value={flatData.sizeSqFt}
                  onChange={handleChange}
                />

                <label>Maintenance Due</label>
                <input
                  name="maintenanceDue"
                  type="number"
                  value={flatData.maintenanceDue}
                  onChange={handleChange}
                />

                <label>Status</label>
                <select
                  name="status"
                  value={flatData.status}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Vacant">Vacant</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                </select>

                <label>Is Rented</label>
                <input
                  type="checkbox"
                  name="isRented"
                  checked={flatData.isRented}
                  onChange={handleChange}
                />

                <label>Last Maintenance Paid Date</label>
                <input
                  type="date"
                  name="lastMaintenancePaidDate"
                  value={flatData.lastMaintenancePaidDate}
                  onChange={handleChange}
                />

                <label>Notes</label>
                <input
                  name="notes"
                  value={flatData.notes}
                  onChange={handleChange}
                ></input>
              </div>

              {/*  Parking Slots */}
              <div className="parking-section">
                <h3>Parking Slots</h3>
                {flatData.parkingSlots.map((slot, index) => (
                  <div key={index} className="parking-row">
                    <input
                      placeholder="Number"
                      value={slot.number}
                      onChange={(e) =>
                        handleParkingChange(index, "number", e.target.value)
                      }
                    />
                    <select
                      value={slot.type}
                      onChange={(e) =>
                        handleParkingChange(index, "type", e.target.value)
                      }
                    >
                      <option value="Car">Car</option>
                      <option value="Bike">Bike</option>
                    </select>
                    {flatData.parkingSlots.length > 1 && (
                      <button onClick={() => removeParkingSlot(index)} className="cancel-btn">
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={addParkingSlot} className="cancel-btn" style={{ margin: "5px 10px" }}>Add Parking Slot</button>
              </div>

              <div className="popup-actions">
                <button
                  className="cancel-btn"
                  onClick={() => setShowPopup(false)}
                >
                  Cancel
                </button>
                <button className="update-btn" onClick={handleSubmit}>
                  {editMode ? "Update" : "Create"}
                </button>

              </div>
            </div>
          </div>
        )}
        {showDeletePopup && (
          <div className="popup-overlay">
            <div className="popup-box">
              <h2>Confirm Delete</h2>
              <p>Are you sure you want to delete this flat?</p>

              <div className="popup-actions">
                <button className="delete-btn" onClick={() => handleDelete(deleteId)}>
                  Yes, Delete
                </button>

                <button
                  className="cancel-btn"
                  onClick={() => {
                    setShowDeletePopup(false);
                    setDeleteId(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Flat;