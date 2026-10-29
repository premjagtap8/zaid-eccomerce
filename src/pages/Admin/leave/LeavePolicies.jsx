import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "./LeavePolicies.css";

const API_URL = import.meta.env.VITE_API_URL;

const LeavePolicies = () => {
  // ======================================================
  // STATES
  // ======================================================

  const [policies, setPolicies] = useState([]);

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [editingPolicy, setEditingPolicy] = useState(null);

  const [formData, setFormData] = useState({
    leaveType: "SICK",
    monthlyLimit: "1",
    yearlyLimit: "5",
    carryForward: false,
  });

  // ======================================================
  // TOKEN
  // ======================================================

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // ======================================================
  // API REQUEST HELPER
  // ======================================================

  const apiRequest = async (
    url,
    options = {},
    timeout = 15000
  ) => {
    const token = getToken();

    if (!token) {
      throw new Error(
        "Authentication token missing. Please login again."
      );
    }

    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      const response = await fetch(url, {
        ...options,

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...(options.headers || {}),
        },

        signal: controller.signal,
      });

      const responseText = await response.text();

      let data = {};

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error(
            "API JSON PARSE ERROR:",
            parseError
          );

          throw new Error(
            "Server returned an invalid response."
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Request failed with status ${response.status}`
        );
      }

      return data;
    } catch (error) {
      if (error?.name === "AbortError") {
        throw new Error(
          "Request timed out. Please check whether the backend server is running."
        );
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // ======================================================
  // LOAD POLICIES
  // IMPORTANT:
  // GET /api/leaves/policies/all
  // ======================================================

  const loadPolicies = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      console.log(
        "================================="
      );

      console.log(
        "LOAD LEAVE POLICIES"
      );

      console.log(
        "API URL:",
        API_URL
      );

      console.log(
        "TOKEN EXISTS:",
        Boolean(token)
      );

      console.log(
        "REQUEST URL:",
        `${API_URL}/leaves/policies/all`
      );

      console.log(
        "================================="
      );

      // IMPORTANT:
      // options MUST be an object.
      const data = await apiRequest(
        `${API_URL}/leaves/policies/all`,
        {
          method: "GET",
        }
      );

      console.log(
        "Leave Policies Response:",
        data
      );

      const policyList = Array.isArray(
        data?.policies
      )
        ? data.policies
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];

      setPolicies(policyList);
    } catch (error) {
      console.error(
        "LOAD POLICIES ERROR:",
        error
      );

      const message =
        error?.message ||
        "Failed to load leave policies.";

      setError(message);

      toast.error(message);

      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // INITIAL LOAD
  // ======================================================

  useEffect(() => {
    loadPolicies();
  }, []);

  // ======================================================
  // FORM CHANGE
  // ======================================================

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setFormData((previous) => ({
      ...previous,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  // ======================================================
  // RESET FORM
  // ======================================================

  const resetForm = () => {
    setFormData({
      leaveType: "SICK",
      monthlyLimit: "1",
      yearlyLimit: "5",
      carryForward: false,
    });
  };

  // ======================================================
  // OPEN ADD MODAL
  // ======================================================

  const handleAddPolicy = () => {
    setEditingPolicy(null);

    resetForm();

    setError("");

    setShowModal(true);
  };

  // ======================================================
  // OPEN EDIT MODAL
  // ======================================================

  const handleEditPolicy = (policy) => {
    setEditingPolicy(policy);

    setFormData({
      leaveType:
        policy?.leaveType || "SICK",

      monthlyLimit:
        policy?.monthlyLimit !== undefined &&
        policy?.monthlyLimit !== null
          ? String(policy.monthlyLimit)
          : "1",

      yearlyLimit:
        policy?.yearlyLimit !== undefined &&
        policy?.yearlyLimit !== null
          ? String(policy.yearlyLimit)
          : "5",

      carryForward:
        policy?.carryForward === true,
    });

    setError("");

    setShowModal(true);
  };

  // ======================================================
  // CLOSE MODAL
  // ======================================================

  const handleCloseModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);

    setEditingPolicy(null);

    resetForm();

    setError("");
  };

  // ======================================================
  // VALIDATE FORM
  // ======================================================

  const validateForm = () => {
    const monthlyLimit = Number(
      formData.monthlyLimit
    );

    const yearlyLimit = Number(
      formData.yearlyLimit
    );

    if (!formData.leaveType) {
      return "Please select a leave type.";
    }

    if (
      !Number.isFinite(monthlyLimit) ||
      monthlyLimit < 0
    ) {
      return "Monthly limit must be 0 or greater.";
    }

    if (
      !Number.isFinite(yearlyLimit) ||
      yearlyLimit < 0
    ) {
      return "Yearly limit must be 0 or greater.";
    }

    if (yearlyLimit < monthlyLimit) {
      return "Yearly limit cannot be less than monthly limit.";
    }

    return null;
  };

  // ======================================================
  // SUBMIT POLICY
  // ======================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);

      toast.warning(validationError);

      return;
    }

    const token = getToken();

    if (!token) {
      const message =
        "Authentication token missing. Please login again.";

      setError(message);

      toast.error(message);

      return;
    }

    try {
      setSaving(true);

      setError("");

      const isEditing =
        Boolean(editingPolicy);

      // ==================================================
      // IMPORTANT:
      // Backend route is PATCH /policies/:id
      // NOT PUT
      // ==================================================

      const url = isEditing
        ? `${API_URL}/leaves/policies/${editingPolicy._id}`
        : `${API_URL}/leaves/policies`;

      const method = isEditing
        ? "PATCH"
        : "POST";

      const requestBody = {
        leaveType:
          formData.leaveType,

        monthlyLimit: Number(
          formData.monthlyLimit
        ),

        yearlyLimit: Number(
          formData.yearlyLimit
        ),

        carryForward:
          Boolean(
            formData.carryForward
          ),
      };

      console.log(
        "================================="
      );

      console.log(
        "SENDING LEAVE POLICY"
      );

      console.log(
        "URL:",
        url
      );

      console.log(
        "METHOD:",
        method
      );

      console.log(
        "BODY:",
        requestBody
      );

      console.log(
        "TOKEN EXISTS:",
        Boolean(token)
      );

      console.log(
        "================================="
      );

      const data =
        await apiRequest(
          url,
          {
            method,
            body: JSON.stringify(
              requestBody
            ),
          },
          15000
        );

      console.log(
        "SAVE POLICY RESPONSE:",
        data
      );

      toast.success(
        isEditing
          ? "Leave policy updated successfully."
          : "Leave policy created successfully."
      );

      setShowModal(false);

      setEditingPolicy(null);

      resetForm();

      await loadPolicies();
    } catch (error) {
      console.error(
        "SAVE POLICY ERROR:",
        error
      );

      const message =
        error?.message ||
        "Failed to save leave policy.";

      setError(message);

      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // ======================================================
  // DISABLE POLICY
  // IMPORTANT:
  // Policy database se delete nahi hogi.
  // Sirf isActive = false hoga.
  // ======================================================

  const handleDeletePolicy = async (policy) => {
    if (!policy?._id) {
      toast.error("Invalid leave policy.");
      return;
    }

    const leaveType = getLeaveTypeLabel(
      policy.leaveType
    );

    const confirmed = window.confirm(
      `Are you sure you want to disable "${leaveType}" leave policy?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication token missing. Please login again."
        );
      }

      const url = `${API_URL}/leaves/policies/${policy._id}`;

      const requestBody = {
        isActive: false,
      };

      console.log("=================================");
      console.log("DISABLING LEAVE POLICY");
      console.log("URL:", url);
      console.log("METHOD: PATCH");
      console.log("BODY:", requestBody);
      console.log("TOKEN EXISTS:", Boolean(token));
      console.log("=================================");

      const data = await apiRequest(
        url,
        {
          method: "PATCH",
          body: JSON.stringify(requestBody),
        },
        15000
      );

      console.log(
        "DISABLE POLICY RESPONSE:",
        data
      );

      toast.success(
        `${leaveType} policy disabled successfully.`
      );

      // Reload latest policies
      await loadPolicies();

    } catch (error) {
      console.error(
        "DISABLE POLICY ERROR:",
        error
      );

      const message =
        error?.message ||
        "Failed to disable leave policy.";

      setError(message);

      toast.error(message);

    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // FORMAT LEAVE TYPE
  // ======================================================

  const getLeaveTypeLabel = (leaveType) => {
    const labels = {
      SICK: "Sick Leave",
      CASUAL: "Casual Leave",
      EARNED: "Earned Leave",
      UNPAID: "Unpaid Leave",
      OTHER: "Other Leave",
    };

    return (
      labels[leaveType] ||
      leaveType
        ?.replaceAll("_", " ")
        ?.replace(/\b\w/g, (char) => char.toUpperCase()) ||
      "-"
    );
  };

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="leave-policies-page">

      {/* HEADER */}

      <div className="leave-policies-header">

        <div>
          <h1>
            Leave Policies
          </h1>

          <p>
            Configure employee leave
            allowances and policies.
          </p>
        </div>

        <button
          type="button"
          className="leave-policy-add-btn"
          onClick={
            handleAddPolicy
          }
          disabled={saving}
        >
          <span>+</span>
          Add Policy
        </button>

      </div>

      {/* ERROR */}

      {error && (
        <div className="leave-policy-error" role="alert">
          {error}
        </div>
      )}

      {/* SUMMARY */}

      <div className="leave-policy-summary">

        <div className="leave-policy-summary-card">
          <span>
            Total Policies
          </span>

          <strong>
            {policies.length}
          </strong>
        </div>

        <div className="leave-policy-summary-card">
          <span>
            Active Policies
          </span>

          <strong>
            {
              policies.filter(
                (policy) =>
                  policy?.isActive !==
                  false
              ).length
            }
          </strong>
        </div>

        <div className="leave-policy-summary-card">
          <span>
            Carry Forward
          </span>

          <strong>
            {
              policies.filter(
                (policy) =>
                  policy?.carryForward ===
                  true
              ).length
            }
          </strong>
        </div>

      </div>

      {/* TABLE CARD */}

      <div className="leave-policy-table-card">

        <div className="leave-policy-table-header">

          <div>
            <h2>
              Leave Policy List
            </h2>

            <p>
              All configured leave
              allowances.
            </p>
          </div>

          <button
            type="button"
            className="leave-policy-refresh-btn"
            onClick={
              loadPolicies
            }
            disabled={loading}
          >
            {loading
              ? "Loading..."
              : "↻ Refresh"}
          </button>

        </div>

        {/* LOADING */}

        {loading ? (
          <div className="leave-policy-loading" role="status">
            Loading leave policies...
          </div>
        ) : policies.length === 0 ? (

          /* EMPTY */

          <div className="leave-policy-empty">

            <div className="leave-policy-empty-icon">
              📋
            </div>

            <h3>
              No Leave Policies Found
            </h3>

            <p>
              Create your first leave
              policy.
            </p>

            <button
              type="button"
              className="leave-policy-add-btn"
              onClick={
                handleAddPolicy
              }
            >
              + Add Policy
            </button>

          </div>

        ) : (

          /* TABLE */

          <div className="leave-policy-table-wrapper">

            <table className="leave-policy-table">

              <thead>
                <tr>
                  <th>#</th>
                  <th>Leave Type</th>
                  <th>Monthly Limit</th>
                  <th>Yearly Limit</th>
                  <th>Carry Forward</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {policies.map(
                  (
                    policy,
                    index
                  ) => (

                    <tr
                      key={
                        policy?._id ||
                        index
                      }
                    >

                      <td data-label="#">
                        {index + 1}
                      </td>

                      <td data-label="Leave Type">
                        <div className="leave-policy-name">

                          <div className="leave-policy-icon">
                            📋
                          </div>

                          <strong>
                            {getLeaveTypeLabel(
                              policy?.leaveType
                            )}
                          </strong>

                        </div>
                      </td>

                      <td data-label="Monthly Limit">
                        <strong>
                          {
                            policy?.monthlyLimit ??
                            0
                          }
                        </strong>{" "}
                        Days
                      </td>

                      <td data-label="Yearly Limit">
                        <strong>
                          {
                            policy?.yearlyLimit ??
                            0
                          }
                        </strong>{" "}
                        Days
                      </td>

                      <td data-label="Carry Forward">

                        {policy?.carryForward ? (
                          <span className="leave-policy-badge yes">
                            Yes
                          </span>
                        ) : (
                          <span className="leave-policy-badge no">
                            No
                          </span>
                        )}

                      </td>

                      <td data-label="Status">

                        <span
                          className={`leave-policy-status ${
                            policy?.isActive !==
                            false
                              ? "active"
                              : "inactive"
                          }`}
                        >
                          {policy?.isActive !==
                          false
                            ? "Active"
                            : "Inactive"}
                        </span>

                      </td>

                      <td data-label="Action">

                        <div className="leave-policy-actions">

                          <button
                            type="button"
                            className="leave-policy-edit-btn"
                            onClick={() =>
                              handleEditPolicy(
                                policy
                              )
                            }
                            disabled={
                              saving
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="leave-policy-delete-btn"
                            onClick={() =>
                              handleDeletePolicy(
                                policy
                              )
                            }
                            disabled={
                              loading ||
                              saving
                            }
                          >
                            Disable
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* MODAL */}

      {showModal && (

        <div
          className="leave-policy-modal-overlay"
          onClick={
            handleCloseModal
          }
        >

          <div
            className="leave-policy-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="leave-policy-modal-header">

              <div>
                <h2>
                  {editingPolicy
                    ? "Edit Leave Policy"
                    : "Add Leave Policy"}
                </h2>

                <p>
                  Configure leave
                  allowance.
                </p>
              </div>

              <button
                type="button"
                className="leave-policy-modal-close"
                onClick={
                  handleCloseModal
                }
                disabled={saving}
                aria-label="Close"
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <form
              className="leave-policy-form"
              onSubmit={
                handleSubmit
              }
            >

              {/* LEAVE TYPE */}

              <div className="leave-policy-form-group">

                <label htmlFor="leaveType">
                  Leave Type
                </label>

                <select
                  id="leaveType"
                  name="leaveType"
                  value={
                    formData.leaveType
                  }
                  onChange={
                    handleChange
                  }
                  disabled={saving}
                >

                  <option value="SICK">Sick Leave</option>
                  <option value="CASUAL">Casual Leave</option>
                  <option value="EARNED">Earned Leave</option>
                  <option value="UNPAID">Unpaid Leave</option>
                  <option value="OTHER">Other Leave</option>
                </select>

              </div>

              {/* MONTHLY */}

              <div className="leave-policy-form-group">

                <label htmlFor="monthlyLimit">
                  Monthly Limit
                  <span>*</span>
                </label>

                <div className="leave-policy-input-wrapper">

                  <input
                    id="monthlyLimit"
                    type="number"
                    name="monthlyLimit"
                    min="0"
                    step="1"
                    value={
                      formData.monthlyLimit
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                    required
                  />

                  <span>
                    Days
                  </span>

                </div>

              </div>

              {/* YEARLY */}

              <div className="leave-policy-form-group">

                <label htmlFor="yearlyLimit">
                  Yearly Limit
                  <span>*</span>
                </label>

                <div className="leave-policy-input-wrapper">

                  <input
                    id="yearlyLimit"
                    type="number"
                    name="yearlyLimit"
                    min="0"
                    step="1"
                    value={
                      formData.yearlyLimit
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                    required
                  />

                  <span>
                    Days
                  </span>

                </div>

              </div>

              {/* CARRY FORWARD */}

              <div className="leave-policy-checkbox">

                <input
                  type="checkbox"
                  id="carryForward"
                  name="carryForward"
                  checked={
                    formData.carryForward
                  }
                  onChange={
                    handleChange
                  }
                  disabled={saving}
                />

                <label htmlFor="carryForward">

                  <strong>
                    Allow Carry Forward
                  </strong>

                  <small>
                    Allow unused leave
                    days to be carried
                    forward.
                  </small>

                </label>

              </div>

              {/* ACTIONS */}

              <div className="leave-policy-form-actions">

                <button
                  type="button"
                  className="leave-policy-cancel-btn"
                  onClick={
                    handleCloseModal
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="leave-policy-save-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingPolicy
                    ? "Update Policy"
                    : "Create Policy"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
};

export default LeavePolicies;
