import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Megaphone, Plus, Trash2, Edit, X, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, Announcement } from '@/services/adminService';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const AnnouncementsPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    announcement_type: 'banner' as 'banner' | 'modal' | 'toast',
    target_audience: 'all' as 'all' | 'authenticated' | 'anonymous',
    is_active: true,
    priority: 0,
    starts_at: '',
    ends_at: '',
  });

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await getAnnouncements(true);
      setAnnouncements(data);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      announcement_type: 'banner',
      target_audience: 'all',
      is_active: true,
      priority: 0,
      starts_at: '',
      ends_at: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (announcement: Announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      announcement_type: announcement.announcement_type,
      target_audience: announcement.target_audience,
      is_active: announcement.is_active,
      priority: announcement.priority,
      starts_at: announcement.starts_at?.slice(0, 16) || '',
      ends_at: announcement.ends_at?.slice(0, 16) || '',
    });
    setEditingId(announcement.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!user || !formData.title || !formData.content) {
      toast({ title: 'Error', description: 'Title and content are required', variant: 'destructive' });
      return;
    }

    try {
      const payload = {
        ...formData,
        starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : null,
        ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
        created_by: user.id,
      };

      if (editingId) {
        await updateAnnouncement(editingId, payload, user.id);
        toast({ title: 'Updated', description: 'Announcement updated successfully' });
      } else {
        await createAnnouncement(payload, user.id);
        toast({ title: 'Created', description: 'Announcement created successfully' });
      }
      resetForm();
      fetchAnnouncements();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !user) return;
    try {
      await deleteAnnouncement(deleteId, user.id);
      toast({ title: 'Deleted', description: 'Announcement deleted' });
      setDeleteId(null);
      fetchAnnouncements();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      banner: 'bg-blue-500/20 text-blue-400',
      modal: 'bg-purple-500/20 text-purple-400',
      toast: 'bg-green-500/20 text-green-400',
    };
    return <Badge className={colors[type] || ''}>{type}</Badge>;
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Announcements</CardTitle>
            </div>
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1" /> New
            </Button>
          </div>
          <CardDescription>
            Create banners, modals, and toast notifications for users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No announcements yet</div>
          ) : (
            announcements.map(a => (
              <div
                key={a.id}
                className={`p-3 rounded-lg border ${a.is_active ? 'bg-card' : 'bg-muted/50 opacity-60'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{a.title}</span>
                      {getTypeBadge(a.announcement_type)}
                      <Badge variant="outline" className="text-xs">{a.target_audience}</Badge>
                      {!a.is_active && <Badge variant="secondary">Inactive</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.content}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(a)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(a.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit' : 'Create'} Announcement</DialogTitle>
            <DialogDescription>
              Configure your announcement settings below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                placeholder="Announcement title"
              />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea
                value={formData.content}
                onChange={e => setFormData(p => ({ ...p, content: e.target.value }))}
                placeholder="Announcement content..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select
                  value={formData.announcement_type}
                  onValueChange={v => setFormData(p => ({ ...p, announcement_type: v as any }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="banner">Banner</SelectItem>
                    <SelectItem value="modal">Modal</SelectItem>
                    <SelectItem value="toast">Toast</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Audience</Label>
                <Select
                  value={formData.target_audience}
                  onValueChange={v => setFormData(p => ({ ...p, target_audience: v as any }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="authenticated">Signed In Only</SelectItem>
                    <SelectItem value="anonymous">Anonymous Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Starts At (optional)</Label>
                <Input
                  type="datetime-local"
                  value={formData.starts_at}
                  onChange={e => setFormData(p => ({ ...p, starts_at: e.target.value }))}
                />
              </div>
              <div>
                <Label>Ends At (optional)</Label>
                <Input
                  type="datetime-local"
                  value={formData.ends_at}
                  onChange={e => setFormData(p => ({ ...p, ends_at: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={v => setFormData(p => ({ ...p, is_active: v }))}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSubmit}>
              <Save className="w-4 h-4 mr-1" />
              {editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The announcement will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
