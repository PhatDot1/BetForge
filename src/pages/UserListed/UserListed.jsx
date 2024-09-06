import React from "react";
import "./UserListed.css";
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
      <h3 className="my-assets-header">My Assets</h3>
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
    </div>
  );
};

export default MyCollection;
