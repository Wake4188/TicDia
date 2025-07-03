
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
    // Handle search click
    console.log("Search clicked");
  };

  const handleRandomClick = () => {
    // Handle random click
    console.log("Random clicked");
  };

  const handleTodayClick = () => {
    // Handle today click
    console.log("Today clicked");
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
