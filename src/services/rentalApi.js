import axios from "axios";

/* =========================================================
   BASE URL
========================================================= */

const API_URL = import.meta.env.VITE_API_URL;

const RENTAL_BASE_URL = `${API_URL}/rentals`;

/* =========================================================
   TOKEN
========================================================= */

const getToken = () => {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        ""
    );
};

/* =========================================================
   AXIOS INSTANCE
========================================================= */

const rentalAxios = axios.create({
    baseURL: RENTAL_BASE_URL,
});

/* =========================================================
   REQUEST INTERCEPTOR
========================================================= */

rentalAxios.interceptors.request.use(
    (config) => {
        const token = getToken();

        config.headers = config.headers || {};

        if (token) {
            config.headers.Authorization =
                `Bearer ${token}`;
        }

        /*
         * IMPORTANT:
         *
         * FormData ke saath Content-Type manually set
         * nahi karna hai.
         *
         * Browser/Axios automatically:
         *
         * multipart/form-data; boundary=...
         *
         * set karega.
         */

        if (config.data instanceof FormData) {
            delete config.headers["Content-Type"];
            delete config.headers["content-type"];
        }

        return config;
    },

    (error) => {
        return Promise.reject(error);
    }
);

/* =========================================================
   ERROR HANDLER
========================================================= */


/* =========================================================
   RENTAL API ERROR HANDLER
========================================================= */

const handleError = (error) => {
  const backendError = error?.response?.data;

  const message =
    backendError?.message ||
    backendError?.error?.message ||
    backendError?.error ||
    error?.message ||
    "Rental API request failed";

  console.group("RENTAL API ERROR");

  console.error("URL:", error?.config?.url);
  console.error("METHOD:", error?.config?.method);
  console.error("STATUS:", error?.response?.status);
  console.error("MESSAGE:", message);
  console.error("BACKEND RESPONSE:", backendError);

  if (backendError?.errors) {
    console.error(
      "VALIDATION ERRORS:",
      backendError.errors
    );
  }

  if (error?.config?.data) {
    try {
      console.log(
        "REQUEST PAYLOAD:",
        JSON.parse(error.config.data)
      );
    } catch {
      console.log(
        "REQUEST PAYLOAD:",
        error.config.data
      );
    }
  }

  console.groupEnd();

  const normalizedMessage =
    typeof message === "string"
      ? message
      : JSON.stringify(message);

  throw {
    ...(backendError &&
    typeof backendError === "object"
      ? backendError
      : {}),
    success: false,
    status: error?.response?.status,
    message: normalizedMessage,
  };
};


/* =========================================================
   RENTAL PRODUCTS
========================================================= */

/**
 * GET
 * /api/rentals/products
 *
 * Used by WalkInRental.jsx
 */

export const getRentalProducts = async () => {
    try {
        const response =
            await rentalAxios.get(
                "/products"
            );

        console.log(
            "RENTAL PRODUCTS RESPONSE:",
            response.data
        );

        return response.data;
    } catch (error) {
        return handleError(error);
    }
};

/**
 * GET
 * /api/rentals/product/:productId
 */

export const getRentalProduct = async (
    productId
) => {
    try {
        if (!productId) {
            throw new Error(
                "Product ID is required"
            );
        }

        const response =
            await rentalAxios.get(
                `/product/${productId}`
            );

        return response.data;
    } catch (error) {
        return handleError(error);
    }
};

/**
 * PUT
 * /api/rentals/product/:productId
 */

export const saveRentalProduct =
    async (
        productId,
        rentalData
    ) => {
        try {
            if (!productId) {
                throw new Error(
                    "Product ID is required"
                );
            }

            const response =
                await rentalAxios.put(
                    `/product/${productId}`,
                    rentalData
                );

            return response.data;
        } catch (error) {
            return handleError(error);
        }
    };

/* =========================================================
   ONLINE RENTAL
========================================================= */

/**
 * POST
 * /api/rentals
 */

export const createRentalRequest = async (
    rentalData
) => {
    try {
        if (!rentalData) {
            throw new Error(
                "Rental data is required"
            );
        }

        const response =
            await rentalAxios.post(
                "/",
                rentalData
            );

        return response.data;
    } catch (error) {
        return handleError(error);
    }
};

