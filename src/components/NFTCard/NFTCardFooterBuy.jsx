/* global BigInt */
import React, { useState } from "react";
import { marketAbi } from "../../abi/market"; 
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import Confetti from "react-confetti";
import { formatEther } from "viem";
import { Button } from "./ui/Button";
import { Loader2 } from "lucide-react";
import { Separator } from "./ui/Separator";
import { chainToChainConfig } from "../../Config"; // Correctly import the config file
import { Link } from "react-router-dom"; // Import Link from react-router-dom
import useError from "../../hooks/useError"; 
import "./NFTCardFooterBuy.css";

export function NFTCardFooterBuy({ nft, nftPrice }) {
  const { handleError } = useError();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { address, chain } = useAccount();
  const [formStatus, setFormStatus] = useState("NOT_SUBMITTED");

  async function onSubmit() {
    try {
      setFormStatus("SUBMITTING");
      if (!publicClient || !walletClient || !address) throw new Error("Client or wallet not ready");

      const wormholeCost = await publicClient.readContract({
        address: chainToChainConfig(chain).market,
        abi: marketAbi,
        functionName: "getWormholeCost",
        args: [chainToChainConfig(nft.chain).wormholeChainId],
      });

      const txHash = await walletClient.writeContract({
        address: chainToChainConfig(chain).market,
        abi: marketAbi,
        functionName: "buyItem",
        args: [
          chainToChainConfig(nft.chain).wormholeChainId,
          chainToChainConfig(nft.chain).market,
          nft.contractAddress,
          // eslint-disable-next-line no-undef
          BigInt(nft.id),  // Ensure BigInt is supported
          nftPrice,
          nft.owner,
        ],
        value: wormholeCost + nftPrice,
        chain: chain,
      });

      await publicClient.waitForTransactionReceipt({ hash: txHash });
      setFormStatus("SUBMITTED");
    } catch (error) {
      handleError(error, true);
      setFormStatus("NOT_SUBMITTED");
    }
  }

  if (formStatus === "SUBMITTED") {
    return (
      <div>
        <Separator />
        <p className="congrats-text">Congratulations 🎉</p>
        <p className="congrats-subtext">The NFT will be transferred to your account soon</p>
        <Link to="/account">
          <Button variant="secondary">👤 Open Account</Button>
        </Link>
        <Confetti width={document.body.clientWidth} height={document.body.scrollHeight} recycle={false} />
      </div>
    );
  }

  return (
    <div className="buy-button-container">
      <Button onClick={onSubmit} disabled={formStatus === "SUBMITTING"}>
        {formStatus === "SUBMITTING" && <Loader2 className="loader" />}
        💸 Buy for {formatEther(nftPrice)} {nft.chain.nativeCurrency.symbol}
      </Button>
    </div>
  );
}
