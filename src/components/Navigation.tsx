
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useMobileDetection } from "../hooks/useMobileDetection";
import NavigationDesktop from "./NavigationDesktop";
import MobileMenu from "./MobileMenu";
import SearchModal from "./SearchModal";

interface NavigationProps {
  currentArticle?: any;
}

const Navigation = ({ currentArticle }: NavigationProps) => {
  const location = useLocation();
  const isMobile = useMobileDetection();
  const [searchValue, setSearchValue] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    // Reset any mobile menu state when location changes
  }, [location]);

  if (location.pathname === '/auth') return null;

  const navigationProps = {
    searchValue,
    onSearchClick: () => setIsSearchOpen(true),
    onRandomClick: () => window.location.reload(),
    onTodayClick: () => window.location.href = '/today'
  };

  return (
    <>
      {isMobile ? (
        <MobileMenu {...navigationProps} currentArticle={currentArticle} />
      ) : (
        <NavigationDesktop {...navigationProps} />
      )}
      
      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </>
  );
};

export default Navigation;
