import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getAllLeaves, approveLeave, rejectLeave } from "../../../services/leaveService";
import "./LeaveRequests.css";

const LeaveRequests = () => {
  // ======================================================
  // STATES
  // ======================================================

  const [leaves, setLeaves] = useState([]);

  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState(false);

  const [selectedLeave, setSelectedLeave] = useState(null);

  const [showModal, setShowModal] = useState(false);

  const [remark, setRemark] = useState("");

  // ======================================================
  // LOAD ALL LEAVE REQUESTS
  // ======================================================

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      console.log("=================================");
      console.log("LOAD ADMIN LEAVE REQUESTS");
      console.log("TOKEN EXISTS:", !!token);
      console.log("=================================");

      const response = await getAllLeaves();

      console.log("ALL LEAVES RESPONSE:", response);

      // --------------------------------------------------
      // SUPPORT DIFFERENT API RESPONSE STRUCTURES
      // --------------------------------------------------

      let list = [];

      if (Array.isArray(response)) {
        list = response;
      } else if (Array.isArray(response?.leaves)) {
        list = response.leaves;
      } else if (Array.isArray(response?.data)) {
        list = response.data;
      } else if (Array.isArray(response?.data?.leaves)) {
        list = response.data.leaves;
      } else if (Array.isArray(response?.data?.data)) {
        list = response.data.data;
      }

      console.log("NORMALIZED LEAVES:", list);

      if (list.length > 0) {
        console.log("FIRST LEAVE:", list[0]);
        console.log("FROM DATE:", list[0]?.fromDate);
        console.log("TO DATE:", list[0]?.toDate);
        console.log("TOTAL DAYS:", list[0]?.totalDays);
      }

      setLeaves(list);
    } catch (error) {
      console.error(
        "LOAD ADMIN LEAVE REQUESTS ERROR:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load leave requests."
      );

      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // DATE FORMAT
  // ======================================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    try {
      const parsedDate = new Date(date);

      if (Number.isNaN(parsedDate.getTime())) {
        return "-";
      }

      return parsedDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      return "-";
    }
  };

  // ======================================================
  // GET EMPLOYEE NAME
  // ======================================================

  const getEmployeeName = (leave) => {
    if (leave?.user?.name) {
      return leave.user.name;
    }

    if (leave?.user?.fullName) {
      return leave.user.fullName;
    }

    if (leave?.user?.firstName || leave?.user?.lastName) {
      return `${leave?.user?.firstName || ""} ${leave?.user?.lastName || ""
        }`.trim();
    }

    if (leave?.employeeName) {
      return leave.employeeName;
    }

    if (leave?.employee?.name) {
      return leave.employee.name;
    }

    if (leave?.employee?.fullName) {
      return leave.employee.fullName;
    }

    if (leave?.employeeId) {
      return leave.employeeId;
    }

    return "Employee";
  };

  // ======================================================
  // GET EMPLOYEE ID
  // ======================================================

  const getEmployeeId = (leave) => {
    if (leave?.employeeId) {
      return leave.employeeId;
    }

    if (leave?.user?.employeeId) {
      return leave.user.employeeId;
    }

    if (leave?.employee?.employeeId) {
      return leave.employee.employeeId;
    }

    return "-";
  };

  // ======================================================
  // LEAVE TYPE LABEL
  // ======================================================

  const formatLeaveType = (type) => {
    if (!type) {
      return "-";
    }

    return String(type)
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  // ======================================================
  // STATUS CLASS
  // ======================================================

  const getStatusClass = (status) => {
    switch (String(status || "").toUpperCase()) {
      case "APPROVED":
        return "approved";

      case "REJECTED":
        return "rejected";

      case "CANCELLED":
        return "cancelled";

      case "PENDING":
      default:
        return "pending";
    }
  };

  // ======================================================
  // OPEN DETAILS
  // ======================================================

  const handleViewDetails = (leave) => {
    setSelectedLeave(leave);

    setRemark(
      leave?.adminRemark ||
      leave?.remark ||
      ""
    );

    setShowModal(true);
  };

  // ======================================================
  // CLOSE DETAILS
  // ======================================================

  const handleCloseModal = () => {
    if (actionLoading) {
      return;
    }

    setShowModal(false);

    setSelectedLeave(null);

    setRemark("");
  };

  // ======================================================
  // APPROVE / REJECT
  // ======================================================

  const handleLeaveAction = async (status) => {
    if (!selectedLeave?._id) {
      toast.error("Leave request ID is missing.");
      return;
    }

    if (actionLoading) {
      return;
    }

    const normalizedStatus =
      String(status).toUpperCase();

    if (
      normalizedStatus !== "APPROVED" &&
      normalizedStatus !== "REJECTED"
    ) {
      toast.error("Invalid leave action.");
      return;
    }

    try {
      setActionLoading(true);

      console.log("=================================");
      console.log("LEAVE ACTION");
      console.log("ID:", selectedLeave._id);
      console.log("ACTION:", normalizedStatus);
      console.log("REMARK:", remark);
      console.log("=================================");

      const response =
        normalizedStatus === "APPROVED"
          ? await approveLeave(selectedLeave._id, remark.trim())
          : await rejectLeave(selectedLeave._id, remark.trim());

      console.log(
        "LEAVE ACTION RESPONSE:",
        response
      );

      toast.success(
        response?.message ||
        `Leave request ${normalizedStatus === "APPROVED"
          ? "approved"
          : "rejected"
        } successfully.`
      );

      // --------------------------------------------------
      // CLOSE MODAL
      // --------------------------------------------------

      setShowModal(false);

      setSelectedLeave(null);

      setRemark("");

      // --------------------------------------------------
      // RELOAD LIST
      // --------------------------------------------------

      await loadLeaves();
    } catch (error) {
      console.error(
        "LEAVE ACTION ERROR:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update leave request."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div className="leave-requests">

        <div className="leave-requests-header">
          <div>
            <h2>Leave Requests</h2>

            <p>
              Review and manage employee leave requests.
            </p>
          </div>
        </div>

        <div className="leave-loading" role="status">
          <div className="leave-loading-spinner">
            ⏳
          </div>

          <p>
            Loading leave requests...
          </p>
        </div>

      </div>
    );
  }

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="leave-requests">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="leave-requests-header">

        <div>
          <h2>
            Leave Requests
          </h2>

          <p>
            Review and manage employee leave requests.
          </p>
        </div>

        <button
          type="button"
          className="leave-refresh-btn"
          onClick={loadLeaves}
          disabled={loading || actionLoading}
        >
          ↻ Refresh
        </button>

      </div>


      {/* ==================================================
          REQUEST COUNT
      ================================================== */}

      <div className="leave-request-count">
        <strong>
          {leaves.length}
        </strong>

        <span>
          {leaves.length === 1
            ? " Leave Request"
            : " Leave Requests"}
        </span>
      </div>


      {/* ==================================================
          EMPTY STATE
      ================================================== */}

      {leaves.length === 0 ? (
        <div className="leave-empty">

          <div className="leave-empty-icon">
            📋
          </div>

          <h3>
            No Leave Requests
          </h3>

          <p>
            Employee leave requests will appear here.
          </p>

          <button
            type="button"
            className="leave-refresh-btn"
            onClick={loadLeaves}
          >
            ↻ Refresh
          </button>

        </div>
      ) : (

        /* ==================================================
           TABLE
        ================================================== */

        <div className="leave-table-wrapper">

          <table className="leave-table">

            <thead>

              <tr>

                <th>
                  Employee
                </th>

                <th>
                  Employee ID
                </th>

                <th>
                  Leave Type
                </th>

                <th>
                  From Date
                </th>

                <th>
                  To Date
                </th>

                <th>
                  Total Days
                </th>

                <th>
                  Reason
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

              {leaves.map((leave) => (

                <tr key={leave._id}>

                  {/* EMPLOYEE */}

                  <td data-label="Employee">

                    <div className="employee-cell">

                      <div className="employee-avatar">
                        {getEmployeeName(
                          leave
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>

                        <strong>
                          {getEmployeeName(
                            leave
                          )}
                        </strong>

                      </div>

                    </div>

                  </td>


                  {/* EMPLOYEE ID */}

                  <td data-label="Employee ID">
                    {getEmployeeId(leave)}
                  </td>


                  {/* LEAVE TYPE */}

                  <td data-label="Leave Type">

                    <span className="leave-type-badge">

                      {formatLeaveType(
                        leave.leaveType
                      )}

                    </span>

                  </td>


                  {/* FROM DATE */}

                  <td data-label="From">

                    <div className="date-cell">

                      <span className="date-label">
                        From
                      </span>

                      <strong>
                        {formatDate(
                          leave.fromDate
                        )}
                      </strong>

                    </div>

                  </td>


                  {/* TO DATE */}

                  <td data-label="To">

                    <div className="date-cell">

                      <span className="date-label">
                        To
                      </span>

                      <strong>
                        {formatDate(
                          leave.toDate
                        )}
                      </strong>

                    </div>

                  </td>


                  {/* TOTAL DAYS */}

                  <td data-label="Total Days">

                    <span className="days-badge">

                      {leave.totalDays ||
                        0}

                      {" "}

                      {Number(
                        leave.totalDays || 0
                      ) === 1
                        ? "Day"
                        : "Days"}

                    </span>

                  </td>


                  {/* REASON */}

                  <td data-label="Reason">

                    <div className="reason-cell">

                      {leave.reason
                        ? leave.reason
                        : "-"}

                    </div>

                  </td>


                  {/* STATUS */}

                  <td data-label="Status">

                    <span
                      className={`status-badge ${getStatusClass(
                        leave.status
                      )}`}
                    >

                      {formatLeaveType(
                        leave.status ||
                        "PENDING"
                      )}

                    </span>

                  </td>


                  {/* ACTION */}

                  <td data-label="Action">

                    <button
                      type="button"
                      className="view-leave-btn"
                      onClick={() =>
                        handleViewDetails(
                          leave
                        )
                      }
                    >
                      View
                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}


      {/* ==================================================
          DETAILS MODAL
      ================================================== */}

      {showModal &&
        selectedLeave && (

          <div
            className="leave-modal-overlay"
            onMouseDown={(event) => {

              if (
                event.target ===
                event.currentTarget
              ) {
                handleCloseModal();
              }

            }}
          >

            <div className="leave-modal" role="dialog" aria-modal="true">

              {/* MODAL HEADER */}

              <div className="leave-modal-header">

                <div>

                  <h3>
                    Leave Request Details
                  </h3>

                  <p>
                    Review employee leave information.
                  </p>

                </div>

                <button
                  type="button"
                  className="leave-modal-close"
                  onClick={
                    handleCloseModal
                  }
                  disabled={
                    actionLoading
                  }
                  aria-label="Close"
                >
                  ×
                </button>

              </div>


              {/* MODAL BODY */}

              <div className="leave-modal-body">

                {/* EMPLOYEE */}

                <div className="detail-section">

                  <h4>
                    Employee Information
                  </h4>

                  <div className="detail-grid">

                    <div className="detail-item">

                      <span>
                        Employee
                      </span>

                      <strong>
                        {getEmployeeName(
                          selectedLeave
                        )}
                      </strong>

                    </div>


                    <div className="detail-item">

                      <span>
                        Employee ID
                      </span>

                      <strong>
                        {getEmployeeId(
                          selectedLeave
                        )}
                      </strong>

                    </div>

                  </div>

                </div>


                {/* LEAVE INFORMATION */}

                <div className="detail-section">

                  <h4>
                    Leave Information
                  </h4>

                  <div className="detail-grid">

                    {/* TYPE */}

                    <div className="detail-item">

                      <span>
                        Leave Type
                      </span>

                      <strong>
                        {formatLeaveType(
                          selectedLeave.leaveType
                        )}
                      </strong>

                    </div>


                    {/* FROM */}

                    <div className="detail-item">

                      <span>
                        From Date
                      </span>

                      <strong>
                        {formatDate(
                          selectedLeave.fromDate
                        )}
                      </strong>

                    </div>


                    {/* TO */}

                    <div className="detail-item">

                      <span>
                        To Date
                      </span>

                      <strong>
                        {formatDate(
                          selectedLeave.toDate
                        )}
                      </strong>

                    </div>


                    {/* TOTAL DAYS */}

                    <div className="detail-item">

                      <span>
                        Total Days
                      </span>

                      <strong>
                        {selectedLeave.totalDays ||
                          0}

                        {" "}

                        {Number(
                          selectedLeave.totalDays ||
                          0
                        ) === 1
                          ? "Day"
                          : "Days"}
                      </strong>

                    </div>


                    {/* STATUS */}

                    <div className="detail-item">

                      <span>
                        Status
                      </span>

                      <strong
                        className={`status-text ${getStatusClass(
                          selectedLeave.status
                        )}`}
                      >
                        {formatLeaveType(
                          selectedLeave.status ||
                          "PENDING"
                        )}
                      </strong>

                    </div>

                  </div>

                </div>


                {/* REASON */}

                <div className="detail-section">

                  <h4>
                    Leave Reason
                  </h4>

                  <div className="leave-reason-box">

                    {selectedLeave.reason ||
                      "No reason provided."}

                  </div>

                </div>


                {/* EXISTING ADMIN REMARK */}

                {selectedLeave.adminRemark && (

                  <div className="detail-section">

                    <h4>
                      Admin Remark
                    </h4>

                    <div className="leave-remark-box">

                      {
                        selectedLeave.adminRemark
                      }

                    </div>

                  </div>

                )}


                {/* ACTION REMARK */}

                {String(
                  selectedLeave.status ||
                  "PENDING"
                ).toUpperCase() ===
                  "PENDING" && (

                    <div className="detail-section">

                      <h4>
                        Admin Remark
                      </h4>

                      <textarea
                        value={remark}
                        onChange={(event) =>
                          setRemark(
                            event.target.value
                          )
                        }
                        placeholder="Enter remark for employee..."
                        rows={4}
                        disabled={
                          actionLoading
                        }
                        className="leave-remark-input"
                      />

                    </div>

                  )}

              </div>


              {/* MODAL FOOTER */}

              <div className="leave-modal-footer">

                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={
                    handleCloseModal
                  }
                  disabled={
                    actionLoading
                  }
                >
                  Close
                </button>


                {/* ONLY PENDING REQUEST CAN BE ACTIONED */}

                {String(
                  selectedLeave.status ||
                  "PENDING"
                ).toUpperCase() ===
                  "PENDING" && (

                    <div className="modal-action-buttons">

                      <button
                        type="button"
                        className="reject-btn"
                        onClick={() =>
                          handleLeaveAction(
                            "REJECTED"
                          )
                        }
                        disabled={
                          actionLoading
                        }
                      >

                        {actionLoading
                          ? "Processing..."
                          : "✕ Reject"}

                      </button>


                      <button
                        type="button"
                        className="approve-btn"
                        onClick={() =>
                          handleLeaveAction(
                            "APPROVED"
                          )
                        }
                        disabled={
                          actionLoading
                        }
                      >

                        {actionLoading
                          ? "Processing..."
                          : "✓ Approve"}

                      </button>

                    </div>

                  )}

              </div>

            </div>

          </div>

        )}

    </div>
  );
};

export default LeaveRequests;
