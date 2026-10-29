import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./SalaryPage.css";

import {
  getAllSalaryData,
  exportSalaryExcel,
} from "../../../services/salary.api";

import { toast } from "react-toastify";

import SalaryModal from "./SalaryModal.jsx";


// ======================================================
// HELPERS
// ======================================================

// ------------------------------------------------------
// INITIALS
// ------------------------------------------------------

const getInitials = (name) => {
  const value = String(name || "").trim();

  if (!value) return "-";

  const parts = value.split(/\s+/);

  const first = parts[0]?.[0] || "";

  const second =
    parts.length > 1
      ? parts[parts.length - 1]?.[0] || ""
      : "";

  return (
    first + second
  ).toUpperCase();
};


// ------------------------------------------------------
// NORMALIZE STRING
// ------------------------------------------------------

const normalizeValue = (value) => {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
};


// ======================================================
// EMPLOYEE ONLY FILTER
// ======================================================
//
// IMPORTANT:
//
// Salary API currently appears to return both:
// - Employees
// - Customers
//
// This function guarantees that CUSTOMER records
// are NOT displayed in Salary Management.
//
// ======================================================

const isEmployeeRecord = (item) => {
  if (!item || typeof item !== "object") {
    return false;
  }

  // ----------------------------------------------------
  // ALL POSSIBLE ROLE / TYPE / DEPARTMENT VALUES
  // ----------------------------------------------------

  const department = normalizeValue(
    item?.department
  );

  const departmentName = normalizeValue(
    item?.departmentName
  );

  const role = normalizeValue(
    item?.role
  );

  const userRole = normalizeValue(
    item?.user?.role
  );

  const userType = normalizeValue(
    item?.user?.userType
  );

  const accountType = normalizeValue(
    item?.accountType
  );

  const userAccountType = normalizeValue(
    item?.user?.accountType
  );

  const employeeType = normalizeValue(
    item?.employeeType
  );

  const customerType = normalizeValue(
    item?.customerType
  );

  const type = normalizeValue(
    item?.type
  );


  // ----------------------------------------------------
  // CUSTOMER DEPARTMENT
  // ----------------------------------------------------

  if (
    department === "CUSTOMER" ||
    departmentName === "CUSTOMER"
  ) {
    return false;
  }


  // ----------------------------------------------------
  // CUSTOMER ROLE
  // ----------------------------------------------------

  if (
    role === "CUSTOMER" ||
    userRole === "CUSTOMER"
  ) {
    return false;
  }


  // ----------------------------------------------------
  // CUSTOMER USER TYPE
  // ----------------------------------------------------

  if (
    userType === "CUSTOMER" ||
    accountType === "CUSTOMER" ||
    userAccountType === "CUSTOMER"
  ) {
    return false;
  }


  // ----------------------------------------------------
  // CUSTOMER TYPE
  // ----------------------------------------------------

  if (
    customerType === "CUSTOMER" ||
    type === "CUSTOMER"
  ) {
    return false;
  }


  // ----------------------------------------------------
  // EXPLICIT CUSTOMER FLAGS
  // ----------------------------------------------------

  if (
    item?.isCustomer === true ||
    item?.user?.isCustomer === true
  ) {
    return false;
  }


  // ----------------------------------------------------
  // CUSTOMER ID
  //
  // If a record has customerId but no employee identity,
  // treat it as a customer record.
  // ----------------------------------------------------

  const employeeId =
    item?.employeeId ||
    item?.employeeCode ||
    item?.employeeNumber ||
    item?.user?.employeeId ||
    item?.user?.employeeCode ||
    item?.user?.employeeNumber;

  const customerId =
    item?.customerId ||
    item?.customer?.customerId ||
    item?.user?.customerId;


  if (
    customerId &&
    !employeeId
  ) {
    return false;
  }


  // ----------------------------------------------------
  // CUSTOMER OBJECT
  // ----------------------------------------------------

  if (
    item?.customer &&
    !employeeId
  ) {
    return false;
  }


  // ----------------------------------------------------
  // EMPLOYEE RECORD
  //
  // If it reached here, it is not identified as a
  // customer, so allow it.
  // ----------------------------------------------------

  return true;
};


// ======================================================
// FILTER ARRAY TO EMPLOYEES ONLY
// ======================================================

