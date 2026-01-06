import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Process } from '@/data/processData';

interface ProcessTableProps {
  processes: Process[];
  onProcessClick: (process: Process) => void;
}

const ProcessTable = ({ processes, onProcessClick }: ProcessTableProps) => {
  return (
    <TooltipProvider>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold">Process Name</TableHead>
              <TableHead className="font-semibold">Department</TableHead>
              <TableHead className="font-semibold">Coverage</TableHead>
              <TableHead className="font-semibold">Tools</TableHead>
              <TableHead className="font-semibold">Key Insight</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processes.map((process, index) => {
              const coverage = process.interviewCoverage;
              const coveragePercent = Math.round((coverage.employeesInterviewed / coverage.totalEmployeesInProcess) * 100);
              const allTools = [...process.officialTools.map(t => t.name)];
              const primaryPainPoint = process.painPoints[0]?.summary || 'No pain points identified';
              
              // Extract unique employees from all quotes
              const employeesInvolved = new Set<string>();
              process.steps.forEach(step => step.supportingQuotes.forEach(q => employeesInvolved.add(q.employeeName)));
              process.painPoints.forEach(pp => pp.supportingQuotes.forEach(q => employeesInvolved.add(q.employeeName)));
              process.improvementSuggestions.forEach(is => is.supportingQuotes.forEach(q => employeesInvolved.add(q.employeeName)));
              process.workarounds.forEach(w => w.supportingQuotes.forEach(q => employeesInvolved.add(q.employeeName)));
              const employeeList = Array.from(employeesInvolved);
              
              return (
                <TableRow
                  key={process.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onProcessClick(process)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-5">{index + 1}</span>
                      <p className="font-medium text-foreground">{process.name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-muted/50">
                      {process.department}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 cursor-default">
                          <span className="text-muted-foreground">
                            {coverage.employeesInterviewed}/{coverage.totalEmployeesInProcess}
                          </span>
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${coveragePercent}%` }}
                            />
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="space-y-2">
                          <p className="font-medium text-xs">{coveragePercent}% Interview Coverage</p>
                          <div className="text-xs text-muted-foreground">
                            <p>Deep Dive: {coverage.depthBreakdown.deepDive}</p>
                            <p>Detailed: {coverage.depthBreakdown.detailed}</p>
                            <p>Brief: {coverage.depthBreakdown.brief}</p>
                            {coverage.depthBreakdown.dismissive > 0 && (
                              <p>Dismissive: {coverage.depthBreakdown.dismissive}</p>
                            )}
                          </div>
                          {employeeList.length > 0 && (
                            <>
                              <div className="border-t border-border pt-2">
                                <p className="font-medium text-xs mb-1">Employees Involved:</p>
                                <div className="flex flex-wrap gap-1">
                                  {employeeList.map((name, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-muted-foreground cursor-default underline decoration-dotted underline-offset-2">
                          {allTools.length}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="space-y-2">
                          <p className="font-medium text-xs">Official Tools:</p>
                          <div className="flex flex-wrap gap-1">
                            {process.officialTools.map((tool, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {tool.name}
                              </Badge>
                            ))}
                          </div>
                          {process.shadowTools.length > 0 && (
                            <>
                              <p className="font-medium text-xs text-orange-500">Shadow Tools:</p>
                              <div className="flex flex-wrap gap-1">
                                {process.shadowTools.map((tool, i) => (
                                  <Badge key={i} variant="destructive" className="text-xs">
                                    {tool.name}
                                  </Badge>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-muted-foreground text-sm line-clamp-1 max-w-[200px] cursor-default">
                          {primaryPainPoint}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-sm">
                        <p className="text-sm">{primaryPainPoint}</p>
                        {process.painPoints.length > 1 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            +{process.painPoints.length - 1} more pain point{process.painPoints.length > 2 ? 's' : ''}
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
};

export default ProcessTable;
