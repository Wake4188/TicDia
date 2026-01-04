import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { FeatureFlagsPanel } from '@/components/admin/FeatureFlagsPanel';
import { AnnouncementsPanel } from '@/components/admin/AnnouncementsPanel';
import { FeedCurationPanel } from '@/components/admin/FeedCurationPanel';
import { ContentModerationPanel } from '@/components/admin/ContentModerationPanel';
import { ContentRulesPanel } from '@/components/admin/ContentRulesPanel';
import { MetricsDashboard } from '@/components/admin/MetricsDashboard';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Power, Megaphone, Layers, Shield, Ban, BarChart3 } from 'lucide-react';

const AdminPanel = () => {
  const { isAdmin, loading, user } = useAdminCheck();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
    if (!loading && user && !isAdmin) {
      navigate('/profile');
    }
  }, [isAdmin, loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Checking permissions...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'killswitch', label: 'Kill Switch', icon: Power },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'curation', label: 'Feed Curation', icon: Layers },
    { id: 'moderation', label: 'Moderation', icon: Shield },
    { id: 'rules', label: 'Content Rules', icon: Ban },
  ];

  return (
    <AdminLayout title="Admin Panel" description="Manage app settings, content, and users">
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 h-auto flex flex-wrap gap-1">
          {tabs.map(tab => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex items-center gap-2 px-3 py-2 data-[state=active]:bg-background"
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <MetricsDashboard />
        </TabsContent>

        <TabsContent value="killswitch" className="space-y-6">
          <FeatureFlagsPanel />
        </TabsContent>

        <TabsContent value="announcements" className="space-y-6">
          <AnnouncementsPanel />
        </TabsContent>

        <TabsContent value="curation" className="space-y-6">
          <FeedCurationPanel />
        </TabsContent>

        <TabsContent value="moderation" className="space-y-6">
          <ContentModerationPanel />
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <ContentRulesPanel />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminPanel;
