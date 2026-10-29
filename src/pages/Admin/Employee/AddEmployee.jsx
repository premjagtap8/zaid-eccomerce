import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createEmployee } from "../../../services/authService";
import { getShifts } from "../../../services/shiftService";
import "./AddEmployee.css";
import { toast } from "react-toastify";

// ======================================================
// DEFAULT SHIFTS
// ======================================================

const DEFAULT_SHIFTS = [
    {
        _id: "650000000000000000000001",
        name: "Morning Shift",
        startTime: "09:00 AM",
        endTime: "05:00 PM",
    },
    {
        _id: "650000000000000000000002",
        name: "Evening Shift",
        startTime: "02:00 PM",
        endTime: "10:00 PM",
    },
    {
        _id: "650000000000000000000003",
        name: "Night Shift",
        startTime: "10:00 PM",
        endTime: "06:00 AM",
    },
];

// ======================================================
// EMPTY EMPLOYEE
// ======================================================

const EMPTY_EMPLOYEE = {
    hasSystemAccess: true,

    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",

    role: "SALES",

    department: "FRONT_DESK",
    designation: "",

    salaryType: "MONTHLY",
    amount: "",
    joiningDate: "",

    biometricId: "",
    shift: "",

    bankDetails: {
        accountHolderName: "",
        accountNumber: "",
        ifscCode: "",
        bankName: "",
        branchName: "",
        accountType: "SAVINGS",
    },
};

