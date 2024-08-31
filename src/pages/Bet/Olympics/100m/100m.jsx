import React from "react";
import "./100m.css";
import { DetailsCard } from "../../../../components"; // Import only DetailsCard

const Olympic100m = () => {
  return (
    <div
      style={{ display: "flex", flexDirection: "column" }}
      className="details-container"
    >
      <h1
        style={{
          marginLeft: 70,
          marginTop: 50,
          color: "#ffffff", // Main heading color
          fontSize: 36,
          fontWeight: 800,
        }}
      >
        Olympics
      </h1>
      <h2
        style={{
          marginLeft: 70,
          marginTop: 20,
          color: "#ff7f00", // Subheading color
          fontSize: 28,
          fontWeight: 700,
        }}
      >
        Upcoming Events:
      </h2>
      <h3
        style={{
          marginLeft: 70,
          marginTop: 30,
          color: "#ff7f00", // Updated color to orange
          fontSize: 24,
          fontWeight: 800,
        }}
      >
        NFTs
      </h3>
      <div className="collections">
        <DetailsCard />
        <DetailsCard />
        <DetailsCard />
        <DetailsCard />
        <DetailsCard />
        <DetailsCard />
      </div>
    </div>
  );
};

export default Olympic100m;
