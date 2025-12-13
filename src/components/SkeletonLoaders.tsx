import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export const ArticleItemSkeleton = () => (
  <div 
    className="h-screen w-screen snap-start snap-always relative flex items-center justify-center"
    style={{ 
      minHeight: '100vh',
      minWidth: '100vw',
      contain: 'layout style paint',
      containIntrinsicSize: '100vw 100vh',
    }}
  >
    <div className="absolute inset-0 w-full h-full">
      <Skeleton 
        className="w-full h-full" 
        style={{ 
          position: 'absolute',
          inset: 0,
        }} 
      />
      <div className="absolute inset-0 bg-background/40" />
    </div>
    
    <div className="relative z-10 text-foreground p-4 sm:p-8 max-w-3xl mx-auto h-full flex flex-col justify-center">
      <div className="space-y-4" style={{ minHeight: '200px' }}>
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="h-10 w-32 mx-auto" />
      </div>
    </div>
  </div>
);

export const NewsCardSkeleton = () => (
  <Card className="bg-muted/10 border-border animate-pulse" style={{ contain: 'layout style paint' }}>
    <CardContent className="p-6">
      <div className="flex gap-4">
        <Skeleton className="w-32 h-20 rounded flex-shrink-0" />
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
  <Card className="bg-muted/10 border-border animate-pulse" style={{ contain: 'layout style paint' }}>
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
  <Skeleton 
    className="aspect-[9/16] rounded-lg bg-muted/10" 
    style={{ contain: 'layout style paint' }}
  />
);