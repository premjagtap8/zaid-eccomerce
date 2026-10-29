import React, { useCallback, useEffect, useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  FaHome,
  FaThLarge,
  FaShoppingCart,
  FaBoxOpen,
  FaReceipt,
  FaHeadset,
  FaBuilding,
  FaMapMarkerAlt,
  FaBell,
  FaSignOutAlt,
  FaHeart,
  FaLock,
  FaBars,
  FaTimes,
  FaSearch,
  FaChevronDown,
} from "react-icons/fa";

import { getMyNotifications } from "../../services/notificationService";

// Full-colour logo (same file the HR layout uses)
import logo from "../../assets/images/zaidlogo-light.png";

import "./CorporateLayout.css";

// =====================================================
// CORPORATE MENU
//
// badge: true  -> shows the unread notification count
// =====================================================

const corporateMenu = [
  {
    label: "Home",
    path: "/",
    icon: <FaHome />,
    end: true,
  },
  {
    label: "Overview",
    path: "/corporate-dashboard",
    icon: <FaThLarge />,
    end: true,
  },
  {
    label: "Notifications",
    path: "/corporate-dashboard/notifications",
    icon: <FaBell />,
    badge: true,
  },
  {
    label: "Add Address",
    path: "/corporate-dashboard/add-address",
    icon: <FaMapMarkerAlt />,
  },
  {
    label: "New Order",
    path: "/shop",
    icon: <FaShoppingCart />,
  },
  {
    label: "My Orders",
    path: "/corporate-dashboard/orders",
    icon: <FaBoxOpen />,
  },
  {
    label: "Wishlist",
    path: "/corporate-dashboard/wishlist",
    icon: <FaHeart />,
  },
  {
    label: "Cart",
    path: "/corporate-dashboard/cart",
    icon: <FaShoppingCart />,
  },
  {
    label: "Invoices",
    path: "/corporate-dashboard/invoices",
    icon: <FaReceipt />,
  },
  {
    label: "Support",
    path: "/corporate-dashboard/support",
    icon: <FaHeadset />,
  },
  {
    label: "Company Profile",
    path: "/corporate-dashboard/profile",
    icon: <FaBuilding />,
  },
  {
    label: "Change Password",
    path: "/corporate-dashboard/change-password",
    icon: <FaLock />,
  },
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
// CORPORATE LAYOUT (topbar + sidebar + child page)
// =====================================================

export default function CorporateLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = getStoredUser();
  const userName =
    user.companyName || user.name || user.fullName || "Corporate User";
  const userRole = user.role || "Corporate";
  const userAvatar = user.avatar || user.profileImage || "";
  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const [unreadCount, setUnreadCount] = useState(0);

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

  // ---------------------------------------------------
  // UNREAD COUNT (sidebar + topbar badge)
  // ---------------------------------------------------

  const loadUnreadCount = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await getMyNotifications();

      setUnreadCount(Number(response?.unreadCount || 0));
    } catch (error) {
      console.error("CORPORATE UNREAD COUNT ERROR:", error);
    }
  }, []);

  // Load on mount and whenever the user moves between pages
  useEffect(() => {
    loadUnreadCount();
  }, [location.pathname, loadUnreadCount]);

  // CorporateNotifications fires this after marking items read
  useEffect(() => {
    const handleUpdated = () => loadUnreadCount();

    window.addEventListener("notifications-updated", handleUpdated);

    return () => {
      window.removeEventListener("notifications-updated", handleUpdated);
    };
  }, [loadUnreadCount]);

  // ---------------------------------------------------
  // DRAWER BEHAVIOUR
  // ---------------------------------------------------

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
    document.body.classList.toggle("corp-no-scroll", isOpen);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("corp-no-scroll");
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

  // ---------------------------------------------------
  // LOGOUT (same keys the customer dashboard clears)
  // ---------------------------------------------------

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");

    navigate("/");
  };

  const linkClass = ({ isActive }) =>
    `corp-menu-item ${isActive ? "active" : ""}`;

  const badgeText = unreadCount > 99 ? "99+" : unreadCount;

  // ---------------------------------------------------
  // RENDER
  // ---------------------------------------------------

  return (
    <div className={`corp-layout ${collapsed ? "is-collapsed" : ""}`}>
      {/* TOPBAR */}
      <header className="corp-topbar">
        <button
          type="button"
          className="corp-menu-toggle"
          onClick={handleToggle}
          aria-label="Toggle menu"
          aria-expanded={isOpen}
          aria-controls="corp-sidebar"
        >
          <FaBars />
        </button>

        <div className="corp-search">
          <FaSearch className="corp-search-icon" />
          <input
            type="text"
            placeholder="Search orders, invoices..."
            aria-label="Search"
          />
        </div>

        <div className="corp-topbar-right">
          <button
            type="button"
            className="corp-bell"
            aria-label={
              unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : "Notifications"
            }
            onClick={() => navigate("/corporate-dashboard/notifications")}
          >
            <FaBell />
            {unreadCount > 0 && (
              <span className="corp-bell-badge">{badgeText}</span>
            )}
          </button>

          <div className="corp-user">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="corp-user-avatar"
              />
            ) : (
              <span className="corp-user-avatar corp-user-initials">
                {initials}
              </span>
            )}

            <div className="corp-user-meta">
              <span className="corp-user-name">{userName}</span>
              <span className="corp-user-role">{userRole}</span>
            </div>

            <FaChevronDown className="corp-user-chevron" />
          </div>
        </div>
      </header>

      {/* OVERLAY */}
      <div
        className={`corp-overlay ${isOpen ? "is-open" : ""}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* SIDEBAR */}
      <aside
        id="corp-sidebar"
        className={`corp-sidebar ${isOpen ? "is-open" : ""}`}
      >
        {/* Decorative wave */}
        <svg
          className="corp-sidebar-wave"
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

        <div className="corp-sidebar-header">
          {/* Logo sits on a light card so it keeps its original colours */}
          <button
            type="button"
            className="corp-brand"
            onClick={() => navigate("/corporate-dashboard")}
            aria-label="Zaid Infotech - Corporate Dashboard"
          >
            <img
              src={logo}
              alt="Zaid Infotech"
              className="corp-logo"
              width="1332"
              height="446"
              decoding="async"
              draggable={false}
            />
          </button>

          <button
            type="button"
            className="corp-sidebar-close"
            onClick={closeMenu}
            aria-label="Close menu"
          >
            <FaTimes />
          </button>
        </div>

        <div className="corp-menu-title">Corporate</div>

        <nav className="corp-sidebar-menu" aria-label="Corporate navigation">
          {corporateMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={linkClass}
            >
              <span className="corp-menu-icon">{item.icon}</span>
              <span className="corp-menu-label">{item.label}</span>

              {item.badge && unreadCount > 0 && (
                <span
                  className="corp-menu-badge"
                  aria-label={`${unreadCount} unread notifications`}
                >
                  {badgeText}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* LOGOUT (pinned to the bottom of the sidebar) */}
        <div className="corp-sidebar-footer">
          <button
            type="button"
            className="corp-logout-btn"
            onClick={handleLogout}
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="corp-main">
        <div className="corp-main-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
