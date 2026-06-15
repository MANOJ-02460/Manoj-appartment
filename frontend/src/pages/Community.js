


import React, { useState, useEffect } from "react";
import { FaBuilding, FaHome, FaUsers, FaArrowLeft, FaCreativeCommonsPdAlt } from "react-icons/fa";
import { HiOutlineLocationMarker } from 'react-icons/hi';
import "../Styles/Community.css";
import { BASE_URL } from "../Components/Baseurl";

const Community = () => {
    const [showTabs, setShowTabs] = useState(false);
    const [activeTab, setActiveTab] = useState("community");
    const [selectedCommunityId, setSelectedCommunityId] = useState(null);

    // COMMUNITY STATE
    const [searchTermCommunity, setSearchTermCommunity] = useState("");
    const [communities, setCommunities] = useState([]);
    const [adminsList, setAdminsList] = useState([]);
    const [showFlatsPopup, setShowFlatsPopup] = useState(false);
    const [flatsToView, setFlatsToView] = useState([]);
    // Pagination //
    const [communityPage, setCommunityPage] = useState(1);
    const [apartmentPage, setApartmentPage] = useState(1);
    const itemsPerPage = 5;

    const [showAddCommunityPopup, setShowAddCommunityPopup] = useState(false);
    const [newCommunity, setNewCommunity] = useState({
        name: "",
        address: "",
        location: "",
        description: "",
        admins: [],
        contactInfo: { phone: "", email: "", website: "" },
        facilities: [],
        image: "",
        totalFlats: 0,
        residentsCount: 0,

    });

    const [showEditCommunityPopup, setShowEditCommunityPopup] = useState(false);
    const [selectedCommunity, setSelectedCommunity] = useState(null);
    const [deleteCommunityId, setDeleteCommunityId] = useState(null);
    const [showDeleteCommunityPopup, setShowDeleteCommunityPopup] = useState(false);

    // APARTMENT STATE
    const [searchTermApartment, setSearchTermApartment] = useState("");
    const [apartments, setApartments] = useState([]);
    const [residents, setResidents] = useState([]);

    const [showAddApartmentPopup, setShowAddApartmentPopup] = useState(false);
    const [showEditApartmentPopup, setShowEditApartmentPopup] = useState(false);
    const [showDeleteApartmentPopup, setShowDeleteApartmentPopup] = useState(false);
    const [newApartment, setNewApartment] = useState({
        community: "",
        name: "",
        address: "",
        location: "",
        blocks: "",
        totalFlats: "",
        maintenance: "",
        bankDetails: { accountName: "", accountNumber: "", ifscCode: "" }
    });


    const [selectedApartment, setSelectedApartment] = useState(null);
    const [deleteApartmentId, setDeleteApartmentId] = useState(null);

    // FETCH DATA
    const fetchCommunities = async () => {
        try {
            const response = await fetch(`${BASE_URL}/getAllCommunity`);
            const data = await response.json();
            if (data.success && data.communities) {
                setCommunities(data.communities || []);
            }
        } catch (error) {
            console.error("Failed to fetch communities:", error);
        }
    };

    const fetchAdmins = async () => {
        try {
            const res = await fetch(`${BASE_URL}/allusers`);
            const data = await res.json();
            if (data.success) setAdminsList(data.users || []);
        } catch (err) {
            console.error("Failed to fetch admins:", err);
        }
    };

    const fetchApartments = async () => {
        try {
            const response = await fetch(`${BASE_URL}/allappartments`);
            const json = await response.json();
            setApartments(Array.isArray(json.data) ? json.data : []);
        } catch (error) {
            console.error("Failed to fetch apartments:", error);
        }
    };

    const fetchResidents = async () => {
        try {
            const response = await fetch(`${BASE_URL}/allresidents`);
            const json = await response.json();

            let residentsData = [];
            if (json.success && Array.isArray(json.residents)) {
                residentsData = json.residents;
            } else if (Array.isArray(json.data)) {
                residentsData = json.data;
            }

            setResidents(residentsData);
        } catch (error) {
            console.error("Failed to fetch residents:", error);
            setResidents([]);
        }
    };
    // Add this with your other state declarations
    const [flats, setFlats] = useState([]);

    // Add this fetch function
    const fetchFlats = async () => {
        try {
            const response = await fetch(`${BASE_URL}/allflats`);
            const json = await response.json();

            let flatsData = [];
            if (json.success && Array.isArray(json.flats)) {
                flatsData = json.flats;
            } else if (Array.isArray(json.data)) {
                flatsData = json.data;
            } else if (Array.isArray(json)) {
                flatsData = json;
            }

            setFlats(flatsData);
        } catch (error) {
            console.error("Failed to fetch flats:", error);
            setFlats([]);
        }
    };

    // Update your useEffect to include fetchFlats
    useEffect(() => {
        fetchCommunities();
        fetchAdmins();
        fetchApartments();
        fetchResidents();
        fetchFlats();
    }, []);




    // Calculate stats for each community
    // Calculate stats for each community
    const getCommunityStats = (communityId) => {
        const communityApartments = apartments.filter(
            (apt) => apt.community?._id === communityId || apt.community === communityId
        );

        const totalApartments = communityApartments.length;

        // Get apartment IDs for this community
        const apartmentIds = communityApartments.map(apt => apt._id);

        // Count flats that belong to these apartments
        const totalFlats = flats.filter(
            (flat) => apartmentIds.includes(flat.apartment?._id || flat.apartment || flat.appartment?._id || flat.appartment)
        ).length;

        // Count residents by checking if their apartment belongs to this community
        const totalResidents = residents.filter(
            (resident) => {
                const residentAptId = resident.apartment?._id || resident.apartment;
                return apartmentIds.includes(residentAptId);
            }
        ).length;

        return { totalApartments, totalFlats, totalResidents };
    };


    const handleCardClick = (communityId) => {
        setSelectedCommunityId(communityId);
        setActiveTab("community");
        setShowTabs(true);

        setTimeout(() => {
            document.getElementById("tab-section")?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }, 100);
    };

    const handleBackToCards = () => {
        setShowTabs(false);
        setSelectedCommunityId(null);

        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }, 100);
    };

    // COMMUNITY HANDLERS
    const filteredCommunities = (communities || []).filter(
        (c) =>
            c.name?.toLowerCase().includes(searchTermCommunity.toLowerCase()) ||
            c.location?.toLowerCase().includes(searchTermCommunity.toLowerCase()) ||
            (c.admins || []).some((admin) =>
                admin.name?.toLowerCase().includes(searchTermCommunity.toLowerCase())
            )
    );
    // Pagination //

    const totalCommunityPages = Math.ceil(filteredCommunities.length / itemsPerPage);
    const paginatedCommunities = filteredCommunities.slice(
        (communityPage - 1) * itemsPerPage,
        communityPage * itemsPerPage
    );

    const handleAddCommunityChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith("contactInfo.")) {
            const key = name.split(".")[1];
            setNewCommunity((prev) => ({
                ...prev,
                contactInfo: { ...prev.contactInfo, [key]: value },
            }));
        } else if (name === "facilities") {
            setNewCommunity((prev) => ({
                ...prev,
                facilities: value
                    .split(",")
                    .map((f) => f.trim())
                    .filter((f) => f),
            }));
        } else if (name === "admins") {
            setNewCommunity((prev) => ({ ...prev, admins: [value] }));
        } else if (name === "totalFlats" || name === "residentsCount") {
            // Convert to number
            setNewCommunity((prev) => ({ ...prev, [name]: Number(value) || 0 }));
        } else {
            setNewCommunity((prev) => ({ ...prev, [name]: value }));
        }
    };




    const handleAddCommunitySubmit = async () => {
        try {
            const response = await fetch(`${BASE_URL}/createCommunity`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newCommunity),
            });

            if (response.ok) {
                alert("Community added successfully");
                setShowAddCommunityPopup(false);
                setNewCommunity({
                    name: "",
                    address: "",
                    location: "",
                    description: "",
                    admins: [],
                    contactInfo: { phone: "", email: "", website: "" },
                    facilities: [],
                    image: "",
                    totalFlats: 0,
                    residentsCount: 0,

                });
                fetchCommunities();
            } else {
                alert("Failed to add community");
            }
        } catch (err) {
            console.error(err);
        }
    };


    const handleEditCommunityClick = (community) => {
        setSelectedCommunity({
            ...community,
            admins: community.admins?.length > 0 ? (community.admins[0]._id || community.admins[0]) : "",
            facilities: community.facilities || [],
            contactInfo: community.contactInfo || { phone: "", email: "", website: "" },
        });
        setShowEditCommunityPopup(true);
    };

    const handleEditCommunityChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith("contactInfo.")) {
            const key = name.split(".")[1];
            setSelectedCommunity((prev) => ({
                ...prev,
                contactInfo: { ...prev.contactInfo, [key]: value },
            }));
        } else if (name === "facilities") {
            setSelectedCommunity((prev) => ({
                ...prev,
                facilities: value
                    .split(",")
                    .map((f) => f.trim())
                    .filter((f) => f),
            }));
        } else if (name === "admins") {
            setSelectedCommunity((prev) => ({ ...prev, admins: value }));
        } else if (name === "totalFlats" || name === "residentsCount") {
            // Convert to number
            setSelectedCommunity((prev) => ({ ...prev, [name]: Number(value) || 0 }));
        } else {
            setSelectedCommunity((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleUpdateCommunity = async () => {
        try {
            const payload = {
                ...selectedCommunity,
                admins: selectedCommunity.admins ? [selectedCommunity.admins] : []
            };

            const response = await fetch(
                `${BASE_URL}/updateCommunity/${selectedCommunity._id}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );
            if (response.ok) {
                alert("Community updated successfully");
                setShowEditCommunityPopup(false);
                fetchCommunities();
            } else {
                alert("Failed to update community");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteCommunityClick = (id) => {
        setDeleteCommunityId(id);
        setShowDeleteCommunityPopup(true);
    };

    const confirmDeleteCommunity = async () => {
        try {
            const response = await fetch(`${BASE_URL}/deleteCommunity/${deleteCommunityId}`, {
                method: "DELETE",
            });
            if (response.ok) {
                alert("Community deleted successfully");
                fetchCommunities();
            } else {
                alert("Failed to delete community");
            }
            setShowDeleteCommunityPopup(false);
        } catch (err) {
            console.error(err);
        }
    };

    // APARTMENT HANDLERS
    const filteredApartments = apartments.filter((a) =>
        [a.name, a.location, a.community?.name]
            .filter(Boolean)
            .some((v) => v.toLowerCase().includes(searchTermApartment.toLowerCase()))
    );
    const totalApartmentPages = Math.ceil(filteredApartments.length / itemsPerPage);
    const paginatedApartments = filteredApartments.slice(
        (apartmentPage - 1) * itemsPerPage,
        apartmentPage * itemsPerPage
    )
    // Get flat count for each apartment
    const getApartmentFlatCount = (apartmentId) => {
        return flats.filter(
            (flat) =>
                flat.apartment?._id === apartmentId ||
                flat.apartment === apartmentId ||
                flat.appartment?._id === apartmentId ||
                flat.appartment === apartmentId
        ).length;
    };


    const handleAddApartmentChange = (e) => {
        // const { name, value } = e.target;
        // setNewApartment((prev) => ({ ...prev, [name]: value }));
        const { name, value } = e.target;
        // Update nested bankDetails object
        if (["accountName", "accountNumber", "ifsc"].includes(name)) {
            setNewApartment(prev => ({
                ...prev,
                bankDetails: {
                    ...prev.bankDetails,
                    [name]: value,
                }
            }));
        } else {
            setNewApartment(prev => ({
                ...prev,
                [name]: value,
            }));
        }

    };

    const handleAddApartmentSubmit = async () => {
        try {
            const payload = {
                community: newApartment.community,
                name: newApartment.name,
                address: newApartment.address,
                location: newApartment.location,
                blocks: Number(newApartment.blocks) || 0,
                totalFlats: Number(newApartment.totalFlats) || 0,
                maintenance: Number(newApartment.maintenance) || 0,
                bankDetails: {
                    accountName: newApartment.bankDetails?.accountName || "",
                    accountNumber: newApartment.bankDetails?.accountNumber || "",
                    ifsc: newApartment.bankDetails?.ifsc || ""
                }

            };

            const response = await fetch(`${BASE_URL}/createappartment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (response.ok) {
                alert("Apartment added successfully");
                setShowAddApartmentPopup(false);
                setNewApartment({
                    community: "",
                    name: "",
                    address: "",
                    location: "",
                    blocks: "",
                    totalFlats: "",
                    maintenance: "",
                    bankDetails: { accountName: "", accountNumber: "", ifsc: "" }
                });
                fetchApartments();
            } else {
                alert(`Failed to add apartment: ${data.message || "Bad Request"}`);
            }
        } catch (error) {
            console.error("Add apartment error:", error);
        }
    };


    const handleEditApartmentClick = (apartment) => {
        setSelectedApartment({
            ...apartment,
            community: apartment.community?._id || "",
            name: apartment.name || "",
            address: apartment.address || "",
            location: apartment.location || "",
            blocks: apartment.blocks || 0,
            totalFlats: apartment.totalFlats || 0,
            maintenance: apartment.maintenance || 0,
            bankDetails: {
                accountName: apartment.bankDetails?.accountName || "",
                accountNumber: apartment.bankDetails?.accountNumber || "",
                ifsc: apartment.bankDetails?.ifsc || ""
            }

        });
        setShowEditApartmentPopup(true);
    };


    const handleEditApartmentChange = (e) => {
        // const { name, value } = e.target;
        // setSelectedApartment((prev) => ({ ...prev, [name]: value }));
        const { name, value } = e.target;
        if (['accountName', 'accountNumber', 'ifsc'].includes(name)) {
            setSelectedApartment((prev) => ({
                ...prev,
                bankDetails: {
                    ...prev.bankDetails,
                    [name]: value
                }
            }));
        } else {
            setSelectedApartment((prev) => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleUpdateApartment = async () => {
        try {
            const id = selectedApartment._id || selectedApartment.id;
            const payload = {
                community: selectedApartment.community,
                name: selectedApartment.name,
                address: selectedApartment.address,
                location: selectedApartment.location,
                blocks: Number(selectedApartment.blocks) || 0,
                totalFlats: Number(selectedApartment.totalFlats) || 0,
                maintenance: Number(selectedApartment.maintenance) || 0,

                bankDetails: {
                    accountName: selectedApartment.bankDetails?.accountName || "",
                    accountNumber: selectedApartment.bankDetails?.accountNumber || "",
                    ifsc: selectedApartment.bankDetails?.ifsc || ""
                }


            };

            const response = await fetch(`${BASE_URL}/updateappartment/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                alert("Apartment updated successfully");
                setShowEditApartmentPopup(false);
                fetchApartments();
            } else {
                alert("Failed to update apartment");
            }
        } catch (error) {
            console.error("Update apartment error:", error);
        }
    };

    const handleDeleteApartmentClick = (id) => {
        setDeleteApartmentId(id);
        setShowDeleteApartmentPopup(true);
    };

    const confirmDeleteApartment = async () => {
        try {
            const response = await fetch(`${BASE_URL}/deleteappartment/${deleteApartmentId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                alert("Apartment deleted successfully");
                setShowDeleteApartmentPopup(false);
                fetchApartments();
                fetchResidents();
            } else {
                alert("Failed to delete apartment");
            }
        } catch (error) {
            console.error("Delete apartment error:", error);
        }
    };

    const getApartmentResidentCount = (apartmentId) => {
        return residents.filter(
            (resident) =>
                resident.apartment &&
                (resident.apartment._id === apartmentId || resident.apartment === apartmentId)
        ).length;
    };


    // const handleViewFlatsClick = async (apartment) => {
    //     console.log("Apartment passed:", apartment);

    //     const apartmentId = apartment.id || apartment._id;

    //     if (!apartmentId) {
    //         alert("Invalid apartment ID");
    //         return;
    //     }

    //     try {
    //         const response = await fetch(`${BASE_URL}/apartment/${apartmentId}`, {
    //             method: 'GET',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //         });

    //         if (!response.ok) {
    //             throw new Error(`HTTP error! status: ${response.status}`);
    //         }

    //         const data = await response.json();
    //         console.log('Data received:', data);

    //         if (data.success) {
    //             // Extract flats list from response; adjust according to API response structure
    //             const flats = data.flats || (data.data && data.data.flats) || [];
    //             setFlatsToView(flats);
    //             setShowFlatsPopup(true);
    //         } else {
    //             alert('Failed to fetch flats for this apartment: ' + (data.message || 'Unknown error'));
    //             setFlatsToView([]);
    //             setShowFlatsPopup(false);
    //         }

    //     } catch (error) {
    //         console.error('Error fetching flats by apartment id:', error);
    //         alert('Error fetching flats: ' + error.message);
    //         setFlatsToView([]);
    //         setShowFlatsPopup(false);
    //     }
    // };

    const handleViewFlatsClick = async (apartment) => {
        console.log("Apartment passed:", apartment);

        const apartmentId = apartment.id || apartment._id;

        if (!apartmentId) {
            alert("Invalid apartment ID");
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/apartment/${apartmentId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Data received:', data);

            if (data.success) {
                const flats = data.flats || (data.data && data.data.flats) || [];
                setFlatsToView(flats);
                setShowFlatsPopup(true);
            } else {
                setFlatsToView([]);
                setShowFlatsPopup(true);
            }

        } catch (error) {
            console.error('Error fetching flats by apartment id:', error);
            // Show popup but no alert on network or fetch errors as well if preferred
            setFlatsToView([]);
            setShowFlatsPopup(true);
        }
    };


    return (
        <div className="management-container">
            <h1 className="page-title">Our Community</h1>

            {/* COMMUNITY CARDS SECTION */}
            {!showTabs && (
                <div className="community-cards-section">

                    {communities.length === 0 && (
                        <div style={{ textAlign: "center", padding: "50px" }}>
                            <h3>No Communities Found</h3>
                            <button 
                                className="add-btn" 
                                style={{ marginTop: "20px" }}
                                onClick={() => { setShowTabs(true); setActiveTab("apartment"); }}
                            >
                                Open Management Dashboard
                            </button>
                        </div>
                    )}
                    <div className="community-cards-grid">
                        {communities.map((community) => {
                            const stats = getCommunityStats(community._id);
                            return (
                                <div
                                    key={community._id}
                                    className="community-card"
                                    onClick={() => handleCardClick(community._id)}
                                >
                                    <div className="card-image">
                                        <img
                                            src={community.image || "https://via.placeholder.com/400x250?text=No+Image"}
                                            alt={community.name}
                                        />
                                    </div>
                                    <div className="card-content">
                                        <h3 className="card-title">{community.name}</h3>
                                        <p className="card-location"><HiOutlineLocationMarker /> {community.location}</p>

                                        <div className="card-stats-detailed">
                                            <div className="stat-item">
                                                <FaBuilding className="stat-icon-small" />
                                                <div className="stat-text">
                                                    <span className="stat-value">{stats.totalApartments}</span>
                                                    <span className="stat-label">Apartments</span>
                                                </div>
                                            </div>
                                            <div className="stat-item">
                                                <FaHome className="stat-icon-small" />
                                                <div className="stat-text">
                                                    <span className="stat-value">{stats.totalFlats}</span>
                                                    <span className="stat-label">Flats</span>
                                                </div>
                                            </div>
                                            <div className="stat-item">
                                                <FaUsers className="stat-icon-small" />
                                                <div className="stat-text">
                                                    <span className="stat-value">{stats.totalResidents}</span>
                                                    <span className="stat-label">Residents</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB SECTION */}
            {showTabs && (
                <div id="tab-section" className="tab-section">
                    <button className="back-btn" onClick={handleBackToCards}>
                        <FaArrowLeft />
                    </button>

                    <div className="tabs">
                        <button
                            className={`tab-btn ${activeTab === "community" ? "active" : ""}`}
                            onClick={() => setActiveTab("community")}
                        >
                            Community Management
                        </button>
                        <button
                            className={`tab-btn ${activeTab === "apartment" ? "active" : ""}`}
                            onClick={() => setActiveTab("apartment")}
                        >
                            Apartment Management
                        </button>
                    </div>

                    {/* COMMUNITY TAB */}
                    {activeTab === "community" && (
                        <div className="tab-content">
                            <div className="filter-searchc">
                                <input
                                    type="text"
                                    placeholder="Search by name, location, or admin"
                                    value={searchTermCommunity}
                                    onChange={(e) => setSearchTermCommunity(e.target.value)}
                                />
                                <button className="add-btn" onClick={() => setShowAddCommunityPopup(true)} style={{ fontSize: "14px", display: "flex", justifyContent: "space-between" }}>
                                    + Add Community
                                </button>
                            </div>

                            <div className="data-table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Community Name</th>
                                            <th>Location</th>
                                            <th>Total Flats</th>
                                            <th>Residents</th>
                                            <th>Facilities</th>
                                            <th>Contact</th>
                                            <th>Admins</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedCommunities.map((c) => {
                                            const stats = getCommunityStats(c._id);
                                            return (
                                                <tr key={c._id} className={selectedCommunityId === c._id ? "highlighted-row" : ""}>
                                                    <td>{c.name}</td>
                                                    <td>{c.location || "—"}</td>
                                                    <td>{stats.totalFlats}</td>
                                                    <td>{stats.totalResidents}</td>
                                                    <td>{(c.facilities || []).join(", ") || "—"}</td>
                                                    <td>
                                                        {c.contactInfo ? (
                                                            <>
                                                                <p>{c.contactInfo.phone}</p>
                                                                <p>{c.contactInfo.email}</p>
                                                            </>
                                                        ) : (
                                                            "—"
                                                        )}
                                                    </td>
                                                    <td>{(c.admins || []).map((a) => a?.name).join(", ") || "—"}</td>
                                                    <td>
                                                        <button className="edit-btn" onClick={() => handleEditCommunityClick(c)} style={{ margin: "5px" }}>
                                                            Edit
                                                        </button>
                                                        <button
                                                            className="delete-btn"
                                                            onClick={() => handleDeleteCommunityClick(c._id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="pagination-container">
                                <button
                                    className="pagination-btn"
                                    disabled={communityPage === 1}
                                    onClick={() => setCommunityPage(prev => Math.max(prev - 1, 1))}
                                >
                                    Prev
                                </button>

                                <span className="pagination-info">
                                    Page {communityPage} of {totalCommunityPages}
                                </span>

                                <button
                                    className="pagination-btn"
                                    disabled={communityPage === totalCommunityPages}
                                    onClick={() => setCommunityPage(prev => prev + 1)}
                                >
                                    Next
                                </button>
                            </div>
                        </div>

                    )}

                    {/* APARTMENT TAB */}
                    {activeTab === "apartment" && (
                        <div className="tab-content">
                            <div className="filter-searchc">

                                <input
                                    type="text"
                                    placeholder="Search by name, location or community"
                                    value={searchTermApartment}
                                    onChange={(e) => setSearchTermApartment(e.target.value)}
                                />
                                <button className="add-btn" onClick={() => setShowAddApartmentPopup(true)}>
                                    + Add Apartment
                                </button>
                            </div>
                            <div className="data-table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Community</th>
                                            <th>Apartment Name</th>
                                            <th>Address</th>
                                            <th>Location</th>
                                            <th>Blocks</th>
                                            <th>Total Flats</th>
                                            <th>Flats</th>
                                            <th>Maintenance</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedApartments.map((a) => {
                                            const actualFlatCount = getApartmentFlatCount(a._id);
                                            return (
                                                <tr key={a._id}>
                                                    <td>{a.community?.name || "—"}</td>
                                                    <td>{a.name}</td>
                                                    <td>{a.address}</td>
                                                    <td>{a.location}</td>
                                                    <td>{a.blocks || 0}</td>
                                                    <td>{actualFlatCount}</td> {/* Changed from a.totalFlats */}
                                                    <td >
                                                        <button className="view-btn" onClick={() => handleViewFlatsClick(a)}>View</button>
                                                    </td>

                                                    <td>{a.maintenance || 0}</td>
                                                    <td>
                                                        <button className="edit-btn" onClick={() => handleEditApartmentClick(a)} style={{ margin: "5px" }}>
                                                            Edit
                                                        </button>
                                                        <button
                                                            className="delete-btn"
                                                            onClick={() => handleDeleteApartmentClick(a._id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>

                                </table>
                            </div>
                            <div className="pagination-container">
                                <button
                                    className="pagination-btn"
                                    disabled={apartmentPage === 1}
                                    onClick={() => setApartmentPage(prev => Math.max(prev - 1, 1))}
                                >
                                    Prev
                                </button>

                                <span className="pagination-info">
                                    Page {apartmentPage} of {totalApartmentPages}
                                </span>

                                <button
                                    className="pagination-btn"
                                    disabled={apartmentPage === totalApartmentPages}
                                    onClick={() => setApartmentPage(prev => prev + 1)}
                                >
                                    Next
                                </button>
                            </div>
                        </div>

                    )}
                </div>
            )}
            {/* ADD COMMUNITY POPUP */}
            {showAddCommunityPopup && (
                <div className="popup-overlay">
                    <div className="popup-box">
                        <h2>Add New Community</h2>
                        <form className="details-form">
                            <label>Name:<input name="name" value={newCommunity.name} onChange={handleAddCommunityChange} /></label>
                            <label>Address:<input name="address" value={newCommunity.address} onChange={handleAddCommunityChange} /></label>
                            <label>Location:<input name="location" value={newCommunity.location} onChange={handleAddCommunityChange} /></label>
                            <label>Facilities:<input name="facilities" value={newCommunity.facilities.join(", ")} onChange={handleAddCommunityChange} /></label>
                            <label>Total Flats:<input type="number" name="totalFlats" value={newCommunity.totalFlats} onChange={handleAddCommunityChange} /></label>
                            <label>Residents:<input type="number" name="residentsCount" value={newCommunity.residentsCount} onChange={handleAddCommunityChange} /></label>
                            <label>Phone:<input name="contactInfo.phone" value={newCommunity.contactInfo.phone} onChange={handleAddCommunityChange} /></label>
                            <label>Email:<input name="contactInfo.email" value={newCommunity.contactInfo.email} onChange={handleAddCommunityChange} /></label>
                            <label>Website:<input name="contactInfo.website" value={newCommunity.contactInfo.website} onChange={handleAddCommunityChange} /></label>
                            <label>
                                Admin:
                                <select
                                    name="admins"
                                    value={newCommunity.admins[0] || ""}
                                    onChange={handleAddCommunityChange}
                                >
                                    <option value="">Select Admin</option>
                                    {adminsList.map((u) => (
                                        <option key={u._id} value={u._id}>
                                            {u.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label>Description:
                                <textarea name="description" value={newCommunity.description} onChange={handleAddCommunityChange} rows="3" />
                            </label>
                            <label>Image URL:<input type="text" name="image" value={newCommunity.image} onChange={handleAddCommunityChange} placeholder="Enter image URL" /></label>

                        </form>
                        <div className="popup-actions">
                            <button className="cancel-btn" onClick={() => setShowAddCommunityPopup(false)}>Cancel</button>
                            <button className="update-btn" onClick={handleAddCommunitySubmit}>Add</button>
                        </div>
                    </div>
                </div>
            )}
            {/* EDIT COMMUNITY POPUP */}
            {showEditCommunityPopup && selectedCommunity && (
                <div className="popup-overlay">
                    <div className="popup-box">
                        <h2>Edit Community</h2>
                        <form className="details-form">
                            <label>Name:<input name="name" value={selectedCommunity.name} onChange={handleEditCommunityChange} /></label>
                            <label>Address:<input name="address" value={selectedCommunity.address} onChange={handleEditCommunityChange} /></label>
                            <label>Location:<input name="location" value={selectedCommunity.location} onChange={handleEditCommunityChange} /></label>
                            <label>Facilities:<input name="facilities" value={selectedCommunity.facilities.join(", ")} onChange={handleEditCommunityChange} /></label>
                            <label>Total Flats:<input type="number" name="totalFlats" value={selectedCommunity.totalFlats} onChange={handleEditCommunityChange} /></label>
                            <label>Residents:<input type="number" name="residentsCount" value={selectedCommunity.residentsCount} onChange={handleEditCommunityChange} /></label>
                            <label>Phone:<input name="contactInfo.phone" value={selectedCommunity.contactInfo?.phone || ""} onChange={handleEditCommunityChange} /></label>
                            <label>Email:<input name="contactInfo.email" value={selectedCommunity.contactInfo?.email || ""} onChange={handleEditCommunityChange} /></label>
                            <label>Website:<input name="contactInfo.website" value={selectedCommunity.contactInfo?.website || ""} onChange={handleEditCommunityChange} /></label>
                            <label>
                                Admin:
                                <select
                                    name="admins"
                                    value={selectedCommunity.admins || ""}
                                    onChange={handleEditCommunityChange}
                                >
                                    <option value="">Select Admin</option>
                                    {adminsList.map((u) => (
                                        <option key={u._id} value={u._id}>
                                            {u.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label>Image URL:<input type="text" name="image" value={selectedCommunity.image || ""} onChange={handleEditCommunityChange} placeholder="Enter image URL" /></label>
                        </form>
                        <div className="popup-actions">
                            <button className="cancel-btn" onClick={() => setShowEditCommunityPopup(false)}>Cancel</button>
                            <button className="update-btn" onClick={handleUpdateCommunity}>Update</button>
                        </div>
                    </div>
                </div>
            )}



            {/* DELETE COMMUNITY POPUP */}
            {showDeleteCommunityPopup && (
                <div className="popup-overlay">
                    <div className="popup-box">
                        <h2>Confirm Delete</h2>
                        <p>Are you sure you want to delete this community?</p>
                        <div className="popup-actions">
                            <button className="cancel-btn" onClick={() => setShowDeleteCommunityPopup(false)}>Cancel</button>
                            <button className="delete-btn" onClick={confirmDeleteCommunity}>Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD APARTMENT POPUP */}
            {showAddApartmentPopup && (
                <div className="popup-overlay">
                    <div className="popup-box">
                        <h2>Add New Apartment</h2>
                        <form className="details-form">
                            <label>Community: *
                                <select name="community" value={newApartment.community} onChange={handleAddApartmentChange} required>
                                    <option value="">Select Community</option>
                                    {communities.map((c) => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </label>
                            <label>Apartment Name: *<input type="text" name="name" value={newApartment.name} onChange={handleAddApartmentChange} required /></label>
                            <label>Address: *<input type="text" name="address" value={newApartment.address} onChange={handleAddApartmentChange} required /></label>
                            <label>Location: *<input type="text" name="location" value={newApartment.location} onChange={handleAddApartmentChange} required /></label>
                            <label>Blocks:<input type="number" name="blocks" value={newApartment.blocks} onChange={handleAddApartmentChange} min="0" /></label>
                            <label>Total Flats:<input type="number" name="totalFlats" value={newApartment.totalFlats} onChange={handleAddApartmentChange} min="0" /></label>
                            <label>Maintenance:<input type="number" name="maintenance" value={newApartment.maintenance} onChange={handleAddApartmentChange} min="0" /></label>
                            <label>accountName: <input type="text" name="accountName" value={newApartment.bankDetails.accountName} onChange={handleAddApartmentChange} /></label>
                            <label>accountNumber: <input type="text" name="accountNumber" value={newApartment.bankDetails.accountNumber || ""} onChange={handleAddApartmentChange} /></label>
                            <label>ifsc: <input type="text" name="ifsc" value={newApartment.bankDetails.ifsc} onChange={handleAddApartmentChange} /></label>

                        </form>
                        <div className="popup-actions">
                            <button className="cancel-btn" onClick={() => setShowAddApartmentPopup(false)}>Cancel</button>
                            <button className="update-btn" onClick={handleAddApartmentSubmit}>Add</button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT APARTMENT POPUP */}
            {showEditApartmentPopup && selectedApartment && (
                <div className="popup-overlay">
                    <div className="popup-box">
                        <h2>Edit Apartment</h2>
                        <form className="details-form">
                            <label>Community: *
                                <select name="community" value={selectedApartment.community} onChange={handleEditApartmentChange}>
                                    <option value="">Select Community</option>
                                    {communities.map((c) => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </label>
                            <label>Apartment Name: *<input type="text" name="name" value={selectedApartment.name} onChange={handleEditApartmentChange} /></label>
                            <label>Address: *<input type="text" name="address" value={selectedApartment.address} onChange={handleEditApartmentChange} /></label>
                            <label>Location: *<input type="text" name="location" value={selectedApartment.location} onChange={handleEditApartmentChange} /></label>
                            <label>Blocks:<input type="number" name="blocks" value={selectedApartment.blocks} onChange={handleEditApartmentChange} min="0" /></label>
                            <label>Total Flats:<input type="number" name="totalFlats" value={selectedApartment.totalFlats} onChange={handleEditApartmentChange} min="0" /></label>
                            <label>Maintenance:<input type="number" name="maintenance" value={selectedApartment.maintenance} onChange={handleEditApartmentChange} min="0" /></label>
                            <label>accountName: <input type="text" name="accountName" value={selectedApartment.bankDetails?.accountName} onChange={handleEditApartmentChange} /></label>
                            <label>accountNumber: <input type="text" name="accountNumber" value={selectedApartment.bankDetails?.accountNumber || ""} onChange={handleEditApartmentChange} /></label>
                            <label>ifsc: <input type="text" name="ifsc" value={selectedApartment.bankDetails?.ifsc} onChange={handleEditApartmentChange} /></label>

                        </form>
                        <div className="popup-actions">
                            <button className="cancel-btn" onClick={() => setShowEditApartmentPopup(false)}>Cancel</button>
                            <button className="update-btn" onClick={handleUpdateApartment}>Update</button>
                        </div>
                    </div>
                </div>
            )}
            {showFlatsPopup && (
                <div className="popup-overlay">
                    <div className="popup-box">

                        <h2>Flats in Apartment</h2>
                        <table className="data-table">
                            <thead >
                                <tr>
                                    <th>Flat Number</th>
                                    <th>Flat Type</th>
                                    <th>Floor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {flatsToView.map((flat) => (
                                    <tr key={flat.id}>
                                        <td>{flat.number}</td>
                                        <td>{flat.flatType}</td>
                                        <td>{flat.floor}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button className="cancel-btn" onClick={() => setShowFlatsPopup(false)} style={{ margin: "10px 140px" }}>Close</button>
                    </div>
                </div>
            )}


            {/* DELETE APARTMENT POPUP */}
            {showDeleteApartmentPopup && (
                <div className="popup-overlay">
                    <div className="popup-box">
                        <h2>Confirm Delete</h2>
                        <p>Are you sure you want to delete this apartment?</p>
                        <div className="popup-actions">
                            <button className="cancel-btn" onClick={() => setShowDeleteApartmentPopup(false)}>Cancel</button>
                            <button className="delete-btn" onClick={confirmDeleteApartment}>Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Community;

