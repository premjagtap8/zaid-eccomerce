import React, { useEffect, useState } from "react";

import "./OrderList.css";

import { useNavigate } from "react-router-dom";

import {

    getAllOrders

} from "../../../../services/orderService";


// =====================================================
// CUSTOMER SOURCE (how the customer found us)
// value = what is stored in MongoDB (customerSource)
// =====================================================

const CUSTOMER_SOURCES = [

    { value: "WALK_IN", label: "Walk-in" },

    { value: "WHATSAPP", label: "WhatsApp" },

    { value: "PHONE_CALL", label: "Phone Call" },

    { value: "INSTAGRAM", label: "Instagram" },

    { value: "FACEBOOK", label: "Facebook" },

    { value: "GOOGLE", label: "Google Search" },

    { value: "WEBSITE", label: "Website" },

    { value: "REFERRAL", label: "Referral" },

    { value: "REPEAT_CUSTOMER", label: "Repeat Customer" },

    { value: "OTHER", label: "Other" }

];

// Returns { value, label }. Old orders without a source show "—".
const getSourceInfo = (order) => {

    const value =
        String(order?.customerSource || "")
            .toUpperCase()
            .trim();

    if (!value) {

        return { value: "", label: "—" };

    }

    const match =
        CUSTOMER_SOURCES.find(
            (item) => item.value === value
        );

    const baseLabel =
        match?.label ||
        value
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(/\b\w/g, (letter) => letter.toUpperCase());

    const other =
        String(order?.customerSourceOther || "").trim();

    return {

        value,

        label:
            value === "OTHER" && other
                ? `Other: ${other}`
                : baseLabel

    };

};

const getSourceClass = (order) => {

    const { value } = getSourceInfo(order);

    return value
        ? `source-${value.toLowerCase().replaceAll("_", "-")}`
        : "source-none";

};


// =====================================================
// HELPERS
// =====================================================

const DEFAULT_GST_PERCENTAGE = 18; // purane orders ke liye fallback

const toNumber = (value, fallback = 0) => {

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;

};

const round2 = (value) =>

    Math.round(
        (toNumber(value) + Number.EPSILON) * 100
    ) / 100;

const money = (value) =>

    toNumber(value).toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );


// =====================================================
// FINAL TOTAL
// offer + coupon + GST + shipping ke baad ka amount
//
// Naye order  -> DB me saved finalAmount
// Purane order -> totalAmount se calculate
// =====================================================

const getFinalTotal = (order) => {

    const isNewOrder =
        order?.gstAmount !== undefined &&
        order?.gstAmount !== null &&
        order?.finalAmount !== undefined &&
        order?.finalAmount !== null;

    if (isNewOrder) {

        return round2(order.finalAmount);

    }

    // ---------- purane orders ----------

    const productAmount =
        toNumber(order?.totalAmount);

    const couponDiscount =
        toNumber(order?.couponDiscount);

    const taxableAmount =
        Math.max(
            productAmount - couponDiscount,
            0
        );

    const gstPercentage =
        toNumber(
            order?.gstPercentage,
            DEFAULT_GST_PERCENTAGE
        );

    const gstAmount =
        round2(
            (taxableAmount * gstPercentage) / 100
        );

    const shippingCharge =
        toNumber(order?.shippingCharge);

    const otherCharges =
        toNumber(order?.otherCharges);

    return round2(
        taxableAmount +
        gstAmount +
        shippingCharge +
        otherCharges
    );

};


const OrderList = () => {

    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {

        fetchOrders();

    }, []);

    const fetchOrders = async () => {

        try {

            const res = await getAllOrders();

            console.log("All Orders :", res);

            setOrders(res.orders || []);

        }

        catch (error) {

            console.log(error);

        }

        finally {

            setLoading(false);

        }

    };

    if (loading) {

        return <h2>Loading...</h2>;

    }

    return (

        <div className="admin-orders">

            <h1>All Orders</h1>

            <table>

                <thead>

                    <tr>

                        {/* <th>Order ID</th> */}

                        <th>Customer</th>

                        <th>Source</th>

                        <th>Total</th>

                        <th>Order Status</th>

                        <th>Payment</th>

                        <th>Date</th>

                        <th>Action</th>

                    </tr>

                </thead>

                <tbody>

                    {

                        orders.length === 0 ?

                            (

                                <tr>

                                    <td colSpan="7">

                                        No Orders Found

                                    </td>

                                </tr>

                            )

                            :

                            (

                                orders.map(order => (

                                    <tr key={order._id}>

                                        {/* <td>

                                            {order._id}

                                        </td> */}

                                        <td>

                                            {

                                                order.user

                                                    ?

                                                    `${order.user.firstName} ${order.user.lastName}`

                                                    :

                                                    "N/A"

                                            }

                                        </td>

                                        <td>

                                            <span

                                                className={`source-badge ${getSourceClass(order)}`}

                                                title={getSourceInfo(order).label}

                                            >

                                                {getSourceInfo(order).label}

                                            </span>

                                        </td>

                                        <td>

                                            ₹ {money(getFinalTotal(order))}

                                        </td>

                                        <td>

                                            {order.orderStatus}

                                        </td>

                                        <td>

                                            {order.paymentStatus}

                                        </td>

                                        <td>

                                            {

                                                new Date(

                                                    order.createdAt

                                                ).toLocaleDateString()

                                            }

                                        </td>

                                        <td>

                                            <button

                                                className="view-btn"

                                                onClick={() =>

                                                    navigate(

                                                        `/admin/orders/${order._id}`

                                                    )

                                                }

                                            >

                                                View

                                            </button>

                                        </td>

                                    </tr>

                                ))

                            )

                    }

                </tbody>

            </table>

        </div>

    );

};

export default OrderList;
