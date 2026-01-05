// Interview engagement levels
export type InterviewDepth = 'deep-dive' | 'detailed' | 'brief' | 'mention' | 'dismissive';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type InsightType = 'pain-point' | 'improvement-suggestion' | 'workaround' | 'step-description' | 'tool-usage' | 'observation';

export interface InterviewQuote {
  id: string;
  employeeId: string;
  employeeName: string;
  quote: string;
  interviewDate: string;
  topic: string;
  sentiment: 'positive' | 'negative' | 'neutral' | 'frustrated';
  depth: InterviewDepth;
}

export interface ProcessInsight {
  id: string;
  type: InsightType;
  summary: string;
  confidenceLevel: ConfidenceLevel;
  supportingQuotes: InterviewQuote[];
  mentionCount: number;
  hasContradictions?: boolean;
  contradictionNotes?: string;
}

export interface ProcessStep {
  stepNumber: number;
  title: string;
  description: string;
  owner?: string;
  confidenceLevel: ConfidenceLevel;
  supportingQuotes: InterviewQuote[];
  variations?: string[]; // Different descriptions from different employees
}

export interface InterviewCoverage {
  totalEmployeesInProcess: number;
  employeesInterviewed: number;
  depthBreakdown: {
    deepDive: number;
    detailed: number;
    brief: number;
    mention: number;
    dismissive: number;
  };
}

export interface KnowledgeGap {
  topic: string;
  description: string;
  suggestedQuestions: string[];
}

export interface Process {
  id: string;
  name: string;
  department: string;
  owner: string;
  lastUpdated: string;
  
  // Interview-based data
  interviewCoverage: InterviewCoverage;
  
  // Synthesized understanding (with confidence)
  synthesizedDescription?: {
    text: string;
    confidenceLevel: ConfidenceLevel;
    basedOnInterviews: number;
  };
  
  // Steps as described by employees
  steps: ProcessStep[];
  
  // Categorized insights from interviews
  painPoints: ProcessInsight[];
  improvementSuggestions: ProcessInsight[];
  workarounds: ProcessInsight[];
  
  // Tools - distinguished by evidence
  officialTools: {
    name: string;
    mentionCount: number;
    quotes?: InterviewQuote[];
  }[];
  shadowTools: {
    name: string;
    mentionCount: number;
    reason?: string;
    quotes: InterviewQuote[];
  }[];
  
  // Knowledge gaps and contradictions
  knowledgeGaps: KnowledgeGap[];
  contradictions: {
    topic: string;
    conflictingViews: { view: string; quote: InterviewQuote }[];
  }[];
  
  // Related processes mentioned
  upstreamInputs: string[];
  downstreamOutputs: string[];
}

// Helper to generate quote IDs
const generateQuoteId = () => Math.random().toString(36).substring(2, 9);

