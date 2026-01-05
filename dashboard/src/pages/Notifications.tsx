import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Phone,
  Users,
  AlertTriangle,
  FileText,
  MessageSquare,
  Settings,
  Clock,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'call' | 'employee' | 'alert' | 'report' | 'message' | 'system';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'call',
      title: 'Call completed with John Smith',
      description: 'Interview lasted 15 minutes. Transcript available.',
      timestamp: '5 minutes ago',
      read: false
    },
    {
      id: '2',
      type: 'employee',
      title: 'New employee added',
      description: 'Sarah Johnson was added to the Engineering department.',
      timestamp: '1 hour ago',
      read: false
    },
    {
      id: '3',
      type: 'alert',
      title: 'Process bottleneck detected',
      description: 'Sales handoff to Finance showing 48hr average delay.',
      timestamp: '2 hours ago',
      read: false
    },
    {
      id: '4',
      type: 'report',
      title: 'Weekly report generated',
      description: 'Your process audit report for Week 1 is ready.',
      timestamp: '5 hours ago',
      read: true
    },
    {
      id: '5',
      type: 'message',
      title: 'SMS consent received',
      description: 'Mike Chen replied YES to opt-in request.',
      timestamp: '1 day ago',
      read: true
    },
    {
      id: '6',
      type: 'system',
      title: 'System maintenance scheduled',
      description: 'Planned maintenance on Jan 10, 2AM-4AM PST.',
      timestamp: '2 days ago',
      read: true
    },
    {
      id: '7',
      type: 'call',
      title: 'Scheduled call reminder',
      description: 'Call with Emily Davis in 30 minutes.',
      timestamp: '3 days ago',
      read: true
    },
    {
      id: '8',
      type: 'alert',
      title: 'Integration disconnected',
      description: 'Slack integration needs to be reconnected.',
      timestamp: '4 days ago',
      read: true
    }
  ]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'call': return Phone;
      case 'employee': return Users;
      case 'alert': return AlertTriangle;
      case 'report': return FileText;
      case 'message': return MessageSquare;
      case 'system': return Settings;
      default: return Bell;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'call': return 'text-success bg-success/10';
      case 'employee': return 'text-primary bg-primary/10';
      case 'alert': return 'text-destructive bg-destructive/10';
      case 'report': return 'text-accent bg-accent/10';
      case 'message': return 'text-warning bg-warning/10';
      case 'system': return 'text-muted-foreground bg-muted';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success('Notification deleted');
  };

  const clearAll = () => {
    setNotifications([]);
    toast.success('All notifications cleared');
  };

  const NotificationItem = ({ notification }: { notification: Notification }) => {
    const Icon = getIcon(notification.type);

    return (
      <div
        className={cn(
          "flex items-start gap-4 p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors",
          !notification.read && "bg-primary/5"
        )}
      >
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", getIconColor(notification.type))}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={cn("text-sm font-medium", !notification.read && "text-foreground")}>
                {notification.title}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">{notification.description}</p>
            </div>
            {!notification.read && (
              <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
            )}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {notification.timestamp}
            </span>
            <div className="flex items-center gap-1">
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => markAsRead(notification.id)}
                >
                  <Check className="w-3 h-3 mr-1" />
                  Mark read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                onClick={() => deleteNotification(notification.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAll}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear all
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="all" className="gap-2">
            All
            {notifications.length > 0 && (
              <Badge variant="secondary" className="ml-1">{notifications.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread" className="gap-2">
            Unread
            {unreadCount > 0 && (
              <Badge variant="default" className="ml-1">{unreadCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="calls">Calls</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <Card>
          <TabsContent value="all" className="m-0">
            <ScrollArea className="h-[600px]">
              {notifications.length > 0 ? (
                notifications.map(notification => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Bell className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">No notifications</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="unread" className="m-0">
            <ScrollArea className="h-[600px]">
              {notifications.filter(n => !n.read).length > 0 ? (
                notifications.filter(n => !n.read).map(notification => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <CheckCheck className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">All caught up!</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="calls" className="m-0">
            <ScrollArea className="h-[600px]">
              {notifications.filter(n => n.type === 'call').length > 0 ? (
                notifications.filter(n => n.type === 'call').map(notification => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Phone className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">No call notifications</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="alerts" className="m-0">
            <ScrollArea className="h-[600px]">
              {notifications.filter(n => n.type === 'alert').length > 0 ? (
                notifications.filter(n => n.type === 'alert').map(notification => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <AlertTriangle className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">No alerts</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="system" className="m-0">
            <ScrollArea className="h-[600px]">
              {notifications.filter(n => n.type === 'system').length > 0 ? (
                notifications.filter(n => n.type === 'system').map(notification => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Settings className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">No system notifications</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Card>
      </Tabs>
    </div>
  );
};

export default Notifications;
