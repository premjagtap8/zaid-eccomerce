import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBoxOpen,
  FaChevronRight,
  FaClipboardList,
  FaFileInvoice,
  FaHeadset,
  FaLaptop,
  FaPlus,
} from "react-icons/fa";

// NOTE: change this import if your order API file has a different name
import { getMyOrders } from "../../services/orderService";

import "./CorporateView.css";

// =====================================================
// ROUTES
// =====================================================

const ROUTES = {
  newOrder: "/shop",
  orders: "/corporate-dashboard/orders",
  invoices: "/corporate-dashboard/invoices",
  devices: "/corporate-dashboard/devices",
  support: "/corporate-dashboard/support",
};

const RECENT_ORDERS_COUNT = 4;

const INACTIVE_STATUSES = ["DELIVERED", "CANCELLED", "RETURNED"];

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
  const text = String(status || "")
    .replace(/_/g, " ")
    .toLowerCase();

  return text.charAt(0).toUpperCase() + text.slice(1);
};

const statusClass = (status) =>
  `co-badge--${String(status || "")
    .toLowerCase()
    .replace(/_/g, "-")}`;

// =====================================================
// COMPONENT
// =====================================================

export default function CorporateOverview() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ===================================================
  // LOAD ORDERS
  // ===================================================

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getMyOrders();

        console.log("CORPORATE ORDERS RESPONSE:", response);

        const list =
          response?.orders ||
          response?.data?.orders ||
          response?.data ||
          [];

        setOrders(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("CORPORATE ORDERS ERROR:", err);

        setError(
          err?.response?.data?.message ||
            "Couldn't load your orders."
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  // ===================================================
  // STATS
  // ===================================================

  const stats = useMemo(() => {
    let activeOrders = 0;
    let devicesOwned = 0;
    let amountDue = 0;

    orders.forEach((order) => {
      if (!INACTIVE_STATUSES.includes(order.orderStatus)) {
        activeOrders += 1;
      }

      if (order.orderStatus === "DELIVERED") {
        devicesOwned += getOrderQuantity(order);
      }

      if (
        !INACTIVE_STATUSES.includes(order.orderStatus) &&
        order.paymentStatus !== "PAID"
      ) {
        amountDue += Math.max(
          Number(order.finalAmount || 0) -
            Number(order.paidAmount || 0),
          0
        );
      }
    });

    return [
      {
        label: "Total orders",
        value: orders.length,
        icon: FaClipboardList,
        iconClass: "co-stat-icon--blue",
      },
      {
        label: "Active orders",
        value: activeOrders,
        icon: FaBoxOpen,
        iconClass: "co-stat-icon--amber",
      },
      {
        label: "Devices delivered",
        value: devicesOwned,
        icon: FaLaptop,
        iconClass: "co-stat-icon--green",
      },
      {
        label: "Amount due",
        value: amountDue,
        isCurrency: true,
        icon: FaFileInvoice,
        iconClass: "co-stat-icon--rose",
      },
    ];
  }, [orders]);

  const recentOrders = orders.slice(0, RECENT_ORDERS_COUNT);

  // ===================================================
  // QUICK ACTIONS
  // ===================================================

  const quickActions = [
    {
      title: "Download GST invoices",
      hint: "Your latest invoices",
      icon: FaFileInvoice,
      to: ROUTES.invoices,
    },
    {
      title: "Raise a support ticket",
      hint: "Warranty and repairs",
      icon: FaHeadset,
      to: ROUTES.support,
    },
  ];

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="co-page">
      {/* HERO (title + primary action) */}

      <section className="co-hero">
        <div className="co-hero-text">
          <h2 className="co-title">
            Corporate <span>overview</span>
          </h2>

          <p className="co-subtitle">
            Wholesale pricing active
          </p>
        </div>

        <button
          type="button"
          className="co-btn-primary"
          onClick={() => navigate(ROUTES.newOrder)}
        >
          <FaPlus className="co-btn-icon" />
          New order
        </button>
      </section>

      {/* STAT CARDS */}

      <div className="co-stats">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div key={stat.label} className="co-stat-card">
              <div
                className={`co-stat-icon ${stat.iconClass}`}
              >
                <Icon />
              </div>

              <div className="co-stat-body">
                <p className="co-stat-value">
                  {loading
                    ? "-"
                    : stat.isCurrency
                    ? formatINR(stat.value)
                    : stat.value}
                </p>

                <p className="co-stat-label">
                  {stat.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* RECENT ORDERS + QUICK ACTIONS */}

      <div className="co-grid">
        <section className="co-card">
          <div className="co-card-header">
            <div>
              <h3 className="co-card-title">
                Recent orders
              </h3>

              <p className="co-card-sub">
                Your latest purchases
              </p>
            </div>

            <button
              type="button"
              className="co-link-btn"
              onClick={() => navigate(ROUTES.orders)}
            >
              View all
            </button>
          </div>

          {loading ? (
            <p className="co-empty">
              Loading your orders…
            </p>
          ) : error ? (
            <p className="co-empty co-empty--error">
              {error}
            </p>
          ) : recentOrders.length === 0 ? (
            <p className="co-empty">
              You haven't placed any orders yet. Start with
              your first bulk order.
            </p>
          ) : (
            <div className="co-table-wrap">
              <table className="co-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Items</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th className="co-right">Total</th>
                  </tr>
                </thead>

                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order._id}>
                      <td className="co-cell-strong">
                        {shortOrderId(order)}
                      </td>

                      <td>{getItemsText(order)}</td>

                      <td className="co-cell-muted">
                        {formatDate(order.createdAt)}
                      </td>

                      <td>
                        <span
                          className={`co-badge ${statusClass(
                            order.orderStatus
                          )}`}
                        >
                          {statusLabel(order.orderStatus)}
                        </span>
                      </td>

                      <td className="co-right co-cell-strong">
                        {formatINR(order.finalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="co-card co-card--padded">
          <div className="co-card-header">
            <div>
              <h3 className="co-card-title">
                Quick actions
              </h3>

              <p className="co-card-sub">
                Common corporate tasks
              </p>
            </div>
          </div>

          <div className="co-actions">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <button
                  key={action.title}
                  type="button"
                  className="co-action-card"
                  onClick={() => navigate(action.to)}
                >
                  <span className="co-action-icon">
                    <Icon />
                  </span>

                  <span className="co-action-text">
                    <span className="co-action-title">
                      {action.title}
                    </span>

                    <span className="co-action-hint">
                      {action.hint}
                    </span>
                  </span>

                  <FaChevronRight className="co-action-chevron" />
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
