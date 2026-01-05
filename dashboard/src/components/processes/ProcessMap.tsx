import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, RotateCcw, Filter, Eye, AlertTriangle, Users, Clock, TrendingUp, Building2, User, Network, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  processesInvolved: string[];
  crossDepartmentConnections: string[];
  bottleneckAreas: string[];
  shadowProcesses: string[];
}

interface Department {
  id: string;
  name: string;
  employees: string[];
  processes: string[];
  headCount: number;
}

interface Process {
  id: string;
  name: string;
  department: string;
  owner: string;
  type: 'Core' | 'Support' | 'Admin' | 'Shadow';
  bottleneckSeverity: 'None' | 'Low' | 'Medium' | 'High';
  employeesInvolved: string[];
  crossDepartmental: boolean;
}

interface Position {
  x: number;
  y: number;
}

interface Connection {
  from: string;
  to: string;
  type: 'reports-to' | 'works-with' | 'process-flow' | 'cross-dept' | 'shadow-process';
  strength: 'weak' | 'medium' | 'strong';
}

const ProcessMap = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'employees' | 'departments' | 'processes' | 'overview'>('overview');
  const [showConnections, setShowConnections] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Enhanced organizational data
  const employees: Employee[] = [
    { id: 'emp1', name: 'Sarah Johnson', position: 'Finance Manager', department: 'Finance', processesInvolved: ['proc1', 'proc9'], crossDepartmentConnections: ['Sales', 'Procurement'], bottleneckAreas: ['Invoice Processing'], shadowProcesses: ['Excel Tracking'] },
    { id: 'emp2', name: 'Mike Chen', position: 'Sales Director', department: 'Sales', processesInvolved: ['proc2', 'proc30'], crossDepartmentConnections: ['Marketing', 'Finance'], bottleneckAreas: [], shadowProcesses: [] },
    { id: 'emp3', name: 'Emma Davis', position: 'Financial Analyst', department: 'Finance', processesInvolved: ['proc3', 'proc16'], crossDepartmentConnections: ['HR'], bottleneckAreas: [], shadowProcesses: ['Personal Spreadsheets'] },
    { id: 'emp4', name: 'David Wilson', position: 'HR Manager', department: 'HR', processesInvolved: ['proc4', 'proc14'], crossDepartmentConnections: ['IT', 'Finance'], bottleneckAreas: ['Onboarding'], shadowProcesses: [] },
    { id: 'emp5', name: 'Lisa Rodriguez', position: 'Marketing Director', department: 'Marketing', processesInvolved: ['proc5', 'proc18'], crossDepartmentConnections: ['Sales', 'Product'], bottleneckAreas: ['Campaign Approval'], shadowProcesses: ['Email chains'] },
    { id: 'emp6', name: 'Tom Anderson', position: 'IT Operations Manager', department: 'IT', processesInvolved: ['proc6', 'proc24', 'proc27'], crossDepartmentConnections: ['All'], bottleneckAreas: [], shadowProcesses: [] },
    { id: 'emp7', name: 'Anna Thompson', position: 'Product Manager', department: 'Product', processesInvolved: ['proc7', 'proc15', 'proc25'], crossDepartmentConnections: ['Engineering', 'Marketing'], bottleneckAreas: [], shadowProcesses: [] },
    { id: 'emp8', name: 'James Miller', position: 'QA Lead', department: 'QA', processesInvolved: ['proc8'], crossDepartmentConnections: ['Engineering', 'Product'], bottleneckAreas: ['Testing'], shadowProcesses: ['Manual logs'] },
    { id: 'emp9', name: 'Rachel Green', position: 'Procurement Specialist', department: 'Procurement', processesInvolved: ['proc9'], crossDepartmentConnections: ['Finance', 'IT'], bottleneckAreas: ['Approval chain'], shadowProcesses: ['Excel trackers'] },
    { id: 'emp10', name: 'Kevin Brown', position: 'Operations Manager', department: 'Operations', processesInvolved: ['proc10', 'proc13'], crossDepartmentConnections: ['Sales', 'IT'], bottleneckAreas: [], shadowProcesses: [] },
  ];

  const departments: Department[] = [
    { id: 'dept1', name: 'Finance', employees: ['emp1', 'emp3'], processes: ['proc1', 'proc3', 'proc16', 'proc19', 'proc26'], headCount: 8 },
    { id: 'dept2', name: 'Sales', employees: ['emp2'], processes: ['proc2', 'proc30'], headCount: 12 },
    { id: 'dept3', name: 'HR', employees: ['emp4'], processes: ['proc4', 'proc14', 'proc29'], headCount: 6 },
    { id: 'dept4', name: 'Marketing', employees: ['emp5'], processes: ['proc5', 'proc18'], headCount: 15 },
    { id: 'dept5', name: 'IT', employees: ['emp6'], processes: ['proc6', 'proc20', 'proc24', 'proc27'], headCount: 10 },
    { id: 'dept6', name: 'Product', employees: ['emp7'], processes: ['proc7', 'proc15', 'proc25'], headCount: 20 },
    { id: 'dept7', name: 'QA', employees: ['emp8'], processes: ['proc8'], headCount: 7 },
    { id: 'dept8', name: 'Procurement', employees: ['emp9'], processes: ['proc9'], headCount: 4 },
    { id: 'dept9', name: 'Operations', employees: ['emp10'], processes: ['proc10', 'proc13'], headCount: 18 },
  ];

  const processes: Process[] = [
    { id: 'proc1', name: 'Invoice Processing', department: 'Finance', owner: 'emp1', type: 'Core', bottleneckSeverity: 'High', employeesInvolved: ['emp1', 'emp3'], crossDepartmental: true },
    { id: 'proc2', name: 'Lead Qualification', department: 'Sales', owner: 'emp2', type: 'Core', bottleneckSeverity: 'Medium', employeesInvolved: ['emp2'], crossDepartmental: false },
    { id: 'proc3', name: 'Financial Reporting', department: 'Finance', owner: 'emp3', type: 'Admin', bottleneckSeverity: 'Low', employeesInvolved: ['emp3'], crossDepartmental: false },
    { id: 'proc4', name: 'Employee Onboarding', department: 'HR', owner: 'emp4', type: 'Core', bottleneckSeverity: 'Medium', employeesInvolved: ['emp4'], crossDepartmental: true },
    { id: 'proc5', name: 'Campaign Management', department: 'Marketing', owner: 'emp5', type: 'Core', bottleneckSeverity: 'High', employeesInvolved: ['emp5'], crossDepartmental: true },
    { id: 'proc6', name: 'IT Asset Tracking', department: 'IT', owner: 'emp6', type: 'Support', bottleneckSeverity: 'Medium', employeesInvolved: ['emp6'], crossDepartmental: false },
    { id: 'proc7', name: 'Product Development', department: 'Product', owner: 'emp7', type: 'Core', bottleneckSeverity: 'Low', employeesInvolved: ['emp7'], crossDepartmental: true },
    { id: 'proc8', name: 'Quality Testing', department: 'QA', owner: 'emp8', type: 'Core', bottleneckSeverity: 'Medium', employeesInvolved: ['emp8'], crossDepartmental: true },
    { id: 'proc9', name: 'Procurement', department: 'Procurement', owner: 'emp9', type: 'Admin', bottleneckSeverity: 'High', employeesInvolved: ['emp9', 'emp1'], crossDepartmental: true },
    { id: 'proc10', name: 'Data Management', department: 'Operations', owner: 'emp10', type: 'Support', bottleneckSeverity: 'Medium', employeesInvolved: ['emp10'], crossDepartmental: false },
  ];

  // Generate positions for nodes based on view mode
  const generatePositions = (): Map<string, Position> => {
    const positions = new Map<string, Position>();
    const centerX = 400;
    const centerY = 300;

    if (viewMode === 'departments') {
      departments.forEach((dept, index) => {
        const angle = (index * 2 * Math.PI) / departments.length;
        const radius = 200;
        positions.set(dept.id, {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        });
      });
    } else if (viewMode === 'employees') {
      employees.forEach((emp, index) => {
        const deptIndex = departments.findIndex(d => d.employees.includes(emp.id));
        const deptAngle = (deptIndex * 2 * Math.PI) / departments.length;
        const empIndex = departments[deptIndex]?.employees.indexOf(emp.id) || 0;
        const empAngle = deptAngle + (empIndex - 0.5) * 0.3;
        const radius = 180 + (empIndex * 20);
        
        positions.set(emp.id, {
          x: centerX + radius * Math.cos(empAngle),
          y: centerY + radius * Math.sin(empAngle)
        });
      });
    } else if (viewMode === 'processes') {
      processes.forEach((proc, index) => {
        const deptIndex = departments.findIndex(d => d.name === proc.department);
        const deptAngle = (deptIndex * 2 * Math.PI) / departments.length;
        const procIndex = departments[deptIndex]?.processes.indexOf(proc.id) || 0;
        const procAngle = deptAngle + (procIndex - 1) * 0.4;
        const radius = 220 + (procIndex * 15);
        
        positions.set(proc.id, {
          x: centerX + radius * Math.cos(procAngle),
          y: centerY + radius * Math.sin(procAngle)
        });
      });
    } else { // overview mode
      // Place departments in outer circle
      departments.forEach((dept, index) => {
        const angle = (index * 2 * Math.PI) / departments.length;
        positions.set(dept.id, {
          x: centerX + 250 * Math.cos(angle),
          y: centerY + 250 * Math.sin(angle)
        });
      });
      
      // Place key employees around departments
      employees.slice(0, 6).forEach((emp, index) => {
        const angle = (index * 2 * Math.PI) / 6;
        positions.set(emp.id, {
          x: centerX + 150 * Math.cos(angle),
          y: centerY + 150 * Math.sin(angle)
        });
      });
      
      // Place critical processes in center
      processes.filter(p => p.bottleneckSeverity === 'High').forEach((proc, index) => {
        const angle = (index * 2 * Math.PI) / 3;
        positions.set(proc.id, {
          x: centerX + 80 * Math.cos(angle),
          y: centerY + 80 * Math.sin(angle)
        });
      });
    }

    return positions;
  };

  const positions = generatePositions();

  // Generate connections based on view mode
  const generateConnections = (): Connection[] => {
    const connections: Connection[] = [];

    if (viewMode === 'employees' || viewMode === 'overview') {
      // Employee to department connections
      employees.forEach(emp => {
        const dept = departments.find(d => d.employees.includes(emp.id));
        if (dept && positions.has(emp.id) && positions.has(dept.id)) {
          connections.push({
            from: emp.id,
            to: dept.id,
            type: 'reports-to',
            strength: 'strong'
          });
        }
      });

      // Cross-department employee connections
      employees.forEach(emp => {
        emp.crossDepartmentConnections.forEach(deptName => {
          const targetDept = departments.find(d => d.name === deptName);
          const targetEmployees = targetDept?.employees || [];
          targetEmployees.forEach(targetEmpId => {
            if (positions.has(emp.id) && positions.has(targetEmpId)) {
              connections.push({
                from: emp.id,
                to: targetEmpId,
                type: 'cross-dept',
                strength: 'medium'
              });
            }
          });
        });
      });
    }

    if (viewMode === 'processes' || viewMode === 'overview') {
      // Process to employee connections
      processes.forEach(proc => {
        proc.employeesInvolved.forEach(empId => {
          if (positions.has(proc.id) && positions.has(empId)) {
            connections.push({
              from: proc.id,
              to: empId,
              type: 'works-with',
              strength: 'strong'
            });
          }
        });
      });

      // Cross-departmental process flows
      processes.filter(p => p.crossDepartmental).forEach(proc => {
        const relatedProcesses = processes.filter(p => 
          p.id !== proc.id && 
          (p.crossDepartmental || p.department === proc.department)
        );
        
        relatedProcesses.slice(0, 2).forEach(relatedProc => {
          if (positions.has(proc.id) && positions.has(relatedProc.id)) {
            connections.push({
              from: proc.id,
              to: relatedProc.id,
              type: 'process-flow',
              strength: 'medium'
            });
          }
        });
      });
    }

    return connections;
  };

  const connections = generateConnections();

  const getNodeColor = (nodeId: string, nodeType: 'employee' | 'department' | 'process') => {
    if (nodeType === 'employee') {
      const emp = employees.find(e => e.id === nodeId);
      if (emp?.bottleneckAreas.length > 0) return '#ef4444';
      if (emp?.shadowProcesses.length > 0) return '#f59e0b';
      if (emp?.crossDepartmentConnections.length > 2) return '#8b5cf6';
      return '#3b82f6';
    } else if (nodeType === 'department') {
      const dept = departments.find(d => d.id === nodeId);
      if (dept?.headCount > 15) return '#8b5cf6';
      if (dept?.headCount > 10) return '#3b82f6';
      return '#06b6d4';
    } else {
      const proc = processes.find(p => p.id === nodeId);
      switch (proc?.bottleneckSeverity) {
        case 'High': return '#ef4444';
        case 'Medium': return '#f97316';
        case 'Low': return '#f59e0b';
        default: return '#10b981';
      }
    }
  };

  const getNodeSize = (nodeId: string, nodeType: 'employee' | 'department' | 'process') => {
    if (nodeType === 'department') {
      const dept = departments.find(d => d.id === nodeId);
      return 20 + (dept?.headCount || 0);
    } else if (nodeType === 'process') {
      const proc = processes.find(p => p.id === nodeId);
      return proc?.crossDepartmental ? 35 : 25;
    }
    return 25;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
  };

  const renderNodes = () => {
    const nodes = [];
    
    // Render departments
    if (viewMode === 'departments' || viewMode === 'overview') {
      departments.forEach(dept => {
        const position = positions.get(dept.id);
        if (!position) return;
        
        const size = getNodeSize(dept.id, 'department');
        const color = getNodeColor(dept.id, 'department');
        const isSelected = selectedNode === dept.id;
        const isHovered = hoveredNode === dept.id;

        nodes.push(
          <g key={dept.id}>
            {isSelected && (
              <circle
                cx={position.x}
                cy={position.y}
                r={size + 8}
                fill="none"
                stroke="#1f2937"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            )}
            <circle
              cx={position.x}
              cy={position.y}
              r={size}
              fill={color}
              stroke={isHovered ? '#374151' : 'white'}
              strokeWidth={2}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredNode(dept.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedNode(selectedNode === dept.id ? null : dept.id);
              }}
            />
            <text
              x={position.x}
              y={position.y}
              textAnchor="middle"
              dy="0.35em"
              fontSize="10"
              fontWeight="600"
              fill="white"
              className="pointer-events-none"
            >
              {dept.headCount}
            </text>
            <text
              x={position.x}
              y={position.y + size + 15}
              textAnchor="middle"
              fontSize="9"
              fontWeight="500"
              fill="#374151"
              className="pointer-events-none"
            >
              {dept.name}
            </text>
          </g>
        );
      });
    }

    // Render employees
    if (viewMode === 'employees' || viewMode === 'overview') {
      const employeesToRender = viewMode === 'overview' ? employees.slice(0, 6) : employees;
      employeesToRender.forEach(emp => {
        const position = positions.get(emp.id);
        if (!position) return;
        
        const size = getNodeSize(emp.id, 'employee');
        const color = getNodeColor(emp.id, 'employee');
        const isSelected = selectedNode === emp.id;
        const isHovered = hoveredNode === emp.id;

        nodes.push(
          <g key={emp.id}>
            {isSelected && (
              <circle
                cx={position.x}
                cy={position.y}
                r={size + 6}
                fill="none"
                stroke="#1f2937"
                strokeWidth="2"
                strokeDasharray="3,3"
              />
            )}
            <circle
              cx={position.x}
              cy={position.y}
              r={size}
              fill={color}
              stroke={isHovered ? '#374151' : 'white'}
              strokeWidth={1}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredNode(emp.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedNode(selectedNode === emp.id ? null : emp.id);
              }}
            />
            <text
              x={position.x}
              y={position.y}
              textAnchor="middle"
              dy="0.35em"
              fontSize="8"
              fontWeight="600"
              fill="white"
              className="pointer-events-none"
            >
              {emp.name.split(' ').map(n => n[0]).join('')}
            </text>
            <text
              x={position.x}
              y={position.y + size + 12}
              textAnchor="middle"
              fontSize="8"
              fontWeight="400"
              fill="#374151"
              className="pointer-events-none"
            >
              {emp.name.split(' ')[0]}
            </text>
            
            {/* Status indicators */}
            {emp.bottleneckAreas.length > 0 && (
              <circle
                cx={position.x + size - 3}
                cy={position.y - size + 3}
                r="3"
                fill="#ef4444"
                stroke="white"
                strokeWidth="1"
              />
            )}
            {emp.shadowProcesses.length > 0 && (
              <circle
                cx={position.x - size + 3}
                cy={position.y - size + 3}
                r="3"
                fill="#f59e0b"
                stroke="white"
                strokeWidth="1"
              />
            )}
          </g>
        );
      });
    }

    // Render processes
    if (viewMode === 'processes' || viewMode === 'overview') {
      const processesToRender = viewMode === 'overview' 
        ? processes.filter(p => p.bottleneckSeverity === 'High')
        : processes;
        
      processesToRender.forEach(proc => {
        const position = positions.get(proc.id);
        if (!position) return;
        
        const size = getNodeSize(proc.id, 'process');
        const color = getNodeColor(proc.id, 'process');
        const isSelected = selectedNode === proc.id;
        const isHovered = hoveredNode === proc.id;

        nodes.push(
          <g key={proc.id}>
            {isSelected && (
              <rect
                x={position.x - size - 4}
                y={position.y - size - 4}
                width={(size + 4) * 2}
                height={(size + 4) * 2}
                fill="none"
                stroke="#1f2937"
                strokeWidth="2"
                strokeDasharray="4,4"
                rx="4"
              />
            )}
            <rect
              x={position.x - size}
              y={position.y - size}
              width={size * 2}
              height={size * 2}
              fill={color}
              stroke={isHovered ? '#374151' : 'white'}
              strokeWidth={1}
              rx="4"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredNode(proc.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedNode(selectedNode === proc.id ? null : proc.id);
              }}
            />
            <text
              x={position.x}
              y={position.y}
              textAnchor="middle"
              dy="0.35em"
              fontSize="8"
              fontWeight="600"
              fill="white"
              className="pointer-events-none"
            >
              {proc.type[0]}
            </text>
            <text
              x={position.x}
              y={position.y + size + 12}
              textAnchor="middle"
              fontSize="8"
              fontWeight="400"
              fill="#374151"
              className="pointer-events-none"
            >
              {proc.name.length > 10 ? proc.name.substring(0, 10) + '...' : proc.name}
            </text>
            
            {/* Cross-departmental indicator */}
            {proc.crossDepartmental && (
              <circle
                cx={position.x + size - 3}
                cy={position.y - size + 3}
                r="3"
                fill="#8b5cf6"
                stroke="white"
                strokeWidth="1"
              />
            )}
          </g>
        );
      });
    }

    return nodes;
  };

  const getSelectedNodeData = () => {
    if (!selectedNode) return null;
    
    const emp = employees.find(e => e.id === selectedNode);
    if (emp) return { type: 'employee' as const, data: emp };
    
    const dept = departments.find(d => d.id === selectedNode);
    if (dept) return { type: 'department' as const, data: dept };
    
    const proc = processes.find(p => p.id === selectedNode);
    if (proc) return { type: 'process' as const, data: proc };
    
    return null;
  };

  const selectedNodeData = getSelectedNodeData();

  return (
    <Card className="h-[700px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-blue-600" />
            <CardTitle>Organizational Web</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              {['overview', 'employees', 'departments', 'processes'].map((mode) => (
                <Button
                  key={mode}
                  variant={viewMode === mode ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode(mode as any)}
                  className="h-8 px-2 capitalize"
                  title={`View ${mode}`}
                >
                  {mode === 'overview' && <Eye className="w-4 h-4" />}
                  {mode === 'employees' && <User className="w-4 h-4" />}
                  {mode === 'departments' && <Building2 className="w-4 h-4" />}
                  {mode === 'processes' && <Network className="w-4 h-4" />}
                </Button>
              ))}
            </div>

            {/* Controls */}
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-full relative">
        {/* Legend */}
        <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg border z-10 max-w-xs">
          <h4 className="text-sm font-medium mb-3">Network Legend</h4>
          
          {viewMode === 'employees' && (
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Has Bottlenecks</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span>Shadow Processes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>Cross-Dept Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Standard</span>
              </div>
            </div>
          )}

          {viewMode === 'departments' && (
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                <span>&gt;15 people</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>10-15 people</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                <span>&lt;10 people</span>
              </div>
            </div>
          )}

          {viewMode === 'processes' && (
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                <span>High Bottleneck</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
                <span>Medium Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded-sm"></div>
                <span>Low Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                <span>No Issues</span>
              </div>
            </div>
          )}

          <div className="mt-3 pt-2 border-t">
            <p className="text-xs font-medium text-gray-600 mb-1">Connections</p>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-blue-600"></div>
                <span>Reports to</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-purple-500"></div>
                <span>Cross-dept</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-green-500"></div>
                <span>Process flow</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Node Information Panel */}
        {selectedNodeData && (
          <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-xl border max-w-sm z-20">
            <div className="flex items-start justify-between mb-3">
              <div className="font-semibold text-gray-900">
                {selectedNodeData.type === 'employee' && selectedNodeData.data.name}
                {selectedNodeData.type === 'department' && selectedNodeData.data.name}
                {selectedNodeData.type === 'process' && selectedNodeData.data.name}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedNode(null)}
                className="h-6 w-6 p-0 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {selectedNodeData.type === 'employee' && (
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  {selectedNodeData.data.position} • {selectedNodeData.data.department}
                </div>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Processes:</span> {selectedNodeData.data.processesInvolved.length}
                  </div>
                  <div>
                    <span className="font-medium">Cross-dept connections:</span> {selectedNodeData.data.crossDepartmentConnections.join(', ')}
                  </div>
                  {selectedNodeData.data.bottleneckAreas.length > 0 && (
                    <div className="text-red-600 text-xs bg-red-50 p-2 rounded">
                      🚨 Bottlenecks: {selectedNodeData.data.bottleneckAreas.join(', ')}
                    </div>
                  )}
                  {selectedNodeData.data.shadowProcesses.length > 0 && (
                    <div className="text-amber-600 text-xs bg-amber-50 p-2 rounded">
                      ⚠️ Shadow processes: {selectedNodeData.data.shadowProcesses.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedNodeData.type === 'department' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span>{selectedNodeData.data.headCount} people</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-green-500" />
                    <span>{selectedNodeData.data.processes.length} processes</span>
                  </div>
                </div>
              </div>
            )}

            {selectedNodeData.type === 'process' && (
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  {selectedNodeData.data.department} • Owner: {selectedNodeData.data.owner}
                </div>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Type:</span> {selectedNodeData.data.type}
                  </div>
                  <div>
                    <span className="font-medium">Risk Level:</span> {selectedNodeData.data.bottleneckSeverity}
                  </div>
                  <div>
                    <span className="font-medium">People Involved:</span> {selectedNodeData.data.employeesInvolved.length}
                  </div>
                  {selectedNodeData.data.crossDepartmental && (
                    <div className="text-purple-600 text-xs bg-purple-50 p-2 rounded">
                      🔄 Cross-departmental process
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Overview stats */}
        <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-sm border">
          <div className="text-sm font-medium text-gray-900 mb-2">Network Stats</div>
          <div className="space-y-1 text-xs text-gray-600">
            <div>Employees: {employees.length}</div>
            <div>Departments: {departments.length}</div>
            <div>Processes: {processes.length}</div>
            <div>High Risk: {processes.filter(p => p.bottleneckSeverity === 'High').length}</div>
          </div>
        </div>

        {/* Main SVG Canvas */}
        <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden relative">
          <svg
            ref={svgRef}
            className="w-full h-full cursor-move"
            viewBox={`${-pan.x} ${-pan.y} ${800 / zoom} ${600 / zoom}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={() => setSelectedNode(null)}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
                fill="#94a3b8"
              >
                <polygon points="0 0, 10 3.5, 0 7" />
              </marker>
              
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>

              <filter id="shadow">
                <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3"/>
              </filter>
            </defs>

            {/* Connection lines */}
            {showConnections && connections.map((connection, index) => {
              const fromPos = positions.get(connection.from);
              const toPos = positions.get(connection.to);
              
              if (!fromPos || !toPos) return null;

              const getConnectionColor = () => {
                switch (connection.type) {
                  case 'reports-to': return '#3b82f6';
                  case 'cross-dept': return '#8b5cf6';
                  case 'process-flow': return '#10b981';
                  case 'works-with': return '#f59e0b';
                  case 'shadow-process': return '#ef4444';
                  default: return '#94a3b8';
                }
              };

              const strokeWidth = connection.strength === 'strong' ? 3 : connection.strength === 'medium' ? 2 : 1;
              const opacity = connection.strength === 'strong' ? 0.8 : connection.strength === 'medium' ? 0.6 : 0.4;

              return (
                <line
                  key={index}
                  x1={fromPos.x}
                  y1={fromPos.y}
                  x2={toPos.x}
                  y2={toPos.y}
                  stroke={getConnectionColor()}
                  strokeWidth={strokeWidth}
                  markerEnd="url(#arrowhead)"
                  opacity={opacity}
                  strokeDasharray={connection.type === 'shadow-process' ? '5,5' : 'none'}
                />
              );
            })}

            {/* Render all nodes */}
            {renderNodes()}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessMap;
