import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "react-toastify";

import "./Checkout.css";

// CHANGE: removed `import { createPayment } from "../../../services/paymentService";`
// The Payment document is now created by the backend inside
// POST /payments/razorpay/order, so Checkout doesn't need it.

const API = import.meta.env.VITE_API_URL;


// =================================
// CUSTOMER SOURCE OPTIONS (OPTIONAL)
// "How did you come to know about ZAID Infotech?"
// value = saved in database (must match backend customerSource.js keys)
// label = shown in the dropdown
// =================================

const CUSTOMER_SOURCE_OPTIONS = [
    { value: "GOOGLE", label: "Google Search / Google Maps" },
    { value: "INSTAGRAM_FACEBOOK", label: "Instagram / Facebook" },
    { value: "YOUTUBE", label: "YouTube" },
    { value: "REFERRAL", label: "Friends or Family Referral" },
    { value: "EXISTING_CUSTOMER", label: "Existing Customer" },
    { value: "SHOP_BOARD", label: "Walk-in / Shop Board" },
    { value: "ONLINE_AD", label: "Online Advertisement" },
    { value: "INFLUENCER", label: "Influencer / Blogger Recommendation" },
    { value: "WHATSAPP", label: "WhatsApp" },
    { value: "OTHER", label: "Other" }
];


// =================================
// UNIT PRICE
// Uses the price saved on the cart item first
// Backend picks retail / wholesale by customer type.
// Falls back to product fields for old cart items.
// =================================

const getUnitPrice = (item) => {
    const candidates = [
        item?.finalPrice,
        item?.price,
        item?.product?.pricing?.sellingPrice,
        item?.product?.pricing?.retailPrice
    ];

    const found = candidates
        .map(Number)
        .find((n) => Number.isFinite(n) && n > 0);

    return found ?? 0;
};


