import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layers, Plus, Trash2, Edit, Pin, TrendingUp, TrendingDown, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getFeedCuration, createFeedCuration, updateFeedCuration, deleteFeedCuration, FeedCuration } from '@/services/adminService';
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

export const FeedCurationPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<FeedCuration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    article_id: '',
    article_title: '',
    article_url: '',
    curation_type: 'pinned' as 'pinned' | 'promoted' | 'demoted' | 'hidden',
    priority: 10,
    is_active: true,
  });

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await getFeedCuration();
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
      article_id: '',
      article_title: '',
      article_url: '',
      curation_type: 'pinned',
      priority: 10,
      is_active: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (item: FeedCuration) => {
    setFormData({
      article_id: item.article_id,
      article_title: item.article_title,
      article_url: item.article_url || '',
      curation_type: item.curation_type,
      priority: item.priority,
      is_active: item.is_active,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!user || !formData.article_id || !formData.article_title) {
      toast({ title: 'Error', description: 'Article ID and title are required', variant: 'destructive' });
      return;
    }

    try {
      const payload = {
        ...formData,
        article_url: formData.article_url || null,
        curated_by: user.id,
        starts_at: new Date().toISOString(),
        ends_at: null,
      };

      if (editingId) {
        await updateFeedCuration(editingId, payload, user.id);
        toast({ title: 'Updated', description: 'Feed curation updated' });
      } else {
        await createFeedCuration(payload, user.id);
        toast({ title: 'Created', description: 'Feed curation added' });
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
      await deleteFeedCuration(deleteId, user.id);
      toast({ title: 'Deleted', description: 'Feed curation removed' });
      setDeleteId(null);
      fetchItems();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const getCurationIcon = (type: string) => {
    switch (type) {
      case 'pinned': return <Pin className="w-4 h-4" />;
      case 'promoted': return <TrendingUp className="w-4 h-4" />;
      case 'demoted': return <TrendingDown className="w-4 h-4" />;
      case 'hidden': return <EyeOff className="w-4 h-4" />;
      default: return null;
    }
  };

  const getCurationBadge = (type: string) => {
    const styles: Record<string, string> = {
      pinned: 'bg-amber-500/20 text-amber-400',
      promoted: 'bg-green-500/20 text-green-400',
      demoted: 'bg-orange-500/20 text-orange-400',
      hidden: 'bg-gray-500/20 text-gray-400',
    };
    return (
      <Badge className={styles[type] || ''}>
        {getCurationIcon(type)}
        <span className="ml-1">{type}</span>
      </Badge>
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Feed Curation</CardTitle>
            </div>
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
          <CardDescription>
            Pin, promote, demote, or hide specific articles in the global feed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No feed curation rules yet</div>
          ) : (
            items.map(item => (
              <div
                key={item.id}
                className={`p-3 rounded-lg border ${item.is_active ? 'bg-card' : 'bg-muted/50 opacity-60'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{item.article_title}</span>
                      {getCurationBadge(item.curation_type)}
                      <Badge variant="outline" className="text-xs">Priority: {item.priority}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">ID: {item.article_id}</p>
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
            <DialogTitle>{editingId ? 'Edit' : 'Add'} Feed Curation</DialogTitle>
            <DialogDescription>
              Control how this article appears in the feed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Article ID</Label>
              <Input
                value={formData.article_id}
                onChange={e => setFormData(p => ({ ...p, article_id: e.target.value }))}
                placeholder="unique-article-id"
              />
            </div>
            <div>
              <Label>Article Title</Label>
              <Input
                value={formData.article_title}
                onChange={e => setFormData(p => ({ ...p, article_title: e.target.value }))}
                placeholder="Article title for display"
              />
            </div>
            <div>
              <Label>Article URL (optional)</Label>
              <Input
                value={formData.article_url}
                onChange={e => setFormData(p => ({ ...p, article_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Curation Type</Label>
                <Select
                  value={formData.curation_type}
                  onValueChange={v => setFormData(p => ({ ...p, curation_type: v as any }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pinned">📌 Pinned (top)</SelectItem>
                    <SelectItem value="promoted">📈 Promoted</SelectItem>
                    <SelectItem value="demoted">📉 Demoted</SelectItem>
                    <SelectItem value="hidden">👁‍🗨 Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority (higher = more visible)</Label>
                <Input
                  type="number"
                  value={formData.priority}
                  onChange={e => setFormData(p => ({ ...p, priority: parseInt(e.target.value) || 0 }))}
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
            <Button onClick={handleSubmit}>{editingId ? 'Update' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Feed Curation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the curation rule. The article will return to normal ranking.
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
