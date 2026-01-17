import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  BookMarked, Eye, Trash2, Search, Mail, Lock, 
  BarChart3, Globe, Moon, Sun, Shield, LogOut, Settings,
  Palette, ChevronRight, User, Users, Share2, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { SUPPORTED_LANGUAGES } from "@/services/languageConfig";

interface ProfileMobileProps {
  fontOptions: { value: string; label: string }[];
  colorOptions: { value: string; label: string; color: string }[];
}

export const ProfileMobile = ({ fontOptions, colorOptions }: ProfileMobileProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentLanguage, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { userPreferences, updatePreferences } = useUserPreferences();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    checkAdminRole();
  }, [user, navigate]);

  const checkAdminRole = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.rpc('has_role' as any, {
        _user_id: user.id,
        _role: 'admin'
      });
      if (!error && data) setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin role:', error);
    }
  };

  if (!user) return null;

  const SettingsGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-6">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 mb-2">{title}</p>
      <div className="bg-card rounded-2xl overflow-hidden divide-y divide-border">
        {children}
      </div>
    </div>
  );

  const SettingsItem = ({ 
    icon: Icon, 
    label, 
    value, 
    onClick, 
    toggle, 
    onToggle,
    color = "text-muted-foreground"
  }: { 
    icon: any; 
    label: string; 
    value?: string; 
    onClick?: () => void; 
    toggle?: boolean;
    onToggle?: (v: boolean) => void;
    color?: string;
  }) => (
    <div 
      className={`flex items-center justify-between px-4 py-3.5 ${onClick ? 'active:bg-muted/50 cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color.includes('bg-') ? color : 'bg-primary/10'}`}>
          <Icon className={`w-4 h-4 ${color.includes('text-') ? color : 'text-primary'}`} />
        </div>
        <span className="font-medium text-foreground">{label}</span>
      </div>
      {toggle !== undefined ? (
        <Switch checked={toggle} onCheckedChange={onToggle} />
      ) : (
        <div className="flex items-center gap-2">
          {value && <span className="text-sm text-muted-foreground">{value}</span>}
          {onClick && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Settings</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="px-4 pt-6 pb-24">
        {/* Profile Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-4 mb-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-primary-foreground">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-lg truncate">{user.email?.split('@')[0]}</p>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Saved", value: "12", icon: BookMarked },
            { label: "Streak", value: "7", icon: BarChart3 },
            { label: "Read", value: "142", icon: Eye },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl p-4 text-center"
            >
              <stat.icon className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Settings Groups */}
        <SettingsGroup title="General">
          <SettingsItem 
            icon={theme === 'dark' ? Moon : Sun} 
            label="Dark Mode" 
            toggle={theme === 'dark'}
            onToggle={toggleTheme}
          />
          <SettingsItem 
            icon={Globe} 
            label="Language" 
            value={currentLanguage.nativeName}
            onClick={() => {}}
          />
        </SettingsGroup>

        <SettingsGroup title="Content">
          <SettingsItem icon={BookMarked} label="Saved Articles" onClick={() => {}} />
          <SettingsItem icon={BarChart3} label="Reading Analytics" onClick={() => {}} />
          <SettingsItem icon={Users} label="Social" onClick={() => {}} />
        </SettingsGroup>

        <SettingsGroup title="Appearance">
          <SettingsItem icon={Palette} label="Highlight Color" value={userPreferences.highlightColor} onClick={() => {}} />
          <SettingsItem 
            icon={Palette} 
            label="Smoke Effect" 
            toggle={userPreferences.smokeEffect}
            onToggle={(v) => updatePreferences({ smokeEffect: v })}
          />
        </SettingsGroup>

        <SettingsGroup title="Account">
          <SettingsItem icon={Mail} label="Change Email" onClick={() => {}} />
          <SettingsItem icon={Lock} label="Change Password" onClick={() => {}} />
          {isAdmin && (
            <SettingsItem icon={Shield} label="Admin Panel" onClick={() => navigate("/admin")} color="text-amber-500 bg-amber-500/10" />
          )}
        </SettingsGroup>

        {/* Sign Out */}
        <Button
          variant="outline"
          className="w-full mt-4 text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate("/");
          }}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};
