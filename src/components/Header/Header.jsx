"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import Web3Modal from 'web3modal';
import { BrowserProvider, Contract, parseUnits, formatUnits } from 'ethers';
import WalletConnectProvider from "@walletconnect/web3-provider";
import CoinbaseWalletSDK from "@coinbase/wallet-sdk";
import { useWallet } from '@/contexts/WalletContext';

// Phantom wallet initialization as per your working version
const connectToPhantom = async () => {
  if (window.solana && window.solana.isPhantom) {
    await window.solana.connect();
    return window.solana;
  } else {
    window.open("https://phantom.app/", "_blank");
    throw new Error("Phantom Wallet is not installed.");
  }
};

interface CustomError extends Error {
  data?: {
    message?: string;
  };
}

const destinationWallet = '0xBaC888BfB8aBdeCb51941B5ec27D0AB51e2906D7'; // Replace with your actual destination wallet

const usdcABI = [
  {
    constant: false,
    inputs: [
      {
        name: 'recipient',
        type: 'address'
      },
      {
        name: 'amount',
        type: 'uint256'
      }
    ],
    name: 'transfer',
    outputs: [
      {
        name: '',
        type: 'bool'
      }
    ],
    type: 'function'
  },
  {
    constant: true,
    inputs: [
      {
        name: 'owner',
        type: 'address'
      }
    ],
    name: 'balanceOf',
    outputs: [
      {
        name: 'balance',
        type: 'uint256'
      }
    ],
    type: 'function'
  }
];

// EVM wallets
const INFURA_ID = '0d4aa52670ca4855b637394cb6d0f9ab'; // Replace with your Infura ID
const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      infuraId: INFURA_ID,
    },
  },
  coinbasewallet: {
    package: CoinbaseWalletSDK,
    options: {
      appName: "My App", // Replace with your app name
      infuraId: INFURA_ID,
      rpc: "",
      chainId: 1,
    },
  },
};

