import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import "./Corporateprofile.css";

const BUSINESS_TYPE_OPTIONS = [
  "PROPRIETORSHIP",
  "PARTNERSHIP",
  "PRIVATE_LIMITED",
  "PUBLIC_LIMITED",
  "LLP",
  "OTHER",
];

const emptyProfile = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  designation: "",
  businessDetails: {
    companyName: "",
    businessType: "",
    gstNumber: "",
    panNumber: "",
    companyEmail: "",
    companyPhone: "",
    companyAddress: "",
    city: "",
    state: "",
    pincode: "",
  },
};

const CorporateProfile = () => {
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/users/profile");
      const result = res.data;

      if (!result.success) {
        throw new Error(result.message || "Failed to load profile");
      }

      const data = result.data || {};

      setProfile({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
        phone: data.phone || "",
        designation: data.designation || "",
        businessDetails: {
          companyName: data.businessDetails?.companyName || "",
          businessType: data.businessDetails?.businessType || "",
          gstNumber: data.businessDetails?.gstNumber || "",
          panNumber: data.businessDetails?.panNumber || "",
          companyEmail: data.businessDetails?.companyEmail || "",
          companyPhone: data.businessDetails?.companyPhone || "",
          companyAddress: data.businessDetails?.companyAddress || "",
          city: data.businessDetails?.city || "",
          state: data.businessDetails?.state || "",
          pincode: data.businessDetails?.pincode || "",
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleBusinessFieldChange = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      businessDetails: { ...prev.businessDetails, [field]: value },
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      // NOTE: backend's updateCustomerProfile currently only persists
      // gender/dob/address/city/state/pincode. businessDetails.* and
      // firstName/lastName/designation need to be added server-side
      // before this save will actually stick for those fields.
      const res = await api.put("/users/profile", profile);
      const result = res.data;

      if (!result.success) {
        throw new Error(result.message || "Failed to update profile");
      }

      setSuccessMsg("Profile updated successfully");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="profile-page profile-loading">Loading profile...</div>;
  }

  return (
    <div className="profile-page">
      {/* Banner: markup-only change (wrapper + subtitle + accent span) */}
      <div className="profile-header">
        <h2 className="profile-title">
          Company <span>profile</span>
        </h2>
        <p className="profile-lead">Keep your contact and company details up to date</p>
      </div>

      {error && <div className="profile-alert profile-alert-error">{error}</div>}
      {successMsg && (
        <div className="profile-alert profile-alert-success">{successMsg}</div>
      )}

      <form className="profile-form" onSubmit={handleSave}>
        <h3 className="profile-section-title">Contact Person</h3>

        <div className="profile-grid">
          <div className="profile-form-row">
            <label>First Name</label>
            <input
              type="text"
              value={profile.firstName}
              onChange={(e) => handleFieldChange("firstName", e.target.value)}
            />
          </div>

          <div className="profile-form-row">
            <label>Last Name</label>
            <input
              type="text"
              value={profile.lastName}
              onChange={(e) => handleFieldChange("lastName", e.target.value)}
            />
          </div>

          <div className="profile-form-row">
            <label>Email</label>
            <input type="email" value={profile.email} disabled />
          </div>

          <div className="profile-form-row">
            <label>Phone</label>
            <input type="text" value={profile.phone} disabled />
          </div>

          <div className="profile-form-row">
            <label>Designation</label>
            <input
              type="text"
              value={profile.designation}
              onChange={(e) => handleFieldChange("designation", e.target.value)}
              placeholder="e.g. IT Manager"
            />
          </div>
        </div>

        <h3 className="profile-section-title">Company Details</h3>

        <div className="profile-grid">
          <div className="profile-form-row">
            <label>Company Name</label>
            <input
              type="text"
              value={profile.businessDetails.companyName}
              onChange={(e) =>
                handleBusinessFieldChange("companyName", e.target.value)
              }
            />
          </div>

          <div className="profile-form-row">
            <label>Business Type</label>
            <select
              value={profile.businessDetails.businessType || ""}
              onChange={(e) =>
                handleBusinessFieldChange("businessType", e.target.value)
              }
            >
              <option value="">Select Business Type</option>
              {BUSINESS_TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          <div className="profile-form-row">
            <label>GST Number</label>
            <input
              type="text"
              value={profile.businessDetails.gstNumber}
              onChange={(e) =>
                handleBusinessFieldChange("gstNumber", e.target.value)
              }
              placeholder="15-character GSTIN"
            />
          </div>

          <div className="profile-form-row">
            <label>PAN Number</label>
            <input
              type="text"
              value={profile.businessDetails.panNumber}
              onChange={(e) =>
                handleBusinessFieldChange("panNumber", e.target.value)
              }
            />
          </div>

          <div className="profile-form-row">
            <label>Company Email</label>
            <input
              type="email"
              value={profile.businessDetails.companyEmail}
              onChange={(e) =>
                handleBusinessFieldChange("companyEmail", e.target.value)
              }
            />
          </div>

          <div className="profile-form-row">
            <label>Company Phone</label>
            <input
              type="text"
              value={profile.businessDetails.companyPhone}
              onChange={(e) =>
                handleBusinessFieldChange("companyPhone", e.target.value)
              }
            />
          </div>

          <div className="profile-form-row profile-form-row-full">
            <label>Company Address</label>
            <input
              type="text"
              value={profile.businessDetails.companyAddress}
              onChange={(e) =>
                handleBusinessFieldChange("companyAddress", e.target.value)
              }
            />
          </div>

          <div className="profile-form-row">
            <label>City</label>
            <input
              type="text"
              value={profile.businessDetails.city}
              onChange={(e) => handleBusinessFieldChange("city", e.target.value)}
            />
          </div>

          <div className="profile-form-row">
            <label>State</label>
            <input
              type="text"
              value={profile.businessDetails.state}
              onChange={(e) => handleBusinessFieldChange("state", e.target.value)}
            />
          </div>

          <div className="profile-form-row">
            <label>Pincode</label>
            <input
              type="text"
              value={profile.businessDetails.pincode}
              onChange={(e) =>
                handleBusinessFieldChange("pincode", e.target.value)
              }
            />
          </div>
        </div>

        <button type="submit" className="profile-save-btn" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default CorporateProfile;
