import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  onNavigate?: (view: string) => void;
}

const Header = ({ onNavigate }: HeaderProps) => {
  const { user, logout } = useAuth0();

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  return (
    <header className="bg-card border-b border-border px-6 py-3 fixed top-0 left-0 right-0 z-30">
      <div className="flex items-center justify-between">
        {/* Spacer for sidebar */}
        <div className="ml-64" />

        <div className="flex items-center gap-3 ml-auto">
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 px-3 hover:bg-muted">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-foreground">{user?.name || 'Employee'}</p>
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
