// src/hooks/useError.js

import { useState } from "react";

const useError = () => {
  const [error, setError] = useState(null);

  const handleError = (error, showAlert = false) => {
    console.error(error);
    setError(error);

    if (showAlert) {
      alert(`An error occurred: ${error.message || error}`);
    }
  };

  return {
    error,
    handleError,
  };
};

export default useError;
