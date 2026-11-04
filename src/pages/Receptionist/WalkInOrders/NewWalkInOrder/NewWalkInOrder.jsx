import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./NewWalkInOrder.css";
import { toast } from "react-toastify";

import {
    getProducts,
    createWalkInOrder,
} from "../../../../services/walkInOrderService";

import WalkInInvoice from "../WalkInInvoice/WalkInInvoice";

import {
    createInvoice,
} from "../../../../services/invoiceService";

// =====================================================
// CUSTOMER SOURCE OPTIONS
// "How did you come to know about ZAID Infotech?"
// value = saved in database (must match backend keys)
// label = shown in the dropdown
// =====================================================

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

function NewWalkInOrder() {

    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);

    const [cart, setCart] = useState([]);
    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);
    const [placingOrder, setPlacingOrder] = useState(false);

    const [customer, setCustomer] = useState({
        fullName: "",
        phone: "",
        addressLine: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
        landmark: "",
    });

    const [paymentMethod, setPaymentMethod] = useState("CASH");
    const [invoiceData, setInvoiceData] = useState(null);

    // Customer source tracking (OPTIONAL)
    const [customerSource, setCustomerSource] = useState("");
    const [customerSourceOther, setCustomerSourceOther] = useState("");

    // =====================================================
    // PRODUCT TYPE CHECK
    // =====================================================

    const isWalkInProduct = (product) => {

        if (!product) {
            return false;
        }

        const productType = String(
            product.productType ??
            product.type ??
            product.product_type ??
            product.productCategoryType ??
            product.itemType ??
            ""
        )
            .trim()
            .toUpperCase();

        // NEW
        if (
            productType === "NEW" ||
            productType === "NEW_PRODUCT"
        ) {
            return true;
        }

        // REFURBISHED
        if (
            productType === "REFURBISHED" ||
            productType === "REFURBISH" ||
            productType === "REFURB" ||
            productType === "REFURBISHED_PRODUCT"
        ) {
            return true;
        }

        // RENTAL + everything else hidden
        return false;
    };

    // =====================================================
    // GET PRODUCT PRICE
    // =====================================================

    const getProductPrice = (product) => {

        if (!product) {
            return 0;
        }

        const possiblePrices = [

            product.pricing?.sellingPrice,
            product.pricing?.finalPrice,
            product.pricing?.retailPrice,
            product.pricing?.salePrice,
            product.pricing?.price,
            product.pricing?.amount,
            product.pricing?.selling_price,
            product.pricing?.final_price,
            product.pricing?.retail_price,
            product.pricing?.sale_price,

            product.sellingPrice,
            product.finalPrice,
            product.retailPrice,
            product.salePrice,
            product.price,
            product.amount,
            product.selling_price,
            product.final_price,
            product.retail_price,
            product.sale_price,

            product.product?.pricing?.sellingPrice,
            product.product?.pricing?.finalPrice,
            product.product?.pricing?.retailPrice,
            product.product?.sellingPrice,
            product.product?.finalPrice,
            product.product?.retailPrice,
            product.product?.price,

        ];

        for (const value of possiblePrices) {

            if (
                value !== undefined &&
                value !== null &&
                value !== "" &&
                !Number.isNaN(Number(value))
            ) {

                const numericValue = Number(value);

                if (numericValue >= 0) {
                    return numericValue;
                }
            }
        }

        return 0;
    };

    // =====================================================
    // LOAD PRODUCTS
    // =====================================================

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {

        try {

            setLoading(true);

            const data = await getProducts();

            const allProducts = Array.isArray(data)
                ? data
                : data?.products ||
                  data?.data ||
                  [];

            // ONLY NEW + REFURBISHED
            const walkInProducts = allProducts.filter(
                (product) => isWalkInProduct(product)
            );

            setProducts(walkInProducts);
            setFilteredProducts(walkInProducts);

        } catch (err) {

            console.error(
                "PRODUCT LOAD ERROR:",
                err
            );

            setProducts([]);
            setFilteredProducts([]);

            toast.error(
                err?.response?.data?.message ||
                "Unable to load products"
            );

        } finally {

            setLoading(false);

        }
    };

    // =====================================================
    // SEARCH PRODUCT
    // =====================================================

    useEffect(() => {

        const value = search
            .trim()
            .toLowerCase();

        if (!value) {

            setFilteredProducts(products);

            return;
        }

        const result = products.filter(
            (product) => {

                const name = String(
                    product.name || ""
                ).toLowerCase();

                const sku = String(
                    product.sku || ""
                ).toLowerCase();

                return (
                    name.includes(value) ||
                    sku.includes(value)
                );
            }
        );

        setFilteredProducts(result);

    }, [
        search,
        products
    ]);

    // =====================================================
    // ADD PRODUCT
    // =====================================================

    const addProduct = (product) => {

        if (!isWalkInProduct(product)) {

            toast.error(
                "Rental products cannot be added to Walk-In Order."
            );

            return;
        }

        const currentStock = Number(
            product.inventory?.currentStock ??
            product.currentStock ??
            product.availableStock ??
            product.stock ??
            0
        );

        const reservedStock = Number(
            product.inventory?.reservedStock ??
            product.reservedStock ??
            0
        );

        const availableStock = Math.max(
            currentStock - reservedStock,
            0
        );

        if (availableStock <= 0) {

            toast.error(
                "This product is out of stock."
            );

            return;
        }

        const sellingPrice =
            getProductPrice(product);

        const existingItem = cart.find(
            (item) =>
                item.product === product._id
        );

        if (existingItem) {

            if (
                existingItem.quantity >=
                availableStock
            ) {

                toast.error(
                    `Only ${availableStock} item(s) available.`
                );

                return;
            }

            setCart(
                cart.map(
                    (item) =>
                        item.product === product._id
                            ? {
                                ...item,
                                quantity:
                                    item.quantity + 1,
                            }
                            : item
                )
            );

            return;
        }

        setCart([
            ...cart,

            {
                product: product._id,

                title: product.name,

                sku: product.sku,

                quantity: 1,

                originalPrice:
                    sellingPrice,

                price:
                    sellingPrice,

                discountAmount: 0,

                imageUrl:
                    product.images?.[0]?.url || "",

                availableStock:
                    availableStock,
            },
        ]);
    };

    // =====================================================
    // INCREASE QUANTITY
    // =====================================================

    const increaseQty = (id) => {

        const cartItem = cart.find(
            (item) =>
                item.product === id
        );

        if (!cartItem) {
            return;
        }

        if (
            cartItem.quantity >=
            cartItem.availableStock
        ) {

            toast.error(
                `Only ${cartItem.availableStock} item(s) available.`
            );

            return;
        }

        setCart(
            cart.map(
                (item) =>
                    item.product === id
                        ? {
                            ...item,
                            quantity:
                                item.quantity + 1,
                        }
                        : item
            )
        );
    };

    // =====================================================
    // DECREASE QUANTITY
    // =====================================================

    const decreaseQty = (id) => {

        setCart(
            (currentCart) =>
                currentCart
                    .map(
                        (item) =>
                            item.product === id
                                ? {
                                    ...item,
                                    quantity:
                                        item.quantity - 1,
                                }
                                : item
                    )
                    .filter(
                        (item) =>
                            item.quantity > 0
                    )
        );
    };

    // =====================================================
    // REMOVE
    // =====================================================

    const removeItem = (id) => {

        setCart(
            (currentCart) =>
                currentCart.filter(
                    (item) =>
                        item.product !== id
                )
        );
    };

    // =====================================================
    // TOTAL
    // =====================================================

    const total = cart.reduce(
        (sum, item) =>
            sum +
            Number(item.price || 0) *
            Number(item.quantity || 0),
        0
    );

    // =====================================================
    // CUSTOMER INPUT
    // =====================================================

    const handleCustomerChange = (e) => {

        setCustomer({
            ...customer,
            [e.target.name]:
                e.target.value,
        });
    };

    // =====================================================
    // CUSTOMER SOURCE CHANGE
    // =====================================================

    const handleCustomerSourceChange = (e) => {

        const value = e.target.value;

        setCustomerSource(value);

        // clear old text when switching away from Other
        if (value !== "OTHER") {
            setCustomerSourceOther("");
        }
    };

    // =====================================================
    // CREATE WALK-IN ORDER + INVOICE
    // =====================================================

    const placeOrder = async () => {

        // VALIDATE CART
        if (cart.length === 0) {

            toast.error(
                "Please add at least one product"
            );

            return;
        }

        // VALIDATE CUSTOMER
        if (
            !customer.fullName ||
            !customer.phone
        ) {

            toast.error(
                "Customer Name and Phone are required"
            );

            return;
        }

        // NOTE: "How did you come to know about ZAID Infotech?"
        // is OPTIONAL, so there is intentionally no validation
        // for customerSource here.

        // CHECK STOCK
        for (const item of cart) {

            if (
                item.quantity >
                item.availableStock
            ) {

                toast.error(
                    `${item.title}: only ${item.availableStock} item(s) available`
                );

                return;
            }
        }

        // CHECK PRICE
        for (const item of cart) {

            if (
                Number(item.price || 0) <= 0
            ) {

                toast.error(
                    `${item.title}: Product price is missing or invalid.`
                );

                return;
            }
        }

        // PREPARE ORDER DATA
        const orderData = {

            orderItems:
                cart.map(
                    (item) => ({

                        product:
                            item.product,

                        title:
                            item.title,

                        quantity:
                            Number(
                                item.quantity
                            ),

                        originalPrice:
                            Number(
                                item.originalPrice ||
                                item.price ||
                                0
                            ),

                        price:
                            Number(
                                item.price ||
                                0
                            ),

                        discountAmount:
                            Number(
                                item.discountAmount ||
                                0
                            ),

                        imageUrl:
                            item.imageUrl ||
                            "",
                    })
                ),

            shippingAddress: {

                fullName:
                    customer.fullName,

                phone:
                    customer.phone,

                addressLine:
                    customer.addressLine ||
                    "Walk In Customer",

                city:
                    customer.city ||
                    "",

                state:
                    customer.state ||
                    "",

                pincode:
                    customer.pincode ||
                    "",

                country:
                    customer.country ||
                    "India",

                landmark:
                    customer.landmark ||
                    "",
            },

            totalAmount:
                Number(total),

            paymentMethod,

            orderSource:
                "WALK_IN",
        };

        // CUSTOMER SOURCE IS OPTIONAL
        // Only sent when the user actually selected something.
        if (customerSource) {

            orderData.customerSource =
                customerSource;

            if (
                customerSource === "OTHER" &&
                customerSourceOther.trim()
            ) {

                orderData.customerSourceOther =
                    customerSourceOther.trim();
            }
        }

        // CREATE ORDER
        try {

            setPlacingOrder(true);

            console.log(
                "WALK-IN ORDER DATA:",
                orderData
            );

            const res =
                await createWalkInOrder(
                    orderData
                );

            const createdOrder =
                res?.order ||
                res?.data?.order ||
                res?.data;

            const createdOrderId =
                createdOrder?._id ||
                createdOrder?.id;

            if (!createdOrderId) {

                console.error(
                    "Created order response does not contain order ID:",
                    res
                );

                throw new Error(
                    "Order created but Order ID was not returned."
                );
            }

            // CREATE INVOICE
            let createdInvoice = null;

            try {

                const invoiceResponse =
                    await createInvoice(
                        createdOrderId
                    );

                createdInvoice =
                    invoiceResponse?.data ||
                    invoiceResponse?.invoice ||
                    invoiceResponse;

            } catch (invoiceError) {

                // ORDER ALREADY CREATED.
                // DON'T BREAK WALK-IN FLOW.
                console.error(
                    "INVOICE CREATION ERROR:",
                    invoiceError
                );

                toast.success(
                    invoiceError?.response?.data?.message ||
                    invoiceError?.message ||
                    "Order created successfully, but invoice could not be created."
                );
            }

            // SHOW INVOICE
            if (createdInvoice) {

                setInvoiceData(
                    createdInvoice
                );

            } else {

                setInvoiceData(
                    createdOrder
                );
            }

            toast.success(
                "Walk-In Order Created Successfully"
            );

            // CLEAR CART
            setCart([]);

            // CLEAR CUSTOMER
            setCustomer({

                fullName: "",

                phone: "",

                addressLine: "",

                city: "",

                state: "",

                pincode: "",

                country: "India",

                landmark: "",
            });

            // CLEAR CUSTOMER SOURCE
            setCustomerSource("");
            setCustomerSourceOther("");

            // REFRESH PRODUCTS / INVENTORY
            await loadProducts();

        } catch (err) {

            console.error(
                "CREATE WALK-IN ORDER ERROR:",
                err
            );

            toast.error(
                err?.response?.data?.message ||
                err?.message ||
                "Unable to create order"
            );

        } finally {

            setPlacingOrder(false);

        }
    };

    // =====================================================
    // JSX
    // =====================================================

    return (

        <div className="walkin-page">

            {/* ==========================================
                LEFT SIDE
            ========================================== */}

            <div className="left-side">

                <h2>
                    Product Search
                </h2>

                <input
                    type="text"
                    placeholder="Search product by Name or SKU..."
                    value={search}
                    onChange={(e) =>
                        setSearch(
                            e.target.value
                        )
                    }
                    className="search-box"
                />

                {loading ? (

                    <p>
                        Loading products...
                    </p>

                ) : filteredProducts.length === 0 ? (

                    <p>
                        No products found
                    </p>

                ) : (

                    <div className="product-list">

                        {filteredProducts.map(
                            (product) => {

                                if (
                                    !isWalkInProduct(
                                        product
                                    )
                                ) {
                                    return null;
                                }

                                const currentStock =
                                    Number(
                                        product.inventory?.currentStock ??
                                        product.currentStock ??
                                        product.availableStock ??
                                        product.stock ??
                                        0
                                    );

                                const reservedStock =
                                    Number(
                                        product.inventory?.reservedStock ??
                                        product.reservedStock ??
                                        0
                                    );

                                const availableStock =
                                    Math.max(
                                        currentStock -
                                        reservedStock,
                                        0
                                    );

                                const sellingPrice =
                                    getProductPrice(
                                        product
                                    );

                                return (

                                    <div
                                        key={
                                            product._id
                                        }
                                        className="product-card"
                                    >

                                        <img
                                            src={
                                                product.images?.length
                                                    ? `${import.meta.env.VITE_API_URL.replace("/api", "")}${product.images[0].url}`
                                                    : "/no-image.png"
                                            }
                                            alt={
                                                product.name
                                            }
                                        />

                                        <h4>
                                            {
                                                product.name
                                            }
                                        </h4>

                                        <p>
                                            SKU:{" "}
                                            {
                                                product.sku
                                            }
                                        </p>

                                        <p>
                                            Type:{" "}
                                            {String(
                                                product.productType ??
                                                product.type ??
                                                product.product_type ??
                                                product.productCategoryType ??
                                                product.itemType ??
                                                ""
                                            ).toUpperCase()}
                                        </p>

                                        <p>
                                            Stock:{" "}
                                            {
                                                availableStock
                                            }
                                        </p>

                                        <h3>
                                            ₹{" "}
                                            {Number(
                                                sellingPrice
                                            ).toLocaleString(
                                                "en-IN"
                                            )}
                                        </h3>

                                        <button
                                            type="button"
                                            disabled={
                                                availableStock <= 0
                                            }
                                            onClick={() =>
                                                addProduct(
                                                    product
                                                )
                                            }
                                        >

                                            {availableStock <= 0
                                                ? "Out of Stock"
                                                : "+ Add"}

                                        </button>

                                    </div>
                                );
                            }
                        )}

                    </div>
                )}

            </div>

            {/* ==========================================
                RIGHT SIDE
            ========================================== */}

            <div className="right-side">

                <h2>
                    Cart
                </h2>

                {cart.length === 0 ? (

                    <p>
                        No Product Added
                    </p>

                ) : (

                    cart.map(
                        (item) => (

                            <div
                                className="cart-item"
                                key={
                                    item.product
                                }
                            >

                                <div>

                                    <h4>
                                        {
                                            item.title
                                        }
                                    </h4>

                                    <p>
                                        SKU:{" "}
                                        {
                                            item.sku
                                        }
                                    </p>

                                    <p>
                                        ₹{" "}
                                        {Number(
                                            item.price || 0
                                        ).toLocaleString(
                                            "en-IN"
                                        )}
                                    </p>

                                    <small>
                                        Available:{" "}
                                        {
                                            item.availableStock
                                        }
                                    </small>

                                </div>

                                <div className="qty-box">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            decreaseQty(
                                                item.product
                                            )
                                        }
                                    >
                                        -
                                    </button>

                                    <span>
                                        {
                                            item.quantity
                                        }
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            increaseQty(
                                                item.product
                                            )
                                        }
                                    >
                                        +
                                    </button>

                                </div>

                                <button
                                    type="button"
                                    className="remove-btn"
                                    onClick={() =>
                                        removeItem(
                                            item.product
                                        )
                                    }
                                >
                                    Remove
                                </button>

                            </div>
                        )
                    )
                )}

                <hr />

                <h3>
                    Grand Total: ₹{" "}
                    {Number(
                        total
                    ).toLocaleString(
                        "en-IN"
                    )}
                </h3>

                <hr />

                <h2>
                    Customer Details
                </h2>

                <input
                    type="text"
                    name="fullName"
                    placeholder="Customer Name"
                    value={
                        customer.fullName
                    }
                    onChange={
                        handleCustomerChange
                    }
                />

                <input
                    type="text"
                    name="phone"
                    placeholder="Phone Number"
                    value={
                        customer.phone
                    }
                    onChange={
                        handleCustomerChange
                    }
                />

                <input
                    type="text"
                    name="addressLine"
                    placeholder="Address"
                    value={
                        customer.addressLine
                    }
                    onChange={
                        handleCustomerChange
                    }
                />

                <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={
                        customer.city
                    }
                    onChange={
                        handleCustomerChange
                    }
                />

                <input
                    type="text"
                    name="state"
                    placeholder="State"
                    value={
                        customer.state
                    }
                    onChange={
                        handleCustomerChange
                    }
                />

                <input
                    type="text"
                    name="pincode"
                    placeholder="Pincode"
                    value={
                        customer.pincode
                    }
                    onChange={
                        handleCustomerChange
                    }
                />

                {/* ==========================================
                    CUSTOMER SOURCE (OPTIONAL)
                    How did you come to know about ZAID Infotech?
                ========================================== */}

                <label
                    htmlFor="walkInCustomerSource"
                    className="source-label"
                >
                    How did the customer come to know about ZAID Infotech?{" "}
                    <span className="optional-text">(Optional)</span>
                </label>

                <select
                    id="walkInCustomerSource"
                    value={customerSource}
                    onChange={
                        handleCustomerSourceChange
                    }
                >

                    <option value="">
                        Select an option
                    </option>

                    {CUSTOMER_SOURCE_OPTIONS.map(
                        (option) => (

                            <option
                                key={option.value}
                                value={option.value}
                            >
                                {option.label}
                            </option>

                        )
                    )}

                </select>

                {customerSource === "OTHER" && (

                    <input
                        type="text"
                        placeholder="Please specify (optional)"
                        value={
                            customerSourceOther
                        }
                        maxLength={200}
                        onChange={(e) =>
                            setCustomerSourceOther(
                                e.target.value
                            )
                        }
                    />

                )}

                {/* ==========================================
                    PAYMENT METHOD
                ========================================== */}

                <select
                    value={
                        paymentMethod
                    }
                    onChange={(e) =>
                        setPaymentMethod(
                            e.target.value
                        )
                    }
                >

                    <option value="CASH">
                        Cash
                    </option>

                    <option value="CARD">
                        Card
                    </option>

                    <option value="UPI">
                        UPI
                    </option>

                </select>

                <button
                    type="button"
                    className="place-order-btn"
                    disabled={
                        placingOrder ||
                        cart.length === 0
                    }
                    onClick={
                        placeOrder
                    }
                >

                    {placingOrder
                        ? "Creating Order..."
                        : "Create Walk-In Order"}

                </button>

            </div>

            {/* ==========================================
                INVOICE
            ========================================== */}

            {invoiceData && (

                <WalkInInvoice
                    order={
                        invoiceData
                    }
                    onClose={() =>
                        setInvoiceData(
                            null
                        )
                    }
                />

            )}

        </div>
    );
}

export default NewWalkInOrder;
