import React, { useEffect } from "react";
import "./Bridge.css";

export function Bridge() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://www.unpkg.com/@wormhole-foundation/wormhole-connect@0.3.0/dist/main.js";
    script.type = "module";
    document.body.appendChild(script);

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://www.unpkg.com/@wormhole-foundation/wormhole-connect@0.3.0/dist/main.css";
    document.head.appendChild(link);

    return () => {
      document.body.removeChild(script);
      document.head.removeChild(link);
    };
  }, []);

  return <div id="wormhole-connect" data-config='{"env":"testnet"}'></div>;
}
