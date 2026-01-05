
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Filter, 
  Eye, 
  AlertTriangle, 
  Users, 
  TrendingUp,
  Building2,
  Network,
  X
} from 'lucide-react';

interface ProcessNode {
  id: string;
  name: string;
  department: string;
  owner: string;
  type: 'Core' | 'Support' | 'Admin' | 'Shadow';
  bottleneckSeverity: 'None' | 'Low' | 'Medium' | 'High';
  employeesInvolved: number;
  overheadPercentage: number;
  hasShadowProcesses: boolean;
  x: number;
  y: number;
}

interface Connection {
  from: string;
  to: string;
  type: 'strong' | 'medium' | 'weak';
  department: 'inter' | 'intra';
}

const NetworkGraph = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [highlightMode, setHighlightMode] = useState<'bottlenecks' | 'overhead' | 'employees' | 'none'>('bottlenecks');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Enhanced mock data with more realistic business processes
  const processNodes: ProcessNode[] = [
    { id: '1', name: 'Invoice Processing', department: 'Finance', owner: 'Sarah Johnson', type: 'Core', bottleneckSeverity: 'High', employeesInvolved: 12, overheadPercentage: 35, hasShadowProcesses: true, x: 300, y: 200 },
    { id: '2', name: 'Customer Onboarding', department: 'Sales', owner: 'Mike Chen', type: 'Core', bottleneckSeverity: 'Medium', employeesInvolved: 8, overheadPercentage: 20, hasShadowProcesses: false, x: 500, y: 150 },
    { id: '3', name: 'Employee Expense Reports', department: 'HR', owner: 'Emma Davis', type: 'Admin', bottleneckSeverity: 'Low', employeesInvolved: 25, overheadPercentage: 15, hasShadowProcesses: true, x: 200, y: 350 },
    { id: '4', name: 'IT Asset Management', department: 'IT', owner: 'David Wilson', type: 'Support', bottleneckSeverity: 'Medium', employeesInvolved: 6, overheadPercentage: 25, hasShadowProcesses: false, x: 600, y: 300 },
    { id: '5', name: 'Marketing Campaign Approval', department: 'Marketing', owner: 'Lisa Rodriguez', type: 'Core', bottleneckSeverity: 'High', employeesInvolved: 15, overheadPercentage: 40, hasShadowProcesses: true, x: 400, y: 400 },
    { id: '6', name: 'Vendor Management', department: 'Procurement', owner: 'Tom Anderson', type: 'Support', bottleneckSeverity: 'Medium', employeesInvolved: 10, overheadPercentage: 22, hasShadowProcesses: false, x: 150, y: 150 },
    { id: '7', name: 'Product Development', department: 'Product', owner: 'Anna Thompson', type: 'Core', bottleneckSeverity: 'Low', employeesInvolved: 20, overheadPercentage: 12, hasShadowProcesses: false, x: 550, y: 450 },
    { id: '8', name: 'Quality Assurance', department: 'Operations', owner: 'James Miller', type: 'Core', bottleneckSeverity: 'Medium', employeesInvolved: 14, overheadPercentage: 18, hasShadowProcesses: true, x: 350, y: 500 }
  ];

  const connections: Connection[] = [
    { from: '1', to: '2', type: 'strong', department: 'inter' },
    { from: '2', to: '7', type: 'medium', department: 'inter' },
    { from: '3', to: '1', type: 'weak', department: 'inter' },
    { from: '4', to: '3', type: 'medium', department: 'inter' },
    { from: '5', to: '2', type: 'strong', department: 'inter' },
    { from: '6', to: '1', type: 'strong', department: 'inter' },
    { from: '7', to: '8', type: 'strong', department: 'inter' },
    { from: '8', to: '1', type: 'medium', department: 'inter' }
  ];

  const getNodeColor = (node: ProcessNode) => {
    switch (highlightMode) {
      case 'bottlenecks':
        switch (node.bottleneckSeverity) {
          case 'None': return '#10b981';
          case 'Low': return '#f59e0b';
          case 'Medium': return '#f97316';
          case 'High': return '#ef4444';
          default: return '#6b7280';
        }
      case 'overhead':
        if (node.overheadPercentage > 30) return '#ef4444';
        if (node.overheadPercentage > 20) return '#f97316';
        if (node.overheadPercentage > 10) return '#f59e0b';
        return '#10b981';
      case 'employees':
        if (node.employeesInvolved > 20) return '#8b5cf6';
        if (node.employeesInvolved > 15) return '#3b82f6';
        if (node.employeesInvolved > 10) return '#06b6d4';
        return '#10b981';
      default:
        switch (node.bottleneckSeverity) {
          case 'None': return '#10b981';
          case 'Low': return '#f59e0b';
          case 'Medium': return '#f97316';
          case 'High': return '#ef4444';
          default: return '#6b7280';
        }
    }
  };

  const getNodeSize = (node: ProcessNode) => {
    const base = 20;
    if (highlightMode === 'employees') {
      return base + (node.employeesInvolved / 2);
    }
    return base + (node.employeesInvolved / 3);
  };

  const getProcessTypeColor = (type: string) => {
    switch (type) {
      case 'Core': return '#3b82f6';
      case 'Support': return '#8b5cf6';
      case 'Admin': return '#6b7280';
      case 'Shadow': return '#f59e0b';
      default: return '#6b7280';
    }
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
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
  };

  const getHighlightModeIcon = () => {
    switch (highlightMode) {
      case 'bottlenecks': return <AlertTriangle className="w-4 h-4" />;
      case 'overhead': return <TrendingUp className="w-4 h-4" />;
      case 'employees': return <Users className="w-4 h-4" />;
      default: return <Eye className="w-4 h-4" />;
    }
  };

  // Calculate statistics
  const stats = {
    totalProcesses: processNodes.length,
    highBottlenecks: processNodes.filter(n => n.bottleneckSeverity === 'High').length,
    shadowProcesses: processNodes.filter(n => n.hasShadowProcesses).length,
    avgOverhead: Math.round(processNodes.reduce((acc, n) => acc + n.overheadPercentage, 0) / processNodes.length)
  };

  const handleNodeClick = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNode(selectedNode === nodeId ? null : nodeId);
  };

  const handleCanvasClick = () => {
    setSelectedNode(null);
  };

  const handleShadowProcessClick = (nodeName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(`Shadow processes detected for: ${nodeName}`);
    // Add your custom logic here - could open a modal, navigate to details, etc.
  };

  const handleBottleneckClick = (nodeName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(`High bottleneck severity for: ${nodeName}`);
    // Add your custom logic here - could show recommendations, escalate, etc.
  };

  const selectedNodeData = selectedNode ? processNodes.find(n => n.id === selectedNode) : null;

  return (
    <Card className="h-[600px] bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-blue-600" />
            <CardTitle>Business Process Network</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {/* Highlight Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              {(['bottlenecks', 'overhead', 'employees'] as const).map((mode) => (
                <Button
                  key={mode}
                  variant={highlightMode === mode ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setHighlightMode(mode)}
                  className="h-8 px-2"
                  title={`Highlight by ${mode}`}
                >
                  {mode === 'bottlenecks' && <AlertTriangle className="w-4 h-4" />}
                  {mode === 'overhead' && <TrendingUp className="w-4 h-4" />}
                  {mode === 'employees' && <Users className="w-4 h-4" />}
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
      <CardContent className="h-full relative p-0">
        {/* Statistics Panel */}
        <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-sm border z-10">
          <div className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
            {getHighlightModeIcon()}
            Network Overview
          </div>
          <div className="space-y-1 text-xs text-gray-600">
            <div>Processes: {stats.totalProcesses}</div>
            <div className="text-red-600">High Risk: {stats.highBottlenecks}</div>
            <div className="text-amber-600">Shadow: {stats.shadowProcesses}</div>
            <div>Avg Overhead: {stats.avgOverhead}%</div>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-sm border z-10 max-w-xs">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            {getHighlightModeIcon()}
            {highlightMode} View
          </h4>
          
          {highlightMode === 'bottlenecks' && (
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>High Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>Medium Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span>Low Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>No Issues</span>
              </div>
            </div>
          )}

          {highlightMode === 'overhead' && (
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>&gt;30% Overhead</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>20-30% Overhead</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span>10-20% Overhead</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>&lt;10% Overhead</span>
              </div>
            </div>
          )}

          {highlightMode === 'employees' && (
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-purple-500 rounded-full"></div>
                <span>&gt;20 people</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span>15-20 people</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                <span>10-15 people</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>&lt;10 people</span>
              </div>
            </div>
          )}
        </div>

        {/* Selected Node Information Panel */}
        {selectedNodeData && (
          <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-xl border max-w-sm z-20">
            <div className="flex items-start justify-between mb-3">
              <div className="font-semibold text-gray-900">{selectedNodeData.name}</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedNode(null)}
                className="h-6 w-6 p-0 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                {selectedNodeData.department} • {selectedNodeData.owner}
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span>{selectedNodeData.employeesInvolved} people</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                  <span>{selectedNodeData.overheadPercentage}% overhead</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span>{selectedNodeData.bottleneckSeverity} risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <span>{selectedNodeData.type} process</span>
                </div>
              </div>

              {selectedNodeData.hasShadowProcesses && (
                <div 
                  className="text-xs text-amber-600 bg-amber-50 p-2 rounded cursor-pointer hover:bg-amber-100 transition-colors"
                  onClick={(e) => handleShadowProcessClick(selectedNodeData.name, e)}
                  title="Click to view shadow process details"
                >
                  ⚠️ Shadow processes detected
                </div>
              )}

              {selectedNodeData.bottleneckSeverity === 'High' && (
                <div 
                  className="text-xs text-red-600 bg-red-50 p-2 rounded cursor-pointer hover:bg-red-100 transition-colors"
                  onClick={(e) => handleBottleneckClick(selectedNodeData.name, e)}
                  title="Click to view bottleneck recommendations"
                >
                  🚨 High bottleneck severity - needs attention
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main SVG Canvas */}
        <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden relative">
          <svg
            ref={svgRef}
            className="w-full h-full cursor-move"
            viewBox={`${-pan.x} ${-pan.y} ${800 / zoom} ${600 / zoom}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleCanvasClick}
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
            {connections.map((connection, index) => {
              const fromNode = processNodes.find(n => n.id === connection.from);
              const toNode = processNodes.find(n => n.id === connection.to);
              
              if (!fromNode || !toNode) return null;

              const strokeWidth = connection.type === 'strong' ? 3 : connection.type === 'medium' ? 2 : 1;
              const opacity = connection.type === 'strong' ? 0.8 : connection.type === 'medium' ? 0.6 : 0.4;

              return (
                <line
                  key={index}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke="#94a3b8"
                  strokeWidth={strokeWidth}
                  markerEnd="url(#arrowhead)"
                  opacity={opacity}
                />
              );
            })}

            {/* Process nodes */}
            {processNodes.map((node) => {
              const nodeSize = getNodeSize(node);
              const nodeColor = getNodeColor(node);
              const isSelected = selectedNode === node.id;
              const isHovered = hoveredNode === node.id;

              return (
                <g key={node.id}>
                  {/* Selection ring */}
                  {isSelected && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={nodeSize + 8}
                      fill="none"
                      stroke="#1f2937"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                      opacity="0.8"
                    />
                  )}

                  {/* Process type indicator (border) */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={nodeSize + 3}
                    fill={getProcessTypeColor(node.type)}
                    opacity={0.3}
                  />
                  
                  {/* Main node */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={nodeSize}
                    fill={nodeColor}
                    stroke={isHovered ? '#374151' : 'white'}
                    strokeWidth={isHovered ? 2 : 1}
                    className="cursor-pointer transition-all duration-200"
                    filter={isSelected ? 'url(#glow)' : 'url(#shadow)'}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={(e) => handleNodeClick(node.id, e)}
                  />

                  {/* Dynamic content based on highlight mode */}
                  <text
                    x={node.x}
                    y={node.y}
                    textAnchor="middle"
                    dy="0.35em"
                    fontSize="10"
                    fontWeight="600"
                    fill="white"
                    className="pointer-events-none"
                  >
                    {highlightMode === 'employees' && node.employeesInvolved}
                    {highlightMode === 'overhead' && `${node.overheadPercentage}%`}
                    {highlightMode === 'bottlenecks' && node.bottleneckSeverity.charAt(0)}
                  </text>

                  {/* Process name label */}
                  <text
                    x={node.x}
                    y={node.y + nodeSize + 16}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="500"
                    fill="#374151"
                    className="pointer-events-none"
                  >
                    {node.name.length > 15 
                      ? node.name.substring(0, 15) + '...' 
                      : node.name}
                  </text>

                  {/* Shadow process indicator */}
                  {node.hasShadowProcesses && (
                    <circle
                      cx={node.x + nodeSize - 5}
                      cy={node.y - nodeSize + 5}
                      r="3"
                      fill="#f59e0b"
                      stroke="white"
                      strokeWidth="1"
                    />
                  )}

                  {/* High bottleneck warning */}
                  {node.bottleneckSeverity === 'High' && (
                    <polygon
                      points={`${node.x - nodeSize + 5},${node.y - nodeSize + 8} ${node.x - nodeSize + 13},${node.y - nodeSize + 5} ${node.x - nodeSize + 13},${node.y - nodeSize + 11}`}
                      fill="#ef4444"
                      stroke="white"
                      strokeWidth="1"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Hover tooltip - only show when not selected */}
          {hoveredNode && !selectedNode && (
            <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg border max-w-xs z-20 pointer-events-none">
              {(() => {
                const node = processNodes.find(n => n.id === hoveredNode);
                if (!node) return null;
                
                return (
                  <div className="space-y-2">
                    <div className="font-medium text-gray-900">{node.name}</div>
                    <div className="text-sm text-gray-600">
                      {node.department} • {node.owner}
                    </div>
                    <div className="text-xs text-gray-500">
                      Click to view details
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NetworkGraph;
