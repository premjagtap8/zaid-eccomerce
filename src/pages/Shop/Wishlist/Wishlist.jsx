import React, {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  FaTrashAlt,
  FaShoppingCart,
} from "react-icons/fa";

import {
  toast,
} from "react-toastify";

import "./Wishlist.css";

// =====================================================
// SERVICES
// =====================================================

import {
  getWishlist,
  removeFromWishlist,
} from "../../../services/wishlistService";

import {
  addToCart,
} from "../../../services/cartService";

import {
  getProduct,
} from "../../../services/productService";

// =====================================================
// API
// =====================================================

const API_URL = import.meta.env.VITE_API_URL;

const BASE_URL =
  API_URL.replace(/\/api\/?$/, "");

// =====================================================
// GET ID
// =====================================================

const getProductId = (product) => {
  if (!product) {
    return null;
  }

  // String ID
  if (typeof product === "string") {
    return product;
  }

  // Object ID
  return (
    product?._id ||
    product?.id ||
    product?.productId ||
    null
  );
};

// =====================================================
// GET WISHLIST PRODUCT
// =====================================================

const getWishlistProductValue = (item) => {
  if (!item) {
    return null;
  }

  // -----------------------------------------------
  // item.product
  // -----------------------------------------------

  if (item.product) {
    return item.product;
  }

  // -----------------------------------------------
  // item.productId
  // -----------------------------------------------

  if (item.productId) {
    return item.productId;
  }

  // -----------------------------------------------
  // Direct product object
  // -----------------------------------------------

  if (
    item._id ||
    item.id
  ) {
    return item;
  }

  return null;
};

// =====================================================
// IMAGE URL
// =====================================================

const getImageUrl = (product) => {
  if (!product) {
    return "/no-image.png";
  }

  const images =
    product?.images;

  if (
    !Array.isArray(images) ||
    images.length === 0
  ) {
    return "/no-image.png";
  }

  const image =
    images[0];

  // -----------------------------------------------
  // Object image
  // -----------------------------------------------

  if (
    image &&
    typeof image === "object"
  ) {
    const url =
      image?.url ||
      image?.path ||
      image?.src;

    if (!url) {
      return "/no-image.png";
    }

    if (
      String(url).startsWith("http")
    ) {
      return url;
    }

    return `${BASE_URL}${
      String(url).startsWith("/")
        ? ""
        : "/"
    }${url}`;
  }

  // -----------------------------------------------
  // String image
  // -----------------------------------------------

  if (
    typeof image === "string"
  ) {
    if (
      image.startsWith("http")
    ) {
      return image;
    }

    return `${BASE_URL}${
      image.startsWith("/")
        ? ""
        : "/"
    }${image}`;
  }

  return "/no-image.png";
};

// =====================================================
// PRICE
// =====================================================

const getProductPrice = (product) => {
  if (!product) {
    return 0;
  }

  const price =
    product?.finalPrice ??
    product?.pricing?.sellingPrice ??
    product?.pricing?.price ??
    product?.sellingPrice ??
    product?.price ??
    0;

  const numberPrice =
    Number(price);

  return Number.isFinite(
    numberPrice
  )
    ? numberPrice
    : 0;
};

// =====================================================
// PRODUCT NAME
// =====================================================

const getProductName = (product) => {
  return (
    product?.name ||
    product?.title ||
    product?.productName ||
    "Product"
  );
};

// =====================================================
// WISHLIST
// =====================================================

