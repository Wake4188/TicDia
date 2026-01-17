import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Ban, Check, Plus, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getContentRules, createContentRule, updateContentRule, deleteContentRule, ContentRule } from '@/services/adminService';
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

export const ContentRulesPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rules, setRules] = useState<ContentRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    rule_type: 'blacklist' as 'blacklist' | 'whitelist',
    target_type: 'keyword' as 'topic' | 'category' | 'keyword' | 'source',
    target_value: '',
    reason: '',
    is_active: true,
  });

  const fetchRules = async () => {
    try {
      setLoading(true);
      const data = await getContentRules();
      setRules(data);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const resetForm = () => {
    setFormData({
      rule_type: 'blacklist',
      target_type: 'keyword',
      target_value: '',
      reason: '',
      is_active: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (rule: ContentRule) => {
    setFormData({
      rule_type: rule.rule_type,
      target_type: rule.target_type,
      target_value: rule.target_value,
      reason: rule.reason || '',
      is_active: rule.is_active,
    });
    setEditingId(rule.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!user || !formData.target_value) {
      toast({ title: 'Error', description: 'Target value is required', variant: 'destructive' });
      return;
    }

    try {
      const payload = {
        ...formData,
        reason: formData.reason || null,
        created_by: user.id,
      };

      if (editingId) {
        await updateContentRule(editingId, payload, user.id);
        toast({ title: 'Updated', description: 'Content rule updated' });
      } else {
        await createContentRule(payload, user.id);
        toast({ title: 'Created', description: 'Content rule added' });
      }
      resetForm();
      fetchRules();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !user) return;
    try {
      await deleteContentRule(deleteId, user.id);
      toast({ title: 'Deleted', description: 'Content rule removed' });
      setDeleteId(null);
      fetchRules();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const blacklistRules = rules.filter(r => r.rule_type === 'blacklist');
  const whitelistRules = rules.filter(r => r.rule_type === 'whitelist');

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Blacklist / Whitelist</CardTitle>
            </div>
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add Rule
            </Button>
          </div>
          <CardDescription>
            Control content inclusion by topic, category, keyword, or source. Admin rules override algorithm.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No content rules defined</div>
          ) : (
            <>
              {/* Blacklist Section */}
              {blacklistRules.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Ban className="w-4 h-4 text-destructive" />
                    <span className="text-sm font-medium text-destructive">Blacklist</span>
                  </div>
                  <div className="space-y-2">
                    {blacklistRules.map(rule => (
                      <RuleItem key={rule.id} rule={rule} onEdit={handleEdit} onDelete={setDeleteId} />
                    ))}
                  </div>
                </div>
              )}

              {/* Whitelist Section */}
              {whitelistRules.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">Whitelist</span>
                  </div>
                  <div className="space-y-2">
                    {whitelistRules.map(rule => (
                      <RuleItem key={rule.id} rule={rule} onEdit={handleEdit} onDelete={setDeleteId} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit' : 'Add'} Content Rule</DialogTitle>
            <DialogDescription>
              Define rules to control what content appears in feeds.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Rule Type</Label>
                <Select
                  value={formData.rule_type}
                  onValueChange={v => setFormData(p => ({ ...p, rule_type: v as any }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blacklist">🚫 Blacklist (block)</SelectItem>
                    <SelectItem value="whitelist">✅ Whitelist (allow)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Target Type</Label>
                <Select
                  value={formData.target_type}
                  onValueChange={v => setFormData(p => ({ ...p, target_type: v as any }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keyword">Keyword</SelectItem>
                    <SelectItem value="topic">Topic</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="source">Source</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Value</Label>
              <Input
                value={formData.target_value}
                onChange={e => setFormData(p => ({ ...p, target_value: e.target.value }))}
                placeholder="e.g., politics, violence, wikipedia.org"
              />
            </div>
            <div>
              <Label>Reason (optional)</Label>
              <Input
                value={formData.reason}
                onChange={e => setFormData(p => ({ ...p, reason: e.target.value }))}
                placeholder="Why this rule exists..."
              />
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
            <AlertDialogTitle>Delete Content Rule?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the rule. Content matching this rule will no longer be filtered.
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

const RuleItem = ({ 
  rule, 
  onEdit, 
  onDelete 
}: { 
  rule: ContentRule; 
  onEdit: (rule: ContentRule) => void; 
  onDelete: (id: string) => void;
}) => (
  <div className={`p-2 rounded-lg border flex items-center justify-between ${rule.is_active ? 'bg-card' : 'bg-muted/50 opacity-60'}`}>
    <div className="flex items-center gap-2 flex-wrap">
      <Badge variant="outline" className="text-xs">{rule.target_type}</Badge>
      <span className="font-medium text-sm">{rule.target_value}</span>
      {rule.reason && (
        <span className="text-xs text-muted-foreground">— {rule.reason}</span>
      )}
    </div>
    <div className="flex gap-1">
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(rule)}>
        <Edit className="w-3 h-3" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(rule.id)}>
        <Trash2 className="w-3 h-3 text-destructive" />
      </Button>
    </div>
  </div>
);
