import { useNavigate, useLocation } from "react-router-dom";
import { BookA, Calendar, Lightbulb, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";

const feedItems = [
  { label: "Words", icon: BookA, path: "/word-feed" },
  { label: "On This Day", icon: Calendar, path: "/on-this-day" },
  { label: "Did You Know?", icon: Lightbulb, path: "/did-you-know" },
];

interface FeedDropdownProps {
  variant?: "desktop" | "mobile";
}

const FeedDropdown = ({ variant = "desktop" }: FeedDropdownProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = feedItems.some(item => location.pathname === item.path);

  const handleSelect = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  if (variant === "mobile") {
    return (
      <div className="space-y-1">
        {feedItems.map((item) => (
          <button
            key={item.path}
            onClick={() => handleSelect(item.path)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
              location.pathname === item.path
                ? "bg-primary/20 text-primary"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={`text-white hover:text-white hover:bg-white/5 transition-colors p-1.5 md:p-2 gap-1 ${isActive ? 'bg-white/10' : ''}`}
          aria-label="Feeds"
        >
          <BookA className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden md:inline text-sm">Feeds</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-52 p-2"
      >
        <div className="space-y-1">
          {feedItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleSelect(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left text-sm ${
                location.pathname === item.path
                  ? "bg-primary/20 text-primary font-medium"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FeedDropdown;
