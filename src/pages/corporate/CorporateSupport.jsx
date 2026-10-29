import React from "react";
import "./CorporateSupport.css";

const LOCATIONS = [
  {
    name: "ZAID INFOTECH - Corporate Office & Main Branch",
    address: "232, 1st Floor, M.K.N Road, Alandur, Chennai - 600016",
    phones: ["+91 90925 90725"],
  },
  {
    name: "ZAID EXCLUSIVE STORE",
    address: "229, 1st Floor, M.K.N Road, Alandur, Chennai - 600016",
    phones: ["+91 97871 93871"],
  },
  {
    name: "ZAID INFOTECH Warehouse & Service Centre",
    address:
      "New No. 36, Old No. 44, Ponni Amman Koil Street, Alandur, Chennai - 600016",
    phones: ["+91 99626 20202", "+91 70106 27010"],
  },
  {
    name: "ZAID INFOTECH SERVICE CENTRE - MOUNT ROAD",
    address:
      "Old No. 20, New No. 41, R.A. Complex, 2nd Floor, Meeran Sahib Street, Mount Road, Chennai - 600002",
    phones: ["+91 84280 58428", "+91 84281 58428"],
  },
];

const SUPPORT_LINES = [
  {
    title: "Service & Warranty",
    phones: ["+91 70106 27010"],
  },
  {
    title: "Laptop Rentals & Bulk Orders",
    phones: ["+91 97871 92871", "+91 97871 93871"],
  },
];

const telHref = (phone) => `tel:${phone.replace(/\s+/g, "")}`;

const PhoneLinks = ({ phones }) => (
  <div className="contact-phones">
    {phones.map((phone) => (
      <a key={phone} href={telHref(phone)}>
        {phone}
      </a>
    ))}
  </div>
);

const CorporateSupport = () => {
  return (
    <div className="support-page">
      {/* Banner: markup-only change (wrapper + subtitle + accent span) */}
      <div className="support-header">
        <h2 className="support-title">
          Contact <span>us</span>
        </h2>
        <p className="support-lead">Call our team for service, rentals and bulk orders</p>
      </div>

      <h3 className="support-subtitle">Customer Support</h3>
      <div className="contact-grid contact-grid--support">
        {SUPPORT_LINES.map((line) => (
          <div className="contact-card" key={line.title}>
            <h4 className="contact-card-title">{line.title}</h4>
            <PhoneLinks phones={line.phones} />
          </div>
        ))}
      </div>

      <h3 className="support-subtitle">Our Locations</h3>
      <div className="contact-grid">
        {LOCATIONS.map((loc) => (
          <div className="contact-card" key={loc.name}>
            <h4 className="contact-card-title">{loc.name}</h4>
            <p className="contact-address">{loc.address}</p>
            <PhoneLinks phones={loc.phones} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CorporateSupport;
