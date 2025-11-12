import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Cookie } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const CookieConsent = () => {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Show consent banner after a short delay
      setTimeout(() => setShowConsent(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setShowConsent(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setShowConsent(false);
  };

  return (
    <AnimatePresence>
      {showConsent && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md"
        >
          <Card className="bg-gray-900/95 backdrop-blur-md border-gray-800 shadow-2xl">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-wikitok-red/20 rounded-lg">
                  <Cookie className="w-5 h-5 text-wikitok-red" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-2">Cookie Consent</h3>
                  <p className="text-sm text-gray-300 mb-4">
                    We use essential cookies to provide core functionality and analytics to improve your experience. 
                    No personal data is sold to third parties. Read our{" "}
                    <a 
                      href="/privacy" 
                      className="text-wikitok-red hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Privacy Policy
                    </a>
                    {" "}for more details.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAccept}
                      className="bg-wikitok-red hover:bg-wikitok-red/90 text-white flex-1"
                      size="sm"
                    >
                      Accept
                    </Button>
                    <Button
                      onClick={handleDecline}
                      variant="outline"
                      className="border-gray-700 hover:bg-gray-800 flex-1"
                      size="sm"
                    >
                      Decline
                    </Button>
                  </div>
                </div>
                <button
                  onClick={handleDecline}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
