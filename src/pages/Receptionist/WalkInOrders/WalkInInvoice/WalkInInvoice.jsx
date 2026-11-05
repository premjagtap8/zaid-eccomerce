import React, { useMemo } from "react";
import "./WalkInInvoice.css";

import zaidInfotechLogo from "../../../../assets/images/zaidinfotechlogo.png";

// ============================================================
// WALK-IN / ORDER INVOICE
// ============================================================
// Supports:
//   1. New order with saved pricing (subtotal, offerDiscount,
//      couponDiscount, taxableAmount, gstPercentage, gstAmount,
//      shippingCharge, otherCharges, finalAmount)
//   2. Old order / invoice (missing values are calculated)
//
// Saved backend values (finalAmount / gstAmount) are trusted;
// the frontend only calculates a fallback when they are missing.
// ============================================================

// Logo ratio is controlled in WalkInInvoice.css (--wkinv-logo-ratio: 1.93).
// These two numbers only give the <img> an intrinsic 1.93:1 size hint
// so the browser reserves the right space before the image loads.
const LOGO_WIDTH = 193;
const LOGO_HEIGHT = 100;

const COMPANY_STATE = "Tamil Nadu";

// ============================================================
// NUMBER / DATE HELPERS
// ============================================================

const safeNumber = (value, fallback = 0) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
};

const round2 = (value) =>
    Math.round((safeNumber(value) + Number.EPSILON) * 100) / 100;

const formatCurrency = (value) =>
    `₹ ${safeNumber(value).toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })}`;

const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

// ============================================================
// GENERIC VALUE / NAME / ADDRESS HELPERS
// ============================================================

const firstValue = (...values) =>
    values.find(
        (value) =>
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
    );

const getFullName = (person = {}) => {
    if (!person) return "";

    const combinedName = [person.firstName, person.lastName]
        .filter(Boolean)
        .join(" ");

    return firstValue(person.fullName, person.name, combinedName) || "";
};

const getAddressText = (address = {}) => {
    if (!address) return "-";

    const parts = [
        address.addressLine,
        address.address,
        address.address1,
        address.address2,
        address.street,
        address.locality,
        address.area,
        address.landmark,
        address.city,
        address.district,
        address.state,
        address.pincode,
        address.postalCode,
        address.zipCode,
    ].filter(Boolean);

    return parts.length === 0 ? "-" : parts.join(", ");
};

// ============================================================
// INDIAN RUPEE AMOUNT IN WORDS
// ============================================================

const ONES = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight",
    "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
    "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];

const TENS = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy",
    "Eighty", "Ninety",
];

const numberToWordsBelow100 = (number) => {
    if (number < 20) {
        return ONES[number] || "";
    }

    const ten = Math.floor(number / 10);
    const one = number % 10;

    return `${TENS[ten]}${one ? ` ${ONES[one]}` : ""}`;
};

const numberToIndianWords = (number) => {
    const value = Math.floor(Math.abs(safeNumber(number)));

    if (value === 0) {
        return "Zero";
    }

    const parts = [];

    const crore = Math.floor(value / 10000000);
    const lakh = Math.floor((value % 10000000) / 100000);
    const thousand = Math.floor((value % 100000) / 1000);
    const hundred = Math.floor((value % 1000) / 100);
    const remainder = value % 100;

    if (crore) parts.push(`${numberToIndianWords(crore)} Crore`);
    if (lakh) parts.push(`${numberToIndianWords(lakh)} Lakh`);
    if (thousand) parts.push(`${numberToIndianWords(thousand)} Thousand`);
    if (hundred) parts.push(`${numberToIndianWords(hundred)} Hundred`);
    if (remainder) parts.push(numberToWordsBelow100(remainder));

    return parts.join(" ");
};

const amountInWords = (amount) => {
    const value = round2(amount);
    const rupees = Math.floor(value);
    const paise = Math.round((value - rupees) * 100);

    if (paise > 0) {
        return `${numberToIndianWords(rupees)} Rupees and ${numberToIndianWords(
            paise
        )} Paise Only`;
    }

    return `${numberToIndianWords(rupees)} Rupees Only`;
};

// ============================================================
// ITEM HELPERS (pure, so they live outside the component)
// ============================================================

const getItemName = (item) =>
    firstValue(
        item.title,
        item.name,
        item.productName,
        item.product?.title,
        item.product?.name,
        item.product?.productName
    ) || "Product";

const getItemDescription = (item) =>
    firstValue(item.description, item.product?.description) || "";

const getItemHsn = (item) =>
    firstValue(
        item.hsnSac,
        item.hsn,
        item.sac,
        item.hsnCode,
        item.product?.hsnSac,
        item.product?.hsn,
        item.product?.sac
    ) || "-";

const getItemQuantity = (item) =>
    safeNumber(item.quantity ?? item.qty ?? 1, 1);

