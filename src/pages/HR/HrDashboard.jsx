import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaUsers,
  FaClipboardList,
  FaCalendarCheck,
  FaCalendarAlt,
  FaUserPlus,
  FaClock,
  FaMoneyBillWave,
  FaSyncAlt,
} from "react-icons/fa";

import "./HrDashboard.css";

// =====================================================
// API BASE (sirf .env se)
// =====================================================
// Supports both VITE_API_BASE_URL and VITE_API_URL
// so existing project configuration is not disturbed.
// =====================================================

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "";

// =====================================================
// ENDPOINTS
// =====================================================

const ENDPOINTS = {
  employees: `${API_BASE}/users/employees`,
  leaves: `${API_BASE}/leaves`,
  holidays: `${API_BASE}/leaves/holidays`,
  attendance: `${API_BASE}/newAttendance`,
};

// =====================================================
// AUTH HEADERS
// =====================================================

function authHeaders() {
  const token = localStorage.getItem("token");

  return token
    ? {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }
    : {};
}

// =====================================================
// TODAY
// =====================================================

function todayStr() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// =====================================================
// HOLIDAY DATE FORMAT
// =====================================================

function formatHolidayDate(dateStr) {
  if (!dateStr) return "-";

  const d = new Date(dateStr);

  if (Number.isNaN(d.getTime())) {
    return "-";
  }

  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// =====================================================
// SAFE JSON
// =====================================================

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

// =====================================================
// GET ARRAY FROM DIFFERENT API RESPONSE SHAPES
// =====================================================

function getArray(responseData) {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }

  if (Array.isArray(responseData?.employees)) {
    return responseData.employees;
  }

  if (Array.isArray(responseData?.leaves)) {
    return responseData.leaves;
  }

  if (Array.isArray(responseData?.holidays)) {
    return responseData.holidays;
  }

  if (Array.isArray(responseData?.attendance)) {
    return responseData.attendance;
  }

  if (Array.isArray(responseData?.records)) {
    return responseData.records;
  }

  if (Array.isArray(responseData?.results)) {
    return responseData.results;
  }

  return [];
}

// =====================================================
// DASHBOARD
// =====================================================

