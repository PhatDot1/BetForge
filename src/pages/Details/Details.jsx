import React from "react";
import "./Details.css";
import { DetailsMainCard, DetailsCard } from "../../components";

const Details = () => {
  return (
    <div
      style={{ display: "flex", flexDirection: "column" }}
      className="details-container"
    >
      <DetailsMainCard />
      <h3
        style={{
          marginLeft: 70,
          marginTop: 30,
          color: "#ff7f00", // Change the color to orange
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

export default Details;
