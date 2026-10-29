import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaChevronDown,
  FaChevronUp,
  FaPlus,
  FaSearch,
} from "react-icons/fa";

// NOTE: change this import if your order API file has a different name
import { getMyOrders } from "../../services/orderService";

import "./MyOrders.css";


// =====================================================
// CONSTANTS
// =====================================================

const NEW_ORDER_ROUTE = "/shop";

const INACTIVE_STATUSES = ["DELIVERED", "CANCELLED", "RETURNED"];

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "ACTIVE", label: "Active" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "CLOSED", label: "Cancelled and returned" },
];


// =====================================================
// HELPERS
// =====================================================

const formatINR = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const shortOrderId = (order) =>
  `#${String(order?._id || "").slice(-6).toUpperCase()}`;

const getOrderQuantity = (order) =>
  (order?.orderItems || []).reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

const getItemsText = (order) => {
  const items = order?.orderItems || [];

  if (items.length === 0) return "-";

  const first = `${items[0].quantity} × ${items[0].title}`;

  return items.length > 1
    ? `${first} +${items.length - 1} more`
    : first;
};

const statusLabel = (status) => {
  const text = String(status || "").replace(/_/g, " ").toLowerCase();

  return text.charAt(0).toUpperCase() + text.slice(1);
};

const badgeClass = (status) =>
  `mo-badge--${String(status || "")
    .toLowerCase()
    .replace(/_/g, "-")}`;

const matchesFilter = (order, filter) => {
  const status = order.orderStatus;

  if (filter === "ACTIVE") return !INACTIVE_STATUSES.includes(status);
  if (filter === "DELIVERED") return status === "DELIVERED";
  if (filter === "CLOSED") {
    return status === "CANCELLED" || status === "RETURNED";
  }

  return true;
};


// =====================================================
// COMPONENT
// =====================================================

