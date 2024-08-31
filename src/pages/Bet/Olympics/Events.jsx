import React, { useState, useContext } from "react";
import axios from "axios";
import { AssetCard } from "../../../components";
import { WalletContext } from "../../../contexts/WalletContext"; // Adjust the import path as necessary
import "./Events.css";

const OlympicEvents = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("All");
  const [sortOption, setSortOption] = useState("A-Z");
  const [showSidebar, setShowSidebar] = useState(true);

  const { walletAddress } = useContext(WalletContext);

  const athletes = [
    { title: "Usain Bolt", event: "100m", price: 0.12, imageSrc: "/path/to/image1.jpg", link: "/bet/olympics/100m" },
    { title: "Tyson Gay", event: "100m", price: 0.13, imageSrc: "/path/to/image2.jpg", link: "/bet/olympics/100m" },
    { title: "Yohan Blake", event: "100m", price: 0.14, imageSrc: "/path/to/image3.jpg", link: "/bet/olympics/100m" },
    { title: "Justin Gatlin", event: "100m", price: 0.15, imageSrc: "/path/to/image4.jpg", link: "/bet/olympics/100m" },
    { title: "Asafa Powell", event: "100m", price: 0.16, imageSrc: "/path/to/image5.jpg", link: "/bet/olympics/100m" },
    { title: "Michael Johnson", event: "200m", price: 0.15, imageSrc: "/path/to/image2.jpg", link: "/bet/olympics/200m" },
    { title: "Frank Fredericks", event: "200m", price: 0.16, imageSrc: "/path/to/image3.jpg", link: "/bet/olympics/200m" },
    { title: "Carl Lewis", event: "200m", price: 0.17, imageSrc: "/path/to/image4.jpg", link: "/bet/olympics/200m" },
    { title: "Allyson Felix", event: "200m", price: 0.18, imageSrc: "/path/to/image5.jpg", link: "/bet/olympics/200m" },
    { title: "Tom Daley", event: "Diving (10m)", price: 0.22, imageSrc: "/path/to/image5.jpg", link: "/bet/olympics/platform-diving" },
    { title: "Chen Aisen", event: "Diving (10m)", price: 0.23, imageSrc: "/path/to/image6.jpg", link: "/bet/olympics/platform-diving" },
    { title: "David Boudia", event: "Diving (10m)", price: 0.24, imageSrc: "/path/to/image7.jpg", link: "/bet/olympics/platform-diving" },
  ];

  // Function to handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Function to handle filter by event
  const handleFilterChange = (event) => {
    setSelectedEvent(event);
  };

  // Function to handle sorting
  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  // Sorting logic
  const sortedAthletes = athletes.sort((a, b) => {
    if (sortOption === "Price: Low to High") {
      return a.price - b.price;
    } else if (sortOption === "Price: High to Low") {
      return b.price - a.price;
    } else if (sortOption === "A-Z") {
      return a.title.localeCompare(b.title);
    } else if (sortOption === "Z-A") {
      return b.title.localeCompare(a.title);
    }
    return 0;
  });

  // Filter athletes based on search query and selected event
  const filteredAthletes = sortedAthletes.filter((athlete) => {
    return (
      (selectedEvent === "All" || athlete.event === selectedEvent) &&
      athlete.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Function to handle minting
  const handleMint = async (athlete) => {
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
        <div className="filter-and-results">
          <button className="toggle-sidebar-btn" onClick={toggleSidebar}>
            {showSidebar ? "Hide Filters" : "Show Filters"}
          </button>
          <p className="results-count">{filteredAthletes.length} Results</p>
        </div>
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
            <option value="Most Favorited">Most Favorited</option>
          </select>
        </div>
      </div>

      <div className="main-content">
        {showSidebar && (
          <div className="sidebar">
            <h2>Filter by Event</h2>
            <button onClick={() => handleFilterChange("All")}>All Events</button>
            <button onClick={() => handleFilterChange("100m")}>100m</button>
            <button onClick={() => handleFilterChange("200m")}>200m</button>
            <button onClick={() => handleFilterChange("Marathon")}>Marathon</button>
            <button onClick={() => handleFilterChange("100m Freestyle")}>100m Freestyle</button>
            <button onClick={() => handleFilterChange("Diving (10m)")}>Diving (10m)</button>
            <button onClick={() => handleFilterChange("Relay")}>Relay</button>
          </div>
        )}
        <div className={`collections-container ${showSidebar ? "" : "full-width"}`}>
          <div className="collections">
            {filteredAthletes.map((athlete, index) => (
              <AssetCard
                key={index}
                title={athlete.title}
                price={`${athlete.price} BTC`}
                imageSrc={athlete.imageSrc}
                link={athlete.link}
                eventType={athlete.event}
                mint={() => handleMint(athlete)} // Pass mint function
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OlympicEvents;
