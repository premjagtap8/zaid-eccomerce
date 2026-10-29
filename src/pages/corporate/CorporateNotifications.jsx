import React, { useEffect, useState } from "react";
import { FaBell, FaCheck } from "react-icons/fa";

import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../../services/notificationService";

import "./CorporateNotifications.css";

// =====================================================
// CORPORATE NOTIFICATIONS
//
// Same data source as the customer dashboard
// (notificationService), rendered as its own page
// inside CorporateLayout. Nothing in the customer
// dashboard is touched.
//
// After any read change it fires a
// "notifications-updated" window event so the sidebar
// badge (CorporateLayout) and header bell can refresh.
// =====================================================

const CorporateNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const notifyOthers = () => {
    window.dispatchEvent(new CustomEvent("notifications-updated"));
  };

  const loadNotifications = async () => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await getMyNotifications();

      setNotifications(
        Array.isArray(response?.notifications)
          ? response.notifications
          : []
      );

      setUnreadCount(Number(response?.unreadCount || 0));
    } catch (error) {
      console.error("CORPORATE NOTIFICATION ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Clicking a notification marks it as read
  const handleNotificationClick = async (notification) => {
    if (notification.isRead) return;

    try {
      await markNotificationAsRead(notification._id);

      setNotifications((prev) =>
        prev.map((item) =>
          item._id === notification._id
            ? { ...item, isRead: true }
            : item
        )
      );

      setUnreadCount((prev) => Math.max(prev - 1, 0));
      notifyOthers();
    } catch (error) {
      console.error("MARK NOTIFICATION ERROR:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();

      setNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true }))
      );

      setUnreadCount(0);
      notifyOthers();
    } catch (error) {
      console.error("MARK ALL READ ERROR:", error);
    }
  };

  return (
    <div className="corp-notif-page">
      {/* Hero (title + primary action) */}
      <section className="corp-notif-hero">
        <div className="corp-notif-heading">
          <h1 className="corp-notif-title">
            Corporate <span>notifications</span>
          </h1>

          <p className="corp-notif-subtitle">
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
            className="corp-notif-markall"
            onClick={handleMarkAllRead}
          >
            <FaCheck aria-hidden="true" />
            <span>Mark all read</span>
          </button>
        )}
      </section>

      {/* List card */}
      <section className="corp-notif-card">
        <div className="corp-notif-card-header">
          <h2 className="corp-notif-card-title">
            All notifications
          </h2>

          <p className="corp-notif-card-sub">
            Select a notification to mark it as read
          </p>
        </div>

        {loading ? (
          <div className="corp-notif-status">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="corp-notif-empty">
            <div className="corp-notif-empty-icon">
              <FaBell aria-hidden="true" />
            </div>

            <p className="corp-notif-empty-title">
              No notifications
            </p>

            <p className="corp-notif-empty-text">
              New order updates will appear here.
            </p>
          </div>
        ) : (
          <ul className="corp-notif-list">
            {notifications.map((notification) => (
              <li key={notification._id}>
                <button
                  type="button"
                  onClick={() =>
                    handleNotificationClick(notification)
                  }
                  className={`corp-notif-item${
                    notification.isRead
                      ? ""
                      : " corp-notif-item--unread"
                  }`}
                >
                  <span className="corp-notif-icon">
                    <FaBell aria-hidden="true" />
                  </span>

                  <span className="corp-notif-body">
                    <span className="corp-notif-item-top">
                      <span className="corp-notif-item-title">
                        {notification.title}
                      </span>

                      {!notification.isRead && (
                        <span
                          className="corp-notif-dot"
                          aria-label="Unread"
                        />
                      )}
                    </span>

                    <span className="corp-notif-message">
                      {notification.message}
                    </span>

                    {notification.createdAt && (
                      <span className="corp-notif-time">
                        {new Date(
                          notification.createdAt
                        ).toLocaleString("en-IN")}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default CorporateNotifications;