const Checkout = () => {

    const navigate = useNavigate();
    const location = useLocation();

    const token = localStorage.getItem("token");


    // =================================
    // COUPON PASSED FROM CART
    // =================================

    const coupon = location.state?.coupon || null;
    const couponCode = location.state?.couponCode || "";
    const couponDiscount = Number(
        location.state?.couponDiscount || 0
    );


    // =================================
    // STATES
    // =================================

    const [cart, setCart] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState("");
    const [loading, setLoading] = useState(false);
    const [cartLoading, setCartLoading] = useState(true);

    const [termsAccepted, setTermsAccepted] = useState(false);

    // Customer source tracking (OPTIONAL)
    // customerSource = key of the selected option (e.g. GOOGLE, OTHER)
    // customerSourceOther = free text, used only when key is OTHER
    const [customerSource, setCustomerSource] = useState("");
    const [customerSourceOther, setCustomerSourceOther] = useState("");


    // =================================
    // PRICING
    // =================================
    // NOTE: preview only. The real shipping charge is set by the backend
    // order service. Both must be 100.

    const shippingCharge = 100;
    const gst = 18;


    // =================================
    // LOAD DATA
    // =================================

    useEffect(() => {
        loadCart();
        getAddresses();
    }, []);


    // =================================
    // GET CART
    // =================================

    const loadCart = async () => {

        try {

            setCartLoading(true);

            const res = await axios.get(`${API}/cart`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            console.log("CHECKOUT CART:", res.data);

            const items = res.data?.data?.items || [];

            setCart(
                Array.isArray(items)
                    ? items
                    : []
            );

        }
        catch (err) {

            console.error(
                "GET CART ERROR:",
                err.response?.data || err
            );

            setCart([]);

        }
        finally {

            setCartLoading(false);

        }

    };


    // =================================
    // GET ADDRESSES
    // =================================

    const getAddresses = async () => {

        try {

            const res = await axios.get(
                `${API}/addresses`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            console.log(
                "ADDRESS RESPONSE:",
                res.data
            );

            const addressData =
                res.data?.data || [];

            setAddresses(
                Array.isArray(addressData)
                    ? addressData
                    : []
            );

        }
        catch (err) {

            console.error(
                "GET ADDRESS ERROR:",
                err.response?.data || err
            );

        }

    };


    // =================================
    // TOTALS
    // =================================

    const subtotal = cart.reduce(
        (sum, item) => {

            const price = getUnitPrice(item);

            const quantity = Number(
                item.quantity || 0
            );

            return sum + price * quantity;

        },
        0
    );


    const discountedSubtotal = Math.max(
        subtotal - couponDiscount,
        0
    );


    const gstAmount = Math.round(
        discountedSubtotal * gst / 100
    );


    const grandTotal =
        discountedSubtotal +
        shippingCharge +
        gstAmount;


    // =================================
    // PLACE ORDER
    // =================================

    const placeOrder = async () => {

        if (loading) {
            return;
        }


        // =================================
        // TERMS CHECK
        // =================================

        if (!termsAccepted) {

            toast.error(
                "Please accept the Terms & Conditions before placing your order"
            );

            return;
        }


        // =================================
        // ADDRESS CHECK
        // =================================

        if (!selectedAddress) {

            toast.error(
                "Please select delivery address"
            );

            return;
        }


        const address = addresses.find(
            (item) =>
                item._id === selectedAddress
        );


        if (!address) {

            toast.error(
                "Address not found"
            );

            return;
        }


        // =================================
        // CART CHECK
        // =================================

        if (!cart.length) {

            toast.error(
                "Your cart is empty"
            );

            return;
        }


        // =================================
        // CUSTOMER SOURCE
        // Optional: no validation here. It is sent
        // to the backend only when the customer
        // selects an option.
        // =================================


        // =================================
        // SHIPPING ADDRESS
        // =================================

        const shippingAddress = {

            fullName:
                address.fullName ||
                address.name ||
                "",

            phone:
                address.phone ||
                address.mobile ||
                "",

            addressLine:
                address.addressLine ||
                address.address ||
                address.streetAddress ||
                "",

            city:
                address.city ||
                "",

            state:
                address.state ||
                "",

            pincode:
                address.pincode ||
                "",

            country:
                address.country ||
                "India",

            landmark:
                address.landmark ||
                ""
        };


        // =================================
        // SHIPPING ADDRESS VALIDATION
        // =================================

        if (!shippingAddress.fullName) {

            toast.error(
                "Address name is missing"
            );

            return;
        }


        if (!shippingAddress.phone) {

            toast.error(
                "Phone number is missing"
            );

            return;
        }


        if (!shippingAddress.addressLine) {

            toast.error(
                "Address is missing"
            );

            return;
        }


        if (!shippingAddress.city) {

            toast.error(
                "City is missing"
            );

            return;
        }


        if (!shippingAddress.state) {

            toast.error(
                "State is missing"
            );

            return;
        }


        if (!shippingAddress.pincode) {

            toast.error(
                "Pincode is missing"
            );

            return;
        }


        // =================================
        // ORDER ITEMS
        // =================================

        const orderItems = cart.map(
            (item) => {

                const unitPrice =
                    getUnitPrice(item);


                const originalPrice = Number(
                    item.originalPrice ??
                    item.product?.pricing?.mrp ??
                    unitPrice
                );


                const quantity = Number(
                    item.quantity ?? 1
                );


                const discountAmount = Number(
                    item.discountAmount ??
                    Math.max(
                        originalPrice -
                        unitPrice,
                        0
                    )
                );


                return {

                    product:
                        item.product?._id ||
                        item.product ||
                        "",

                    title:
                        item.product?.name ||
                        item.title ||
                        "",

                    quantity:
                        quantity,

                    originalPrice:
                        originalPrice,

                    discountAmount:
                        discountAmount,

                    price:
                        unitPrice,

                    offer:
                        item.offer ||
                        null,

                    imageUrl:
                        item.product?.images?.[0]?.url ||
                        item.imageUrl ||
                        ""
                };

            }
        );


        // =================================
        // CHECK PRODUCT DATA
        // =================================

        const invalidOrderItem =
            orderItems.some(
                (item) =>
                    !item.product ||
                    !item.title ||
                    !Number.isFinite(
                        item.quantity
                    ) ||
                    item.quantity < 1 ||
                    !Number.isFinite(
                        item.originalPrice
                    ) ||
                    !Number.isFinite(
                        item.price
                    ) ||
                    item.price <= 0
            );


        if (invalidOrderItem) {

            toast.error(
                "Some product information is missing. Please refresh the cart and try again."
            );

            return;
        }


        // =================================
        // ORDER DATA
        // =================================

        const orderData = {

            orderItems:
                orderItems,

            shippingAddress:
                shippingAddress,

            totalAmount:
                Number(grandTotal),

            orderSource:
                "ONLINE"
        };


        // Customer source is OPTIONAL: add it to the request
        // only when the customer selected something.
        if (customerSource) {

            orderData.customerSource =
                customerSource;

            // free text is sent only when "Other" is selected
            // and the customer actually typed something
            if (
                customerSource === "OTHER" &&
                customerSourceOther.trim()
            ) {

                orderData.customerSourceOther =
                    customerSourceOther.trim();

            }

        }


        console.log(
            "FINAL ORDER DATA:",
            orderData
        );


        // =================================
        // API PROCESS
        // =================================

        try {

            setLoading(true);


            // =================================
            // 1. CREATE ORDER
            // =================================

            const orderRes =
                await axios.post(
                    `${API}/orders`,
                    orderData,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json"
                        }
                    }
                );


            console.log(
                "ORDER RESPONSE:",
                orderRes.data
            );


            const order =
                orderRes.data?.order;


            if (!order) {

                throw new Error(
                    "Order was not created"
                );

            }


            console.log(
                "ORDER CREATED:",
                order
            );


            // =================================
            // CHANGE: REMOVED STEP
            // "2. CREATE DATABASE PAYMENT"
            //
            // Before: Checkout created a Payment here
            // (createPayment) and passed it to /payment.
            // Payment.jsx then created a second one.
            //
            // Now: no Payment is created in the frontend.
            // The backend creates it when the user clicks
            // Pay (POST /payments/razorpay/order) and links
            // it to the Razorpay order.
            // =================================


            // =================================
            // 2. GO TO PAYMENT PAGE
            // (CHANGE: was step 3)
            // =================================

            navigate(
                "/payment",
                {
                    state: {

                        order:
                            order,

                        paymentSummary: {

                            subtotal:
                                Number(order.subtotal),

                            couponDiscount:
                                Number(order.couponDiscount || 0),

                            taxableAmount:
                                Number(order.taxableAmount),

                            shippingCharge:
                                Number(order.shippingCharge),

                            gstPercentage:
                                Number(order.gstPercentage),

                            gstAmount:
                                Number(order.gstAmount),

                            total:
                                Number(order.finalAmount)

                        }

                    }
                }
            );
        }
        catch (err) {

            console.error(
                "================================="
            );

            console.error(
                "ORDER / PAYMENT ERROR:",
                err
            );

            console.error(
                "BACKEND ERROR:",
                err.response?.data
            );

            console.error(
                "VALIDATION ERRORS:",
                err.response?.data?.errors
            );


            const backendData =
                err.response?.data;


            let message =
                backendData?.message ||
                err.message ||
                "Order failed";


            // =================================
            // JOI VALIDATION ERRORS
            // =================================

            if (
                Array.isArray(
                    backendData?.errors
                ) &&
                backendData.errors.length > 0
            ) {

                message =
                    backendData.errors.join(
                        "\n"
                    );

            }


            toast.error(message);

        }
        finally {

            setLoading(false);

        }

    };


    // =================================
    // LOADING
    // =================================

    if (cartLoading) {

        return (

            <div className="checkout">

                <div className="checkout-right">

                    <h2>
                        Loading Cart...
                    </h2>

                </div>

            </div>

        );

    }


    // =================================
    // UI
    // =================================

    return (

        <div className="checkout">

            {/* =================================
                LEFT
            ================================= */}

            <div className="checkout-left">

                <h2>
                    Select Delivery Address
                </h2>


                {addresses.length === 0 ? (

                    <p>
                        No Address Found
                    </p>

                ) : (

                    addresses.map(
                        (address) => (

                            <div
                                className="address-card"
                                key={address._id}
                            >

                                <input
                                    type="radio"
                                    name="deliveryAddress"
                                    checked={
                                        selectedAddress ===
                                        address._id
                                    }
                                    onChange={() =>
                                        setSelectedAddress(
                                            address._id
                                        )
                                    }
                                />


                                <div>

                                    <h4>
                                        {
                                            address.fullName ||
                                            address.name ||
                                            "Customer"
                                        }
                                    </h4>


                                    <p>
                                        {
                                            address.phone ||
                                            address.mobile ||
                                            ""
                                        }
                                    </p>


                                    <p>
                                        {
                                            address.addressLine ||
                                            address.address ||
                                            address.streetAddress ||
                                            ""
                                        }
                                    </p>


                                    <p>

                                        {
                                            address.city ||
                                            ""
                                        }

                                        {", "}

                                        {
                                            address.state ||
                                            ""
                                        }

                                    </p>


                                    <p>
                                        {
                                            address.pincode ||
                                            ""
                                        }
                                    </p>

                                </div>

                            </div>

                        )
                    )

                )}

            </div>


            {/* =================================
                RIGHT
            ================================= */}

            <div className="checkout-right">

                <h2>
                    Order Summary
                </h2>


                {cart.length === 0 ? (

                    <div>

                        <p>
                            Cart is empty
                        </p>


                        <button
                            type="button"
                            onClick={() =>
                                navigate("/shop")
                            }
                        >
                            Continue Shopping
                        </button>

                    </div>

                ) : (

                    cart.map(
                        (item, index) => {

                            const productId =
                                item.product?._id ||
                                item._id;


                            const price =
                                getUnitPrice(item);


                            const quantity =
                                Number(
                                    item.quantity || 0
                                );


                            const itemTotal =
                                price * quantity;


                            return (

                                <div
                                    className="summary-item"
                                    key={
                                        productId ||
                                        index
                                    }
                                >

                                    <p>
                                        {
                                            item.product?.name
                                        }
                                    </p>


                                    <p>
                                        Qty: {quantity}
                                    </p>


                                    <p>
                                        ₹ {price}
                                    </p>


                                    <p>
                                        Item Total:
                                        {" "}
                                        ₹ {itemTotal}
                                    </p>

                                </div>

                            );

                        }
                    )

                )}


                {cart.length > 0 && (

                    <>

                        <hr />


                        {/* =================================
                            SUBTOTAL
                        ================================= */}

                        <div className="summary-row">

                            <span>
                                Subtotal
                            </span>

                            <span>
                                ₹ {subtotal}
                            </span>

                        </div>


                        {/* =================================
                            COUPON
                        ================================= */}

                        {couponDiscount > 0 && (

                            <div className="summary-row">

                                <span>

                                    Coupon Discount

                                    {
                                        couponCode
                                            ? ` (${couponCode})`
                                            : ""
                                    }

                                </span>

                                <span>
                                    - ₹ {couponDiscount}
                                </span>

                            </div>

                        )}


                        {/* =================================
                            SHIPPING
                        ================================= */}

                        <div className="summary-row">

                            <span>
                                Shipping
                            </span>

                            <span>
                                ₹ {shippingCharge}
                            </span>

                        </div>


                        {/* =================================
                            GST
                        ================================= */}

                        <div className="summary-row">

                            <span>
                                GST ({gst}%)
                            </span>

                            <span>
                                ₹ {gstAmount}
                            </span>

                        </div>


                        <hr />


                        {/* =================================
                            GRAND TOTAL
                        ================================= */}

                        <h2>
                            Total : ₹ {grandTotal}
                        </h2>


                        {/* =================================
                            CUSTOMER SOURCE (OPTIONAL)
                            How did you come to know about ZAID Infotech?
                        ================================= */}

                        <div className="checkout-source">

                            <label htmlFor="customerSource">
                                How did you come to know about ZAID Infotech?
                                {" "}
                                (optional)
                            </label>

                            <select
                                id="customerSource"
                                value={customerSource}
                                onChange={(e) => {
                                    setCustomerSource(e.target.value);

                                    // clear old text when switching away from Other
                                    if (e.target.value !== "OTHER") {
                                        setCustomerSourceOther("");
                                    }
                                }}
                            >

                                <option value="">
                                    Select an option
                                </option>

                                {CUSTOMER_SOURCE_OPTIONS.map((option) => (

                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>

                                ))}

                            </select>


                            {customerSource === "OTHER" && (

                                <input
                                    type="text"
                                    className="source-other-input"
                                    placeholder="Please tell us how you came to know about us"
                                    value={customerSourceOther}
                                    maxLength={200}
                                    onChange={(e) =>
                                        setCustomerSourceOther(
                                            e.target.value
                                        )
                                    }
                                />

                            )}

                        </div>


                        {/* =================================
                            TERMS & CONDITIONS
                        ================================= */}

                        <div className="checkout-terms">

                            <label
                                style={{
                                    display: "flex",
                                    gap: "8px",
                                    alignItems:
                                        "flex-start",
                                    fontSize: "13px",
                                    margin:
                                        "10px 0",
                                    cursor:
                                        "pointer"
                                }}
                            >

                                <input
                                    type="checkbox"
                                    checked={
                                        termsAccepted
                                    }
                                    onChange={(e) =>
                                        setTermsAccepted(
                                            e.target.checked
                                        )
                                    }
                                    style={{
                                        marginTop:
                                            "3px"
                                    }}
                                />


                                <span>

                                    I agree to the{" "}

                                    <Link
                                        to="/terms-conditions"
                                        target="_blank"
                                    >
                                        Terms &amp;
                                        Conditions
                                    </Link>

                                    {" "}and acknowledge the{" "}

                                    <Link
                                        to="/privacy-policy"
                                        target="_blank"
                                    >
                                        Privacy Policy
                                    </Link>

                                    .

                                </span>

                            </label>

                        </div>


                        {/* =================================
                            PLACE ORDER
                        ================================= */}

                        <button
                            type="button"
                            onClick={placeOrder}
                            disabled={loading}
                        >

                            {
                                loading
                                    ? "Placing Order..."
                                    : "Place Order"
                            }

                        </button>

                    </>

                )}

            </div>

        </div>

    );

};


export default Checkout;