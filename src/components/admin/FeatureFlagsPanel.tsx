import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Power, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getFeatureFlags, updateFeatureFlag, FeatureFlag, clearFeatureFlagsCache } from '@/services/adminService';
import { useAuth } from '@/contexts/AuthContext';
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

export const FeatureFlagsPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ flag: FeatureFlag; newValue: boolean } | null>(null);

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const data = await getFeatureFlags();
      setFlags(data);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const handleToggle = (flag: FeatureFlag) => {
    setConfirmDialog({ flag, newValue: !flag.is_enabled });
  };

  const confirmToggle = async () => {
    if (!confirmDialog || !user) return;

    const { flag, newValue } = confirmDialog;
    setConfirmDialog(null);
    setUpdating(flag.id);

    try {
      await updateFeatureFlag(flag.id, newValue, user.id);
      clearFeatureFlagsCache();
      setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, is_enabled: newValue } : f));
      toast({
        title: newValue ? 'Feature Enabled' : 'Feature Disabled',
        description: `${flag.flag_name} has been ${newValue ? 'enabled' : 'disabled'}.`,
      });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setUpdating(null);
    }
  };

  const disabledCount = flags.filter(f => !f.is_enabled).length;

  return (
    <>
      <Card className="border-destructive/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Power className="w-5 h-5 text-destructive" />
              <CardTitle className="text-lg">Emergency Kill Switch</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchFlags} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <CardDescription>
            Instantly enable or disable app features. Changes apply immediately for all users.
          </CardDescription>
          {disabledCount > 0 && (
            <Badge variant="destructive" className="w-fit mt-2">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {disabledCount} feature{disabledCount !== 1 ? 's' : ''} disabled
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading feature flags...</div>
          ) : (
            flags.map(flag => (
              <div
                key={flag.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  flag.is_enabled 
                    ? 'bg-card border-border' 
                    : 'bg-destructive/5 border-destructive/30'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{flag.flag_name}</span>
                    {!flag.is_enabled && (
                      <Badge variant="outline" className="text-destructive border-destructive/50 text-xs">
                        DISABLED
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{flag.description}</p>
                </div>
                <Switch
                  checked={flag.is_enabled}
                  onCheckedChange={() => handleToggle(flag)}
                  disabled={updating === flag.id}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.newValue ? 'Enable' : 'Disable'} {confirmDialog?.flag.flag_name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.newValue 
                ? 'This will enable this feature for all users immediately.'
                : 'This will disable this feature for all users immediately. Users may experience degraded functionality.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmToggle}
              className={confirmDialog?.newValue ? '' : 'bg-destructive hover:bg-destructive/90'}
            >
              {confirmDialog?.newValue ? 'Enable' : 'Disable'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
