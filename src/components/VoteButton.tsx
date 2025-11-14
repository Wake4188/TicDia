import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
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
      if (!user) return;
      try {
        const {
          data: voteData,
          error: voteError
        } = await supabase.from('article_votes').select('id').eq('article_id', articleId).eq('user_id', user.id).maybeSingle();
        if (voteError) {
          console.error('Error checking vote status:', voteError);
          return;
        }
        setIsVoted(!!voteData);
        const {
          data: voteCounts,
          error: countError
        } = await supabase.from('article_votes').select('id').eq('article_id', articleId);
        if (countError) {
          console.error('Error fetching vote count:', countError);
          return;
        }
        setVotes(voteCounts?.length || 0);
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
        const {
          error
        } = await supabase.from('article_votes').delete().eq('article_id', articleId).eq('user_id', user.id);
        if (error) throw error;
        setIsVoted(false);
        setVotes(prev => Math.max(0, prev - 1));
        toast({
          title: "Vote removed",
          description: "Your vote has been removed."
        });
      } else {
        const {
          error
        } = await supabase.from('article_votes').insert({
          article_id: articleId,
          user_id: user.id,
          article_title: articleTitle,
          article_url: articleUrl
        });
        if (error) throw error;
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