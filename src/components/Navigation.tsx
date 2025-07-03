
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useMobileDetection } from "../hooks/useMobileDetection";
import NavigationDesktop from "./NavigationDesktop";
import MobileMenu from "./MobileMenu";
import SearchModal from "./SearchModal";

const Navigation = () => {
  const location = useLocation();
  const isMobile = useMobileDetection();
  const [searchValue, setSearchValue] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    // Reset any mobile menu state when location changes
  }, [location]);

  // Hide navigation on auth page
  if (location.pathname === '/auth') {
    return null;
  }

  const handleSearchClick = () => {
    setIsSearchOpen(true);
  };

  const handleSearchClose = () => {
    setIsSearchOpen(false);
  };

  const handleRandomClick = () => {
    // Refresh to show random article
    window.location.reload();
  };

  const handleTodayClick = () => {
    // Navigate to today page
    window.location.href = '/today';
  };

  return (
    <>
      {isMobile ? (
        <MobileMenu 
          searchValue={searchValue}
          onSearchClick={handleSearchClick}
        />
      ) : (
        <NavigationDesktop 
          searchValue={searchValue}
          onSearchClick={handleSearchClick}
          onRandomClick={handleRandomClick}
          onTodayClick={handleTodayClick}
        />
      )}
      
      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={handleSearchClose} 
      />
    </>
  );
};

export default Navigation;