/* =========================================================
   WALK-IN RENTAL
========================================================= */

/**
 * POST
 * /api/rentals/walk-in
 *
 * Used by WalkInRental.jsx
 */

/* =========================================================
   CREATE WALK-IN RENTAL
   POST /api/rentals/walk-in
========================================================= */

export const createWalkInRentalRequest = async (
  rentalData
) => {
  try {
    if (
      !rentalData ||
      typeof rentalData !== "object" ||
      Array.isArray(rentalData)
    ) {
      throw new Error(
        "Valid walk-in rental data is required"
      );
    }

    const payload = {
      ...rentalData,
      rentalSource: "WALK_IN",
    };

    // -------------------------------------------------------
    // NORMALIZE BILLING TYPE
    // -------------------------------------------------------

    const normalizeBillingType = (value) => {
      const type = String(value || "")
        .trim()
        .toUpperCase()
        .replace(/[\s-]+/g, "_");

      if (
        [
          "NON_GST",
          "NONGST",
          "WITHOUT_GST",
          "NO_GST",
        ].includes(type)
      ) {
        return "NON_GST";
      }

      if (type === "GST") {
        return "GST";
      }

      return "";
    };

    const topLevelBillingType =
      normalizeBillingType(
        rentalData.billingType
      );

    if (
      rentalData.billingType &&
      !topLevelBillingType
    ) {
      throw new Error(
        "Invalid billing type. Use GST or NON_GST."
      );
    }

    if (topLevelBillingType) {
      payload.billingType = topLevelBillingType;
    }

    // -------------------------------------------------------
    // PRESERVE PER-PRODUCT PRICING
    // -------------------------------------------------------

    const pricingByProduct =
      rentalData.pricingByProduct &&
      typeof rentalData.pricingByProduct === "object" &&
      !Array.isArray(rentalData.pricingByProduct)
        ? rentalData.pricingByProduct
        : {};

    const normalizedPricing = {};

    for (const [
      productId,
      pricing,
    ] of Object.entries(pricingByProduct)) {
      const item =
        pricing &&
        typeof pricing === "object" &&
        !Array.isArray(pricing)
          ? { ...pricing }
          : {};

      const itemBillingType =
        normalizeBillingType(
          item.billingType ||
          item.billingMode
        );

      if (
        (item.billingType || item.billingMode) &&
        !itemBillingType
      ) {
        throw new Error(
          `Invalid billing type for product ${productId}`
        );
      }

      if (itemBillingType) {
        item.billingType = itemBillingType;
      } else if (topLevelBillingType) {
        item.billingType = topLevelBillingType;
      }

      normalizedPricing[productId] = item;
    }

    payload.pricingByProduct =
      normalizedPricing;

    // -------------------------------------------------------
    // DEBUG LOGGING
    // -------------------------------------------------------

    console.group("CREATE WALK-IN RENTAL");

    console.log(
      "URL:",
      `${RENTAL_BASE_URL}/walk-in`
    );

    console.log(
      "Customer Type:",
      payload.customerType
    );

    console.log(
      "Rental Duration:",
      payload.rentalDuration
    );

    console.log(
      "Duration Type:",
      payload.rentalDurationType
    );

    console.log(
      "Top-Level Billing Type:",
      payload.billingType
    );

    console.log(
      "Pricing By Product:",
      payload.pricingByProduct
    );

    console.log(
      "Full Payload:",
      payload
    );

    console.log(
      "Payload JSON:",
      JSON.stringify(payload, null, 2)
    );

    console.groupEnd();

    // -------------------------------------------------------
    // API REQUEST
    // -------------------------------------------------------

    const response = await rentalAxios.post(
      "/walk-in",
      payload
    );

    console.log(
      "WALK-IN RENTAL CREATED:",
      response.data
    );

    return response.data;
  } catch (error) {
    if (error?.response) {
      return handleError(error);
    }

    console.error(
      "WALK-IN RENTAL ERROR:",
      error
    );

    throw error;
  }
};


