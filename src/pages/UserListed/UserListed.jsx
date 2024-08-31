import React, { useEffect, useState } from "react";
import { usePublicClient, useAccount } from "wagmi";
import { marketAbi } from "../../abi/market"; 
import { NFTCardFooterBuy } from "../../components/NFTCard/NFTCardFooterBuy";
import { chainToChainConfig } from "../../Config";
import "./UserListed.css";

const UserListed = () => {
  const publicClient = usePublicClient();
  const { chain } = useAccount();
  const [listedNFTs, setListedNFTs] = useState([]);

  useEffect(() => {
    const fetchListedNFTs = async () => {
      if (!chain) return;

      const marketAddress = chainToChainConfig(chain).market;

      const listings = await publicClient.readContract({
        address: marketAddress,
        abi: marketAbi,
        functionName: "getAllActiveListings", // Use the new function
      });

      setListedNFTs(listings);
    };

    fetchListedNFTs();
  }, [publicClient, chain]);

  return (
    <div className="user-listed-container">
      <h1>Available NFTs</h1>
      {listedNFTs.map((nft, index) => (
        <div key={index} className="nft-card">
          <NFTCardFooterBuy nft={nft} nftPrice={nft.price} />
        </div>
      ))}
    </div>
  );
};

export default UserListed;
