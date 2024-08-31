import React from "react";
import "./Form.css"; // Assuming you will style the form with this CSS file

export const Form = ({ children, onSubmit }) => {
  return <form onSubmit={onSubmit}>{children}</form>;
};

export const FormField = ({ children }) => {
  return <div className="form-field">{children}</div>;
};

export const FormItem = ({ children }) => {
  return <div className="form-item">{children}</div>;
};

export const FormControl = ({ children }) => {
  return <div className="form-control">{children}</div>;
};

export const FormMessage = ({ message }) => {
  return <div className="form-message">{message}</div>;
};
