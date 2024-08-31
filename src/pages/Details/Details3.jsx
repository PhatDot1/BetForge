import React from "react";
import "./Details.css";
import { DetailsMainCard, DetailsCard } from "../../components";

const Details1 = () => {
  return (
    <div
      style={{ display: "flex", flexDirection: "column" }}
      className="details-container"
    >
      <DetailsMainCard
        highlightText="Future NFT"
        title="The Future Collection"
        description="Explore the cutting-edge of digital art in the Future Collection."
        favoriteArtist="Top Artist"
        artistName="Léa Jacquot"
        imageSrc={null} // You can add a unique image later
      />
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

export default Details1;
