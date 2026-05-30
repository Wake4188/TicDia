
import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMobileDetection } from "../hooks/useMobileDetection";
import NavigationDesktop from "./NavigationDesktop";
import MobileMenu from "./MobileMenu";
import SearchModal from "./SearchModal";

interface NavigationProps {
  currentArticle?: any;
}

const Navigation = ({ currentArticle }: NavigationProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMobileDetection();
  const [searchValue, setSearchValue] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    // Reset any mobile menu state when location changes
  }, [location]);

  // Force a completely new feed (matches mobile behavior): hard refresh to clear
  // React Query cache, in-memory state, and re-trigger the random article fetch.
  const handleFreshFeed = useCallback(() => {
    window.location.href = '/?refresh=' + Date.now();
  }, []);

  if (location.pathname === '/auth') return null;

  const navigationProps = {
    searchValue,
    onSearchClick: () => setIsSearchOpen(true),
    onRandomClick: handleFreshFeed,
    onTodayClick: () => navigate('/today')
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
