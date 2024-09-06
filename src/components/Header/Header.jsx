import React, { useState, useContext, useRef } from "react";
import { Link } from "react-router-dom"; 
import Web3Modal from "web3modal";
import { Web3Provider } from "@ethersproject/providers";
import "./Header.css";
import { WalletContext } from "../../contexts/WalletContext";

const Header = () => {
  const { walletAddress, setWalletAddress } = useContext(WalletContext);
  const [dropdowns, setDropdowns] = useState({
    sports: false,
    esports: false,
    casino: false,
  });

  const [provider, setProvider] = useState(null);
  const web3ModalRef = useRef(null);

  // Initialize Web3Modal only once
  if (!web3ModalRef.current) {
    web3ModalRef.current = new Web3Modal({
      cacheProvider: true, 
      providerOptions: {
        injected: {
          display: {
            name: "MetaMask",
            description: "Connect with the provider in your Browser"
          },
          package: null
        },
        phantom: {
          display: {
            name: "Phantom",
            description: "Connect to Phantom Wallet"
          },
          package: null,
          connector: async () => {
            if (window.solana && window.solana.isPhantom) {
              await window.solana.connect();
              return window.solana;
            } else {
              window.open("https://phantom.app/", "_blank");
              throw new Error("Phantom Wallet is not installed.");
            }
          }
        }
      },
      disableInjectedProvider: false,
    });
  }

  const clearPreviousConnection = async () => {
    try {
      if (web3ModalRef.current) {
        await web3ModalRef.current.clearCachedProvider();
      }
      if (provider && provider.provider && provider.provider.disconnect) {
        await provider.provider.disconnect();
      }
      setProvider(null);
    } catch (error) {
      console.error("Failed to clear previous connection", error);
    }
  };

  const forceReconnect = async () => {
    try {
      if (window.ethereum) {
        // Reset the Ethereum provider
        await window.ethereum.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }],
        });
      }
    } catch (error) {
      console.error("Error in forcing reconnect:", error);
    }
  };

  const connectWallet = async () => {
    console.log("Connect Wallet button clicked");

    await clearPreviousConnection(); // Clear previous connection before attempting a new one

    try {
      await forceReconnect(); // Force a reset of MetaMask state
      const instance = await web3ModalRef.current.connect();
      const ethersProvider = new Web3Provider(instance);
      const signer = ethersProvider.getSigner();
      const address = await signer.getAddress();
      setProvider(ethersProvider);
      setWalletAddress(address);
      console.log("Connected wallet address:", address);
    } catch (error) {
      console.error("Could not connect wallet", error);

      if (error.code === -32002) {
        // QOL improvement for case where MetaMask is already processing a request
        alert("MetaMask is already processing a connection request. Please check MetaMask and try again.");
      } else {
        alert("Connection attempt failed. Please try again.");
      }
    }
  };

  const toggleDropdown = (dropdown) => {
    setDropdowns((prevState) => ({
      ...prevState,
      [dropdown]: !prevState[dropdown],
    }));
  };

  return (
    <div className="header-container">
      <Link to="/">Betforge</Link> 
      <div className="nav-dropdowns">
        <div className="dropdown">
          <button className="dropdown-btn" onClick={() => toggleDropdown("sports")}>
            Sports
          </button>
          {dropdowns.sports && (
            <div className="dropdown-content">
              <Link to="/bet/soccer">Soccer</Link> 
              <Link to="/bet/basketball">Basketball</Link>
              <Link to="/bet/tennis">Tennis</Link> 
              <Link to="/bet/olympics">Olympics</Link>
              <Link to="/user-listed">User Listed</Link> 
            </div>
          )}
        </div>
        <div className="dropdown">
          <button className="dropdown-btn" onClick={() => toggleDropdown("esports")}>
            eSports
          </button>
          {dropdowns.esports && (
            <div className="dropdown-content">
              <Link to="/bet/valorant">Valorant</Link> 
              <Link to="/bet/csgo">CS:GO</Link> 
              <Link to="/bet/dota2">Dota 2</Link> 
              <Link to="/user-listed">User Listed</Link> 
            </div>
          )}
        </div>
        <div className="dropdown">
          <button className="dropdown-btn" onClick={() => toggleDropdown("casino")}>
            Online Casino
          </button>
          {dropdowns.casino && (
            <div className="dropdown-content">
              <Link to="/bet/blackjack">Blackjack</Link> 
              <Link to="/bet/roulette">Roulette</Link>
              <Link to="/bet/poker">Poker</Link> 
              <Link to="/user-listed">User Listed</Link>
            </div>
          )}
        </div>
      </div>
      <Link to="/bridge" className="bridge-btn" style={{ fontSize: "26px" }}>⇄ Bridge</Link> 
      {!walletAddress ? (
        <button className="wallet-btn" onClick={connectWallet}>
          Connect Wallet
        </button>
      ) : (
        <div className="wallet-info">
          <p className="wallet-address">Connected: {walletAddress}</p>
          <Link to="/my-collection">
            <button className="assets-btn">My Assets</button>
          </Link> 
        </div>
      )}
    </div>
  );
};

export default Header;