const Wishlist = () => {

  // ===================================================
  // STATE
  // ===================================================

  const [
    wishlist,
    setWishlist,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  // ===================================================
  // LOAD WISHLIST
  // ===================================================

  useEffect(() => {
    loadWishlist();
  }, []);

  // ===================================================
  // LOAD WISHLIST
  // ===================================================

  const loadWishlist = async () => {

    try {

      setLoading(true);

      const res =
        await getWishlist();

      console.log(
        "========================================"
      );

      console.log(
        "WISHLIST FULL RESPONSE:",
        res?.data
      );

      console.log(
        "WISHLIST PRODUCTS:",
        res?.data?.wishlist?.products
      );

      console.log(
        "========================================"
      );

      // =================================================
      // GET RAW WISHLIST ITEMS
      // =================================================

      let wishlistItems = [];

      if (
        Array.isArray(
          res?.data?.wishlist?.products
        )
      ) {

        wishlistItems =
          res.data.wishlist.products;

      } else if (
        Array.isArray(
          res?.data?.products
        )
      ) {

        wishlistItems =
          res.data.products;

      } else if (
        Array.isArray(
          res?.data?.data
        )
      ) {

        wishlistItems =
          res.data.data;

      } else if (
        Array.isArray(
          res?.data
        )
      ) {

        wishlistItems =
          res.data;

      }

      console.log(
        "RAW WISHLIST ITEMS:",
        wishlistItems
      );

      // =================================================
      // LOAD COMPLETE PRODUCT DETAILS
      // =================================================

      const normalizedProducts =
        await Promise.all(

          wishlistItems.map(
            async (item) => {

              try {

                const rawProduct =
                  getWishlistProductValue(
                    item
                  );

                // ---------------------------------------
                // Product ID
                // ---------------------------------------

                const productId =
                  getProductId(
                    rawProduct
                  );

                if (!productId) {

                  console.warn(
                    "Wishlist product ID missing:",
                    item
                  );

                  return null;
                }

                // ---------------------------------------
                // Already populated product
                // ---------------------------------------

                if (
                  typeof rawProduct ===
                    "object" &&
                  (
                    rawProduct?.name ||
                    rawProduct?.title ||
                    rawProduct?.images ||
                    rawProduct?.pricing
                  )
                ) {

                  console.log(
                    "POPULATED PRODUCT:",
                    rawProduct
                  );

                  return {
                    wishlistItem: item,
                    product:
                      rawProduct,
                    productId,
                  };
                }

                // ---------------------------------------
                // Product only ID
                //
                // Fetch complete product
                // ---------------------------------------

                console.log(
                  "FETCHING PRODUCT DETAILS:",
                  productId
                );

                const productResponse =
                  await getProduct(
                    productId
                  );

                console.log(
                  "PRODUCT DETAILS RESPONSE:",
                  productResponse?.data
                );

                // ---------------------------------------
                // Handle different response formats
                // ---------------------------------------

                const productData =
                  productResponse?.data;

                const product =
                  productData?.product ||
                  productData?.data ||
                  productData;

                if (!product) {

                  console.warn(
                    "Product details not found:",
                    productId
                  );

                  return null;
                }

                return {
                  wishlistItem: item,
                  product,
                  productId,
                };

              } catch (productError) {

                console.error(
                  "FAILED TO LOAD WISHLIST PRODUCT:",
                  productError
                );

                console.error(
                  "PRODUCT ID:",
                  getProductId(
                    getWishlistProductValue(
                      item
                    )
                  )
                );

                return null;
              }
            }
          )
        );

      // =================================================
      // REMOVE INVALID ITEMS
      // =================================================

      const validProducts =
        normalizedProducts.filter(
          Boolean
        );

      console.log(
        "FINAL WISHLIST PRODUCTS:",
        validProducts
      );

      // =================================================
      // SET STATE
      // =================================================

      setWishlist(
        validProducts
      );

    } catch (error) {

      console.error(
        "WISHLIST ERROR:",
        error
      );

      console.error(
        "WISHLIST ERROR RESPONSE:",
        error?.response?.data
      );

      toast.error(
        error?.response?.data?.message ||
        "Failed to load wishlist"
      );

      setWishlist([]);

    } finally {

      setLoading(false);

    }
  };

  // ===================================================
  // REMOVE FROM WISHLIST
  // ===================================================

  const handleRemove = async (
    productId
  ) => {

    if (!productId) {

      toast.error(
        "Product ID not found"
      );

      return;
    }

    try {

      console.log(
        "REMOVING WISHLIST PRODUCT:",
        productId
      );

      await removeFromWishlist(
        productId
      );

      toast.success(
        "Removed from Wishlist"
      );

      // -----------------------------------------------
      // Immediately update UI
      // -----------------------------------------------

      setWishlist(
        (previous) =>
          previous.filter(
            (item) =>
              String(
                item.productId
              ) !==
              String(
                productId
              )
          )
      );

    } catch (error) {

      console.error(
        "REMOVE WISHLIST ERROR:",
        error
      );

      console.error(
        "REMOVE RESPONSE:",
        error?.response?.data
      );

      toast.error(
        error?.response?.data?.message ||
        "Failed to remove from wishlist"
      );
    }
  };

  // ===================================================
  // ADD TO CART
  // ===================================================

  const handleAddToCart = async (
    productId
  ) => {

    if (!productId) {

      toast.error(
        "Product is unavailable"
      );

      return;
    }

    try {

      console.log(
        "ADDING WISHLIST PRODUCT TO CART:",
        productId
      );

      await addToCart({
        product:
          productId,
        quantity: 1,
      });

      toast.success(
        "Added To Cart"
      );

    } catch (error) {

      console.error(
        "ADD TO CART ERROR:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
        "Failed to add to cart"
      );
    }
  };

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {

    return (
      <div className="wishlist-page">

        <div className="loading">

          Loading Wishlist...

        </div>

      </div>
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (

    <div className="wishlist-page">

      {/* =============================================
          HEADER
      ============================================= */}

      <div className="wishlist-header">

        <div>

          <h2>
            My <span>Wishlist</span>
          </h2>

          <span className="wishlist-count">

            {wishlist.length}{" "}

            {wishlist.length === 1
              ? "Item"
              : "Items"}{" "}

            Saved

          </span>

        </div>

      </div>

      {/* =============================================
          EMPTY
      ============================================= */}

      {wishlist.length === 0 ? (

        <div className="empty-wishlist">

          <h3>
            Wishlist Is Empty
          </h3>

          <p>
            Explore our store and save your
            favorite items for later.
          </p>

          <Link
            to="/shop"
            className="shop-btn"
          >
            Continue Shopping
          </Link>

        </div>

      ) : (

        <div className="wishlist-grid">

          {wishlist.map(
            ({
              product,
              productId,
            }) => {

              // ---------------------------------------
              // PRODUCT DATA
              // ---------------------------------------

              const productName =
                getProductName(
                  product
                );

              const price =
                getProductPrice(
                  product
                );

              const imageUrl =
                getImageUrl(
                  product
                );

              console.log(
                "RENDER WISHLIST PRODUCT:",
                {
                  productId,
                  productName,
                  price,
                  imageUrl,
                  product,
                }
              );

              return (

                <div
                  className="wishlist-card"
                  key={productId}
                >

                  {/* =================================
                      REMOVE
                  ================================= */}

                  <button
                    type="button"
                    className="quick-remove-btn"
                    title="Remove item"
                    aria-label="Remove from wishlist"
                    onClick={() =>
                      handleRemove(
                        productId
                      )
                    }
                  >

                    <FaTrashAlt />

                  </button>

                  {/* =================================
                      IMAGE
                  ================================= */}

                  <Link
                    to={`/product/${productId}`}
                    className="card-image-box"
                  >

                    <img
                      src={imageUrl}
                      alt={productName}
                      loading="lazy"
                      onError={(e) => {

                        console.warn(
                          "IMAGE FAILED:",
                          imageUrl
                        );

                        if (
                          !e.currentTarget.dataset
                            .fallback
                        ) {

                          e.currentTarget.dataset
                            .fallback =
                            "true";

                          e.currentTarget.src =
                            "/no-image.png";
                        }

                      }}
                    />

                  </Link>

                  {/* =================================
                      DETAILS
                  ================================= */}

                  <div className="card-details">

                    <Link
                      to={`/product/${productId}`}
                    >

                      <h3>
                        {productName}
                      </h3>

                    </Link>

                    <div className="price-tag">

                      ₹{" "}

                      {price.toLocaleString(
                        "en-IN"
                      )}

                    </div>

                  </div>

                  {/* =================================
                      CART
                  ================================= */}

                  <div className="wishlist-buttons">

                    <button
                      type="button"
                      className="add-cart-btn"
                      onClick={() =>
                        handleAddToCart(
                          productId
                        )
                      }
                    >

                      <FaShoppingCart />

                      <span>
                        Add To Cart
                      </span>

                    </button>

                  </div>

                </div>

              );
            }
          )}

        </div>

      )}

    </div>

  );
};

export default Wishlist;
