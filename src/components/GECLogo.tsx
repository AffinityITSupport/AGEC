import React, { useState } from "react";
import { Church } from "lucide-react";

export const GECLogo = ({ className }: { className?: string }) => {
  const [error, setError] = useState(false);

  if (error) {
    return <Church className={className} />;
  }

  return (
    <img 
      src="https://raw.githubusercontent.com/paulekuadzi/gec-cms-assets/main/gec-logo.png" 
      alt="Global Evangelical Church Logo" 
      className={className}
      onError={() => setError(true)}
      referrerPolicy="no-referrer"
    />
  );
};
