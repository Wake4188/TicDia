import { useEffect } from "react";
import { useLocation } from "react-router-dom";

declare global {
    interface Window {
        gtag: (
            command: "config" | "event" | "js",
            targetId: string | Date,
            config?: Record<string, any>
        ) => void;
    }
}

export const GoogleAnalyticsTracker = () => {
    const location = useLocation();

    useEffect(() => {
        if (typeof window.gtag !== "undefined") {
            window.gtag("config", "G-6HFC6Q72F9", {
                page_path: location.pathname + location.search,
            });
        }
    }, [location]);

    return null;
};
