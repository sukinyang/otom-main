import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  Clock,
  Building2,
  Users,
  Wrench,
  ListOrdered,
  Gauge,
  Activity,
} from 'lucide-react';
import { Process } from '@/services/api';

interface ProcessDetailProps {
  process: Process;
  onBack: () => void;
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

const ProcessDetail = ({ process, onBack }: ProcessDetailProps) => {
  const createdDate = new Date(process.created_at);
  const formattedCreated = createdDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const updatedDate = process.updated_at ? new Date(process.updated_at) : null;
  const formattedUpdated = updatedDate
    ? updatedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Processes
      </Button>

      {/* Process Name and Status */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">{process.name}</h1>
          {process.description && (
            <p className="text-muted-foreground text-lg">{process.description}</p>
          )}
        </div>
        <Badge variant="secondary" className={getStatusBadgeVariant(process.status)}>
          {formatStatus(process.status)}
        </Badge>
      </div>

      {/* Properties Section */}
      <div className="space-y-3 mb-8">
        {/* Department */}
        {process.department && (
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-muted-foreground w-44">
              <Building2 className="w-4 h-4" />
              <span className="text-sm">Department</span>
            </div>
            <Badge
              variant="secondary"
              className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
            >
              {process.department}
            </Badge>
          </div>
        )}

        {/* Created */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-muted-foreground w-44">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Created</span>
          </div>
          <span className="text-sm text-foreground">{formattedCreated}</span>
        </div>

        {/* Last Updated */}
        {formattedUpdated && (
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-muted-foreground w-44">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Last Updated</span>
            </div>
            <span className="text-sm text-foreground">{formattedUpdated}</span>
          </div>
        )}
      </div>

      <Separator className="my-8" />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ListOrdered className="w-4 h-4" />
              Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{process.steps}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{process.employees}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{process.tools}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              Automation Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <p className="text-3xl font-bold text-foreground">{process.automation_level}%</p>
              <div className="flex-1">
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${process.automation_level}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Process Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">Current Status:</span>
              <Badge variant="secondary" className={getStatusBadgeVariant(process.status)}>
                {formatStatus(process.status)}
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">Automation Progress:</span>
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${process.automation_level}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{process.automation_level}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProcessDetail;
