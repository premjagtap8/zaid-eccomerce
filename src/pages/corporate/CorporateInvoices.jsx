import { useEffect, useMemo, useState } from "react";
import {
  FiRefreshCw,
  FiEye,
  FiSearch,
  FiFileText,
  FiCheckCircle,
  FiClock,
} from "react-icons/fi";
import { toast } from "react-toastify";

import { getMyInvoices } from "../../services/invoiceService";
import WalkInInvoice from "../Receptionist/WalkInOrders/WalkInInvoice/WalkInInvoice";

import "./CorporateInvoices.css";

// =====================================================
// HELPERS
// =====================================================

const money = (value) =>
  `₹ ${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Prepares an invoice for the existing WalkInInvoice popup:
// - Bill To shows the company name, company email and GSTIN
// - Ship To keeps the delivery contact saved on the invoice
const toInvoiceView = (invoice) => {
  const user =
    invoice?.user && typeof invoice.user === "object" ? invoice.user : {};
  const business = user.businessDetails || {};
  const billing = invoice?.billingAddress || {};

  const contactName = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ");

  return {
    ...invoice,
    shippingAddress: billing,
    billingAddress: {
      ...billing,
      fullName: business.companyName || billing.fullName || contactName,
      email: user.email || "",
      gstin: business.gstNumber || "",
    },
  };
};

// =====================================================
// PAGE
// =====================================================

export default function CorporateInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await getMyInvoices();
      const list = response?.data || response?.invoices || [];
      setInvoices(Array.isArray(list) ? list : []);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Unable to load your invoices"
      );
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase();
    if (!text) return invoices;

    return invoices.filter((invoice) =>
      [invoice.invoiceNumber, invoice.paymentStatus, invoice.paymentMethod]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(text)
    );
  }, [invoices, search]);

  const totals = useMemo(
    () =>
      invoices.reduce(
        (sum, invoice) => ({
          invoiced: sum.invoiced + Number(invoice.totalAmount || 0),
          paid: sum.paid + Number(invoice.paidAmount || 0),
          balance: sum.balance + Number(invoice.balanceAmount || 0),
        }),
        { invoiced: 0, paid: 0, balance: 0 }
      ),
    [invoices]
  );

  return (
    <div className="corpinv-page">
      {/* HEADER BANNER */}
      <div className="corpinv-header">
        <div className="corpinv-header-text">
          <h1>
            Tax <span>invoices</span>
          </h1>
          <p>Tax invoices for your company's orders</p>
        </div>

        <button type="button" onClick={loadInvoices} disabled={loading}>
          <FiRefreshCw className={loading ? "corpinv-spin" : ""} />
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="corpinv-summary">
        <div className="corpinv-stat">
          <div className="corpinv-stat-icon">
            <FiFileText />
          </div>
          <strong>{money(totals.invoiced)}</strong>
          <span>Total invoiced</span>
        </div>

        <div className="corpinv-stat">
          <div className="corpinv-stat-icon">
            <FiCheckCircle />
          </div>
          <strong>{money(totals.paid)}</strong>
          <span>Paid</span>
        </div>

        <div className="corpinv-stat corpinv-stat-due">
          <div className="corpinv-stat-icon">
            <FiClock />
          </div>
          <strong>{money(totals.balance)}</strong>
          <span>Balance due</span>
        </div>
      </div>

      {/* SEARCH */}
      <div className="corpinv-search">
        <FiSearch />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by invoice number, status or payment method"
        />
      </div>

      {/* LIST */}
      {loading && invoices.length === 0 ? (
        <div className="corpinv-empty">
          <span className="corpinv-loader" aria-hidden="true" />
          Loading your invoices...
        </div>
      ) : filtered.length === 0 ? (
        <div className="corpinv-empty">
          <h3>No invoices found</h3>
          <p>
            {invoices.length === 0
              ? "Invoices appear here after your orders are paid."
              : "No invoice matches your search."}
          </p>
        </div>
      ) : (
        <div className="corpinv-table-wrap">
          <table className="corpinv-table">
            <thead>
              <tr>
                <th>Invoice no.</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {filtered.map((invoice) => {
                const status = String(
                  invoice.paymentStatus || "PENDING"
                ).toUpperCase();

                const units = (invoice.items || []).reduce(
                  (sum, item) => sum + Number(item.quantity || 0),
                  0
                );

                return (
                  <tr key={invoice._id}>
                    <td className="corpinv-number" data-label="Invoice no.">
                      {invoice.invoiceNumber}
                    </td>
                    <td data-label="Date">
                      {formatDate(invoice.invoiceDate || invoice.createdAt)}
                    </td>
                    <td data-label="Items">{units}</td>
                    <td data-label="Total">{money(invoice.totalAmount)}</td>
                    <td data-label="Paid">{money(invoice.paidAmount)}</td>
                    <td data-label="Balance">{money(invoice.balanceAmount)}</td>
                    <td data-label="Status">
                      <span
                        className={`corpinv-status corpinv-${status.toLowerCase()}`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="corpinv-actions">
                      <button
                        type="button"
                        className="corpinv-view"
                        onClick={() => setSelected(toInvoiceView(invoice))}
                      >
                        <FiEye />
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <WalkInInvoice order={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
