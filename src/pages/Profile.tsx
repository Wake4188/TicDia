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
import { ProfileMobile } from "@/components/profile/ProfileMobile";

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
  
  // Desktop: Use modern ProfileDesktop component
  if (!isMobile) {
    return <ProfileDesktop fontOptions={fontOptions} colorOptions={colorOptions} />;
  }

  // Mobile: Use Apple Settings-style ProfileMobile component
  return <ProfileMobile fontOptions={fontOptions} colorOptions={colorOptions} />;
};

export default Profile;
