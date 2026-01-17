import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Plus, Trash2, Edit, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getModerationItems, createModerationItem, updateModerationItem, deleteModerationItem, ContentModeration } from '@/services/adminService';
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

export const ContentModerationPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<ContentModeration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    content_type: 'article',
    content_id: '',
    content_title: '',
    moderation_status: 'pending' as ContentModeration['moderation_status'],
    is_hidden: false,
    admin_notes: '',
  });

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await getModerationItems();
      setItems(data);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const resetForm = () => {
    setFormData({
      content_type: 'article',
      content_id: '',
      content_title: '',
      moderation_status: 'pending',
      is_hidden: false,
      admin_notes: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (item: ContentModeration) => {
    setFormData({
      content_type: item.content_type,
      content_id: item.content_id,
      content_title: item.content_title || '',
      moderation_status: item.moderation_status,
      is_hidden: item.is_hidden,
      admin_notes: item.admin_notes || '',
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!user || !formData.content_id) {
      toast({ title: 'Error', description: 'Content ID is required', variant: 'destructive' });
      return;
    }

    try {
      const payload = {
        ...formData,
        content_title: formData.content_title || null,
        admin_notes: formData.admin_notes || null,
        moderated_by: user.id,
      };

      if (editingId) {
        await updateModerationItem(editingId, payload, user.id);
        toast({ title: 'Updated', description: 'Moderation status updated' });
      } else {
        await createModerationItem(payload, user.id);
        toast({ title: 'Created', description: 'Content flagged for moderation' });
      }
      resetForm();
      fetchItems();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !user) return;
    try {
      await deleteModerationItem(deleteId, user.id);
      toast({ title: 'Deleted', description: 'Moderation entry removed' });
      setDeleteId(null);
      fetchItems();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      reviewed: 'bg-blue-500/20 text-blue-400',
      low_quality: 'bg-orange-500/20 text-orange-400',
      restricted: 'bg-red-500/20 text-red-400',
      shadow_hidden: 'bg-gray-500/20 text-gray-400',
    };
    return <Badge className={styles[status] || ''}>{status.replace('_', ' ')}</Badge>;
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Content Moderation</CardTitle>
            </div>
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1" /> Flag
            </Button>
          </div>
          <CardDescription>
            Flag, review, and shadow-hide content without permanent deletion.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No moderated content</div>
          ) : (
            items.map(item => (
              <div
                key={item.id}
                className={`p-3 rounded-lg border ${item.is_hidden ? 'bg-muted/50' : 'bg-card'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.is_hidden ? (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Eye className="w-4 h-4 text-green-400" />
                      )}
                      <span className="font-medium truncate">{item.content_title || item.content_id}</span>
                      {getStatusBadge(item.moderation_status)}
                      <Badge variant="outline" className="text-xs">{item.content_type}</Badge>
                    </div>
                    {item.admin_notes && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        📝 {item.admin_notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)}>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit' : 'Flag'} Content</DialogTitle>
            <DialogDescription>
              Set moderation status and add internal notes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Content Type</Label>
                <Select
                  value={formData.content_type}
                  onValueChange={v => setFormData(p => ({ ...p, content_type: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="topic">Topic</SelectItem>
                    <SelectItem value="source">Source</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={formData.moderation_status}
                  onValueChange={v => setFormData(p => ({ ...p, moderation_status: v as any }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="low_quality">Low Quality</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                    <SelectItem value="shadow_hidden">Shadow Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Content ID</Label>
              <Input
                value={formData.content_id}
                onChange={e => setFormData(p => ({ ...p, content_id: e.target.value }))}
                placeholder="unique-content-id"
              />
            </div>
            <div>
              <Label>Content Title (for display)</Label>
              <Input
                value={formData.content_title}
                onChange={e => setFormData(p => ({ ...p, content_title: e.target.value }))}
                placeholder="Optional title"
              />
            </div>
            <div>
              <Label>Admin Notes (internal only)</Label>
              <Textarea
                value={formData.admin_notes}
                onChange={e => setFormData(p => ({ ...p, admin_notes: e.target.value }))}
                placeholder="Internal notes about this content..."
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_hidden}
                onCheckedChange={v => setFormData(p => ({ ...p, is_hidden: v }))}
              />
              <Label>Shadow Hide (not visible to users)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingId ? 'Update' : 'Flag'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Moderation Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the moderation record. The content will no longer be flagged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