const filterEmployeesOnly = (list) => {
  if (!Array.isArray(list)) {
    return [];
  }

  const employeeList = list.filter(
    (item) => isEmployeeRecord(item)
  );

  console.log(
    "SALARY API TOTAL RECORDS:",
    list.length
  );

  console.log(
    "SALARY EMPLOYEE RECORDS:",
    employeeList.length
  );

  console.log(
    "SALARY CUSTOMER RECORDS REMOVED:",
    list.length - employeeList.length
  );

  return employeeList;
};


// ======================================================
// ICONS
// ======================================================

const IconRefresh = () => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-2.64-6.36" />

    <polyline points="21 3 21 9 15 9" />
  </svg>
);


const IconExport = () => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />

    <polyline points="14 2 14 8 20 8" />

    <path d="M8 13h8M8 17h5" />
  </svg>
);


const IconPrint = () => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 6 2 18 2 18 9" />

    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />

    <rect
      x="6"
      y="14"
      width="12"
      height="8"
    />
  </svg>
);


const IconSearch = () => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle
      cx="11"
      cy="11"
      r="8"
    />

    <line
      x1="21"
      y1="21"
      x2="16.65"
      y2="16.65"
    />
  </svg>
);


// ======================================================
// SALARY PAGE
// ======================================================

