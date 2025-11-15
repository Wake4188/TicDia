import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { getArticleVoteCount, getUserVote, voteOnArticle, removeVote } from "@/services/votingService";
interface VoteButtonProps {
  articleId: string;
  articleTitle: string;
  articleUrl?: string;
}
const VoteButton = ({
  articleId,
  articleTitle,
  articleUrl
}: VoteButtonProps) => {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const {
    translations
  } = useLanguage();
  const t = translations;
  const [isVoted, setIsVoted] = useState(false);
  const [votes, setVotes] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    const checkVoteStatus = async () => {
      try {
        const [userVote, voteCount] = await Promise.all([
          user ? getUserVote(articleId) : Promise.resolve(null),
          getArticleVoteCount(articleId)
        ]);
        
        setIsVoted(!!userVote);
        setVotes(voteCount);
      } catch (error) {
        console.error('Error in vote check:', error);
      }
    };
    checkVoteStatus();
  }, [articleId, user]);
  const handleVote = async () => {
    if (!user) {
      toast({
        title: t.signIn + " required",
        description: "Please sign in to vote for articles.",
        action: <button onClick={() => navigate('/auth')} className="bg-tictok-red text-white px-3 py-1 rounded text-sm hover:bg-tictok-red/90">
            {t.signIn}
          </button>
      });
      return;
    }
    if (isLoading) return;
    setIsLoading(true);
    try {
      if (isVoted) {
        await removeVote(articleId);
        setIsVoted(false);
        setVotes(prev => Math.max(0, prev - 1));
        toast({
          title: "Vote removed",
          description: "Your vote has been removed."
        });
      } else {
        await voteOnArticle(articleId, articleTitle, articleUrl);
        setIsVoted(true);
        setVotes(prev => prev + 1);
        toast({
          title: "Voted!",
          description: "Your vote has been recorded."
        });
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Error",
        description: "Failed to record vote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="flex flex-col items-center text-white backdrop-blur-md bg-black/20 rounded-lg px-2 pt-1 pb-2">
      <button 
        className={`sidebar-icon ${isVoted ? 'text-tictok-red' : ''} ${isLoading ? 'opacity-50' : ''} min-w-[44px] min-h-[44px] flex items-center justify-center transition-all duration-200 active:scale-90 hover:scale-110`} 
        onClick={handleVote} 
        disabled={isLoading}
        aria-label={isVoted ? `Remove upvote from ${articleTitle}` : `Upvote ${articleTitle}`}
      >
        <ArrowUp className={`w-6 h-6 transition-all duration-300 ${isVoted ? 'fill-current scale-110' : 'scale-100'}`} />
      </button>
      <span className="text-xs font-medium text-left my-0 mx-0 px-[7px] py-0 transition-opacity duration-200">{isVoted ? t.upvote + "d" : t.upvote}</span>
      
    </div>;
};
export default VoteButton;