const getItemPrice = (item) =>
    safeNumber(
        item.finalPrice ??
            item.sellingPrice ??
            item.price ??
            item.unitPrice ??
            item.rate ??
            item.originalPrice ??
            item.product?.finalPrice ??
            item.product?.sellingPrice ??
            item.product?.price ??
            0
    );

const getItemTotal = (item) => {
    const quantity = getItemQuantity(item);
    const price = getItemPrice(item);

    return round2(
        safeNumber(
            item.total ?? item.itemTotal ?? item.amount ?? item.lineTotal,
            price * quantity
        )
    );
};

// ============================================================
// COMPANY / BANK (static)
// ============================================================

const company = {
    name: "ZAID INFOTECH",
    address:
        "No 232, 1st Floor, M.K.N. Road, Alandur, Chennai, Tamil Nadu, 600016",
    gstin: "33AIOPFB710C1ZL",
    pan: "AIOPFB710C",
    mobile: "9092590725",
    email: "info@zaidinfotech.in",
    website: "www.zaidinfotech.in",
    tagline: "Affordable Tech for Everyone",
};

const bankDetails = {
    name: "ZAID INFOTECH",
    ifsc: "KVBL0001104",
    account: "1104011000000054",
    bank: "Karur Vysya Bank, CHENNAI ALANDUR",
};

// ============================================================
// COMPONENT
// ============================================================

