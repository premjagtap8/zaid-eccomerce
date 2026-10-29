import React, { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import "./Cart.css";
import { Link, useNavigate } from "react-router-dom";

import {
    getCart,
    updateCartQuantity,
    removeCartItem
} from "../../../services/cartService";

import { applyCoupon } from "../../../services/couponService";


const API_URL = import.meta.env.VITE_API_URL;
const BASE_URL = API_URL.replace("/api", "");


// ==================================================
// UNIT PRICE
// Uses the price saved on the cart item first
// (backend picks retail / wholesale by customer type).
// Falls back to product fields for old cart items.
// ==================================================

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


const Cart = () => {

    const navigate = useNavigate();


    // ==================================================
    // CART STATES
    // ==================================================

    const [cartItems, setCartItems] = useState([]);
    const [subtotal, setSubtotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [updatingProduct, setUpdatingProduct] = useState(null);


    // ==================================================
    // INVENTORY / STOCK STATES
    // ==================================================

    const [inventoryList, setInventoryList] = useState([]);


    // ==================================================
    // COUPON STATES
    // ==================================================

    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponDiscount, setCouponDiscount] = useState(0);


    // ==================================================
    // CONSTANTS
    // ==================================================

    const shippingCharge = 100;
    const gst = 18;


    // ==================================================
    // LOAD CART + INVENTORY (PARALLEL)
    // ==================================================

    useEffect(() => {
        loadCart();
    }, []);


    const loadCart = async () => {

        try {

            setLoading(true);

            const [cartRes, inventoryRes] = await Promise.all([
                getCart(),
                fetch(`${API_URL}/inventory/shop`).then((res) => res.json())
            ]);

            console.log("CART RESPONSE:", cartRes.data);
            console.log("INVENTORY RESPONSE:", inventoryRes);

            const items = cartRes.data?.data?.items || [];
            setCartItems(Array.isArray(items) ? items : []);

            const inventoryItems = inventoryRes?.data || [];
            setInventoryList(Array.isArray(inventoryItems) ? inventoryItems : []);

        }
        catch (error) {

            console.error("CART/INVENTORY LOAD ERROR:", error);
            setCartItems([]);
            setInventoryList([]);

        }
        finally {

            setLoading(false);

        }

    };


    // ==================================================
    // STOCK LOOKUP MAP
    // productId -> { status, availableStock }
    // ==================================================

    const stockMap = useMemo(() => {

        const map = new Map();

        inventoryList.forEach((inv) => {

            const prodId = inv?.product?._id || inv?.product;

            if (prodId) {
                map.set(prodId, {
                    status: inv.status,
                    availableStock: Number(inv.availableStock || 0)
                });
            }

        });

        return map;

    }, [inventoryList]);


    // ==================================================
    // STOCK CHECK HELPERS
    // ==================================================

    const getStockInfo = (productId) => {

        if (!productId) {
            return null;
        }

        return stockMap.get(productId) || null;

    };


    const isItemOutOfStock = (item) => {

        const stockInfo = getStockInfo(item.product?._id);

        // Not found in inventory at all -> treat as unavailable
        if (!stockInfo) {
            return true;
        }

        return (
            stockInfo.status !== "IN_STOCK" ||
            stockInfo.availableStock <= 0
        );

    };


    const hasOutOfStockItems = cartItems.some(isItemOutOfStock);


    // ==================================================
    // CALCULATE SUBTOTAL
    // ==================================================

    useEffect(() => {

        const total = cartItems.reduce((sum, item) => {

            const price = getUnitPrice(item);
            const quantity = Number(item.quantity || 0);

            return sum + price * quantity;

        }, 0);

        setSubtotal(total);

    }, [cartItems]);


    // ==================================================
    // RESET COUPON
    // ==================================================

    const resetCoupon = () => {

        setCouponCode("");
        setAppliedCoupon(null);
        setCouponDiscount(0);

    };


    // ==================================================
    // UPDATE QUANTITY
    // ==================================================

    const handleUpdateQuantity = async (item, change) => {

        const productId = item.product?._id;

        if (!productId) {
            toast.error("Product information missing");
            return;
        }

        const currentQuantity = Number(item.quantity || 1);
        const newQuantity = currentQuantity + change;

        if (newQuantity < 1) {
            return;
        }

        try {

            setUpdatingProduct(productId);

            console.log("Updating quantity:", { productId, newQuantity });

            const res = await updateCartQuantity(productId, newQuantity);

            console.log("UPDATED CART:", res.data);

            const updatedItems = res.data?.data?.items || [];
            setCartItems(Array.isArray(updatedItems) ? updatedItems : []);

            // Cart total changed, so old coupon discount must not stay active.
            if (appliedCoupon) {
                resetCoupon();
                toast.info("Cart changed. Please apply coupon again.");
            }

        }
        catch (error) {

            console.error("UPDATE QUANTITY ERROR:", error);

            toast.error(
                error.response?.data?.message ||
                "Failed to update quantity"
            );

        }
        finally {

            setUpdatingProduct(null);

        }

    };


    // ==================================================
    // REMOVE ITEM
    // ==================================================

    const handleRemoveItem = async (item) => {

        const productId = item.product?._id;

        if (!productId) {
            toast.error("Product information missing");
            return;
        }

        const confirmRemove = window.confirm(
            "Are you sure you want to remove this product?"
        );

        if (!confirmRemove) {
            return;
        }

        try {

            setUpdatingProduct(productId);

            const res = await removeCartItem(productId);

            console.log("REMOVE CART RESPONSE:", res.data);

            const updatedItems = res.data?.data?.items || [];
            setCartItems(Array.isArray(updatedItems) ? updatedItems : []);

            // Cart changed, reset coupon.
            if (appliedCoupon) {
                resetCoupon();
                toast.info("Cart changed. Coupon removed.");
            }

            // item count actually changed
            window.dispatchEvent(new CustomEvent("cart-updated"));

        }
        catch (error) {

            console.error("REMOVE ITEM ERROR:", error);

            toast.error(
                error.response?.data?.message ||
                "Failed to remove product"
            );

        }
        finally {

            setUpdatingProduct(null);

        }

    };


    // ==================================================
    // COUPON CALCULATIONS
    // ==================================================

    const discountedSubtotal = Math.max(subtotal - couponDiscount, 0);

    const discountedGstAmount = Math.round(
        discountedSubtotal * gst / 100
    );

    const grandTotal =
        discountedSubtotal +
        shippingCharge +
        discountedGstAmount;


    // ==================================================
    // APPLY COUPON
    // ==================================================

    const handleApplyCoupon = async () => {

        const code = couponCode.trim().toUpperCase();

        if (!code) {
            toast.error("Please enter coupon code");
            return;
        }

        if (subtotal <= 0) {
            toast.error("Your cart is empty");
            return;
        }

        try {

            setCouponLoading(true);

            console.log("APPLYING COUPON:", { code, cartTotal: subtotal });

            const res = await applyCoupon(code, subtotal);

            console.log("APPLY COUPON RESPONSE:", res.data);

            if (res.data?.success) {

                const discount = Number(res.data?.discountAmount || 0);
                const coupon = res.data?.coupon;

                setAppliedCoupon(coupon || null);
                setCouponCode(coupon?.code || code);
                setCouponDiscount(discount);

                toast.success("Coupon applied successfully");

                return;

            }

            // Unexpected response
            resetCoupon();

            toast.error(
                res.data?.message ||
                "Unable to apply coupon"
            );

        }
        catch (error) {

            console.error("APPLY COUPON ERROR:", error);

            resetCoupon();

            toast.error(
                error.response?.data?.message ||
                "Invalid or unavailable coupon"
            );

        }
        finally {

            setCouponLoading(false);

        }

    };


    // ==================================================
    // REMOVE COUPON
    // ==================================================

    const handleRemoveCoupon = () => {

        resetCoupon();
        toast.success("Coupon removed");

    };


    // ==================================================
    // PROCEED TO CHECKOUT
    // ==================================================

    const handleProceedCheckout = () => {

        // Stock guard, even if the button is triggered anyway.
        if (hasOutOfStockItems) {

            toast.error(
                "Please remove out of stock items before proceeding to checkout"
            );

            return;

        }

        if (!appliedCoupon) {
            navigate("/checkout");
            return;
        }

        navigate("/checkout", {
            state: {
                coupon: appliedCoupon,
                couponCode: appliedCoupon.code || couponCode,
                couponDiscount: couponDiscount
            }
        });

    };


    // ==================================================
    // LOADING
    // ==================================================

    if (loading) {

        return (
            <div className="cart-page">
                <div className="cart-loading">
                    <span className="cart-spinner" aria-hidden="true" />
                    Loading cart...
                </div>
            </div>
        );

    }


    // ==================================================
    // UI
    // ==================================================

    return (

        <div className="cart-page">

            {/* HEADER */}

            <div className="cart-header">
                <div className="cart-header-text">
                    <h2>
                        Shopping <span>cart</span>
                    </h2>
                    <p>Review your selected products</p>
                </div>

                {cartItems.length > 0 && (
                    <span className="cart-count-pill">
                        {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
                    </span>
                )}
            </div>


            {/* EMPTY CART */}

            {cartItems.length === 0 ? (

                <div className="empty-cart">

                    <div className="empty-cart-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="20" r="1.4" />
                            <circle cx="18" cy="20" r="1.4" />
                            <path d="M2.5 3.5h2.7l2.3 11.2a1.6 1.6 0 0 0 1.6 1.3h8.1a1.6 1.6 0 0 0 1.6-1.2l1.3-6.5H6.2" />
                        </svg>
                    </div>

                    <h3>Your cart is empty</h3>

                    <p>Add some products to continue shopping.</p>

                    <Link to="/shop" className="continue-shopping">
                        Continue shopping
                    </Link>

                </div>

            ) : (

                <>

                    {/* CART TABLE */}

                    <div className="cart-table">

                        <div className="cart-head">
                            <div>Product</div>
                            <div>Price</div>
                            <div>Quantity</div>
                            <div>Total</div>
                            <div>Action</div>
                        </div>


                        {cartItems.map((item, index) => {

                            const product = item.product;

                            const price = getUnitPrice(item);

                            const quantity = Number(item.quantity || 1);

                            const itemTotal = price * quantity;

                            const productId = product?._id;

                            const isUpdating = updatingProduct === productId;

                            const outOfStock = isItemOutOfStock(item);

                            return (

                                <div
                                    className={
                                        outOfStock
                                            ? "cart-row cart-row-out-of-stock"
                                            : "cart-row"
                                    }
                                    key={productId || index}
                                >

                                    {/* PRODUCT */}

                                    <div className="cart-product">

                                        <img
                                            src={
                                                product?.images?.length
                                                    ? (
                                                        product.images[0]?.url?.startsWith("http")
                                                            ? product.images[0].url
                                                            : `${BASE_URL}${product.images[0].url}`
                                                    )
                                                    : "/no-image.png"
                                            }
                                            alt={product?.name || "Product"}
                                            onError={(e) => {
                                                e.currentTarget.src = "/no-image.png";
                                            }}
                                        />

                                        <div className="cart-product-info">

                                            <h4>{product?.name || "Product"}</h4>

                                            <p>{product?.brand?.name || "No Brand"}</p>

                                            {outOfStock && (
                                                <span className="out-of-stock-badge">
                                                    Out Of Stock
                                                </span>
                                            )}

                                        </div>

                                    </div>


                                    {/* PRICE */}

                                    <div className="cart-price" data-label="Price">
                                        ₹ {price}
                                    </div>


                                    {/* QUANTITY */}

                                    <div className="cart-quantity-cell" data-label="Quantity">

                                        <div className="cart-quantity">

                                            <button
                                                type="button"
                                                aria-label="Decrease quantity"
                                                disabled={isUpdating || outOfStock || quantity <= 1}
                                                onClick={() => handleUpdateQuantity(item, -1)}
                                            >
                                                −
                                            </button>

                                            <span>
                                                {isUpdating ? "..." : quantity}
                                            </span>

                                            <button
                                                type="button"
                                                aria-label="Increase quantity"
                                                disabled={isUpdating || outOfStock}
                                                onClick={() => handleUpdateQuantity(item, 1)}
                                            >
                                                +
                                            </button>

                                        </div>

                                    </div>


                                    {/* TOTAL */}

                                    <div className="cart-item-total" data-label="Total">
                                        ₹ {itemTotal}
                                    </div>


                                    {/* REMOVE */}

                                    <div className="cart-action">

                                        <button
                                            type="button"
                                            className="remove-btn"
                                            disabled={isUpdating}
                                            onClick={() => handleRemoveItem(item)}
                                        >
                                            {isUpdating ? "Please Wait..." : "Remove"}
                                        </button>

                                    </div>

                                </div>

                            );

                        })}

                    </div>


                    {/* SUMMARY */}

                    <div className="cart-summary">

                        <h3>Order summary</h3>


                        {/* COUPON SECTION */}

                        <div className="coupon-section">

                            <h4>Have a coupon?</h4>

                            {!appliedCoupon ? (

                                <div className="coupon-input-row">

                                    <input
                                        type="text"
                                        placeholder="Enter coupon code"
                                        value={couponCode}
                                        onChange={(e) =>
                                            setCouponCode(e.target.value.toUpperCase())
                                        }
                                        disabled={couponLoading}
                                    />

                                    <button
                                        type="button"
                                        onClick={handleApplyCoupon}
                                        disabled={couponLoading || !couponCode.trim()}
                                    >
                                        {couponLoading ? "Applying..." : "Apply"}
                                    </button>

                                </div>

                            ) : (

                                <div className="applied-coupon">

                                    <div>
                                        <strong>{appliedCoupon.code}</strong>
                                        <p>Coupon applied</p>
                                    </div>

                                    <button type="button" onClick={handleRemoveCoupon}>
                                        Remove
                                    </button>

                                </div>

                            )}

                        </div>


                        {/* SUBTOTAL */}

                        <div className="summary-row">
                            <span>Subtotal</span>
                            <span>₹ {subtotal}</span>
                        </div>


                        {/* COUPON DISCOUNT */}

                        {couponDiscount > 0 && (
                            <div className="summary-row summary-row-discount">
                                <span>Coupon discount</span>
                                <span>- ₹ {couponDiscount}</span>
                            </div>
                        )}


                        {/* SHIPPING */}

                        <div className="summary-row">
                            <span>Shipping</span>
                            <span>₹ {shippingCharge}</span>
                        </div>


                        {/* GST */}

                        <div className="summary-row">
                            <span>GST ({gst}%)</span>
                            <span>₹ {discountedGstAmount}</span>
                        </div>

                        <hr />


                        {/* GRAND TOTAL */}

                        <div className="summary-total">
                            <span>Grand total</span>
                            <span>₹ {grandTotal}</span>
                        </div>


                        {/* OUT OF STOCK WARNING */}

                        {hasOutOfStockItems && (
                            <div className="out-of-stock-warning">
                                Some items in your cart are out of stock. Please remove them to proceed to checkout.
                            </div>
                        )}


                        {/* CHECKOUT */}

                        <button
                            type="button"
                            className="checkout-btn"
                            disabled={hasOutOfStockItems}
                            onClick={handleProceedCheckout}
                        >
                            {
                                hasOutOfStockItems
                                    ? "Remove Out Of Stock Items"
                                    : "Proceed Checkout"
                            }
                        </button>

                    </div>

                </>

            )}

        </div>

    );

};


export default Cart;
