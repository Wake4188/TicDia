import { Hash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMobileDetection } from "../hooks/useMobileDetection";
import VoteButton from "./VoteButton";
const LeftSidebar = ({
  article,
  onTagClick
}) => {
  const navigate = useNavigate();
  const isMobile = useMobileDetection();
  const handleTagClick = (tag: string) => {
    navigate(`/?q=${encodeURIComponent(tag)}`);
    onTagClick(tag);
  };
  return <div className="fixed left-4 bottom-20 flex flex-col space-y-4 z-50">
      {/* Hide tags on mobile */}
      {!isMobile}
      <div className="space-y-2">
        {article.relatedArticles.map(related => <div key={related.id} className="w-8 h-8 rounded-full overflow-hidden hover:ring-2 hover:ring-wikitok-red transition-all cursor-pointer">
            <img src={related.image} alt={related.title} className="w-full h-full object-cover" />
          </div>)}
      </div>
      
      {/* Vote Button - Desktop only */}
      {!isMobile && <VoteButton articleId={article.id?.toString() || article.title} articleTitle={article.title} articleUrl={article.url} />}
    </div>;
};
export default LeftSidebar;