export default function DepositSubmitPage() {
  const { walletAddress, setWalletAddress } = useWallet();
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '' });
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [maticBalance, setMaticBalance] = useState<string | null>(null);
  const [estimatedGas, setEstimatedGas] = useState<string | null>(null);
  const web3ModalRef = useRef<InstanceType<typeof Web3Modal> | null>(null);

  const usdcTokenAddress = '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582'; // Polygon Amoy USDC contract address

  // Initialize Web3Modal for EVM wallets
  useEffect(() => {
    if (!web3ModalRef.current) {
      web3ModalRef.current = new Web3Modal({
        cacheProvider: true,
        providerOptions,
      });
    }
  }, []);

  const clearPreviousConnection = async () => {
    try {
      if (web3ModalRef.current) {
        await web3ModalRef.current.clearCachedProvider();
      }
      setWalletAddress(null);
    } catch (error) {
      console.error("Failed to clear previous connection", error);
    }
  };

  const connectWallet = async (wallet = "MetaMask") => {
    await clearPreviousConnection();

    try {
      let instance;
      if (wallet === "MetaMask" || wallet === "WalletConnect" || wallet === "CoinbaseWallet") {
        instance = await web3ModalRef.current.connect();
        const ethersProvider = new BrowserProvider(instance);
        const signer = await ethersProvider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);

        const network = await ethersProvider.getNetwork();
        if (Number(network.chainId) !== 80002) {
          throw new Error('Please connect to the Polygon Amoy Testnet.');
        }

        // Fetch balances
        await fetchBalances(ethersProvider, signer, address);
      } else if (wallet === "Phantom") {
        // Use the custom Phantom connection logic
        const solanaInstance = await connectToPhantom();
        setWalletAddress(solanaInstance.publicKey?.toString());
      }

    } catch (error) {
      console.error('Wallet connection failed:', error);
      setAlertType('error');
      setAlertMessage(error.message || 'Failed to connect wallet. Please try again.');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
    }
  };

  const fetchBalances = async (ethersProvider: BrowserProvider, signer: any, address: string) => {
    try {
      // Fetch native MATIC balance
      const balance = await ethersProvider.getBalance(address);
      setMaticBalance(formatUnits(balance, 18)); // MATIC has 18 decimals

      // Fetch user's USDC balance
      const usdcContract = new Contract(usdcTokenAddress, usdcABI, signer);
      const usdcBalanceRaw = await usdcContract.balanceOf(address);
      setUsdcBalance(formatUnits(usdcBalanceRaw, 6)); // USDC has 6 decimals

      // Estimate gas for the transaction
      const estimatedGasLimit = await usdcContract.estimateGas["transfer"](destinationWallet, parseUnits('1', 6));
      setEstimatedGas(estimatedGasLimit.toString());

    } catch (error) {
      console.error('Balance fetch failed:', error);
      setAlertType('error');
      setAlertMessage('Failed to fetch balances. Please try again.');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) {
      setAlertType('error');
      setAlertMessage('Please connect your wallet first.');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
      return;
    }

    try {
      const signer = await new BrowserProvider(window.ethereum).getSigner();
      const usdcContract = new Contract(usdcTokenAddress, usdcABI, signer);
      const amount = parseUnits('1', 6); // 1 USDC (USDC has 6 decimal places)

      const transaction = await usdcContract["transfer"](destinationWallet, amount);
      await transaction.wait();

      setAlertType('success');
      setAlertMessage('Deposit of 1 USDC successful!');
    } catch (error) {
      const err = error as CustomError;
      let errorMessage = 'An error occurred during the transaction. Please try again.';
      if (err.message?.includes('insufficient funds')) {
        errorMessage += ' It appears you do not have enough MATIC for gas fees.';
      }
      setAlertType('error');
      setAlertMessage(errorMessage);
    }
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 5000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <AnimatePresence>
        {showAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5 }}
            className="fixed top-4 left-0 right-0 flex justify-center z-50"
          >
            <Alert
              className={`${
                alertType === 'success'
                  ? 'bg-green-100 border-green-500 text-green-800'
                  : 'bg-red-100 border-red-500 text-red-800'
              } w-full max-w-2xl mx-4 flex items-center p-0 overflow-hidden`}
            >
              <div className="flex items-center p-4 w-full">
                {alertType === 'success' ? (
                  <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0" />
                )}
                <AlertDescription className="m-0 flex-grow text-base">
                  {alertMessage}
                </AlertDescription>
              </div>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-grow flex items-center justify-center mt-16">
        <div className="w-full max-w-2xl px-4">
          <Image
            src="http://cdn.mcauto-images-production.sendgrid.net/1ee5795144f269e0/64b69f03-aaa5-4272-9ebd-87a612482d43/1089x1137.png"
            alt="Encode Logo"
            width={128}
            height={128}
            className="mx-auto mb-4 object-contain"
          />
          <h1 className="text-[36px] font-semibold text-center text-primary mb-2">
            Contact Information
          </h1>
          <p className="text-center text-base text-[#B3B3B3] mb-6">
            Please provide us with your contact information and connect your wallet.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {walletAddress ? (
              <div className="text-center text-sm">
                <p>Connected Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
                {usdcBalance !== null && <p>USDC Balance: {usdcBalance}</p>}
                {maticBalance !== null && <p>MATIC Balance: {maticBalance}</p>}
                {estimatedGas !== null && <p>Estimated Gas: {estimatedGas}</p>}
              </div>
            ) : (
              <div>
                <Button onClick={() => connectWallet("MetaMask")} type="button" className="w-full mb-4">
                  Connect with MetaMask
                </Button>
                <Button onClick={() => connectWallet("Phantom")} type="button" className="w-full mb-4">
                  Connect with Phantom
                </Button>
                <Button onClick={() => connectWallet("CoinbaseWallet")} type="button" className="w-full mb-4">
                  Connect with Coinbase Wallet
                </Button>
                <Button onClick={() => connectWallet("WalletConnect")} type="button" className="w-full">
                  Connect with WalletConnect
                </Button>
              </div>
            )}

            <p className="text-sm text-red-600 font-medium">
              Please pay your deposit of 1 USDC on the Polygon Amoy testnet.
            </p>
            <Button type="submit" className="w-full">
              Submit Deposit
            </Button>
          </form>

          <br />
          <br />
          <p className="text-center text-sm text-[#B3B3B3] mb-6">
            &copy;2024 Encode Club Education Ltd. |{' '}
            <a href="https://www.encode.club/privacy-policy">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