/* =========================================================
   MY RENTALS
========================================================= */

/**
 * GET
 * /api/rentals/my
 */

export const getMyRentals = async () => {
    try {
        const response =
            await rentalAxios.get(
                "/my"
            );

        return response.data;
    } catch (error) {
        return handleError(error);
    }
};

/* =========================================================
   GET SINGLE RENTAL
========================================================= */

/**
 * GET
 * /api/rentals/:id
 */

export const getRentalById = async (
    rentalId
) => {
    try {
        if (!rentalId) {
            throw new Error(
                "Rental ID is required"
            );
        }

        const response =
            await rentalAxios.get(
                `/${rentalId}`
            );

        console.log(
            "RENTAL DETAILS:",
            response.data
        );

        return response.data;
    } catch (error) {
        return handleError(error);
    }
};

/* =========================================================
   ALL RENTALS
========================================================= */

/**
 * GET
 * /api/rentals
 *
 * Used by WalkInRentalOrders.jsx
 */

export const getAllRentals = async () => {
    try {
        console.log(
            "GETTING ALL RENTALS..."
        );

        const response =
            await rentalAxios.get(
                "/"
            );

        console.log(
            "ALL RENTALS RESPONSE:",
            response.data
        );

        return response.data;
    } catch (error) {
        return handleError(error);
    }
};

/* =========================================================
   APPROVE RENTAL
========================================================= */

/**
 * PATCH
 * /api/rentals/:id/approve
 */

export const approveRental = async (
    rentalId
) => {
    try {
        if (!rentalId) {
            throw new Error(
                "Rental ID is required"
            );
        }

        const response =
            await rentalAxios.patch(
                `/${rentalId}/approve`
            );

        return response.data;
    } catch (error) {
        return handleError(error);
    }
};

/* =========================================================
   REJECT RENTAL
========================================================= */

/**
 * PATCH
 * /api/rentals/:id/reject
 */

export const rejectRental = async (
    rentalId,
    reason = ""
) => {
    try {
        if (!rentalId) {
            throw new Error(
                "Rental ID is required"
            );
        }

        const response =
            await rentalAxios.patch(
                `/${rentalId}/reject`,
                {
                    reason,
                }
            );

        return response.data;
    } catch (error) {
        return handleError(error);
    }
};

/* =========================================================
   SECURITY DEPOSIT
========================================================= */

/**
 * PATCH
 * /api/rentals/:id/deposit-received
 *
 * Backend expected body:
 *
 * {
 *     paymentMethod: "CASH"
 * }
 */

export const markDepositReceived =
    async (
        rentalId,
        paymentMethod = "CASH"
    ) => {
        try {
            if (!rentalId) {
                throw new Error(
                    "Rental ID is required"
                );
            }

            const payload = {
                paymentMethod:
                    paymentMethod || "CASH",
            };

            console.log(
                "================================"
            );

            console.log(
                "MARKING DEPOSIT RECEIVED"
            );

            console.log(
                "Rental ID:",
                rentalId
            );

            console.log(
                "Payment Method:",
                payload.paymentMethod
            );

            console.log(
                "URL:",
                `${RENTAL_BASE_URL}/${rentalId}/deposit-received`
            );

            console.log(
                "================================"
            );

            const response =
                await rentalAxios.patch(
                    `/${rentalId}/deposit-received`,
                    payload
                );

            console.log(
                "DEPOSIT RECEIVED RESPONSE:",
                response.data
            );

            return response.data;
        } catch (error) {
            return handleError(error);
        }
    };

/* =========================================================
   ALLOCATE RENTAL
========================================================= */

/**
 * PATCH
 * /api/rentals/:id/allocate
 */

export const allocateRental = async (
    rentalId
) => {
    try {
        if (!rentalId) {
            throw new Error(
                "Rental ID is required"
            );
        }

        const response =
            await rentalAxios.patch(
                `/${rentalId}/allocate`
            );

        return response.data;
    } catch (error) {
        return handleError(error);
    }
};

/* =========================================================
   SEARCH RENTALS FOR RETURN
========================================================= */

