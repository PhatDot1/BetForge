/* global BigInt */
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { marketAbi } from "../../abi/market"; 
import { erc721Abi, parseEther } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import Confetti from "react-confetti";
import { Button } from "./ui/Button";
import { Loader2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormMessage } from "./ui/Form";
import { Input } from "./ui/Input";
import { Separator } from "./ui/Separator";
import { chainToChainConfig } from "../../Config"; // Correctly import the config file
import { Link } from "react-router-dom"; // Import Link from react-router-dom
import useError from "../../hooks/useError";
import "./NFTCardFooterSell.css";

export function NFTCardFooterSell({ nft }) {
  const { handleError } = useError();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const [formStatus, setFormStatus] = useState("INPUT_HIDDEN");

  const formSchema = z.object({ price: z.coerce.number().gt(0) });
  const form = useForm({ resolver: zodResolver(formSchema), defaultValues: { price: 0 } });

  async function onSubmit(values) {
    try {
      setFormStatus("SUBMITTING");
      if (!publicClient || !walletClient || !address) throw new Error("Client or wallet not ready");

      const approveTxHash = await walletClient.writeContract({
        address: nft.contractAddress,
        abi: erc721Abi,
        functionName: "approve",
        args: [chainToChainConfig(nft.chain).market, BigInt(nft.id)],
        chain: nft.chain,
      });
      await publicClient.waitForTransactionReceipt({ hash: approveTxHash });

      const listTxHash = await walletClient.writeContract({
        address: chainToChainConfig(nft.chain).market,
        abi: marketAbi,
        functionName: "listItem",
        args: [nft.contractAddress, BigInt(nft.id), parseEther(String(values.price))],
        chain: nft.chain,
      });
      await publicClient.waitForTransactionReceipt({ hash: listTxHash });

      setFormStatus("SUBMITTED");
    } catch (error) {
      handleError(error, true);
      setFormStatus("INPUT_VISIBLE");
    }
  }

  if (formStatus === "SUBMITTED") {
    return (
      <div>
        <Separator />
        <p className="congrats-text">Congratulations 🎉</p>
        <p className="congrats-subtext">Your NFT is now available for purchase</p>
        <Link to="/explore">
          <Button variant="secondary">👀 Explore</Button>
        </Link>
        <Confetti width={document.body.clientWidth} height={document.body.scrollHeight} recycle={false} />
      </div>
    );
  }

  return (
    <div>
      <Button onClick={() => setFormStatus("INPUT_VISIBLE")}>💸 Sell</Button>
      {formStatus === "INPUT_VISIBLE" && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="price" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="42" type="number" disabled={formStatus === "SUBMITTING"} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" disabled={formStatus === "SUBMITTING"}>
              {formStatus === "SUBMITTING" && <Loader2 className="loader" />}
              💸 Sell
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}
