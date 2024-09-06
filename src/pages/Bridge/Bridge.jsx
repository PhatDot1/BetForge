import React, { useEffect } from "react";
import "./Bridge.css"; // Import the CSS file for styling

export function Bridge() {
  useEffect(() => {
    // Load the Wormhole Connect script
    const script = document.createElement("script");
    script.src = "https://www.unpkg.com/@wormhole-foundation/wormhole-connect@0.3.0/dist/main.js";
    script.type = "module";
    script.async = true;
    document.body.appendChild(script);

    // Load the Wormhole Connect stylesheet
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://www.unpkg.com/@wormhole-foundation/wormhole-connect@0.3.0/dist/main.css";
    document.head.appendChild(link);

    // Cleanup function to remove the script and link when the component unmounts
    return () => {
      document.body.removeChild(script);
      document.head.removeChild(link);
    };
  }, []);

  return (
    <div className="bridge-container">
      <h1 className="bridge-heading">Bridge</h1>
      <p className="bridge-subheading">Bridge your funds between chains below:</p>
      <div id="wormhole-connect" data-config='{"env":"testnet"}' className="wormhole-widget"></div>
    </div>
  );
}

export default Bridge;
