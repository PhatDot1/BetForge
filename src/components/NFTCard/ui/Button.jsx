import React from "react";
import "./Button.css"; // Assuming you will style the button with this CSS file

export const Button = ({ children, onClick, disabled, variant = "primary" }) => {
  return (
    <button 
      className={`btn btn-${variant}`} 
      onClick={onClick} 
      disabled={disabled}
    >
      {children}
    </button>
  );
};
