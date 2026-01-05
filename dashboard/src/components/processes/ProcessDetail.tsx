import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ArrowLeft, 
  Clock, 
  Tag, 
  Users, 
  Building2, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronDown,
  ChevronRight,
  List,
  MessageSquare,
  Lightbulb,
  Brain,
  FileText,
  AlertTriangle,
  Wrench,
  Package,
  HelpCircle,
  GitBranch,
  Shield
} from 'lucide-react';
import { Process, ProcessStep, InterviewQuote, ConfidenceLevel } from '@/data/processData';
import QuotesModal from '@/components/QuotesModal';

interface ProcessDetailProps {
  process: Process;
  onBack: () => void;
}

// Employee Tag Component - clickable and consistent
interface EmployeeTagProps {
  employeeId: string;
  employeeName: string;
  role?: string;
}

const EmployeeTag = ({ employeeId, employeeName, role }: EmployeeTagProps) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/employees/${employeeId}`);
  };
  
  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted hover:bg-accent transition-colors cursor-pointer"
    >
      <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-medium text-primary">
        {employeeName.charAt(0)}
      </div>
      <span className="text-sm text-foreground">{employeeName}</span>
      {role && (
        <span className="text-xs text-muted-foreground">({role})</span>
      )}
    </button>
  );
};

// Collapsible Section Component
interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string | number;
}

const CollapsibleSection = ({ title, icon, defaultOpen = false, children, badge }: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left hover:bg-muted/50 p-2 -ml-2 rounded group">
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        )}
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-xl font-bold text-foreground">{title}</span>
        {badge !== undefined && (
          <Badge variant="secondary" className="ml-2">{badge}</Badge>
        )}
      </CollapsibleTrigger>
      
      <CollapsibleContent className="pl-8 mt-3 space-y-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

// Get unique employees from quotes across the process
const getUniqueEmployees = (process: Process) => {
  const unique = new Map<string, { id: string; name: string; role?: string }>();
  
  // Collect from all quotes
  const allQuotes = [
    ...process.steps.flatMap(s => s.supportingQuotes.map(q => ({ ...q, role: s.owner }))),
    ...process.painPoints.flatMap(p => p.supportingQuotes),
    ...process.improvementSuggestions.flatMap(s => s.supportingQuotes),
    ...process.workarounds.flatMap(w => w.supportingQuotes),
    ...process.shadowTools.flatMap(t => t.quotes),
    ...process.contradictions.flatMap(c => c.conflictingViews.map(v => v.quote)),
  ];
  
  allQuotes.forEach(q => {
    if (q && !unique.has(q.employeeId)) {
      unique.set(q.employeeId, { id: q.employeeId, name: q.employeeName, role: (q as any).role });
    }
  });
  
  return Array.from(unique.values());
};

// Helper to convert InterviewQuote to QuotesModal format
const convertToQuoteItem = (quote: InterviewQuote) => ({
  employeeId: quote.employeeId,
  employeeName: quote.employeeName,
  quote: quote.quote,
  sentiment: quote.sentiment,
  interviewDate: quote.interviewDate,
  depth: quote.depth,
  topic: quote.topic
});

const ProcessDetail = ({ process, onBack }: ProcessDetailProps) => {
  const [openSteps, setOpenSteps] = useState<Record<number, boolean>>({ 1: true });
  const [openPainPoints, setOpenPainPoints] = useState<Record<string, boolean>>({});
  
  const toggleStep = (stepNumber: number) => {
    setOpenSteps(prev => ({ ...prev, [stepNumber]: !prev[stepNumber] }));
  };
  
  const togglePainPoint = (id: string) => {
    setOpenPainPoints(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const { interviewCoverage } = process;
  const employees = getUniqueEmployees(process);
  
  // Format dates
  const createdDate = new Date(process.lastUpdated);
  const formattedCreated = createdDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  // Depth distribution for interview coverage
  const depthData = [
    { label: 'Deep Dive', employees: [] as string[], count: interviewCoverage.depthBreakdown.deepDive },
    { label: 'Detailed', employees: [] as string[], count: interviewCoverage.depthBreakdown.detailed },
    { label: 'Brief', employees: [] as string[], count: interviewCoverage.depthBreakdown.brief },
    { label: 'Dismissive', employees: [] as string[], count: interviewCoverage.depthBreakdown.dismissive },
  ].filter(d => d.count > 0);

  // Get confidence label
  const getConfidenceLabel = (level: ConfidenceLevel) => {
    switch (level) {
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return level;
    }
  };

  return (
    <TooltipProvider>
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button variant="ghost" onClick={onBack} className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Processes
        </Button>

        {/* Process Name */}
        <h1 className="text-4xl font-bold text-foreground mb-6">{process.name}</h1>

        {/* Properties Section */}
        <div className="space-y-3 mb-8">
          {/* Created */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-muted-foreground w-44">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Created</span>
            </div>
            <span className="text-sm text-foreground">{formattedCreated}</span>
          </div>

          {/* Last edited time */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-muted-foreground w-44">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Last edited time</span>
            </div>
            <span className="text-sm text-foreground">{formattedCreated}</span>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-muted-foreground w-44">
              <List className="w-4 h-4" />
              <span className="text-sm">Tags</span>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 hover:bg-rose-100">
                {process.department}
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100">
                {process.owner.split(' ')[0]}
              </Badge>
            </div>
          </div>

          {/* Employees Involved */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-muted-foreground w-44">
              <Users className="w-4 h-4" />
              <span className="text-sm truncate">Employees involved</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {employees.slice(0, 5).map((emp) => (
                <EmployeeTag 
                  key={emp.id} 
                  employeeId={emp.id} 
                  employeeName={emp.name}
                  role={emp.role}
                />
              ))}
              {employees.length > 5 && (
                <span className="text-sm text-muted-foreground">+{employees.length - 5} more</span>
              )}
            </div>
          </div>

          {/* Department */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-muted-foreground w-44">
              <Building2 className="w-4 h-4" />
              <span className="text-sm">Department</span>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100">
                {process.department}
              </Badge>
            </div>
          </div>

          {/* Upstream Dependencies */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-muted-foreground w-44">
              <ArrowUpRight className="w-4 h-4" />
              <span className="text-sm truncate">Upstream Depen...</span>
            </div>
            <div className="flex gap-2">
              {process.upstreamInputs.map((input, idx) => (
                <Badge key={idx} variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100">
                  {input}
                </Badge>
              ))}
            </div>
          </div>

          {/* Downstream Dependencies */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-muted-foreground w-44">
              <ArrowDownRight className="w-4 h-4" />
              <span className="text-sm truncate">Downstream Dep...</span>
            </div>
            <div className="flex gap-2">
              {process.downstreamOutputs.map((output, idx) => (
                <Badge key={idx} variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100">
                  {output}
                </Badge>
              ))}
            </div>
          </div>

          {/* Add a property button */}
          <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mt-2">
            <span className="text-lg leading-none">+</span>
            <span>Add a property</span>
          </button>
        </div>

        {/* Comments Section */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-foreground mb-3">Comments</h3>
          <div className="flex items-start gap-3 mb-3">
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
              {process.owner.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{process.owner}</span>
                <span className="text-xs text-muted-foreground">58m</span>
              </div>
              <p className="text-sm text-foreground">Process documentation created from interview synthesis.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
              ?
            </div>
            <span className="text-sm">Add a comment...</span>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Main Content - All Collapsible Sections */}
        <div className="space-y-6">
          {/* Process Title in Content */}
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Process: {process.name}
          </h2>

          {/* Key Insights */}
          {process.painPoints.length > 0 && (
            <CollapsibleSection 
              title="Key Insights" 
              icon={<Lightbulb className="w-5 h-5" />}
              badge={`${process.painPoints.length} pain point${process.painPoints.length > 1 ? 's' : ''}`}
              defaultOpen={true}
            >
              <ul className="space-y-2 list-disc list-inside">
                {process.painPoints.map((painPoint, index) => (
                  <li key={painPoint.id} className="text-foreground">
                    <span className="font-medium">{index + 1}.</span> {painPoint.summary}
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {/* Process Understanding (AI-Synthesized) */}
          {process.synthesizedDescription && (
            <CollapsibleSection 
              title="Process Understanding (AI-Synthesized)" 
              icon={<Brain className="w-5 h-5" />}
              defaultOpen={true}
            >
              <p className="text-foreground leading-relaxed mb-4">
                {process.synthesizedDescription.text}
              </p>
              <p className="text-foreground">
                Confidence level in this understanding: <strong>{getConfidenceLabel(process.synthesizedDescription.confidenceLevel)}</strong>, 
                {' '}based on {process.synthesizedDescription.basedOnInterviews} interview{process.synthesizedDescription.basedOnInterviews > 1 ? 's' : ''}.
              </p>
            </CollapsibleSection>
          )}

          {/* Interview Coverage Banner */}
          <CollapsibleSection 
            title="Interview Coverage" 
            icon={<FileText className="w-5 h-5" />}
            badge={`${interviewCoverage.employeesInterviewed}/${interviewCoverage.totalEmployeesInProcess}`}
          >
            <div className="mb-4">
              <p className="font-semibold text-foreground mb-2">Employees Interviewed:</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {employees.map((emp) => (
                  <EmployeeTag 
                    key={emp.id} 
                    employeeId={emp.id} 
                    employeeName={emp.name}
                    role={emp.role}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-2">Depth Distribution:</p>
              <div className="space-y-1 text-foreground">
                {depthData.map((d, idx) => (
                  <p key={idx}>
                    {d.label} ({d.count} employee{d.count > 1 ? 's' : ''})
                  </p>
                ))}
              </div>
            </div>
          </CollapsibleSection>

          {/* Process Steps */}
          {process.steps.length > 0 && (
            <CollapsibleSection 
              title="Process Steps" 
              icon={<List className="w-5 h-5" />}
              badge={process.steps.length}
            >
              <div className="space-y-2">
                {process.steps.map((step) => {
                  const isOpen = openSteps[step.stepNumber] ?? false;
                  
                  return (
                    <Collapsible key={step.stepNumber} open={isOpen} onOpenChange={() => toggleStep(step.stepNumber)}>
                      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left hover:bg-muted/50 p-1 -ml-1 rounded">
                        {isOpen ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="font-semibold text-foreground">Step {step.stepNumber}: {step.title}</span>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent className="pl-6 mt-2 space-y-3">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">Owner Role:</p>
                          <span className="text-foreground">{step.owner || 'Unassigned'}</span>
                        </div>
                        
                        <div>
                          <p className="font-semibold text-foreground">What happens:</p>
                          <p className="text-foreground">{step.description}</p>
                        </div>

                        {step.variations && step.variations.length > 0 && (
                          <div>
                            <p className="font-semibold text-foreground">Variations observed:</p>
                            <ul className="list-disc list-inside text-foreground">
                              {step.variations.map((variation, idx) => (
                                <li key={idx}>{variation}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {step.supportingQuotes.length > 0 && (
                          <div>
                            <p className="font-semibold text-foreground mb-2">Supporting Quotes:</p>
                            <div className="space-y-3">
                              {step.supportingQuotes.slice(0, 3).map((quote) => (
                                <div key={quote.id} className="pl-4 border-l-2 border-muted">
                                  <p className="italic text-foreground">"{quote.quote}"</p>
                                  <div className="mt-1">
                                    <EmployeeTag 
                                      employeeId={quote.employeeId} 
                                      employeeName={quote.employeeName}
                                      role={step.owner}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                            {step.supportingQuotes.length > 0 && (
                              <div className="mt-3">
                                <QuotesModal 
                                  quotes={step.supportingQuotes.map(convertToQuoteItem)}
                                  title={`Quotes about "${step.title}"`}
                                />
                              </div>
                            )}
                          </div>
                        )}

                        <p className="text-foreground">
                          <strong>Sentiment:</strong> {step.supportingQuotes[0]?.sentiment ? 
                            step.supportingQuotes[0].sentiment.charAt(0).toUpperCase() + step.supportingQuotes[0].sentiment.slice(1) : 
                            'Neutral'}
                        </p>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            </CollapsibleSection>
          )}

          {/* Key Pain Points */}
          {process.painPoints.length > 0 && (
            <CollapsibleSection 
              title="Key Pain Points" 
              icon={<AlertTriangle className="w-5 h-5" />}
              badge={process.painPoints.length}
            >
              <div className="space-y-2">
                {process.painPoints.map((painPoint, index) => {
                  const isOpen = openPainPoints[painPoint.id] ?? (index === 0);
                  
                  return (
                    <Collapsible key={painPoint.id} open={isOpen} onOpenChange={() => togglePainPoint(painPoint.id)}>
                      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left hover:bg-muted/50 p-1 -ml-1 rounded">
                        {isOpen ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="font-semibold text-foreground">{index + 1}. {painPoint.summary.split(' ').slice(0, 8).join(' ')}...</span>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent className="pl-6 mt-2 space-y-3">
                        <p className="text-foreground">
                          <strong>Confidence:</strong> {getConfidenceLabel(painPoint.confidenceLevel)}
                        </p>
                        <p className="text-foreground">{painPoint.summary}</p>
                        
                        {painPoint.supportingQuotes.length > 0 && (
                          <div>
                            <p className="font-semibold text-foreground mb-2">Supporting Quotes:</p>
                            <div className="space-y-3">
                              {painPoint.supportingQuotes.slice(0, 3).map((quote) => (
                                <div key={quote.id} className="pl-4 border-l-2 border-muted">
                                  <p className="italic text-foreground">"{quote.quote}"</p>
                                  <div className="mt-1">
                                    <EmployeeTag 
                                      employeeId={quote.employeeId} 
                                      employeeName={quote.employeeName}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            </CollapsibleSection>
          )}

          {/* Workarounds Identified */}
          {process.workarounds.length > 0 && (
            <CollapsibleSection 
              title="Workarounds Identified" 
              icon={<Wrench className="w-5 h-5" />}
              badge={process.workarounds.length}
            >
              <div className="space-y-4">
                {process.workarounds.map((workaround) => (
                  <div key={workaround.id} className="space-y-2">
                    <p className="text-foreground">{workaround.summary}</p>
                    {workaround.supportingQuotes.length > 0 && (
                      <div className="space-y-2">
                        {workaround.supportingQuotes.slice(0, 2).map((quote) => (
                          <div key={quote.id} className="pl-4 border-l-2 border-muted">
                            <p className="italic text-foreground text-sm">"{quote.quote}"</p>
                            <div className="mt-1">
                              <EmployeeTag 
                                employeeId={quote.employeeId} 
                                employeeName={quote.employeeName}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-4">
                <p className="font-semibold text-foreground mb-2">Why they exist:</p>
                <ul className="list-disc list-inside space-y-1 text-foreground">
                  {process.shadowTools.map((tool, idx) => (
                    tool.reason && <li key={idx}>{tool.reason}</li>
                  ))}
                  {process.workarounds.some(w => w.hasContradictions) && (
                    <li>Inconsistent processes across teams</li>
                  )}
                </ul>
              </div>
            </CollapsibleSection>
          )}

          {/* Tools Used */}
          <CollapsibleSection 
            title="Tools Used" 
            icon={<Package className="w-5 h-5" />}
            badge={process.officialTools.length + process.shadowTools.length}
          >
            <div className="mb-4">
              <p className="font-semibold text-foreground mb-2">Official Tools</p>
              <ul className="list-disc list-inside space-y-1 text-foreground">
                {process.officialTools.map((tool, idx) => (
                  <li key={idx}>{tool.name} (mentions: {tool.mentionCount})</li>
                ))}
              </ul>
            </div>

            {process.shadowTools.length > 0 && (
              <div>
                <p className="font-semibold text-foreground mb-2">Shadow Tools</p>
                <div className="space-y-3">
                  {process.shadowTools.map((tool, idx) => (
                    <div key={idx}>
                      <p className="text-foreground">{tool.name} (mentions: {tool.mentionCount})</p>
                      {tool.quotes.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {tool.quotes.slice(0, 1).map((quote) => (
                            <div key={quote.id} className="pl-4 border-l-2 border-muted">
                              <p className="italic text-foreground text-sm">"{quote.quote}"</p>
                              <div className="mt-1">
                                <EmployeeTag 
                                  employeeId={quote.employeeId} 
                                  employeeName={quote.employeeName}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleSection>

          {/* Improvement Suggestions (Employee-Sourced) */}
          {process.improvementSuggestions.length > 0 && (
            <CollapsibleSection 
              title="Improvement Suggestions (Employee-Sourced)" 
              icon={<Lightbulb className="w-5 h-5" />}
              badge={process.improvementSuggestions.length}
            >
              <div className="space-y-4">
                {process.improvementSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className="space-y-2">
                    <p className="text-foreground">"{suggestion.summary}"</p>
                    {suggestion.supportingQuotes.length > 0 && (
                      <div className="space-y-2">
                        {suggestion.supportingQuotes.slice(0, 1).map((quote) => (
                          <div key={quote.id} className="pl-4 border-l-2 border-muted">
                            <p className="italic text-foreground text-sm">"{quote.quote}"</p>
                            <div className="mt-1">
                              <EmployeeTag 
                                employeeId={quote.employeeId} 
                                employeeName={quote.employeeName}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-foreground mt-4">
                Confidence across suggestions: <strong>{getConfidenceLabel(process.improvementSuggestions[0]?.confidenceLevel || 'medium')}</strong>
              </p>
            </CollapsibleSection>
          )}

          {/* Knowledge Gaps */}
          {process.knowledgeGaps.length > 0 && (
            <CollapsibleSection 
              title="Knowledge Gaps" 
              icon={<HelpCircle className="w-5 h-5" />}
              badge={process.knowledgeGaps.length}
            >
              <ul className="list-disc list-inside space-y-2 text-foreground mb-4">
                {process.knowledgeGaps.map((gap, idx) => (
                  <li key={idx}>{gap.description}</li>
                ))}
              </ul>
              
              <div>
                <p className="font-semibold text-foreground mb-2">Suggested Follow-Up Questions:</p>
                <ul className="list-disc list-inside space-y-1 text-foreground">
                  {process.knowledgeGaps.flatMap(gap => gap.suggestedQuestions).map((q, idx) => (
                    <li key={idx}>{q}</li>
                  ))}
                </ul>
              </div>
            </CollapsibleSection>
          )}

          {/* Contradictions */}
          {process.contradictions.length > 0 && (
            <CollapsibleSection 
              title="Contradictions" 
              icon={<GitBranch className="w-5 h-5" />}
              badge={process.contradictions.length}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Topic</TableHead>
                    {process.contradictions[0]?.conflictingViews.map((_, idx) => (
                      <TableHead key={idx} className="font-semibold">
                        {idx === 0 ? 'Perspective 1' : 'Perspective 2'}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {process.contradictions.map((contradiction, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{contradiction.topic}</TableCell>
                      {contradiction.conflictingViews.map((view, vIdx) => (
                        <TableCell key={vIdx}>
                          <div className="space-y-2">
                            <p>"{view.view}"</p>
                            <EmployeeTag 
                              employeeId={view.quote.employeeId} 
                              employeeName={view.quote.employeeName}
                            />
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CollapsibleSection>
          )}

          {/* Overall Risk Assessment */}
          <CollapsibleSection 
            title="Overall Risk Assessment" 
            icon={<Shield className="w-5 h-5" />}
          >
            <div className="space-y-2">
              <p className="text-foreground">
                <strong>Operational Risk:</strong> {process.painPoints.length > 2 ? 'High' : process.painPoints.length > 0 ? 'Medium' : 'Low'}
              </p>
              <p className="text-foreground">
                <strong>Scalability Risk:</strong> {process.workarounds.length > 1 || process.shadowTools.length > 1 ? 'High' : 'Medium'}
              </p>
              <p className="text-foreground">
                <strong>People Dependency:</strong> {interviewCoverage.employeesInterviewed < interviewCoverage.totalEmployeesInProcess / 2 ? 'High' : 'Medium'}
              </p>
            </div>
          </CollapsibleSection>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ProcessDetail;
