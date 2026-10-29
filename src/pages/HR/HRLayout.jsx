import React, { useState, useEffect, useCallback } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";

import {
  FaHome,
  FaUsers,
  FaUserPlus,
  FaClock,
  FaCalendarAlt,
  FaCalendarCheck,
  FaFileAlt,
  FaShieldAlt,
  FaDatabase,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaSearch,
  FaBell,
  FaChevronDown,
} from "react-icons/fa";

// Full-colour logo (charcoal text + green "TECH" + wifi icon) on a transparent
// or white background. Save it as src/assets/images/zaidlogo-light.png
import logo from "../../assets/images/zaidlogo-light.png";

import "./HRLayout.css";

// =====================================================
// HR MENU
// =====================================================

const hrMenu = [
  { label: "Employees", path: "/hr-dashboard/employees", icon: <FaUsers />, end: true },
  { label: "Add Employee", path: "/hr-dashboard/employees/add", icon: <FaUserPlus /> },
  { label: "Add Shifting", path: "/hr-dashboard/shifting/add", icon: <FaClock /> },
  { label: "Employee Shift", path: "/hr-dashboard/employee-shift", icon: <FaCalendarAlt /> },
  { label: "Attendance", path: "/hr-dashboard/attendance", icon: <FaCalendarCheck /> },
  { label: "Leave Requests", path: "/hr-dashboard/leave/requests", icon: <FaFileAlt /> },
  { label: "Leave Policies", path: "/hr-dashboard/leave/policies", icon: <FaShieldAlt /> },
  { label: "Holidays", path: "/hr-dashboard/holidays", icon: <FaCalendarAlt /> },
  { label: "Salary", path: "/hr-dashboard/salary", icon: <FaDatabase /> },
];

// Read the logged-in user safely from localStorage
const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user")) || {};
  } catch {
    return {};
  }
};

// =====================================================
// HR LAYOUT
// =====================================================

export default function HRLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = getStoredUser();
  const userName = user.name || user.fullName || "HR Manager";
  const userRole = user.role || "HR Manager";
  const userAvatar = user.avatar || user.profileImage || "";
  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Mobile/tablet drawer
  const [isOpen, setIsOpen] = useState(false);
  // Desktop collapse
  const [collapsed, setCollapsed] = useState(false);

  const closeMenu = useCallback(() => setIsOpen(false), []);

  // Hamburger: toggles drawer on small screens, collapses sidebar on desktop
  const handleToggle = () => {
    if (window.matchMedia("(min-width: 1025px)").matches) {
      setCollapsed((c) => !c);
    } else {
      setIsOpen(true);
    }
  };

  // Close the drawer whenever the route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Close on Escape + lock body scroll while the drawer is open
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.classList.toggle("hr-no-scroll", isOpen);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("hr-no-scroll");
    };
  }, [isOpen]);

  // If the screen grows to desktop size, reset the drawer
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1025px)");
    const onChange = (e) => {
      if (e.matches) setIsOpen(false);
    };

    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // ===================================================
  // LOGOUT
  // ===================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");

    navigate("/login", { replace: true });
  };

  const linkClass = ({ isActive }) =>
    `hr-menu-item ${isActive ? "active" : ""}`;

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className={`hr-layout ${collapsed ? "is-collapsed" : ""}`}>
      {/* TOPBAR */}
      <header className="hr-topbar">
        <button
          type="button"
          className="hr-menu-toggle"
          onClick={handleToggle}
          aria-label="Toggle menu"
          aria-expanded={isOpen}
          aria-controls="hr-sidebar"
        >
          <FaBars />
        </button>

        <div className="hr-search">
          <FaSearch className="hr-search-icon" />
          <input
            type="text"
            placeholder="Search employees, departments..."
            aria-label="Search"
          />
        </div>

        <div className="hr-topbar-right">
          <button type="button" className="hr-bell" aria-label="Notifications">
            <FaBell />
            <span className="hr-bell-badge">3</span>
          </button>

          <div className="hr-user">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="hr-user-avatar" />
            ) : (
              <span className="hr-user-avatar hr-user-initials">{initials}</span>
            )}

            <div className="hr-user-meta">
              <span className="hr-user-name">{userName}</span>
              <span className="hr-user-role">{userRole}</span>
            </div>

            <FaChevronDown className="hr-user-chevron" />
          </div>
        </div>
      </header>

      {/* OVERLAY */}
      <div
        className={`hr-overlay ${isOpen ? "is-open" : ""}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* SIDEBAR */}
      <aside
        id="hr-sidebar"
        className={`hr-sidebar ${isOpen ? "is-open" : ""}`}
      >
        {/* Decorative wave */}
        <svg
          className="hr-sidebar-wave"
          viewBox="0 0 260 260"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {Array.from({ length: 14 }).map((_, i) => (
            <path
              key={i}
              d={`M-10 ${190 + i * 3} C 50 ${150 + i * 2}, 90 ${230 - i * 2}, 150 ${
                170 + i * 2
              } S 230 ${110 + i * 3}, 280 ${120 + i * 2}`}
              fill="none"
              stroke="#57a41d"
              strokeWidth="0.6"
              opacity={0.14 + i * 0.03}
            />
          ))}
        </svg>

        <div className="hr-sidebar-header">
          {/* Logo sits on a light card so it keeps its original colours */}
          <button
            type="button"
            className="hr-brand"
            onClick={() => navigate("/hr-dashboard")}
            aria-label="Zaid Infotech - HR Dashboard"
          >
            <img
              src={logo}
              alt="Zaid Infotech"
              className="hr-logo"
              width="1332"
              height="446"
              decoding="async"
              draggable={false}
            />
          </button>

          <button
            type="button"
            className="hr-sidebar-close"
            onClick={closeMenu}
            aria-label="Close menu"
          >
            <FaTimes />
          </button>
        </div>

        <div className="hr-menu-title">HR</div>

        <nav className="hr-sidebar-menu" aria-label="HR navigation">
          <NavLink to="/hr-dashboard" end className={linkClass}>
            <span className="hr-menu-icon">
              <FaHome />
            </span>
            <span className="hr-menu-label">Dashboard</span>
          </NavLink>

          {hrMenu.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.end} className={linkClass}>
              <span className="hr-menu-icon">{item.icon}</span>
              <span className="hr-menu-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="hr-sidebar-footer">
          <button
            type="button"
            className="hr-logout-btn"
            onClick={handleLogout}
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="hr-main">
        <div className="hr-main-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
