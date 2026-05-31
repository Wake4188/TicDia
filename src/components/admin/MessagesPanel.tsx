import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Mail, MailOpen, RefreshCw, Inbox } from 'lucide-react';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  user_id: string | null;
  created_at: string;
  is_read: boolean;
}

export const MessagesPanel = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) {
      toast({ title: 'Failed to load messages', description: error.message, variant: 'destructive' });
    } else {
      setMessages((data || []) as ContactMessage[]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleRead = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('contact_messages')
      .update({ is_read: !current })
      .eq('id', id);
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
      return;
    }
    setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: !current } : m));
  };

  const visible = filter === 'unread' ? messages.filter(m => !m.is_read) : messages;
  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <Inbox className="w-5 h-5" />
            User Messages
            {unreadCount > 0 && <Badge variant="destructive">{unreadCount} unread</Badge>}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant={filter === 'unread' ? 'default' : 'outline'} onClick={() => setFilter('unread')}>Unread</Button>
            <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>All</Button>
            <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && <p className="text-muted-foreground text-sm">Loading…</p>}
        {!loading && visible.length === 0 && (
          <p className="text-muted-foreground text-sm">No messages.</p>
        )}
        {visible.map((m) => (
          <div
            key={m.id}
            className={`border rounded-lg p-4 ${m.is_read ? 'bg-muted/30' : 'bg-background border-primary/40'}`}
          >
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold truncate">{m.subject || '(no subject)'}</h4>
                  {!m.is_read && <Badge variant="default">New</Badge>}
                  {!m.user_id && <Badge variant="outline">Anonymous</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  From <span className="font-medium text-foreground">{m.name || 'Unknown'}</span>
                  {' · '}
                  <a href={`mailto:${m.email}`} className="underline hover:text-primary">{m.email}</a>
                  {' · '}
                  {new Date(m.created_at).toLocaleString()}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => toggleRead(m.id, m.is_read)}>
                {m.is_read ? <Mail className="w-4 h-4 mr-1" /> : <MailOpen className="w-4 h-4 mr-1" />}
                {m.is_read ? 'Mark unread' : 'Mark read'}
              </Button>
            </div>
            <pre className="mt-3 whitespace-pre-wrap text-sm font-sans text-foreground/90 bg-muted/40 rounded p-3 max-h-64 overflow-auto">
{m.message}
            </pre>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default MessagesPanel;
