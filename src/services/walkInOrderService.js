import axios from "axios";

// =====================================
// API
// =====================================

const API = `${import.meta.env.VITE_API_URL}/orders`;

const PRODUCT_API =
    `${import.meta.env.VITE_API_URL}/products`;

// =====================================
// AUTH CONFIG
// =====================================

const getConfig = () => {

    const token =
        localStorage.getItem("token");

    return {
        headers: {
            Authorization:
                `Bearer ${token}`,
        },
    };
};

// =====================================
// CREATE WALK-IN ORDER
// =====================================

export const createWalkInOrder = async (data) => {

    // FIX: spread all fields from the page (orderItems, shippingAddress,
    // totalAmount, paymentMethod, customerSource, customerSourceOther ...)
    // so nothing is dropped before the request is sent.
    const payload = {
        ...data,
        orderSource: "WALK_IN",
    };

    const res = await axios.post(
        API,
        payload,
        getConfig()
    );

    return res.data;
};

// =====================================
// GET PRODUCTS
// =====================================

export const getProducts = async () => {

    const res = await axios.get(
        PRODUCT_API,
        getConfig()
    );

    console.log(
        "WALK-IN PRODUCT RESPONSE:",
        res.data
    );

    if (Array.isArray(res.data)) {
        return res.data;
    }

    if (Array.isArray(res.data.data)) {
        return res.data.data;
    }

    if (Array.isArray(res.data.products)) {
        return res.data.products;
    }

    return [];
};

// =====================================
// SEARCH PRODUCTS
// =====================================

export const searchProducts = async (keyword) => {

    const res = await axios.get(
        `${PRODUCT_API}/search?keyword=${encodeURIComponent(keyword)}`,
        getConfig()
    );

    if (Array.isArray(res.data)) {
        return res.data;
    }

    if (Array.isArray(res.data.data)) {
        return res.data.data;
    }

    if (Array.isArray(res.data.products)) {
        return res.data.products;
    }

    return [];
};