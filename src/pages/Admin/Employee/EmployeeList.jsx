import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./EmployeeList.css";
import { updateEmployeeStatus } from "../../../services/authService";
import SalaryModal from "../../../components/Admin/Salary/SalaryModal";
const API_URL = import.meta.env.VITE_API_URL;


function EmployeeList() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSalaryEmployeeId, setSelectedSalaryEmployeeId] =
    useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${API_URL}/users/employees`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setEmployees(res.data.data || []);
    } catch (error) {
      console.log(error);
      alert("Unable to fetch employees");
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (id, status) => {
    try {
      await updateEmployeeStatus(id, status);
      fetchEmployees();
    } catch (error) {
      console.log(error);
      alert("Unable To Update Status");
    }
  };

  return (
    <div className="employee-list-page">

      <h2>Employee List</h2>

      <table className="employee-table">

        <thead>
          <tr>
            <th>Employee ID</th>
            <th>Employee Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Department</th>
            <th>Designation</th>
            <th>Joining Date</th>
            <th>System Access</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>

          {loading ? (
            <tr>
              <td colSpan="11" className="emp-state">Loading...</td>
            </tr>
          ) : employees.length === 0 ? (
            <tr>
              <td colSpan="11" className="emp-state">No Employee Found</td>
            </tr>
          ) : (
            employees.map((employee) => (
              <tr key={employee._id}>

                {/* Employee ID */}
                <td className="emp-id">{employee.employeeId || "-"}</td>

                {/* Employee Name */}
                <td className="emp-name">
                  {employee.firstName} {employee.lastName}
                </td>

                {/* Email */}
                <td>{employee.email || "-"}</td>

                {/* Phone */}
                <td>{employee.phone || "-"}</td>

                {/* Role */}
                <td>{employee.role || "-"}</td>

                {/* Department */}
                <td>{employee.department || "-"}</td>

                {/* Designation */}
                <td>{employee.designation || "-"}</td>

                {/* Joining Date */}
                <td>
                  {employee.salaryDetails?.joiningDate
                    ? new Date(
                        employee.salaryDetails.joiningDate
                      ).toLocaleDateString()
                    : "-"}
                </td>

                {/* System Access */}
                <td>
                  <span
                    className={`emp-pill ${
                      employee.hasSystemAccess ? "is-yes" : "is-no"
                    }`}
                  >
                    {employee.hasSystemAccess ? "YES" : "NO"}
                  </span>
                </td>

                {/* Status */}
                <td>
                  <select
                    data-status={employee.status}
                    value={employee.status}
                    onChange={(e) =>
                      changeStatus(employee._id, e.target.value)
                    }
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="BLOCKED">BLOCKED</option>
                    <option value="DELETED">DELETED</option>
                  </select>
                </td>

                {/* Actions */}
                <td>

                  <div className="emp-actions">
                    <button
                      className="btn-edit"
                      onClick={() =>
                        navigate(
                          `/admin/edit-employee/${employee._id}`
                        )
                      }
                    >
                      Edit
                    </button>

                    <button
                      className="btn-salary"
                      onClick={() =>
                        setSelectedSalaryEmployeeId(employee._id)
                      }
                    >
                      Salary
                    </button>
                  </div>

                </td>

              </tr>
            ))
          )}

        </tbody>

      </table>

      {selectedSalaryEmployeeId && (
        <SalaryModal
          employeeId={selectedSalaryEmployeeId}
          onClose={() => setSelectedSalaryEmployeeId(null)}
        />
      )}

    </div>
  );
}

export default EmployeeList;
