import React from "react";
import stars from "../../assets/stars.jpg"; // Default image
import avatar from "../../assets/avatar.png";

const DetailsMainCard = ({ highlightText, title, description, favoriteArtist, artistName, imageSrc }) => {
  return (
    <div
      className="slide-card-container"
      style={{ marginTop: 120, backgroundColor: "rgba(0, 0, 0, 0)" }}
    >
      <div className="content-container">
        <p className="trending">{highlightText || "Highlight"}</p>
        <h2>{title || "Something something"}</h2>
        <h3>{description || "Make this unique for every collection"}</h3>
        <div style={{width: "100%", color: "#23252B", maxWidth: 630, paddingBottom: 20, marginRight: 10 }}>
        </div>
        <div className="profile-container">
          <img src={avatar} alt="profile" style={{ width: 68, height: 68 }} />
          <div className="profile-details">
            <div className="artist">{favoriteArtist || "Current Favorite"}</div>
            <div className="artist-name">{artistName || "Usain Bolt"}</div>
          </div>
        </div>
      </div>
      <img
        src={imageSrc || stars} // Use the passed image or default to stars
        style={{
          width: 437,
          height: 411,
          borderRadius: 52,
          marginLeft: "auto",
        }}
        alt="thumbnail"
      />
    </div>
  );
};

export default DetailsMainCard;
