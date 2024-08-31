import React from "react";
import "./Footer.css";
import { FaFacebookF, FaTwitter, FaDiscord, FaInstagram } from "react-icons/fa";

const Footer = () => {
  return (
    <div className="footer-container">
      <h3>Betforge</h3>
      <div className="icons-container">
        <a href="https://www.facebook.com/" target="_blank">
          <FaFacebookF />
        </a>
        <a href="https://twitter.com/" target="_blank">
          <FaTwitter />
        </a>
        <a href="https://discord.com/" target="_blank">
          <FaDiscord />
        </a>
        <a href="https://www.instagram.com/" target="_blank">
          <FaInstagram />
        </a>
      </div>
    </div>
  );
};

export default Footer;
