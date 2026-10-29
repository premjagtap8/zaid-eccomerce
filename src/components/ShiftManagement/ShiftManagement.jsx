import React, { useCallback, useEffect, useState } from "react";
import {
  getShifts,
  createShift,
} from "../../services/shiftService.js";
import {
  FiClock,
  FiPlus,
  FiList,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
  FiCalendar,
  FiCoffee,
  FiShield,
  FiFileText,
  FiSave,
  FiBriefcase,
} from "react-icons/fi";

import "./ShiftManagement.css";

// ==========================================
// DEFAULT FORM DATA
// ==========================================

const INITIAL_FORM = {
  name: "",
  startTime: "09:00",
  endTime: "18:00",
  breakDuration: 60,
  lateAllowedMinutes: 10,
  overtimeAllowed: true,
  description: "",
  status: "ACTIVE",
};

// ==========================================
// EXTRACT SHIFT LIST FROM API RESPONSE
// ==========================================

const extractShifts = (response) => {
  const candidates = [
    response,
    response?.records,
    response?.shifts,
    response?.data,
    response?.data?.records,
    response?.data?.shifts,
    response?.data?.data,
    response?.data?.data?.records,
    response?.data?.data?.shifts,
  ];

  return candidates.find(Array.isArray) || [];
};

// ==========================================
// FORMAT TIME
// ==========================================

