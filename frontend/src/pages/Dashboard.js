import React, { useEffect, useState } from "react";
import { BASE_URL } from "../Components/Baseurl";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Area,
} from "recharts";
import "../Styles/Dashboard.css";
import {
    FaBuilding,
    FaHome,
    FaTools,
    FaFileAlt
} from 'react-icons/fa';
import { BsFileEarmarkBarGraphFill } from 'react-icons/bs';



const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        // Create a map of unique data keys with their values
        const uniqueData = {};

        payload.forEach((item) => {
            if (!uniqueData[item.name]) {
                uniqueData[item.name] = {
                    value: item.value,
                    color: item.color,
                };
            }
        });

        return (
            <div
                style={{
                    backgroundColor: "#fff",
                    padding: "10px 15px",
                    borderRadius: "8px",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                    fontSize: "14px",
                    color: "#333",
                }}
            >
                <p style={{ marginBottom: 8, fontWeight: "bold" }}>{label}</p>
                {Object.entries(uniqueData).map(([key, { value, color }]) => (
                    <p key={key} style={{ color, margin: "4px 0" }}>
                        {key} : {value}
                    </p>
                ))}
            </div>
        );
    }

    return null;
};

export default function DashboardHome() {
    const [stats, setStats] = useState({
        communities: 0,
        apartments: 0,
        residents: 0,
        vendors: 0,
        services: { assigned: 0, pending: 0, completed: 0 },
    });

    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Selected year state
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);

    // Last 5 years for dropdown options
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const [
                    communityRes,
                    apartmentRes,
                    residentRes,
                    vendorRes,
                    serviceRes,
                ] = await Promise.all([
                    fetch(`${BASE_URL}/getAllCommunity`),
                    fetch(`${BASE_URL}/allappartments`),
                    fetch(`${BASE_URL}/allresidents`),
                    fetch(`${BASE_URL}/allvendors`),
                    fetch(`${BASE_URL}/allservices`),
                ]);

                const [
                    communityData,
                    apartmentData,
                    residentData,
                    vendorData,
                    serviceData,
                ] = await Promise.all([
                    communityRes.json(),
                    apartmentRes.json(),
                    residentRes.json(),
                    vendorRes.json(),
                    serviceRes.json(),
                ]);

                const getCount = (obj, possibleKeys = []) => {
                    if (!obj) return 0;
                    for (const key of possibleKeys) {
                        if (Array.isArray(obj[key])) return obj[key].length;
                    }
                    if (Array.isArray(obj.data)) return obj.data.length;
                    if (Array.isArray(obj.result)) return obj.result.length;
                    return 0;
                };

                const communityCount = getCount(communityData, ["communities"]);
                const apartmentCount = getCount(apartmentData, ["apartments", "appartments"]);
                const residentCount = getCount(residentData, ["residents"]);
                const vendorCount = getCount(vendorData, ["vendors"]);
                const serviceRequests = Array.isArray(serviceData.requests)
                    ? serviceData.requests
                    : [];

                const totalPending = serviceRequests.filter(
                    (req) => (req.status || "").toLowerCase() === "pending"
                ).length;
                const totalAssigned = serviceRequests.filter(
                    (req) => (req.status || "").toLowerCase() === "assigned"
                ).length;
                const totalCompleted = serviceRequests.filter(
                    (req) => (req.status || "").toLowerCase() === "completed"
                ).length;

                setStats({
                    communities: communityCount,
                    apartments: apartmentCount,
                    residents: residentCount,
                    vendors: vendorCount,
                    services: {
                        pending: totalPending,
                        assigned: totalAssigned,
                        completed: totalCompleted,
                    },
                });

                // Prepare Chart Data filtered by selectedYear
                const months = [
                    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
                ];

                const monthly = months.map((m) => ({
                    name: m,
                    completed: 0,
                    pending: 0,
                    assigned: 0,
                }));

                serviceRequests.forEach((req) => {
                    const dateStr = req.createdAt;
                    const status = (req.status || "").toLowerCase();
                    if (!dateStr) return;

                    const d = new Date(dateStr);
                    const year = d.getFullYear();

                    if (year !== selectedYear) return;

                    const monthIndex = d.getMonth();
                    if (monthIndex >= 0 && monthIndex < 12) {
                        if (status === "completed") monthly[monthIndex].completed += 1;
                        else if (status === "pending") monthly[monthIndex].pending += 1;
                        else if (status === "assigned") monthly[monthIndex].assigned += 1;
                    }
                });

                setChartData(monthly);
            } catch (error) {
                console.error("❌ Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [selectedYear]);

    if (loading) {
        return (
            <div className="dashboard-container">
                <h2>Loading Dashboard...</h2>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <h1 className="dashboard-title">Dashboard Overview</h1>

            {/* ===== Stats Section ===== */}
            <div className="stats-container">
                <div className="stat-card darkblue">
                    <h3><FaBuilding /> Communities</h3>
                    <p>{stats.communities}</p>
                </div>
                <div className="stat-card blue">
                    <h3><FaHome /> Apartments</h3>
                    <p>{stats.apartments}</p>
                </div>
                <div className="stat-card orange">
                    <h3><FaTools /> Vendors</h3>
                    <p>{stats.vendors}</p>
                </div>
                <div className="stat-card purple">
                    <h3 ><FaFileAlt /> Service requests</h3>
                    <div className="chip">
                   <h4 className="chips1">
                        Assigned: {stats.services.assigned}</h4>
                        <h4  className="chips2">Pending: {stats.services.pending}</h4>
                        <h4  className="chips3">Completed: {stats.services.completed}</h4>
                        </div>
                       
                    
                </div>
            </div>

            {/* ===== Chart Section ===== */}
            <div className="chart-section gradient-bg">
                <div className="chart-header" >
                    <div>
                        <h2><BsFileEarmarkBarGraphFill />Monthly Service Request Trends</h2>
                        <p>Assigned vs Pending vs Completed requests</p>
                    </div>
                    {/* Year dropdown */}
                    <div>
                        <label style={{ color: "#fff", marginRight: "8px" }}>Year:</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            style={{ padding: "4px 8px", borderRadius: "12px" }}
                        >
                            {years.map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <defs>
                                <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="assignedGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="name" tick={{ fill: "#f3f4f6", fontSize: 13 }} />

                            <YAxis
                                tick={{ fill: "#ffffff", fontSize: 12, fontWeight: 500 }}
                                domain={[0, 100]}
                                 ticks={[10,20,30,40,50,60,70,80,90,100]}
                                interval={0}
                                axisLine={{ stroke: "#cbd5e1" }}
                                tickLine={{ stroke: "#cbd5e1" }}
                            />

                            <Tooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="top" height={36} />

                            <Area
                                type="monotone"
                                dataKey="assigned"
                                fill="url(#assignedGradient)"
                                stroke="none"
                            />
                            <Area
                                type="monotone"
                                dataKey="pending"
                                fill="url(#pendingGradient)"
                                stroke="none"
                            />
                            <Area
                                type="monotone"
                                dataKey="completed"
                                fill="url(#completedGradient)"
                                stroke="none"
                            />

                            <Line
                                type="monotone"
                                dataKey="assigned"
                                stroke="#06b6d4"
                                strokeWidth={3}
                                dot={{ r: 6 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="pending"
                                stroke="#f97316"
                                strokeWidth={3}
                                dot={{ r: 6 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="completed"
                                stroke="#16a34a"
                                strokeWidth={3}
                                dot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
