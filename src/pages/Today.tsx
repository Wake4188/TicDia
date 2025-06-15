
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getRandomArticles } from "../services/wikipediaService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Plus, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TodayArticle {
  id: string;
  title: string;
  content: string;
  image: string;
  date: string;
}

const Today = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editingArticle, setEditingArticle] = useState<TodayArticle | null>(null);
  const [newArticle, setNewArticle] = useState({ title: "", content: "", image: "" });

  const isAdmin = user?.email === "jessica.wilhide@gmail.com";
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Mock data for today's articles - in real app this would come from a database
  const [todayArticles, setTodayArticles] = useState<TodayArticle[]>([
    {
      id: "1",
      title: "Breaking: Major Scientific Discovery",
      content: "Scientists have made a groundbreaking discovery that could change our understanding of the universe...",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop",
      date: new Date().toISOString().split('T')[0]
    }
  ]);

  const { data: wikipediaArticles, isLoading } = useQuery({
    queryKey: ["today-articles"],
    queryFn: () => getRandomArticles(5),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const handleAddArticle = () => {
    if (newArticle.title && newArticle.content) {
      const article: TodayArticle = {
        id: Date.now().toString(),
        title: newArticle.title,
        content: newArticle.content,
        image: newArticle.image || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop",
        date: new Date().toISOString().split('T')[0]
      };
      setTodayArticles([article, ...todayArticles]);
      setNewArticle({ title: "", content: "", image: "" });
      setIsEditing(false);
      toast({
        title: "Article added",
        description: "Your article has been added to today's feed.",
      });
    }
  };

  const handleDeleteArticle = (id: string) => {
    setTodayArticles(todayArticles.filter(article => article.id !== id));
    toast({
      title: "Article deleted",
      description: "The article has been removed.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div>Loading today's news...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="text-white hover:text-wikitok-red"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-wikitok-red">Today's Actualities</h1>
              <p className="text-gray-400">{today}</p>
            </div>
          </div>
          {isAdmin && (
            <Button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-wikitok-red hover:bg-red-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Article
            </Button>
          )}
        </div>

        {isAdmin && isEditing && (
          <div className="bg-gray-900 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">Add New Article</h3>
            <div className="space-y-4">
              <Input
                placeholder="Article title"
                value={newArticle.title}
                onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                className="bg-black border-gray-700 text-white"
              />
              <Input
                placeholder="Image URL (optional)"
                value={newArticle.image}
                onChange={(e) => setNewArticle({ ...newArticle, image: e.target.value })}
                className="bg-black border-gray-700 text-white"
              />
              <Textarea
                placeholder="Article content"
                value={newArticle.content}
                onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                className="bg-black border-gray-700 text-white min-h-32"
              />
              <div className="flex gap-2">
                <Button onClick={handleAddArticle} className="bg-wikitok-red hover:bg-red-600">
                  Add Article
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-6 text-wikitok-red">Featured News</h2>
            <div className="grid gap-6">
              {todayArticles.map((article) => (
                <div key={article.id} className="bg-gray-900 rounded-lg overflow-hidden">
                  <div className="md:flex">
                    <div className="md:w-1/3">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-48 md:h-full object-cover"
                      />
                    </div>
                    <div className="md:w-2/3 p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-semibold">{article.title}</h3>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteArticle(article.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-gray-300 leading-relaxed">{article.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-6 text-wikitok-red">From Wikipedia Today</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wikipediaArticles?.map((article) => (
                <div key={article.id} className="bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2">{article.title}</h3>
                    <p className="text-gray-400 text-sm line-clamp-3">{article.content}</p>
                    <div className="flex justify-between items-center mt-4 text-xs text-gray-500">
                      <span>{article.views.toLocaleString()} views</span>
                      <span>{article.readTime} min read</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Today;
