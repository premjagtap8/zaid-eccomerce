import React, { useState } from "react";

import "./AddAddress.css";

import { useNavigate } from "react-router-dom";

import { createAddress } from "../../../services/addressService";
import { toast } from "react-toastify";

const AddAddress = () => {

    const navigate = useNavigate();

    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({

        type: "HOME",

        fullName: "",

        phone: "",

        addressLine: "",

        city: "",

        state: "",

        pincode: "",

        country: "India",

        landmark: ""

    });


    // ==========================================
    // VALIDATE FORM
    // ==========================================

    const validateForm = () => {

        const newErrors = {};

        const fullName = formData.fullName.trim();

        if (fullName.length < 3 || fullName.length > 50) {
            newErrors.fullName = "Full name must be between 3 and 50 characters";
        }
        else if (!/^[A-Za-z]+([\s'-][A-Za-z]+)*$/.test(fullName)) {
            newErrors.fullName = "Full name should only contain letters, spaces, hyphens, or apostrophes";
        }

        if (!/^[6-9]\d{9}$/.test(formData.phone)) {
            newErrors.phone = "Enter a valid 10-digit mobile number";
        }

        if (formData.addressLine.trim().length < 5) {
            newErrors.addressLine = "Address must be at least 5 characters";
        }

        if (!/^[A-Za-z\s]{2,}$/.test(formData.city.trim())) {
            newErrors.city = "Enter a valid city name";
        }

        if (!/^[A-Za-z\s]{2,}$/.test(formData.state.trim())) {
            newErrors.state = "Enter a valid state name";
        }

        if (!/^\d{6}$/.test(formData.pincode)) {
            newErrors.pincode = "Enter a valid 6-digit pincode";
        }

        if (formData.country.trim().length === 0) {
            newErrors.country = "Country is required";
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;

    };


    const handleChange = (e) => {

        setFormData({

            ...formData,

            [e.target.name]: e.target.value

        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {

            await createAddress(formData);

           toast.success("Address Added Successfully");

            navigate("/my-address");

        }

        catch (error) {

            console.log(error);

            toast.error(error.response?.data?.message || "Something went wrong");

        }

    };

    return (

        <div className="add-address-page">

            {/* HERO (title) */}

            <div className="add-address-hero">

                <h2 className="add-address-title">

                    Add New <span>Address</span>

                </h2>

                <p className="add-address-subtitle">

                    Save a delivery address for your orders

                </p>

            </div>

            <form
                className="address-form"
                onSubmit={handleSubmit}
            >

                {/* FORM CARD HEADER */}

                <div className="address-form-header">

                    <h3 className="address-form-title">Address details</h3>

                    <p className="address-form-sub">Fields are checked when you save</p>

                </div>

                <select
                    name="type"
                    aria-label="Address type"
                    value={formData.type}
                    onChange={handleChange}
                >

                    <option value="HOME">Home</option>

                    <option value="OFFICE">Office</option>

                    <option value="OTHER">Other</option>

                </select>

                <div className="field-wrap">

                    <input
                        type="text"
                        name="fullName"
                        aria-label="Full name"
                        placeholder="Full Name"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                    />

                    {errors.fullName && <p className="form-error">{errors.fullName}</p>}

                </div>

                <div className="field-wrap">

                    <input
                        type="text"
                        name="phone"
                        aria-label="Phone number"
                        placeholder="Phone Number"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                    />

                    {errors.phone && <p className="form-error">{errors.phone}</p>}

                </div>

                <div className="field-wrap field-wrap-full">

                    <textarea
                        name="addressLine"
                        aria-label="Address"
                        placeholder="Address"
                        value={formData.addressLine}
                        onChange={handleChange}
                        required
                    />

                    {errors.addressLine && <p className="form-error">{errors.addressLine}</p>}

                </div>

                <div className="field-wrap">

                    <input
                        type="text"
                        name="city"
                        aria-label="City"
                        placeholder="City"
                        value={formData.city}
                        onChange={handleChange}
                        required
                    />

                    {errors.city && <p className="form-error">{errors.city}</p>}

                </div>

                <div className="field-wrap">

                    <input
                        type="text"
                        name="state"
                        aria-label="State"
                        placeholder="State"
                        value={formData.state}
                        onChange={handleChange}
                        required
                    />

                    {errors.state && <p className="form-error">{errors.state}</p>}

                </div>

                <div className="field-wrap">

                    <input
                        type="text"
                        name="pincode"
                        aria-label="Pincode"
                        placeholder="Pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        required
                    />

                    {errors.pincode && <p className="form-error">{errors.pincode}</p>}

                </div>

                <div className="field-wrap">

                    <input
                        type="text"
                        name="country"
                        aria-label="Country"
                        placeholder="Country"
                        value={formData.country}
                        onChange={handleChange}
                    />

                    {errors.country && <p className="form-error">{errors.country}</p>}

                </div>

                <input
                    type="text"
                    name="landmark"
                    aria-label="Landmark"
                    placeholder="Landmark"
                    value={formData.landmark}
                    onChange={handleChange}
                />

                <button type="submit">

                    Save Address

                </button>

            </form>

        </div>

    );

};

export default AddAddress;