const formatTime = (time) => {
  if (!time) return "--";

  const match = String(time).match(
    /^(\d{1,2}):(\d{2})/
  );

  if (!match) return time;

  const hours = Number(match[1]);
  const minutes = match[2];

  if (hours > 23) return time;

  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;

  return `${String(hour12).padStart(2, "0")}:${minutes} ${period}`;
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const ShiftManagement = () => {
  const [shifts, setShifts] = useState([]);
  const [formData, setFormData] = useState({
    ...INITIAL_FORM,
  });

  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState("");
  const [listError, setListError] = useState("");
  const [success, setSuccess] = useState("");

  // ========================================
  // FETCH SHIFTS
  // ========================================

  const fetchShifts = useCallback(async () => {
    setListLoading(true);
    setListError("");

    try {
      const responseData = await getShifts();
      const data = extractShifts(responseData);

      setShifts(data);

      console.log("Fetched Shifts:", data);
    } catch (err) {
      console.error("Error fetching shifts:", err);

      setListError(
        err.response?.data?.message ||
          "Failed to load shifts. Please try again."
      );
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  // ========================================
  // HANDLE INPUT CHANGE
  // ========================================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (error) setError("");
    if (success) setSuccess("");
  };

  // ========================================
  // CREATE SHIFT
  // ========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    if (!formData.name.trim()) {
      setError("Please enter a shift name.");
      return;
    }

    if (!formData.startTime || !formData.endTime) {
      setError("Please select start and end times.");
      return;
    }

    const breakDuration = Number(
      formData.breakDuration
    );

    const lateAllowedMinutes = Number(
      formData.lateAllowedMinutes
    );

    if (
      !Number.isFinite(breakDuration) ||
      !Number.isFinite(lateAllowedMinutes) ||
      breakDuration < 0 ||
      lateAllowedMinutes < 0
    ) {
      setError(
        "Break duration and late grace period must be valid non-negative numbers."
      );
      return;
    }

    const payload = {
      name: formData.name.trim(),
      startTime: formData.startTime,
      endTime: formData.endTime,
      breakDuration,
      lateAllowedMinutes,
      overtimeAllowed: Boolean(
        formData.overtimeAllowed
      ),
      description: formData.description
        ? formData.description.trim()
        : "",
      status: formData.status,
    };

    setLoading(true);

    try {
      await createShift(payload);

      setSuccess("Shift created successfully!");

      setFormData({
        ...INITIAL_FORM,
      });

      await fetchShifts();
    } catch (err) {
      console.error(
        "Backend Error Detail:",
        err.response?.data || err
      );

      setError(
        err.response?.data?.message ||
          "Failed to create shift. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // DASHBOARD COUNTS
  // ========================================

  const totalShifts = shifts.length;

  const activeShifts = shifts.filter(
    (shift) => shift.status === "ACTIVE"
  ).length;

  const inactiveShifts = shifts.filter(
    (shift) => shift.status === "INACTIVE"
  ).length;

  const overtimeShifts = shifts.filter(
    (shift) => shift.overtimeAllowed === true
  ).length;

  // ========================================
  // JSX
  // ========================================

  return (
    <div className="hrsm-page">
      <div className="hrsm-container">

        {/* ================================
            PAGE HEADER
        ================================= */}

        <div className="hrsm-page-header">
          <div className="hrsm-page-heading">
            <div className="hrsm-page-icon">
              <FiClock />
            </div>

            <div className="hrsm-page-heading-text">
              <h1>Shift Management</h1>
              <p>
                Create, configure and manage employee
                work shifts.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="hrsm-refresh-btn"
            onClick={fetchShifts}
            disabled={listLoading}
          >
            <FiRefreshCw
              className={
                listLoading ? "hrsm-spin" : ""
              }
            />
            <span>
              {listLoading ? "Refreshing..." : "Refresh"}
            </span>
          </button>
        </div>

        {/* ================================
            SUMMARY CARDS
            (tones are brand-only: green + ink)
        ================================= */}

        <div className="hrsm-stats-grid">

          <div className="hrsm-stat-card">
            <div className="hrsm-stat-icon hrsm-stat-green">
              <FiCalendar />
            </div>
            <div className="hrsm-stat-info">
              <span>Total Shifts</span>
              <h3>{totalShifts}</h3>
            </div>
          </div>

          <div className="hrsm-stat-card">
            <div className="hrsm-stat-icon hrsm-stat-green">
              <FiCheckCircle />
            </div>
            <div className="hrsm-stat-info">
              <span>Active Shifts</span>
              <h3>{activeShifts}</h3>
            </div>
          </div>

          <div className="hrsm-stat-card">
            <div className="hrsm-stat-icon hrsm-stat-ink">
              <FiShield />
            </div>
            <div className="hrsm-stat-info">
              <span>Inactive Shifts</span>
              <h3>{inactiveShifts}</h3>
            </div>
          </div>

          <div className="hrsm-stat-card">
            <div className="hrsm-stat-icon hrsm-stat-ink">
              <FiClock />
            </div>
            <div className="hrsm-stat-info">
              <span>Overtime Enabled</span>
              <h3>{overtimeShifts}</h3>
            </div>
          </div>

        </div>

        {/* ================================
            CREATE SHIFT CARD
        ================================= */}

        <section className="hrsm-card">

          <div className="hrsm-card-header">
            <div className="hrsm-card-title-group">
              <div className="hrsm-section-icon">
                <FiPlus />
              </div>

              <div>
                <h2>Create New Shift</h2>
                <p>
                  Set shift timings and employee work
                  policies.
                </p>
              </div>
            </div>

            <span className="hrsm-header-tag">
              <FiBriefcase />
              HR Management
            </span>
          </div>

          <div className="hrsm-card-body">

            {/* ERROR MESSAGE */}

            {error && (
              <div
                className="hrsm-alert hrsm-alert-error"
                role="alert"
              >
                <FiAlertCircle />
                <span>{error}</span>
              </div>
            )}

            {/* SUCCESS MESSAGE */}

            {success && (
              <div
                className="hrsm-alert hrsm-alert-success"
                role="status"
              >
                <FiCheckCircle />
                <span>{success}</span>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="hrsm-form"
            >

              <div className="hrsm-form-grid">

                {/* SHIFT NAME */}

                <div className="hrsm-field">
                  <label htmlFor="hrsm-name">
                    Shift Name
                    <span className="hrsm-required">
                      *
                    </span>
                  </label>

                  <div className="hrsm-input-wrap">
                    <FiBriefcase className="hrsm-input-icon" />

                    <input
                      id="hrsm-name"
                      type="text"
                      name="name"
                      placeholder="e.g., Morning Shift"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      maxLength={100}
                      className="hrsm-input hrsm-input-with-icon"
                    />
                  </div>
                </div>

                {/* START TIME */}

                <div className="hrsm-field">
                  <label htmlFor="hrsm-start">
                    Start Time
                    <span className="hrsm-required">
                      *
                    </span>
                  </label>

                  <input
                    id="hrsm-start"
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    required
                    className="hrsm-input"
                  />
                </div>

                {/* END TIME */}

                <div className="hrsm-field">
                  <label htmlFor="hrsm-end">
                    End Time
                    <span className="hrsm-required">
                      *
                    </span>
                  </label>

                  <input
                    id="hrsm-end"
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    required
                    className="hrsm-input"
                  />
                </div>

                {/* BREAK DURATION */}

                <div className="hrsm-field">
                  <label htmlFor="hrsm-break">
                    Break Duration (Mins)
                  </label>

                  <div className="hrsm-input-wrap">
                    <FiCoffee className="hrsm-input-icon" />

                    <input
                      id="hrsm-break"
                      type="number"
                      name="breakDuration"
                      min="0"
                      step="1"
                      value={formData.breakDuration}
                      onChange={handleChange}
                      className="hrsm-input hrsm-input-with-icon"
                    />
                  </div>
                </div>

                {/* LATE GRACE PERIOD */}

                <div className="hrsm-field">
                  <label htmlFor="hrsm-late">
                    Late Grace Period (Mins)
                  </label>

                  <div className="hrsm-input-wrap">
                    <FiClock className="hrsm-input-icon" />

                    <input
                      id="hrsm-late"
                      type="number"
                      name="lateAllowedMinutes"
                      min="0"
                      step="1"
                      value={formData.lateAllowedMinutes}
                      onChange={handleChange}
                      className="hrsm-input hrsm-input-with-icon"
                    />
                  </div>
                </div>

                {/* STATUS */}

                <div className="hrsm-field">
                  <label htmlFor="hrsm-status">
                    Shift Status
                  </label>

                  <select
                    id="hrsm-status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="hrsm-select"
                  >
                    <option value="ACTIVE">
                      Active
                    </option>
                    <option value="INACTIVE">
                      Inactive
                    </option>
                  </select>
                </div>

                {/* DESCRIPTION */}

                <div className="hrsm-field hrsm-field-full">
                  <label htmlFor="hrsm-description">
                    Description
                  </label>

                  <div className="hrsm-input-wrap">
                    <FiFileText className="hrsm-input-icon" />

                    <input
                      id="hrsm-description"
                      type="text"
                      name="description"
                      placeholder="e.g., Standard morning operational shift"
                      value={formData.description}
                      onChange={handleChange}
                      className="hrsm-input hrsm-input-with-icon"
                    />
                  </div>
                </div>

              </div>

              {/* OVERTIME CHECKBOX */}

              <div className="hrsm-options-section">

                <div className="hrsm-option-info">
                  <div className="hrsm-option-icon">
                    <FiClock />
                  </div>

                  <div>
                    <h4>Overtime Allowed</h4>
                    <p>
                      Allow employees assigned to this
                      shift to work overtime.
                    </p>
                  </div>
                </div>

                <label className="hrsm-switch">
                  <input
                    type="checkbox"
                    name="overtimeAllowed"
                    checked={formData.overtimeAllowed}
                    onChange={handleChange}
                    aria-label="Overtime Allowed"
                  />
                  <span className="hrsm-switch-slider" />
                </label>

              </div>

              {/* FORM ACTIONS */}

              <div className="hrsm-form-actions">

                <button
                  type="button"
                  className="hrsm-reset-btn"
                  onClick={() => {
                    setFormData({ ...INITIAL_FORM });
                    setError("");
                    setSuccess("");
                  }}
                  disabled={loading}
                >
                  Reset Form
                </button>

                <button
                  type="submit"
                  className="hrsm-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <FiRefreshCw className="hrsm-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiSave />
                      Create Shift
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>
        </section>

        {/* ================================
            SHIFT LIST
        ================================= */}

        <section className="hrsm-card hrsm-list-card">

          <div className="hrsm-card-header">
            <div className="hrsm-card-title-group">
              <div className="hrsm-section-icon">
                <FiList />
              </div>

              <div>
                <h2>Shift List</h2>
                <p>
                  View all existing company shifts and
                  their policies.
                </p>
              </div>
            </div>

            <span className="hrsm-count-label">
              {totalShifts} Shifts
            </span>
          </div>

          {listError && (
            <div
              className="hrsm-alert hrsm-alert-error hrsm-list-alert"
              role="alert"
            >
              <FiAlertCircle />
              <span>{listError}</span>
              <button
                type="button"
                onClick={fetchShifts}
                className="hrsm-retry-btn"
              >
                Retry
              </button>
            </div>
          )}

          <div className="hrsm-table-wrapper">

            <table className="hrsm-table">

              <thead>
                <tr>
                  <th>Shift Name</th>
                  <th>Timings</th>
                  <th>Break</th>
                  <th>Late Grace</th>
                  <th>Overtime</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {listLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="hrsm-empty-cell"
                    >
                      <div className="hrsm-empty-state">
                        <FiRefreshCw
                          className="hrsm-spin"
                        />
                        <p>Loading shifts...</p>
                      </div>
                    </td>
                  </tr>
                ) : shifts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="hrsm-empty-cell"
                    >
                      <div className="hrsm-empty-state">
                        <div className="hrsm-empty-icon">
                          <FiCalendar />
                        </div>

                        <h3>No Shifts Found</h3>
                        <p>
                          No shifts created yet. Create
                          your first shift using the form
                          above.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  shifts.map((shift, idx) => (
                    <tr
                      key={shift._id || idx}
                      className="hrsm-table-row"
                    >

                      <td>
                        <div className="hrsm-shift-name-cell">
                          <div className="hrsm-shift-avatar">
                            <FiClock />
                          </div>

                          <div className="hrsm-shift-name-info">
                            <strong>
                              {shift.name || "--"}
                            </strong>

                            {shift.description && (
                              <small
                                title={shift.description}
                              >
                                {shift.description}
                              </small>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="hrsm-time-cell">
                          <FiClock />
                          <span>
                            {formatTime(shift.startTime)}
                            {" - "}
                            {formatTime(shift.endTime)}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="hrsm-table-value">
                          {shift.breakDuration ?? 0} mins
                        </span>
                      </td>

                      <td>
                        <span className="hrsm-table-value">
                          {shift.lateAllowedMinutes ?? 0} mins
                        </span>
                      </td>

                      <td>
                        {shift.overtimeAllowed ? (
                          <span className="hrsm-badge hrsm-badge-yes">
                            <FiCheckCircle />
                            Yes
                          </span>
                        ) : (
                          <span className="hrsm-badge hrsm-badge-no">
                            No
                          </span>
                        )}
                      </td>

                      <td>
                        <span
                          className={`hrsm-badge ${
                            shift.status === "ACTIVE"
                              ? "hrsm-badge-active"
                              : "hrsm-badge-inactive"
                          }`}
                        >
                          <span className="hrsm-status-dot" />
                          {shift.status || "UNKNOWN"}
                        </span>
                      </td>

                    </tr>
                  ))
                )}

              </tbody>
            </table>

          </div>

          {!listLoading && shifts.length > 0 && (
            <div className="hrsm-table-footer">
              Showing {shifts.length} shift
              {shifts.length !== 1 ? "s" : ""}
            </div>
          )}

        </section>

      </div>
    </div>
  );
};

export default ShiftManagement;
