import React, { useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { NFTCardFooterSell } from "../../components/NFTCard/NFTCardFooterSell";
import { erc721Abi } from "viem";
import "./MyCollection.css";
import { chainToChainConfig } from "../../Config";

const MyCollection = () => {
  const { address, chain } = useAccount();
  const publicClient = usePublicClient();
  const [userNFTs, setUserNFTs] = useState([]);

  useEffect(() => {
    const fetchNFTs = async () => {
      if (address && chain) {
        // Fetch NFTs owned by the user
        const nftContract = {
          address: chainToChainConfig(chain).wrappedNFT,
          abi: erc721Abi,
        };

        const balance = await publicClient.readContract({
          ...nftContract,
          functionName: "balanceOf",
          args: [address],
        });

        const nfts = [];
        for (let i = 0; i < balance; i++) {
          const tokenId = await publicClient.readContract({
            ...nftContract,
            functionName: "tokenOfOwnerByIndex",
            args: [address, i],
          });

          const tokenURI = await publicClient.readContract({
            ...nftContract,
            functionName: "tokenURI",
            args: [tokenId],
          });

          nfts.push({ id: tokenId, uri: tokenURI });
        }

        setUserNFTs(nfts);
      }
    };

    fetchNFTs();
  }, [address, chain, publicClient]);

  return (
    <div className="my-collection-container">
      <h1>My Collection</h1>
      {userNFTs.map((nft, index) => (
        <div key={index} className="nft-card">
          <NFTCardFooterSell nft={nft} />
        </div>
      ))}
    </div>
  );
};

export default MyCollection;