export default function MyOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);


  // ===================================================
  // LOAD ORDERS
  // ===================================================

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getMyOrders();

        console.log("MY ORDERS RESPONSE:", response);

        const list =
          response?.orders ||
          response?.data?.orders ||
          response?.data ||
          [];

        setOrders(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("MY ORDERS ERROR:", err);

        setError(
          err?.response?.data?.message || "Couldn't load your orders."
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);


  // ===================================================
  // FILTER COUNTS + VISIBLE ORDERS
  // ===================================================

  const counts = useMemo(() => {
    const result = {};

    FILTERS.forEach((item) => {
      result[item.key] = orders.filter((order) =>
        matchesFilter(order, item.key)
      ).length;
    });

    return result;
  }, [orders]);

  const visibleOrders = useMemo(() => {
    const text = search.trim().toLowerCase();

    return orders.filter((order) => {
      if (!matchesFilter(order, filter)) return false;

      if (!text) return true;

      const idMatch = shortOrderId(order).toLowerCase().includes(text);

      const itemMatch = (order.orderItems || []).some((item) =>
        String(item.title || "").toLowerCase().includes(text)
      );

      return idMatch || itemMatch;
    });
  }, [orders, filter, search]);

  const toggleRow = (orderId) => {
    setExpandedId((current) => (current === orderId ? null : orderId));
  };


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="mo-page">

      {/* HERO (title + primary action) */}

      <section className="mo-hero">
        <div className="mo-hero-text">
          <h2 className="mo-title">
            My <span>orders</span>
          </h2>

          <p className="mo-subtitle">
            Track every order your company has placed
          </p>
        </div>

        <button
          type="button"
          className="mo-btn-primary"
          onClick={() => navigate(NEW_ORDER_ROUTE)}
        >
          <FaPlus className="mo-btn-icon" />
          New order
        </button>
      </section>


      {/* TOOLBAR */}

      <div className="mo-toolbar">
        <div className="mo-chips">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`mo-chip ${
                filter === item.key ? "mo-chip--active" : ""
              }`}
              onClick={() => setFilter(item.key)}
            >
              {item.label}
              <span className="mo-chip-count">{counts[item.key]}</span>
            </button>
          ))}
        </div>

        <div className="mo-search">
          <FaSearch className="mo-search-icon" />

          <input
            type="text"
            aria-label="Search orders"
            placeholder="Search by order ID or laptop"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>


      {/* ORDERS TABLE */}

      <section className="mo-card">
        <div className="mo-card-header">
          <h3 className="mo-card-title">Order history</h3>

          <p className="mo-card-sub">
            Select an order to see its items, delivery address and tracking
          </p>
        </div>

        {loading ? (
          <p className="mo-empty">Loading your orders…</p>
        ) : error ? (
          <p className="mo-empty mo-empty--error">{error}</p>
        ) : orders.length === 0 ? (
          <p className="mo-empty">
            You haven't placed any orders yet. Start with your first
            bulk order.
          </p>
        ) : visibleOrders.length === 0 ? (
          <p className="mo-empty">
            No orders match your filters. Try a different search.
          </p>
        ) : (
          <div className="mo-table-wrap">
            <table className="mo-table mo-table--wide">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Items</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th className="mo-right">Total</th>
                  <th aria-label="Details" />
                </tr>
              </thead>

              <tbody>
                {visibleOrders.map((order) => {
                  const isOpen = expandedId === order._id;
                  const address = order.shippingAddress || {};
                  const tracking = order.tracking || {};
                  const history = tracking.history || [];

                  return (
                    <React.Fragment key={order._id}>
                      <tr
                        className={`mo-row-click ${
                          isOpen ? "mo-row-open" : ""
                        }`}
                        onClick={() => toggleRow(order._id)}
                      >
                        <td className="mo-cell-strong">
                          {shortOrderId(order)}
                        </td>

                        <td>{getItemsText(order)}</td>

                        <td className="mo-cell-muted">
                          {formatDate(order.createdAt)}
                        </td>

                        <td>
                          <span
                            className={`mo-badge ${badgeClass(
                              order.orderStatus
                            )}`}
                          >
                            {statusLabel(order.orderStatus)}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`mo-badge ${badgeClass(
                              order.paymentStatus
                            )}`}
                          >
                            {statusLabel(order.paymentStatus)}
                          </span>
                        </td>

                        <td className="mo-right mo-cell-strong">
                          {formatINR(order.finalAmount)}
                        </td>

                        <td className="mo-right">
                          <button
                            type="button"
                            className="mo-expand-btn"
                            aria-expanded={isOpen}
                            aria-label={
                              isOpen ? "Hide details" : "Show details"
                            }
                          >
                            {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                          </button>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr className="mo-detail-row">
                          <td colSpan={7}>
                            <div className="mo-detail">

                              <div>
                                <p className="mo-detail-title">
                                  Items ({getOrderQuantity(order)} units)
                                </p>

                                {(order.orderItems || []).map((item) => (
                                  <div
                                    key={item._id}
                                    className="mo-detail-line"
                                  >
                                    <span>
                                      {item.quantity} × {item.title}
                                    </span>

                                    <span>
                                      {formatINR(item.price)} each ·{" "}
                                      {formatINR(
                                        item.price * item.quantity
                                      )}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              <div>
                                <p className="mo-detail-title">
                                  Delivery address
                                </p>

                                <p className="mo-detail-text">
                                  {address.fullName}
                                  <br />
                                  {address.addressLine}
                                  {address.landmark
                                    ? `, ${address.landmark}`
                                    : ""}
                                  <br />
                                  {address.city}, {address.state}{" "}
                                  {address.pincode}
                                  <br />
                                  {address.phone}
                                </p>
                              </div>

                              <div>
                                <p className="mo-detail-title">Tracking</p>

                                {tracking.courierName ||
                                tracking.trackingNumber ? (
                                  <p className="mo-detail-text">
                                    {tracking.courierName}{" "}
                                    {tracking.trackingNumber
                                      ? `· ${tracking.trackingNumber}`
                                      : ""}
                                  </p>
                                ) : null}

                                {history.length === 0 ? (
                                  <p className="mo-detail-text">
                                    No updates yet.
                                  </p>
                                ) : (
                                  [...history].reverse().map((entry) => (
                                    <div
                                      key={entry._id}
                                      className="mo-detail-line"
                                    >
                                      <span>
                                        {statusLabel(entry.status)}
                                        {entry.message
                                          ? ` · ${entry.message}`
                                          : ""}
                                      </span>

                                      <span className="mo-cell-muted">
                                        {formatDateTime(entry.createdAt)}
                                      </span>
                                    </div>
                                  ))
                                )}
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
