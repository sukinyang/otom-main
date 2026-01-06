import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Loader2 } from 'lucide-react';

const Login = () => {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4">
            <span className="text-primary-foreground font-display font-bold text-2xl">O</span>
          </div>
          <CardTitle className="text-2xl font-display">Otom Employee Portal</CardTitle>
          <CardDescription>
            Sign in to access your process audit interviews
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => loginWithRedirect()}
            className="w-full"
            size="lg"
          >
            Sign In
          </Button>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Document your business processes through voice interviews
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-4 text-muted-foreground">
            <Mic className="w-4 h-4" />
            <span className="text-sm">Powered by Otom AI</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