export default function HrDashboard() {
  const navigate = useNavigate();

  // ===================================================
  // STATES
  // ===================================================

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [totalEmployees, setTotalEmployees] = useState(0);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [attendancePercent, setAttendancePercent] = useState(0);
  const [upcomingHolidays, setUpcomingHolidays] = useState([]);

  // ===================================================
  // LOAD DASHBOARD
  // ===================================================

  const loadDashboard = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const headers = authHeaders();

      const [
        employeesResponse,
        leavesResponse,
        holidaysResponse,
        attendanceResponse,
      ] = await Promise.all([
        fetch(ENDPOINTS.employees, {
          method: "GET",
          headers,
        }),

        fetch(ENDPOINTS.leaves, {
          method: "GET",
          headers,
        }),

        fetch(ENDPOINTS.holidays, {
          method: "GET",
          headers,
        }),

        fetch(ENDPOINTS.attendance, {
          method: "GET",
          headers,
        }),
      ]);

      // =================================================
      // READ JSON
      // =================================================

      const [
        employeesData,
        leavesData,
        holidaysData,
        attendanceData,
      ] = await Promise.all([
        safeJson(employeesResponse),
        safeJson(leavesResponse),
        safeJson(holidaysResponse),
        safeJson(attendanceResponse),
      ]);

      // =================================================
      // EMPLOYEES
      // =================================================

      const employees = getArray(employeesData);

      const employeeCount = employees.length;

      setTotalEmployees(employeeCount);

      // =================================================
      // PENDING LEAVES
      // =================================================

      const leaves = getArray(leavesData);

      const pendingCount = leaves.filter((leave) => {
        const status = String(leave?.status || "").toUpperCase();

        return status === "PENDING";
      }).length;

      setPendingLeaves(pendingCount);

      // =================================================
      // TODAY'S ATTENDANCE
      // =================================================

      const attendanceRecords = getArray(attendanceData);

      const today = todayStr();

      const todayRecords = attendanceRecords.filter((attendance) => {
        if (!attendance) return false;

        const rawDate =
          attendance.date ||
          attendance.attendanceDate ||
          attendance.createdAt;

        if (!rawDate) return false;

        const date = new Date(rawDate);

        if (Number.isNaN(date.getTime())) {
          return false;
        }

        const recordDate = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

        return recordDate === today;
      });

      const presentToday = todayRecords.filter((attendance) => {
        const status = String(attendance?.status || "").toUpperCase();

        return (
          status === "PRESENT" ||
          status === "P" ||
          status === "CHECKED_IN"
        );
      }).length;

      const percentage =
        employeeCount > 0
          ? Math.min(
              100,
              Math.round((presentToday / employeeCount) * 100)
            )
          : 0;

      setAttendancePercent(percentage);

      // =================================================
      // UPCOMING HOLIDAYS
      // =================================================

      const holidays = getArray(holidaysData);

      const todayDate = new Date(today);

      todayDate.setHours(0, 0, 0, 0);

      const upcoming = holidays
        .filter((holiday) => {
          if (!holiday?.date) return false;

          const holidayDate = new Date(holiday.date);

          if (Number.isNaN(holidayDate.getTime())) {
            return false;
          }

          holidayDate.setHours(0, 0, 0, 0);

          return holidayDate >= todayDate;
        })
        .sort(
          (a, b) =>
            new Date(a.date).getTime() -
            new Date(b.date).getTime()
        )
        .slice(0, 2);

      setUpcomingHolidays(upcoming);

      // =================================================
      // API STATUS CHECK
      // =================================================

      const failedRequests = [
        employeesResponse,
        leavesResponse,
        holidaysResponse,
        attendanceResponse,
      ].filter((response) => !response.ok);

      if (failedRequests.length > 0) {
        console.warn(
          "Some HR dashboard APIs returned non-OK status."
        );
      }
    } catch (err) {
      console.error("HR DASHBOARD LOAD ERROR:", err);

      setError(
        "Couldn't load dashboard data. Please check the server and try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    loadDashboard();
  }, []);

  // ===================================================
  // STATS
  // ===================================================
  // Tones are brand-only: "green" (logo TECH green) and
  // "ink" (logo charcoal), alternated so the cards stay
  // easy to tell apart without leaving the logo palette.
  // ===================================================

  const stats = [
    {
      label: "Total employees",
      value: totalEmployees,
      icon: <FaUsers />,
      tone: "green",
    },
    {
      label: "Pending leaves",
      value: pendingLeaves,
      icon: <FaClipboardList />,
      tone: "ink",
    },
    {
      label: "Today's attendance",
      value: `${attendancePercent}%`,
      icon: <FaCalendarCheck />,
      tone: "green",
    },
    {
      label: "Upcoming holidays",
      value: upcomingHolidays.length,
      icon: <FaCalendarAlt />,
      tone: "ink",
    },
  ];

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div className="dash-state">
        <div className="dash-loading-spinner" />
        <p>Loading HR dashboard...</p>
      </div>
    );
  }

  // ===================================================
  // ERROR
  // ===================================================

  if (error) {
    return (
      <div className="dash-state dash-state-error">
        <h3>HR Dashboard</h3>

        <p>{error}</p>

        <button
          type="button"
          onClick={() => loadDashboard(true)}
        >
          <FaSyncAlt />
          Try Again
        </button>
      </div>
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="dash-root">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="dash-header">
        <div>
          {/* <span> so the CSS can colour "dashboard" green */}
          <h1>
            HR <span>dashboard</span>
          </h1>

          <p>
            Quick overview of employees, leaves, attendance
            and holidays
          </p>
        </div>

        <button
          type="button"
          className="dash-refresh-btn"
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
        >
          <FaSyncAlt
            className={refreshing ? "dash-spin" : ""}
          />

          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* =================================================
          STATS
      ================================================= */}

      <div className="dash-stats-grid">
        {stats.map((stat) => (
          <div
            className="dash-stat-card"
            key={stat.label}
          >
            <div
              className={`dash-stat-icon dash-stat-icon-${stat.tone}`}
            >
              {stat.icon}
            </div>

            <div>
              <div className="dash-stat-value">
                {stat.value}
              </div>

              <div className="dash-stat-label">
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* =================================================
          PANELS
      ================================================= */}

      <div className="dash-panels-grid">
        {/* =================================================
            HOLIDAYS
        ================================================= */}

        <div className="dash-panel">
          <div className="dash-panel-header">
            <div>
              <h2>Upcoming holidays</h2>

              <p className="dash-panel-subtitle">
                Next scheduled holidays
              </p>
            </div>

            <button
              type="button"
              className="dash-link-btn"
              onClick={() =>
                navigate("/hr-dashboard/holidays")
              }
            >
              View all
            </button>
          </div>

          {upcomingHolidays.length === 0 ? (
            <p className="dash-empty">
              No upcoming holidays.
            </p>
          ) : (
            <ul className="dash-holiday-list">
              {upcomingHolidays.map((holiday) => (
                <li
                  key={
                    holiday._id ||
                    `${holiday.name}-${holiday.date}`
                  }
                >
                  <span className="dash-holiday-dot" />

                  <div>
                    <strong>
                      {holiday.name || "Holiday"}
                    </strong>

                    <div className="dash-holiday-date">
                      {formatHolidayDate(holiday.date)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* =================================================
            QUICK ACTIONS
        ================================================= */}

        <div className="dash-panel">
          <div className="dash-panel-header">
            <div>
              <h2>Quick actions</h2>

              <p className="dash-panel-subtitle">
                Common HR operations
              </p>
            </div>
          </div>

          <div className="dash-quick-actions">
            {/* ADD EMPLOYEE */}

            <button
              type="button"
              onClick={() =>
                navigate("/hr-dashboard/employees/add")
              }
            >
              <FaUserPlus />

              <span>Add employee</span>
            </button>

            {/* ADD SHIFTING */}

            <button
              type="button"
              onClick={() =>
                navigate("/hr-dashboard/shifting/add")
              }
            >
              <FaClock />

              <span>Add shifting</span>
            </button>

            {/* SALARY */}

            <button
              type="button"
              onClick={() =>
                navigate("/hr-dashboard/salary")
              }
            >
              <FaMoneyBillWave />

              <span>View salary</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
