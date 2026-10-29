import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import "./AttendanceManagement.css";
import "react-toastify/dist/ReactToastify.css";

const BASE_URL = import.meta.env.VITE_API_URL;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const AdminAttendance = () => {
  // ==========================================
  // STATES & FILTERS
  // ==========================================
  const [employees, setEmployees] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [manualData, setManualData] = useState({
    user: "",
    employeeId: "",
    date: new Date().toISOString().split("T")[0],
    status: "PRESENT",
    remark: "",
  });

  const [bioPunchData, setBioPunchData] = useState({
    employeeId: "",
    biometricId: "",
  });

  // ==========================================
  // HELPERS & AUTH
  // ==========================================
  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const getEmployeeName = (user) => {
    if (!user) return "N/A";
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return user.name || "N/A";
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleDateString("en-IN");
    } catch {
      return "N/A";
    }
  };

  const formatTime = (date) => {
    if (!date) return "-";
    try {
      return new Date(date).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  const availableYears = useMemo(() => {
    const curr = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => curr - 3 + i);
  }, []);

  // ==========================================
  // DATA FETCHING
  // ==========================================
  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const res = await axios.get(`${BASE_URL}/users/employees`, getAuthHeader());
      const list = res.data?.data?.records || res.data?.data || res.data || [];
      setEmployees(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Employee fetch error:", err.response?.data || err.message);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/newAttendance`, getAuthHeader());
      const list = res.data?.data || res.data || [];
      setAttendanceList(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Attendance fetch error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
  }, []);

  // ==========================================
  // FILTERING & AGGREGATION
  // ==========================================
  const filteredAttendance = useMemo(() => {
    return attendanceList.filter((item) => {
      if (!item.date) return false;
      const recDate = new Date(item.date);
      return (
        recDate.getMonth() === Number(selectedMonth) &&
        recDate.getFullYear() === Number(selectedYear)
      );
    });
  }, [attendanceList, selectedMonth, selectedYear]);

  const employeeStats = useMemo(() => {
    const statsMap = {};

    filteredAttendance.forEach((record) => {
      const empKey =
        record.employeeId ||
        (record.user && (record.user._id || record.user)) ||
        "UNKNOWN";

      if (!statsMap[empKey]) {
        statsMap[empKey] = {
          key: empKey,
          name: getEmployeeName(record.user),
          employeeId: record.employeeId || "N/A",
          present: 0,
          absent: 0,
          leave: 0,
          halfDay: 0,
          late: 0,
          totalWorkingHours: 0,
        };
      }

      const status = (record.status || "").toUpperCase();
      statsMap[empKey].totalWorkingHours += record.workingHours || 0;

      if (status === "PRESENT") statsMap[empKey].present += 1;
      else if (status === "ABSENT") statsMap[empKey].absent += 1;
      else if (status === "LEAVE") statsMap[empKey].leave += 1;
      else if (status === "HALF_DAY") statsMap[empKey].halfDay += 1;
      else if (status === "LATE") {
        statsMap[empKey].late += 1;
        statsMap[empKey].present += 1;
      }
    });

    return Object.values(statsMap);
  }, [filteredAttendance]);

  const overallStats = useMemo(() => {
    return employeeStats.reduce(
      (acc, curr) => ({
        present: acc.present + curr.present,
        absent: acc.absent + curr.absent,
        leave: acc.leave + curr.leave,
        halfDay: acc.halfDay + curr.halfDay,
      }),
      { present: 0, absent: 0, leave: 0, halfDay: 0 }
    );
  }, [employeeStats]);

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleEmployeeSelect = (e) => {
    const selectedUserId = e.target.value;
    const selectedEmp = employees.find((emp) => emp._id === selectedUserId);
    setManualData((prev) => ({
      ...prev,
      user: selectedUserId,
      employeeId: selectedEmp?.employeeId || "",
    }));
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualData.user) {
      alert("Please select an employee.");
      return;
    }

    const selectedEmp = employees.find((emp) => emp._id === manualData.user);

    // Normalize date to prevent timezone index conflicts
    const normalizedDate = new Date(`${manualData.date}T00:00:00.000Z`).toISOString();

    const payload = {
      user: manualData.user,
      employeeId: selectedEmp?.employeeId || manualData.employeeId,
      date: normalizedDate,
      status: manualData.status,
      attendanceMode: "MANUAL",
      remark: manualData.remark || "",
      checkIn:
        manualData.status === "ABSENT" || manualData.status === "LEAVE"
          ? null
          : new Date().toISOString(),
      checkOut: null,
    };

    try {
      await axios.post(`${BASE_URL}/newAttendance/manual`, payload, getAuthHeader());
      alert("Manual attendance marked successfully!");
      await fetchAttendance();

      setManualData({
        user: "",
        employeeId: "",
        date: new Date().toISOString().split("T")[0],
        status: "PRESENT",
        remark: "",
      });
    } catch (err) {
      console.error("Backend Error Response:", err.response?.data);
      const serverMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (typeof err.response?.data === "string" ? err.response?.data : null) ||
        "Error submitting manual attendance (400 Bad Request)";

      alert(serverMessage);
    }
  };

  const handleBiometricPunch = async (e) => {
    e.preventDefault();
    if (!bioPunchData.employeeId) {
      alert("Please enter Employee ID.");
      return;
    }

    const payload = {
      employeeId: bioPunchData.employeeId,
      biometricId: bioPunchData.biometricId || bioPunchData.employeeId,
      punchTime: new Date().toISOString(),
    };

    try {
      await axios.post(`${BASE_URL}/newAttendance/biometric`, payload, getAuthHeader());
      alert("Biometric punch successful!");
      await fetchAttendance();
      setBioPunchData({ employeeId: "", biometricId: "" });
    } catch (err) {
      alert(err.response?.data?.message || "Error processing punch");
    }
  };

  const handleCheckout = async (attendance) => {
    if (attendance.status === "ABSENT" || attendance.status === "LEAVE") {
      alert("Cannot check out an employee marked as Absent or on Leave.");
      return;
    }

    try {
      const payload = {
        user: attendance.user?._id || attendance.user,
        employeeId: attendance.employeeId,
        date: attendance.date,
        checkoutTime: new Date().toISOString(),
      };

      await axios.put(`${BASE_URL}/newAttendance/checkout`, payload, getAuthHeader());
      alert("Checkout successful!");
      await fetchAttendance();
    } catch (err) {
      alert(err.response?.data?.message || "Error marking checkout");
    }
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="attendance-container">
      {/* HERO (matches HR dashboard banner) */}
      <header className="attendance-hero">
        <h2 className="attendance-title">
          Admin <span>attendance</span>
        </h2>
        <p className="attendance-subtitle">
          Mark attendance, simulate biometric punches and review monthly summaries
        </p>
      </header>

      {/* FORMS */}
      <div className="attendance-forms-wrapper">
        <div className="attendance-card">
          <h3>Mark Manual Attendance</h3>
          <form onSubmit={handleManualSubmit}>
            <div className="form-group">
              <label htmlFor="att-employee">Choose Employee</label>
              <select
                id="att-employee"
                className="form-control"
                value={manualData.user}
                onChange={handleEmployeeSelect}
                required
              >
                <option value="">
                  {loadingEmployees ? "Loading..." : "-- Select Employee --"}
                </option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeId || "No ID"})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="att-date">Date</label>
                <input
                  id="att-date"
                  type="date"
                  className="form-control"
                  value={manualData.date}
                  onChange={(e) =>
                    setManualData((prev) => ({ ...prev, date: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="att-status">Status</label>
                <select
                  id="att-status"
                  className="form-control"
                  value={manualData.status}
                  onChange={(e) =>
                    setManualData((prev) => ({ ...prev, status: e.target.value }))
                  }
                >
                  <option value="PRESENT">PRESENT</option>
                  <option value="ABSENT">ABSENT</option>
                  <option value="HALF_DAY">HALF DAY</option>
                  <option value="LEAVE">LEAVE</option>
                  <option value="LATE">LATE</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="att-remark">Remark</label>
              <input
                id="att-remark"
                type="text"
                className="form-control"
                placeholder="Optional remark"
                value={manualData.remark}
                onChange={(e) =>
                  setManualData((prev) => ({ ...prev, remark: e.target.value }))
                }
              />
            </div>

            <button type="submit" className="btn-primary-green">
              Submit Manual Attendance
            </button>
          </form>
        </div>

        <div className="attendance-card">
          <h3>Virtual Biometric Machine Punch</h3>
          <p className="card-subtitle">Simulate check-in punch using Biometric ID</p>
          <form onSubmit={handleBiometricPunch}>
            <div className="form-group">
              <label htmlFor="bio-emp">Employee ID</label>
              <input
                id="bio-emp"
                type="text"
                className="form-control"
                placeholder="e.g. EMP001"
                value={bioPunchData.employeeId}
                onChange={(e) =>
                  setBioPunchData((prev) => ({ ...prev, employeeId: e.target.value }))
                }
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="bio-key">Biometric ID / Key</label>
              <input
                id="bio-key"
                type="text"
                className="form-control"
                placeholder="e.g. BIO123 (Optional)"
                value={bioPunchData.biometricId}
                onChange={(e) =>
                  setBioPunchData((prev) => ({ ...prev, biometricId: e.target.value }))
                }
              />
            </div>

            <button type="submit" className="btn-accent-green">
              Simulate Biometric Scan
            </button>
          </form>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="filter-card">
        <div className="filter-title">
          <h4>Summary &amp; Records Filter</h4>
          <span>Select date range to update summary metrics and tables</span>
        </div>
        <div className="filter-controls">
          <div className="filter-item">
            <label htmlFor="flt-month">Month</label>
            <select
              id="flt-month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx} value={idx}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-item">
            <label htmlFor="flt-year">Year</label>
            <select
              id="flt-year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI STATS CARDS */}
      <div className="stats-grid">
        <div className="stat-card stat-present">
          <h4>Total Present</h4>
          <span>{overallStats.present}</span>
        </div>
        <div className="stat-card stat-absent">
          <h4>Total Absent</h4>
          <span>{overallStats.absent}</span>
        </div>
        <div className="stat-card stat-leave">
          <h4>Total On Leave</h4>
          <span>{overallStats.leave}</span>
        </div>
        <div className="stat-card stat-halfday">
          <h4>Total Half Days</h4>
          <span>{overallStats.halfDay}</span>
        </div>
      </div>

      {/* MONTHLY SUMMARY TABLE */}
      <section className="table-section">
        <div className="section-header">
          <h3 className="records-title">
            Monthly Attendance Summary ({MONTH_NAMES[selectedMonth]} {selectedYear})
          </h3>
        </div>
        <div className="table-wrapper">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Employee ID</th>
                <th>Present Days</th>
                <th>Absent Days</th>
                <th>Leaves</th>
                <th>Half Days</th>
                <th>Late Entries</th>
                <th>Total Hours</th>
              </tr>
            </thead>
            <tbody>
              {employeeStats.length > 0 ? (
                employeeStats.map((emp) => (
                  <tr key={emp.key}>
                    <td><strong>{emp.name}</strong></td>
                    <td>{emp.employeeId}</td>
                    <td className="text-success">{emp.present}</td>
                    <td className="text-danger">{emp.absent}</td>
                    <td className="text-warning">{emp.leave}</td>
                    <td>{emp.halfDay}</td>
                    <td>{emp.late}</td>
                    <td>{emp.totalWorkingHours.toFixed(1)} hrs</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="no-data">
                    No attendance logged for {MONTH_NAMES[selectedMonth]} {selectedYear}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* DAILY DETAILED PUNCH LOGS */}
      <section className="table-section">
        <div className="section-header">
          <h3 className="records-title">Daily Punch Logs</h3>
        </div>
        <div className="table-wrapper">
          {loading ? (
            <p className="no-data">Loading attendance logs...</p>
          ) : (
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>User / Name</th>
                  <th>Employee ID</th>
                  <th>Date</th>
                  <th>Mode</th>
                  <th>Status</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Working Hours</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.length > 0 ? (
                  filteredAttendance.map((item) => {
                    const isAbsentOrLeave =
                      item.status === "ABSENT" || item.status === "LEAVE";

                    return (
                      <tr key={item._id}>
                        <td>{getEmployeeName(item.user)}</td>
                        <td>{item.employeeId || "N/A"}</td>
                        <td>{formatDate(item.date)}</td>
                        <td>
                          <span className="badge-mode">
                            {item.attendanceMode || "MANUAL"}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge-status status-${(item.status || "").toLowerCase()}`}
                          >
                            {item.status || "N/A"}
                          </span>
                        </td>
                        <td>{isAbsentOrLeave ? "-" : formatTime(item.checkIn)}</td>
                        <td>{isAbsentOrLeave ? "-" : formatTime(item.checkOut)}</td>
                        <td>{item.workingHours || 0} hrs</td>
                        <td>
                          {isAbsentOrLeave ? (
                            <span className="action-none">-</span>
                          ) : !item.checkOut ? (
                            <button
                              type="button"
                              className="btn-danger"
                              onClick={() => handleCheckout(item)}
                            >
                              Check-Out
                            </button>
                          ) : (
                            <span className="checkout-done">Completed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="no-data">
                      No punch records found for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminAttendance;
