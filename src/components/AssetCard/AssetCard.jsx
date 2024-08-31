import React from "react";
import { Link } from "react-router-dom";
import { FaLongArrowAltRight } from "react-icons/fa";

const AssetCard = ({ title, price, imageSrc, link, eventType, artistName, mint }) => {
  return (
    <div className="card-container" style={{ paddingBottom: 20 }}>
      <Link
        to={link} // Dynamic link
      >
        <img
          src={imageSrc} // Dynamic image source
          alt={title}
          style={{ borderRadius: 12, maxHeight: 360 }}
        />
      </Link>
      <button className="card-btn" onClick={mint}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
          }}
        >
          <p style={{ fontSize: 16 }}>Buy</p>
          <FaLongArrowAltRight />
        </div>
      </button>
      <div className="card-details">
        <div className="card-header">
          <h2 className="card-name">{title}</h2>
          <p className="card-price" style={{ backgroundColor: "#ff7f00" }}>
            {price}
          </p>
        </div>
        <p style={{ color: "#b0b0b0", fontSize: 14 }}>{eventType}</p>
        <div className="profile-container" style={{ margin: "18px 0" }}>
          <div className="artist-name" style={{ color: "#ffffff" }}>{artistName}</div>
        </div>
      </div>
    </div>
  );
};

export default AssetCard;
