import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, PhoneOff, Calendar, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Vapi from '@vapi-ai/web';

interface InterviewProps {
  onNavigate?: (view: string) => void;
}

const Interview = ({ onNavigate }: InterviewProps) => {
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);

  const vapiRef = useRef<Vapi | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Vapi
  useEffect(() => {
    const vapiPublicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;

    if (vapiPublicKey) {
      vapiRef.current = new Vapi(vapiPublicKey);

      // Set up event listeners
      vapiRef.current.on('call-start', () => {
        console.log('Vapi call started');
        setIsConnecting(false);
        setIsInterviewActive(true);
        setDuration(0);
      });

      vapiRef.current.on('call-end', () => {
        console.log('Vapi call ended');
        setIsInterviewActive(false);
        setIsConnecting(false);
        setIsSpeaking(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      });

      vapiRef.current.on('speech-start', () => {
        setIsSpeaking(true);
      });

      vapiRef.current.on('speech-end', () => {
        setIsSpeaking(false);
      });

      vapiRef.current.on('volume-level', (level: number) => {
        setVolumeLevel(level);
      });

      vapiRef.current.on('error', (error: Error) => {
        console.error('Vapi error:', error);
        toast.error('Call error: ' + error.message);
        setIsInterviewActive(false);
        setIsConnecting(false);
      });
    }

    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Timer for interview duration
  useEffect(() => {
    if (isInterviewActive) {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isInterviewActive]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartInterview = async () => {
    const vapiPublicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;
    const vapiAssistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID;

    if (!vapiPublicKey) {
      toast.error('Vapi is not configured. Please set VITE_VAPI_PUBLIC_KEY.');
      return;
    }

    setIsConnecting(true);

    try {
      if (!vapiRef.current) {
        vapiRef.current = new Vapi(vapiPublicKey);
      }

      // Start the call with the assistant
      if (vapiAssistantId) {
        // Use pre-configured assistant
        await vapiRef.current.start(vapiAssistantId);
      } else {
        // Use inline assistant configuration
        await vapiRef.current.start({
          name: "Otom Process Auditor",
          firstMessage: "Hello! I'm Otom, your AI process auditor. I'm here to help document your business processes and workflows. Let's start with a simple question - what's your role in the organization, and which process would you like to discuss today?",
          model: {
            provider: "openai",
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are Otom, an AI business process auditor. Your goal is to conduct a structured interview to document business processes and workflows.

INTERVIEW STRUCTURE:
1. Introduction & Context (2-3 min)
   - Understand the interviewee's role
   - Identify which process they want to document

2. Process Discovery (5-7 min)
   - Ask about the trigger/start of the process
   - Walk through each step chronologically
   - Identify inputs, outputs, and handoffs
   - Note any systems or tools used

3. Pain Points & Improvements (3-5 min)
   - Ask about bottlenecks or delays
   - Identify manual or repetitive tasks
   - Note any workarounds they use

4. Wrap-up (1-2 min)
   - Summarize what you learned
   - Ask if anything was missed
   - Thank them for their time

CONVERSATION GUIDELINES:
- Keep responses concise (2-3 sentences max) - this is a voice conversation
- Ask one question at a time
- Use verbal confirmations like "I see", "Got it", "That makes sense"
- If something is unclear, ask for clarification
- Be friendly and professional

NEVER use markdown, bullet points, or formatting - this is spoken conversation.`
              }
            ],
            temperature: 0.7,
            maxTokens: 150
          },
          voice: {
            provider: "11labs",
            voiceId: "21m00Tcm4TlvDq8ikWAM"
          },
          silenceTimeoutSeconds: 30,
          maxDurationSeconds: 1200
        });
      }

      toast.success('Interview started');
    } catch (error) {
      console.error('Failed to start interview:', error);
      toast.error('Failed to start interview. Please try again.');
      setIsConnecting(false);
    }
  };

  const handleEndInterview = () => {
    if (vapiRef.current) {
      vapiRef.current.stop();
    }
    setIsInterviewActive(false);
    setIsConnecting(false);
    setDuration(0);
    toast.success('Interview ended');
  };

  const handleToggleMute = () => {
    if (vapiRef.current) {
      const newMutedState = !isMuted;
      vapiRef.current.setMuted(newMutedState);
      setIsMuted(newMutedState);
    }
  };

  // Active interview view - full screen
  if (isInterviewActive || isConnecting) {
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
              {isConnecting ? 'Connecting...' : `Interview ${formatDuration(duration)}`}
            </h1>
            <p className="text-sm text-muted-foreground">by otom</p>
          </div>

          <div className="w-10" /> {/* Spacer for alignment */}
        </header>

        {/* Main content - centered avatar */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative">
            {/* Pulsing rings - animate based on speaking/volume */}
            {(isSpeaking || volumeLevel > 0.1) && (
              <>
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
              </>
            )}

            {/* Main circle */}
            <div className={cn(
              "relative w-44 h-44 rounded-full flex items-center justify-center shadow-lg transition-all",
              isConnecting ? "bg-muted" : "bg-primary/40"
            )}>
              <div className={cn(
                "w-36 h-36 rounded-full flex items-center justify-center transition-all",
                isConnecting ? "bg-muted" : "bg-primary/60"
              )}>
                {isConnecting ? (
                  <Loader2 className="w-12 h-12 text-muted-foreground animate-spin" />
                ) : (
                  <Mic className={cn(
                    "w-12 h-12 transition-colors",
                    isMuted ? "text-muted-foreground" : "text-primary-foreground"
                  )} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status indicator */}
        {isInterviewActive && (
          <div className="text-center pb-4">
            <p className="text-sm text-muted-foreground">
              {isSpeaking ? "Otom is speaking..." : "Listening..."}
            </p>
          </div>
        )}

        {/* Bottom controls */}
        <div className="pb-12 flex justify-center">
          <div className="flex items-center gap-4 bg-muted/50 rounded-full px-6 py-3 border border-border">
            <Button
              variant="ghost"
              size="lg"
              onClick={handleToggleMute}
              disabled={isConnecting}
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
