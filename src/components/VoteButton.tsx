import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp } from "lucide-react";
import { voteOnArticle, removeVote, getUserVote, getArticleVoteCount } from "@/services/votingService";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface VoteButtonProps {
  articleId: string;
  articleTitle: string;
  articleUrl?: string;
  compact?: boolean;
}

const VoteButton = ({ articleId, articleTitle, articleUrl, compact = false }: VoteButtonProps) => {
  const [hasVoted, setHasVoted] = useState(false);
  const [voteCount, setVoteCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadVoteStatus();
    }
  }, [articleId, user]);

  const loadVoteStatus = async () => {
    try {
      const [userVote, count] = await Promise.all([
        getUserVote(articleId),
        getArticleVoteCount(articleId)
      ]);
      setHasVoted(!!userVote);
      setVoteCount(count);
    } catch (error) {
      console.error('Error loading vote status:', error);
    }
  };

  const handleVote = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to vote on articles.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (hasVoted) {
        await removeVote(articleId);
        setHasVoted(false);
        setVoteCount(prev => prev - 1);
        toast({
          title: "Vote Removed",
          description: "Your vote has been removed.",
        });
      } else {
        await voteOnArticle(articleId, articleTitle, articleUrl);
        setHasVoted(true);
        setVoteCount(prev => prev + 1);
        toast({
          title: "Vote Recorded",
          description: "Thank you for voting!",
        });
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Error",
        description: "Failed to record vote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleVote}
        disabled={isLoading}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
          hasVoted 
            ? 'text-primary bg-primary/10' 
            : 'text-muted-foreground hover:text-primary'
        }`}
      >
        <ChevronUp className="h-3 w-3" />
        <span>{voteCount}</span>
      </button>
    );
  }

  return (
    <Button
      variant={hasVoted ? "default" : "outline"}
      size="sm"
      onClick={handleVote}
      disabled={isLoading}
      className="flex items-center gap-2"
    >
      <ChevronUp className="h-4 w-4" />
      <span>Upvote ({voteCount})</span>
    </Button>
  );
};

export default VoteButton;