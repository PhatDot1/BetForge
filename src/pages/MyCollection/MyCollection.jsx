import React from "react";
import { Link } from "react-router-dom"; // Import Link for navigation
import "./MyCollection.css";
import placeholderNFT from "../../assets/placeholderNFT.gif"; // Adjust the path according to your project structure

const MyCollection = () => {
  // Simulating a single placeholder NFT for the showcase
  const placeholderNFTs = [
    {
      id: "1", // This is just a placeholder ID
      uri: placeholderNFT,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <h3
        style={{
          marginLeft: 70,
          marginTop: 30,
          color: "#ff7f00",
          fontSize: 24,
          fontWeight: 800,
        }}
      >
        My Assets
      </h3>
      <div className="collections">
        {placeholderNFTs.length > 0 ? (
          placeholderNFTs.map((nft, index) => (
            <div key={index} className="nft-card">
              <img src={nft.uri} alt={`NFT ${nft.id}`} className="nft-image" />
              <p className="nft-id">NFT ID: {nft.id}</p>
            </div>
          ))
        ) : (
          <p>No NFTs found in your collection.</p>
        )}
      </div>
      {/* Add a "Combine" button here */}
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <Link to="/combine">
          <button className="combine-button" style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer" }}>
            Combine
          </button>
        </Link>
      </div>
    </div>
  );
};

export default MyCollection;
