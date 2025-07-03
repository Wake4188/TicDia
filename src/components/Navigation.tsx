
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useMobileDetection } from "../hooks/useMobileDetection";
import NavigationDesktop from "./NavigationDesktop";
import MobileMenu from "./MobileMenu";

const Navigation = () => {
  const location = useLocation();
  const isMobile = useMobileDetection();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Hide navigation on auth page
  if (location.pathname === '/auth') {
    return null;
  }

  if (isMobile) {
    return (
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
      />
    );
  }

  return <NavigationDesktop />;
};

export default Navigation;
