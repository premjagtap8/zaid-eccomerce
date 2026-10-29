import React, { useEffect, useState } from "react";
import axios from "axios";

import {
  FaUser,
  FaHeart,
  FaShoppingCart,
  FaMapMarkerAlt,
  FaLock,
  FaBoxOpen,
  FaBell,
  FaHome,
  FaSignOutAlt,
  FaCheck,
  FaBars,
  FaTimes,
  FaChevronDown,
} from "react-icons/fa";

import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import "./CustomerDashboard.css";

import Password from "../ChangePassword";
import MyProfile from "../MyProfile";
import Wishlist from "../../../Shop/Wishlist/Wishlist";
import Cart from "../../../Shop/Cart/Cart";
import MyAddress from "../../../Profile/MyAddress/MyAddress";
import MyOrders from "../../../Shop/MyOrders/MyOrders";

import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../../../../services/notificationService";

// Full-colour logo (same file the Corporate / HR layouts use).
// NOTE: path assumes this file sits 4 folders below /src, like the
// services import above. Adjust if your assets folder is elsewhere.
import logo from "../../../../assets/images/zaidlogo-light.png";

// =====================================================
// API (sirf .env se: VITE_API_URL)
// =====================================================

const API = import.meta.env.VITE_API_URL || "";

// =====================================================
// SERVER URL
// =====================================================

const SERVER_URL = API.replace(/\/api\/?$/, "");

// =====================================================
// MENU LABELS (UI only: shown in the top bar)
// =====================================================

const MENU_LABELS = {
  profile: "My Profile",
  orders: "My Orders",
  "order-details": "Order Details",
  wishlist: "Wishlist",
  cart: "Cart",
  address: "My Address",
  notifications: "Notifications",
  password: "Change Password",
};

// =====================================================
// PAGES THAT GET THE SHARED "CART-STYLE" THEME (UI only)
// Cart and Notifications already ship their own styling.
// =====================================================

const SELF_STYLED_MENUS = ["cart", "notifications"];

// =====================================================
// CUSTOMER DASHBOARD
// =====================================================

const CustomerDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: orderId } = useParams();

  // ===================================================
  // ACTIVE MENU
  // ===================================================

  const [activeMenu, setActiveMenu] = useState(
    location.state?.activeMenu || "profile"
  );

  // ===================================================
  // MOBILE SIDEBAR
  // ===================================================

  const [customerSidebarOpen, setCustomerSidebarOpen] =
    useState(false);

  // Desktop collapse (UI only, same behaviour as the corporate layout)
  const [collapsed, setCollapsed] = useState(false);

  // ===================================================
  // USER
  // ===================================================

  const [user, setUser] = useState({
    fullName: "Customer",
    role: "Customer",
    profileImage: "",
  });

  // ===================================================
  // TOKEN
  // ===================================================

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("userToken") ||
    localStorage.getItem("accessToken") ||
    "";

  // ===================================================
  // NOTIFICATIONS
  // ===================================================

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationLoading, setNotificationLoading] =
    useState(false);

  // ===================================================
  // LOAD NOTIFICATIONS
  // ===================================================

  const loadNotifications = async () => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setNotificationLoading(true);

      const response = await getMyNotifications();

      setNotifications(
        Array.isArray(response?.notifications)
          ? response.notifications
          : []
      );

      setUnreadCount(
        Number(response?.unreadCount || 0)
      );
    } catch (error) {
      console.error(
        "CUSTOMER DASHBOARD NOTIFICATION ERROR:",
        error
      );
    } finally {
      setNotificationLoading(false);
    }
  };

  // ===================================================
  // NOTIFICATION CLICK
  // ===================================================

  const handleNotificationClick = async (
    notification
  ) => {
    if (
      notification?.isRead ||
      !notification?._id
    ) {
      return;
    }

    try {
      await markNotificationAsRead(
        notification._id
      );

      setNotifications((previous) =>
        previous.map((item) =>
          item._id === notification._id
            ? {
                ...item,
                isRead: true,
              }
            : item
        )
      );

      setUnreadCount((previous) =>
        Math.max(previous - 1, 0)
      );
    } catch (error) {
      console.error(
        "CUSTOMER DASHBOARD MARK NOTIFICATION ERROR:",
        error
      );
    }
  };

  // ===================================================
  // MARK ALL NOTIFICATIONS READ
  // ===================================================

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();

      setNotifications((previous) =>
        previous.map((item) => ({
          ...item,
          isRead: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(
        "CUSTOMER DASHBOARD MARK ALL READ ERROR:",
        error
      );
    }
  };

  // ===================================================
  // FETCH USER
  // ===================================================

  const fetchUserData = async () => {
    try {
      if (!token) {
        return;
      }

      const response = await axios.get(
        `${API}/users/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const userData =
        response?.data?.data ||
        response?.data?.user ||
        response?.data ||
        {};

      const fullName =
        userData.fullName ||
        `${userData.firstName || ""} ${
          userData.lastName || ""
        }`.trim() ||
        "Customer";

      setUser({
        fullName,
        role: userData.role || "Customer",
        profileImage:
          userData.profileImage || "",
      });
    } catch (error) {
      console.error(
        "CUSTOMER DASHBOARD PROFILE ERROR:",
        error
      );
    }
  };

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    fetchUserData();
    loadNotifications();
  }, []);

  // ===================================================
  // AVATAR URL
  // ===================================================

  const getAvatarUrl = () => {
    if (user.profileImage) {
      return user.profileImage.startsWith("http")
        ? user.profileImage
        : `${SERVER_URL}${user.profileImage}`;
    }

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user.fullName
    )}&background=57a41d&color=fff&bold=true`;
  };

  // ===================================================
  // HOME
  // ===================================================

  const handleHome = () => {
    setCustomerSidebarOpen(false);
    navigate("/");
  };

  // ===================================================
  // MENU CHANGE
  // ===================================================

  const handleMenuChange = (menu) => {
    setActiveMenu(menu);
    setCustomerSidebarOpen(false);
  };

  // ===================================================
  // HAMBURGER: drawer on small screens, collapse on desktop
  // ===================================================

  const handleToggle = () => {
    if (window.matchMedia("(min-width: 1025px)").matches) {
      setCollapsed((current) => !current);
    } else {
      setCustomerSidebarOpen(true);
    }
  };

  // ===================================================
  // LOGOUT
  // ===================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userToken");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");

    setCustomerSidebarOpen(false);

    navigate("/");
  };

  // ===================================================
  // RENDER PAGE
  // ===================================================

  const renderPage = () => {
    switch (activeMenu) {
      // -----------------------------------------------
      // PROFILE
      // -----------------------------------------------

      case "profile":
        return <MyProfile />;

      // -----------------------------------------------
      // ORDERS
      // -----------------------------------------------

      case "orders":
        return <MyOrders />;

      case "order-details":
        return orderId
          ? <OrderDetails orderId={orderId} />
          : <p>Order ID not found.</p>;

      // -----------------------------------------------
      // WISHLIST
      // -----------------------------------------------

      case "wishlist":
        return <Wishlist />;

      // -----------------------------------------------
      // CART
      // -----------------------------------------------

      case "cart":
        return <Cart />;

      // -----------------------------------------------
      // ADDRESS
      // -----------------------------------------------

      case "address":
        return <MyAddress />;

      // -----------------------------------------------
      // NOTIFICATIONS
      // -----------------------------------------------

      case "notifications":
        return (
          <div className="customer-notifications-panel">
            {/* Notification Header */}

            <div className="customer-notifications-header">
              <div>
                <span className="customer-section-label">
                  ACCOUNT NOTIFICATIONS
                </span>

                <h2>Notifications</h2>

                <p>
                  {unreadCount > 0
                    ? `${unreadCount} unread notification${
                        unreadCount > 1 ? "s" : ""
                      }`
                    : "You're all caught up"}
                </p>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  className="customer-mark-all-btn"
                  onClick={handleMarkAllRead}
                >
                  <FaCheck />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* Notification List */}

            <div className="customer-notifications-list">
              {notificationLoading ? (
                <div className="customer-notification-status">
                  <div className="customer-loading-spinner" />
                  <span>
                    Loading notifications...
                  </span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="customer-notification-empty">
                  <div className="customer-empty-icon">
                    <FaBell />
                  </div>

                  <h3>No notifications</h3>

                  <p>
                    New order updates will appear
                    here.
                  </p>
                </div>
              ) : (
                notifications.map(
                  (notification) => (
                    <button
                      key={notification._id}
                      type="button"
                      onClick={() =>
                        handleNotificationClick(
                          notification
                        )
                      }
                      className={`customer-notification-row${
                        !notification.isRead
                          ? " customer-notification-unread"
                          : ""
                      }`}
                    >
                      <div className="customer-notification-icon">
                        <FaBell />
                      </div>

                      <div className="customer-notification-body">
                        <div className="customer-notification-heading">
                          <h4>
                            {notification.title}
                          </h4>

                          {!notification.isRead && (
                            <span className="customer-notification-dot" />
                          )}
                        </div>

                        <p className="customer-notification-message">
                          {notification.message}
                        </p>

                        {notification.createdAt && (
                          <p className="customer-notification-time">
                            {new Date(
                              notification.createdAt
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </p>
                        )}
                      </div>
                    </button>
                  )
                )
              )}
            </div>
          </div>
        );

      // -----------------------------------------------
      // CHANGE PASSWORD
      // -----------------------------------------------

      case "password":
        return <Password />;

      // -----------------------------------------------
      // DEFAULT
      // -----------------------------------------------

      default:
        return <MyProfile />;
    }
  };

  // ===================================================
  // LOCATION ACTIVE MENU
  // ===================================================

  useEffect(() => {
    if (location.state?.activeMenu) {
      setActiveMenu(
        location.state.activeMenu
      );
    }
  }, [location]);

  // ===================================================
  // BODY SCROLL LOCK
  // ===================================================

  useEffect(() => {
    if (customerSidebarOpen) {
      document.body.classList.add(
        "customer-dashboard-sidebar-open"
      );
    } else {
      document.body.classList.remove(
        "customer-dashboard-sidebar-open"
      );
    }

    return () => {
      document.body.classList.remove(
        "customer-dashboard-sidebar-open"
      );
    };
  }, [customerSidebarOpen]);

  // ===================================================
  // CONTENT WRAPPER CLASSES (UI only)
  //   customer-page-<menu>   -> per-page hook
  //   customer-page-themed   -> shared Cart-style theme for
  //                             Orders / Wishlist / Address /
  //                             Profile / Password
  // ===================================================

  const contentClassName = [
    "customer-dashboard-content-card",
    `customer-page-${activeMenu}`,
    SELF_STYLED_MENUS.includes(activeMenu)
      ? ""
      : "customer-page-themed",
  ]
    .filter(Boolean)
    .join(" ");

  // ===================================================
  // JSX
  // ===================================================

  return (
    <div
      className={`customer-dashboard-root${
        collapsed ? " is-collapsed" : ""
      }`}
    >

      {/* =================================================
          TOP BAR (all screen sizes, like the corporate layout)
      ================================================= */}

      <header className="customer-dashboard-topbar">
        <button
          type="button"
          className="customer-dashboard-menu-toggle"
          onClick={handleToggle}
          aria-label="Toggle customer menu"
          aria-expanded={customerSidebarOpen}
        >
          <FaBars />
        </button>

        <h2 className="customer-dashboard-topbar-title">
          {MENU_LABELS[activeMenu] || "My Profile"}
        </h2>

        <div className="customer-dashboard-topbar-right">
          <button
            type="button"
            className="customer-dashboard-bell"
            onClick={() =>
              handleMenuChange("notifications")
            }
            aria-label={
              unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : "Notifications"
            }
          >
            <FaBell />

            {unreadCount > 0 && (
              <span className="customer-dashboard-bell-badge">
                {unreadCount > 99
                  ? "99+"
                  : unreadCount}
              </span>
            )}
          </button>

          <div className="customer-dashboard-topbar-user">
            <img
              src={getAvatarUrl()}
              alt={user.fullName}
              className="customer-dashboard-topbar-avatar"
              onError={(event) => {
                event.currentTarget.src =
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user.fullName
                  )}&background=57a41d&color=fff&bold=true`;
              }}
            />

            <div className="customer-dashboard-topbar-meta">
              <span className="customer-dashboard-topbar-name">
                {user.fullName}
              </span>

              <span className="customer-dashboard-topbar-role">
                {user.role}
              </span>
            </div>

            <FaChevronDown className="customer-dashboard-topbar-chevron" />
          </div>
        </div>
      </header>

      {/* =================================================
          MOBILE OVERLAY
      ================================================= */}

      {customerSidebarOpen && (
        <div
          className="customer-dashboard-sidebar-overlay"
          onClick={() =>
            setCustomerSidebarOpen(false)
          }
        />
      )}

      {/* =================================================
          CUSTOMER SIDEBAR
      ================================================= */}

      <aside
        className={`customer-dashboard-sidebar ${
          customerSidebarOpen
            ? "customer-dashboard-sidebar-open"
            : ""
        }`}
      >
        {/* =================================================
            SIDEBAR HEADER
        ================================================= */}

        {/* Decorative wave (same SVG as the corporate sidebar) */}
        <svg
          className="customer-dashboard-sidebar-wave"
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

        <div className="customer-dashboard-sidebar-header">

          <div className="customer-dashboard-brand">
            {/* Logo sits on a light card so it keeps its colours */}
            <div className="customer-dashboard-brand-card">
              <img
                src={logo}
                alt="Zaid Infotech"
                className="customer-dashboard-logo"
                decoding="async"
                draggable={false}
              />
            </div>

            <button
              type="button"
              className="customer-dashboard-sidebar-close"
              onClick={() =>
                setCustomerSidebarOpen(false)
              }
              aria-label="Close customer menu"
            >
              <FaTimes />
            </button>
          </div>

          {/* =================================================
              CUSTOMER INFO
          ================================================= */}

          <div className="customer-dashboard-user-card">
            <div className="customer-dashboard-avatar-wrapper">
              <img
                src={getAvatarUrl()}
                alt={user.fullName}
                className="customer-dashboard-avatar"
                onError={(event) => {
                  event.currentTarget.src =
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user.fullName
                    )}&background=57a41d&color=fff&bold=true`;
                }}
              />

              <span className="customer-dashboard-online-dot" />
            </div>

            <div className="customer-dashboard-user-info">
              <h3>{user.fullName}</h3>

              <span>
                {user.role}
              </span>
            </div>
          </div>

          <div className="customer-dashboard-menu-title">
            <span>ACCOUNT MENU</span>
          </div>
        </div>

        {/* =================================================
            SCROLLABLE MENU
        ================================================= */}

        <nav className="customer-dashboard-menu">

          {/* HOME */}

          <button
            type="button"
            className="customer-dashboard-menu-item customer-dashboard-home-item"
            onClick={handleHome}
          >
            <span className="customer-dashboard-menu-icon">
              <FaHome />
            </span>

            <span className="customer-dashboard-menu-text">
              Home
            </span>
          </button>

          {/* NOTIFICATIONS */}

          <button
            type="button"
            className={`customer-dashboard-menu-item ${
              activeMenu === "notifications"
                ? "customer-dashboard-menu-active"
                : ""
            }`}
            onClick={() =>
              handleMenuChange(
                "notifications"
              )
            }
          >
            <span className="customer-dashboard-menu-icon customer-dashboard-notification-icon">
              <FaBell />

              {unreadCount > 0 && (
                <span className="customer-dashboard-notification-badge">
                  {unreadCount > 99
                    ? "99+"
                    : unreadCount}
                </span>
              )}
            </span>

            <span className="customer-dashboard-menu-text">
              Notifications
            </span>
          </button>

          {/* PROFILE */}

          <button
            type="button"
            className={`customer-dashboard-menu-item ${
              activeMenu === "profile"
                ? "customer-dashboard-menu-active"
                : ""
            }`}
            onClick={() =>
              handleMenuChange("profile")
            }
          >
            <span className="customer-dashboard-menu-icon">
              <FaUser />
            </span>

            <span className="customer-dashboard-menu-text">
              My Profile
            </span>
          </button>

          {/* ORDERS */}

          <button
            type="button"
            className={`customer-dashboard-menu-item ${
              activeMenu === "orders"
                ? "customer-dashboard-menu-active"
                : ""
            }`}
            onClick={() =>
              handleMenuChange("orders")
            }
          >
            <span className="customer-dashboard-menu-icon">
              <FaBoxOpen />
            </span>

            <span className="customer-dashboard-menu-text">
              My Orders
            </span>
          </button>

          {/* WISHLIST */}

          <button
            type="button"
            className={`customer-dashboard-menu-item ${
              activeMenu === "wishlist"
                ? "customer-dashboard-menu-active"
                : ""
            }`}
            onClick={() =>
              handleMenuChange(
                "wishlist"
              )
            }
          >
            <span className="customer-dashboard-menu-icon">
              <FaHeart />
            </span>

            <span className="customer-dashboard-menu-text">
              Wishlist
            </span>
          </button>

          {/* CART */}

          <button
            type="button"
            className={`customer-dashboard-menu-item ${
              activeMenu === "cart"
                ? "customer-dashboard-menu-active"
                : ""
            }`}
            onClick={() =>
              handleMenuChange("cart")
            }
          >
            <span className="customer-dashboard-menu-icon">
              <FaShoppingCart />
            </span>

            <span className="customer-dashboard-menu-text">
              Cart
            </span>
          </button>

          {/* ADDRESS */}

          <button
            type="button"
            className={`customer-dashboard-menu-item ${
              activeMenu === "address"
                ? "customer-dashboard-menu-active"
                : ""
            }`}
            onClick={() =>
              handleMenuChange("address")
            }
          >
            <span className="customer-dashboard-menu-icon">
              <FaMapMarkerAlt />
            </span>

            <span className="customer-dashboard-menu-text">
              My Address
            </span>
          </button>

          {/* PASSWORD */}

          <button
            type="button"
            className={`customer-dashboard-menu-item ${
              activeMenu === "password"
                ? "customer-dashboard-menu-active"
                : ""
            }`}
            onClick={() =>
              handleMenuChange(
                "password"
              )
            }
          >
            <span className="customer-dashboard-menu-icon">
              <FaLock />
            </span>

            <span className="customer-dashboard-menu-text">
              Change Password
            </span>
          </button>
        </nav>

        {/* =================================================
            FIXED BOTTOM LOGOUT
        ================================================= */}

        <div className="customer-dashboard-sidebar-footer">
          <button
            type="button"
            className="customer-dashboard-logout-btn"
            onClick={handleLogout}
          >
            <span className="customer-dashboard-logout-icon">
              <FaSignOutAlt />
            </span>

            <span>
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* =================================================
          RIGHT CONTENT
      ================================================= */}

      <main className="customer-dashboard-main">

        <div className="customer-dashboard-content">

          {/* =================================================
              WELCOME CARD
          ================================================= */}

          <div className="customer-dashboard-welcome-card">

            <div className="customer-dashboard-welcome-content">

              <span className="customer-dashboard-welcome-label">
                CUSTOMER DASHBOARD
              </span>

              <h1>
                Welcome Back,{" "}
                <span>{user.fullName.split(" ")[0]}</span> 👋
              </h1>

              <p>
                Manage your profile, orders,
                wishlist and account settings
                from one place.
              </p>
            </div>

            <div className="customer-dashboard-welcome-icon">
              <FaUser />
            </div>
          </div>

          {/* =================================================
              DYNAMIC CONTENT
          ================================================= */}

          <div className={contentClassName}>
            {renderPage()}
          </div>

        </div>
      </main>
    </div>
  );
};

export default CustomerDashboard;
