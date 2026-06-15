import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import "../Styles/Notification.css";
import { BsEmojiSmileFill } from 'react-icons/bs';
import { AiOutlineSend } from 'react-icons/ai';
import { BiSolidMessage } from 'react-icons/bi';
import { currentUser } from "../Service/Auth";
import { BASE_URL } from "../Components/Baseurl";

const Notification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = currentUser(); // Get current logged-in user

  const [activeTab, setActiveTab] = useState("send");
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [messageTitle, setMessageTitle] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [files, setFiles] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [descriptionPopupOpen, setDescriptionPopupOpen] = useState(false);
  const [selectedDescriptionMessage, setSelectedDescriptionMessage] = useState(null);
  const [replyText, setReplyText] = useState("");

  // Fetch users and notifications
  useEffect(() => {
    fetchUsers();
    fetchNotifications();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/allresidents`);
      const data = await res.json();
      const residents = data.residents || [];
      const userList = residents.map((r) => {
        const id = r.user?._id || r._id;
        const name = r.user?.name || r.emergencyContact?.name || "Unknown";
        const role = r.user?.role || r.role || "Resident";
        return { _id: id, name, role };
      });
      setUsers(userList);
    } catch (error) {
      console.error("Failed to fetch residents:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${BASE_URL}/allnotifications`);
      const data = await res.json();

      const notifications = data.notifications || data || [];

      // Sort by createdAt 
      notifications.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setMessages(notifications);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  //  Handle navigation from Navbar - switch to received tab
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // SEND MESSAGE
  const sendMessage = async () => {
    if (!messageTitle || !messageBody) {
      alert("Please fill in all required fields.");
      return;
    }
    if (selectedUsers.length === 0) {
      alert("Please select at least one user!");
      return;
    }

    try {
      for (const userId of selectedUsers) {
        const newMessage = {
          fromUser: user._id,
          toUser: userId,
          title: messageTitle,
          body: messageBody,
          status: "queued",
        };

        console.log("📤 Sending message:", newMessage);

        await fetch(`${BASE_URL}/createnotification`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newMessage),
        });
      }

      alert("✅ Notification(s) sent successfully!");
      setMessageTitle("");
      setMessageBody("");
      setSelectedUsers([]);
      setSelectAll(false);
      setFiles([]);
      fetchNotifications();
    } catch (error) {
      console.error("Failed to send messages:", error);
      alert("❌ Failed to send some notifications.");
    }
  };

  // DELETE NOTIFICATION
  const deleteNotification = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) return;
    try {
      await fetch(`${BASE_URL}/deletenotification/${id}`, { method: "DELETE" });
      alert("Notification deleted.");
      fetchNotifications();
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };


  const sendReply = async (messageId, replyBody) => {
    try {
      // Find the original message
      const originalMessage = messages.find(m => m._id === messageId);

      if (!originalMessage) {
        alert("❌ Original message not found");
        return false;
      }

      // console.log("📧 Original Message:", originalMessage);
      // console.log("👤 Current User:", user);


      const senderUserId = originalMessage.fromUser?._id || originalMessage.fromUser;
      const senderName = originalMessage.fromUser?.name || "Unknown Sender";

      let replyToUserId = senderUserId;
      let replyToName = senderName;

      if (!senderUserId || senderUserId === user._id) {
        replyToUserId = originalMessage.toUser?._id || originalMessage.toUser;
        replyToName = originalMessage.toUser?.name || "Unknown User";
      }

      console.log("📤 Replying to:", replyToName, "ID:", replyToUserId);
      const replyNotification = {
        fromUser: user._id,
        toUser: replyToUserId,
        title: `Re: ${originalMessage.title}`,
        body: replyBody,
        status: "queued",
        replyTo: messageId,
        channel: "firebase"
      };

      console.log("📨 Reply Payload:", replyNotification);

      const res = await fetch(`${BASE_URL}/createnotification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(replyNotification),
      });

      const result = await res.json();
      console.log("✅ API Response:", result);

      if (!res.ok) {
        throw new Error(result.message || "Failed to send reply");
      }

      alert(`✅ Reply sent to ${replyToName} successfully!`);
      fetchNotifications();
      return true;
    } catch (error) {
      console.error("❌ Reply Error:", error);
      alert(`❌ Failed to send reply: ${error.message}`);
      return false;
    }
  };

  // FILE & EMOJI
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onEmojiClick = (emojiData) => {
    setMessageBody((prev) => prev + emojiData.emoji);
  };

  const onReplyEmojiClick = (emojiData) => {
    setReplyText((prev) => prev + emojiData.emoji);
  };

  // CLOSE DROPDOWN OUTSIDE
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper to get sender name for display
  const getSenderName = (msg) => {
    if (msg.fromUser?.name) return msg.fromUser.name;
    if (msg.fromUser) return "Unknown User";
    return "System";
  };

  return (
    <div className="nc">

      {/* TABS */}
      <div className="tabs">
        <button
          className={activeTab === "send" ? "active" : ""}
          onClick={() => setActiveTab("send")}
        >
          Send Message
        </button>
        <button
          className={activeTab === "received" ? "active" : ""}
          onClick={() => setActiveTab("received")}
        >
          Received Messages
        </button>
      </div>

      {activeTab === "send" && (

        <div className="send-tab">
          <h2> <AiOutlineSend style={{ paddingTop: "7px" }} /> Send Messages</h2>

          <div className="notification-form" ref={dropdownRef}>
            <div className="dropdown-wrapper">
              <div
                className="dropdown-header"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                {selectedUsers.length === 0
                  ? "Select Residents"
                  : `${selectedUsers.length} Selected`}
                <span className={`arrow ${dropdownOpen ? "up" : "down"}`}></span>
              </div>
              {dropdownOpen && (
                <div className="dropdown-box">
                  <label className="select-all">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSelectAll(checked);
                        setSelectedUsers(checked ? users.map((u) => u._id) : []);
                      }}
                    />
                    Select All
                  </label>
                  <div className="user-list">
                    {users.map((user) => (
                      <label key={user._id} className="user-item">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user._id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            if (checked) {
                              setSelectedUsers([...selectedUsers, user._id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter((id) => id !== user._id));
                              setSelectAll(false);
                            }
                          }}
                        />
                        <span>{user.name} <em>({user.role})</em></span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <input
              type="text"
              placeholder="Notification Title"
              value={messageTitle}
              onChange={(e) => setMessageTitle(e.target.value)}
            />




            <div className="message-input-container">
              <div className="textarea-wrapper">

                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                >
                  <BsEmojiSmileFill />
                </button>

                <label htmlFor="fileUpload" className="icon-btn">📎</label>
                <input
                  id="fileUpload"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />

                <textarea
                  placeholder="Type a message"
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                />
              </div>

              {showEmojiPicker && (
                <div className="emoji-picker-popup">
                  <EmojiPicker onEmojiClick={onEmojiClick} height={400} width={400} />
                </div>
              )}
            </div>

            {files.length > 0 && (
              <div className="file-preview">
                {files.map((file, i) => (
                  <div key={i} className="file-item">
                    {file.name}
                  </div>
                ))}
              </div>
            )}
            <button onClick={sendMessage} className="middle1" >Send Message</button>
          </div>

        </div>

      )}

      {activeTab === "received" && (
        <div className="received-tab">
          <h2><BiSolidMessage style={{ paddingTop: "7px" }} /> Received Messages</h2>
          <table>
            <thead>
              <tr>

                <th>User</th>
                <th>Title</th>
                <th>Description</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((msg) => (
                <tr key={msg._id}>

                  <td>{msg.toUser?.name || "—"}</td>
                  <td>{msg.title || "—"}</td>
                  <td>



                    <button
                      className="view-btn"
                      onClick={async () => {
                        setSelectedDescriptionMessage(msg);
                        setDescriptionPopupOpen(true);

                        // ✅ Mark notification as read in backend
                        try {
                          if (!msg.read && !msg.is_read) {

                            await fetch(`${BASE_URL}/notifications/${ msg._id }/read`, { method: "PUT" });
                            // locally update state so UI updates instantly
                            setMessages(prev =>
                              prev.map(n => n._id === msg._id ? { ...n, read: true } : n)
                            );
                          }
                        } catch (error) {
                          console.error("Failed to mark as read:", error);
                        }
                      }}
                    >
                      View
                    </button>






                  </td>
                  <td>{new Date(msg.createdAt).toLocaleString()}</td>
                  <td>
                    <button className="delete-btn" onClick={() => deleteNotification(msg._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DESCRIPTION POPUP */}
      {descriptionPopupOpen && selectedDescriptionMessage && (
        <div className="notification-popup-overlay">
          <div className="notification-popup-content">
            <h3>Message Details</h3>
            <p><strong>Title:</strong> {selectedDescriptionMessage.title}</p>

            <p><strong>USER:</strong> {selectedDescriptionMessage.toUser?.name || user.name}</p>
            <p><strong>Date:</strong> {new Date(selectedDescriptionMessage.createdAt).toLocaleString()}</p>
            <p><strong>Message:</strong></p>
            <div className="description-box">{selectedDescriptionMessage.body}</div>

            <div className="reply-section">
              <h4>Reply to {getSenderName(selectedDescriptionMessage)}</h4>

              <div className="reply-section">

                <div className="textarea-wrapper">

                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                  >
                    <BsEmojiSmileFill />
                  </button>

                  <label htmlFor="fileUpload" className="icon-btn">📎</label>
                  <input
                    id="fileUpload"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                  <textarea
                    placeholder="Type your reply here..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                </div>
                {showEmojiPicker && (
                  <div className="emoji-picker-popup">
                    <EmojiPicker onEmojiClick={onReplyEmojiClick} height={400} width={340} />
                  </div>)}
                <div className="popup-buttons">

                  <button
                    onClick={() => {
                      if (!replyText.trim()) {
                        alert("Please enter a reply message");
                        return;
                      }
                      sendReply(selectedDescriptionMessage._id, replyText);
                      setReplyText("");
                      setDescriptionPopupOpen(false);
                    }}
                  >
                    Send Reply

                  </button>
                  <button onClick={() => setDescriptionPopupOpen(false)}>Close</button>

                </div>
              </div>


            </div>
          </div>
        </div>

      )}
    </div>
  );
};

export default Notification;

// import React, { useState, useEffect, useRef } from "react";
// import { BrowserRouter, useLocation, useNavigate } from "react-router-dom";

// import EmojiPicker from "emoji-picker-react";
// import "../Styles/Notification.css";
// import { BsEmojiSmileFill } from 'react-icons/bs';
// import { AiOutlineSend } from 'react-icons/ai';
// import { BiSolidMessage } from 'react-icons/bi';
// import { currentUser } from "../Service/Auth";
// import { Link } from "react-router-dom";
// import { BASE_URL } from "../Components/Baseurl";

// const Notification = ({ serviceRequestPath }) => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const user = currentUser(); // Get current logged-in user

//   const [mainActiveTab, setMainActiveTab] = useState("notifications"); // Main tabs
//   const [notifActiveTab, setNotifActiveTab] = useState("send"); // Nested tabs inside Notifications

//   const [users, setUsers] = useState([]);
//   const [messages, setMessages] = useState([]);
//   const [selectedUsers, setSelectedUsers] = useState([]);
//   const [selectAll, setSelectAll] = useState(false);
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const dropdownRef = useRef(null);

//   const [messageTitle, setMessageTitle] = useState("");
//   const [messageBody, setMessageBody] = useState("");
//   const [files, setFiles] = useState([]);
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);

//   const [descriptionPopupOpen, setDescriptionPopupOpen] = useState(false);
//   const [selectedDescriptionMessage, setSelectedDescriptionMessage] = useState(null);
//   const [replyText, setReplyText] = useState("");

//   // Fetch users and notifications on mount
//   useEffect(() => {
//     fetchUsers();
//     fetchNotifications();
//   }, []);

//   const fetchUsers = async () => {
//     try {
//       const res = await fetch(`${BASE_URL}/allresidents`);
//       const data = await res.json();
//       const residents = data.residents || [];
//       const userList = residents.map((r) => {
//         const id = r.user?._id || r._id;
//         const name = r.user?.name || r.emergencyContact?.name || "Unknown";
//         const role = r.user?.role || r.role || "Resident";
//         return { _id: id, name, role };
//       });
//       setUsers(userList);
//     } catch (error) {
//       console.error("Failed to fetch residents:", error);
//     }
//   };

//   const fetchNotifications = async () => {
//     try {
//       const res = await fetch(`${BASE_URL}/allnotifications`);
//       const data = await res.json();

//       const notifications = data.notifications || data || [];

//       notifications.sort(
//         (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
//       );

//       setMessages(notifications);
//     } catch (error) {
//       console.error("Failed to fetch notifications:", error);
//     }
//   };

//   // Handle navigation from Navbar - switch to received tab if needed
//   useEffect(() => {
//     if (location.state?.activeTab) {
//       setNotifActiveTab(location.state.activeTab);
//       setMainActiveTab("notifications");
//       navigate(location.pathname, { replace: true, state: {} });
//     }
//   }, [location.state, navigate, location.pathname]);

//   // Send message logic
//   const sendMessage = async () => {
//     if (!messageTitle || !messageBody) {
//       alert("Please fill in all required fields.");
//       return;
//     }
//     if (selectedUsers.length === 0) {
//       alert("Please select at least one user!");
//       return;
//     }

//     try {
//       for (const userId of selectedUsers) {
//         const newMessage = {
//           fromUser: user._id,
//           toUser: userId,
//           title: messageTitle,
//           body: messageBody,
//           status: "queued",
//         };

//         console.log("📤 Sending message:", newMessage);

//         await fetch(`${BASE_URL}/createnotification`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(newMessage),
//         });
//       }

//       alert("✅ Notification(s) sent successfully!");
//       setMessageTitle("");
//       setMessageBody("");
//       setSelectedUsers([]);
//       setSelectAll(false);
//       setFiles([]);
//       fetchNotifications();
//     } catch (error) {
//       console.error("Failed to send messages:", error);
//       alert("❌ Failed to send some notifications.");
//     }
//   };

//   // Delete notification
//   const deleteNotification = async (id) => {
//     if (!window.confirm("Are you sure you want to delete this notification?")) return;
//     try {
//       await fetch(`${BASE_URL}/deletenotification/${id}`, { method: "DELETE" });
//       alert("Notification deleted.");
//       fetchNotifications();
//     } catch (error) {
//       console.error("Failed to delete notification:", error);
//     }
//   };

//   // Send reply to a message
//   const sendReply = async (messageId, replyBody) => {
//     try {
//       const originalMessage = messages.find(m => m._id === messageId);

//       if (!originalMessage) {
//         alert("❌ Original message not found");
//         return false;
//       }

//       const senderUserId = originalMessage.fromUser?._id || originalMessage.fromUser;
//       const senderName = originalMessage.fromUser?.name || "Unknown Sender";

//       let replyToUserId = senderUserId;
//       let replyToName = senderName;

//       if (!senderUserId || senderUserId === user._id) {
//         replyToUserId = originalMessage.toUser?._id || originalMessage.toUser;
//         replyToName = originalMessage.toUser?.name || "Unknown User";
//       }

//       console.log("📤 Replying to:", replyToName, "ID:", replyToUserId);
//       const replyNotification = {
//         fromUser: user._id,
//         toUser: replyToUserId,
//         title: `Re: ${originalMessage.title}`,
//         body: replyBody,
//         status: "queued",
//         replyTo: messageId,
//         channel: "firebase"
//       };

//       console.log("📨 Reply Payload:", replyNotification);

//       const res = await fetch(`${BASE_URL}/createnotification`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(replyNotification),
//       });

//       const result = await res.json();
//       console.log("✅ API Response:", result);

//       if (!res.ok) {
//         throw new Error(result.message || "Failed to send reply");
//       }

//       alert(`✅ Reply sent to ${replyToName} successfully!`);
//       fetchNotifications();
//       return true;
//     } catch (error) {
//       console.error("❌ Reply Error:", error);
//       alert(`❌ Failed to send reply: ${error.message}`);
//       return false;
//     }
//   };

//   // File & emoji handlers
//   const handleFileChange = (e) => {
//     const newFiles = Array.from(e.target.files);
//     setFiles((prev) => [...prev, ...newFiles]);
//   };

//   const removeFile = (index) => {
//     setFiles((prev) => prev.filter((_, i) => i !== index));
//   };

//   const onEmojiClick = (emojiData) => {
//     setMessageBody((prev) => prev + emojiData.emoji);
//   };

//   const onReplyEmojiClick = (emojiData) => {
//     setReplyText((prev) => prev + emojiData.emoji);
//   };

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
//         setDropdownOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // Helper to get sender name for display
//   const getSenderName = (msg) => {
//     if (msg.fromUser?.name) return msg.fromUser.name;
//     if (msg.fromUser) return "Unknown User";
//     return "System";
//   };

//   return (
//     <div className="nc">
//       {/* MAIN TABS */}
//       <div className="main-tabs">
//         <button
//           className={mainActiveTab === "notifications" ? "active" : ""}
//           onClick={() => setMainActiveTab("notifications")}
//         >
//           Notifications
//         </button>
//         <button
//           className={mainActiveTab === "serviceRequests" ? "active" : ""}
//           onClick={() => {
//             setMainActiveTab("serviceRequests");
//             navigate("/dashboard/service-requests");
//           }}
//         >
//           Service Requests
//         </button>

//       </div>

//       {mainActiveTab === "notifications" && (
//         <>
//           {/* NESTED TABS */}
//           <div className="tabs">
//             <button
//               className={notifActiveTab === "send" ? "active" : ""}
//               onClick={() => setNotifActiveTab("send")}
//             >
//               Send Message
//             </button>
//             <button
//               className={notifActiveTab === "received" ? "active" : ""}
//               onClick={() => setNotifActiveTab("received")}
//             >
//               Received Messages
//             </button>
//           </div>

//           {notifActiveTab === "send" && (
//             <div className="send-tab">
//               <h2><AiOutlineSend style={{ paddingTop: "7px" }} /> Send Messages</h2>

//               <div className="notification-form" ref={dropdownRef}>
//                 <div className="dropdown-wrapper">
//                   <div
//                     className="dropdown-header"
//                     onClick={() => setDropdownOpen(!dropdownOpen)}
//                   >
//                     {selectedUsers.length === 0
//                       ? "Select Residents"
//                       : `${selectedUsers.length} Selected`}
//                     <span className={`arrow ${dropdownOpen ? "up" : "down"}`}></span>
//                   </div>
//                   {dropdownOpen && (
//                     <div className="dropdown-box">
//                       <label className="select-all">
//                         <input
//                           type="checkbox"
//                           checked={selectAll}
//                           onChange={(e) => {
//                             const checked = e.target.checked;
//                             setSelectAll(checked);
//                             setSelectedUsers(checked ? users.map((u) => u._id) : []);
//                           }}
//                         />
//                         Select All
//                       </label>
//                       <div className="user-list">
//                         {users.map((user) => (
//                           <label key={user._id} className="user-item">
//                             <input
//                               type="checkbox"
//                               checked={selectedUsers.includes(user._id)}
//                               onChange={(e) => {
//                                 const checked = e.target.checked;
//                                 if (checked) {
//                                   setSelectedUsers([...selectedUsers, user._id]);
//                                 } else {
//                                   setSelectedUsers(selectedUsers.filter((id) => id !== user._id));
//                                   setSelectAll(false);
//                                 }
//                               }}
//                             />
//                             <span>{user.name} <em>({user.role})</em></span>
//                           </label>
//                         ))}
//                       </div>
//                     </div>
//                   )}
//                 </div>

//                 <input
//                   type="text"
//                   placeholder="Notification Title"
//                   value={messageTitle}
//                   onChange={(e) => setMessageTitle(e.target.value)}
//                 />

//                 <div className="message-input-container">
//                   <div className="textarea-wrapper">
//                     <button
//                       type="button"
//                       className="icon-btn"
//                       onClick={() => setShowEmojiPicker((prev) => !prev)}
//                     >
//                       <BsEmojiSmileFill />
//                     </button>

//                     <label htmlFor="fileUpload" className="icon-btn">📎</label>
//                     <input
//                       id="fileUpload"
//                       type="file"
//                       multiple
//                       onChange={handleFileChange}
//                       style={{ display: "none" }}
//                     />

//                     <textarea
//                       placeholder="Type a message"
//                       value={messageBody}
//                       onChange={(e) => setMessageBody(e.target.value)}
//                     />
//                   </div>

//                   {showEmojiPicker && (
//                     <div className="emoji-picker-popup">
//                       <EmojiPicker onEmojiClick={onEmojiClick} height={400} width={400} />
//                     </div>
//                   )}
//                 </div>

//                 {files.length > 0 && (
//                   <div className="file-preview">
//                     {files.map((file, i) => (
//                       <div key={i} className="file-item">
//                         {file.name}
//                       </div>
//                     ))}
//                   </div>
//                 )}
//                 <button onClick={sendMessage} className="middle1">Send Message</button>
//               </div>
//             </div>
//           )}

//           {notifActiveTab === "received" && (
//             <div className="received-tab">
//               <h2><BiSolidMessage style={{ paddingTop: "7px" }} /> Received Messages</h2>
//               <table>
//                 <thead>
//                   <tr>
//                     <th>User</th>
//                     <th>Title</th>
//                     <th>Description</th>
//                     <th>Created</th>
//                     <th>Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {messages.map((msg) => (
//                     <tr key={msg._id}>
//                       <td>{msg.toUser?.name || "—"}</td>
//                       <td>{msg.title || "—"}</td>
//                       <td>
//                         <button
//                           className="view-btn"
//                           onClick={async () => {
//                             setSelectedDescriptionMessage(msg);
//                             setDescriptionPopupOpen(true);

//                             try {
//                               if (!msg.read && !msg.is_read) {
//                                 await fetch(`${BASE_URL}/notifications/${msg._id}/read`, { method: "PUT" });
//                                 setMessages(prev =>
//                                   prev.map(n => n._id === msg._id ? { ...n, read: true } : n)
//                                 );
//                               }
//                             } catch (error) {
//                               console.error("Failed to mark as read:", error);
//                             }
//                           }}
//                         >
//                           View
//                         </button>
//                       </td>
//                       <td>{new Date(msg.createdAt).toLocaleString()}</td>
//                       <td>
//                         <button className="delete-btn" onClick={() => deleteNotification(msg._id)}>Delete</button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </>
//       )}

//       {mainActiveTab === "serviceRequests" && (
//         <div className="service-requests-tab">
//           {/* {serviceRequestPath ? (
//             <iframe
//               src={serviceRequestPath}
//               title="Service Requests"
//               style={{ width: "100%", height: "600px", border: "none" }}
//             />
//           ) : (
//             <p>Service Requests content goes here.</p>
//           )} */}



//         </div>
//       )}

//       {/* DESCRIPTION POPUP */}
//       {descriptionPopupOpen && selectedDescriptionMessage && (
//         <div className="notification-popup-overlay">
//           <div className="notification-popup-content">
//             <h3>Message Details</h3>
//             <p><strong>Title:</strong> {selectedDescriptionMessage.title}</p>
//             <p><strong>USER:</strong> {selectedDescriptionMessage.toUser?.name || user.name}</p>
//             <p><strong>Date:</strong> {new Date(selectedDescriptionMessage.createdAt).toLocaleString()}</p>
//             <p><strong>Message:</strong></p>
//             <div className="description-box">{selectedDescriptionMessage.body}</div>

//             <div className="reply-section">
//               <h4>Reply to {getSenderName(selectedDescriptionMessage)}</h4>

//               <div className="reply-section">
//                 <div className="textarea-wrapper">
//                   <button
//                     type="button"
//                     className="icon-btn"
//                     onClick={() => setShowEmojiPicker((prev) => !prev)}
//                   >
//                     <BsEmojiSmileFill />
//                   </button>

//                   <label htmlFor="fileUpload" className="icon-btn">📎</label>
//                   <input
//                     id="fileUpload"
//                     type="file"
//                     multiple
//                     onChange={handleFileChange}
//                     style={{ display: "none" }}
//                   />
//                   <textarea
//                     placeholder="Type your reply here..."
//                     value={replyText}
//                     onChange={(e) => setReplyText(e.target.value)}
//                   />
//                 </div>
//                 {showEmojiPicker && (
//                   <div className="emoji-picker-popup">
//                     <EmojiPicker onEmojiClick={onReplyEmojiClick} height={400} width={340} />
//                   </div>
//                 )}
//                 <div className="popup-buttons">
//                   <button
//                     onClick={() => {
//                       if (!replyText.trim()) {
//                         alert("Please enter a reply message");
//                         return;
//                       }
//                       sendReply(selectedDescriptionMessage._id, replyText);
//                       setReplyText("");
//                       setDescriptionPopupOpen(false);
//                     }}
//                   >
//                     Send Reply
//                   </button>
//                   <button onClick={() => setDescriptionPopupOpen(false)}>Close</button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//     </div>
//   );
// };

// export default Notification;  