/**
 * GET
 * /api/rentals/return/search
 *
 * IMPORTANT:
 * This must come BEFORE /:id on backend routing,
 * otherwise "return" can be treated as an ID.
 */

export const searchRentalsForReturn =
    async (
        search
    ) => {
        try {
            if (!search) {
                throw new Error(
                    "Search value is required"
                );
            }

            console.log(
                "SEARCH RENTALS FOR RETURN:",
                search
            );

            const response =
                await rentalAxios.get(
                    "/return/search",
                    {
                        params: {
                            search,
                        },
                    }
                );

            console.log(
                "RETURN SEARCH RESPONSE:",
                response.data
            );

            return response.data;
        } catch (error) {
            return handleError(error);
        }
    };

/* =========================================================
   RETURN RENTAL
========================================================= */

/**
 * PATCH
 * /api/rentals/:id/return
 */

export const markRentalReturned =
    async (
        rentalId,
        returnData = {}
    ) => {
        try {
            if (!rentalId) {
                throw new Error(
                    "Rental ID is required"
                );
            }

            const payload = {
                returnCondition:
                    returnData.returnCondition ||
                    "GOOD",

                damageCharges:
                    Number(
                        returnData.damageCharges ||
                        0
                    ),

                otherDeductions:
                    Number(
                        returnData.otherDeductions ||
                        0
                    ),
            };

            console.log(
                "================================"
            );

            console.log(
                "RETURN RENTAL"
            );

            console.log(
                "Rental ID:",
                rentalId
            );

            console.log(
                "RETURN RENTAL PAYLOAD:",
                payload
            );

            console.log(
                "================================"
            );

            const response =
                await rentalAxios.patch(
                    `/${rentalId}/return`,
                    payload
                );

            console.log(
                "RETURN RENTAL RESPONSE:",
                response.data
            );

            return response.data;
        } catch (error) {
            return handleError(error);
        }
    };

/* =========================================================
   COMPLETE RENTAL SETTLEMENT
========================================================= */

/**
 * PATCH
 * /api/rentals/:id/settle
 */

export const completeRentalSettlement =
    async (
        rentalId,
        data = {}
    ) => {
        try {
            if (!rentalId) {
                throw new Error(
                    "Rental ID is required"
                );
            }

            console.log(
                "================================"
            );

            console.log(
                "COMPLETE RENTAL SETTLEMENT"
            );

            console.log(
                "Rental ID:",
                rentalId
            );

            console.log(
                "SETTLEMENT DATA:",
                data
            );

            console.log(
                "================================"
            );

            const response =
                await rentalAxios.patch(
                    `/${rentalId}/settle`,
                    data
                );

            console.log(
                "SETTLEMENT RESPONSE:",
                response.data
            );

            return response.data;
        } catch (error) {
            return handleError(error);
        }
    };

/* =========================================================
   RENTAL INVENTORY
========================================================= */

/**
 * GET
 * /api/rentals/inventory
 */

export const getRentalInventory =
    async () => {
        try {
            const response =
                await rentalAxios.get(
                    "/inventory"
                );

            return response.data;
        } catch (error) {
            return handleError(error);
        }
    };

/* =========================================================
   RENTAL DOCUMENT UPLOAD
========================================================= */

/**
 * POST
 * /api/rentals/:rentalId/documents
 *
 * Backend:
 *
 * rentalDocumentUpload.single("document")
 */

// export const uploadRentalDocument =
//     async (
//         rentalId,
//         documentType,
//         file
//     ) => {
//         try {
//             if (!rentalId) {
//                 throw new Error(
//                     "Rental ID is required"
//                 );
//             }

//             if (!documentType) {
//                 throw new Error(
//                     "Document type is required"
//                 );
//             }

//             if (!file) {
//                 throw new Error(
//                     "Document file is required"
//                 );
//             }

//             const formData =
//                 new FormData();

//             formData.append(
//                 "documentType",
//                 String(documentType)
//                     .trim()
//                     .toUpperCase()
//             );

//             formData.append(
//                 "document",
//                 file,
//                 file.name
//             );

//             console.log(
//                 "================================"
//             );

//             console.log(
//                 "UPLOADING RENTAL DOCUMENT"
//             );

