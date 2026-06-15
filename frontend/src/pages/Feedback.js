

import React, { useState, useEffect } from "react";
import '../Styles/Feedback.css';
import { BASE_URL } from "../Components/Baseurl";


const Feedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch all feedbacks
  const fetchFeedbacks = async () => {
    try {
      const response = await fetch(`${BASE_URL}/allfeedbacks`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();

      setFeedbacks(data.feedbacks || []);
    } catch (error) {
      console.error('Failed to fetch feedbacks:', error);
      setFeedbacks([]);
    }
  };

  // Fetch single feedback by ID
  const fetchFeedbackById = async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/onefeedback/${id}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      const feedbackData = data.feedback || data;
      setSelectedFeedback(feedbackData);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
      setSelectedFeedback(null);
      setIsModalOpen(false);
    }
  };

  // Delete feedback by ID
  const handleDelete = async (id) => {
    // Show confirmation dialog
    const isConfirmed = window.confirm("Are you sure you want to delete this feedback?");
    if (!isConfirmed) {
      return; // User cancelled, do not proceed
    }

    try {
      const response = await fetch(`${BASE_URL}/deletefeedback/${id}`, {
        method: 'DELETE',
      });

      console.log("Delete response status:", response.status);
      if (response.ok) {
        setFeedbacks(prev => prev.filter(f => f._id !== id));
        if (selectedFeedback && selectedFeedback._id === id) {
          setSelectedFeedback(null);
          setIsModalOpen(false);
        }
      } else {
        const errorData = await response.text();
        console.error('Delete failed:', errorData);
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
    }
  };


  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFeedback(null);
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);



  return (
    <div className="feedback-container">
      <h1 className="page-title">Feedback Management</h1>
      <table className="feedback-table">
        <thead>
          <tr>
            <th>vendor</th>
            <th>Resident</th>
            <th>Rating</th>
            <th>Feedback</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {feedbacks.map(f => (
            <tr key={f._id}>
              <td>{f.vendorId?.name || "N/A"}</td>
              <td>{f.givenBy?.name || "N/A"} </td>

              <td>
                <span className={`rating rating-${f.rating}`}>
                  {"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)}
                </span>
              </td>
              <td>
                <button className="view-btn" onClick={() => fetchFeedbackById(f._id)}>View</button>
              </td>
              <td>
                <button className="delete-btn" onClick={() => handleDelete(f._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>

      </table>

      {/* Popup Modal */}

      {selectedFeedback && (
        <div className="popup-overlay" onClick={closeModal}>
          <div className="popup-box" onClick={e => e.stopPropagation()}>
            <h2>Feedback Details</h2>
            <table className="feedback-table">
              <tbody>
                <tr>
                  <th>Vendor</th>
                  <td>
                    {selectedFeedback.vendorId?.name || "N/A"}
                  </td>
                </tr>
                <tr>
                  <th>Given By</th>
                  <td>
                    {selectedFeedback.givenBy?.name || "N/A"} ({selectedFeedback.givenBy?.role || "N/A"})
                  </td>
                </tr>
                <tr>
                  <th>Service Request</th>
                  <td>
                    {selectedFeedback.serviceRequestId?.type || "N/A"}({selectedFeedback.serviceRequestId?.subType || "N/A"})
                  </td>
                </tr>


                <tr>
                  <th>Rating</th>
                  <td>{selectedFeedback.rating || "N/A"}</td>
                </tr>
                <tr>
                  <th>Comment</th>
                  <td>{selectedFeedback.comment || "N/A"}</td>
                </tr>
                <tr>
                  <th>Given At</th>
                  <td>
                    {selectedFeedback.givenAt ? new Date(selectedFeedback.givenAt).toLocaleString() : "N/A"}
                  </td>
                </tr>
              </tbody>
            </table>
            <button className="close-button" onClick={closeModal}>Close</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Feedback;
