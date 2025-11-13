import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export const ArticleItemSkeleton = () => (
  <div 
    className="h-screen w-screen snap-start snap-always relative flex items-center justify-center"
    style={{ aspectRatio: '16/9', minHeight: '100vh' }}
  >
    <div className="absolute inset-0 w-screen h-screen">
      <Skeleton className="w-full h-full" style={{ aspectRatio: '16/9' }} />
      <div className="absolute inset-0 bg-black/40" />
    </div>
    
    <div className="relative z-10 text-white p-4 sm:p-8 max-w-3xl mx-auto h-full flex flex-col justify-center">
      <div className="space-y-4" style={{ minHeight: '200px' }}>
        <Skeleton className="h-8 w-3/4 mx-auto" style={{ minHeight: '32px' }} />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" style={{ minHeight: '16px' }} />
          <Skeleton className="h-4 w-full" style={{ minHeight: '16px' }} />
          <Skeleton className="h-4 w-2/3" style={{ minHeight: '16px' }} />
        </div>
        <Skeleton className="h-10 w-32 mx-auto" style={{ minHeight: '40px' }} />
      </div>
    </div>
  </div>
);

export const NewsCardSkeleton = () => (
  <Card className="bg-gray-900/50 border-gray-800 animate-pulse">
    <CardContent className="p-6">
      <div className="flex gap-4">
        <Skeleton className="w-32 h-20 rounded flex-shrink-0" style={{ aspectRatio: '16/9' }} />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
          <div className="flex justify-between items-center mt-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export const TodayArticleSkeleton = () => (
  <Card className="bg-gray-900/50 border-gray-800 animate-pulse">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="w-4 h-4 flex-shrink-0 ml-4" />
      </div>
    </CardContent>
  </Card>
);

export const DiscoverItemSkeleton = () => (
  <Skeleton className="aspect-[9/16] rounded-lg bg-white/10" />
);