//             console.log(
//                 "Rental ID:",
//                 rentalId
//             );

//             console.log(
//                 "Document Type:",
//                 documentType
//             );

//             console.log(
//                 "File:",
//                 file.name
//             );

//             console.log(
//                 "File Type:",
//                 file.type
//             );

//             console.log(
//                 "File Size:",
//                 file.size
//             );

//             console.log(
//                 "================================"
//             );

//             for (
//                 const [
//                     key,
//                     value
//                 ]
//                 of formData.entries()
//             ) {
//                 if (
//                     typeof File !==
//                         "undefined" &&
//                     value instanceof File
//                 ) {
//                     console.log(
//                         "FORM DATA:",
//                         key,
//                         "=> FILE",
//                         value.name,
//                         value.type,
//                         value.size
//                     );
//                 } else {
//                     console.log(
//                         "FORM DATA:",
//                         key,
//                         "=>",
//                         value
//                     );
//                 }
//             }

//             const response =
//                 await rentalAxios.post(
//                     `/${rentalId}/documents`,
//                     formData
//                 );

//             console.log(
//                 "================================"
//             );

//             console.log(
//                 "RENTAL DOCUMENT UPLOAD RESPONSE:",
//                 response.data
//             );

//             console.log(
//                 "================================"
//             );

//             return response.data;
//         } catch (error) {
//             console.error(
//                 "================================"
//             );

//             console.error(
//                 "RENTAL DOCUMENT UPLOAD ERROR"
//             );

//             console.error(
//                 "Status:",
//                 error?.response?.status
//             );

//             console.error(
//                 "Response:",
//                 error?.response?.data
//             );

//             console.error(
//                 "Message:",
//                 error?.message
//             );

//             console.error(
//                 "================================"
//             );

//             throw (
//                 error?.response?.data || {
//                     success: false,
//                     message:
//                         error?.message ||
//                         "Rental document upload failed",
//                 }
//             );
//         }
//     };


// export const uploadRentalDocument = async (rentalId, formData) => {
//     try {
//         if (!rentalId) {
//             throw new Error("Rental ID is required");
//         }

//         if (!(formData instanceof FormData)) {
//             throw new Error("Document upload requires FormData");
//         }

//         const file = formData.get("document");
//         const documentType = formData.get("documentType");

//         if (!(file instanceof File)) {
//             throw new Error(
//                 'Document file missing. FormData field must be "document".'
//             );
//         }

//         if (!documentType) {
//             throw new Error("Document type is required");
//         }

//         console.log("UPLOADING RENTAL DOCUMENT", {
//             rentalId,
//             documentType,
//             fileName: file.name,
//             fileType: file.type,
//             fileSize: file.size,
//         });

//         const response = await rentalAxios.post(
//             `/${rentalId}/documents`,
//             formData
//         );

//         console.log("DOCUMENT UPLOAD SUCCESS:", response.data);

//         return response.data;
//     } catch (error) {
//         console.error(
//             "DOCUMENT UPLOAD FAILED:",
//             error?.response?.status,
//             error?.response?.data || error.message
//         );

//         throw error;
//     }
// };



/* =========================================================
   RENTAL DOCUMENT UPLOAD
   POST /api/rentals/:rentalId/documents
========================================================= */

export const uploadRentalDocument = async (
  rentalId,
  documentType,
  file
) => {
  if (!rentalId) {
    throw new Error("Rental ID is required");
  }

  if (!documentType) {
    throw new Error("Document type is required");
  }

  if (!(file instanceof File)) {
    throw new Error("Please select a valid document file");
  }

  const formData = new FormData();

  formData.append("document", file);
  formData.append("documentType", documentType);

  console.log("UPLOADING RENTAL DOCUMENT:", {
    rentalId,
    documentType,
    fileName: file.name,
    fileSize: file.size,
  });

  try {
    const response = await rentalAxios.post(
      `/${rentalId}/documents`,
      formData
    );

    console.log(
      "RENTAL DOCUMENT UPLOAD RESPONSE:",
      response.data
    );

    return response.data;
  } catch (error) {
    console.error(
      "RENTAL DOCUMENT UPLOAD ERROR:",
      error.response?.data || error.message
    );

    throw error;
  }
};


