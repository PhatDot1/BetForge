import React from "react";
import { Link } from "react-router-dom";  // Import Link from react-router-dom
import "./SlidingCard.css";
import olympicsImage from "../../assets/olympics.jpg";
import avatar from "../../assets/avatar.png";
import ProgressBar from "../ProgressBar/ProgressBar";

const SlidingCard = () => {
  return (
    <>
      <div className="progress-bars-container">
        <ProgressBar />
        <ProgressBar />
        <ProgressBar />
        <ProgressBar />
        <ProgressBar />
      </div>
      <div className="slide-card-container">
        <div className="content-container">
          <p className="trending">Trending Now</p>
          <h2>Olympic Events</h2>
          <h3>Bet on Your Champion</h3>
          <div className="profile-container">
            <img src={avatar} alt="profile" style={{ width: 68, height: 68 }} />
            <div className="profile-details">
              <div className="artist">Current Event</div>
              <div className="artist-name">100m Sprint</div>
            </div>
          </div>
          <div className="btns-container">
            <Link to="/bet/olympics/100m" className="buy-btn">
              Buy NFT
            </Link>
            <Link to="/bet/olympics" className="collections-btn">
              See Other Events
            </Link>
          </div>
        </div>
        <img
          src={olympicsImage}
          className="olympics-image"
          alt="Olympics NFT"
        />
      </div>
    </>
  );
};

export default SlidingCard;
