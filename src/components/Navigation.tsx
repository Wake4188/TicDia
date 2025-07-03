
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useMobileDetection } from "../hooks/useMobileDetection";
import NavigationDesktop from "./NavigationDesktop";
import MobileMenu from "./MobileMenu";

const Navigation = () => {
  const location = useLocation();
  const isMobile = useMobileDetection();
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    // Reset any mobile menu state when location changes
  }, [location]);

  // Hide navigation on auth page
  if (location.pathname === '/auth') {
    return null;
  }

  const handleSearchClick = () => {
    // TODO: Implement search functionality
    console.log("Search clicked");
  };

  const handleRandomClick = () => {
    // Refresh to show random article
    window.location.reload();
  };

  const handleTodayClick = () => {
    // Navigate to today page
    window.location.href = '/today';
  };

  if (isMobile) {
    return (
      <MobileMenu 
        searchValue={searchValue}
        onSearchClick={handleSearchClick}
      />
    );
  }

  return (
    <NavigationDesktop 
      searchValue={searchValue}
      onSearchClick={handleSearchClick}
      onRandomClick={handleRandomClick}
      onTodayClick={handleTodayClick}
    />
  );
};

export default Navigation;
