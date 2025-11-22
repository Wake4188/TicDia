import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";

export const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="relative h-9 w-9 transition-all duration-300"
        >
            <Sun
                className={`h-5 w-5 absolute transition-all duration-300 ${theme === 'light'
                        ? 'rotate-0 scale-100 opacity-100'
                        : 'rotate-90 scale-0 opacity-0'
                    }`}
            />
            <Moon
                className={`h-5 w-5 absolute transition-all duration-300 ${theme === 'dark'
                        ? 'rotate-0 scale-100 opacity-100'
                        : '-rotate-90 scale-0 opacity-0'
                    }`}
            />
        </Button>
    );
};
