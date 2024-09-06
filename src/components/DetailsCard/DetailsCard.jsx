import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaLongArrowAltRight } from "react-icons/fa";
import Modal from "react-modal";

const TestModal = ({ title, price, imageSrc, link, eventType, artistName }) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const openModal = () => {
    console.log("openModal triggered");
    setModalIsOpen(true);
  };
  
  const closeModal = () => {
    console.log("closeModal triggered");
    setModalIsOpen(false);
  };

  const handleConfirmTransaction = () => {
    console.log("Transaction Confirmed");

    // Simulate backend call here
    setTimeout(() => {
      setModalIsOpen(false);
      setShowSuccessPopup(true);

      setTimeout(() => {
        setShowSuccessPopup(false);
      }, 3000); // Hide the success popup after 3 seconds
    }, 1000);
  };

  // Custom styles for the modal
  const customStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      width: '300px', 
      height: '200px', 
      padding: '20px',
      borderRadius: '12px',
      backgroundColor: '#2a2a2a', 
      color: '#ffffff',
      border: 'none',
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
    },
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
          <p style={{ fontSize: 16 }}>Buy</p>
          <FaLongArrowAltRight />
        </div>
      </button>
      <div className="card-details">
        <div className="card-header">
          <h2 className="card-name">{title}</h2>
          <p className="card-price" style={{ backgroundColor: "#ff7f00" }}>{price}</p>
        </div>
        <p style={{ color: "#b0b0b0", fontSize: 14 }}>{eventType}</p>
        <div className="profile-container" style={{ margin: "18px 0" }}>
          <div className="artist-name" style={{ color: "#ffffff" }}>{artistName}</div>
        </div>
      </div>

      {/* Modal for confirming the purchase */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Confirm Purchase"
        style={customStyles} 
      >
        <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Confirm Purchase</h2>
        <p style={{ marginBottom: '20px', textAlign: 'center' }}>
          Are you sure you want to buy {title} for {price} ETH?
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <button onClick={closeModal} style={{ backgroundColor: '#ff7f00', padding: '10px 20px', borderRadius: '8px', border: 'none', color: '#ffffff' }}>
            Cancel
          </button>
          <button onClick={handleConfirmTransaction} style={{ backgroundColor: '#ff7f00', padding: '10px 20px', borderRadius: '8px', border: 'none', color: '#ffffff' }}>
            Confirm Transaction
          </button>
        </div>
      </Modal>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="success-popup">
          <p>You have successfully purchased this NFT. You will be able to view it in your wallet and in your assets shortly!</p>
        </div>
      )}
    </div>
  );
};

export default TestModal;
