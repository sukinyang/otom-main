import React, { useState, useEffect } from 'react';
import { Mic, MicOff, PhoneOff, Calendar, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface InterviewProps {
  onNavigate?: (view: string) => void;
}

const Interview = ({ onNavigate }: InterviewProps) => {
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Timer for interview duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isInterviewActive) {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isInterviewActive]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartInterview = () => {
    setIsInterviewActive(true);
    setDuration(0);
  };

  const handleEndInterview = () => {
    setIsInterviewActive(false);
    setDuration(0);
  };

  // Active interview view - full screen
  if (isInterviewActive) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEndInterview}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="text-center">
            <h1 className="text-xl font-display font-semibold text-foreground">
              Interview {formatDuration(duration)}
            </h1>
            <p className="text-sm text-muted-foreground">by otom</p>
          </div>

          <div className="w-10" /> {/* Spacer for alignment */}
        </header>

        {/* Main content - centered avatar */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative">
            {/* Pulsing rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-48 h-48 rounded-full bg-primary/10 animate-ping"
                style={{ animationDuration: '3s' }}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-40 h-40 rounded-full bg-primary/20 animate-ping"
                style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}
              />
            </div>

            {/* Main circle */}
            <div className="relative w-44 h-44 rounded-full bg-primary/40 flex items-center justify-center shadow-lg">
              <div className="w-36 h-36 rounded-full bg-primary/60 flex items-center justify-center">
                <Mic className={cn(
                  "w-12 h-12 transition-colors",
                  isMuted ? "text-muted-foreground" : "text-primary-foreground"
                )} />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom controls */}
        <div className="pb-12 flex justify-center">
          <div className="flex items-center gap-4 bg-muted/50 rounded-full px-6 py-3 border border-border">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => setIsMuted(!isMuted)}
              className={cn(
                "gap-2 rounded-full px-6",
                isMuted && "text-muted-foreground"
              )}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              {isMuted ? 'Unmute' : 'Mute'}
            </Button>

            <div className="w-px h-8 bg-border" />

            <Button
              variant="ghost"
              size="lg"
              onClick={handleEndInterview}
              className="gap-2 rounded-full px-6 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <PhoneOff className="w-5 h-5" />
              End call
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Start interview view
  return (
    <div className="space-y-6">
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-8 max-w-md text-center">
          {/* Animated circle indicator */}
          <div className="relative">
            <div className="w-40 h-40 rounded-full bg-primary/20 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-primary/40 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-primary/60 flex items-center justify-center">
                  <Mic className="w-10 h-10 text-primary-foreground" />
                </div>
              </div>
            </div>
            {/* Subtle pulse animation ring */}
            <div className="absolute inset-0 w-40 h-40 rounded-full border-2 border-primary/30 animate-ping" style={{ animationDuration: '2s' }} />
          </div>

          {/* Title and description */}
          <div className="space-y-3">
            <h1 className="text-3xl font-display font-bold text-foreground">
              Process Audit Interview
            </h1>
            <p className="text-muted-foreground text-lg">
              Start a voice interview to document your business processes and workflows.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleStartInterview}
              size="lg"
              className="px-8 py-6 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              <Mic className="w-5 h-5 mr-2" />
              Start Interview
            </Button>

            <Button
              onClick={() => setIsScheduleModalOpen(true)}
              variant="outline"
              size="lg"
              className="px-8 py-6 text-lg font-semibold rounded-full"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Schedule Interview
            </Button>
          </div>

          {/* Helper text */}
          <p className="text-sm text-muted-foreground">
            The interview typically takes 10-15 minutes
          </p>
        </div>
      </div>

      {/* Schedule Interview Modal */}
      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent className="max-w-3xl h-[80vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>Schedule Interview</DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-full pb-4 px-4">
            <iframe
              src="https://cal.com/sukin-yang-vw9ds8/meet-with-otom"
              className="w-full h-full rounded-lg border-0"
              style={{ minHeight: '500px' }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Interview;
