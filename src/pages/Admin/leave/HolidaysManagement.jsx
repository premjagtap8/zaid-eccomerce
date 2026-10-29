import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "./LeaveManagement.css";

const API_URL = import.meta.env.VITE_API_URL;

const HolidaysManagement = () => {
  // ==========================================
  // STATES
  // ==========================================

  const [holidays, setHolidays] = useState([]);

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [editingHoliday, setEditingHoliday] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    date: "",
    holidayType: "SPECIAL",
    description: "",
    isActive: true,
  });

  // ==========================================
  // GET TOKEN
  // ==========================================

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // ==========================================
  // RESET FORM
  // ==========================================

  const resetForm = () => {
    setFormData({
      title: "",
      date: "",
      holidayType: "SPECIAL",
      description: "",
      isActive: true,
    });

    setEditingHoliday(null);
  };

  // ==========================================
  // LOAD HOLIDAYS
  // ==========================================

  const loadHolidays = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      console.log("=================================");
      console.log("LOAD HOLIDAYS");
      console.log("API URL:", API_URL);
      console.log("TOKEN EXISTS:", Boolean(token));
      console.log(
        "REQUEST URL:",
        `${API_URL}/leaves/holidays`
      );
      console.log("=================================");

      if (!token) {
        throw new Error(
          "Authentication token missing. Please login again."
        );
      }

      const controller = new AbortController();

      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 60000);

      let response;

      try {
        response = await fetch(
          `${API_URL}/leaves/holidays`,
          {
            method: "GET",

            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },

            signal: controller.signal,
          }
        );
      } finally {
        clearTimeout(timeoutId);
      }

      const responseText = await response.text();

      let data = {};

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {};
      } catch (parseError) {
        console.error(
          "HOLIDAYS JSON PARSE ERROR:",
          parseError
        );

        throw new Error(
          "Server returned an invalid response."
        );
      }

      console.log(
        "HOLIDAYS RESPONSE:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Failed to load holidays. Status: ${response.status}`
        );
      }

      const holidayList = Array.isArray(
        data?.holidays
      )
        ? data.holidays
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];

      setHolidays(holidayList);

    } catch (error) {
      console.error(
        "LOAD HOLIDAYS ERROR:",
        error
      );

      let message =
        error?.message ||
        "Failed to load holidays.";

      if (error?.name === "AbortError") {
        message =
          "Holiday API is taking too long to respond. Please check the backend.";
      }

      setError(message);

      toast.error(message);

    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    loadHolidays();
  }, []);

  // ==========================================
  // FORM CHANGE
  // ==========================================

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

  // ==========================================
  // OPEN ADD MODAL
  // ==========================================

  const handleAddHoliday = () => {
    if (saving) {
      return;
    }

    resetForm();

    setError("");

    setShowModal(true);
  };

  // ==========================================
  // OPEN EDIT MODAL
  // ==========================================

  const handleEditHoliday = (holiday) => {
    if (saving) {
      return;
    }

    setEditingHoliday(holiday);

    setFormData({
      title:
        holiday?.title || "",

      date:
        holiday?.date
          ? new Date(holiday.date)
              .toISOString()
              .split("T")[0]
          : "",

      holidayType:
        holiday?.holidayType ||
        "SPECIAL",

      description:
        holiday?.description ||
        "",

      isActive:
        holiday?.isActive !== false,
    });

    setError("");

    setShowModal(true);
  };

  // ==========================================
  // CLOSE MODAL
  // ==========================================

  const handleCloseModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);

    resetForm();

    setError("");
  };

  // ==========================================
  // VALIDATE FORM
  // ==========================================

  const validateForm = () => {
    if (!formData.title.trim()) {
      return "Holiday title is required.";
    }

    if (!formData.date) {
      return "Holiday date is required.";
    }

    if (
      !["PERMANENT", "SPECIAL"].includes(
        formData.holidayType
      )
    ) {
      return "Invalid holiday type.";
    }

    return null;
  };

  // ==========================================
  // SUBMIT FORM
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    // ==========================================
    // VALIDATION
    // ==========================================

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      toast.warning(validationError);
      return;
    }

    // ==========================================
    // TOKEN
    // ==========================================

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
        Boolean(editingHoliday);

      const url = isEditing
        ? `${API_URL}/leaves/holidays/${editingHoliday._id}`
        : `${API_URL}/leaves/holidays`;

      const method = isEditing
        ? "PUT"
        : "POST";

      // ==========================================
      // REQUEST BODY
      // ==========================================

      const requestBody = {
        title:
          formData.title.trim(),

        date:
          formData.date,

        holidayType:
          formData.holidayType,

        description:
          formData.description.trim(),

        isActive:
          Boolean(formData.isActive),
      };

      // ==========================================
      // DEBUG
      // ==========================================

      console.log(
        "================================="
      );

      console.log(
        "HOLIDAY SAVE START"
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

      // ==========================================
      // REQUEST TIMEOUT
      // 60 SECONDS
      // ==========================================

      const controller =
        new AbortController();

      const timeoutId =
        setTimeout(() => {
          controller.abort();
        }, 60000);

      let response;

      try {
        response = await fetch(
          url,
          {
            method,

            headers: {
              Authorization:
                `Bearer ${token}`,

              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                requestBody
              ),

            signal:
              controller.signal,
          }
        );
      } finally {
        clearTimeout(timeoutId);
      }

      // ==========================================
      // RESPONSE
      // ==========================================

      console.log(
        "HOLIDAY RESPONSE STATUS:",
        response.status
      );

      console.log(
        "HOLIDAY RESPONSE OK:",
        response.ok
      );

      const responseText =
        await response.text();

      console.log(
        "HOLIDAY RAW RESPONSE:",
        responseText
      );

      let data = {};

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {};
      } catch (parseError) {
        console.error(
          "HOLIDAY RESPONSE JSON PARSE ERROR:",
          parseError
        );

        throw new Error(
          "Server returned an invalid response."
        );
      }

      console.log(
        "SAVE HOLIDAY RESPONSE:",
        data
      );

      // ==========================================
      // API ERROR
      // ==========================================

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Failed to save holiday. Status: ${response.status}`
        );
      }

      // ==========================================
      // SUCCESS
      // ==========================================

      toast.success(
        isEditing
          ? "Holiday updated successfully."
          : "Holiday created successfully."
      );

      // Close modal
      setShowModal(false);

      // Reset form
      resetForm();

      // Reload holidays
      await loadHolidays();

    } catch (error) {
      console.error(
        "SAVE HOLIDAY ERROR:",
        error
      );

      let message =
        error?.message ||
        "Failed to save holiday.";

      // ==========================================
      // TIMEOUT
      // ==========================================

      if (
        error?.name ===
        "AbortError"
      ) {
        message =
          "Holiday API is taking too long to respond. Please check the backend controller.";
      }

      setError(message);

      toast.error(message);

    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // DELETE HOLIDAY
  // ==========================================

  const handleDeleteHoliday = async (
    holiday
  ) => {
    const confirmDelete =
      window.confirm(
        `Are you sure you want to delete "${holiday.title}"?`
      );

    if (!confirmDelete) {
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
      setLoading(true);
      setError("");

      const response =
        await fetch(
          `${API_URL}/leaves/holidays/${holiday._id}`,
          {
            method: "DELETE",

            headers: {
              Authorization:
                `Bearer ${token}`,

              "Content-Type":
                "application/json",
            },
          }
        );

      const responseText =
        await response.text();

      let data = {};

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {};
      } catch (parseError) {
        console.error(
          "DELETE HOLIDAY JSON ERROR:",
          parseError
        );

        throw new Error(
          "Server returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Failed to delete holiday. Status: ${response.status}`
        );
      }

      toast.success(
        "Holiday deleted successfully."
      );

      await loadHolidays();

    } catch (error) {
      console.error(
        "DELETE HOLIDAY ERROR:",
        error
      );

      const message =
        error?.message ||
        "Failed to delete holiday.";

      setError(message);

      toast.error(message);

    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "-";
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ==========================================
  // HOLIDAY TYPE LABEL
  // ==========================================

  const getHolidayTypeLabel = (
    type
  ) => {
    if (type === "PERMANENT") {
      return "Permanent";
    }

    return "Special";
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="holiday-management-page">

      {/* ======================================
          HEADER
      ======================================= */}

      <div className="holiday-page-header">

        <div>
          <h1>
            Holiday Management
          </h1>

          <p>
            Manage company holidays and
            special holidays.
          </p>
        </div>

        <button
          type="button"
          className="holiday-add-btn"
          onClick={handleAddHoliday}
          disabled={saving}
        >
          + Add Holiday
        </button>

      </div>

      {/* ======================================
          ERROR
      ======================================= */}

      {error && (
        <div className="holiday-error" role="alert">
          {error}
        </div>
      )}

      {/* ======================================
          SUMMARY
      ======================================= */}

      <div className="holiday-summary">

        <div className="holiday-summary-card">

          <span>
            Total Holidays
          </span>

          <strong>
            {holidays.length}
          </strong>

        </div>

        <div className="holiday-summary-card">

          <span>
            Permanent
          </span>

          <strong>
            {
              holidays.filter(
                (holiday) =>
                  holiday.holidayType ===
                  "PERMANENT"
              ).length
            }
          </strong>

        </div>

        <div className="holiday-summary-card">

          <span>
            Special
          </span>

          <strong>
            {
              holidays.filter(
                (holiday) =>
                  holiday.holidayType ===
                  "SPECIAL"
              ).length
            }
          </strong>

        </div>

        <div className="holiday-summary-card">

          <span>
            Active
          </span>

          <strong>
            {
              holidays.filter(
                (holiday) =>
                  holiday.isActive !==
                  false
              ).length
            }
          </strong>

        </div>

      </div>

      {/* ======================================
          TABLE
      ======================================= */}

      <div className="holiday-table-card">

        <div className="holiday-table-header">

          <div>
            <h2>
              Holiday List
            </h2>

            <p>
              All active and configured
              holidays
            </p>
          </div>

          <button
            type="button"
            className="holiday-refresh-btn"
            onClick={loadHolidays}
            disabled={loading}
          >
            ↻ Refresh
          </button>

        </div>

        {/* LOADING */}

        {loading ? (

          <div className="holiday-loading" role="status">
            Loading holidays...
          </div>

        ) : holidays.length === 0 ? (

          /* EMPTY */

          <div className="holiday-empty">

            <div className="holiday-empty-icon">
              📅
            </div>

            <h3>
              No Holidays Found
            </h3>

            <p>
              Add your first company
              holiday.
            </p>

            <button
              type="button"
              className="holiday-add-btn"
              onClick={
                handleAddHoliday
              }
              disabled={saving}
            >
              + Add Holiday
            </button>

          </div>

        ) : (

          /* TABLE */

          <div className="holiday-table-wrapper">

            <table className="holiday-table">

              <thead>

                <tr>

                  <th>#</th>

                  <th>
                    Holiday
                  </th>

                  <th>
                    Date
                  </th>

                  <th>
                    Type
                  </th>

                  <th>
                    Description
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

                {holidays.map(
                  (
                    holiday,
                    index
                  ) => (

                    <tr
                      key={
                        holiday._id ||
                        index
                      }
                    >

                      <td data-label="#">
                        {index + 1}
                      </td>

                      <td data-label="Holiday">

                        <div className="holiday-name">

                          <div className="holiday-calendar-icon">
                            📅
                          </div>

                          <strong>
                            {
                              holiday.title
                            }
                          </strong>

                        </div>

                      </td>

                      <td data-label="Date">
                        {
                          formatDate(
                            holiday.date
                          )
                        }
                      </td>

                      <td data-label="Type">

                        <span
                          className={`holiday-type ${
                            holiday.holidayType ===
                            "PERMANENT"
                              ? "permanent"
                              : "special"
                          }`}
                        >
                          {
                            getHolidayTypeLabel(
                              holiday.holidayType
                            )
                          }
                        </span>

                      </td>

                      <td data-label="Description">

                        <span className="holiday-description">

                          {
                            holiday.description ||
                            "No description"
                          }

                        </span>

                      </td>

                      <td data-label="Status">

                        <span
                          className={`holiday-status ${
                            holiday.isActive !==
                            false
                              ? "active"
                              : "inactive"
                          }`}
                        >
                          {
                            holiday.isActive !==
                            false
                              ? "Active"
                              : "Inactive"
                          }
                        </span>

                      </td>

                      <td data-label="Action">

                        <div className="holiday-actions">

                          <button
                            type="button"
                            className="holiday-edit-btn"
                            onClick={() =>
                              handleEditHoliday(
                                holiday
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
                            className="holiday-delete-btn"
                            onClick={() =>
                              handleDeleteHoliday(
                                holiday
                              )
                            }
                            disabled={
                              loading ||
                              saving
                            }
                          >
                            Delete
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

      {/* ======================================
          MODAL
      ======================================= */}

      {showModal && (

        <div
          className="holiday-modal-overlay"
          onClick={handleCloseModal}
        >

          <div
            className="holiday-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="holiday-modal-header">

              <div>

                <h2>
                  {editingHoliday
                    ? "Edit Holiday"
                    : "Add Holiday"}
                </h2>

                <p>
                  Enter holiday details
                  below.
                </p>

              </div>

              <button
                type="button"
                className="holiday-modal-close"
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
              className="holiday-form"
              onSubmit={
                handleSubmit
              }
            >

              {/* TITLE */}

              <div className="holiday-form-group">

                <label htmlFor="holidayTitle">
                  Holiday Name
                  <span>*</span>
                </label>

                <input
                  id="holidayTitle"
                  type="text"
                  name="title"
                  value={
                    formData.title
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Example: Independence Day"
                  disabled={saving}
                  required
                />

              </div>

              {/* DATE */}

              <div className="holiday-form-group">

                <label htmlFor="holidayDate">
                  Holiday Date
                  <span>*</span>
                </label>

                <input
                  id="holidayDate"
                  type="date"
                  name="date"
                  value={
                    formData.date
                  }
                  onChange={
                    handleChange
                  }
                  disabled={saving}
                  required
                />

              </div>

              {/* TYPE */}

              <div className="holiday-form-group">

                <label htmlFor="holidayType">
                  Holiday Type
                </label>

                <select
                  id="holidayType"
                  name="holidayType"
                  value={
                    formData.holidayType
                  }
                  onChange={
                    handleChange
                  }
                  disabled={saving}
                >

                  <option value="PERMANENT">
                    Permanent
                  </option>

                  <option value="SPECIAL">
                    Special
                  </option>

                </select>

              </div>

              {/* DESCRIPTION */}

              <div className="holiday-form-group">

                <label htmlFor="holidayDescription">
                  Description
                </label>

                <textarea
                  id="holidayDescription"
                  name="description"
                  value={
                    formData.description
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter holiday description..."
                  rows="4"
                  disabled={saving}
                />

              </div>

              {/* ACTIVE */}

              <div className="holiday-checkbox">

                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={
                    formData.isActive
                  }
                  onChange={
                    handleChange
                  }
                  disabled={saving}
                />

                <label htmlFor="isActive">
                  Holiday is active
                </label>

              </div>

              {/* BUTTONS */}

              <div className="holiday-form-actions">

                <button
                  type="button"
                  className="holiday-cancel-btn"
                  onClick={
                    handleCloseModal
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="holiday-save-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingHoliday
                    ? "Update Holiday"
                    : "Create Holiday"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
};

export default HolidaysManagement;
