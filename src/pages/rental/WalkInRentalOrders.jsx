import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./WalkInRentalOrders.css";

import { getAllRentals } from "../../services/rentalApi";


// =====================================================
// CUSTOMER SOURCE LABELS
// "How did you come to know about ZAID Infotech?"
// key = value saved in database, label = shown in table
// =====================================================

const CUSTOMER_SOURCE_LABELS = {
    GOOGLE: "Google Search / Google Maps",
    INSTAGRAM_FACEBOOK: "Instagram / Facebook",
    YOUTUBE: "YouTube",
    REFERRAL: "Friends or Family Referral",
    EXISTING_CUSTOMER: "Existing Customer",
    SHOP_BOARD: "Walk-in / Shop Board",
    ONLINE_AD: "Online Advertisement",
    INFLUENCER: "Influencer / Blogger Recommendation",
    WHATSAPP: "WhatsApp",
    OTHER: "Other",
};


function WalkInRentalOrders() {
    const navigate = useNavigate();

    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    // =====================================================
    // LOAD RENTALS
    // =====================================================

    useEffect(() => {
        loadWalkInRentals();
    }, []);

    const loadWalkInRentals = async () => {
        try {
            setLoading(true);
            setError("");

            console.log("================================");
            console.log("LOADING WALK-IN RENTALS");
            console.log("================================");

            const response = await getAllRentals();

            console.log("ALL RENTALS RESPONSE:", response);

            let list = [];

            // ---------------------------------------------
            // SUPPORT MULTIPLE RESPONSE STRUCTURES
            // ---------------------------------------------

            if (Array.isArray(response)) {
                list = response;
            } else if (Array.isArray(response?.rentals)) {
                list = response.rentals;
            } else if (Array.isArray(response?.data)) {
                list = response.data;
            } else if (Array.isArray(response?.data?.rentals)) {
                list = response.data.rentals;
            } else if (Array.isArray(response?.data?.data)) {
                list = response.data.data;
            } else if (Array.isArray(response?.result)) {
                list = response.result;
            } else if (Array.isArray(response?.data?.result)) {
                list = response.data.result;
            }

            console.log("ALL RENTALS:", list);

            // ---------------------------------------------
            // ONLY WALK-IN RENTALS
            // ---------------------------------------------

            const walkInRentals = list.filter((rental) => {
                return (
                    String(rental?.rentalSource || "")
                        .trim()
                        .toUpperCase() === "WALK_IN"
                );
            });

            console.log(
                "ONLY WALK-IN RENTALS:",
                walkInRentals
            );

            setRentals(walkInRentals);
        } catch (err) {
            console.error(
                "WALK-IN RENTALS ERROR:",
                err
            );

            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Failed to load walk-in rental orders"
            );

            setRentals([]);
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // CUSTOMER NAME
    // =====================================================

    const getCustomerName = (rental) => {
        if (
            String(rental?.customerType || "")
                .toUpperCase() === "COMPANY"
        ) {
            return (
                rental?.companyDetails?.contactPerson ||
                rental?.companyDetails?.companyName ||
                "Company Customer"
            );
        }

        return (
            rental?.individualDetails?.fullName ||
            rental?.customer?.name ||
            rental?.customer?.fullName ||
            "Walk-In Customer"
        );
    };

    // =====================================================
    // PHONE
    // =====================================================

    const getCustomerPhone = (rental) => {
        if (
            String(rental?.customerType || "")
                .toUpperCase() === "COMPANY"
        ) {
            return (
                rental?.companyDetails?.phone ||
                "-"
            );
        }

        return (
            rental?.individualDetails?.phone ||
            rental?.customer?.phone ||
            "-"
        );
    };

    // =====================================================
    // EMAIL
    // =====================================================

    const getCustomerEmail = (rental) => {
        if (
            String(rental?.customerType || "")
                .toUpperCase() === "COMPANY"
        ) {
            return (
                rental?.companyDetails?.email ||
                "-"
            );
        }

        return (
            rental?.individualDetails?.email ||
            rental?.customer?.email ||
            "-"
        );
    };

    // =====================================================
    // CUSTOMER SOURCE
    // "How did the customer come to know about us?"
    //
    // Returns { label, detail }
    // - label  = readable source name
    // - detail = free text, only when source is OTHER
    // =====================================================

    const getCustomerSource = (rental) => {
        const key = String(
            rental?.customerSource || ""
        )
            .trim()
            .toUpperCase();

        if (!key) {
            return {
                label: "",
                detail: "",
            };
        }

        const label =
            CUSTOMER_SOURCE_LABELS[key] ||
            key;

        const detail =
            key === "OTHER"
                ? String(
                    rental?.customerSourceOther || ""
                ).trim()
                : "";

        return {
            label,
            detail,
        };
    };

    // =====================================================
    // PRODUCT NAME
    // =====================================================

    const getProductName = (rental) => {
        return (
            rental?.product?.name ||
            rental?.product?.title ||
            rental?.rentalProduct?.product?.name ||
            rental?.rentalProduct?.product?.title ||
            rental?.rentalProduct?.name ||
            "Rental Product"
        );
    };

    // =====================================================
    // BRAND
    // =====================================================

    const getBrandName = (rental) => {
        const brand =
            rental?.product?.brand ||
            rental?.rentalProduct?.product?.brand;

        if (typeof brand === "object" && brand !== null) {
            return (
                brand?.name ||
                brand?.title ||
                ""
            );
        }

        return brand || "";
    };

    // =====================================================
    // MONGODB RENTAL ID
    // =====================================================

    const getRentalId = (rental) => {
        return (
            rental?._id ||
            rental?.id ||
            rental?.rentalId ||
            ""
        );
    };

    // =====================================================
    // RENTAL NUMBER
    // =====================================================

    const getRentalNumber = (rental) => {
        return (
            rental?.rentalNumber ||
            rental?.rentalNo ||
            rental?.rental_number ||
            getRentalId(rental)
        );
    };

    // =====================================================
    // MONTHLY RENT
    // =====================================================

    const getMonthlyRent = (rental) => {
        return Number(
            rental?.monthlyRent ??
            rental?.rentalProduct?.monthlyRent ??
            0
        );
    };

    // =====================================================
    // RENTAL DURATION TYPE
    // =====================================================

    const getRentalDurationType = (rental) => {
        return String(
            rental?.rentalDurationType ||
            "MONTHS"
        ).toUpperCase();
    };

    // =====================================================
    // RENTAL DURATION
    // =====================================================

    const getRentalDuration = (rental) => {
        const type =
            getRentalDurationType(rental);

        const duration = Number(
            rental?.rentalDuration ??
            rental?.rentalMonths ??
            1
        );

        return {
            value: duration,
            type:
                type === "DAYS"
                    ? "days"
                    : "months",
        };
    };

    // =====================================================
    // SECURITY DEPOSIT
    // =====================================================

    const getSecurityDeposit = (rental) => {
        return Number(
            rental?.securityDeposit ?? 0
        );
    };

    // =====================================================
    // ACTUAL DEPOSIT PAID
    // =====================================================

    const getDepositAmountPaid = (rental) => {
        const possiblePaidAmounts = [
            rental?.depositAmountPaid,
            rental?.depositPaid,
            rental?.securityDepositPaid,
            rental?.paidDeposit,
            rental?.deposit?.paidAmount,
            rental?.deposit?.amountPaid,
            rental?.payment?.depositAmount,
            rental?.payment?.amount,
        ];

        for (const amount of possiblePaidAmounts) {
            if (
                amount !== undefined &&
                amount !== null &&
                amount !== "" &&
                typeof amount !== "boolean" &&
                !Number.isNaN(Number(amount))
            ) {
                return Number(amount);
            }
        }

        return 0;
    };

    // =====================================================
    // DEPOSIT STATUS
    // =====================================================

    const getDepositPaymentStatus = (rental) => {
        const expected = getSecurityDeposit(rental);
        const paid = getDepositAmountPaid(rental);

        // Backend direct status, if available
        const backendStatus = String(
            rental?.depositPaymentStatus ||
            rental?.depositStatus ||
            rental?.securityDepositStatus ||
            ""
        )
            .trim()
            .toUpperCase();

        if (backendStatus === "PAID") {
            return "PAID";
        }

        if (backendStatus === "PARTIAL") {
            return "PARTIAL";
        }

        // No expected deposit
        if (expected <= 0) {
            return paid > 0 ? "PAID" : "UNPAID";
        }

        // Actual status from amounts
        if (paid >= expected) {
            return "PAID";
        }

        if (paid > 0) {
            return "PARTIAL";
        }

        return "UNPAID";
    };

    // =====================================================
    // GST
    // =====================================================

    const getGSTPercentage = (rental) => {
        return Number(
            rental?.gstPercentage ??
            rental?.gst ??
            0
        );
    };

    // =====================================================
    // TOTAL RENT
    // =====================================================

    const getTotalRent = (rental) => {
        const monthlyRent =
            getMonthlyRent(rental);

        const type =
            getRentalDurationType(rental);

        const duration = Number(
            rental?.rentalDuration ??
            rental?.rentalMonths ??
            1
        );

        // ---------------------------------------------
        // DAILY RENT
        // ---------------------------------------------

        if (type === "DAYS") {
            return (
                (monthlyRent / 30) *
                duration
            );
        }

        // ---------------------------------------------
        // MONTHLY RENT
        // ---------------------------------------------

        return (
            monthlyRent *
            duration
        );
    };

    // =====================================================
    // GST AMOUNT
    // =====================================================

    const getGSTAmount = (rental) => {
        const totalRent =
            getTotalRent(rental);

        const gstPercentage =
            getGSTPercentage(rental);

        return (
            totalRent *
            gstPercentage /
            100
        );
    };

    // =====================================================
    // TOTAL WITH GST
    // =====================================================

    const getTotalWithGST = (rental) => {
        return (
            getTotalRent(rental) +
            getGSTAmount(rental)
        );
    };

    // =====================================================
    // STATUS
    // =====================================================

    const getStatus = (rental) => {
        return String(
            rental?.status || "PENDING"
        ).toUpperCase();
    };

    // =====================================================
    // STATUS CLASS
    // =====================================================

    const getStatusClass = (status) => {
        switch (
            String(status || "")
                .toUpperCase()
        ) {
            case "ACTIVE":
                return "active";

            case "RETURNED":
                return "returned";

            case "COMPLETED":
                return "completed";

            case "PENDING":
                return "pending";

            case "DOCUMENT_VERIFICATION":
                return "pending";

            case "APPROVED":
                return "pending";

            case "DEPOSIT_PENDING":
                return "pending";

            case "READY_FOR_ALLOCATION":
                return "pending";

            case "RETURN_REQUESTED":
                return "pending";

            case "SETTLEMENT_PENDING":
                return "pending";

            case "REJECTED":
            case "CANCELLED":
                return "cancelled";

            default:
                return "default";
        }
    };

    // =====================================================
    // DEPOSIT STATUS CLASS
    // =====================================================

    const getDepositStatusClass = (status) => {
        switch (
            String(status || "")
                .toUpperCase()
        ) {
            case "PAID":
                return "deposit-paid";

            case "PARTIAL":
                return "deposit-partial";

            case "UNPAID":
            default:
                return "deposit-unpaid";
        }
    };

    // =====================================================
    // FORMAT MONEY
    // =====================================================

    const formatMoney = (value) => {
        return Number(
            value || 0
        ).toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 2,
            }
        );
    };

    // =====================================================
    // FILTER RENTALS
    // =====================================================

    const filteredRentals = useMemo(() => {
        let result = [...rentals];

        // ---------------------------------------------
        // SEARCH
        // ---------------------------------------------

        if (search.trim()) {
            const keyword =
                search.trim().toLowerCase();

            result = result.filter((rental) => {
                const rentalId =
                    String(
                        getRentalId(rental)
                    ).toLowerCase();

                const rentalNumber =
                    String(
                        getRentalNumber(rental)
                    ).toLowerCase();

                const customer =
                    getCustomerName(
                        rental
                    ).toLowerCase();

                const phone =
                    getCustomerPhone(
                        rental
                    ).toLowerCase();

                const email =
                    getCustomerEmail(
                        rental
                    ).toLowerCase();

                const product =
                    getProductName(
                        rental
                    ).toLowerCase();

                const source =
                    getCustomerSource(rental);

                const sourceText =
                    `${source.label} ${source.detail}`
                        .toLowerCase();

                return (
                    rentalId.includes(keyword) ||
                    rentalNumber.includes(keyword) ||
                    customer.includes(keyword) ||
                    phone.includes(keyword) ||
                    email.includes(keyword) ||
                    product.includes(keyword) ||
                    sourceText.includes(keyword)
                );
            });
        }

        // ---------------------------------------------
        // DATE
        // ---------------------------------------------

        if (selectedDate) {
            result = result.filter((rental) => {
                if (!rental?.createdAt) {
                    return false;
                }

                const rentalDate =
                    new Date(
                        rental.createdAt
                    )
                        .toISOString()
                        .split("T")[0];

                return (
                    rentalDate ===
                    selectedDate
                );
            });
        }

        // ---------------------------------------------
        // STATUS
        // ---------------------------------------------

        if (statusFilter !== "ALL") {
            result = result.filter((rental) => {
                return (
                    getStatus(rental) ===
                    statusFilter
                );
            });
        }

        return result;
    }, [
        rentals,
        search,
        selectedDate,
        statusFilter,
    ]);

    // =====================================================
    // SUMMARY
    // =====================================================

    const totalRent =
        filteredRentals.reduce(
            (sum, rental) =>
                sum +
                getTotalWithGST(rental),
            0
        );

    const totalDeposit =
        filteredRentals.reduce(
            (sum, rental) =>
                sum +
                getSecurityDeposit(rental),
            0
        );

    const totalDepositPaid =
        filteredRentals.reduce(
            (sum, rental) =>
                sum +
                getDepositAmountPaid(rental),
            0
        );

    const activeRentals =
        filteredRentals.filter(
            (rental) =>
                getStatus(rental) ===
                "ACTIVE"
        ).length;

    // =====================================================
    // VIEW
    // =====================================================

    const viewRental = (rental) => {
        const rentalId =
            getRentalId(rental);

        if (!rentalId) {
            console.error(
                "Rental ID missing:",
                rental
            );

            return;
        }

        navigate(
            `/receptionist-dashboard/rental/orders/${rentalId}`,
            {
                state: {
                    rental,
                },
            }
        );
    };

    // =====================================================
    // NEW RENTAL
    // =====================================================

    const createNewRental = () => {
        navigate(
            "/receptionist-dashboard/rental/new"
        );
    };

    // =====================================================
    // INVOICE
    // =====================================================

    const printInvoice = (rental) => {
        const rentalId =
            getRentalId(rental);

        if (!rentalId) {
            alert(
                "Rental ID not found"
            );

            return;
        }

        navigate(
            `/receptionist-dashboard/walk-in-invoice/${rentalId}`,
            {
                state: {
                    rental,
                },
            }
        );
    };

    // =====================================================
    // RETURN
    // =====================================================

    const returnRental = (rental) => {
        const rentalId =
            getRentalId(rental);

        if (!rentalId) {
            console.error(
                "Rental ID missing:",
                rental
            );

            return;
        }

        console.log(
            "Opening rental return page:",
            rentalId
        );

        navigate(
            `/receptionist-dashboard/rental/orders/${rentalId}/return`,
            {
                state: {
                    rental,
                },
            }
        );
    };

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="walkin-rental-orders-page">

            {/* =========================================
                HEADER
            ========================================== */}

            <div className="rental-orders-header">

                <div>
                    <h2>
                        Walk-In Rental Orders
                    </h2>

                    <p>
                        Manage all walk-in laptop
                        rental customers
                    </p>
                </div>

                <button
                    className="new-rental-btn"
                    onClick={
                        createNewRental
                    }
                >
                    + New Walk-In Rental
                </button>

            </div>

            {/* =========================================
                ERROR
            ========================================== */}

            {error && (
                <div className="rental-error-box">
                    {error}
                </div>
            )}

            {/* =========================================
                FILTERS
            ========================================== */}

            <div className="rental-filter-section">

                <input
                    type="text"
                    placeholder="Search customer / phone / rental number / laptop / source"
                    value={search}
                    onChange={(e) =>
                        setSearch(
                            e.target.value
                        )
                    }
                />

                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) =>
                        setSelectedDate(
                            e.target.value
                        )
                    }
                />

                <select
                    value={statusFilter}
                    onChange={(e) =>
                        setStatusFilter(
                            e.target.value
                        )
                    }
                >
                    <option value="ALL">
                        All Status
                    </option>

                    <option value="ACTIVE">
                        Active
                    </option>

                    <option value="PENDING">
                        Pending
                    </option>

                    <option value="DOCUMENT_VERIFICATION">
                        Document Verification
                    </option>

                    <option value="DEPOSIT_PENDING">
                        Deposit Pending
                    </option>

                    <option value="RETURN_REQUESTED">
                        Return Requested
                    </option>

                    <option value="SETTLEMENT_PENDING">
                        Settlement Pending
                    </option>

                    <option value="RETURNED">
                        Returned
                    </option>

                    <option value="COMPLETED">
                        Completed
                    </option>

                    <option value="REJECTED">
                        Rejected
                    </option>

                    <option value="CANCELLED">
                        Cancelled
                    </option>
                </select>

                <button
                    className="refresh-btn"
                    onClick={
                        loadWalkInRentals
                    }
                    disabled={loading}
                >
                    {loading
                        ? "Loading..."
                        : "Refresh"}
                </button>

            </div>

            {/* =========================================
                SUMMARY
            ========================================== */}

            <div className="rental-summary-box">

                {/* TOTAL RENTALS */}

                <div className="rental-summary-card">

                    <h3>
                        {
                            filteredRentals.length
                        }
                    </h3>

                    <p>
                        Total Rentals
                    </p>

                </div>

                {/* ACTIVE */}

                <div className="rental-summary-card">

                    <h3>
                        {activeRentals}
                    </h3>

                    <p>
                        Active Rentals
                    </p>

                </div>

                {/* RENT */}

                <div className="rental-summary-card">

                    <h3>
                        ₹{" "}
                        {formatMoney(
                            totalRent
                        )}
                    </h3>

                    <p>
                        Rental Amount + GST
                    </p>

                </div>

                {/* EXPECTED DEPOSIT */}

                <div className="rental-summary-card">

                    <h3>
                        ₹{" "}
                        {formatMoney(
                            totalDeposit
                        )}
                    </h3>

                    <p>
                        Security Deposit
                    </p>

                </div>

                {/* ACTUAL DEPOSIT PAID */}

                <div className="rental-summary-card">

                    <h3>
                        ₹{" "}
                        {formatMoney(
                            totalDepositPaid
                        )}
                    </h3>

                    <p>
                        Deposit Collected
                    </p>

                </div>

            </div>

            {/* =========================================
                TABLE
            ========================================== */}

            <div className="rental-orders-table-wrapper">

                <table className="rental-orders-table">

                    <thead>

                        <tr>

                            <th>
                                Rental ID
                            </th>

                            <th>
                                Date
                            </th>

                            <th>
                                Customer
                            </th>

                            <th>
                                Phone
                            </th>

                            <th>
                                Customer Source
                            </th>

                            <th>
                                Laptop
                            </th>

                            <th>
                                Duration
                            </th>

                            <th>
                                Monthly Rent
                            </th>

                            <th>
                                Deposit
                            </th>

                            <th>
                                Deposit Paid
                            </th>

                            <th>
                                Total
                            </th>

                            <th>
                                Status
                            </th>

                            <th>
                                Action
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {loading ? (

                            <tr>

                                <td
                                    colSpan="13"
                                    className="table-message"
                                >
                                    Loading Walk-In
                                    Rentals...
                                </td>

                            </tr>

                        ) : filteredRentals.length === 0 ? (

                            <tr>

                                <td
                                    colSpan="13"
                                    className="table-message"
                                >
                                    No Walk-In Rental
                                    Orders Found
                                </td>

                            </tr>

                        ) : (

                            filteredRentals.map(
                                (rental) => {

                                    const rentalId =
                                        getRentalId(
                                            rental
                                        );

                                    const status =
                                        getStatus(
                                            rental
                                        );

                                    const duration =
                                        getRentalDuration(
                                            rental
                                        );

                                    const deposit =
                                        getSecurityDeposit(
                                            rental
                                        );

                                    const depositPaid =
                                        getDepositAmountPaid(
                                            rental
                                        );

                                    const depositStatus =
                                        getDepositPaymentStatus(
                                            rental
                                        );

                                    const source =
                                        getCustomerSource(
                                            rental
                                        );

                                    return (
                                        <tr
                                            key={
                                                rentalId
                                            }
                                        >

                                            {/* =================================
                                                RENTAL NUMBER
                                            ================================== */}

                                            <td>

                                                <strong>
                                                    #
                                                    {
                                                        String(
                                                            getRentalNumber(
                                                                rental
                                                            )
                                                        ).slice(
                                                            -12
                                                        )
                                                    }
                                                </strong>

                                            </td>

                                            {/* =================================
                                                DATE
                                            ================================== */}

                                            <td>

                                                {rental?.createdAt
                                                    ? new Date(
                                                        rental.createdAt
                                                    ).toLocaleDateString(
                                                        "en-IN"
                                                    )
                                                    : "-"}

                                            </td>

                                            {/* =================================
                                                CUSTOMER
                                            ================================== */}

                                            <td>

                                                <div className="customer-cell">

                                                    <strong>
                                                        {
                                                            getCustomerName(
                                                                rental
                                                            )
                                                        }
                                                    </strong>

                                                    <small>
                                                        {
                                                            rental?.customerType ||
                                                            "INDIVIDUAL"
                                                        }
                                                    </small>

                                                </div>

                                            </td>

                                            {/* =================================
                                                PHONE
                                            ================================== */}

                                            <td>

                                                {
                                                    getCustomerPhone(
                                                        rental
                                                    )
                                                }

                                            </td>

                                            {/* =================================
                                                CUSTOMER SOURCE
                                            ================================== */}

                                            <td>

                                                {source.label ? (

                                                    <div className="source-cell">

                                                        <span className="source-badge">
                                                            {
                                                                source.label
                                                            }
                                                        </span>

                                                        {source.detail && (

                                                            <small>
                                                                {
                                                                    source.detail
                                                                }
                                                            </small>

                                                        )}

                                                    </div>

                                                ) : (

                                                    <span className="source-empty">
                                                        -
                                                    </span>

                                                )}

                                            </td>

                                            {/* =================================
                                                PRODUCT
                                            ================================== */}

                                            <td>

                                                <div className="product-cell">

                                                    <strong>
                                                        {
                                                            getProductName(
                                                                rental
                                                            )
                                                        }
                                                    </strong>

                                                    {getBrandName(
                                                        rental
                                                    ) && (

                                                        <small>
                                                            {
                                                                getBrandName(
                                                                    rental
                                                                )
                                                            }
                                                        </small>

                                                    )}

                                                </div>

                                            </td>

                                            {/* =================================
                                                DURATION
                                            ================================== */}

                                            <td>

                                                {duration.value}{" "}
                                                {
                                                    duration.type
                                                }

                                            </td>

                                            {/* =================================
                                                MONTHLY RENT
                                            ================================== */}

                                            <td>

                                                ₹{" "}
                                                {formatMoney(
                                                    getMonthlyRent(
                                                        rental
                                                    )
                                                )}

                                            </td>

                                            {/* =================================
                                                SECURITY DEPOSIT
                                            ================================== */}

                                            <td>

                                                ₹{" "}
                                                {formatMoney(
                                                    deposit
                                                )}

                                            </td>

                                            {/* =================================
                                                DEPOSIT PAID
                                            ================================== */}

                                            <td>

                                                <div className="deposit-cell">

                                                    <strong>
                                                        ₹{" "}
                                                        {
                                                            formatMoney(
                                                                depositPaid
                                                            )
                                                        }
                                                    </strong>

                                                    <span
                                                        className={
                                                            `deposit-status ${getDepositStatusClass(
                                                                depositStatus
                                                            )}`
                                                        }
                                                    >
                                                        {
                                                            depositStatus
                                                        }
                                                    </span>

                                                </div>

                                            </td>

                                            {/* =================================
                                                TOTAL
                                            ================================== */}

                                            <td>

                                                <strong>
                                                    ₹{" "}
                                                    {formatMoney(
                                                        getTotalWithGST(
                                                            rental
                                                        )
                                                    )}
                                                </strong>

                                            </td>

                                            {/* =================================
                                                STATUS
                                            ================================== */}

                                            <td>

                                                <span
                                                    className={
                                                        `rental-status ${getStatusClass(
                                                            status
                                                        )}`
                                                    }
                                                >
                                                    {
                                                        status
                                                    }
                                                </span>

                                            </td>

                                            {/* =================================
                                                ACTION
                                            ================================== */}

                                            <td>

                                                <div className="rental-action-buttons">

                                                    {/* VIEW */}

                                                    <button
                                                        className="view-btn"
                                                        onClick={() =>
                                                            viewRental(
                                                                rental
                                                            )
                                                        }
                                                    >
                                                        View
                                                    </button>

                                                    {/* INVOICE */}

                                                    <button
                                                        className="print-btn"
                                                        onClick={() =>
                                                            printInvoice(
                                                                rental
                                                            )
                                                        }
                                                    >
                                                        Invoice
                                                    </button>

                                                    {/* RETURN */}

                                                    {status ===
                                                        "ACTIVE" && (

                                                        <button
                                                            className="return-btn"
                                                            onClick={() =>
                                                                returnRental(
                                                                    rental
                                                                )
                                                            }
                                                        >
                                                            Return
                                                        </button>

                                                    )}

                                                </div>

                                            </td>

                                        </tr>
                                    );
                                }
                            )

                        )}

                    </tbody>

                </table>

            </div>

        </div>
    );
}

export default WalkInRentalOrders;
