import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { FaLongArrowAltRight } from "react-icons/fa";
import Modal from "react-modal";
import { ethers } from "ethers";
import { WalletContext } from "../../contexts/WalletContext";

const TestModal = ({ title, price = "0.0", imageSrc, link, eventType, artistName }) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const { walletAddress } = useContext(WalletContext);

  const openModal = () => {
    setModalIsOpen(true);
  };
  
  const closeModal = () => {
    setModalIsOpen(false);
  };

  const handleConfirmTransaction = async () => {
    if (!walletAddress) {
      alert("Please connect your wallet first.");
      return;
    }

    try {
      const ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = ethersProvider.getSigner();

      console.log("Preparing transaction...");
      console.log(`Sending to address: 0x9d3b555964A6DFF67062AF087990107c863892eD`);
      console.log(`Transaction value: 0 ETH`);

      const transaction = await signer.sendTransaction({
        to: "0x9d3b555964A6DFF67062AF087990107c863892eD", // Your wallet address
        value: ethers.utils.parseEther("0.0"), // Set to 0 ETH for testing purposes
      });

      console.log("Transaction sent:", transaction);

      await transaction.wait(); // Wait for the transaction to be mined
      console.log("Transaction mined successfully");

      // Simulate backend call to mint the NFT
      setTimeout(() => {
        setModalIsOpen(false);
        setShowSuccessPopup(true);

        setTimeout(() => {
          setShowSuccessPopup(false);
        }, 3000); // Hide the success popup after 3 seconds
      }, 1000);

    } catch (error) {
      console.error("Transaction failed", error);
      alert(`Transaction failed: ${error.message}`);
    }
  };

  const customStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      width: '300px',
      height: '270px',
      padding: '30px',
      borderRadius: '12px',
      backgroundColor: '#2a2a2a',
      color: '#ffffff',
      border: 'none',
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
    },
  };

  const successPopupStyle = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#2a2a2a',
    color: '#ffffff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    maxWidth: '400px',
    textAlign: 'center',
    animation: 'fadeIn 0.3s ease-in-out, fadeOut 0.3s ease-in-out 2.7s',
  };

  return (
    <div className="card-container" style={{ paddingBottom: 20 }}>
      <Link to={link}>
        <img
          src={imageSrc}
          alt={title}
          style={{ borderRadius: 12, maxHeight: 360 }}
        />
      </Link>
      <button className="card-btn" onClick={openModal}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
          <p style={{ fontSize: 16 }}>Buy</p> {/* Reverted to "Buy" */}
          <FaLongArrowAltRight />
        </div>
      </button>
      <div className="card-details">
        <div className="card-header">
          <h2 className="card-name">{title}</h2>
          <p className="card-price" style={{ backgroundColor: "#ff7f00" }}>{price}</p> {/* Price without "ETH" */}
        </div>
        <p style={{ color: "#b0b0b0", fontSize: 14 }}>{eventType}</p>
        <div className="profile-container" style={{ margin: "18px 0" }}>
          <div className="artist-name" style={{ color: "#ffffff" }}>{artistName}</div>
        </div>
      </div>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Confirm Purchase"
        style={customStyles}
      >
        <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Confirm Purchase</h2>
        <p style={{ marginBottom: '20px', textAlign: 'center' }}>
          Are you sure you want to bet on {title} for {price}?
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <button onClick={closeModal} style={{ backgroundColor: '#ff7f00', padding: '10px 20px', borderRadius: '8px', border: 'none', color: '#ffffff', marginRight: '10px' }}>
            Cancel
          </button>
          <button onClick={handleConfirmTransaction} style={{ backgroundColor: '#ff7f00', padding: '10px 20px', borderRadius: '8px', border: 'none', color: '#ffffff', marginLeft: '10px' }}>
            Confirm Transaction
          </button>
        </div>
      </Modal>

      {showSuccessPopup && (
        <div style={successPopupStyle}>
          <p>You have successfully purchased this NFT. You will be able to view it in your wallet and in your assets shortly!</p>
        </div>
      )}
    </div>
  );
};

export default TestModal;
