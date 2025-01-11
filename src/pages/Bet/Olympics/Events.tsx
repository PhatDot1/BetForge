import React, { useState, useContext } from "react";
import axios from "axios";
import { WalletContext } from "../../../contexts/WalletContext";
import { motion } from "framer-motion";
import "./Events.css";

import avatarsq from "../../../assets/avatarsq.png";
import TysonGay from "../../../assets/Tyson_Gay.jpg";
import YohanBlake from "../../../assets/Yohan_Blake.jpg";
import JustinGatlin from "../../../assets/Justin_Gatlin.jpg";
import AsafaPowell from "../../../assets/Asafa_Powell.jpg";
import MichaelJohnson from "../../../assets/Michael_Johnson.jpg";
import FrankFredericks from "../../../assets/Frank_Fredericks.jpg";
import CarlLewis from "../../../assets/Carl_Lewis.jpg";
import AllysonFelix from "../../../assets/Allyson_Felix.jpg";
import TomDaley from "../../../assets/Tom_Daley.jpg";
import ChenAisen from "../../../assets/Chen_Aisen.jpg";
import DavidBoudia from "../../../assets/David_Boudia.jpg";

const athletes = [
  { title: "Usain Bolt", event: "100m", price: 0.12, imageSrc: avatarsq, link: "/bet/olympics/100m" },
  { title: "Tyson Gay", event: "100m", price: 0.13, imageSrc: TysonGay, link: "/bet/olympics/100m" },
  { title: "Yohan Blake", event: "100m", price: 0.14, imageSrc: YohanBlake, link: "/bet/olympics/100m" },
  { title: "Justin Gatlin", event: "100m", price: 0.15, imageSrc: JustinGatlin, link: "/bet/olympics/100m" },
  { title: "Asafa Powell", event: "100m", price: 0.16, imageSrc: AsafaPowell, link: "/bet/olympics/100m" },
  { title: "Michael Johnson", event: "200m", price: 0.15, imageSrc: MichaelJohnson, link: "/bet/olympics/200m" },
  { title: "Frank Fredericks", event: "200m", price: 0.16, imageSrc: FrankFredericks, link: "/bet/olympics/200m" },
  { title: "Carl Lewis", event: "200m", price: 0.17, imageSrc: CarlLewis, link: "/bet/olympics/200m" },
  { title: "Allyson Felix", event: "200m", price: 0.18, imageSrc: AllysonFelix, link: "/bet/olympics/200m" },
  { title: "Tom Daley", event: "Diving (10m)", price: 0.22, imageSrc: TomDaley, link: "/bet/olympics/platform-diving" },
  { title: "Chen Aisen", event: "Diving (10m)", price: 0.23, imageSrc: ChenAisen, link: "/bet/olympics/platform-diving" },
  { title: "David Boudia", event: "Diving (10m)", price: 0.24, imageSrc: DavidBoudia, link: "/bet/olympics/platform-diving" },
];

const OlympicEvents: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("All");
  const [sortOption, setSortOption] = useState("A-Z");

  const { walletAddress } = useContext(WalletContext);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (event: string) => {
    setSelectedEvent(event);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value);
  };

  const sortedAthletes = [...athletes].sort((a, b) => {
    if (sortOption === "Price: Low to High") return a.price - b.price;
    if (sortOption === "Price: High to Low") return b.price - a.price;
    if (sortOption === "A-Z") return a.title.localeCompare(b.title);
    if (sortOption === "Z-A") return b.title.localeCompare(a.title);
    return 0;
  });

  const filteredAthletes = sortedAthletes.filter((athlete) => {
    return (
      (selectedEvent === "All" || athlete.event === selectedEvent) &&
      athlete.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleMint = async (athlete: typeof athletes[0]) => {
    if (!walletAddress) {
      alert("Please connect your wallet first.");
      return;
    }

    try {
      const response = await axios.post("/mintWormholeNFT", {
        name: athlete.title,
        imageSrc: athlete.imageSrc,
        walletAddress: walletAddress,
      });

      if (response.data.success) {
        console.log("NFT minted successfully:", response.data);
      } else {
        console.error("Minting failed:", response.data.error);
      }
    } catch (error) {
      console.error("Minting error:", error);
    }
  };

  return (
    <div className="page-container">
      <h1 className="main-heading">Olympics</h1>
      <h2 className="sub-heading">Upcoming Events:</h2>

      <div className="top-bar">
        <div className="search-and-sort">
          <input
            type="text"
            className="search-bar"
            placeholder="Search by athlete name"
            value={searchQuery}
            onChange={handleSearch}
          />
          <select className="sort-dropdown" value={sortOption} onChange={handleSortChange}>
            <option value="A-Z">A-Z</option>
            <option value="Z-A">Z-A</option>
            <option value="Price: Low to High">Price: Low to High</option>
            <option value="Price: High to Low">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="main-content">
        <div className="sidebar">
          <h2>Filter by Event</h2>
          <button onClick={() => handleFilterChange("All")}>All Events</button>
          <button onClick={() => handleFilterChange("100m")}>100m</button>
          <button onClick={() => handleFilterChange("200m")}>200m</button>
          <button onClick={() => handleFilterChange("Diving (10m)")}>Diving (10m)</button>
        </div>

        <div className="collections-container">
          <div className="collections">
            {filteredAthletes.map((athlete, index) => (
              <motion.div
                key={athlete.title}
                className="card-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <img src={athlete.imageSrc} alt={athlete.title} className="card-image" />
                <div className="card-details">
                  <h3 className="card-name">{athlete.title}</h3>
                  <p className="card-event">{athlete.event}</p>
                  <p className="card-price">{athlete.price} ETH</p>
                </div>
                <button className="mint-btn" onClick={() => handleMint(athlete)}>
                  Mint NFT
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OlympicEvents;