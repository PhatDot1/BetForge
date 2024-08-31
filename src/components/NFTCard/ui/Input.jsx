import React from "react";
import "./Input.css"; // Assuming you will style the input with this CSS file

export const Input = ({ type = "text", placeholder, value, onChange, disabled }) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="input"
    />
  );
};
