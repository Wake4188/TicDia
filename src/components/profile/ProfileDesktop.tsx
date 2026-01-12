import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookMarked, Eye, Trash2, Search, Mail, Lock, Key, 
  BarChart3, Globe, Moon, Sun, Shield, LogOut, Settings,
  Sparkles, Palette, Type, Volume2, ChevronRight, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { SUPPORTED_LANGUAGES } from "@/services/languageConfig";
import { setWordOfTheDay, getWordOfTheDayRecord } from "@/services/wordOfTheDayService";
import SmallTic from "@/components/SmallTic";
import { AnalyticsStats } from "@/components/AnalyticsStats";

interface SavedArticle {
  id: string;
  article_id: string;
  article_title: string;
  article_url: string;
  saved_at: string;
}

interface ProfileDesktopProps {
  fontOptions: { value: string; label: string }[];
  colorOptions: { value: string; label: string; color: string }[];
}

export const ProfileDesktop = ({ fontOptions, colorOptions }: ProfileDesktopProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentLanguage, translations, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { userPreferences, updatePreferences: updateUserPrefs } = useUserPreferences();
  const t = translations;

  const [activeSection, setActiveSection] = useState("overview");
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<SavedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<SavedArticle | null>(null);
  const [isSmallTicOpen, setIsSmallTicOpen] = useState(false);

  // Account Security states
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Admin states
  const [isAdmin, setIsAdmin] = useState(false);
  const [wordOfTheDay, setWordOfTheDayState] = useState("");
  const [wordOfTheDayLoading, setWordOfTheDayLoading] = useState(false);
  const [currentWordOfTheDay, setCurrentWordOfTheDay] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    Promise.allSettled([
      fetchSavedArticles(),
      checkAdminRole(),
      fetchCurrentWordOfTheDay()
    ]);
  }, [user, navigate]);

  useEffect(() => {
    const filtered = savedArticles.filter(article =>
      article.article_title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredArticles(filtered);
  }, [savedArticles, searchTerm]);

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

  const fetchCurrentWordOfTheDay = async () => {
    try {
      const record = await getWordOfTheDayRecord();
      setCurrentWordOfTheDay(record?.word || null);
    } catch (error) {
      console.warn('Could not fetch current word of the day:', error);
    }
  };

  const fetchSavedArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_articles')
        .select('*')
        .order('saved_at', { ascending: false });
      if (error) throw error;
      setSavedArticles(data || []);
    } catch (error) {
      console.error('Error fetching saved articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeSavedArticle = async (articleId: string) => {
    try {
      const { error } = await supabase.from('saved_articles').delete().eq('id', articleId);
      if (error) throw error;
      setSavedArticles(prev => prev.filter(article => article.id !== articleId));
      toast({ title: "Removed", description: "Article removed from saved" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove article", variant: "destructive" });
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail.trim() || newEmail === user?.email) return;
    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast({ title: "Email Update Initiated", description: "Check both emails for confirmation." });
      setNewEmail("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setEmailLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword !== confirmPassword || newPassword.length < 6) return;
    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Password Updated", description: "Your password has been changed." });
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSetWordOfTheDay = async () => {
    if (!wordOfTheDay.trim() || !user) return;
    setWordOfTheDayLoading(true);
    try {
      const result = await setWordOfTheDay(wordOfTheDay.trim(), new Date(), user.id);
      if (result.success) {
        toast({ title: "Success", description: "Word of the day set." });
        setWordOfTheDayState("");
        await fetchCurrentWordOfTheDay();
      } else throw new Error(result.error);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setWordOfTheDayLoading(false);
    }
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: User },
    { id: "saved", label: "Saved Articles", icon: BookMarked },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "preferences", label: "Preferences", icon: Settings },
    { id: "security", label: "Security", icon: Lock },
    ...(isAdmin ? [{ id: "admin", label: "Admin", icon: Shield }] : [])
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Gradient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="container max-w-7xl mx-auto px-6 pt-24 pb-12">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-xl shadow-primary/20">
                  <span className="text-3xl font-bold text-primary-foreground">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-background" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">
                  Welcome back
                </h1>
                <p className="text-muted-foreground mt-1">{user.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/");
              }}
              className="gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <motion.aside 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="col-span-3"
          >
            <div className="sticky top-24 space-y-2">
              {navItems.map((item, index) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                    activeSection === item.id
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${
                    activeSection === item.id ? "rotate-90" : "group-hover:translate-x-1"
                  }`} />
                </motion.button>
              ))}
            </div>
          </motion.aside>

          {/* Main Content */}
          <motion.main 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="col-span-9"
          >
            <AnimatePresence mode="wait">
              {/* Overview Section */}
              {activeSection === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-primary/10">
                            <BookMarked className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="text-3xl font-bold text-foreground">{savedArticles.length}</p>
                            <p className="text-sm text-muted-foreground">Saved Articles</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-blue-500/10">
                            <BarChart3 className="w-6 h-6 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-3xl font-bold text-foreground">7</p>
                            <p className="text-sm text-muted-foreground">Day Streak</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-green-500/10">
                            <Sparkles className="w-6 h-6 text-green-500" />
                          </div>
                          <div>
                            <p className="text-3xl font-bold text-foreground">Pro</p>
                            <p className="text-sm text-muted-foreground">Member Status</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardHeader>
                      <CardTitle className="text-xl">Quick Settings</CardTitle>
                      <CardDescription>Adjust your most used settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                          <div>
                            <p className="font-medium text-foreground">Theme</p>
                            <p className="text-sm text-muted-foreground">{theme === 'dark' ? 'Dark' : 'Light'} mode</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={toggleTheme}>
                          Switch to {theme === 'dark' ? 'Light' : 'Dark'}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Globe className="w-5 h-5" />
                          <div>
                            <p className="font-medium text-foreground">Language</p>
                            <p className="text-sm text-muted-foreground">{currentLanguage.nativeName}</p>
                          </div>
                        </div>
                        <Select
                          value={currentLanguage.code}
                          onValueChange={(code) => {
                            const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
                            if (lang) setLanguage(lang);
                          }}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SUPPORTED_LANGUAGES.slice(0, 8).map((lang) => (
                              <SelectItem key={lang.code} value={lang.code}>
                                {lang.nativeName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {savedArticles.length > 0 && (
                    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-xl">Recent Saves</CardTitle>
                          <CardDescription>Your latest saved articles</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setActiveSection("saved")}>
                          View all <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {savedArticles.slice(0, 3).map((article) => (
                            <div
                              key={article.id}
                              onClick={() => {
                                setSelectedArticle(article);
                                setIsSmallTicOpen(true);
                              }}
                              className="p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
                            >
                              <p className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                {article.article_title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Saved {new Date(article.saved_at).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              )}

              {/* Saved Articles Section */}
              {activeSection === "saved" && (
                <motion.div
                  key="saved"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-2xl">Saved Articles</CardTitle>
                          <CardDescription>{savedArticles.length} articles saved</CardDescription>
                        </div>
                        {savedArticles.length > 0 && (
                          <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              placeholder="Search articles..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="text-center py-12 text-muted-foreground">Loading...</div>
                      ) : filteredArticles.length === 0 ? (
                        <div className="text-center py-16">
                          <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                            <BookMarked className="w-10 h-10 text-muted-foreground" />
                          </div>
                          <p className="text-lg font-medium text-foreground mb-1">
                            {searchTerm ? "No matches found" : "No saved articles"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {searchTerm ? "Try a different search" : "Save articles to read them later"}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {filteredArticles.map((article) => (
                            <motion.div
                              key={article.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
                              onClick={() => {
                                setSelectedArticle(article);
                                setIsSmallTicOpen(true);
                              }}
                            >
                              <div className="flex-1 min-w-0 mr-4">
                                <p className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                  {article.article_title}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Saved {new Date(article.saved_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedArticle(article);
                                  setIsSmallTicOpen(true);
                                }}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={(e) => {
                                  e.stopPropagation();
                                  removeSavedArticle(article.id);
                                }} className="hover:bg-destructive/10 hover:text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Analytics Section */}
              {activeSection === "analytics" && (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <AnalyticsStats />
                </motion.div>
              )}

              {/* Appearance Section */}
              {activeSection === "appearance" && (
                <motion.div
                  key="appearance"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardHeader>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <Palette className="w-6 h-6" />
                        Appearance
                      </CardTitle>
                      <CardDescription>Customize how the app looks</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Theme</Label>
                          <div className="flex gap-3">
                            <button
                              onClick={() => theme === 'light' || toggleTheme()}
                              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                                theme === 'dark' 
                                  ? 'border-primary bg-primary/10' 
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <Moon className="w-6 h-6 mx-auto mb-2" />
                              <p className="text-sm font-medium">Dark</p>
                            </button>
                            <button
                              onClick={() => theme === 'dark' || toggleTheme()}
                              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                                theme === 'light' 
                                  ? 'border-primary bg-primary/10' 
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <Sun className="w-6 h-6 mx-auto mb-2" />
                              <p className="text-sm font-medium">Light</p>
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Highlight Color</Label>
                          <div className="grid grid-cols-5 gap-2">
                            {colorOptions.map((color) => (
                              <button
                                key={color.value}
                                onClick={() => updateUserPrefs({ highlightColor: color.value })}
                                className={`aspect-square rounded-xl border-2 transition-all hover:scale-110 ${
                                  userPreferences.highlightColor === color.value 
                                    ? 'border-foreground scale-110' 
                                    : 'border-transparent'
                                }`}
                                style={{ backgroundColor: color.color }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Font Family</Label>
                        <Select
                          value={userPreferences.fontFamily}
                          onValueChange={(value) => updateUserPrefs({ fontFamily: value })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fontOptions.map((font) => (
                              <SelectItem key={font.value} value={font.value}>
                                <span style={{ fontFamily: font.value }}>{font.label}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Text Size</Label>
                          <span className="text-sm text-primary font-bold">{userPreferences.fontSize}px</span>
                        </div>
                        <Slider
                          value={[userPreferences.fontSize]}
                          onValueChange={(value) => updateUserPrefs({ fontSize: value[0] })}
                          max={24}
                          min={12}
                          step={1}
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Background Opacity</Label>
                          <span className="text-sm text-primary font-bold">{userPreferences.backgroundOpacity}%</span>
                        </div>
                        <Slider
                          value={[userPreferences.backgroundOpacity]}
                          onValueChange={(value) => updateUserPrefs({ backgroundOpacity: value[0] })}
                          max={100}
                          min={10}
                          step={5}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Preview Card */}
                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardHeader>
                      <CardTitle>Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div
                        className="relative p-6 rounded-xl bg-cover bg-center overflow-hidden"
                        style={{
                          backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3')",
                          height: '180px'
                        }}
                      >
                        <div
                          className="absolute inset-0 bg-black"
                          style={{ opacity: userPreferences.backgroundOpacity / 100 }}
                        />
                        <div className="relative z-10 h-full flex flex-col justify-between">
                          <p
                            className="text-white leading-relaxed"
                            style={{
                              fontFamily: userPreferences.fontFamily,
                              fontSize: `${userPreferences.fontSize}px`
                            }}
                          >
                            The quick brown fox jumps over the lazy dog.
                          </p>
                          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                backgroundColor: userPreferences.highlightColor,
                                width: '60%'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Preferences Section */}
              {activeSection === "preferences" && (
                <motion.div
                  key="preferences"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardHeader>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <Settings className="w-6 h-6" />
                        Preferences
                      </CardTitle>
                      <CardDescription>Configure app behavior</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                        <div>
                          <p className="font-medium text-foreground">Text Animation</p>
                          <p className="text-sm text-muted-foreground">Letter-by-letter reveal effect</p>
                        </div>
                        <Switch
                          checked={userPreferences.textAnimation !== false}
                          onCheckedChange={(checked) => updateUserPrefs({ textAnimation: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                        <div>
                          <p className="font-medium text-foreground">Smoke Effect</p>
                          <p className="text-sm text-muted-foreground">Cursor trail effect</p>
                        </div>
                        <Switch
                          checked={userPreferences.smokeEffect}
                          onCheckedChange={(checked) => updateUserPrefs({ smokeEffect: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                        <div>
                          <p className="font-medium text-foreground">Liquid Glass Mode</p>
                          <p className="text-sm text-muted-foreground">Apple-style glassmorphism</p>
                        </div>
                        <Switch
                          checked={userPreferences.liquidGlassMode}
                          onCheckedChange={async (checked) => {
                            await updateUserPrefs({ liquidGlassMode: checked });
                            window.location.reload();
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                        <div>
                          <p className="font-medium text-foreground">Adult Content Filter</p>
                          <p className="text-sm text-muted-foreground">
                            {userPreferences.allowAdultContent ? "Adult content allowed" : "Adult content filtered"}
                          </p>
                        </div>
                        <Switch
                          checked={userPreferences.allowAdultContent}
                          onCheckedChange={(checked) => updateUserPrefs({ allowAdultContent: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">Feed Preference</p>
                            <Badge variant="outline" className="text-xs">Beta</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">How articles are selected</p>
                        </div>
                        <Select
                          value={userPreferences.feedType || 'mixed'}
                          onValueChange={(value: 'random' | 'curated' | 'mixed') => updateUserPrefs({ feedType: value })}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="random">Random</SelectItem>
                            <SelectItem value="curated">AI Curated</SelectItem>
                            <SelectItem value="mixed">Mixed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Security Section */}
              {activeSection === "security" && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Change Email
                      </CardTitle>
                      <CardDescription>Current: {user.email}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Input
                        type="email"
                        placeholder="New email address"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                      />
                      <Button
                        onClick={handleEmailChange}
                        disabled={emailLoading || !newEmail.trim()}
                        className="w-full"
                      >
                        {emailLoading ? "Updating..." : "Update Email"}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        Change Password
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Input
                        type="password"
                        placeholder="New password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <Input
                        type="password"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <Button
                        onClick={handlePasswordChange}
                        disabled={passwordLoading || !newPassword || !confirmPassword}
                        className="w-full"
                      >
                        {passwordLoading ? "Updating..." : "Update Password"}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Admin Section */}
              {activeSection === "admin" && isAdmin && (
                <motion.div
                  key="admin"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <Card className="bg-destructive/5 border-destructive/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-destructive/10">
                            <Shield className="w-8 h-8 text-destructive" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-foreground">Admin Panel</h3>
                            <p className="text-muted-foreground">Full admin controls</p>
                          </div>
                        </div>
                        <Button onClick={() => navigate("/admin")} variant="destructive">
                          Open Admin Panel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Word of the Day</Label>
                        {currentWordOfTheDay && (
                          <p className="text-sm text-muted-foreground mb-2">
                            Current: <span className="font-semibold text-foreground">{currentWordOfTheDay}</span>
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter word"
                            value={wordOfTheDay}
                            onChange={(e) => setWordOfTheDayState(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSetWordOfTheDay()}
                          />
                          <Button
                            onClick={handleSetWordOfTheDay}
                            disabled={wordOfTheDayLoading || !wordOfTheDay.trim()}
                          >
                            {wordOfTheDayLoading ? "Setting..." : "Set"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.main>
        </div>
      </div>

      <SmallTic
        isOpen={isSmallTicOpen}
        onClose={() => setIsSmallTicOpen(false)}
        article={selectedArticle}
        onOpenFull={(title) => navigate(`/?q=${encodeURIComponent(title)}`)}
      />
    </div>
  );
};
