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
import { Process } from '@/services/api';

interface ProcessTableProps {
  processes: Process[];
  onProcessClick: (process: Process) => void;
}

const getStatusBadgeVariant = (status: Process['status']) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'optimized':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'needs_improvement':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'draft':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    default:
      return '';
  }
};

const formatStatus = (status: Process['status']) => {
  switch (status) {
    case 'active':
      return 'Active';
    case 'optimized':
      return 'Optimized';
    case 'needs_improvement':
      return 'Needs Improvement';
    case 'draft':
      return 'Draft';
    default:
      return status;
  }
};

const ProcessTable = ({ processes, onProcessClick }: ProcessTableProps) => {
  return (
    <TooltipProvider>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold">Process Name</TableHead>
              <TableHead className="font-semibold">Department</TableHead>
              <TableHead className="font-semibold">Steps</TableHead>
              <TableHead className="font-semibold">Employees</TableHead>
              <TableHead className="font-semibold">Tools</TableHead>
              <TableHead className="font-semibold">Automation</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processes.map((process, index) => (
              <TableRow
                key={process.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onProcessClick(process)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-5">{index + 1}</span>
                    <div>
                      <p className="font-medium text-foreground">{process.name}</p>
                      {process.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1 max-w-[250px]">
                          {process.description}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {process.department ? (
                    <Badge variant="outline" className="bg-muted/50">
                      {process.department}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground">{process.steps}</span>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground">{process.employees}</span>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground">{process.tools}</span>
                </TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 cursor-default">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${process.automation_level}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">{process.automation_level}%</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs">Automation Level: {process.automation_level}%</p>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={getStatusBadgeVariant(process.status)}>
                    {formatStatus(process.status)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
};

export default ProcessTable;