function AddEmployee() {

    // ======================================================
    // NAVIGATE
    // ======================================================

    const navigate = useNavigate();

    // ======================================================
    // STATES
    // ======================================================

    const [shifts, setShifts] = useState([]);

    const [employee, setEmployee] =
        useState(EMPTY_EMPLOYEE);

    const [submitting, setSubmitting] =
        useState(false);

    // ======================================================
    // FETCH SHIFTS
    // ======================================================

    useEffect(() => {

        const fetchShifts = async () => {

            try {

                const res = await getShifts();

                const shiftList =
                    res?.data?.data ||
                    res?.data ||
                    [];

                setShifts(
                    Array.isArray(shiftList)
                        ? shiftList
                        : []
                );

            } catch (error) {

                console.error(
                    "Failed to fetch shifts:",
                    error
                );

                setShifts([]);

            }

        };

        fetchShifts();

    }, []);

    // ======================================================
    // AVAILABLE SHIFTS
    // ======================================================

    const availableShifts =
        shifts.length > 0
            ? shifts
            : DEFAULT_SHIFTS;

    // ======================================================
    // NORMAL INPUT CHANGE
    // ======================================================

    const handleChange = (e) => {

        const {
            name,
            value,
            type,
            checked,
        } = e.target;

        setEmployee((prev) => ({
            ...prev,

            [name]:
                type === "checkbox"
                    ? checked
                    : value,
        }));

    };

    // ======================================================
    // BANK INPUT CHANGE
    // ======================================================

    const handleBankChange = (e) => {

        const {
            name,
            value,
        } = e.target;

        setEmployee((prev) => ({
            ...prev,

            bankDetails: {
                ...prev.bankDetails,

                [name]:
                    name === "ifscCode"
                        ? value.toUpperCase()
                        : value,
            },
        }));

    };

    // ======================================================
    // VALIDATE BANK DETAILS
    // ======================================================

    const validateBankDetails = () => {

        const bank =
            employee.bankDetails;

        const hasAnyBankValue =
            bank.accountHolderName.trim() ||
            bank.accountNumber.trim() ||
            bank.ifscCode.trim() ||
            bank.bankName.trim() ||
            bank.branchName.trim();

        // No bank data entered
        if (!hasAnyBankValue) {
            return true;
        }

        if (!bank.accountHolderName.trim()) {

            toast.error(
                "Please enter account holder name"
            );

            return false;
        }

        if (!bank.accountNumber.trim()) {

            toast.error(
                "Please enter account number"
            );

            return false;
        }

        if (!bank.ifscCode.trim()) {

            toast.error(
                "Please enter IFSC code"
            );

            return false;
        }

        if (!bank.bankName.trim()) {

            toast.error(
                "Please enter bank name"
            );

            return false;
        }

        return true;
    };

    // ======================================================
    // SUBMIT
    // ======================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (submitting) {
            return;
        }

        // ==================================================
        // BASIC VALIDATION
        // ==================================================

        if (!employee.firstName.trim()) {

            toast.error(
                "Please enter first name"
            );

            return;
        }

        if (!employee.lastName.trim()) {

            toast.error(
                "Please enter last name"
            );

            return;
        }

        if (!employee.phone.trim()) {

            toast.error(
                "Please enter phone number"
            );

            return;
        }

        // ==================================================
        // PHONE VALIDATION
        // ==================================================

        if (
            !/^[6-9]\d{9}$/.test(
                employee.phone.trim()
            )
        ) {

            toast.error(
                "Please enter valid 10 digit phone number"
            );

            return;
        }

        // ==================================================
        // SYSTEM ACCESS VALIDATION
        // ==================================================

        if (employee.hasSystemAccess) {

            if (!employee.email.trim()) {

                toast.error(
                    "Please enter email"
                );

                return;
            }

            if (!employee.password.trim()) {

                toast.error(
                    "Please enter password"
                );

                return;
            }

            if (!employee.role) {

                toast.error(
                    "Please select employee role"
                );

                return;
            }

        }

        // ==================================================
        // EMAIL VALIDATION
        // ==================================================

        if (employee.email.trim()) {

            const emailRegex =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (
                !emailRegex.test(
                    employee.email.trim()
                )
            ) {

                toast.error(
                    "Please enter valid email address"
                );

                return;
            }
        }

        // ==================================================
        // DESIGNATION
        // ==================================================

        if (!employee.designation.trim()) {

            toast.error(
                "Please enter designation"
            );

            return;
        }

        // ==================================================
        // SALARY
        // ==================================================

        if (!employee.amount) {

            toast.error(
                "Please enter salary amount"
            );

            return;
        }

        if (
            Number(employee.amount) <= 0
        ) {

            toast.error(
                "Salary amount must be greater than 0"
            );

            return;
        }

        // ==================================================
        // JOINING DATE
        // ==================================================

        if (!employee.joiningDate) {

            toast.error(
                "Please select joining date"
            );

            return;
        }

        // ==================================================
        // BANK VALIDATION
        // ==================================================

        if (!validateBankDetails()) {
            return;
        }

        // ==================================================
        // BANK DETAILS
        // ==================================================

        const bank =
            employee.bankDetails;

        const hasBankDetails =
            Boolean(
                bank.accountHolderName.trim() ||
                bank.accountNumber.trim() ||
                bank.ifscCode.trim() ||
                bank.bankName.trim() ||
                bank.branchName.trim()
            );

        // ==================================================
        // PAYLOAD
        // ==================================================

        const payload = {

            hasSystemAccess:
                Boolean(
                    employee.hasSystemAccess
                ),

            firstName:
                employee.firstName.trim(),

            lastName:
                employee.lastName.trim(),

            phone:
                employee.phone.trim(),

            designation:
                employee.designation.trim(),

            department:
                employee.department,

            salaryDetails: {

                salaryType:
                    employee.salaryType,

                amount:
                    Number(employee.amount),

                joiningDate:
                    employee.joiningDate,

            },

            biometricId:
                employee.biometricId
                    ? String(
                        employee.biometricId
                    )
                    : undefined,

            shift:
                employee.shift
                    ? employee.shift
                    : null,

            ...(employee.email.trim()
                ? {
                    email:
                        employee.email.trim(),
                }
                : {}),

            ...(hasBankDetails
                ? {

                    bankDetails: {

                        accountHolderName:
                            bank.accountHolderName.trim(),

                        accountNumber:
                            bank.accountNumber.trim(),

                        ifscCode:
                            bank.ifscCode
                                .trim()
                                .toUpperCase(),

                        bankName:
                            bank.bankName.trim(),

                        branchName:
                            bank.branchName.trim(),

                        accountType:
                            bank.accountType ||
                            "SAVINGS",

                    },

                }
                : {}),
        };

        // ==================================================
        // SYSTEM ACCESS
        // ==================================================

        if (
            employee.hasSystemAccess
        ) {

            payload.password =
                employee.password;

            payload.role =
                employee.role;
        }

        // ==================================================
        // API CALL
        // ==================================================

        try {

            setSubmitting(true);

            console.log(
                "===================================="
            );

            console.log(
                "CREATE EMPLOYEE PAYLOAD:",
                payload
            );

            console.log(
                "===================================="
            );

            const res =
                await createEmployee(
                    payload
                );

            console.log(
                "CREATE EMPLOYEE RESPONSE:",
                res
            );

            // ==================================================
            // SUCCESS
            // ==================================================

            toast.success(
                res?.data?.message ||
                "Employee created successfully!"
            );

            // ==================================================
            // IMPORTANT:
            // ONLY SYSTEM ACCESS EMPLOYEE NEEDS EMAIL VERIFY
            // ==================================================

            if (
                employee.hasSystemAccess
            ) {

                const verificationEmail =
                    res?.data?.data?.email ||
                    res?.data?.email ||
                    res?.data?.user?.email ||
                    payload.email;

                if (!verificationEmail) {

                    toast.error(
                        "Employee created but verification email was not found."
                    );

                    return;
                }

                // ==================================================
                // SAVE EMAIL
                // ==================================================

                localStorage.setItem(
                    "verificationEmail",
                    verificationEmail
                );

                // ==================================================
                // CLEAR OLD OTP
                // ==================================================

                localStorage.removeItem(
                    "verificationOtp"
                );

                // ==================================================
                // GO TO VERIFY PAGE
                // ==================================================

                setTimeout(() => {

                    navigate(
                        "/verify-email"
                    );

                }, 500);

            } else {

                // ==================================================
                // NO SYSTEM ACCESS
                // NO LOGIN / NO EMAIL VERIFICATION PAGE
                // ==================================================

                setEmployee({

                    ...EMPTY_EMPLOYEE,

                    bankDetails: {

                        accountHolderName: "",
                        accountNumber: "",
                        ifscCode: "",
                        bankName: "",
                        branchName: "",
                        accountType: "SAVINGS",

                    },

                });

            }

        } catch (error) {

            console.error(
                "===================================="
            );

            console.error(
                "CREATE EMPLOYEE ERROR:",
                error
            );

            console.error(
                "CREATE EMPLOYEE ERROR RESPONSE:",
                error?.response?.data
            );

            console.error(
                "===================================="
            );

            const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Unable To Create Employee";

            toast.error(message);

        } finally {

            setSubmitting(false);

        }

    };

    // ======================================================
    // SYSTEM ACCESS / DEPARTMENT
    // ======================================================

    useEffect(() => {

        setEmployee((prev) => ({

            ...prev,

            department:
                prev.hasSystemAccess

                    ? prev.department ===
                        "OTHER"

                        ? "FRONT_DESK"

                        : prev.department

                    : "OTHER",

        }));

    }, [
        employee.hasSystemAccess,
    ]);

    // ======================================================
    // UI
    // ======================================================

    return (

        <div className="add-employee-page">

            <div className="employee-box">

                <div className="employee-head">

                    <h2>
                        Create Employee
                    </h2>

                    <p>
                        Add a new team member, set their
                        access, salary and bank details.
                    </p>

                </div>

                <form
                    onSubmit={
                        handleSubmit
                    }
                >

                    {/* =========================================
                        SYSTEM ACCESS
                    ========================================= */}

                    <div className="form-row">

                        <label>

                            <input
                                type="checkbox"
                                name="hasSystemAccess"
                                checked={
                                    employee.hasSystemAccess
                                }
                                onChange={
                                    handleChange
                                }
                            />

                            <span>
                                Employee can Login
                            </span>

                        </label>

                    </div>

                    {/* =========================================
                        BASIC DETAILS
                    ========================================= */}

                    <h3 className="form-section-title">
                        Personal details
                    </h3>

                    <div className="field">

                        <label>
                            First Name
                            <span className="req">*</span>
                        </label>

                        <input
                            type="text"
                            name="firstName"
                            placeholder="First Name"
                            value={
                                employee.firstName
                            }
                            onChange={
                                handleChange
                            }
                            required
                        />

                    </div>

                    <div className="field">

                        <label>
                            Last Name
                            <span className="req">*</span>
                        </label>

                        <input
                            type="text"
                            name="lastName"
                            placeholder="Last Name"
                            value={
                                employee.lastName
                            }
                            onChange={
                                handleChange
                            }
                            required
                        />

                    </div>

                    <div className="field">

                        <label>
                            Phone
                            <span className="req">*</span>
                        </label>

                        <input
                            type="text"
                            name="phone"
                            placeholder="Phone"
                            value={
                                employee.phone
                            }
                            onChange={
                                handleChange
                            }
                            maxLength={10}
                            inputMode="numeric"
                            required
                        />

                    </div>

                    <div className="field">

                        <label>
                            Email
                            {employee.hasSystemAccess && (
                                <span className="req">*</span>
                            )}
                        </label>

                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={
                                employee.email
                            }
                            onChange={
                                handleChange
                            }
                            required={
                                employee.hasSystemAccess
                            }
                        />

                    </div>

                    {/* =========================================
                        LOGIN DETAILS
                    ========================================= */}

                    {employee.hasSystemAccess && (

                        <>

                            <div className="field">

                                <label>
                                    Password
                                    <span className="req">*</span>
                                </label>

                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Password"
                                    value={
                                        employee.password
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                            </div>

                            {/* ROLE */}

                            <div className="field">

                                <label>
                                    Role
                                </label>

                                <select
                                    name="role"
                                    value={
                                        employee.role
                                    }
                                    onChange={
                                        handleChange
                                    }
                                >

                                    <option value="ADMIN">
                                        Admin
                                    </option>

                                    <option value="SALES">
                                        Sales
                                    </option>

                                    <option value="TECHNICIAN">
                                        Technician
                                    </option>

                                    <option value="INVENTORY">
                                        Inventory
                                    </option>

                                    <option value="ACCOUNTANT">
                                        Accountant
                                    </option>

                                    <option value="HR_EXECUTIVE">
                                        HR
                                    </option>

                                    <option value="IT_SUPPORT">
                                        IT SUPPORT
                                    </option>

                                    <option value="OTHER">
                                        Other
                                    </option>

                                </select>

                            </div>

                        </>

                    )}

                    {/* =========================================
                        JOB DETAILS
                    ========================================= */}

                    <h3 className="form-section-title">
                        Job details
                    </h3>

                    {/* DEPARTMENT */}

                    <div className="field">

                        <label>
                            Department
                        </label>

                        <select
                            name="department"
                            value={
                                employee.department
                            }
                            onChange={
                                handleChange
                            }
                        >

                            {employee.hasSystemAccess ? (

                                <>

                                    <option value="ADMINISTRATION">
                                        Administration
                                    </option>

                                    <option value="FRONT_DESK">
                                        Front Desk
                                    </option>

                                    <option value="REPAIR">
                                        Repair
                                    </option>

                                    <option value="INVENTORY">
                                        Inventory
                                    </option>

                                    <option value="ACCOUNTS">
                                        Accounts
                                    </option>

                                    <option value="HR">
                                        HR
                                    </option>

                                    <option value="IT_SUPPORT">
                                        IT SUPPORT
                                    </option>

                                </>

                            ) : (

                                <option value="OTHER">
                                    Other
                                </option>

                            )}

                        </select>

                    </div>

                    {/* DESIGNATION */}

                    <div className="field">

                        <label>
                            Designation
                            <span className="req">*</span>
                        </label>

                        <input
                            type="text"
                            name="designation"
                            placeholder="Designation"
                            value={
                                employee.designation
                            }
                            onChange={
                                handleChange
                            }
                            required
                        />

                    </div>

                    {/* BIOMETRIC */}

                    <div className="field">

                        <label>
                            Biometric ID
                        </label>

                        <input
                            type="text"
                            name="biometricId"
                            placeholder="Biometric ID"
                            value={
                                employee.biometricId
                            }
                            onChange={
                                handleChange
                            }
                        />

                    </div>

                    {/* SHIFT */}

                    <div className="field">

                        <label>
                            Shift
                        </label>

                        <select
                            name="shift"
                            value={
                                employee.shift
                            }
                            onChange={
                                handleChange
                            }
                        >

                            <option value="">
                                Select Shift Time
                            </option>

                            {availableShifts.map(
                                (s) => (

                                    <option
                                        key={
                                            s._id
                                        }
                                        value={
                                            s._id
                                        }
                                    >

                                        {s.name ||
                                            "Shift"}

                                        {" ("}

                                        {s.startTime}

                                        {" - "}

                                        {s.endTime}

                                        {")"}

                                    </option>

                                )
                            )}

                        </select>

                    </div>

                    {/* =========================================
                        SALARY
                    ========================================= */}

                    <h3 className="form-section-title">
                        Salary
                    </h3>

                    <div className="field">

                        <label>
                            Salary Type
                        </label>

                        <select
                            name="salaryType"
                            value={
                                employee.salaryType
                            }
                            onChange={
                                handleChange
                            }
                        >

                            <option value="MONTHLY">
                                Monthly
                            </option>

                            <option value="DAILY">
                                Daily
                            </option>

                        </select>

                    </div>

                    <div className="field">

                        <label>
                            Salary Amount
                            <span className="req">*</span>
                        </label>

                        <input
                            type="number"
                            name="amount"
                            placeholder="Salary Amount"
                            value={
                                employee.amount
                            }
                            onChange={
                                handleChange
                            }
                            min="0"
                            required
                        />

                    </div>

                    <div className="field">

                        <label>
                            Joining Date
                            <span className="req">*</span>
                        </label>

                        <input
                            type="date"
                            name="joiningDate"
                            value={
                                employee.joiningDate
                            }
                            onChange={
                                handleChange
                            }
                            required
                        />

                    </div>

                    {/* =========================================
                        BANK DETAILS
                    ========================================= */}

                    <div className="bank-details-section">

                        <div className="bank-head">

                            <h3>
                                Bank Details
                            </h3>

                            <p>
                                Add employee bank
                                account details for
                                salary payment.
                            </p>

                        </div>

                        <div className="bank-grid">

                            {/* ACCOUNT HOLDER */}

                            <div className="field">

                                <label>
                                    Account Holder Name
                                </label>

                                <input
                                    type="text"
                                    name="accountHolderName"
                                    placeholder="Account Holder Name"
                                    value={
                                        employee
                                            .bankDetails
                                            .accountHolderName
                                    }
                                    onChange={
                                        handleBankChange
                                    }
                                />

                            </div>

                            {/* BANK NAME */}

                            <div className="field">

                                <label>
                                    Bank Name
                                </label>

                                <input
                                    type="text"
                                    name="bankName"
                                    placeholder="Bank Name"
                                    value={
                                        employee
                                            .bankDetails
                                            .bankName
                                    }
                                    onChange={
                                        handleBankChange
                                    }
                                />

                            </div>

                            {/* ACCOUNT NUMBER */}

                            <div className="field">

                                <label>
                                    Account Number
                                </label>

                                <input
                                    type="text"
                                    name="accountNumber"
                                    placeholder="Account Number"
                                    value={
                                        employee
                                            .bankDetails
                                            .accountNumber
                                    }
                                    onChange={
                                        handleBankChange
                                    }
                                    inputMode="numeric"
                                />

                            </div>

                            {/* IFSC */}

                            <div className="field">

                                <label>
                                    IFSC Code
                                </label>

                                <input
                                    type="text"
                                    name="ifscCode"
                                    placeholder="IFSC Code"
                                    value={
                                        employee
                                            .bankDetails
                                            .ifscCode
                                    }
                                    onChange={
                                        handleBankChange
                                    }
                                />

                            </div>

                            {/* BRANCH */}

                            <div className="field">

                                <label>
                                    Branch Name
                                </label>

                                <input
                                    type="text"
                                    name="branchName"
                                    placeholder="Branch Name"
                                    value={
                                        employee
                                            .bankDetails
                                            .branchName
                                    }
                                    onChange={
                                        handleBankChange
                                    }
                                />

                            </div>

                            {/* ACCOUNT TYPE */}

                            <div className="field">

                                <label>
                                    Account Type
                                </label>

                                <select
                                    name="accountType"
                                    value={
                                        employee
                                            .bankDetails
                                            .accountType
                                    }
                                    onChange={
                                        handleBankChange
                                    }
                                >

                                    <option value="SAVINGS">
                                        Savings Account
                                    </option>

                                    <option value="CURRENT">
                                        Current Account
                                    </option>

                                </select>

                            </div>

                        </div>

                    </div>

                    {/* =========================================
                        SUBMIT
                    ========================================= */}

                    <button
                        type="submit"
                        disabled={
                            submitting
                        }
                    >

                        {submitting

                            ? "Creating Employee..."

                            : employee.hasSystemAccess
                                ? "Create Employee & Verify Email"
                                : "Create Employee"

                        }

                    </button>

                </form>

            </div>

        </div>

    );
}

export default AddEmployee;
