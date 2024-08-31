import React from "react";
import { Route, Routes } from "react-router-dom";
import { Home, Details } from "../../pages";

const Layout = () => {
  return (
    <>
      <div style={{ width: "100%" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/details" element={<Details />} />
        </Routes>
      </div>
    </>
  );
};

export default Layout;
