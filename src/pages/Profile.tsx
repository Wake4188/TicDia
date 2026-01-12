import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, BookMarked, Eye, Trash2, Search, Mail, Lock, Key, BarChart3, Globe, Moon, Sun, Shield, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import SmallTic from "../components/SmallTic";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";
import { SUPPORTED_LANGUAGES } from "../services/languageConfig";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { AnalyticsStats } from "@/components/AnalyticsStats";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { setWordOfTheDay, getWordOfTheDayRecord } from "@/services/wordOfTheDayService";
import { useMobileDetection } from "@/hooks/useMobileDetection";
import { ProfileDesktop } from "@/components/profile/ProfileDesktop";

interface SavedArticle {
  id: string;
  article_id: string;
  article_title: string;
  article_url: string;
  saved_at: string;
}

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentLanguage, translations, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const t = translations;

  // Load user preferences to apply highlight color throughout the app
  const { userPreferences, updatePreferences: updateUserPrefs } = useUserPreferences();
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<SavedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<SavedArticle | null>(null);
  const [isSmallTicOpen, setIsSmallTicOpen] = useState(false);

  const [activeTab, setActiveTab] = useState("saved");

  // Account Security states
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState(user?.email || "");
  const [resetLoading, setResetLoading] = useState(false);

  // Admin states
  const [isAdmin, setIsAdmin] = useState(false);
  const [wordOfTheDay, setWordOfTheDayState] = useState("");
  const [wordOfTheDayLoading, setWordOfTheDayLoading] = useState(false);
  const [currentWordOfTheDay, setCurrentWordOfTheDay] = useState<string | null>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setResetEmail(user.email || "");
    
    // Fetch all data in parallel for faster load
    Promise.allSettled([
      fetchSavedArticles(),
      checkAdminRole(),
      fetchCurrentWordOfTheDay()
    ]);
  }, [user, navigate]);

  const checkAdminRole = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.rpc('has_role' as any, {
        _user_id: user.id,
        _role: 'admin'
      });
      if (!error && data) {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Error checking admin role:', error);
    }
  };

  const fetchCurrentWordOfTheDay = async () => {
    try {
      const record = await getWordOfTheDayRecord();
      setCurrentWordOfTheDay(record?.word || null);
    } catch (error) {
      // Silently handle errors (table might not exist yet)
      console.warn('Could not fetch current word of the day:', error);
      setCurrentWordOfTheDay(null);
    }
  };

  const handleSetWordOfTheDay = async () => {
    if (!wordOfTheDay.trim()) {
      toast({
        title: "Error",
        description: "Please enter a word",
        variant: "destructive",
      });
      return;
    }

    if (!user) return;

    setWordOfTheDayLoading(true);
    try {
      const result = await setWordOfTheDay(wordOfTheDay.trim(), new Date(), user.id);
      if (result.success) {
        toast({
          title: "Success",
          description: "Word of the day has been set successfully.",
        });
        setWordOfTheDayState("");
        await fetchCurrentWordOfTheDay();
      } else {
        throw new Error(result.error || "Failed to set word of the day");
      }
    } catch (error: any) {
      console.error('Error setting word of the day:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to set word of the day",
        variant: "destructive",
      });
    } finally {
      setWordOfTheDayLoading(false);
    }
  };

  useEffect(() => {
    const filtered = savedArticles.filter(article =>
      article.article_title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredArticles(filtered);
  }, [savedArticles, searchTerm]);

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
      toast({
        title: t.error,
        description: t.errorLoading,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const removeSavedArticle = async (articleId: string) => {
    try {
      const { error } = await supabase
        .from('saved_articles')
        .delete()
        .eq('id', articleId);

      if (error) throw error;

      setSavedArticles(prev => prev.filter(article => article.id !== articleId));
      toast({
        title: t.removed,
        description: t.removedDesc,
      });
    } catch (error) {
      console.error('Error removing article:', error);
      toast({
        title: t.error,
        description: t.errorRemoving,
        variant: "destructive",
      });
    }
  };

  const removeAllSavedArticles = async () => {
    try {
      const { error } = await supabase
        .from('saved_articles')
        .delete()
        .eq('user_id', user!.id);

      if (error) throw error;

      setSavedArticles([]);
      toast({
        title: t.cleared,
        description: t.clearedDesc,
      });
    } catch (error) {
      console.error('Error clearing articles:', error);
      toast({
        title: t.error,
        description: t.errorClearing,
        variant: "destructive",
      });
    }
  };

  const handleArticleClick = (article: SavedArticle) => {
    setSelectedArticle(article);
    setIsSmallTicOpen(true);
  };

  const handleOpenFull = (title: string) => {
    navigate(`/?q=${encodeURIComponent(title)}`);
  };

  // Account security functions
  const handleEmailChange = async () => {
    if (!newEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter a new email address",
        variant: "destructive",
      });
      return;
    }

    if (newEmail === user?.email) {
      toast({
        title: "Error",
        description: "New email must be different from current email",
        variant: "destructive",
      });
      return;
    }

    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) throw error;

      toast({
        title: "Email Update Initiated",
        description: "Please check both your old and new email addresses for confirmation links.",
      });
      setNewEmail("");
    } catch (error: any) {
      console.error('Error updating email:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update email",
        variant: "destructive",
      });
    } finally {
      setEmailLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in both password fields",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed.",
      });
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast({
        title: "Password Reset Sent",
        description: "Please check your email for password reset instructions.",
      });
    } catch (error: any) {
      console.error('Error sending password reset:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset email",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  const fontOptions = [
    { value: 'Times New Roman', label: `Times New Roman (${t.default})` },
    { value: 'Inter', label: 'Inter' },
    { value: 'Comic Neue', label: 'Comic Neue (Dyslexia-friendly)' },
    { value: 'Georgia', label: `Georgia (${t.serif})` },
    { value: 'Merriweather', label: 'Merriweather' },
    { value: 'Lora', label: 'Lora' },
    { value: 'Crimson Text', label: 'Crimson Text' },
    { value: 'PT Serif', label: 'PT Serif' },
    { value: 'Playfair Display', label: 'Playfair Display' },
    { value: 'EB Garamond', label: 'EB Garamond' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Open Sans', label: 'Open Sans' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Montserrat', label: 'Montserrat' },
    { value: 'Poppins', label: 'Poppins' },
    { value: 'Raleway', label: 'Raleway' },
    { value: 'Lato', label: 'Lato' },
    { value: 'Source Sans Pro', label: 'Source Sans Pro' },
    { value: 'Arial', label: `Arial (${t.sansSerif})` },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Verdana', label: 'Verdana' },
    { value: 'Fira Sans', label: 'Fira Sans' },
  ];

  const colorOptions = [
    { value: '#FE2C55', label: `TicDia Red (${t.default})`, color: '#FE2C55' },
    { value: '#20D5EC', label: 'TicDia Blue', color: '#20D5EC' },
    { value: '#FF6B6B', label: 'Coral Red', color: '#FF6B6B' },
    { value: '#4ECDC4', label: 'Turquoise', color: '#4ECDC4' },
    { value: '#45B7D1', label: 'Sky Blue', color: '#45B7D1' },
    { value: '#96CEB4', label: 'Mint Green', color: '#96CEB4' },
    { value: '#FFEAA7', label: 'Warm Yellow', color: '#FFEAA7' },
    { value: '#DDA0DD', label: 'Plum', color: '#DDA0DD' },
    { value: '#98D8C8', label: 'Seafoam', color: '#98D8C8' },
    { value: '#F7DC6F', label: 'Gold', color: '#F7DC6F' },
  ];

  if (!user) return null;

  const isMobile = window.innerWidth < 1024;
  
  // Desktop: Use new modern ProfileDesktop component
  if (!isMobile) {
    return <ProfileDesktop fontOptions={fontOptions} colorOptions={colorOptions} />;
  }

  // Mobile: Keep existing UI
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-foreground hover:bg-muted transition-all duration-300 hover:scale-105 self-start sm:self-auto"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="transition-all duration-500 ease-out text-center sm:text-left flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold">{t.profile}</h1>
            <p className="text-muted-foreground text-sm sm:text-base break-all sm:break-normal">{user.email}</p>
          </div>
          <Button
            variant="outline"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate("/");
            }}
            className="text-destructive hover:bg-destructive/10 border-destructive/30 transition-all duration-300"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <div className="relative bg-muted/50 backdrop-blur-xl border border-border p-1.5 rounded-2xl shadow-sm w-full sm:w-auto overflow-x-auto">
            <TabsList className="bg-transparent border-none p-0 h-auto w-full flex justify-between sm:justify-start gap-2">
              {[
                { id: "saved", icon: BookMarked, label: t.savedArticles, shortLabel: "Saved" },
                { id: "analytics", icon: BarChart3, label: "Analytics", shortLabel: "Stats" },
                { id: "settings", icon: null, label: t.title, shortLabel: "Settings" },
                { id: "security", icon: Lock, label: "Account Security", shortLabel: "Security" },
                ...(isAdmin ? [{ id: "admin", icon: Shield, label: "Admin", shortLabel: "Admin" }] : [])
              ].map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="relative z-10 data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all duration-300 ease-out rounded-xl text-xs sm:text-sm px-3 py-2.5 sm:px-5 sm:py-3 flex-1 sm:flex-none h-auto"
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="active-tab"
                      className="absolute inset-0 bg-wikitok-red rounded-xl shadow-[0_0_20px_rgba(254,44,85,0.3)]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <div className="relative z-20 flex items-center justify-center gap-2">
                    {tab.icon && <tab.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === tab.id ? 'text-white' : 'text-muted-foreground'}`} />}
                    <span className={`hidden sm:inline font-medium ${activeTab === tab.id ? 'text-white' : 'text-muted-foreground'}`}>{tab.label}</span>
                    <span className={`sm:hidden font-medium ${activeTab === tab.id ? 'text-white' : 'text-muted-foreground'}`}>{tab.shortLabel}</span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="saved" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="bg-card/50 backdrop-blur-xl border-border shadow-lg overflow-hidden">
                <CardHeader className="border-b border-border pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <CardTitle className="text-2xl font-bold text-foreground">{t.yourSaved}</CardTitle>
                      <CardDescription className="text-muted-foreground mt-1">
                        {savedArticles.length} {savedArticles.length !== 1 ? t.articles : t.article} {t.saved}
                      </CardDescription>
                    </div>
                    {savedArticles.length > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={removeAllSavedArticles}
                        className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-all duration-300 hover:scale-105"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t.clearAll}
                      </Button>
                    )}
                  </div>
                  {savedArticles.length > 0 && (
                    <div className="relative group">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 transition-colors group-focus-within:text-primary" />
                      <Input
                        placeholder={t.searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-background/50 border-border text-foreground focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
                      />
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-pulse text-wikitok-red">{t.loading}...</div>
                    </div>
                  ) : filteredArticles.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <div className="bg-muted/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <BookMarked className="w-10 h-10 opacity-50" />
                      </div>
                      <p className="text-lg font-medium text-foreground mb-2">{searchTerm ? t.noMatch : t.noSaved}</p>
                      <p className="text-sm text-muted-foreground">{searchTerm ? t.tryDifferent : t.startSaving}</p>
                    </div>
                  ) : (
                    <motion.div
                      className="divide-y divide-white/5"
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                    >
                      {filteredArticles.map((article) => (
                        <motion.div
                          key={article.id}
                          variants={itemVariants}
                          className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 hover:bg-muted/50 transition-colors cursor-pointer gap-4"
                          onClick={() => handleArticleClick(article)}
                        >
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-base sm:text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1.5">
                              {article.article_title}
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                              {t.savedOn} {new Date(article.saved_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-4 group-hover:translate-x-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleArticleClick(article);
                              }}
                              className="hover:bg-muted hover:text-foreground"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSavedArticle(article.id);
                              }}
                              className="hover:bg-red-500/20 hover:text-red-500 text-gray-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <AnalyticsStats />
            </motion.div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="bg-card/50 backdrop-blur-xl border-border shadow-lg overflow-hidden">
                <CardHeader className="border-b border-border pb-6">
                  <CardTitle className="text-2xl font-bold text-foreground">{t.readingPreferences}</CardTitle>
                  <CardDescription className="text-muted-foreground mt-1">
                    {t.customize} ({t.syncedToCloud})
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 p-6">
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-muted-foreground">{t.articleFont}</label>
                    <Select
                      value={userPreferences.fontFamily}
                      onValueChange={(value) => updateUserPrefs({ fontFamily: value })}
                    >
                      <SelectTrigger className="bg-background/50 border-border h-12 transition-all duration-300 hover:border-primary/50 focus:border-primary/50 focus:ring-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover backdrop-blur-xl border-border">
                        {fontOptions.map((font) => (
                          <SelectItem key={font.value} value={font.value} className="focus:bg-muted focus:text-foreground cursor-pointer py-3">
                            <span style={{ fontFamily: font.value }}>{font.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium text-muted-foreground">Smoke Effect</label>
                      <p className="text-xs text-muted-foreground">Show smoke trail on cursor (except on feed)</p>
                    </div>
                    <Switch
                      checked={userPreferences.smokeEffect}
                      onCheckedChange={(checked) => updateUserPrefs({ smokeEffect: checked })}
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-medium text-muted-foreground">{t.highlightColor}</label>
                    <Select
                      value={userPreferences.highlightColor}
                      onValueChange={(value) => updateUserPrefs({ highlightColor: value })}
                    >
                      <SelectTrigger className="bg-background/50 border-border h-12 transition-all duration-300 hover:border-primary/50 focus:border-primary/50 focus:ring-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover backdrop-blur-xl border-border">
                        {colorOptions.map((color) => (
                          <SelectItem key={color.value} value={color.value} className="focus:bg-muted focus:text-foreground cursor-pointer py-3">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-4 h-4 rounded-full shadow-lg ring-2 ring-border"
                                style={{ backgroundColor: color.color }}
                              />
                              <span>{color.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium text-muted-foreground">{t.backgroundOpacity}</label>
                      <span className="text-sm text-primary font-bold">{userPreferences.backgroundOpacity}%</span>
                    </div>
                    <Slider
                      value={[userPreferences.backgroundOpacity]}
                      onValueChange={(value) => updateUserPrefs({ backgroundOpacity: value[0] })}
                      max={100}
                      min={10}
                      step={5}
                      className="py-4"
                    />
                    <p className="text-xs text-gray-500">
                      {t.backgroundOpacityDesc}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium text-muted-foreground">Text Size</label>
                      <span className="text-sm text-primary font-bold">{userPreferences.fontSize}px</span>
                    </div>
                    <Slider
                      value={[userPreferences.fontSize]}
                      onValueChange={(value) => updateUserPrefs({ fontSize: value[0] })}
                      max={24}
                      min={12}
                      step={1}
                      className="py-4"
                    />
                    <p className="text-xs text-gray-500">
                      Adjust the size of article text for comfortable reading
                    </p>
                  </div>

                  <div className="space-y-6 pt-4 border-t border-border">
                    {/* Language Selector */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="space-y-1 flex-1">
                        <Label className="text-base font-medium text-foreground flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          {t.language || "Language"}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Change the language for articles and interface
                        </p>
                      </div>
                      <Select
                        value={currentLanguage.code}
                        onValueChange={(code) => {
                          const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
                          if (lang) setLanguage(lang);
                        }}
                      >
                        <SelectTrigger className="w-[180px] bg-background/50 border-border transition-all duration-300 hover:border-primary/50 focus:border-primary/50 focus:ring-primary/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover backdrop-blur-xl border-border max-h-[300px]">
                          {SUPPORTED_LANGUAGES.map((lang) => (
                            <SelectItem 
                              key={lang.code} 
                              value={lang.code}
                              className="focus:bg-muted focus:text-foreground cursor-pointer"
                            >
                              {lang.nativeName} ({lang.name})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Theme Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="space-y-1 flex-1">
                        <Label className="text-base font-medium text-foreground flex items-center gap-2">
                          {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                          {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Switch between dark and light theme
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleTheme}
                        className="w-[120px] bg-background/50 border-border hover:bg-muted transition-all duration-300"
                      >
                        {theme === 'dark' ? (
                          <>
                            <Moon className="w-4 h-4 mr-2" />
                            Dark
                          </>
                        ) : (
                          <>
                            <Sun className="w-4 h-4 mr-2" />
                            Light
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="space-y-1">
                        <Label className="text-base font-medium text-foreground">Text Animation</Label>
                        <p className="text-sm text-muted-foreground">
                          Show letter-by-letter text reveal animation
                        </p>
                      </div>
                      <Switch
                        checked={userPreferences.textAnimation !== false}
                        onCheckedChange={(checked) => updateUserPrefs({ textAnimation: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="space-y-1">
                        <Label className="text-base font-medium text-foreground">Liquid Glass Mode</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable Apple-style glassmorphism effects
                        </p>
                      </div>
                      <Switch
                        checked={userPreferences.liquidGlassMode}
                        onCheckedChange={async (checked) => {
                          await updateUserPrefs({ liquidGlassMode: checked });
                          window.location.reload();
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="space-y-1">
                        <Label className="text-base font-medium text-foreground flex items-center gap-2">
                          Feed Preference
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold border border-primary/20 uppercase tracking-wider">Beta</span>
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Choose how articles are selected for you
                        </p>
                      </div>
                      <Select
                        value={userPreferences.feedType || 'mixed'}
                        onValueChange={(value: 'random' | 'curated' | 'mixed') => updateUserPrefs({ feedType: value })}
                      >
                        <SelectTrigger className="w-[140px] bg-background/50 border-border transition-all duration-300 hover:border-primary/50 focus:border-primary/50 focus:ring-primary/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover backdrop-blur-xl border-border">
                          <SelectItem value="random" className="focus:bg-muted focus:text-foreground cursor-pointer">Random</SelectItem>
                          <SelectItem value="curated" className="focus:bg-muted focus:text-foreground cursor-pointer">AI Curated</SelectItem>
                          <SelectItem value="mixed" className="focus:bg-muted focus:text-foreground cursor-pointer">Mixed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="space-y-1">
                        <Label className="text-base font-medium text-foreground">Adult Content Filter</Label>
                        <p className="text-sm text-muted-foreground">
                          {userPreferences.allowAdultContent 
                            ? "Adult content is allowed (18+)" 
                            : "Adult content is filtered out"}
                        </p>
                      </div>
                      <Switch
                        checked={userPreferences.allowAdultContent}
                        onCheckedChange={(checked) => updateUserPrefs({ allowAdultContent: checked })}
                      />
                    </div>
                  </div>

                  <div className="p-6 bg-muted/30 rounded-xl border border-border mt-8">
                    <h4 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider text-xs">{t.preview}</h4>
                    <div
                      className="relative p-6 rounded-lg bg-cover bg-center overflow-hidden shadow-2xl transition-all duration-500 group"
                      style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3')",
                        height: '200px'
                      }}
                    >
                      <div
                        className="absolute inset-0 bg-black transition-all duration-500"
                        style={{ opacity: userPreferences.backgroundOpacity / 100 }}
                      />
                      <div className="relative z-10 h-full flex flex-col justify-between">
                        <p
                          className="text-white transition-all duration-300 leading-relaxed"
                          style={{
                            fontFamily: userPreferences.fontFamily,
                            fontSize: `${userPreferences.fontSize}px`
                          }}
                        >
                          {t.previewText}
                        </p>
                        <div>
                          <p className="text-xs text-gray-300 mb-2 font-medium">{t.progressPreview}</p>
                          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                            <div
                              className="h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                              style={{
                                backgroundColor: userPreferences.highlightColor,
                                width: '60%'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="security" className="space-y-4 sm:space-y-6 focus-visible:outline-none focus-visible:ring-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="grid gap-4 sm:gap-6"
            >
              {/* Email Change Section */}
              <Card className="bg-card/50 backdrop-blur-xl border-border shadow-lg overflow-hidden">
                <CardHeader className="pb-3 sm:pb-6 border-b border-border">
                  <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span className="text-sm sm:text-base text-foreground">Change Email Address</span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-muted-foreground ml-12">
                    Current email: <span className="text-foreground font-medium">{user.email}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-muted-foreground">New Email Address</label>
                    <Input
                      type="email"
                      placeholder="Enter new email address"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="bg-background/50 border-border text-foreground text-sm sm:text-base focus:border-primary/50 focus:ring-primary/20"
                    />
                  </div>
                  <Button
                    onClick={handleEmailChange}
                    disabled={emailLoading || !newEmail.trim()}
                    className="w-full bg-wikitok-red hover:bg-wikitok-red/80 transition-all duration-300 text-sm sm:text-base py-2 sm:py-3 shadow-lg shadow-wikitok-red/20"
                  >
                    {emailLoading ? "Updating..." : "Update Email"}
                  </Button>
                  <p className="text-xs text-gray-500 leading-relaxed text-center">
                    You will need to confirm the change in both your old and new email addresses.
                  </p>
                </CardContent>
              </Card>

              {/* Password Change Section */}
              <Card className="bg-card/50 backdrop-blur-xl border-border shadow-lg overflow-hidden">
                <CardHeader className="pb-3 sm:pb-6 border-b border-border">
                  <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span className="text-sm sm:text-base text-foreground">Change Password</span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-muted-foreground ml-12">
                    Update your account password for security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-muted-foreground">New Password</label>
                    <Input
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-background/50 border-border text-foreground text-sm sm:text-base focus:border-primary/50 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-muted-foreground">Confirm New Password</label>
                    <Input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-background/50 border-border text-foreground text-sm sm:text-base focus:border-primary/50 focus:ring-primary/20"
                    />
                  </div>
                  <Button
                    onClick={handlePasswordChange}
                    disabled={passwordLoading || !newPassword || !confirmPassword}
                    className="w-full bg-wikitok-red hover:bg-wikitok-red/80 transition-all duration-300 text-sm sm:text-base py-2 sm:py-3 shadow-lg shadow-wikitok-red/20"
                  >
                    {passwordLoading ? "Updating..." : "Update Password"}
                  </Button>
                  <p className="text-xs text-gray-500 leading-relaxed text-center">
                    Password must be at least 6 characters long.
                  </p>
                </CardContent>
              </Card>

              {/* Password Reset Section */}
              <Card className="bg-card/50 backdrop-blur-xl border-border shadow-lg overflow-hidden">
                <CardHeader className="pb-3 sm:pb-6 border-b border-border">
                  <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Key className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span className="text-sm sm:text-base text-foreground">Reset Password via Email</span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-muted-foreground ml-12">
                    Send a password reset link to your email address
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-muted-foreground">Email Address</label>
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="bg-background/50 border-border text-foreground text-sm sm:text-base focus:border-primary/50 focus:ring-primary/20"
                    />
                  </div>
                  <Button
                    onClick={handlePasswordReset}
                    disabled={resetLoading || !resetEmail.trim()}
                    variant="outline"
                    className="w-full border-white/10 text-white hover:bg-white/5 transition-all duration-300 text-sm sm:text-base py-2 sm:py-3"
                  >
                    {resetLoading ? "Sending..." : "Send Password Reset Email"}
                  </Button>
                  <p className="text-xs text-gray-500 leading-relaxed text-center">
                    You will receive an email with instructions to reset your password.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin" className="space-y-4 sm:space-y-6 focus-visible:outline-none focus-visible:ring-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                {/* Full Admin Panel Link */}
                <Card className="bg-destructive/10 backdrop-blur-xl border-destructive/30 shadow-lg overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Shield className="w-8 h-8 text-destructive" />
                        <div>
                          <h3 className="font-bold text-lg text-foreground">Full Admin Panel</h3>
                          <p className="text-sm text-muted-foreground">
                            Access announcements, moderation, feature flags, metrics and more
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => navigate("/admin")}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                      >
                        Open Admin Panel
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Word of the Day */}
                <Card className="bg-card/50 backdrop-blur-xl border-border shadow-lg overflow-hidden">
                  <CardHeader className="border-b border-border pb-6">
                    <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
                      <Globe className="w-6 h-6" />
                      Quick Actions
                    </CardTitle>
                    <CardDescription className="text-muted-foreground mt-1">
                      Manage word of the day
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="word-of-day" className="text-sm font-medium text-foreground mb-2 block">
                          Word of the Day
                        </Label>
                        {currentWordOfTheDay && (
                          <p className="text-sm text-muted-foreground mb-3">
                            Current word: <span className="font-semibold text-foreground">{currentWordOfTheDay}</span>
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Input
                            id="word-of-day"
                            placeholder="Enter word for today"
                            value={wordOfTheDay}
                            onChange={(e) => setWordOfTheDayState(e.target.value)}
                            className="bg-background/50 border-border text-foreground focus:border-primary/50 focus:ring-primary/20"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !wordOfTheDayLoading) {
                                handleSetWordOfTheDay();
                              }
                            }}
                          />
                          <Button
                            onClick={handleSetWordOfTheDay}
                            disabled={wordOfTheDayLoading || !wordOfTheDay.trim()}
                            className="bg-wikitok-red hover:bg-wikitok-red/90 text-white"
                          >
                            {wordOfTheDayLoading ? "Setting..." : "Set Word"}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          This word will appear as the first word in the Word Feed for all users today.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          )}
        </Tabs>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-800/50">
          <div className="text-center space-y-4">
            <div className="text-sm text-gray-400">
              <h4 className="font-medium mb-2">Site Map</h4>
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => navigate("/")}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Home
                </button>
                <button
                  onClick={() => navigate("/discover")}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Discover
                </button>
                <button
                  onClick={() => navigate("/today")}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={() => navigate("/profile")}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Profile
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Made with love in France by{' '}
              <a 
                href="/portfolio" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                Noa Wilhide
              </a>{' '}
              and Ben Camewell
            </p>
          </div>
        </div>
      </div>

      <Footer />

      <SmallTic
        isOpen={isSmallTicOpen}
        onClose={() => setIsSmallTicOpen(false)}
        article={selectedArticle}
        onOpenFull={handleOpenFull}
      />
    </div>
  );
};

export default Profile;