/* =========================================================
   GET RENTAL DOCUMENTS
========================================================= */

/**
 * GET
 * /api/rentals/:rentalId/documents
 */

export const getRentalDocuments =
    async (
        rentalId
    ) => {
        try {
            if (!rentalId) {
                throw new Error(
                    "Rental ID is required"
                );
            }

            console.log(
                "GETTING RENTAL DOCUMENTS:",
                rentalId
            );

            const response =
                await rentalAxios.get(
                    `/${rentalId}/documents`
                );

            console.log(
                "RENTAL DOCUMENTS RESPONSE:",
                response.data
            );

            return response.data;
        } catch (error) {
            return handleError(error);
        }
    };

/* =========================================================
   VERIFY RENTAL DOCUMENT
========================================================= */

/**
 * PATCH
 * /api/rentals/documents/:documentId/verify
 *
 * Approved:
 *
 * {
 *     verificationStatus: "APPROVED"
 * }
 *
 * Rejected:
 *
 * {
 *     verificationStatus: "REJECTED",
 *     rejectionReason: "Invalid document"
 * }
 */

export const verifyRentalDocument =
    async (
        documentId,
        verificationData = {}
    ) => {
        try {
            if (!documentId) {
                throw new Error(
                    "Document ID is required"
                );
            }

            const response =
                await rentalAxios.patch(
                    `/documents/${documentId}/verify`,
                    verificationData
                );

            console.log(
                "VERIFY RENTAL DOCUMENT RESPONSE:",
                response.data
            );

            return response.data;
        } catch (error) {
            return handleError(error);
        }
    };

// =====================================================
// MARK RENTAL DEPOSIT RECEIVED
// =====================================================
//
// FIX: this was calling `api.patch(...)`, but `api` is
// never defined/imported anywhere in this file — only
// `rentalAxios` exists. That undefined reference is what
// threw "is not defined". Switched to rentalAxios, and
// since rentalAxios's baseURL already includes "/rentals",
// the path here must NOT repeat "/rentals" again (that
// would have hit /rentals/rentals/:id/deposit-received,
// a 404, once the ReferenceError itself was fixed).
// =====================================================

export const markRentalDepositReceived = async (
    rentalId,
    data = {}
) => {

    try {

        if (!rentalId) {
            throw new Error(
                "Rental ID is required"
            );
        }

        console.log(
            "MARKING RENTAL DEPOSIT RECEIVED:",
            rentalId,
            data
        );

        const response =
            await rentalAxios.patch(
                `/${rentalId}/deposit-received`,
                data
            );

        console.log(
            "RENTAL DEPOSIT RECEIVED RESPONSE:",
            response?.data
        );

        return response?.data;

    } catch (error) {

        console.error(
            "RENTAL DEPOSIT RECEIVED ERROR:",
            error?.response?.data ||
            error?.message ||
            error
        );

        return handleError(error);
    }
};
// =====================================================
// RENTAL PAYMENT APIs
// IMPORTANT:
// rentalAxios ka baseURL already:
// ${VITE_API_URL}/rentals
// =====================================================

/* =========================================================
   RENTAL PAYMENT APIs
   Existing rentalAxios base URL:
   ${VITE_API_URL}/rentals
========================================================= */

/**
 * GET
 * /api/rentals/:rentalId/payments
 *
 * One rental's month-wise payment schedule.
 */
export const getRentalPaymentSchedule = async (rentalId) => {
    try {
        if (!rentalId) {
            throw new Error("Rental ID is required");
        }

        const response = await rentalAxios.get(
            `/${encodeURIComponent(rentalId)}/payments`
        );

        return response.data;
    } catch (error) {
        return handleError(error);
    }
};

/**
 * PATCH
 * /api/rentals/payments/:paymentId/pay
 *
 * payload example:
 * {
 *   amount: 1000,
 *   paymentMethod: "CASH",
 *   reference: ""
 * }
 */
