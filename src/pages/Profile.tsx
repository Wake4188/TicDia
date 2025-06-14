
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
import { ArrowLeft, BookMarked } from "lucide-react";

interface SavedArticle {
  id: string;
  article_id: string;
  article_title: string;
  article_url: string;
  saved_at: string;
}

interface UserPreferences {
  fontFamily: string;
  backgroundOpacity: number;
}

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<UserPreferences>({
    fontFamily: 'Inter',
    backgroundOpacity: 70
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    // Load saved preferences from localStorage
    const savedPrefs = localStorage.getItem('userPreferences');
    if (savedPrefs) {
      setPreferences(JSON.parse(savedPrefs));
    }

    fetchSavedArticles();
  }, [user, navigate]);

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
        title: "Error",
        description: "Failed to load saved articles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = (newPrefs: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    localStorage.setItem('userPreferences', JSON.stringify(updated));
    
    // Apply font globally
    document.documentElement.style.setProperty('--user-font-family', updated.fontFamily);
    document.documentElement.style.setProperty('--background-opacity', `${updated.backgroundOpacity}%`);
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
        title: "Removed",
        description: "Article removed from saved articles",
      });
    } catch (error) {
      console.error('Error removing article:', error);
      toast({
        title: "Error",
        description: "Failed to remove article",
        variant: "destructive",
      });
    }
  };

  const fontOptions = [
    { value: 'Inter', label: 'Inter (Default)' },
    { value: 'Georgia', label: 'Georgia (Serif)' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Arial', label: 'Arial (Sans-serif)' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Verdana', label: 'Verdana' },
    { value: 'Open Sans', label: 'Open Sans' },
    { value: 'Roboto', label: 'Roboto' },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Profile</h1>
            <p className="text-gray-400">{user.email}</p>
          </div>
        </div>

        <Tabs defaultValue="saved" className="space-y-6">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="saved" className="data-[state=active]:bg-wikitok-red">
              <BookMarked className="w-4 h-4 mr-2" />
              Saved Articles
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-wikitok-red">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="saved" className="space-y-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Your Saved Articles</CardTitle>
                <CardDescription>
                  {savedArticles.length} article{savedArticles.length !== 1 ? 's' : ''} saved
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : savedArticles.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <BookMarked className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No saved articles yet</p>
                    <p className="text-sm">Start saving articles to see them here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedArticles.map((article) => (
                      <div key={article.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-medium">{article.article_title}</h3>
                          <p className="text-sm text-gray-400">
                            Saved on {new Date(article.saved_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeSavedArticle(article.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Reading Preferences</CardTitle>
                <CardDescription>
                  Customize your reading experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium">Article Font</label>
                  <Select 
                    value={preferences.fontFamily} 
                    onValueChange={(value) => updatePreferences({ fontFamily: value })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {fontOptions.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          <span style={{ fontFamily: font.value }}>{font.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">
                    Background Image Opacity: {preferences.backgroundOpacity}%
                  </label>
                  <Slider
                    value={[preferences.backgroundOpacity]}
                    onValueChange={(value) => updatePreferences({ backgroundOpacity: value[0] })}
                    max={100}
                    min={10}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-400">
                    Lower values make the background image less visible, improving text readability
                  </p>
                </div>

                <div className="p-4 bg-gray-800 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Preview</h4>
                  <div 
                    className="relative p-4 rounded bg-cover bg-center"
                    style={{
                      backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3')",
                    }}
                  >
                    <div 
                      className="absolute inset-0 bg-black rounded"
                      style={{ opacity: preferences.backgroundOpacity / 100 }}
                    />
                    <p 
                      className="relative z-10 text-white"
                      style={{ fontFamily: preferences.fontFamily }}
                    >
                      This is how your articles will look with the current settings.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
