import { useState, useEffect } from 'react';
import { X, Bell, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from '@/components/ui/use-toast';

export const AnnouncementDisplay = () => {
  const { banners, modals, toasts, dismissAnnouncement, loading } = useAnnouncements();
  const { toast } = useToast();
  const [shownToasts, setShownToasts] = useState<Set<string>>(new Set());
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Show toast announcements
  useEffect(() => {
    toasts.forEach(announcement => {
      if (!shownToasts.has(announcement.id)) {
        toast({
          title: announcement.title,
          description: announcement.content,
          action: (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dismissAnnouncement(announcement.id)}
            >
              Dismiss
            </Button>
          ),
        });
        setShownToasts(prev => new Set(prev).add(announcement.id));
      }
    });
  }, [toasts, shownToasts, toast, dismissAnnouncement]);

  // Show first modal
  useEffect(() => {
    if (modals.length > 0 && !activeModal) {
      setActiveModal(modals[0].id);
    }
  }, [modals, activeModal]);

  if (loading) return null;

  const currentModal = modals.find(m => m.id === activeModal);

  return (
    <>
      {/* Banner Announcements */}
      {banners.map(banner => (
        <div
          key={banner.id}
          className="fixed top-0 left-0 right-0 z-[100] bg-primary text-primary-foreground px-4 py-2"
        >
          <div className="container mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Bell className="w-4 h-4 shrink-0" />
              <span className="font-medium truncate">{banner.title}</span>
              <span className="hidden sm:inline text-primary-foreground/80">—</span>
              <span className="hidden sm:inline text-primary-foreground/80 truncate">{banner.content}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => dismissAnnouncement(banner.id)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}

      {/* Modal Announcements */}
      <Dialog 
        open={!!currentModal} 
        onOpenChange={(open) => {
          if (!open && currentModal) {
            dismissAnnouncement(currentModal.id);
            setActiveModal(null);
          }
        }}
      >
        {currentModal && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                {currentModal.title}
              </DialogTitle>
              <DialogDescription className="pt-2">
                {currentModal.content}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => {
                dismissAnnouncement(currentModal.id);
                setActiveModal(null);
              }}>
                Got it
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Spacer for banners */}
      {banners.length > 0 && <div className="h-10" />}
    </>
  );
};