export const payRentalInstallment = async (
    paymentId,
    payload = {}
) => {
    try {
        if (!paymentId) {
            throw new Error("Payment ID is required");
        }

        const response = await rentalAxios.patch(
            `/payments/${encodeURIComponent(paymentId)}/pay`,
            payload
        );

        return response.data;
    } catch (error) {
        return handleError(error);
    }
};

/**
 * GET
 * /api/rentals/payments/due?scope=overdue
 *
 * scope: "overdue" | "upcoming"
 */
export const getDueRentInstallments = async (
    scope = "overdue"
) => {
    try {
        const validScope =
            scope === "upcoming" ? "upcoming" : "overdue";

        const response = await rentalAxios.get(
            "/payments/due",
            {
                params: {
                    scope: validScope,
                },
            }
        );

        return response.data;
    } catch (error) {
        return handleError(error);
    }
};

/**
 * GET
 * /api/rentals/:rentalId/return-preview
 *
 * Return form preview:
 * pending rent, held deposit, etc.
 */
export const getRentalReturnPreview = async (rentalId) => {
    try {
        if (!rentalId) {
            throw new Error("Rental ID is required");
        }

        const response = await rentalAxios.get(
            `/${encodeURIComponent(rentalId)}/return-preview`
        );

        return response.data;
    } catch (error) {
        return handleError(error);
    }
};


/* =========================================================
   RENTAL INVENTORY - ADD / REMOVE STOCK
   PATCH /api/rentals/inventory/:productId/stock
========================================================= */

export const adjustRentalStock = async (
  productId,
  action,
  quantity
) => {
  try {
    if (!productId) {
      throw new Error("Product ID is required");
    }

    const normalizedAction = String(action)
      .trim()
      .toUpperCase();

    if (!["ADD", "REMOVE"].includes(normalizedAction)) {
      throw new Error("Invalid stock action");
    }

    const qty = Number(quantity);

    if (!Number.isSafeInteger(qty) || qty <= 0) {
      throw new Error(
        "Quantity must be a positive whole number"
      );
    }

    const response = await rentalAxios.patch(
      `/inventory/${productId}/stock`,
      {
        action: normalizedAction,
        quantity: qty,
      }
    );

    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

export const uploadRentalConditionPhoto = async (
  rentalId,
  imageSide,
  file
) => {
  const side = String(imageSide || "")
    .trim()
    .toUpperCase();

  if (!["FRONT", "BACK", "FULL"].includes(side)) {
    throw new Error("Invalid image side");
  }

  if (!file) {
    throw new Error(`${side} image is required`);
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      "Only JPG, PNG and WEBP images are allowed"
    );
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Maximum image size is 5 MB");
  }

  const formData = new FormData();

  formData.append("document", file);
  formData.append("documentType", "LAPTOP_CONDITION");
  formData.append("imageSide", side);

  const response = await rentalAxios.post(
    `/${rentalId}/documents`,
    formData
  );

  return response.data;
};
export const updateRentalPricing = async (
    rentalId,
    payload
) => {
    const response = await rentalAxios.patch(
        `/${rentalId}/pricing`,
        payload
    );

    return response.data;
};


/* =========================================================
   DEFAULT EXPORT
========================================================= */

const rentalApi = {

    // Products
    getRentalProducts,
    getRentalProduct,
    saveRentalProduct,

    // Online Rental
    createRentalRequest,

    // Walk-In Rental
    createWalkInRentalRequest,

    // Rentals
    getMyRentals,
    getRentalById,
    getAllRentals,

    // Rental Status
    approveRental,
    rejectRental,

    // Deposit
    markDepositReceived,
    markRentalDepositReceived,

    // Allocation
    allocateRental,

    // Return
    searchRentalsForReturn,
    markRentalReturned,
    completeRentalSettlement,

    // Inventory
    getRentalInventory,

    // Documents
    uploadRentalDocument,
    getRentalDocuments,
    verifyRentalDocument,

    getRentalPaymentSchedule,
    payRentalInstallment,
    getDueRentInstallments,
    getRentalReturnPreview,

    adjustRentalStock,
    uploadRentalConditionPhoto,
    updateRentalPricing,
};

export default rentalApi;