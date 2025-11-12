
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
import { ArrowLeft, BookMarked, Eye, Trash2, Search, Mail, Lock, Key } from "lucide-react";
import { Input } from "@/components/ui/input";
import SmallTic from "../components/SmallTic";
import { loadUserPreferences, saveUserPreferences, UserPreferences } from "@/services/userPreferencesService";
import { useLanguage } from "../contexts/LanguageContext";
import { useUserPreferences } from "@/hooks/useUserPreferences";

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
  const { currentLanguage, translations } = useLanguage();
  const t = translations;
  
  // Load user preferences to apply highlight color throughout the app
  const { userPreferences, updatePreferences: updateUserPrefs } = useUserPreferences();
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
  const [resetEmail, setResetEmail] = useState(user?.email || "");
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setResetEmail(user.email || "");
    fetchSavedArticles();
  }, [user, navigate]);

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
    { value: 'Inter', label: `Inter (${t.default})` },
    { value: 'Georgia', label: `Georgia (${t.serif})` },
    { value: 'Merriweather', label: 'Merriweather' },
    { value: 'Lora', label: 'Lora' },
    { value: 'Crimson Text', label: 'Crimson Text' },
    { value: 'PT Serif', label: 'PT Serif' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Open Sans', label: 'Open Sans' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Arial', label: `Arial (${t.sansSerif})` },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Verdana', label: 'Verdana' },
  ];

  const colorOptions = [
    { value: '#FE2C55', label: `TicTok Red (${t.default})`, color: '#FE2C55' },
    { value: '#20D5EC', label: 'WikTok Blue', color: '#20D5EC' },
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

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/")}
            className="text-white hover:bg-white/10 transition-all duration-300 hover:scale-105 self-start sm:self-auto"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="transition-all duration-500 ease-out text-center sm:text-left w-full sm:w-auto">
            <h1 className="text-2xl sm:text-3xl font-bold">{t.profile}</h1>
            <p className="text-gray-400 text-sm sm:text-base break-all sm:break-normal">{user.email}</p>
          </div>
        </div>

        <Tabs defaultValue="saved" className="space-y-4 sm:space-y-6">
          <TabsList className="bg-gray-800/50 backdrop-blur-md border border-gray-700/50 p-1 rounded-xl shadow-2xl w-full sm:w-auto grid grid-cols-3 sm:flex">
            <TabsTrigger 
              value="saved" 
              className="data-[state=active]:bg-wikitok-red/20 data-[state=active]:backdrop-blur-md data-[state=active]:border data-[state=active]:border-wikitok-red/30 data-[state=active]:shadow-lg transition-all duration-500 ease-out rounded-lg text-xs sm:text-sm px-2 sm:px-4"
            >
              <BookMarked className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 transition-transform duration-300" />
              <span className="hidden sm:inline">{t.savedArticles}</span>
              <span className="sm:hidden">Saved</span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="data-[state=active]:bg-wikitok-red/20 data-[state=active]:backdrop-blur-md data-[state=active]:border data-[state=active]:border-wikitok-red/30 data-[state=active]:shadow-lg transition-all duration-500 ease-out rounded-lg text-xs sm:text-sm px-2 sm:px-4"
            >
              <span className="hidden sm:inline">{t.title}</span>
              <span className="sm:hidden">Settings</span>
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="data-[state=active]:bg-wikitok-red/20 data-[state=active]:backdrop-blur-md data-[state=active]:border data-[state=active]:border-wikitok-red/30 data-[state=active]:shadow-lg transition-all duration-500 ease-out rounded-lg text-xs sm:text-sm px-2 sm:px-4"
            >
              <Lock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 transition-transform duration-300" />
              <span className="hidden sm:inline">Account Security</span>
              <span className="sm:hidden">Security</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="saved" className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
            <Card className="bg-gray-900/80 backdrop-blur-md border-gray-800/50 shadow-2xl transition-all duration-500 hover:shadow-wikitok-red/10 hover:shadow-xl">
              <CardHeader className="transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t.yourSaved}</CardTitle>
                    <CardDescription>
                      {savedArticles.length} {savedArticles.length !== 1 ? t.articles : t.article} {t.saved}
                    </CardDescription>
                  </div>
                  {savedArticles.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={removeAllSavedArticles}
                      className="transition-all duration-300 hover:scale-105"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t.clearAll}
                    </Button>
                  )}
                </div>
                {savedArticles.length > 0 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder={t.searchPlaceholder}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-gray-800/60 border-gray-700/50 text-white"
                    />
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-pulse">{t.loading}...</div>
                  </div>
                ) : filteredArticles.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <BookMarked className="w-12 h-12 mx-auto mb-4 opacity-50 animate-pulse" />
                    <p>{searchTerm ? t.noMatch : t.noSaved}</p>
                    <p className="text-sm">{searchTerm ? t.tryDifferent : t.startSaving}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredArticles.map((article, index) => (
                      <div 
                        key={article.id} 
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-700/30 transition-all duration-300 hover:bg-gray-700/60 hover:border-gray-600/50 hover:scale-[1.02] animate-in fade-in-50 slide-in-from-left-4 cursor-pointer space-y-3 sm:space-y-0"
                        style={{ animationDelay: `${index * 100}ms` }}
                        onClick={() => handleArticleClick(article)}
                      >
                        <div className="flex-1 w-full sm:w-auto">
                          <h3 className="font-medium text-sm sm:text-base break-words">{article.article_title}</h3>
                          <p className="text-xs sm:text-sm text-gray-400">
                            {t.savedOn} {new Date(article.saved_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto justify-end sm:justify-start">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArticleClick(article);
                            }}
                            className="transition-all duration-300 hover:scale-105 flex-1 sm:flex-none"
                          >
                            <Eye className="w-4 h-4 mr-2 sm:mr-0" />
                            <span className="sm:hidden">View</span>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSavedArticle(article.id);
                            }}
                            className="transition-all duration-300 hover:scale-105 flex-1 sm:flex-none"
                          >
                            <Trash2 className="w-4 h-4 mr-2 sm:mr-0" />
                            <span className="sm:hidden">Delete</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
            <Card className="bg-gray-900/80 backdrop-blur-md border-gray-800/50 shadow-2xl transition-all duration-500 hover:shadow-wikitok-red/10 hover:shadow-xl">
              <CardHeader className="transition-all duration-300">
                <CardTitle>{t.readingPreferences}</CardTitle>
                <CardDescription>
                  {t.customize} ({t.syncedToCloud})
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3 animate-in fade-in-50 slide-in-from-left-4 duration-500">
                  <label className="text-sm font-medium">{t.articleFont}</label>
                  <Select 
                    value={userPreferences.fontFamily} 
                    onValueChange={(value) => updateUserPrefs({ fontFamily: value })}
                  >
                        <SelectTrigger className="bg-gray-800/60 backdrop-blur-sm border-gray-700/50 transition-all duration-300 hover:border-gray-600/70 focus:border-wikitok-red/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800/90 backdrop-blur-md border-gray-700/50">
                          {fontOptions.map((font) => (
                            <SelectItem key={font.value} value={font.value} className="transition-all duration-200 hover:bg-gray-700/60">
                              <span style={{ fontFamily: font.value }}>{font.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                <div className="space-y-3 animate-in fade-in-50 slide-in-from-left-4 duration-500" style={{ animationDelay: "100ms" }}>
                  <label className="text-sm font-medium">{t.highlightColor}</label>
                  <Select 
                    value={userPreferences.highlightColor} 
                    onValueChange={(value) => updateUserPrefs({ highlightColor: value })}
                  >
                        <SelectTrigger className="bg-gray-800/60 backdrop-blur-sm border-gray-700/50 transition-all duration-300 hover:border-gray-600/70 focus:border-wikitok-red/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800/90 backdrop-blur-md border-gray-700/50">
                          {colorOptions.map((color) => (
                            <SelectItem key={color.value} value={color.value} className="transition-all duration-200 hover:bg-gray-700/60">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-4 h-4 rounded transition-transform duration-200 hover:scale-110"
                                  style={{ backgroundColor: color.color }}
                                />
                                <span>{color.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                <div className="space-y-3 animate-in fade-in-50 slide-in-from-left-4 duration-500" style={{ animationDelay: "200ms" }}>
                  <label className="text-sm font-medium">
                    {t.backgroundOpacity}: {userPreferences.backgroundOpacity}%
                  </label>
                  <Slider
                    value={[userPreferences.backgroundOpacity]}
                    onValueChange={(value) => updateUserPrefs({ backgroundOpacity: value[0] })}
                    max={100}
                    min={10}
                    step={5}
                    className="w-full transition-all duration-300"
                  />
                  <p className="text-xs text-gray-400">
                    {t.backgroundOpacityDesc}
                  </p>
                </div>

                <div className="space-y-3 animate-in fade-in-50 slide-in-from-left-4 duration-500" style={{ animationDelay: "250ms" }}>
                  <label className="text-sm font-medium">
                    Text Size: {userPreferences.fontSize}px
                  </label>
                  <Slider
                    value={[userPreferences.fontSize]}
                    onValueChange={(value) => updateUserPrefs({ fontSize: value[0] })}
                    max={24}
                    min={12}
                    step={1}
                    className="w-full transition-all duration-300"
                  />
                  <p className="text-xs text-gray-400">
                    Adjust the size of article text for comfortable reading
                  </p>
                </div>

                <div className="p-4 bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-700/30 transition-all duration-500 hover:border-gray-600/50 animate-in fade-in-50 slide-in-from-bottom-4" style={{ animationDelay: "300ms" }}>
                  <h4 className="text-sm font-medium mb-2">{t.preview}</h4>
                  <div 
                    className="relative p-4 rounded bg-cover bg-center overflow-hidden transition-all duration-500"
                    style={{
                      backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3')",
                    }}
                  >
                    <div 
                      className="absolute inset-0 bg-black rounded transition-all duration-500"
                      style={{ opacity: userPreferences.backgroundOpacity / 100 }}
                    />
                    <p 
                      className="relative z-10 text-white mb-4 transition-all duration-300"
                      style={{ 
                        fontFamily: userPreferences.fontFamily,
                        fontSize: `${userPreferences.fontSize}px`
                      }}
                    >
                      {t.previewText}
                    </p>
                    <div className="relative z-10">
                      <p className="text-xs text-gray-300 mb-1">{t.progressPreview}:</p>
                      <div className="h-1 bg-black/20 rounded overflow-hidden">
                        <div 
                          className="h-full rounded transition-all duration-500 ease-out"
                          style={{ 
                            backgroundColor: userPreferences.highlightColor,
                            width: '60%'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4 sm:space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
            <div className="grid gap-4 sm:gap-6">
              {/* Email Change Section */}
              <Card className="bg-gray-900/80 backdrop-blur-md border-gray-800/50 shadow-2xl transition-all duration-500 hover:shadow-wikitok-red/10 hover:shadow-xl">
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm sm:text-base">Change Email Address</span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Current email: <span className="break-all">{user.email}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium">New Email Address</label>
                    <Input
                      type="email"
                      placeholder="Enter new email address"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="bg-gray-800/60 border-gray-700/50 text-white text-sm sm:text-base"
                    />
                  </div>
                  <Button 
                    onClick={handleEmailChange}
                    disabled={emailLoading || !newEmail.trim()}
                    className="w-full bg-wikitok-red hover:bg-wikitok-red/80 transition-all duration-300 text-sm sm:text-base py-2 sm:py-3"
                  >
                    {emailLoading ? "Updating..." : "Update Email"}
                  </Button>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    You will need to confirm the change in both your old and new email addresses.
                  </p>
                </CardContent>
              </Card>

              {/* Password Change Section */}
              <Card className="bg-gray-900/80 backdrop-blur-md border-gray-800/50 shadow-2xl transition-all duration-500 hover:shadow-wikitok-red/10 hover:shadow-xl">
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm sm:text-base">Change Password</span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Update your account password for security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium">New Password</label>
                    <Input
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-gray-800/60 border-gray-700/50 text-white text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium">Confirm New Password</label>
                    <Input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-gray-800/60 border-gray-700/50 text-white text-sm sm:text-base"
                    />
                  </div>
                  <Button 
                    onClick={handlePasswordChange}
                    disabled={passwordLoading || !newPassword || !confirmPassword}
                    className="w-full bg-wikitok-red hover:bg-wikitok-red/80 transition-all duration-300 text-sm sm:text-base py-2 sm:py-3"
                  >
                    {passwordLoading ? "Updating..." : "Update Password"}
                  </Button>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Password must be at least 6 characters long.
                  </p>
                </CardContent>
              </Card>

              {/* Password Reset Section */}
              <Card className="bg-gray-900/80 backdrop-blur-md border-gray-800/50 shadow-2xl transition-all duration-500 hover:shadow-wikitok-red/10 hover:shadow-xl">
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Key className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm sm:text-base">Reset Password via Email</span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Send a password reset link to your email address
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium">Email Address</label>
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="bg-gray-800/60 border-gray-700/50 text-white text-sm sm:text-base"
                    />
                  </div>
                  <Button 
                    onClick={handlePasswordReset}
                    disabled={resetLoading || !resetEmail.trim()}
                    variant="outline"
                    className="w-full border-gray-600 text-white hover:bg-gray-800 transition-all duration-300 text-sm sm:text-base py-2 sm:py-3"
                  >
                    {resetLoading ? "Sending..." : "Send Password Reset Email"}
                  </Button>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    You will receive an email with instructions to reset your password.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
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
              Made with love in France by Noa Wilhide
            </p>
          </div>
        </div>
      </div>

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
