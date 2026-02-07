import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookMarked, Eye, Trash2, Search, Mail, Lock, 
  BarChart3, Globe, Moon, Sun, Shield, LogOut, Settings,
  Palette, ChevronRight, User, Users, Share2, ArrowLeft, Heart, X, Type, Compass
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
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

type SubPage = null | 'saved' | 'analytics' | 'social' | 'language' | 'appearance' | 'email' | 'password';

export const ProfileMobile = ({ fontOptions, colorOptions }: ProfileMobileProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentLanguage, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { userPreferences, updatePreferences } = useUserPreferences();
  const [isAdmin, setIsAdmin] = useState(false);
  const [subPage, setSubPage] = useState<SubPage>(null);
  const [savedArticles, setSavedArticles] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const userAge = userPreferences.birthYear ? currentYear - userPreferences.birthYear : null;
  const canUseSocialFeatures = userAge !== null && userAge >= 16;

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    checkAdminRole();
    fetchSavedArticles();
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

  const fetchSavedArticles = async () => {
    if (!user) return;
    const { data } = await supabase.from('saved_articles').select('*').order('saved_at', { ascending: false });
    setSavedArticles(data || []);
  };

  const removeSavedArticle = async (id: string) => {
    await supabase.from('saved_articles').delete().eq('id', id);
    setSavedArticles(prev => prev.filter(a => a.id !== id));
    toast({ title: "Removed", description: "Article removed" });
  };

  const handleEmailChange = async () => {
    if (!newEmail.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast({ title: "Check your email", description: "Confirmation sent to both emails" });
      setNewEmail("");
      setSubPage(null);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword !== confirmPassword || newPassword.length < 6) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Password updated" });
      setNewPassword("");
      setConfirmPassword("");
      setSubPage(null);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
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
    icon: Icon, label, value, onClick, toggle, onToggle, color = "text-primary", bgColor = "bg-primary/10"
  }: { 
    icon: any; label: string; value?: string; onClick?: () => void; 
    toggle?: boolean; onToggle?: (v: boolean) => void; color?: string; bgColor?: string;
  }) => {
    // Use div for toggle items to avoid nested button issue (Switch renders a button)
    const Wrapper = toggle !== undefined ? 'div' : 'button';
    
    return (
      <Wrapper 
        className="w-full flex items-center justify-between px-4 py-3.5 active:bg-muted/50 transition-colors cursor-pointer"
        onClick={toggle !== undefined ? undefined : onClick}
        {...(toggle === undefined ? { type: 'button' as const } : {})}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bgColor}`}>
            <Icon className={`w-4 h-4 ${color}`} />
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
      </Wrapper>
    );
  };

  const SubPageHeader = ({ title, onBack }: { title: string; onBack: () => void }) => (
    <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <h1 className="text-lg font-semibold">{title}</h1>
        <div className="w-10" />
      </div>
    </div>
  );

  // Sub-pages
  if (subPage === 'saved') return (
    <div className="min-h-screen bg-background">
      <SubPageHeader title="Saved Articles" onBack={() => setSubPage(null)} />
      <div className="p-4 space-y-3">
        {savedArticles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookMarked className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No saved articles yet</p>
          </div>
        ) : savedArticles.map((article) => (
          <div key={article.id} className="bg-card rounded-xl p-4 flex justify-between items-start">
            <div className="flex-1 min-w-0 mr-3">
              <p className="font-medium text-foreground line-clamp-2">{article.article_title}</p>
              <p className="text-xs text-muted-foreground mt-1">{new Date(article.saved_at).toLocaleDateString()}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => removeSavedArticle(article.id)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );

  if (subPage === 'language') return (
    <div className="min-h-screen bg-background">
      <SubPageHeader title="Language" onBack={() => setSubPage(null)} />
      <div className="p-4 space-y-2">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => { setLanguage(lang); setSubPage(null); }}
            className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${
              currentLanguage.code === lang.code ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-muted'
            }`}
          >
            <span className="font-medium">{lang.nativeName}</span>
            <span className="text-sm opacity-70 ml-2">({lang.name})</span>
          </button>
        ))}
      </div>
    </div>
  );

  if (subPage === 'appearance') return (
    <div className="min-h-screen bg-background">
      <SubPageHeader title="Appearance" onBack={() => setSubPage(null)} />
      <div className="p-4 space-y-6">
        <div>
          <p className="text-sm font-medium mb-3">Highlight Color</p>
          <div className="grid grid-cols-5 gap-3">
            {colorOptions.map((color) => (
              <button
                key={color.value}
                onClick={() => updatePreferences({ highlightColor: color.value })}
                className={`aspect-square rounded-xl border-2 transition-transform ${
                  userPreferences.highlightColor === color.value ? 'border-foreground scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: color.color }}
              />
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium mb-3">Font Family</p>
          <Select value={userPreferences.fontFamily} onValueChange={(v) => updatePreferences({ fontFamily: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {fontOptions.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <p className="text-sm font-medium">Text Size</p>
            <span className="text-sm text-primary">{userPreferences.fontSize}px</span>
          </div>
          <Slider value={[userPreferences.fontSize]} onValueChange={([v]) => updatePreferences({ fontSize: v })} min={12} max={24} step={1} />
        </div>
      </div>
    </div>
  );

  if (subPage === 'email') return (
    <div className="min-h-screen bg-background">
      <SubPageHeader title="Change Email" onBack={() => setSubPage(null)} />
      <div className="p-4 space-y-4">
        <p className="text-sm text-muted-foreground">Current: {user.email}</p>
        <Input type="email" placeholder="New email address" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
        <Button className="w-full" onClick={handleEmailChange} disabled={loading || !newEmail.trim()}>
          {loading ? "Updating..." : "Update Email"}
        </Button>
      </div>
    </div>
  );

  if (subPage === 'password') return (
    <div className="min-h-screen bg-background">
      <SubPageHeader title="Change Password" onBack={() => setSubPage(null)} />
      <div className="p-4 space-y-4">
        <Input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <Input type="password" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        <Button className="w-full" onClick={handlePasswordChange} disabled={loading || !newPassword || !confirmPassword}>
          {loading ? "Updating..." : "Update Password"}
        </Button>
      </div>
    </div>
  );

  if (subPage === 'social') return (
    <div className="min-h-screen bg-background">
      <SubPageHeader title="Social" onBack={() => setSubPage(null)} />
      <div className="p-4">
        {!canUseSocialFeatures ? (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-bold mb-2">Age Verification Required</h3>
            <p className="text-muted-foreground mb-4">Social features are for users 16+. Set your birth year in settings.</p>
            <Button onClick={() => setSubPage(null)}>Go to Settings</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-card rounded-2xl p-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary-foreground">{user.email?.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-semibold">{user.email?.split('@')[0]}</p>
                  <p className="text-sm text-muted-foreground">Your public profile</p>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/profile/${user.id}`);
                toast({ title: "Copied!", description: "Profile link copied" });
              }}>
                <Share2 className="w-4 h-4 mr-2" /> Copy Profile Link
              </Button>
            </div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Discover</p>
            {[
              { name: "BookWorm42", topics: "History • Science" },
              { name: "CuriousMind", topics: "Philosophy • Art" },
              { name: "TechExplorer", topics: "Technology • Space" },
            ].map((p, i) => (
              <div key={i} className="bg-card rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">{p.name[0]}</span>
                  </div>
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.topics}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon"><Heart className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (subPage === 'analytics') return (
    <div className="min-h-screen bg-background">
      <SubPageHeader title="Analytics" onBack={() => setSubPage(null)} />
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Articles Read", value: "142", icon: BookMarked },
            { label: "Day Streak", value: "7", icon: BarChart3 },
            { label: "Topics", value: "12", icon: Globe },
            { label: "Audio Hours", value: "3h", icon: Eye },
          ].map((s, i) => (
            <div key={i} className="bg-card rounded-xl p-4 text-center">
              <s.icon className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="bg-card rounded-xl p-4">
          <p className="font-medium mb-3">Weekly Activity</p>
          <div className="flex justify-between items-end h-24">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-6 bg-primary/20 rounded-t" style={{ height: `${Math.random() * 60 + 20}px` }}>
                  <div className="w-full bg-primary rounded-t" style={{ height: `${Math.random() * 100}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">{d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Main settings page
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}><ArrowLeft className="w-5 h-5" /></Button>
          <h1 className="text-lg font-semibold">Settings</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="px-4 pt-6 pb-24">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-primary-foreground">{user.email?.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-lg truncate">{user.email?.split('@')[0]}</p>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Saved", value: savedArticles.length.toString(), icon: BookMarked },
            { label: "Streak", value: "7", icon: BarChart3 },
            { label: "Read", value: "142", icon: Eye },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-2xl p-4 text-center">
              <stat.icon className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <SettingsGroup title="General">
          <SettingsItem icon={theme === 'dark' ? Moon : Sun} label="Dark Mode" toggle={theme === 'dark'} onToggle={toggleTheme} />
          <SettingsItem icon={Globe} label="Language" value={currentLanguage.nativeName} onClick={() => setSubPage('language')} />
        </SettingsGroup>

        <SettingsGroup title="Content">
          <SettingsItem icon={BookMarked} label="Saved Articles" value={savedArticles.length.toString()} onClick={() => setSubPage('saved')} />
          <SettingsItem icon={BarChart3} label="Reading Analytics" onClick={() => setSubPage('analytics')} />
          <SettingsItem icon={Users} label="Social" onClick={() => setSubPage('social')} />
          <SettingsItem icon={Compass} label="Explore" value="On This Day & More" onClick={() => navigate('/explore')} color="text-emerald-500" bgColor="bg-emerald-500/10" />
        </SettingsGroup>

        <SettingsGroup title="Appearance">
          <SettingsItem icon={Palette} label="Customize" onClick={() => setSubPage('appearance')} />
          <SettingsItem icon={Palette} label="Smoke Effect" toggle={userPreferences.smokeEffect} onToggle={(v) => updatePreferences({ smokeEffect: v })} />
          <SettingsItem icon={Type} label="Text Animation" toggle={userPreferences.textAnimation !== false} onToggle={(v) => updatePreferences({ textAnimation: v })} />
        </SettingsGroup>

        <SettingsGroup title="Account">
          <SettingsItem icon={Mail} label="Change Email" onClick={() => setSubPage('email')} />
          <SettingsItem icon={Lock} label="Change Password" onClick={() => setSubPage('password')} />
          {isAdmin && (
            <SettingsItem icon={Shield} label="Admin Panel" onClick={() => navigate("/admin")} color="text-amber-500" bgColor="bg-amber-500/10" />
          )}
        </SettingsGroup>

        <Button variant="outline" className="w-full mt-4 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={async () => { await supabase.auth.signOut(); navigate("/"); }}>
          <LogOut className="w-4 h-4 mr-2" />Sign Out
        </Button>
      </div>
    </div>
  );
};