export const processData: Process[] = [
  {
    id: '1',
    name: 'Invoice Processing',
    department: 'Finance',
    owner: 'Sarah Johnson',
    lastUpdated: '2024-01-15',
    interviewCoverage: {
      totalEmployeesInProcess: 12,
      employeesInterviewed: 8,
      depthBreakdown: { deepDive: 2, detailed: 3, brief: 2, mention: 1, dismissive: 0 }
    },
    synthesizedDescription: {
      text: 'End-to-end process for receiving, validating, and processing vendor invoices through to payment authorization. Multiple employees describe significant manual work and approval bottlenecks.',
      confidenceLevel: 'high',
      basedOnInterviews: 8
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Invoice Receipt',
        description: 'Receive invoices via email, mail, or vendor portal and log into the system',
        owner: 'AP Clerk',
        confidenceLevel: 'high',
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'kevin-brown', employeeName: 'Kevin Brown', quote: "So like, invoices come in from everywhere, right? Email, fax - we still get actual paper mail, believe it or not. First thing I do every morning is just... try to get them all into SAP.", interviewDate: '2024-01-10', topic: 'invoice receipt', sentiment: 'neutral', depth: 'detailed' }
        ]
      },
      {
        stepNumber: 2,
        title: 'Data Entry & Validation',
        description: 'Enter invoice details into SAP and validate against purchase orders',
        owner: 'AP Specialist',
        confidenceLevel: 'high',
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'sarah-johnson', employeeName: 'Sarah Johnson', quote: "Honestly? The data entry kills me. Like, when sales closes something, I have to literally copy-paste everything from the CRM into SAP field by field. It's... it's just a lot. Takes hours sometimes.", interviewDate: '2024-01-15', topic: 'data entry', sentiment: 'frustrated', depth: 'deep-dive' }
        ]
      },
      {
        stepNumber: 3,
        title: 'Three-Way Match',
        description: 'Match invoice to PO and goods receipt',
        owner: 'AP Specialist',
        confidenceLevel: 'medium',
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'jennifer-white', employeeName: 'Jennifer White', quote: "Um, the matching part is... it's fine when everything lines up. But like, I don't know, maybe a third of the time? Something doesn't match and then you're digging around trying to figure out why.", interviewDate: '2024-01-12', topic: 'matching', sentiment: 'neutral', depth: 'detailed' }
        ],
        variations: ['Some employees describe this as "matching", others call it "reconciliation"']
      },
      {
        stepNumber: 4,
        title: 'Manager Approval',
        description: 'Route to appropriate manager for approval',
        owner: 'Department Manager',
        confidenceLevel: 'high',
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'kevin-brown', employeeName: 'Kevin Brown', quote: "Oh god, the approvals. I swear I spend like... half my week just chasing people down. 'Hey did you sign this yet?' 'Can you approve this?' Managers are never at their desks. Always traveling or in some meeting.", interviewDate: '2024-01-10', topic: 'approvals', sentiment: 'frustrated', depth: 'deep-dive' }
        ]
      },
      {
        stepNumber: 5,
        title: 'Payment Processing',
        description: 'Process approved invoices for payment',
        owner: 'Treasury',
        confidenceLevel: 'medium',
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'sarah-johnson', employeeName: 'Sarah Johnson', quote: "Once it's approved it's pretty smooth actually. Just gets queued up for the next payment run. That part works.", interviewDate: '2024-01-15', topic: 'payment', sentiment: 'positive', depth: 'brief' }
        ]
      }
    ],
    painPoints: [
      {
        id: 'pp1',
        type: 'pain-point',
        summary: 'Manual CRM-to-SAP data entry takes 5-6 hrs/week with 2-3 errors weekly causing order delays',
        confidenceLevel: 'high',
        mentionCount: 5,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'sarah-johnson', employeeName: 'Sarah Johnson', quote: "It's the manual stuff that gets me. Every time sales closes something I'm sitting there copying fields one by one from the CRM. Like... why in 2024 are we still doing this?", interviewDate: '2024-01-15', topic: 'data entry', sentiment: 'frustrated', depth: 'deep-dive' },
          { id: generateQuoteId(), employeeId: 'kevin-brown', employeeName: 'Kevin Brown', quote: "Copy-paste, copy-paste, all day long. CRM to SAP, then SAP to Excel because... I don't even know why. Then back to SAP. It's madness honestly.", interviewDate: '2024-01-10', topic: 'data entry', sentiment: 'frustrated', depth: 'detailed' }
        ]
      },
      {
        id: 'pp2',
        type: 'pain-point',
        summary: 'Invoices sit 1-2 weeks awaiting manager approval; chasing signatures takes ~4 hrs/week',
        confidenceLevel: 'high',
        mentionCount: 4,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'kevin-brown', employeeName: 'Kevin Brown', quote: "I track my time sometimes and it's like... hours. Hours every week just pinging people for signatures. The big orders especially, they just sit there.", interviewDate: '2024-01-10', topic: 'approvals', sentiment: 'frustrated', depth: 'deep-dive' },
          { id: generateQuoteId(), employeeId: 'jennifer-white', employeeName: 'Jennifer White', quote: "Last month we had an invoice sit for like a week and a half because John was traveling. The vendor was not happy. I mean, what am I supposed to do?", interviewDate: '2024-01-12', topic: 'approvals', sentiment: 'frustrated', depth: 'detailed' }
        ]
      }
    ],
    improvementSuggestions: [
      {
        id: 'is1',
        type: 'improvement-suggestion',
        summary: 'Auto-delegation when manager is OOO could eliminate 1-2 week approval delays',
        confidenceLevel: 'high',
        mentionCount: 3,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'sarah-johnson', employeeName: 'Sarah Johnson', quote: "I keep saying, if there was just like... auto-delegation when someone's OOO? My friend at [competitor] has that. When her boss is on vacation, approvals automatically go to the backup. Why don't we have that?", interviewDate: '2024-01-15', topic: 'automation', sentiment: 'frustrated', depth: 'deep-dive' }
        ]
      },
      {
        id: 'is2',
        type: 'improvement-suggestion',
        summary: 'Mobile DocuSign could enable approvals in minutes vs. 3-day wait for manager return',
        confidenceLevel: 'medium',
        mentionCount: 2,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'kevin-brown', employeeName: 'Kevin Brown', quote: "Even just DocuSign or whatever would help. Like, people could approve from their phone at the airport instead of us waiting three days for them to get back.", interviewDate: '2024-01-10', topic: 'digital signatures', sentiment: 'positive', depth: 'brief' }
        ]
      }
    ],
    workarounds: [
      {
        id: 'w1',
        type: 'workaround',
        summary: '4 employees maintain personal Excel trackers because SAP lacks at-a-glance status visibility',
        confidenceLevel: 'high',
        mentionCount: 4,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'sarah-johnson', employeeName: 'Sarah Johnson', quote: "Look, I know we're not supposed to, but I have my own spreadsheet. SAP is just... it doesn't show me at a glance what I need to know. And honestly? Everyone does this. We all have our own little trackers.", interviewDate: '2024-01-15', topic: 'tracking', sentiment: 'frustrated', depth: 'deep-dive' }
        ]
      }
    ],
    officialTools: [
      { name: 'SAP', mentionCount: 8 },
      { name: 'Excel', mentionCount: 6 }
    ],
      shadowTools: [
      {
        name: 'Personal Excel Trackers',
        mentionCount: 4,
        reason: 'SAP lacks visibility into invoice status',
        quotes: [
          { id: generateQuoteId(), employeeId: 'sarah-johnson', employeeName: 'Sarah Johnson', quote: "Yeah so I have my own Excel thing going. SAP is... I mean it works but I can't see what I need to see quickly, you know?", interviewDate: '2024-01-15', topic: 'tracking', sentiment: 'frustrated', depth: 'deep-dive' }
        ]
      }
    ],
    knowledgeGaps: [
      {
        topic: 'Exception handling process',
        description: 'No clear understanding of how invoice exceptions and discrepancies are resolved',
        suggestedQuestions: ['What happens when an invoice doesnt match the PO?', 'Who has authority to approve exceptions?']
      }
    ],
    contradictions: [
      {
        topic: 'Approval thresholds',
        conflictingViews: [
          { view: 'Threshold is $5,000', quote: { id: generateQuoteId(), employeeId: 'kevin-brown', employeeName: 'Kevin Brown', quote: "I'm pretty sure it's five grand? Anything over that needs a director to sign off.", interviewDate: '2024-01-10', topic: 'thresholds', sentiment: 'neutral', depth: 'brief' } },
          { view: 'Threshold is $10,000', quote: { id: generateQuoteId(), employeeId: 'jennifer-white', employeeName: 'Jennifer White', quote: "Hmm, I want to say it's ten thousand before leadership has to get involved? But honestly I might be wrong on that.", interviewDate: '2024-01-12', topic: 'thresholds', sentiment: 'neutral', depth: 'brief' } }
        ]
      }
    ],
    upstreamInputs: ['Purchase Orders', 'Vendor Information'],
    downstreamOutputs: ['Payment Authorization', 'Accounting Records']
  },
  {
    id: '2',
    name: 'Customer Onboarding',
    department: 'Sales',
    owner: 'Mike Chen',
    lastUpdated: '2024-01-10',
    interviewCoverage: {
      totalEmployeesInProcess: 8,
      employeesInterviewed: 6,
      depthBreakdown: { deepDive: 1, detailed: 2, brief: 2, mention: 1, dismissive: 0 }
    },
    synthesizedDescription: {
      text: 'Process for welcoming and setting up new customers after contract signing. Handoff between sales and customer success is the primary source of friction.',
      confidenceLevel: 'high',
      basedOnInterviews: 6
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Contract Handoff',
        description: 'Sales rep transfers signed contract and customer details to onboarding team',
        owner: 'Sales Rep',
        confidenceLevel: 'high',
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'mike-chen', employeeName: 'Mike Chen', quote: "The handoff is where it all falls apart, honestly. I close a deal, I'm pumped, customer's excited, and then... crickets. Sometimes they don't hear from their account manager for like three, four days. It's embarrassing.", interviewDate: '2024-01-08', topic: 'handoff', sentiment: 'frustrated', depth: 'deep-dive' }
        ]
      },
      {
        stepNumber: 2,
        title: 'Account Setup',
        description: 'Create customer account in all relevant systems',
        owner: 'Customer Success',
        confidenceLevel: 'medium',
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'amy-torres', employeeName: 'Amy Torres', quote: "Let me count... CRM, billing, support portal, training platform, and then the actual product itself. So that's five systems. For every. Single. Customer. And none of them talk to each other obviously.", interviewDate: '2024-01-09', topic: 'account setup', sentiment: 'neutral', depth: 'detailed' }
        ]
      },
      {
        stepNumber: 3,
        title: 'Welcome Call',
        description: 'Schedule and conduct welcome call',
        owner: 'Account Manager',
        confidenceLevel: 'high',
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'mike-chen', employeeName: 'Mike Chen', quote: "That first call is huge. Like, that's when they're deciding if they made the right choice. If we drop the ball there... yeah. It's hard to recover from that.", interviewDate: '2024-01-08', topic: 'welcome call', sentiment: 'neutral', depth: 'detailed' }
        ]
      },
      {
        stepNumber: 4,
        title: 'Training Sessions',
        description: 'Deliver product training',
        owner: 'Training Specialist',
        confidenceLevel: 'medium',
        supportingQuotes: []
      },
      {
        stepNumber: 5,
        title: 'Go-Live',
        description: 'Confirm customer is operational',
        owner: 'Customer Success',
        confidenceLevel: 'low',
        supportingQuotes: []
      }
    ],
    painPoints: [
      {
        id: 'pp1',
        type: 'pain-point',
        summary: 'New customers wait 3-4 days after signing before first contact from account manager',
        confidenceLevel: 'high',
        mentionCount: 4,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'mike-chen', employeeName: 'Mike Chen', quote: "I literally had a customer email me last week like 'hey, is anyone going to reach out?' This was four days after they signed. Four days! What are we even doing?", interviewDate: '2024-01-08', topic: 'handoff', sentiment: 'frustrated', depth: 'deep-dive' }
        ]
      }
    ],
    improvementSuggestions: [
      {
        id: 'is1',
        type: 'improvement-suggestion',
        summary: 'Salesforce auto-ping to CS team on deal close could reduce handoff time from 4 days to same-day',
        confidenceLevel: 'medium',
        mentionCount: 2,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'mike-chen', employeeName: 'Mike Chen', quote: "If Salesforce just... pinged the CS team automatically when a deal closes? Like a real notification, not buried in some report. That alone would fix half of this.", interviewDate: '2024-01-08', topic: 'automation', sentiment: 'positive', depth: 'detailed' }
        ]
      }
    ],
    workarounds: [],
    officialTools: [
      { name: 'CRM', mentionCount: 6 },
      { name: 'DocuSign', mentionCount: 4 }
    ],
    shadowTools: [],
    knowledgeGaps: [
      {
        topic: 'Training effectiveness measurement',
        description: 'Unclear how training success is measured',
        suggestedQuestions: ['How do you know if a customer is ready for go-live?', 'What metrics track training completion?']
      }
    ],
    contradictions: [],
    upstreamInputs: ['Sales Contract', 'Customer Data'],
    downstreamOutputs: ['Active Customer Account', 'Welcome Package']
  },
  {
    id: '3',
    name: 'Employee Expense Reports',
    department: 'HR',
    owner: 'Emma Davis',
    lastUpdated: '2024-01-12',
    interviewCoverage: {
      totalEmployeesInProcess: 25,
      employeesInterviewed: 18,
      depthBreakdown: { deepDive: 3, detailed: 5, brief: 6, mention: 3, dismissive: 1 }
    },
    synthesizedDescription: {
      text: 'Administrative process for employees to submit business expenses for reimbursement. High volume of participants with varying levels of frustration around mobile access and receipt management.',
      confidenceLevel: 'high',
      basedOnInterviews: 18
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Expense Incurred',
        description: 'Employee incurs business expense and collects receipt',
        owner: 'Employee',
        confidenceLevel: 'high',
        supportingQuotes: []
      },
      {
        stepNumber: 2,
        title: 'Report Creation',
        description: 'Employee creates expense report in system',
        owner: 'Employee',
        confidenceLevel: 'high',
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'daniel-martinez', employeeName: 'Daniel Martinez', quote: "A mobile app would be... I mean, that would change everything. Right now I'm taking a client to dinner, I get a receipt, and I literally have to wait until I'm back at my desk to do anything with it. Which means I forget.", interviewDate: '2024-01-11', topic: 'mobile access', sentiment: 'frustrated', depth: 'detailed' }
        ]
      },
      {
        stepNumber: 3,
        title: 'Manager Review',
        description: 'Direct manager reviews and approves',
        owner: 'Manager',
        confidenceLevel: 'high',
        supportingQuotes: []
      },
      {
        stepNumber: 4,
        title: 'Finance Processing',
        description: 'Finance team processes approved reports',
        owner: 'Finance',
        confidenceLevel: 'medium',
        supportingQuotes: []
      }
    ],
    painPoints: [
      {
        id: 'pp1',
        type: 'pain-point',
        summary: 'Road warriors (2+ weeks travel/month) cannot submit expenses from phone; desktop-only access',
        confidenceLevel: 'high',
        mentionCount: 8,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'daniel-martinez', employeeName: 'Daniel Martinez', quote: "I travel like two weeks a month. Two weeks! And I can't submit expenses from my phone. It's honestly kind of insane when you think about it.", interviewDate: '2024-01-11', topic: 'mobile access', sentiment: 'frustrated', depth: 'detailed' }
        ]
      },
      {
        id: 'pp2',
        type: 'pain-point',
        summary: 'HR sends ~30 reminder emails monthly chasing outstanding receipts from repeat offenders',
        confidenceLevel: 'high',
        mentionCount: 6,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'emma-davis', employeeName: 'Emma Davis', quote: "Oh god, end of month is just me sending emails to like... thirty people. 'Hey, you have outstanding receipts.' 'Hey, where's that thing from three weeks ago.' It's like herding cats, I swear.", interviewDate: '2024-01-12', topic: 'receipt submission', sentiment: 'frustrated', depth: 'deep-dive' }
        ]
      }
    ],
    improvementSuggestions: [
      {
        id: 'is1',
        type: 'improvement-suggestion',
        summary: 'Mobile app with OCR photo capture (like Salesforce) could auto-extract amount, vendor, date instantly',
        confidenceLevel: 'high',
        mentionCount: 7,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'daniel-martinez', employeeName: 'Daniel Martinez', quote: "My buddy at Salesforce literally just takes a photo of his receipt and it reads everything automatically. The amount, vendor, date - all of it. We're... we're not there yet clearly.", interviewDate: '2024-01-11', topic: 'mobile capture', sentiment: 'positive', depth: 'detailed' }
        ]
      }
    ],
    workarounds: [
      {
        id: 'w1',
        type: 'workaround',
        summary: '10 employees store receipts in phone gallery folders; end-of-month sorting takes hours',
        confidenceLevel: 'high',
        mentionCount: 10,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'daniel-martinez', employeeName: 'Daniel Martinez', quote: "My workaround? I just take photos of everything and dump them in a folder called 'expenses' on my phone. Then at the end of the month I'm scrolling through like 'wait, was this lunch with the client or just my lunch?'", interviewDate: '2024-01-11', topic: 'receipt storage', sentiment: 'frustrated', depth: 'detailed' }
        ]
      }
    ],
    officialTools: [{ name: 'Expense Software', mentionCount: 15 }],
    shadowTools: [
      {
        name: 'Personal Phone Gallery',
        mentionCount: 10,
        reason: 'No mobile expense app available',
        quotes: [
          { id: generateQuoteId(), employeeId: 'daniel-martinez', employeeName: 'Daniel Martinez', quote: "Photos in my camera roll. That's my system. Is it a good system? No. Does it work? ...Also no, but it's what I've got.", interviewDate: '2024-01-11', topic: 'receipt storage', sentiment: 'frustrated', depth: 'detailed' }
        ]
      }
    ],
    knowledgeGaps: [],
    contradictions: [],
    upstreamInputs: ['Expense Receipts', 'Approval Forms'],
    downstreamOutputs: ['Reimbursement', 'Tax Records']
  },
  {
    id: '4',
    name: 'IT Asset Management',
    department: 'IT',
    owner: 'David Wilson',
    lastUpdated: '2024-01-08',
    interviewCoverage: {
      totalEmployeesInProcess: 6,
      employeesInterviewed: 5,
      depthBreakdown: { deepDive: 1, detailed: 2, brief: 1, mention: 1, dismissive: 0 }
    },
    synthesizedDescription: {
      text: 'Process for tracking and managing IT hardware and software assets. Manual tracking causes inventory discrepancies.',
      confidenceLevel: 'medium',
      basedOnInterviews: 5
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Asset Request',
        description: 'Employee submits request for new hardware or software',
        owner: 'Employee',
        confidenceLevel: 'high',
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'david-wilson', employeeName: 'David Wilson', quote: "Requests are all over the place. Most come through ServiceNow which is good, but then some people just... email me directly. Or Slack me. And then things fall through the cracks.", interviewDate: '2024-01-08', topic: 'requests', sentiment: 'neutral', depth: 'detailed' }
        ]
      },
      {
        stepNumber: 2,
        title: 'Approval & Procurement',
        description: 'Manager approves and IT procurement orders',
        owner: 'IT Manager',
        confidenceLevel: 'medium',
        supportingQuotes: []
      },
      {
        stepNumber: 3,
        title: 'Asset Registration',
        description: 'New asset is tagged and registered in database',
        owner: 'IT Admin',
        confidenceLevel: 'high',
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'david-wilson', employeeName: 'David Wilson', quote: "We did an audit last quarter and found like... twelve laptops? Fifteen? That nobody knew existed. They were just sitting in some closet. Never got registered. Manual tracking doesn't scale when you're growing this fast.", interviewDate: '2024-01-08', topic: 'registration', sentiment: 'frustrated', depth: 'deep-dive' }
        ]
      },
      {
        stepNumber: 4,
        title: 'Deployment',
        description: 'Asset is configured and deployed',
        owner: 'IT Support',
        confidenceLevel: 'medium',
        supportingQuotes: []
      }
    ],
    painPoints: [
      {
        id: 'pp1',
        type: 'pain-point',
        summary: 'Q4 audit found 12-15 unregistered laptops; one MacBook sat unused for 2 years post-departure',
        confidenceLevel: 'high',
        mentionCount: 3,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'david-wilson', employeeName: 'David Wilson', quote: "It's a mess honestly. Last month we found a MacBook Pro that was assigned to someone who left two years ago. Two years! Just... sitting in a drawer somewhere.", interviewDate: '2024-01-08', topic: 'tracking', sentiment: 'frustrated', depth: 'deep-dive' }
        ]
      }
    ],
    improvementSuggestions: [
      {
        id: 'is1',
        type: 'improvement-suggestion',
        summary: 'Implement RFID tagging system',
        confidenceLevel: 'medium',
        mentionCount: 2,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'david-wilson', employeeName: 'David Wilson', quote: "RFID tags would be amazing. I saw a demo at this conference last year where you just... wave a scanner and boom, you know exactly what's in the room. We're years away from that though probably.", interviewDate: '2024-01-08', topic: 'rfid', sentiment: 'positive', depth: 'brief' }
        ]
      }
    ],
    workarounds: [],
    officialTools: [
      { name: 'ServiceNow', mentionCount: 4 },
      { name: 'Asset Database', mentionCount: 3 }
    ],
    shadowTools: [],
    knowledgeGaps: [
      {
        topic: 'Asset disposal process',
        description: 'No clear understanding of how old assets are decommissioned',
        suggestedQuestions: ['What happens to old laptops?', 'Who authorizes disposal?']
      }
    ],
    contradictions: [],
    upstreamInputs: ['Asset Requests', 'Hardware Inventory'],
    downstreamOutputs: ['Asset Assignments', 'Maintenance Schedule']
  },
  {
    id: '5',
    name: 'Marketing Campaign Approval',
    department: 'Marketing',
    owner: 'Lisa Rodriguez',
    lastUpdated: '2024-01-14',
    interviewCoverage: {
      totalEmployeesInProcess: 15,
      employeesInterviewed: 11,
      depthBreakdown: { deepDive: 3, detailed: 4, brief: 2, mention: 1, dismissive: 1 }
    },
    synthesizedDescription: {
      text: 'Multi-stage approval workflow for marketing campaigns. Multiple layers of approval create significant delays, causing missed market opportunities.',
      confidenceLevel: 'high',
      basedOnInterviews: 11
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Campaign Brief Creation',
        description: 'Marketing team creates detailed campaign brief',
        owner: 'Campaign Manager',
        confidenceLevel: 'high',
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'lisa-rodriguez', employeeName: 'Lisa Rodriguez', quote: "The brief itself takes like a week to put together. That part's fine. But then you submit it and you just... wait. And wait. And then someone asks for changes and you're back to waiting.", interviewDate: '2024-01-14', topic: 'brief creation', sentiment: 'neutral', depth: 'detailed' }
        ]
      },
      {
        stepNumber: 2,
        title: 'Creative Review',
        description: 'Creative director reviews design and messaging',
        owner: 'Creative Director',
        confidenceLevel: 'high',
        supportingQuotes: []
      },
      {
        stepNumber: 3,
        title: 'Budget Approval',
        description: 'Finance reviews budget allocation',
        owner: 'Finance',
        confidenceLevel: 'medium',
        supportingQuotes: []
      },
      {
        stepNumber: 4,
        title: 'Legal Review',
        description: 'Legal team reviews for compliance',
        owner: 'Legal',
        confidenceLevel: 'high',
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'christopher-lee', employeeName: 'Christopher Lee', quote: "Legal is like... a black hole. Things go in and you just wait. No visibility, no status updates. You Slack them and they're like 'it's in the queue.' Great. What does that mean?", interviewDate: '2024-01-12', topic: 'legal review', sentiment: 'frustrated', depth: 'detailed' }
        ]
      },
      {
        stepNumber: 5,
        title: 'Final Sign-off',
        description: 'CMO gives final approval',
        owner: 'CMO',
        confidenceLevel: 'high',
        supportingQuotes: []
      }
    ],
    painPoints: [
      {
        id: 'pp1',
        type: 'pain-point',
        summary: 'Campaign missed product launch by 2 weeks due to approval delays; market window lost entirely',
        confidenceLevel: 'high',
        mentionCount: 6,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'lisa-rodriguez', employeeName: 'Lisa Rodriguez', quote: "We had this perfect moment for a campaign around the product launch and by the time we got approved... the launch had happened two weeks ago. The moment was gone. That was frustrating.", interviewDate: '2024-01-14', topic: 'timing', sentiment: 'frustrated', depth: 'deep-dive' }
        ]
      },
      {
        id: 'pp2',
        type: 'pain-point',
        summary: '~50% of campaign manager time spent on follow-up emails; approval chains grow 20+ emails long',
        confidenceLevel: 'high',
        mentionCount: 4,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'christopher-lee', employeeName: 'Christopher Lee', quote: "I swear half my job is just following up on approvals. 'Hey just circling back on this.' 'Hey following up.' 'Hey just wanted to bump this.' It's exhausting. And the email chains get so long nobody reads them.", interviewDate: '2024-01-12', topic: 'chasing approvals', sentiment: 'frustrated', depth: 'deep-dive' }
        ]
      }
    ],
    improvementSuggestions: [
      {
        id: 'is1',
        type: 'improvement-suggestion',
        summary: 'Run Legal + Finance reviews in parallel could cut 5-stage approval from 3 weeks to 1 week',
        confidenceLevel: 'high',
        mentionCount: 4,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'lisa-rodriguez', employeeName: 'Lisa Rodriguez', quote: "I don't understand why legal and finance can't review at the same time? Like, finance doesn't need legal's opinion to check the budget. Just... run them in parallel?", interviewDate: '2024-01-14', topic: 'parallel approvals', sentiment: 'positive', depth: 'detailed' }
        ]
      },
      {
        id: 'is2',
        type: 'improvement-suggestion',
        summary: 'Pre-approved templates for quarterly promos (same structure each time) could skip full legal review',
        confidenceLevel: 'medium',
        mentionCount: 2,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'christopher-lee', employeeName: 'Christopher Lee', quote: "We do the same promo every quarter basically. Same structure, same discount tiers. Why does it need a full legal review every time? Just give us a template we can use.", interviewDate: '2024-01-12', topic: 'templates', sentiment: 'positive', depth: 'brief' }
        ]
      }
    ],
    workarounds: [
      {
        id: 'w1',
        type: 'workaround',
        summary: '5 team members created personal Slack channels because email chains became unreadable at 20+ messages',
        confidenceLevel: 'high',
        mentionCount: 5,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'christopher-lee', employeeName: 'Christopher Lee', quote: "I made a Slack channel just for tracking approvals because email was just... chaos. Now at least I can scroll up and see 'okay, finance approved Tuesday, legal is still pending, creative signed off.' It helps.", interviewDate: '2024-01-12', topic: 'tracking', sentiment: 'neutral', depth: 'detailed' }
        ]
      }
    ],
    officialTools: [
      { name: 'HubSpot', mentionCount: 8 },
      { name: 'Email', mentionCount: 11 }
    ],
    shadowTools: [
      {
        name: 'Slack threads for tracking',
        mentionCount: 5,
        reason: 'No visibility into approval status in official tools',
        quotes: [
          { id: generateQuoteId(), employeeId: 'christopher-lee', employeeName: 'Christopher Lee', quote: "Yeah I have a whole Slack channel for it now. Kinda sad that I had to make my own solution but whatever, it works.", interviewDate: '2024-01-12', topic: 'tracking', sentiment: 'neutral', depth: 'detailed' }
        ]
      }
    ],
    knowledgeGaps: [
      {
        topic: 'Fast-track approval criteria',
        description: 'Unclear what qualifies a campaign for expedited review',
        suggestedQuestions: ['Are there criteria for fast-track approvals?', 'Who can authorize expedited review?']
      }
    ],
    contradictions: [],
    upstreamInputs: ['Campaign Brief', 'Budget Request'],
    downstreamOutputs: ['Approved Campaign', 'Launch Timeline']
  },
  {
    id: '6',
    name: 'Vendor Onboarding',
    department: 'Procurement',
    owner: 'Tom Anderson',
    lastUpdated: '2024-01-11',
    interviewCoverage: {
      totalEmployeesInProcess: 10,
      employeesInterviewed: 7,
      depthBreakdown: { deepDive: 1, detailed: 3, brief: 2, mention: 1, dismissive: 0 }
    },
    synthesizedDescription: {
      text: 'Structured process for evaluating and setting up new vendors. Legal review is consistently identified as the primary bottleneck.',
      confidenceLevel: 'high',
      basedOnInterviews: 7
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Vendor Application',
        description: 'Potential vendor submits application',
        owner: 'Vendor',
        confidenceLevel: 'high',
        supportingQuotes: []
      },
      {
        stepNumber: 2,
        title: 'Due Diligence',
        description: 'Procurement conducts background checks',
        owner: 'Procurement Analyst',
        confidenceLevel: 'medium',
        supportingQuotes: []
      },
      {
        stepNumber: 3,
        title: 'Legal Review',
        description: 'Legal reviews vendor contracts',
        owner: 'Legal',
        confidenceLevel: 'high',
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'tom-anderson', employeeName: 'Tom Anderson', quote: "Legal review is where everything grinds to a halt. And look, I get it, contracts are important. But like... it's a standard vendor contract. We've signed a hundred of these. Why does it need three weeks of back-and-forth?", interviewDate: '2024-01-11', topic: 'legal review', sentiment: 'frustrated', depth: 'deep-dive' }
        ]
      },
      {
        stepNumber: 4,
        title: 'System Setup',
        description: 'Approved vendor is set up in systems',
        owner: 'Procurement Admin',
        confidenceLevel: 'medium',
        supportingQuotes: []
      }
    ],
    painPoints: [
      {
        id: 'pp1',
        type: 'pain-point',
        summary: 'Standard vendor contracts take 3 weeks for legal review despite 80% fitting template categories',
        confidenceLevel: 'high',
        mentionCount: 5,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'tom-anderson', employeeName: 'Tom Anderson', quote: "Same thing, same thing. We just need like three or four standard contracts that are pre-approved. Software vendor, services vendor, office supplies, whatever. Eighty percent of our vendors would fit into one of those.", interviewDate: '2024-01-11', topic: 'legal review', sentiment: 'frustrated', depth: 'deep-dive' }
        ]
      }
    ],
    improvementSuggestions: [
      {
        id: 'is1',
        type: 'improvement-suggestion',
        summary: '3-4 pre-approved templates (software, services, supplies) could reduce onboarding from 3 weeks to 1 day',
        confidenceLevel: 'high',
        mentionCount: 3,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'tom-anderson', employeeName: 'Tom Anderson', quote: "My dream? Three or four pre-approved templates. 'You're a software vendor? Cool, here's your contract, sign here.' Done in a day instead of three weeks.", interviewDate: '2024-01-11', topic: 'templates', sentiment: 'positive', depth: 'detailed' }
        ]
      }
    ],
    workarounds: [],
    officialTools: [
      { name: 'Vendor Portal', mentionCount: 6 },
      { name: 'Background Check System', mentionCount: 4 }
    ],
    shadowTools: [],
    knowledgeGaps: [],
    contradictions: [],
    upstreamInputs: ['Vendor Applications', 'Due Diligence Reports'],
    downstreamOutputs: ['Approved Vendor List', 'Contract Templates']
  },
  {
    id: '7',
    name: 'Product Development Sprint',
    department: 'Engineering',
    owner: 'Anna Thompson',
    lastUpdated: '2024-01-13',
    interviewCoverage: {
      totalEmployeesInProcess: 20,
      employeesInterviewed: 16,
      depthBreakdown: { deepDive: 4, detailed: 6, brief: 4, mention: 2, dismissive: 0 }
    },
    synthesizedDescription: {
      text: 'Agile development process using two-week sprints. Well-documented process with high employee engagement. Cross-team dependencies identified as occasional friction point.',
      confidenceLevel: 'high',
      basedOnInterviews: 16
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Sprint Planning',
        description: 'Team selects user stories and estimates effort',
        owner: 'Product Owner',
        confidenceLevel: 'high',
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'anna-thompson', employeeName: 'Anna Thompson', quote: "Planning day is intense but like... in a good way? Everyone's in the room, we're hashing it out, by the end of it everyone knows exactly what they're doing for the next two weeks. It actually works pretty well.", interviewDate: '2024-01-13', topic: 'planning', sentiment: 'positive', depth: 'detailed' }
        ]
      },
      {
        stepNumber: 2,
        title: 'Development',
        description: 'Engineers develop features with daily standups',
        owner: 'Development Team',
        confidenceLevel: 'high',
        supportingQuotes: []
      },
      {
        stepNumber: 3,
        title: 'Code Review',
        description: 'Peer review of all code changes',
        owner: 'Senior Engineers',
        confidenceLevel: 'high',
        supportingQuotes: []
      },
      {
        stepNumber: 4,
        title: 'Testing',
        description: 'QA validates functionality',
        owner: 'QA Team',
        confidenceLevel: 'high',
        supportingQuotes: []
      },
      {
        stepNumber: 5,
        title: 'Sprint Review',
        description: 'Demo completed work to stakeholders',
        owner: 'Scrum Master',
        confidenceLevel: 'high',
        supportingQuotes: []
      }
    ],
    painPoints: [
      {
        id: 'pp1',
        type: 'pain-point',
        summary: 'Cross-team dependencies discovered too late cause 1-2 day delays per sprint on average',
        confidenceLevel: 'medium',
        mentionCount: 4,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'anna-thompson', employeeName: 'Anna Thompson', quote: 'Our sprint velocity has improved but cross-team dependencies still cause occasional delays. We need better visibility.', interviewDate: '2024-01-13', topic: 'dependencies', sentiment: 'neutral', depth: 'detailed' }
        ]
      }
    ],
    improvementSuggestions: [
      {
        id: 'is1',
        type: 'improvement-suggestion',
        summary: 'Shared dependency board visible to all 20 engineers could surface blockers before sprint starts',
        confidenceLevel: 'medium',
        mentionCount: 3,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'anna-thompson', employeeName: 'Anna Thompson', quote: 'A dependency board visible to all teams would help. Right now we find out too late.', interviewDate: '2024-01-13', topic: 'dependency tracking', sentiment: 'positive', depth: 'brief' }
        ]
      }
    ],
    workarounds: [],
    officialTools: [
      { name: 'Jira', mentionCount: 16 },
      { name: 'GitHub', mentionCount: 14 },
      { name: 'Confluence', mentionCount: 8 }
    ],
    shadowTools: [],
    knowledgeGaps: [],
    contradictions: [],
    upstreamInputs: ['Product Requirements', 'User Stories'],
    downstreamOutputs: ['Working Software', 'Test Results']
  },
  {
    id: '8',
    name: 'Quality Assurance Testing',
    department: 'QA',
    owner: 'James Miller',
    lastUpdated: '2024-01-09',
    interviewCoverage: {
      totalEmployeesInProcess: 14,
      employeesInterviewed: 10,
      depthBreakdown: { deepDive: 2, detailed: 4, brief: 3, mention: 1, dismissive: 0 }
    },
    synthesizedDescription: {
      text: 'Comprehensive testing process for software quality. Environment setup is a major time sink, consuming significant sprint time.',
      confidenceLevel: 'high',
      basedOnInterviews: 10
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Test Planning',
        description: 'Create test plan based on requirements',
        owner: 'QA Lead',
        confidenceLevel: 'high',
        supportingQuotes: []
      },
      {
        stepNumber: 2,
        title: 'Environment Setup',
        description: 'Configure test environment',
        owner: 'QA Engineer',
        confidenceLevel: 'high',
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'james-miller', employeeName: 'James Miller', quote: 'Environment setup eats up 20% of our sprint time. We really need containerized environments that spin up instantly.', interviewDate: '2024-01-09', topic: 'environment setup', sentiment: 'frustrated', depth: 'deep-dive' }
        ]
      },
      {
        stepNumber: 3,
        title: 'Test Execution',
        description: 'Run manual and automated tests',
        owner: 'QA Team',
        confidenceLevel: 'high',
        supportingQuotes: []
      },
      {
        stepNumber: 4,
        title: 'Bug Reporting',
        description: 'Document and prioritize defects',
        owner: 'QA Engineer',
        confidenceLevel: 'high',
        supportingQuotes: []
      }
    ],
    painPoints: [
      {
        id: 'pp1',
        type: 'pain-point',
        summary: 'Test environment setup consumes 20% of each 2-week sprint (~2 days of QA capacity lost)',
        confidenceLevel: 'high',
        mentionCount: 6,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'james-miller', employeeName: 'James Miller', quote: 'Environment setup eats up 20% of our sprint time. We really need containerized environments that spin up instantly.', interviewDate: '2024-01-09', topic: 'environment setup', sentiment: 'frustrated', depth: 'deep-dive' }
        ]
      }
    ],
    improvementSuggestions: [
      {
        id: 'is1',
        type: 'improvement-suggestion',
        summary: 'Docker containers replicating prod could reduce 2-day setup to single command (minutes)',
        confidenceLevel: 'high',
        mentionCount: 4,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'james-miller', employeeName: 'James Miller', quote: 'Docker containers that replicate prod exactly. One command and youre ready to test.', interviewDate: '2024-01-09', topic: 'containers', sentiment: 'positive', depth: 'detailed' }
        ]
      }
    ],
    workarounds: [
      {
        id: 'w1',
        type: 'workaround',
        summary: 'Personal test checklists outside official system',
        confidenceLevel: 'medium',
        mentionCount: 3,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'james-miller', employeeName: 'James Miller', quote: 'I keep my own checklist in Notion because TestRail is too slow to update on the fly.', interviewDate: '2024-01-09', topic: 'checklists', sentiment: 'neutral', depth: 'brief' }
        ]
      }
    ],
    officialTools: [
      { name: 'TestRail', mentionCount: 8 },
      { name: 'Selenium', mentionCount: 6 }
    ],
    shadowTools: [
      {
        name: 'Personal Notion checklists',
        mentionCount: 3,
        reason: 'TestRail too slow for on-the-fly updates',
        quotes: [
          { id: generateQuoteId(), employeeId: 'james-miller', employeeName: 'James Miller', quote: 'I keep my own checklist in Notion because TestRail is too slow.', interviewDate: '2024-01-09', topic: 'checklists', sentiment: 'neutral', depth: 'brief' }
        ]
      }
    ],
    knowledgeGaps: [],
    contradictions: [],
    upstreamInputs: ['Code Releases', 'Test Plans'],
    downstreamOutputs: ['Test Reports', 'Bug Reports']
  },
  {
    id: '9',
    name: 'Customer Support Ticket Resolution',
    department: 'Support',
    owner: 'Rachel Green',
    lastUpdated: '2024-01-16',
    interviewCoverage: {
      totalEmployeesInProcess: 18,
      employeesInterviewed: 14,
      depthBreakdown: { deepDive: 3, detailed: 5, brief: 4, mention: 1, dismissive: 1 }
    },
    synthesizedDescription: {
      text: 'End-to-end customer support process. High volume with complex escalation paths. Knowledge base gaps force repeated research.',
      confidenceLevel: 'high',
      basedOnInterviews: 14
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Ticket Creation',
        description: 'Customer submits support request',
        owner: 'Customer',
        confidenceLevel: 'high',
        supportingQuotes: []
      },
      {
        stepNumber: 2,
        title: 'Triage',
        description: 'Support agent categorizes and prioritizes',
        owner: 'Tier 1 Support',
        confidenceLevel: 'high',
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'rachel-green', employeeName: 'Rachel Green', quote: 'Triage is supposed to be quick but half the tickets dont have enough info. We end up going back and forth.', interviewDate: '2024-01-16', topic: 'triage', sentiment: 'frustrated', depth: 'detailed' }
        ]
      },
      {
        stepNumber: 3,
        title: 'Initial Response',
        description: 'First response to customer',
        owner: 'Tier 1 Support',
        confidenceLevel: 'high',
        supportingQuotes: []
      },
      {
        stepNumber: 4,
        title: 'Escalation',
        description: 'Complex issues escalated to specialized teams',
        owner: 'Tier 2 Support',
        confidenceLevel: 'medium',
        supportingQuotes: []
      },
      {
        stepNumber: 5,
        title: 'Resolution',
        description: 'Issue resolved and survey sent',
        owner: 'Support Agent',
        confidenceLevel: 'high',
        supportingQuotes: []
      }
    ],
    painPoints: [
      {
        id: 'pp1',
        type: 'pain-point',
        summary: '50% of support tickets lack required info (version, browser, steps); avg 2 back-and-forth messages needed',
        confidenceLevel: 'high',
        mentionCount: 8,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'rachel-green', employeeName: 'Rachel Green', quote: 'Half the tickets dont have enough info. We end up going back and forth.', interviewDate: '2024-01-16', topic: 'ticket quality', sentiment: 'frustrated', depth: 'detailed' }
        ]
      },
      {
        id: 'pp2',
        type: 'pain-point',
        summary: 'Same issues researched repeatedly; no way to find previous solutions—agents re-solve known issues',
        confidenceLevel: 'high',
        mentionCount: 5,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'rachel-green', employeeName: 'Rachel Green', quote: 'I solved the same issue last week but theres no good way to find my old solution. So I research it again.', interviewDate: '2024-01-16', topic: 'knowledge base', sentiment: 'frustrated', depth: 'deep-dive' }
        ]
      }
    ],
    improvementSuggestions: [
      {
        id: 'is1',
        type: 'improvement-suggestion',
        summary: 'Required fields (version, browser, steps) could save ~10 min per ticket and eliminate 50% of back-and-forth',
        confidenceLevel: 'high',
        mentionCount: 6,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'rachel-green', employeeName: 'Rachel Green', quote: 'Make customers fill out version number, browser, and steps to reproduce before submitting. Saves us 10 minutes per ticket.', interviewDate: '2024-01-16', topic: 'ticket forms', sentiment: 'positive', depth: 'detailed' }
        ]
      }
    ],
    workarounds: [
      {
        id: 'w1',
        type: 'workaround',
        summary: '6 agents maintain personal Google Docs of solutions because KB search is slower than personal notes',
        confidenceLevel: 'high',
        mentionCount: 6,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'rachel-green', employeeName: 'Rachel Green', quote: 'I keep a Google Doc of common issues and solutions. Faster than searching the KB.', interviewDate: '2024-01-16', topic: 'personal notes', sentiment: 'neutral', depth: 'detailed' }
        ]
      }
    ],
    officialTools: [
      { name: 'Zendesk', mentionCount: 14 },
      { name: 'Knowledge Base', mentionCount: 10 }
    ],
    shadowTools: [
      {
        name: 'Personal Google Docs',
        mentionCount: 6,
        reason: 'Knowledge base search is slow and incomplete',
        quotes: [
          { id: generateQuoteId(), employeeId: 'rachel-green', employeeName: 'Rachel Green', quote: 'I keep a Google Doc of common issues and solutions. Faster than searching the KB.', interviewDate: '2024-01-16', topic: 'personal notes', sentiment: 'neutral', depth: 'detailed' }
        ]
      }
    ],
    knowledgeGaps: [],
    contradictions: [],
    upstreamInputs: ['Support Tickets', 'Customer Data'],
    downstreamOutputs: ['Resolution Records', 'CSAT Scores']
  },
  {
    id: '10',
    name: 'Payroll Processing',
    department: 'HR',
    owner: 'Maria Garcia',
    lastUpdated: '2024-01-17',
    interviewCoverage: {
      totalEmployeesInProcess: 8,
      employeesInterviewed: 4,
      depthBreakdown: { deepDive: 1, detailed: 2, brief: 1, mention: 0, dismissive: 0 }
    },
    synthesizedDescription: {
      text: 'Monthly payroll calculation and distribution process. Limited interview coverage but consistent feedback on timesheet delays.',
      confidenceLevel: 'medium',
      basedOnInterviews: 4
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Timesheet Collection',
        description: 'Gather employee timesheets',
        owner: 'HR Admin',
        confidenceLevel: 'high',
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'maria-garcia', employeeName: 'Maria Garcia', quote: 'Chasing timesheets is my least favorite part of the job. Same people every month.', interviewDate: '2024-01-17', topic: 'timesheets', sentiment: 'frustrated', depth: 'detailed' }
        ]
      },
      {
        stepNumber: 2,
        title: 'Hours Verification',
        description: 'Verify hours and overtime',
        owner: 'HR Specialist',
        confidenceLevel: 'medium',
        supportingQuotes: []
      },
      {
        stepNumber: 3,
        title: 'Payroll Calculation',
        description: 'Calculate gross and net pay',
        owner: 'Payroll Specialist',
        confidenceLevel: 'medium',
        supportingQuotes: []
      },
      {
        stepNumber: 4,
        title: 'Payment Distribution',
        description: 'Process direct deposits',
        owner: 'Payroll Specialist',
        confidenceLevel: 'high',
        supportingQuotes: []
      }
    ],
    painPoints: [
      {
        id: 'pp1',
        type: 'pain-point',
        summary: 'Same repeat offenders require manual email reminders every month; delays payroll by 1-2 days',
        confidenceLevel: 'high',
        mentionCount: 4,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'maria-garcia', employeeName: 'Maria Garcia', quote: 'Chasing timesheets is my least favorite part of the job. Same people every month.', interviewDate: '2024-01-17', topic: 'timesheets', sentiment: 'frustrated', depth: 'detailed' }
        ]
      }
    ],
    improvementSuggestions: [
      {
        id: 'is1',
        type: 'improvement-suggestion',
        summary: 'Auto-reminders 3 days before deadline could eliminate manual chase emails and 1-2 day delays',
        confidenceLevel: 'medium',
        mentionCount: 2,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'maria-garcia', employeeName: 'Maria Garcia', quote: 'Even just auto-reminders 3 days before deadline would help. I shouldnt have to email people manually.', interviewDate: '2024-01-17', topic: 'reminders', sentiment: 'positive', depth: 'brief' }
        ]
      }
    ],
    workarounds: [],
    officialTools: [
      { name: 'ADP', mentionCount: 4 },
      { name: 'Time Tracking System', mentionCount: 4 }
    ],
    shadowTools: [],
    knowledgeGaps: [
      {
        topic: 'Overtime approval process',
        description: 'Limited understanding of how overtime is pre-approved',
        suggestedQuestions: ['Who approves overtime?', 'Is there a threshold before approval needed?']
      }
    ],
    contradictions: [],
    upstreamInputs: ['Timesheets', 'Benefits Data'],
    downstreamOutputs: ['Payslips', 'Tax Records']
  },
  {
    id: '11',
    name: 'Sales Pipeline Management',
    department: 'Sales',
    owner: 'John Blackwell',
    lastUpdated: '2024-01-18',
    interviewCoverage: {
      totalEmployeesInProcess: 15,
      employeesInterviewed: 3,
      depthBreakdown: { deepDive: 0, detailed: 1, brief: 1, mention: 0, dismissive: 1 }
    },
    synthesizedDescription: {
      text: 'Process for managing sales opportunities through pipeline stages. Limited interview coverage makes this assessment preliminary.',
      confidenceLevel: 'low',
      basedOnInterviews: 3
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Lead Qualification',
        description: 'Assess lead quality and fit',
        owner: 'SDR',
        confidenceLevel: 'low',
        supportingQuotes: []
      },
      {
        stepNumber: 2,
        title: 'Discovery Call',
        description: 'Initial needs assessment',
        owner: 'Account Executive',
        confidenceLevel: 'low',
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'john-blackwell', employeeName: 'John Blackwell', quote: 'Look, the CRM is fine. I just put my deals in and move on. Not much to say about it.', interviewDate: '2024-01-18', topic: 'crm usage', sentiment: 'neutral', depth: 'dismissive' }
        ]
      },
      {
        stepNumber: 3,
        title: 'Proposal',
        description: 'Create and send proposal',
        owner: 'Account Executive',
        confidenceLevel: 'low',
        supportingQuotes: []
      },
      {
        stepNumber: 4,
        title: 'Negotiation',
        description: 'Handle objections and negotiate',
        owner: 'Account Executive',
        confidenceLevel: 'low',
        supportingQuotes: []
      }
    ],
    painPoints: [],
    improvementSuggestions: [],
    workarounds: [],
    officialTools: [
      { name: 'Salesforce', mentionCount: 3 }
    ],
    shadowTools: [],
    knowledgeGaps: [
      {
        topic: 'Full pipeline process',
        description: 'Insufficient interview depth to understand complete workflow',
        suggestedQuestions: ['Walk me through a deal from start to finish', 'What tools do you use at each stage?', 'Where do deals typically get stuck?']
      }
    ],
    contradictions: [],
    upstreamInputs: ['Marketing Leads', 'Referrals'],
    downstreamOutputs: ['Closed Deals', 'Revenue']
  },
  {
    id: '12',
    name: 'Budget Approval',
    department: 'Finance',
    owner: 'Patricia Williams',
    lastUpdated: '2024-01-19',
    interviewCoverage: {
      totalEmployeesInProcess: 10,
      employeesInterviewed: 7,
      depthBreakdown: { deepDive: 2, detailed: 3, brief: 2, mention: 0, dismissive: 0 }
    },
    synthesizedDescription: {
      text: 'Annual and ad-hoc budget request and approval process. Clear pain points around visibility and timeline predictability.',
      confidenceLevel: 'high',
      basedOnInterviews: 7
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Budget Request Submission',
        description: 'Department submits budget request',
        owner: 'Department Head',
        confidenceLevel: 'high',
        supportingQuotes: []
      },
      {
        stepNumber: 2,
        title: 'Finance Review',
        description: 'Finance analyzes request against priorities',
        owner: 'Finance Analyst',
        confidenceLevel: 'high',
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'patricia-williams', employeeName: 'Patricia Williams', quote: 'We get requests with no justification. Just a number and a hope. Then we have to go back asking why.', interviewDate: '2024-01-19', topic: 'request quality', sentiment: 'frustrated', depth: 'deep-dive' }
        ]
      },
      {
        stepNumber: 3,
        title: 'Leadership Approval',
        description: 'Executive review and approval',
        owner: 'CFO',
        confidenceLevel: 'high',
        supportingQuotes: []
      },
      {
        stepNumber: 4,
        title: 'Budget Allocation',
        description: 'Funds allocated to department',
        owner: 'Finance',
        confidenceLevel: 'high',
        supportingQuotes: []
      }
    ],
    painPoints: [
      {
        id: 'pp1',
        type: 'pain-point',
        summary: 'Budget requests arrive with "just a number and hope"; Finance must chase 70%+ for ROI justification',
        confidenceLevel: 'high',
        mentionCount: 4,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'patricia-williams', employeeName: 'Patricia Williams', quote: 'We get requests with no justification. Just a number and a hope.', interviewDate: '2024-01-19', topic: 'request quality', sentiment: 'frustrated', depth: 'deep-dive' }
        ]
      },
      {
        id: 'pp2',
        type: 'pain-point',
        summary: 'Finance must query 3 people to find request status; departments ask daily "where is my request?"',
        confidenceLevel: 'high',
        mentionCount: 5,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'patricia-williams', employeeName: 'Patricia Williams', quote: 'Departments keep asking me where their request is. I have to go ask three people to find out.', interviewDate: '2024-01-19', topic: 'visibility', sentiment: 'frustrated', depth: 'detailed' }
        ]
      }
    ],
    improvementSuggestions: [
      {
        id: 'is1',
        type: 'improvement-suggestion',
        summary: 'Template with ROI, timeline, alternatives fields could save hours of back-and-forth per request',
        confidenceLevel: 'high',
        mentionCount: 3,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'patricia-williams', employeeName: 'Patricia Williams', quote: 'A simple template with ROI justification, timeline, and alternatives would save hours of back-and-forth.', interviewDate: '2024-01-19', topic: 'templates', sentiment: 'positive', depth: 'detailed' }
        ]
      }
    ],
    workarounds: [],
    officialTools: [
      { name: 'Budget System', mentionCount: 7 },
      { name: 'Excel', mentionCount: 5 }
    ],
    shadowTools: [],
    knowledgeGaps: [],
    contradictions: [],
    upstreamInputs: ['Budget Requests', 'Financial Forecasts'],
    downstreamOutputs: ['Approved Budgets', 'Spending Authority']
  },
  {
    id: '13',
    name: 'Recruitment and Hiring',
    department: 'HR',
    owner: 'Nancy Cooper',
    lastUpdated: '2024-01-20',
    interviewCoverage: {
      totalEmployeesInProcess: 12,
      employeesInterviewed: 9,
      depthBreakdown: { deepDive: 2, detailed: 4, brief: 2, mention: 1, dismissive: 0 }
    },
    synthesizedDescription: {
      text: 'End-to-end hiring process from requisition to onboarding handoff. Interview scheduling consistently identified as a major time sink.',
      confidenceLevel: 'high',
      basedOnInterviews: 9
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Job Requisition',
        description: 'Hiring manager submits job request',
        owner: 'Hiring Manager',
        confidenceLevel: 'high',
        supportingQuotes: []
      },
      {
        stepNumber: 2,
        title: 'Job Posting',
        description: 'Post to job boards and career site',
        owner: 'Recruiter',
        confidenceLevel: 'high',
        supportingQuotes: []
      },
      {
        stepNumber: 3,
        title: 'Resume Screening',
        description: 'Review applications and shortlist',
        owner: 'Recruiter',
        confidenceLevel: 'high',
        supportingQuotes: []
      },
      {
        stepNumber: 4,
        title: 'Interview Scheduling',
        description: 'Coordinate interviews across stakeholders',
        owner: 'Recruiting Coordinator',
        confidenceLevel: 'high',
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'nancy-cooper', employeeName: 'Nancy Cooper', quote: 'Scheduling interviews with 5 different interviewers is like solving a Rubiks cube. Everyones calendar is packed.', interviewDate: '2024-01-20', topic: 'scheduling', sentiment: 'frustrated', depth: 'deep-dive' }
        ]
      },
      {
        stepNumber: 5,
        title: 'Offer and Close',
        description: 'Extend offer and negotiate',
        owner: 'Recruiter',
        confidenceLevel: 'high',
        supportingQuotes: []
      }
    ],
    painPoints: [
      {
        id: 'pp1',
        type: 'pain-point',
        summary: 'Coordinating 5 interviewer calendars like "solving Rubik\'s cube"; packed schedules cause multi-day delays',
        confidenceLevel: 'high',
        mentionCount: 7,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'nancy-cooper', employeeName: 'Nancy Cooper', quote: 'Scheduling interviews with 5 different interviewers is like solving a Rubiks cube.', interviewDate: '2024-01-20', topic: 'scheduling', sentiment: 'frustrated', depth: 'deep-dive' }
        ]
      }
    ],
    improvementSuggestions: [
      {
        id: 'is1',
        type: 'improvement-suggestion',
        summary: 'Calendly-style self-scheduling for candidates could reduce coordinator time by 80% per hire',
        confidenceLevel: 'high',
        mentionCount: 5,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'nancy-cooper', employeeName: 'Nancy Cooper', quote: 'Tools like Calendly for recruiting would change everything. Let candidates self-schedule.', interviewDate: '2024-01-20', topic: 'automation', sentiment: 'positive', depth: 'detailed' }
        ]
      }
    ],
    workarounds: [],
    officialTools: [
      { name: 'Greenhouse', mentionCount: 9 },
      { name: 'LinkedIn Recruiter', mentionCount: 6 }
    ],
    shadowTools: [],
    knowledgeGaps: [],
    contradictions: [],
    upstreamInputs: ['Job Requisitions', 'Candidate Applications'],
    downstreamOutputs: ['Hired Employees', 'Onboarding Handoff']
  },
  {
    id: '14',
    name: 'Contract Review',
    department: 'Legal',
    owner: 'Robert Taylor',
    lastUpdated: '2024-01-21',
    interviewCoverage: {
      totalEmployeesInProcess: 6,
      employeesInterviewed: 5,
      depthBreakdown: { deepDive: 2, detailed: 2, brief: 1, mention: 0, dismissive: 0 }
    },
    synthesizedDescription: {
      text: 'Legal review process for contracts. Volume overwhelms capacity, leading to delays across the organization.',
      confidenceLevel: 'high',
      basedOnInterviews: 5
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Contract Submission',
        description: 'Business team submits contract for review',
        owner: 'Requesting Team',
        confidenceLevel: 'high',
        supportingQuotes: []
      },
      {
        stepNumber: 2,
        title: 'Initial Review',
        description: 'Paralegal reviews for standard issues',
        owner: 'Paralegal',
        confidenceLevel: 'high',
        supportingQuotes: []
      },
      {
        stepNumber: 3,
        title: 'Attorney Review',
        description: 'Attorney reviews complex terms',
        owner: 'Attorney',
        confidenceLevel: 'high',
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'robert-taylor', employeeName: 'Robert Taylor', quote: 'I have 40 contracts in my queue right now. Everyone thinks theirs is urgent.', interviewDate: '2024-01-21', topic: 'volume', sentiment: 'frustrated', depth: 'deep-dive' }
        ]
      },
      {
        stepNumber: 4,
        title: 'Revision Negotiation',
        description: 'Negotiate changes with counterparty',
        owner: 'Attorney',
        confidenceLevel: 'medium',
        supportingQuotes: []
      }
    ],
    painPoints: [
      {
        id: 'pp1',
        type: 'pain-point',
        summary: '40 contracts currently in queue; every requestor believes theirs is urgent—capacity overwhelmed',
        confidenceLevel: 'high',
        mentionCount: 5,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'robert-taylor', employeeName: 'Robert Taylor', quote: 'I have 40 contracts in my queue right now. Everyone thinks theirs is urgent.', interviewDate: '2024-01-21', topic: 'volume', sentiment: 'frustrated', depth: 'deep-dive' }
        ]
      }
    ],
    improvementSuggestions: [
      {
        id: 'is1',
        type: 'improvement-suggestion',
        summary: 'Tiered review: low-value/low-risk contracts fast-tracked with templates; detailed review for big deals only',
        confidenceLevel: 'high',
        mentionCount: 3,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'robert-taylor', employeeName: 'Robert Taylor', quote: 'Low-value, low-risk contracts should get fast-tracked with template approvals. Save detailed review for big deals.', interviewDate: '2024-01-21', topic: 'tiering', sentiment: 'positive', depth: 'detailed' }
        ]
      }
    ],
    workarounds: [],
    officialTools: [
      { name: 'Contract Management System', mentionCount: 5 }
    ],
    shadowTools: [],
    knowledgeGaps: [],
    contradictions: [],
    upstreamInputs: ['Draft Contracts', 'Business Requirements'],
    downstreamOutputs: ['Approved Contracts', 'Risk Assessments']
  },
  {
    id: '15',
    name: 'Product Launch',
    department: 'Product',
    owner: 'Steven Adams',
    lastUpdated: '2024-01-22',
    interviewCoverage: {
      totalEmployeesInProcess: 25,
      employeesInterviewed: 12,
      depthBreakdown: { deepDive: 3, detailed: 4, brief: 3, mention: 2, dismissive: 0 }
    },
    synthesizedDescription: {
      text: 'Cross-functional process for launching new products or features. Complex coordination required across many teams.',
      confidenceLevel: 'high',
      basedOnInterviews: 12
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Launch Planning',
        description: 'Define launch timeline and requirements',
        owner: 'Product Manager',
        confidenceLevel: 'high',
        supportingQuotes: []
      },
      {
        stepNumber: 2,
        title: 'Cross-Team Coordination',
        description: 'Align marketing, sales, support, and engineering',
        owner: 'Launch Lead',
        confidenceLevel: 'high',
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'steven-adams', employeeName: 'Steven Adams', quote: 'Getting 8 teams aligned on a launch date is herding cats. Someone always has a conflict.', interviewDate: '2024-01-22', topic: 'coordination', sentiment: 'frustrated', depth: 'deep-dive' }
        ]
      },
      {
        stepNumber: 3,
        title: 'Content Preparation',
        description: 'Create marketing and support materials',
        owner: 'Marketing',
        confidenceLevel: 'high',
        supportingQuotes: []
      },
      {
        stepNumber: 4,
        title: 'Go-Live',
        description: 'Execute launch activities',
        owner: 'Launch Lead',
        confidenceLevel: 'high',
        supportingQuotes: []
      }
    ],
    painPoints: [
      {
        id: 'pp1',
        type: 'pain-point',
        summary: 'Aligning 8 teams on launch date is "herding cats"; someone always has a conflict causing delays',
        confidenceLevel: 'high',
        mentionCount: 8,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'steven-adams', employeeName: 'Steven Adams', quote: 'Getting 8 teams aligned on a launch date is herding cats. Someone always has a conflict.', interviewDate: '2024-01-22', topic: 'coordination', sentiment: 'frustrated', depth: 'deep-dive' }
        ]
      }
    ],
    improvementSuggestions: [
      {
        id: 'is1',
        type: 'improvement-suggestion',
        summary: 'Standardized launch checklist with owners',
        confidenceLevel: 'high',
        mentionCount: 4,
        supportingQuotes: [
          { id: generateQuoteId(), employeeId: 'steven-adams', employeeName: 'Steven Adams', quote: 'A launch playbook with clear owners for each task. No more assuming someone else will handle it.', interviewDate: '2024-01-22', topic: 'playbook', sentiment: 'positive', depth: 'detailed' }
        ]
      }
    ],
    workarounds: [],
    officialTools: [
      { name: 'Asana', mentionCount: 10 },
      { name: 'Slack', mentionCount: 12 }
    ],
    shadowTools: [],
    knowledgeGaps: [],
    contradictions: [],
    upstreamInputs: ['Product Requirements', 'Launch Timeline'],
    downstreamOutputs: ['Live Product', 'Launch Metrics']
  }
];

export default processData;
