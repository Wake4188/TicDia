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
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { translations } = useLanguage();
  const t = translations;

  const [isVoted, setIsVoted] = useState(false);
  const [votes, setVotes] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

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
        setShowParticles(true);
        setTimeout(() => setShowParticles(false), 1000);
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

  return (
    <div className="relative">
      <button
        className={`
          w-12 h-12 rounded-xl flex items-center justify-center
          transition-all duration-300 ease-out
          ${isVoted
            ? 'bg-tictok-red shadow-[0_0_20px_rgba(234,56,76,0.5)]'
            : 'bg-gray-700/80 hover:bg-gray-600/80'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          hover:scale-110 active:scale-95
          backdrop-blur-sm
        `}
        onClick={handleVote}
        disabled={isLoading}
        aria-label={isVoted ? `Remove upvote from ${articleTitle}` : `Upvote ${articleTitle}`}
      >
        <ArrowUp
          className={`
            w-6 h-6 transition-all duration-300
            ${isVoted ? 'text-white scale-110' : 'text-white/90'}
          `}
          strokeWidth={2.5}
        />
      </button>

      {/* Particle explosion effect */}
      {showParticles && (
        <>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 w-2 h-2 bg-tictok-red rounded-full"
              style={{
                animation: `particle-explode-${i} 0.6s ease-out forwards`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </>
      )}

      <style>{`
        @keyframes particle-explode-0 {
          to {
            transform: translate(calc(-50% + 40px), calc(-50% + 0px));
            opacity: 0;
          }
        }
        @keyframes particle-explode-1 {
          to {
            transform: translate(calc(-50% + 28px), calc(-50% + 28px));
            opacity: 0;
          }
        }
        @keyframes particle-explode-2 {
          to {
            transform: translate(calc(-50% + 0px), calc(-50% + 40px));
            opacity: 0;
          }
        }
        @keyframes particle-explode-3 {
          to {
            transform: translate(calc(-50% - 28px), calc(-50% + 28px));
            opacity: 0;
          }
        }
        @keyframes particle-explode-4 {
          to {
            transform: translate(calc(-50% - 40px), calc(-50% + 0px));
            opacity: 0;
          }
        }
        @keyframes particle-explode-5 {
          to {
            transform: translate(calc(-50% - 28px), calc(-50% - 28px));
            opacity: 0;
          }
        }
        @keyframes particle-explode-6 {
          to {
            transform: translate(calc(-50% + 0px), calc(-50% - 40px));
            opacity: 0;
          }
        }
        @keyframes particle-explode-7 {
          to {
            transform: translate(calc(-50% + 28px), calc(-50% - 28px));
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default VoteButton;