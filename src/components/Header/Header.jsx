import React, { useState, useContext } from "react";
import Web3Modal from "web3modal";
import { Web3Provider } from "@ethersproject/providers";
import "./Header.css";
import { WalletContext } from "../../contexts/WalletContext";
import { Link } from "react-router-dom"; // Import Link for navigation

const Header = () => {
  const { walletAddress, setWalletAddress } = useContext(WalletContext);
  const [dropdowns, setDropdowns] = useState({
    sports: false,
    esports: false,
    casino: false,
  });

  const [setProvider] = useState(null);

  const connectWallet = async () => {
    try {
      const providerOptions = {
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
      };

      const web3Modal = new Web3Modal({
        cacheProvider: false,
        providerOptions,
        disableInjectedProvider: false,
      });

      const instance = await web3Modal.connect();
      const ethersProvider = new Web3Provider(instance);
      const signer = ethersProvider.getSigner();
      const address = await signer.getAddress();
      setProvider(ethersProvider);
      setWalletAddress(address);
    } catch (error) {
      console.error("Could not connect wallet", error);
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
              <Link to="/user-listed">User Listed</Link> {/* Added link */}
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
              <Link to="/user-listed">User Listed</Link> {/* Added link */}
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
              <Link to="/user-listed">User Listed</Link> {/* Added link */}
            </div>
          )}
        </div>
        <Link to="/bridge">Bridge</Link> {/* Added Bridge link */}
      </div>
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
