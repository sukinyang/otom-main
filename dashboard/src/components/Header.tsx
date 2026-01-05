import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { User, Bell, Settings, Search, LogOut, Phone, Users, AlertTriangle, FileText, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface HeaderProps {
  onNavigate?: (view: string) => void;
}

interface Notification {
  id: string;
  type: 'call' | 'employee' | 'alert' | 'report';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}

const Header = ({ onNavigate }: HeaderProps) => {
  const { user, logout } = useAuth0();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'call',
      title: 'Call completed',
      description: 'Interview with John Smith finished',
      timestamp: '5 min ago',
      read: false
    },
    {
      id: '2',
      type: 'employee',
      title: 'New employee added',
      description: 'Sarah Johnson joined Engineering',
      timestamp: '1 hour ago',
      read: false
    },
    {
      id: '3',
      type: 'alert',
      title: 'Process bottleneck',
      description: 'Sales handoff showing 48hr delay',
      timestamp: '2 hours ago',
      read: false
    },
    {
      id: '4',
      type: 'report',
      title: 'Weekly report ready',
      description: 'Process audit for Week 1',
      timestamp: '5 hours ago',
      read: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="w-4 h-4 text-green-500" />;
      case 'employee': return <Users className="w-4 h-4 text-blue-500" />;
      case 'alert': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'report': return <FileText className="w-4 h-4 text-purple-500" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  return (
    <header className="bg-card border-b border-border px-6 py-3 fixed top-0 left-0 right-0 z-30">
      <div className="flex items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md ml-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search sessions, reports..."
            className="pl-10 bg-background border-border h-10 w-full"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-muted-foreground hover:text-foreground"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h4 className="font-semibold text-sm">Notifications</h4>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" className="h-auto py-1 px-2 text-xs" onClick={markAllAsRead}>
                    <Check className="w-3 h-3 mr-1" />
                    Mark all read
                  </Button>
                )}
              </div>
              <ScrollArea className="h-[300px]">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Bell className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`flex gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors ${!notification.read ? 'bg-primary/5' : ''}`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {notification.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <div className="border-t px-4 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => onNavigate?.('notifications')}
                >
                  View all notifications
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 px-3 hover:bg-muted">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-foreground">{user?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
                </div>
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name || 'User'}
                    className="w-9 h-9 rounded-full"
                  />
                ) : (
                  <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => onNavigate?.('profile')}>
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigate?.('settings')}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
