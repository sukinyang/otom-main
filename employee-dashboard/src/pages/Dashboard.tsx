import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, Calendar, Clock, CheckCircle2 } from 'lucide-react';

interface DashboardProps {
  onNavigate?: (view: string) => void;
}

const Dashboard = ({ onNavigate }: DashboardProps) => {
  const { user } = useAuth0();

  const recentInterviews = [
    { id: 1, date: '2024-01-05', duration: '12:34', status: 'completed' },
    { id: 2, date: '2024-01-03', duration: '15:21', status: 'completed' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-display font-semibold text-foreground">
          Welcome back, {user?.given_name || user?.name?.split(' ')[0] || 'there'}!
        </h1>
        <p className="text-muted-foreground">
          Document your business processes through voice interviews
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-primary" />
              Start Interview
            </CardTitle>
            <CardDescription>
              Begin a voice interview to document a business process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => onNavigate?.('interview')}
              className="w-full"
              size="lg"
            >
              <Mic className="w-4 h-4 mr-2" />
              Start Now
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              Schedule Interview
            </CardTitle>
            <CardDescription>
              Book a time slot for your next process audit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => onNavigate?.('interview')}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Schedule
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Interviews */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Interviews</CardTitle>
          <CardDescription>Your past process audit interviews</CardDescription>
        </CardHeader>
        <CardContent>
          {recentInterviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mic className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No interviews yet</p>
              <p className="text-sm">Start your first interview to document a process</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentInterviews.map((interview) => (
                <div
                  key={interview.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Process Interview</p>
                      <p className="text-sm text-muted-foreground">{interview.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {interview.duration}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Interview Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Find a quiet space with minimal background noise
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Have any relevant documents or systems open for reference
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Think about the process you want to document beforehand
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Interviews typically take 10-15 minutes
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
