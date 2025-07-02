import { motion } from "framer-motion";
import { Progress } from "./ui/progress";
import { UserPreferences } from "@/services/userPreferencesService";
interface ArticleItemProps {
  article: any;
  index: number;
  isCurrent: boolean;
  displayedText: string;
  progress: number;
  userPreferences: UserPreferences;
  isMobile: boolean;
}
const ArticleItem = ({
  article,
  index,
  isCurrent,
  displayedText,
  progress,
  userPreferences,
  isMobile
}: ArticleItemProps) => {
  // Always show full content, only animate when current
  const contentToShow = isCurrent && displayedText ? displayedText : article.content;
  return <div data-index={index} className="article-section h-screen w-screen snap-start snap-always relative flex items-center justify-center">
      <div className="absolute inset-0 w-screen h-screen">
        <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black" style={{
        opacity: userPreferences.backgroundOpacity / 100
      }} />
      </div>
      
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.5,
      ease: "easeOut"
    }} className="relative z-10 text-white p-4 sm:p-8 max-w-3xl mx-auto h-full flex flex-col justify-center">
        <div className={`${isMobile ? 'bg-black/40 backdrop-blur-sm rounded-lg p-4 max-h-[70vh] overflow-y-auto' : 'text-center'}`}>
          <div className="space-y-4">
            <h1 className="text-2xl sm:text-4xl font-bold" style={{
            fontFamily: userPreferences.fontFamily
          }}>
              {article.title}
            </h1>
            <div className="max-w-2xl">
              <p className="text-sm sm:text-lg leading-relaxed" style={{
              fontFamily: userPreferences.fontFamily
            }}>
                {contentToShow}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-300 flex-shrink-0 mt-4">
          <span>{article.readTime} min read</span>
          <span>•</span>
          <span>{article.views.toLocaleString()} views</span>
        </div>
      </motion.div>
      
      {isCurrent && progress > 0 && <div className="absolute bottom-0 left-0 right-0 z-20">
          <Progress value={progress} className="h-1 bg-black/20" indicatorClassName="transition-colors duration-300" style={{
        '--progress-bar-color': userPreferences.highlightColor
      } as React.CSSProperties} />
        </div>}
      
      {isMobile && <div className="absolute bottom-24 right-4 z-20">
          
        </div>}
    </div>;
};
export default ArticleItem;