function WalkInInvoice({ order: orderProp, onClose }) {
    // Hooks must run on every render, so the "no order" early return
    // is placed AFTER the last hook (see bottom of the logic section).
    const order = orderProp || {};

    // ========================================================
    // NORMALIZE ORDER
    // Invoice may be { invoiceNumber, order: { items, ... } }
    // or everything directly on one object. Support both.
    // ========================================================

    const data = useMemo(() => {
        const nestedOrder =
            order.order && typeof order.order === "object"
                ? order.order
                : {};

        return { ...nestedOrder, ...order };
    }, [order]);

    // ========================================================
    // CUSTOMER / BILLING / SHIPPING
    // ========================================================

    const customer =
        data.billingAddress ||
        data.shippingAddress ||
        data.customer ||
        data.user ||
        {};

    const shippingAddress =
        data.shippingAddress ||
        data.billingAddress ||
        data.customer ||
        data.user ||
        {};

    const customerName =
        firstValue(
            customer.fullName,
            customer.name,
            getFullName(data.customer),
            getFullName(data.user),
            data.customerName,
            data.userName
        ) || "Walk-In Customer";

    const customerPhone =
        firstValue(
            customer.phone,
            customer.mobile,
            customer.phoneNumber,
            data.customerPhone,
            data.phone,
            data.mobile
        ) || "-";

    const customerEmail =
        firstValue(customer.email, data.customerEmail, data.email) || "";

    // ========================================================
    // ITEMS
    // ========================================================

    const items = Array.isArray(data.items)
        ? data.items
        : Array.isArray(data.orderItems)
        ? data.orderItems
        : [];

    // ========================================================
    // INVOICE DETAILS
    // ========================================================

    const invoiceNumber =
        firstValue(
            order.invoiceNumber,
            data.invoiceNumber,
            order.invoiceNo,
            data.invoiceNo,
            order.invoice_id,
            data.invoice_id,
            order._id
        ) || "N/A";

    const invoiceDate =
        order.invoiceDate ||
        data.invoiceDate ||
        order.createdAt ||
        data.createdAt ||
        new Date();

    const dueDate =
        order.dueDate ||
        data.dueDate ||
        order.paymentDueDate ||
        data.paymentDueDate ||
        invoiceDate;

    const orderSource =
        order.orderSource ||
        data.orderSource ||
        order.source ||
        data.source ||
        "WALK_IN";

    const paymentMethod =
        order.paymentMethod ||
        data.paymentMethod ||
        order.payment_mode ||
        data.payment_mode ||
        "CASH";

    const paymentStatus =
        order.paymentStatus ||
        data.paymentStatus ||
        order.payment_status ||
        data.payment_status ||
        "PAID";

    // ========================================================
    // ITEMS SUBTOTAL
    // ========================================================

    const calculatedItemsSubtotal = useMemo(
        () => round2(items.reduce((sum, item) => sum + getItemTotal(item), 0)),
        [items]
    );

    // ========================================================
    // SAVED PRICING DETECTION
    // ========================================================

    const hasSavedPricing =
        data.gstAmount !== undefined ||
        data.finalAmount !== undefined ||
        data.taxableAmount !== undefined ||
        data.shippingCharge !== undefined ||
        data.couponDiscount !== undefined ||
        data.offerDiscount !== undefined;

    // ========================================================
    // SUBTOTAL
    // Priority: saved subtotal -> totalBeforeDiscount ->
    //           calculated item subtotal -> totalAmount
    // ========================================================

    const subtotal = round2(
        firstValue(
            data.subtotal,
            data.subTotal,
            data.totalBeforeDiscount,
            calculatedItemsSubtotal,
            data.totalAmount
        ) || 0
    );

    // ========================================================
    // DISCOUNTS
    // ========================================================

    const offerDiscount = round2(
        data.offerDiscount ??
            data.offerDiscountAmount ??
            data.discountFromOffer ??
            0
    );

    const discount = round2(data.discount ?? data.discountAmount ?? 0);

    const couponDiscount = round2(
        data.couponDiscount ?? data.couponDiscountAmount ?? 0
    );

    const couponCode =
        data.couponCode || data.appliedCoupon || data.coupon || "";

    const totalDiscount = round2(offerDiscount + couponDiscount + discount);

    // ========================================================
    // TAXABLE AMOUNT (saved value wins)
    // ========================================================

    const calculatedTaxableAmount = Math.max(
        round2(subtotal - offerDiscount - discount - couponDiscount),
        0
    );

    const taxableAmount = round2(
        data.taxableAmount !== undefined && data.taxableAmount !== null
            ? data.taxableAmount
            : data.taxableValue !== undefined && data.taxableValue !== null
            ? data.taxableValue
            : calculatedTaxableAmount
    );

    // ========================================================
    // GST
    // ========================================================

    const gstPercentage = safeNumber(data.gstPercentage ?? data.gstRate ?? 18, 18);

    const calculatedGstAmount = round2((taxableAmount * gstPercentage) / 100);

    const gstAmount = round2(
        data.gstAmount !== undefined && data.gstAmount !== null
            ? data.gstAmount
            : data.taxAmount !== undefined && data.taxAmount !== null
            ? data.taxAmount
            : data.tax !== undefined && data.tax !== null
            ? data.tax
            : calculatedGstAmount
    );

    // ========================================================
    // SHIPPING / OTHER CHARGES
    // ========================================================

    const shippingCharge = round2(
        data.shippingCharge ?? data.shipping ?? data.deliveryCharge ?? 0
    );

    const otherCharges = round2(
        data.otherCharges ?? data.additionalCharges ?? 0
    );

    // ========================================================
    // INTRA / INTER STATE
    // ========================================================

    const customerState = String(
        firstValue(shippingAddress.state, customer.state, data.customerState) ||
            ""
    )
        .trim()
        .toLowerCase();

    const isIntraState =
        !customerState || customerState.includes(COMPANY_STATE.toLowerCase());

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isIntraState) {
        cgst = round2(gstAmount / 2);
        sgst = round2(gstAmount - cgst);
    } else {
        igst = gstAmount;
    }

    // ========================================================
    // FINAL AMOUNT (saved value wins)
    // ========================================================

    const calculatedFinalAmount = round2(
        taxableAmount + gstAmount + shippingCharge + otherCharges
    );

    const totalAmount = round2(
        data.finalAmount !== undefined && data.finalAmount !== null
            ? data.finalAmount
            : data.grandTotal !== undefined && data.grandTotal !== null
            ? data.grandTotal
            : data.totalAmount !== undefined && data.totalAmount !== null
            ? data.totalAmount
            : calculatedFinalAmount
    );

    // ========================================================
    // PAID / BALANCE
    // ========================================================

    const normalizedPaymentStatus = String(paymentStatus || "").toUpperCase();

    const isPaid = ["PAID", "SUCCESS", "COMPLETED", "CAPTURED"].includes(
        normalizedPaymentStatus
    );

    const paidAmount = round2(
        data.paidAmount !== undefined && data.paidAmount !== null
            ? data.paidAmount
            : isPaid
            ? totalAmount
            : 0
    );

    const balanceAmount = round2(
        data.balanceAmount !== undefined && data.balanceAmount !== null
            ? data.balanceAmount
            : Math.max(totalAmount - paidAmount, 0)
    );

    const totalQuantity = items.reduce(
        (sum, item) => sum + getItemQuantity(item),
        0
    );

    // ========================================================
    // TAX ROWS
    // New pricing: coupon is distributed proportionally across items.
    // ========================================================

    const taxRows = useMemo(() => {
        if (!items.length) {
            return [];
        }

        // ---- OLD DATA WITH ITEM LEVEL TAX ----

        if (!hasSavedPricing) {
            return items.map((item) => {
                const itemTotal = getItemTotal(item);
                const itemCgst = safeNumber(item.cgst ?? item.cgstAmount ?? 0);
                const itemSgst = safeNumber(item.sgst ?? item.sgstAmount ?? 0);
                const itemIgst = safeNumber(item.igst ?? item.igstAmount ?? 0);
                const itemTax = safeNumber(
                    item.totalTax ??
                        item.taxAmount ??
                        itemCgst + itemSgst + itemIgst
                );

                return {
                    hsn: getItemHsn(item),
                    taxable: round2(
                        item.taxableValue ?? item.taxableAmount ?? itemTotal
                    ),
                    cgstRate:
                        item.cgstRate ?? item.taxDetails?.cgstRate ?? "",
                    cgst: round2(itemCgst),
                    sgstRate:
                        item.sgstRate ?? item.taxDetails?.sgstRate ?? "",
                    sgst: round2(itemSgst),
                    igstRate:
                        item.igstRate ?? item.taxDetails?.igstRate ?? "",
                    igst: round2(itemIgst),
                    totalTax: round2(itemTax),
                };
            });
        }

        // ---- NEW PRICING ----

        const lineAmounts = items.map((item) => getItemTotal(item));

        const lineTotal = lineAmounts.reduce((sum, value) => sum + value, 0);

        const rows = items.map((item, index) => {
            const line = lineAmounts[index];

            const couponShare =
                lineTotal > 0 ? round2((couponDiscount * line) / lineTotal) : 0;

            const taxable = Math.max(round2(line - couponShare), 0);

            const gst = round2((taxable * gstPercentage) / 100);

            return { hsn: getItemHsn(item), taxable, gst };
        });

        // Adjust last row so rounding never causes a 1-2 paisa mismatch.
        if (rows.length > 0) {
            const rowTaxable = rows.reduce((sum, row) => sum + row.taxable, 0);
            const rowGst = rows.reduce((sum, row) => sum + row.gst, 0);
            const lastIndex = rows.length - 1;

            rows[lastIndex] = {
                ...rows[lastIndex],
                taxable: Math.max(
                    round2(rows[lastIndex].taxable + (taxableAmount - rowTaxable)),
                    0
                ),
                gst: Math.max(
                    round2(rows[lastIndex].gst + (gstAmount - rowGst)),
                    0
                ),
            };
        }

        return rows.map((row) => {
            if (isIntraState) {
                const rowCgst = round2(row.gst / 2);
                const rowSgst = round2(row.gst - rowCgst);

                return {
                    hsn: row.hsn,
                    taxable: row.taxable,
                    cgstRate: gstPercentage / 2,
                    cgst: rowCgst,
                    sgstRate: gstPercentage / 2,
                    sgst: rowSgst,
                    igstRate: "",
                    igst: 0,
                    totalTax: row.gst,
                };
            }

            return {
                hsn: row.hsn,
                taxable: row.taxable,
                cgstRate: "",
                cgst: 0,
                sgstRate: "",
                sgst: 0,
                igstRate: gstPercentage,
                igst: row.gst,
                totalTax: row.gst,
            };
        });
    }, [
        items,
        hasSavedPricing,
        couponDiscount,
        gstPercentage,
        taxableAmount,
        gstAmount,
        isIntraState,
    ]);

    const showIgstColumns = !isIntraState;

    // ========================================================
    // NO ORDER -> render nothing (after all hooks have run)
    // ========================================================

    if (!orderProp) {
        return null;
    }

    // ========================================================
    // PRINT INVOICE
    // ========================================================

    const printInvoice = () => {
        try {
            const invoiceElement = document.querySelector(".wkinv-container");

            if (!invoiceElement) {
                alert("Invoice not found. Please try again.");
                return;
            }

            const printFrame = document.createElement("iframe");

            printFrame.setAttribute("title", "Walk-In Invoice Print");
            printFrame.style.position = "fixed";
            printFrame.style.right = "0";
            printFrame.style.bottom = "0";
            printFrame.style.width = "0";
            printFrame.style.height = "0";
            printFrame.style.border = "0";
            printFrame.style.opacity = "0";
            printFrame.style.pointerEvents = "none";

            document.body.appendChild(printFrame);

            const printDocument =
                printFrame.contentDocument || printFrame.contentWindow.document;

            printDocument.open();

            printDocument.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>Walk-In Invoice - ${invoiceNumber}</title>
                    <style>
                        html, body {
                            margin: 0 !important;
                            padding: 0 !important;
                            width: 100% !important;
                            min-height: 100% !important;
                            background: #ffffff !important;
                            color: #111111 !important;
                            font-family: Arial, Helvetica, sans-serif !important;
                        }

                        body, body * {
                            visibility: visible !important;
                            opacity: 1 !important;
                        }

                        #print-root {
                            width: 100% !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            background: #ffffff !important;
                        }

                        .wkinv-container {
                            display: block !important;
                            width: 100% !important;
                            max-width: 190mm !important;
                            min-width: 0 !important;
                            margin: 0 auto !important;
                            padding: 5mm !important;
                            box-sizing: border-box !important;
                            background: #ffffff !important;
                            color: #111111 !important;
                            border: 0 !important;
                            border-radius: 0 !important;
                            box-shadow: none !important;
                            overflow: visible !important;
                        }

                        .wkinv-container h1,
                        .wkinv-container h2,
                        .wkinv-container h3,
                        .wkinv-container h4,
                        .wkinv-container h5,
                        .wkinv-container h6,
                        .wkinv-container p,
                        .wkinv-container span,
                        .wkinv-container strong,
                        .wkinv-container div,
                        .wkinv-container td,
                        .wkinv-container th {
                            color: #111111 !important;
                        }

                        /* Logo: keep the 1.93:1 box from WalkInInvoice.css.
                           Do NOT set max-width / height here - it would
                           fight the aspect-ratio box. */
                        .wkinv-company-logo,
                        .wkinv-sign-logo {
                            display: block !important;
                            object-fit: contain !important;
                        }

                        .wkinv-buttons {
                            display: none !important;
                            visibility: hidden !important;
                        }

                        .wkinv-table-wrap,
                        .wkinv-tax-summary {
                            width: 100% !important;
                            overflow: visible !important;
                        }

                        .wkinv-items-table,
                        .wkinv-tax-table {
                            width: 100% !important;
                            border-collapse: collapse !important;
                            border-spacing: 0 !important;
                        }

                        .wkinv-document-top,
                        .wkinv-company-header,
                        .wkinv-address-grid,
                        .wkinv-table-wrap,
                        .wkinv-tax-summary,
                        .wkinv-summary-grid,
                        .wkinv-bottom-grid,
                        .wkinv-footer,
                        tr {
                            break-inside: avoid !important;
                            page-break-inside: avoid !important;
                        }

                        .wkinv-items-table thead,
                        .wkinv-tax-table thead {
                            display: table-header-group !important;
                        }

                        @page {
                            size: A4 portrait;
                            margin: 7mm;
                        }
                    </style>
                </head>
                <body>
                    <div id="print-root"></div>
                </body>
                </html>
            `);

            printDocument.close();

            // ---- copy the app's styles into the print document ----

            Array.from(
                document.querySelectorAll('style, link[rel="stylesheet"]')
            ).forEach((styleNode) => {
                try {
                    printDocument.head.appendChild(styleNode.cloneNode(true));
                } catch (error) {
                    console.warn("Unable to copy stylesheet:", error);
                }
            });

            // ---- clone only the invoice ----

            const invoiceClone = invoiceElement.cloneNode(true);

            invoiceClone
                .querySelectorAll(".wkinv-buttons")
                .forEach((element) => element.remove());

            printDocument
                .getElementById("print-root")
                .appendChild(invoiceClone);

            // ---- wait for images + fonts ----

            const waitForImages = Array.from(printDocument.images).map(
                (image) =>
                    new Promise((resolve) => {
                        if (image.complete) {
                            resolve();
                            return;
                        }

                        image.onload = resolve;
                        image.onerror = resolve;
                    })
            );

            const waitForFonts =
                printDocument.fonts && printDocument.fonts.ready
                    ? printDocument.fonts.ready
                    : Promise.resolve();

            Promise.all([...waitForImages, waitForFonts]).then(() => {
                setTimeout(() => {
                    try {
                        printFrame.contentWindow.focus();
                        printFrame.contentWindow.print();
                    } finally {
                        setTimeout(() => {
                            if (printFrame && printFrame.parentNode) {
                                printFrame.parentNode.removeChild(printFrame);
                            }
                        }, 1500);
                    }
                }, 500);
            });
        } catch (error) {
            console.error("WALK-IN INVOICE PRINT ERROR:", error);
            alert("Unable to print invoice. Please try again.");
        }
    };

    // ========================================================
    // RETURN
    // ========================================================

    const sourceLabel = String(orderSource).replaceAll("_", " ");

    return (
        <div
            className="wkinv-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Walk-in invoice"
        >
            <div className="wkinv-container">
                {/* ================= TOP ================= */}

                <div className="wkinv-document-top">
                    <span className="wkinv-document-title">TAX INVOICE</span>

                    <span className="wkinv-recipient-label">
                        ORIGINAL FOR RECIPIENT
                    </span>

                    <span className="wkinv-tagline">“{company.tagline}”</span>
                </div>

                {/* ============== COMPANY HEADER ============== */}

                <div className="wkinv-company-header">
                    <div className="wkinv-company-left">
                        <div className="wkinv-logo-wrap">
                            <img
                                src={zaidInfotechLogo}
                                alt="Zaid Infotech Logo"
                                className="wkinv-company-logo"
                                width={LOGO_WIDTH}
                                height={LOGO_HEIGHT}
                            />
                        </div>

                        <div className="wkinv-company-details">
                            <h1 className="wkinv-company-name">
                                {company.name}
                            </h1>

                            <p className="wkinv-company-address">
                                {company.address}
                            </p>

                            <div className="wkinv-company-meta-grid">
                                <p>
                                    <strong>GSTIN:</strong> {company.gstin}
                                </p>

                                <p>
                                    <strong>Mobile:</strong> {company.mobile}
                                </p>

                                <p>
                                    <strong>PAN:</strong> {company.pan}
                                </p>

                                <p>
                                    <strong>Email:</strong> {company.email}
                                </p>

                                <p className="wkinv-company-website">
                                    <strong>Website:</strong> {company.website}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="wkinv-invoice-meta">
                        <div className="wkinv-meta-row">
                            <span>Invoice No.</span>
                            <strong>{invoiceNumber}</strong>
                        </div>

                        <div className="wkinv-meta-row">
                            <span>Invoice Date</span>
                            <strong>{formatDate(invoiceDate)}</strong>
                        </div>

                        <div className="wkinv-meta-row">
                            <span>Due Date</span>
                            <strong>{formatDate(dueDate)}</strong>
                        </div>

                        <div className="wkinv-meta-row">
                            <span>Invoice Type</span>
                            <strong>{sourceLabel}</strong>
                        </div>
                    </div>
                </div>

                {/* ============== BILL / SHIP ============== */}

                <div className="wkinv-address-grid">
                    <div className="wkinv-address-box">
                        <div className="wkinv-box-title">BILL TO</div>

                        <h3 className="wkinv-customer-name">{customerName}</h3>

                        <p>
                            <strong>Address:</strong> {getAddressText(customer)}
                        </p>

                        <p>
                            <strong>Mobile:</strong> {customerPhone}
                        </p>

                        {customerEmail && (
                            <p>
                                <strong>Email:</strong> {customerEmail}
                            </p>
                        )}

                        {customer.gstin && (
                            <p>
                                <strong>GSTIN:</strong> {customer.gstin}
                            </p>
                        )}
                    </div>

                    <div className="wkinv-address-box">
                        <div className="wkinv-box-title">SHIP TO</div>

                        <h3 className="wkinv-customer-name">
                            {firstValue(
                                shippingAddress.fullName,
                                shippingAddress.name,
                                customerName
                            )}
                        </h3>

                        <p>
                            <strong>Address:</strong>{" "}
                            {getAddressText(shippingAddress)}
                        </p>

                        <p>
                            <strong>Mobile:</strong>{" "}
                            {firstValue(
                                shippingAddress.phone,
                                shippingAddress.mobile,
                                customerPhone
                            )}
                        </p>

                        {shippingAddress.gstin && (
                            <p>
                                <strong>GSTIN:</strong> {shippingAddress.gstin}
                            </p>
                        )}
                    </div>
                </div>

                {/* ============== ITEMS ============== */}

                <div className="wkinv-table-wrap">
                    <table className="wkinv-items-table">
                        <thead>
                            <tr>
                                <th className="wkinv-col-sno">S.NO.</th>
                                <th className="wkinv-col-product">
                                    PRODUCT / DESCRIPTION
                                </th>
                                <th className="wkinv-col-hsn">HSN/SAC</th>
                                <th className="wkinv-col-qty">QTY.</th>
                                <th className="wkinv-col-rate">RATE</th>
                                <th className="wkinv-col-amount">AMOUNT</th>
                            </tr>
                        </thead>

                        <tbody>
                            {items.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="wkinv-empty-cell"
                                    >
                                        No items found
                                    </td>
                                </tr>
                            ) : (
                                items.map((item, index) => {
                                    const description =
                                        getItemDescription(item);

                                    return (
                                        <tr
                                            key={
                                                item._id ||
                                                item.product ||
                                                item.productId ||
                                                index
                                            }
                                        >
                                            <td className="wkinv-center">
                                                {index + 1}
                                            </td>

                                            <td className="wkinv-product-cell">
                                                <strong>
                                                    {getItemName(item)}
                                                </strong>

                                                {description && (
                                                    <span className="wkinv-item-description">
                                                        {description}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="wkinv-center">
                                                {getItemHsn(item)}
                                            </td>

                                            <td className="wkinv-center">
                                                {getItemQuantity(item)}
                                            </td>

                                            <td className="wkinv-right">
                                                {formatCurrency(
                                                    getItemPrice(item)
                                                )}
                                            </td>

                                            <td className="wkinv-right">
                                                {formatCurrency(
                                                    getItemTotal(item)
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}

                            {items.length > 0 && items.length < 5 && (
                                <tr className="wkinv-space-row">
                                    <td colSpan="6">&nbsp;</td>
                                </tr>
                            )}
                        </tbody>

                        <tfoot>
                            <tr>
                                <td colSpan="4" className="wkinv-total-label">
                                    TOTAL
                                </td>

                                <td className="wkinv-center">
                                    {totalQuantity}
                                </td>

                                <td className="wkinv-right wkinv-total-value">
                                    {formatCurrency(calculatedItemsSubtotal)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* ============== TAX SUMMARY ============== */}

                <div className="wkinv-tax-summary">
                    <table className="wkinv-tax-table">
                        <thead>
                            <tr>
                                <th rowSpan="2">HSN/SAC</th>
                                <th rowSpan="2">Taxable Value</th>

                                {showIgstColumns ? (
                                    <th colSpan="2">IGST</th>
                                ) : (
                                    <>
                                        <th colSpan="2">CGST</th>
                                        <th colSpan="2">SGST</th>
                                    </>
                                )}

                                <th rowSpan="2">Total Tax</th>
                            </tr>

                            <tr>
                                {showIgstColumns ? (
                                    <>
                                        <th>Rate</th>
                                        <th>Amount</th>
                                    </>
                                ) : (
                                    <>
                                        <th>Rate</th>
                                        <th>Amount</th>
                                        <th>Rate</th>
                                        <th>Amount</th>
                                    </>
                                )}
                            </tr>
                        </thead>

                        <tbody>
                            {taxRows.length === 0 ? (
                                <tr>
                                    <td colSpan={showIgstColumns ? 5 : 7}>-</td>
                                </tr>
                            ) : (
                                taxRows.map((row, index) => (
                                    <tr
                                        key={`tax-${
                                            items[index]?._id || index
                                        }`}
                                    >
                                        <td>{row.hsn}</td>

                                        <td>{formatCurrency(row.taxable)}</td>

                                        {showIgstColumns ? (
                                            <>
                                                <td>
                                                    {row.igstRate !== ""
                                                        ? `${row.igstRate}%`
                                                        : "-"}
                                                </td>

                                                <td>
                                                    {formatCurrency(row.igst)}
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td>
                                                    {row.cgstRate !== ""
                                                        ? `${row.cgstRate}%`
                                                        : "-"}
                                                </td>

                                                <td>
                                                    {formatCurrency(row.cgst)}
                                                </td>

                                                <td>
                                                    {row.sgstRate !== ""
                                                        ? `${row.sgstRate}%`
                                                        : "-"}
                                                </td>

                                                <td>
                                                    {formatCurrency(row.sgst)}
                                                </td>
                                            </>
                                        )}

                                        <td>{formatCurrency(row.totalTax)}</td>
                                    </tr>
                                ))
                            )}

                            <tr className="wkinv-tax-total-row">
                                <td>
                                    <strong>Total</strong>
                                </td>

                                <td>
                                    <strong>
                                        {formatCurrency(taxableAmount)}
                                    </strong>
                                </td>

                                {showIgstColumns ? (
                                    <>
                                        <td>-</td>

                                        <td>
                                            <strong>
                                                {formatCurrency(igst)}
                                            </strong>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td>-</td>

                                        <td>
                                            <strong>
                                                {formatCurrency(cgst)}
                                            </strong>
                                        </td>

                                        <td>-</td>

                                        <td>
                                            <strong>
                                                {formatCurrency(sgst)}
                                            </strong>
                                        </td>
                                    </>
                                )}

                                <td>
                                    <strong>{formatCurrency(gstAmount)}</strong>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* ============== TOTAL SUMMARY ============== */}

                <div className="wkinv-summary-grid">
                    <div className="wkinv-summary-left">
                        <div className="wkinv-payment-card">
                            <div className="wkinv-box-title">
                                PAYMENT DETAILS
                            </div>

                            <div className="wkinv-payment-row">
                                <span>Payment Method</span>
                                <strong>
                                    {String(paymentMethod).replaceAll("_", " ")}
                                </strong>
                            </div>

                            <div className="wkinv-payment-row">
                                <span>Payment Status</span>
                                <strong>
                                    {String(paymentStatus).replaceAll("_", " ")}
                                </strong>
                            </div>

                            <div className="wkinv-payment-row">
                                <span>Order Source</span>
                                <strong>{sourceLabel}</strong>
                            </div>

                            {couponCode && (
                                <div className="wkinv-payment-row">
                                    <span>Coupon</span>
                                    <strong>{couponCode}</strong>
                                </div>
                            )}
                        </div>

                        <div className="wkinv-amount-words">
                            <strong>Total Amount (in words)</strong>

                            <span>{amountInWords(totalAmount)}</span>
                        </div>
                    </div>

                    <div className="wkinv-grand-total-card">
                        <div className="wkinv-grand-row">
                            <span>Subtotal</span>
                            <strong>{formatCurrency(subtotal)}</strong>
                        </div>

                        {offerDiscount > 0 && (
                            <div className="wkinv-grand-row">
                                <span>Offer Discount</span>
                                <strong>
                                    - {formatCurrency(offerDiscount)}
                                </strong>
                            </div>
                        )}

                        {discount > 0 && (
                            <div className="wkinv-grand-row">
                                <span>Discount</span>
                                <strong>- {formatCurrency(discount)}</strong>
                            </div>
                        )}

                        {couponDiscount > 0 && (
                            <div className="wkinv-grand-row">
                                <span>
                                    Coupon Discount
                                    {couponCode ? ` (${couponCode})` : ""}
                                </span>
                                <strong>
                                    - {formatCurrency(couponDiscount)}
                                </strong>
                            </div>
                        )}

                        {totalDiscount > 0 && (
                            <div className="wkinv-grand-row">
                                <span>Total Discount</span>
                                <strong>
                                    - {formatCurrency(totalDiscount)}
                                </strong>
                            </div>
                        )}

                        <div className="wkinv-grand-row">
                            <span>Taxable Value</span>
                            <strong>{formatCurrency(taxableAmount)}</strong>
                        </div>

                        {showIgstColumns ? (
                            <div className="wkinv-grand-row">
                                <span>IGST ({gstPercentage}%)</span>
                                <strong>{formatCurrency(igst)}</strong>
                            </div>
                        ) : (
                            <>
                                <div className="wkinv-grand-row">
                                    <span>CGST ({gstPercentage / 2}%)</span>
                                    <strong>{formatCurrency(cgst)}</strong>
                                </div>

                                <div className="wkinv-grand-row">
                                    <span>SGST ({gstPercentage / 2}%)</span>
                                    <strong>{formatCurrency(sgst)}</strong>
                                </div>
                            </>
                        )}

                        <div className="wkinv-grand-row">
                            <span>Shipping</span>
                            <strong>
                                {shippingCharge > 0
                                    ? formatCurrency(shippingCharge)
                                    : "Free"}
                            </strong>
                        </div>

                        {otherCharges > 0 && (
                            <div className="wkinv-grand-row">
                                <span>Other Charges</span>
                                <strong>{formatCurrency(otherCharges)}</strong>
                            </div>
                        )}

                        <div className="wkinv-grand-divider" />

                        <div className="wkinv-grand-row wkinv-final-row">
                            <span>Grand Total</span>
                            <strong>{formatCurrency(totalAmount)}</strong>
                        </div>

                        <div className="wkinv-grand-row">
                            <span>Paid</span>
                            <strong>{formatCurrency(paidAmount)}</strong>
                        </div>

                        <div className="wkinv-grand-row">
                            <span>Balance</span>
                            <strong>{formatCurrency(balanceAmount)}</strong>
                        </div>
                    </div>
                </div>

                {/* ============== BANK + SIGNATURE ============== */}

                <div className="wkinv-bottom-grid">
                    <div className="wkinv-bank-details">
                        <div className="wkinv-bottom-title">Bank Details</div>

                        <div className="wkinv-bank-row">
                            <span>Name:</span>
                            <strong>{bankDetails.name}</strong>
                        </div>

                        <div className="wkinv-bank-row">
                            <span>IFSC Code:</span>
                            <strong>{bankDetails.ifsc}</strong>
                        </div>

                        <div className="wkinv-bank-row">
                            <span>Account No:</span>
                            <strong>{bankDetails.account}</strong>
                        </div>

                        <div className="wkinv-bank-row">
                            <span>Bank:</span>
                            <strong>{bankDetails.bank}</strong>
                        </div>
                    </div>

                    <div className="wkinv-authorized-sign">
                        <div className="wkinv-sign-logo-box">
                            {/* Optional signature logo */}
                        </div>

                        <div className="wkinv-sign-line">
                            ______________________________
                        </div>

                        <strong>Authorised Signatory For</strong>

                        <span>{company.name}</span>
                    </div>

                    <div className="wkinv-receiver-sign">
                        <div className="wkinv-sign-line">
                            ______________________________
                        </div>

                        <strong>Receiver's Signature</strong>
                    </div>
                </div>

                {/* ============== FOOTER ============== */}

                <div className="wkinv-footer">
                    <div>
                        <strong>Thank You For Shopping With Us</strong>

                        <span>{company.name}</span>
                    </div>

                    <div className="wkinv-footer-right">
                        <span>This is a computer-generated invoice.</span>

                        <span>{company.website}</span>
                    </div>
                </div>

                {/* ============== BUTTONS ============== */}

                <div className="wkinv-buttons">
                    <button
                        type="button"
                        className="wkinv-print-btn"
                        onClick={printInvoice}
                    >
                        PRINT INVOICE
                    </button>

                    <button
                        type="button"
                        className="wkinv-close-btn"
                        onClick={onClose}
                    >
                        CLOSE
                    </button>
                </div>
            </div>
        </div>
    );
}

export default WalkInInvoice;
