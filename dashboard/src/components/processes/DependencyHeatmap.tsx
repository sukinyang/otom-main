
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Process {
  id: string;
  name: string;
  department: string;
  owner: string;
  type: 'Core' | 'Support' | 'Admin' | 'Shadow';
  bottleneckSeverity: 'None' | 'Low' | 'Medium' | 'High';
  hasShadowProcesses: boolean;
  overheadPercentage: number;
  lastUpdated: string;
  employeesInvolved: number;
  upstreamInputs: string[];
  downstreamOutputs: string[];
  toolsUsed: string[];
  shadowTools: string[];
  bottleneckNotes: string;
  optimizationSuggestions: string[];
  linkedKPIs: string[];
}

interface DependencyHeatmapProps {
  processes: Process[];
}

interface DependencyData {
  fromDepartment: string;
  toDepartment: string;
  dependencies: number;
  bottleneckSeverity: string;
}

const DependencyHeatmap = ({ processes }: DependencyHeatmapProps) => {
  // Mock dependency data - in real app this would be calculated from process relationships
  const dependencyData: DependencyData[] = [
    { fromDepartment: 'Sales', toDepartment: 'Finance', dependencies: 8, bottleneckSeverity: 'High' },
    { fromDepartment: 'Finance', toDepartment: 'HR', dependencies: 3, bottleneckSeverity: 'Low' },
    { fromDepartment: 'HR', toDepartment: 'IT', dependencies: 5, bottleneckSeverity: 'Medium' },
    { fromDepartment: 'IT', toDepartment: 'Operations', dependencies: 12, bottleneckSeverity: 'High' },
    { fromDepartment: 'Operations', toDepartment: 'Sales', dependencies: 6, bottleneckSeverity: 'Medium' },
    { fromDepartment: 'Marketing', toDepartment: 'Sales', dependencies: 4, bottleneckSeverity: 'Low' },
  ];

  const getIntensityColor = (dependencies: number) => {
    if (dependencies >= 10) return 'bg-red-200';
    if (dependencies >= 6) return 'bg-orange-200';
    if (dependencies >= 3) return 'bg-yellow-200';
    return 'bg-green-200';
  };

  const getBottleneckColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'bg-red-100 text-red-700 border-red-300';
      case 'Medium': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'Low': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default: return 'bg-green-100 text-green-700 border-green-300';
    }
  };

  const departments = Array.from(new Set([
    ...dependencyData.map(d => d.fromDepartment),
    ...dependencyData.map(d => d.toDepartment)
  ]));

  return (
    <div className="space-y-6">
      {/* Heatmap Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Cross-Departmental Dependencies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Header row */}
              <div className="flex">
                <div className="w-32 h-12 flex items-center justify-center font-medium bg-gray-50 border">
                  From \ To
                </div>
                {departments.map(dept => (
                  <div key={dept} className="w-24 h-12 flex items-center justify-center font-medium bg-gray-50 border text-xs">
                    {dept}
                  </div>
                ))}
              </div>

              {/* Data rows */}
              {departments.map(fromDept => (
                <div key={fromDept} className="flex">
                  <div className="w-32 h-12 flex items-center justify-center font-medium bg-gray-50 border text-xs">
                    {fromDept}
                  </div>
                  {departments.map(toDept => {
                    const dependency = dependencyData.find(
                      d => d.fromDepartment === fromDept && d.toDepartment === toDept
                    );
                    return (
                      <div
                        key={toDept}
                        className={`w-24 h-12 flex items-center justify-center border text-xs font-medium ${
                          dependency ? getIntensityColor(dependency.dependencies) : 'bg-gray-50'
                        }`}
                      >
                        {dependency ? dependency.dependencies : '-'}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-4 text-xs">
            <span className="font-medium">Dependency Intensity:</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-green-200 border"></div>
              <span>1-2</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-yellow-200 border"></div>
              <span>3-5</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-orange-200 border"></div>
              <span>6-9</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-red-200 border"></div>
              <span>10+</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottleneck Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Cross-Functional Pain Points</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dependencyData
              .filter(d => d.bottleneckSeverity !== 'None')
              .sort((a, b) => {
                const severityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
                return severityOrder[b.bottleneckSeverity as keyof typeof severityOrder] - 
                       severityOrder[a.bottleneckSeverity as keyof typeof severityOrder];
              })
              .map((dependency, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-sm">
                      <span className="font-medium">{dependency.fromDepartment}</span>
                      <span className="text-gray-500 mx-2">→</span>
                      <span className="font-medium">{dependency.toDepartment}</span>
                    </div>
                    <Badge className={getBottleneckColor(dependency.bottleneckSeverity)}>
                      {dependency.bottleneckSeverity}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    {dependency.dependencies} dependencies
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DependencyHeatmap;
