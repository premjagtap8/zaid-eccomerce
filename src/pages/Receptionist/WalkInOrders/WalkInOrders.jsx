import { useEffect, useState } from "react";
import "./WalkInOrders.css";
import {
    getAllOrders
} from "../../../services/orderService";


// ======================================
// CUSTOMER SOURCE LABELS
// "How did you come to know about ZAID Infotech?"
// key = value saved in database, label = shown in table
// ======================================

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


// Returns { label, detail }
// - label  = readable source name
// - detail = free text, only when source is OTHER
const getCustomerSource = (order) => {

    const key = String(
        order?.customerSource || ""
    )
        .trim()
        .toUpperCase();

    if (!key) {

        return {
            label: "",
            detail: ""
        };

    }

    const label =
        CUSTOMER_SOURCE_LABELS[key] ||
        key;

    const detail =
        key === "OTHER"
            ? String(
                order?.customerSourceOther || ""
            ).trim()
            : "";

    return {
        label,
        detail
    };

};


function WalkInOrders() {

    const [orders, setOrders] = useState([]);

    const [filteredOrders, setFilteredOrders] = useState([]);

    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);

    useEffect(() => {

        loadOrders();

    }, []);

    const loadOrders = async () => {

        try {

            setLoading(true);

            const res = await getAllOrders();

            console.log("ALL ORDERS :", res);

            const list =
                res.orders ||
                res.data ||
                [];

            // Only Walk-In Orders

            const walkInOrders = list.filter(

                (order) =>

                    order.orderSource === "WALK_IN"

            );

            setOrders(walkInOrders);

            setFilteredOrders(walkInOrders);

        }

        catch (error) {

            console.log(error);

        }

        finally {

            setLoading(false);

        }

    };

    // ======================================
    // SEARCH
    // ======================================

    const handleSearch = (value) => {

        setSearch(value);

        if (!value) {

            setFilteredOrders(orders);

            return;

        }

        const keyword = value.toLowerCase();

        const result = orders.filter((order) => {

            const source = getCustomerSource(order);

            const sourceText =
                `${source.label} ${source.detail}`
                    .toLowerCase();

            return (

                order._id.toLowerCase().includes(keyword)

                ||

                order.shippingAddress?.fullName

                    ?.toLowerCase()

                    .includes(keyword)

                ||

                order.shippingAddress?.phone

                    ?.includes(keyword)

                ||

                sourceText.includes(keyword)

            );

        });

        setFilteredOrders(result);

    };

    // ======================================
    // DATE FILTER
    // ======================================

    const [selectedDate, setSelectedDate] = useState("");

    useEffect(() => {

        if (!selectedDate) {

            setFilteredOrders(orders);

            return;

        }

        const result = orders.filter((order) => {

            const orderDate = new Date(order.createdAt)
                .toISOString()
                .split("T")[0];

            return orderDate === selectedDate;

        });

        setFilteredOrders(result);

    }, [selectedDate, orders]);

    // ======================================
    // TOTAL SALES
    // ======================================

    const totalSales = filteredOrders.reduce(

        (sum, order) =>

            sum + Number(order.totalAmount || 0),

        0

    );

    // ======================================
    // TOTAL ORDERS
    // ======================================

    const totalOrders = filteredOrders.length;

    // ======================================
    // VIEW ORDER
    // ======================================

    const viewOrder = (order) => {

        console.log(order);

        // Next Part me Invoice Modal open hoga

    };

    // ======================================
    // PRINT INVOICE
    // ======================================

    const printInvoice = (order) => {

        window.open(

            `/walkin-invoice/${order._id}`,

            "_blank"

        );

    };

    // ======================================
    // RETURN JSX
    // ======================================

    return (

        <div className="walkin-orders-page">

            <div className="page-header">

                <h2>

                    Walk-In Orders

                </h2>

            </div>

            <div className="filter-section">

                <input

                    type="text"

                    placeholder="Search Customer / Phone / Order ID / Source"

                    value={search}

                    onChange={(e)=>

                        handleSearch(e.target.value)

                    }

                />

                <input

                    type="date"

                    value={selectedDate}

                    onChange={(e)=>

                        setSelectedDate(e.target.value)

                    }

                />

            </div>

            <div className="summary-box">

                <div className="summary-card">

                    <h3>

                        {totalOrders}

                    </h3>

                    <p>

                        Total Orders

                    </p>

                </div>

                <div className="summary-card">

                    <h3>

                        ₹ {totalSales}

                    </h3>

                    <p>

                        Total Sales

                    </p>

                </div>

            </div>

            <div className="orders-table">

                <table>

                    <thead>

                        <tr>

                            <th>Order ID</th>

                            <th>Date</th>

                            <th>Customer</th>

                            <th>Phone</th>

                            <th>Customer Source</th>

                            <th>Products</th>

                            <th>Qty</th>

                            <th>Total</th>

                            <th>Payment</th>

                            <th>Status</th>

                            <th>Action</th>

                        </tr>

                    </thead>

                    <tbody>

                        {

                            loading ?

                            (

                                <tr>

                                    <td colSpan="11">

                                        Loading...

                                    </td>

                                </tr>

                            )

                            :

                            filteredOrders.length===0 ?

                            (

                                <tr>

                                    <td colSpan="11">

                                        No Walk-In Orders Found

                                    </td>

                                </tr>

                            )

                            :

                            filteredOrders.map((order)=>{

                                const source =
                                    getCustomerSource(order);

                                return (

                                <tr key={order._id}>

                                    <td>

                                        {order._id.slice(-8)}

                                    </td>

                                    <td>

                                        {

                                            new Date(

                                                order.createdAt

                                            ).toLocaleDateString()

                                        }

                                    </td>

                                    <td>

                                        {

                                            order.shippingAddress

                                                ?.fullName

                                        }

                                    </td>

                                    <td>

                                        {

                                            order.shippingAddress

                                                ?.phone

                                        }

                                    </td>

                                    <td>

                                        {

                                            source.label ?

                                            (

                                                <div
                                                    className="source-cell"
                                                >

                                                    <span
                                                        className="source-badge"
                                                    >

                                                        {source.label}

                                                    </span>

                                                    {

                                                        source.detail && (

                                                            <small>

                                                                {source.detail}

                                                            </small>

                                                        )

                                                    }

                                                </div>

                                            )

                                            :

                                            (

                                                <span
                                                    className="source-empty"
                                                >

                                                    -

                                                </span>

                                            )

                                        }

                                    </td>

                                    <td>

                                        {

                                            order.orderItems.length

                                        }

                                    </td>

                                    <td>

                                        {

                                            order.orderItems.reduce(

                                                (sum,item)=>

                                                sum+

                                                item.quantity,

                                                0

                                            )

                                        }

                                    </td>

                                    <td>

                                        ₹

                                        {

                                            order.totalAmount

                                        }

                                    </td>

                                    <td>

                                        <span
                                            className={
                                                order.paymentStatus==="PAID"
                                                ?
                                                "paid"
                                                :
                                                "pending"
                                            }
                                        >

                                            {

                                                order.paymentStatus

                                            }

                                        </span>

                                    </td>

                                    <td>

                                        <span
                                            className="order-status"
                                        >

                                            {

                                                order.orderStatus

                                            }

                                        </span>

                                    </td>

                                    <td>

                                        <div
                                            className="action-buttons"
                                        >

                                            <button

                                                className="view-btn"

                                                onClick={()=>

                                                    viewOrder(order)

                                                }

                                            >

                                                View

                                            </button>

                                            <button

                                                className="print-btn"

                                                onClick={()=>

                                                    printInvoice(order)

                                                }

                                            >

                                                Print

                                            </button>

                                        </div>

                                    </td>

                                </tr>

                                );

                            })

                        }

                    </tbody>

                </table>

            </div>

        </div>

    );

}

export default WalkInOrders;