const SalaryPage = () => {

  const [employees, setEmployees] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [selectedEmployeeId, setSelectedEmployeeId] =
    useState(null);


  // ====================================================
  // LOAD SALARY DATA
  // ====================================================

  const loadSalaryData = async () => {

    try {

      setLoading(true);


      const res =
        await getAllSalaryData();


      console.log(
        "========================================"
      );

      console.log(
        "SALARY API RESPONSE"
      );

      console.log(
        res
      );

      console.log(
        "========================================"
      );


      // ------------------------------------------------
      // SUPPORT MULTIPLE RESPONSE FORMATS
      // ------------------------------------------------

      let salaryList = [];


      // Format:
      // {
      //   success: true,
      //   data: [...]
      // }

      if (
        Array.isArray(
          res?.data
        )
      ) {

        salaryList =
          res.data;

      }


      // Format:
      // Axios response:
      // {
      //   data: {
      //     success: true,
      //     data: [...]
      //   }
      // }

      else if (
        Array.isArray(
          res?.data?.data
        )
      ) {

        salaryList =
          res.data.data;

      }


      // Format:
      // {
      //   employees: [...]
      // }

      else if (
        Array.isArray(
          res?.employees
        )
      ) {

        salaryList =
          res.employees;

      }


      // Format:
      // {
      //   data: {
      //     employees: [...]
      //   }
      // }

      else if (
        Array.isArray(
          res?.data?.employees
        )
      ) {

        salaryList =
          res.data.employees;

      }


      // Format:
      // direct array

      else if (
        Array.isArray(res)
      ) {

        salaryList =
          res;

      }


      console.log(
        "SALARY RAW LIST:",
        salaryList
      );


      // =================================================
      // MOST IMPORTANT PART
      //
      // ONLY EMPLOYEES
      // CUSTOMER RECORDS REMOVED HERE
      // =================================================

      const employeeOnlyList =
        filterEmployeesOnly(
          salaryList
        );


      console.log(
        "FINAL EMPLOYEE LIST:",
        employeeOnlyList
      );


      setEmployees(
        employeeOnlyList
      );


      // ------------------------------------------------
      // IF API SUCCESS BUT NO EMPLOYEE
      // ------------------------------------------------

      if (
        salaryList.length > 0 &&
        employeeOnlyList.length === 0
      ) {

        toast.warning(
          "No employee salary records found."
        );

      }

    } catch (error) {

      console.error(
        "SALARY LOADING ERROR:",
        error
      );


      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Unable to load salary data";


      toast.error(
        message
      );


      setEmployees([]);

    } finally {

      setLoading(false);

    }

  };


  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {

    loadSalaryData();

  }, []);


  // ====================================================
  // FILTER EMPLOYEES
  // ====================================================

  const filteredEmployees =
    useMemo(() => {

      const searchValue =
        search
          .trim()
          .toLowerCase();


      if (!searchValue) {

        return employees;

      }


      return employees.filter(
        (item) => {

          const employeeName =
            String(
              item?.employeeName ||
              item?.name ||
              `${item?.firstName || ""} ${
                item?.lastName || ""
              }`
            ).toLowerCase();


          const email =
            String(
              item?.email ||
              item?.user?.email ||
              ""
            ).toLowerCase();


          const department =
            String(
              item?.department ||
              item?.departmentName ||
              ""
            ).toLowerCase();


          const designation =
            String(
              item?.designation ||
              item?.role ||
              ""
            ).toLowerCase();


          const employeeId =
            String(
              item?.employeeId ||
              item?.employeeCode ||
              item?.employeeNumber ||
              item?.user?.employeeId ||
              ""
            ).toLowerCase();


          return (
            employeeName.includes(
              searchValue
            ) ||

            email.includes(
              searchValue
            ) ||

            department.includes(
              searchValue
            ) ||

            designation.includes(
              searchValue
            ) ||

            employeeId.includes(
              searchValue
            )
          );

        }
      );

    }, [
      employees,
      search,
    ]);


  // ====================================================
  // SUMMARY
  // ====================================================

  const totalEmployees =
    filteredEmployees.length;


  const totalSalary =
    filteredEmployees.reduce(
      (
        sum,
        item
      ) =>
        sum +
        Number(
          item?.baseSalary ||
          item?.monthlySalary ||
          item?.salary ||
          0
        ),
      0
    );


  const totalPaid =
    filteredEmployees.reduce(
      (
        sum,
        item
      ) =>
        sum +
        Number(
          item?.totalPaidAmount ||
          item?.paidAmount ||
          0
        ),
      0
    );


  const pendingAmount =
    Math.max(
      totalSalary -
      totalPaid,
      0
    );


  // ====================================================
  // PRINT
  // ====================================================

  const printSalaryReport = () => {

    window.print();

  };


  // ====================================================
  // EXPORT EXCEL
  // ====================================================

  const handleExport = async () => {

    try {

      await exportSalaryExcel();


      toast.success(
        "Salary Excel exported successfully"
      );

    } catch (error) {

      console.error(
        "Excel export error:",
        error
      );


      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        "Unable to export salary Excel"
      );

    }

  };


  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {

    return (

      <div className="salary-loading" role="status">

        <span className="salary-loading-spinner" />

        Loading salary details...

      </div>

    );

  }


  // ====================================================
  // UI
  // ====================================================

  return (

    <div className="salary-page">


      {/* ================================================
          HEADER
      ================================================ */}

      <div className="salary-header">

        <div>

          <h1>
            Employee Salary Management
          </h1>

          <p>
            Manage Salary Configuration,
            Salary Payment,
            History & Reports
          </p>

        </div>


        <div className="salary-actions">

          <button
            type="button"
            onClick={
              loadSalaryData
            }
            className="salary-btn salary-btn-ghost"
          >

            <IconRefresh />

            Refresh

          </button>


          <button
            type="button"
            onClick={
              handleExport
            }
            className="salary-btn salary-btn-ghost"
          >

            <IconExport />

            Export Excel

          </button>


          <button
            type="button"
            onClick={
              printSalaryReport
            }
            className="salary-btn salary-btn-primary"
          >

            <IconPrint />

            Print Report

          </button>

        </div>

      </div>


      {/* ================================================
          SUMMARY CARDS
      ================================================ */}

      <div className="salary-cards">


        <div className="salary-card">

          <span>
            Total Employees
          </span>

          <h2>
            {totalEmployees}
          </h2>

        </div>


        <div className="salary-card">

          <span>
            Grand Salary
          </span>

          <h2>

            ₹
            {totalSalary.toLocaleString(
              "en-IN"
            )}

          </h2>

        </div>


        <div className="salary-card salary-card-accent">

          <span>
            Total Paid
          </span>

          <h2>

            ₹
            {totalPaid.toLocaleString(
              "en-IN"
            )}

          </h2>

        </div>


        <div className="salary-card">

          <span>
            Pending Salary
          </span>

          <h2>

            ₹
            {pendingAmount.toLocaleString(
              "en-IN"
            )}

          </h2>

        </div>

      </div>


      {/* ================================================
          SEARCH
      ================================================ */}

      <div className="salary-search">

        <IconSearch />

        <input
          type="text"
          placeholder="Search Employee..."
          aria-label="Search employee"
          value={search}
          onChange={
            (event) =>
              setSearch(
                event.target.value
              )
          }
        />

      </div>


      {/* ================================================
          TABLE
      ================================================ */}

      <div className="salary-table-wrap">

        <table className="salary-table">

          <thead>

            <tr>

              <th>
                Employee ID
              </th>

              <th>
                Employee Name
              </th>

              <th>
                Department
              </th>

              <th>
                Designation
              </th>

              <th className="col-center">
                Salary
              </th>

              <th className="col-center">
                Type
              </th>

              <th className="col-center">
                Status
              </th>

              <th className="col-center">
                Action
              </th>

            </tr>

          </thead>


          <tbody>


            {filteredEmployees.length === 0 ? (

              <tr className="salary-empty-row">

                <td
                  colSpan="8"
                  className="salary-empty"
                >

                  No Employee Found

                </td>

              </tr>

            ) : (

              filteredEmployees.map(
                (emp) => (

                  <tr
                    key={
                      emp?._id ||
                      emp?.employeeId
                    }
                  >


                    {/* =================================
                        EMPLOYEE ID
                    ================================= */}

                    <td
                      data-label="Employee ID"
                      className="salary-id"
                    >

                      {
                        emp?.employeeId ||
                        emp?.employeeCode ||
                        emp?.employeeNumber ||
                        emp?.user?.employeeId ||
                        "-"
                      }

                    </td>


                    {/* =================================
                        EMPLOYEE
                    ================================= */}

                    <td
                      data-label="Employee Name"
                      className="salary-employee-cell"
                    >

                      <div className="salary-employee">


                        <span className="salary-avatar">

                          {getInitials(
                            emp?.employeeName ||
                            emp?.name ||
                            `${emp?.firstName || ""} ${
                              emp?.lastName || ""
                            }`
                          )}

                        </span>


                        <div>

                          <div className="salary-employee-name">

                            {
                              emp?.employeeName ||
                              emp?.name ||
                              `${emp?.firstName || ""} ${
                                emp?.lastName || ""
                              }`.trim() ||
                              "-"
                            }

                          </div>


                          <div className="salary-employee-email">

                            {
                              emp?.email ||
                              emp?.user?.email ||
                              "-"
                            }

                          </div>

                        </div>

                      </div>

                    </td>


                    {/* =================================
                        DEPARTMENT
                    ================================= */}

                    <td
                      data-label="Department"
                    >

                      {
                        emp?.department ||
                        emp?.departmentName ||
                        "-"
                      }

                    </td>


                    {/* =================================
                        DESIGNATION
                    ================================= */}

                    <td
                      data-label="Designation"
                    >

                      {
                        emp?.designation ||
                        emp?.role ||
                        "-"
                      }

                    </td>


                    {/* =================================
                        SALARY
                    ================================= */}

                    <td
                      data-label="Salary"
                      className="col-center"
                    >

                      <span className="salary-amount">

                        ₹
                        {Number(
                          emp?.baseSalary ||
                          emp?.monthlySalary ||
                          emp?.salary ||
                          0
                        ).toLocaleString(
                          "en-IN"
                        )}

                      </span>

                    </td>


                    {/* =================================
                        SALARY TYPE
                    ================================= */}

                    <td
                      data-label="Type"
                      className="col-center"
                    >

                      <span className="salary-type-badge">

                        {
                          emp?.salaryType ||
                          emp?.salaryMode ||
                          "-"
                        }

                      </span>

                    </td>


                    {/* =================================
                        STATUS
                    ================================= */}

                    <td
                      data-label="Status"
                      className="col-center"
                    >

                      <span
                        className={`salary-status ${
                          normalizeValue(
                            emp?.status
                          ) === "ACTIVE"
                            ? "is-active"
                            : "is-inactive"
                        }`}
                      >

                        <span className="salary-status-dot" />

                        {
                          emp?.status ||
                          "UNKNOWN"
                        }

                      </span>

                    </td>


                    {/* =================================
                        ACTION
                    ================================= */}

                    <td
                      data-label="Action"
                      className="col-center"
                    >

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedEmployeeId(
                            emp?._id
                          )
                        }
                        className="salary-manage-btn"
                      >

                        Pay / Manage

                      </button>

                    </td>

                  </tr>

                )
              )

            )}

          </tbody>

        </table>

      </div>


      {/* ================================================
          BOTTOM SUMMARY
      ================================================ */}

      <div className="salary-footer">


        <div>

          <h3>
            Total Employees
          </h3>

          <p className="salary-footer-count">

            {filteredEmployees.length}

          </p>

        </div>


        <div className="salary-footer-total">

          <h3>
            Pending Amount
          </h3>

          <p className="salary-footer-amount">

            ₹
            {pendingAmount.toLocaleString(
              "en-IN"
            )}

          </p>

        </div>

      </div>


      {/* ================================================
          SALARY MODAL
      ================================================ */}

      {selectedEmployeeId && (

        <SalaryModal
          employeeId={
            selectedEmployeeId
          }
          onClose={() => {

            setSelectedEmployeeId(
              null
            );

            loadSalaryData();

          }}
        />

      )}

    </div>

  );

};


export default SalaryPage;
