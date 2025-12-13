import { useRef, useCallback } from "react";

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
}

export function useSwipeGesture({ onSwipeLeft, onSwipeRight }: SwipeHandlers) {
  const touchState = useRef<TouchState | null>(null);
  
  const SWIPE_THRESHOLD = 80; // minimum distance for swipe
  const SWIPE_VELOCITY_THRESHOLD = 0.3; // minimum velocity (px/ms)
  const MAX_VERTICAL_RATIO = 0.5; // max vertical movement relative to horizontal
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
    };
  }, []);
  
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchState.current) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchState.current.startX;
    const deltaY = touch.clientY - touchState.current.startY;
    const deltaTime = Date.now() - touchState.current.startTime;
    
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const velocity = absX / deltaTime;
    
    // Check if it's a horizontal swipe
    if (absX > SWIPE_THRESHOLD && 
        velocity > SWIPE_VELOCITY_THRESHOLD &&
        absY < absX * MAX_VERTICAL_RATIO) {
      
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    }
    
    touchState.current = null;
  }, [onSwipeLeft, onSwipeRight]);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    touchState.current = {
      startX: e.clientX,
      startY: e.clientY,
      startTime: Date.now(),
    };
  }, []);
  
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!touchState.current) return;
    
    const deltaX = e.clientX - touchState.current.startX;
    const deltaY = e.clientY - touchState.current.startY;
    const deltaTime = Date.now() - touchState.current.startTime;
    
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const velocity = absX / deltaTime;
    
    if (absX > SWIPE_THRESHOLD && 
        velocity > SWIPE_VELOCITY_THRESHOLD &&
        absY < absX * MAX_VERTICAL_RATIO) {
      
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    }
    
    touchState.current = null;
  }, [onSwipeLeft, onSwipeRight]);
  
  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
  };
}
