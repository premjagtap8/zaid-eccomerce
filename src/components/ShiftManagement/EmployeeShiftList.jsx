import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./EmployeeShiftList.css";

const API_URL = import.meta.env.VITE_API_URL;

function EmployeeShiftList() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    const token = localStorage.getItem("token");

    // ==========================================
    // FETCH EMPLOYEES
    // ==========================================

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                setLoading(true);

                const res = await axios.get(`${API_URL}/users/employees`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                // Handle all possible response structures
                const data =
                    res.data?.data?.records ||
                    res.data?.data ||
                    res.data?.employees ||
                    res.data ||
                    [];

                setEmployees(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Employee fetch error:", error);

                toast.error(
                    error?.response?.data?.message ||
                        error?.response?.data?.error ||
                        "Failed to fetch employee shift assignments"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchEmployees();
    }, [token]);

    // ==========================================
    // HELPERS
    // ==========================================

    const getEmployeeName = (emp) => {
        const name = `${emp?.firstName || ""} ${emp?.lastName || ""}`.trim();
        return name || emp?.name || "N/A";
    };

    // Supports shiftDetails / assignedShift / shift
    const getShiftObject = (employee) =>
        employee?.shiftDetails ||
        employee?.assignedShift ||
        employee?.shift ||
        null;

    const hasShiftAssigned = (employee) => {
        const shift = getShiftObject(employee);
        if (!shift) return false;

        if (typeof shift === "object") {
            return Boolean(
                shift?._id || shift?.name || shift?.shiftName || shift?.title
            );
        }

        return typeof shift === "string" && Boolean(shift);
    };

    const getShiftName = (employee) => {
        const shift = getShiftObject(employee);
        if (!shift) return "Not Assigned";

        if (typeof shift === "object" && !Array.isArray(shift)) {
            return shift?.name || shift?.shiftName || shift?.title || "Assigned";
        }

        return typeof shift === "string" ? "Assigned" : "Not Assigned";
    };

    const getShiftStartTime = (employee) => {
        const shift = getShiftObject(employee);
        if (!shift || typeof shift !== "object") return null;

        return (
            shift?.startTime ||
            shift?.start ||
            shift?.from ||
            shift?.timing?.startTime ||
            shift?.timing?.start ||
            null
        );
    };

    const getShiftEndTime = (employee) => {
        const shift = getShiftObject(employee);
        if (!shift || typeof shift !== "object") return null;

        return (
            shift?.endTime ||
            shift?.end ||
            shift?.to ||
            shift?.timing?.endTime ||
            shift?.timing?.end ||
            null
        );
    };

    // 09:00:00 -> 09:00
    const formatTime = (time) => {
        if (!time) return null;

        const value = String(time).trim();
        if (!value) return null;

        if (/^\d{2}:\d{2}:\d{2}$/.test(value)) return value.substring(0, 5);

        return value;
    };

    const getShiftTimings = (employee) => {
        const shift = getShiftObject(employee);
        if (!shift) return "Not Assigned";
        if (typeof shift === "string") return "Timing Not Available";

        const startTime = formatTime(getShiftStartTime(employee));
        const endTime = formatTime(getShiftEndTime(employee));

        if (startTime && endTime) return `${startTime} - ${endTime}`;
        if (startTime) return `${startTime} - N/A`;
        if (endTime) return `N/A - ${endTime}`;

        return "Timing Not Available";
    };

    const hasShiftTiming = (employee) =>
        Boolean(getShiftStartTime(employee) || getShiftEndTime(employee));

    // ==========================================
    // SEARCH FILTER
    // ==========================================

    const filteredEmployees = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return employees;

        return employees.filter((emp) =>
            [
                getEmployeeName(emp),
                emp?.email,
                emp?.biometricId,
                emp?.department,
                getShiftName(emp),
            ]
                .filter(Boolean)
                .some((field) => String(field).toLowerCase().includes(q))
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [employees, search]);

    // ==========================================
    // RENDER
    // ==========================================

    return (
        <div className="employee-shift-page">
            {/* HEADER (matches HR dashboard hero) */}
            <header className="shift-hero">
                <div className="shift-hero-text">
                    <h1>
                        Employee <span>shift</span>
                    </h1>
                    <p>View employee biometric information and assigned shift timings</p>
                </div>

                <div className="employee-count">
                    <strong>{employees.length}</strong>
                    <span>{employees.length === 1 ? "Employee" : "Employees"}</span>
                </div>
            </header>

            <section className="employee-shift-card">
                <div className="shift-toolbar">
                    <div>
                        <h2 className="shift-section-title">Shift assignments</h2>
                        <p className="shift-section-sub">
                            Showing {filteredEmployees.length} of {employees.length}
                        </p>
                    </div>

                    <input
                        type="search"
                        className="shift-search"
                        placeholder="Search name, ID, department…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        aria-label="Search employees"
                    />
                </div>

                {loading ? (
                    <div className="shift-loading" role="status">
                        <div className="loading-spinner"></div>
                        <p>Loading employees...</p>
                    </div>
                ) : filteredEmployees.length === 0 ? (
                    <div className="no-employees">
                        <h3>No Employees Found</h3>
                        <p>
                            {employees.length === 0
                                ? "There are no employees available to display."
                                : "No employees match your search."}
                        </p>
                    </div>
                ) : (
                    <div className="shift-table-wrapper">
                        <table className="shift-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Employee</th>
                                    <th>Biometric ID</th>
                                    <th>Department</th>
                                    <th>Shift</th>
                                    <th>Shift Timings</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredEmployees.map((emp, index) => {
                                    const shiftAssigned = hasShiftAssigned(emp);
                                    const timingAvailable = hasShiftTiming(emp);

                                    return (
                                        <tr key={emp?._id || index}>
                                            <td data-label="#">
                                                <span className="serial-number">
                                                    {index + 1}
                                                </span>
                                            </td>

                                            <td data-label="Employee">
                                                <div className="employee-info">
                                                    <div className="employee-avatar">
                                                        {(
                                                            emp?.firstName?.[0] ||
                                                            emp?.name?.[0] ||
                                                            "E"
                                                        ).toUpperCase()}
                                                    </div>

                                                    <div className="employee-details">
                                                        <strong>{getEmployeeName(emp)}</strong>
                                                        {emp?.email && (
                                                            <small>{emp.email}</small>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td data-label="Biometric ID">
                                                {emp?.biometricId ? (
                                                    <span className="biometric-badge">
                                                        {emp.biometricId}
                                                    </span>
                                                ) : (
                                                    <span className="not-available">N/A</span>
                                                )}
                                            </td>

                                            <td data-label="Department">
                                                <span className="department-text">
                                                    {emp?.department || "N/A"}
                                                </span>
                                            </td>

                                            <td data-label="Shift">
                                                <span
                                                    className={
                                                        shiftAssigned
                                                            ? "shift-badge"
                                                            : "shift-badge unassigned"
                                                    }
                                                >
                                                    {getShiftName(emp)}
                                                </span>
                                            </td>

                                            <td data-label="Shift Timings">
                                                <span
                                                    className={
                                                        timingAvailable
                                                            ? "timing-badge"
                                                            : "timing-badge unavailable"
                                                    }
                                                >
                                                    {getShiftTimings(emp)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

export default EmployeeShiftList;
