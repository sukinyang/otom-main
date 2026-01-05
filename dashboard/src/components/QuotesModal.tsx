import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Quote, ExternalLink } from 'lucide-react';

export interface QuoteItem {
  employeeId?: string;
  employeeName: string;
  role?: string;
  department?: string;
  quote: string;
  sentiment?: 'positive' | 'negative' | 'neutral' | 'frustrated';
  interviewDate?: string;
  depth?: 'deep-dive' | 'detailed' | 'brief' | 'passing' | 'dismissive' | 'mention';
  topic?: string;
}

interface QuotesModalProps {
  quotes: QuoteItem[];
  title?: string;
  triggerLabel?: string;
}

const getDepthLabel = (depth?: string) => {
  switch (depth) {
    case 'deep-dive': return 'Deep Dive';
    case 'detailed': return 'Detailed';
    case 'brief': return 'Brief';
    case 'passing': return 'Passing';
    case 'mention': return 'Mention';
    case 'dismissive': return 'Dismissive';
    default: return depth || 'Interview';
  }
};

const getDepthColor = (depth?: string) => {
  switch (depth) {
    case 'deep-dive': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    case 'detailed': return 'bg-primary/10 text-primary border-primary/20';
    case 'brief': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    case 'passing': return 'bg-muted text-muted-foreground border-muted-foreground/20';
    case 'mention': return 'bg-muted text-muted-foreground border-muted-foreground/20';
    case 'dismissive': return 'bg-destructive/10 text-destructive border-destructive/20';
    default: return 'bg-muted text-muted-foreground border-muted-foreground/20';
  }
};

const getSentimentColor = (sentiment?: string) => {
  switch (sentiment) {
    case 'positive': return 'border-l-success';
    case 'negative': return 'border-l-destructive';
    case 'frustrated': return 'border-l-warning';
    default: return 'border-l-primary';
  }
};

const QuotesModal = ({ quotes, title = 'Supporting Quotes', triggerLabel }: QuotesModalProps) => {
  const navigate = useNavigate();

  if (quotes.length === 0) return null;

  const label = triggerLabel || `${quotes.length} quote${quotes.length > 1 ? 's' : ''}`;

  const handleQuoteClick = (quote: QuoteItem) => {
    if (quote.employeeId) {
      // Navigate to employee profile with interview tab selected
      navigate(`/employee/${quote.employeeId}`, { 
        state: { 
          activeTab: 'history',
          interviewDate: quote.interviewDate 
        } 
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-md transition-colors cursor-pointer">
          <Quote className="w-3 h-3" />
          {label}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Quote className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground -mt-2 mb-2">
          Click on a quote to view the employee's interview session
        </p>
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {quotes.map((quote, idx) => (
            <DialogClose asChild key={idx}>
              <div 
                onClick={() => handleQuoteClick(quote)}
                className={`p-4 rounded-lg bg-muted/30 border-l-4 ${getSentimentColor(quote.sentiment)} ${
                  quote.employeeId 
                    ? 'cursor-pointer hover:bg-muted/50 transition-colors group' 
                    : ''
                }`}
              >
                <p className="text-sm italic text-foreground leading-relaxed">
                  "{quote.quote}"
                </p>
                <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={`font-medium ${quote.employeeId ? 'text-primary group-hover:underline' : 'text-foreground'}`}>
                      {quote.employeeName}
                    </span>
                    {quote.role && (
                      <>
                        <span>•</span>
                        <span>{quote.role}</span>
                      </>
                    )}
                    {quote.department && (
                      <>
                        <span>•</span>
                        <span>{quote.department}</span>
                      </>
                    )}
                    {quote.employeeId && (
                      <ExternalLink className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {quote.interviewDate && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(quote.interviewDate).toLocaleDateString()}
                      </span>
                    )}
                    {quote.depth && (
                      <Badge variant="outline" className={`text-[10px] ${getDepthColor(quote.depth)}`}>
                        {getDepthLabel(quote.depth)}
                      </Badge>
                    )}
                  </div>
                </div>
                {quote.topic && (
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {quote.topic}
                    </Badge>
                  </div>
                )}
              </div>
            </DialogClose>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuotesModal;
