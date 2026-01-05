import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  Trash2, 
  Download,
  FolderOpen,
  Database,
  Users,
  MessageSquare,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { employeesData } from '@/data/employeesData';

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  aiDescription: string;
}

interface EmployeeContext {
  employeeId: string;
  employeeName: string;
  department: string;
  files: Array<{
    id: string;
    name: string;
    size: number;
    uploadedAt: Date;
    aiDescription: string;
  }>;
  questions: string[];
}

const DataHub = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadedFile[]>([
    {
      id: '1',
      name: 'Employee Handbook 2024.pdf',
      type: 'application/pdf',
      size: 2456000,
      uploadedAt: new Date('2024-01-15'),
      aiDescription: 'Comprehensive employee handbook covering company policies, benefits, code of conduct, and workplace procedures for 2024.'
    },
    {
      id: '2',
      name: 'Onboarding Process Map.pdf',
      type: 'application/pdf',
      size: 1234000,
      uploadedAt: new Date('2024-01-20'),
      aiDescription: 'Visual flowchart detailing the complete employee onboarding journey from offer acceptance to 90-day review.'
    },
    {
      id: '3',
      name: 'IT Support Flowchart.png',
      type: 'image/png',
      size: 567000,
      uploadedAt: new Date('2024-02-01'),
      aiDescription: 'Decision tree for IT support ticket escalation and resolution pathways across different issue categories.'
    },
    {
      id: '4',
      name: 'Sales Training Guide.docx',
      type: 'application/docx',
      size: 890000,
      uploadedAt: new Date('2024-02-10'),
      aiDescription: 'Training material for sales team covering product knowledge, objection handling, and CRM usage guidelines.'
    }
  ]);
  const [isDragging, setIsDragging] = useState(false);

  // Mock employee context data
  const [employeeContexts] = useState<EmployeeContext[]>([
    {
      employeeId: 'sarah-johnson',
      employeeName: 'Sarah Johnson',
      department: 'Operations',
      files: [
        {
          id: 'sj-f1',
          name: 'Operations Manual v3.pdf',
          size: 1850000,
          uploadedAt: new Date('2024-01-10'),
          aiDescription: 'Internal operations manual specific to Sarah\'s team responsibilities and workflows.'
        }
      ],
      questions: [
        'What are the main bottlenecks in the order fulfillment process?',
        'How do you coordinate with the warehouse team during peak seasons?'
      ]
    },
    {
      employeeId: 'lisa-rodriguez',
      employeeName: 'Lisa Rodriguez',
      department: 'IT',
      files: [
        {
          id: 'lr-f1',
          name: 'System Architecture Diagram.pdf',
          size: 2100000,
          uploadedAt: new Date('2024-01-05'),
          aiDescription: 'Technical architecture diagram showing IT infrastructure and system integrations.'
        },
        {
          id: 'lr-f2',
          name: 'Security Protocols.docx',
          size: 560000,
          uploadedAt: new Date('2024-01-08'),
          aiDescription: 'Documentation of security protocols and access control procedures.'
        }
      ],
      questions: [
        'What are the biggest security concerns for the organization?',
        'How is technical debt being managed across teams?',
        'What cloud migration challenges have you encountered?'
      ]
    },
    {
      employeeId: 'emma-davis',
      employeeName: 'Emma Davis',
      department: 'HR',
      files: [],
      questions: [
        'What improvements could streamline the onboarding process?',
        'How do you measure employee satisfaction currently?'
      ]
    }
  ]);

  const navigate = useNavigate();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toUpperCase() || 'FILE';
    return ext.length > 4 ? ext.substring(0, 4) : ext;
  };

  const getExtensionColor = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
      case 'pdf': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
      case 'doc':
      case 'docx': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'xls':
      case 'xlsx':
      case 'csv': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
      case 'ppt':
      case 'pptx': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFiles = (fileList: File[]) => {
    const newFiles: UploadedFile[] = fileList.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      size: file.size,
      uploadedAt: new Date(),
      aiDescription: 'Analyzing document content...'
    }));
    
    setFiles(prev => [...newFiles, ...prev]);
    toast({
      title: "Files uploaded",
      description: `${fileList.length} file${fileList.length > 1 ? 's' : ''} added to Data Hub`
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleDelete = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    toast({
      title: "File removed",
      description: "File has been removed from Data Hub"
    });
  };

  const stats = {
    total: files.length,
    employeesWithContext: employeeContexts.filter(e => e.files.length > 0 || e.questions.length > 0).length,
    totalQuestions: employeeContexts.reduce((acc, e) => acc + e.questions.length, 0),
    totalEmployeeFiles: employeeContexts.reduce((acc, e) => acc + e.files.length, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Data Hub</h1>
        <p className="text-muted-foreground mt-1">
          Upload documents to help AI ask more detailed and context-aware questions during interviews
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.employeesWithContext}</p>
                <p className="text-xs text-muted-foreground">Employees with Context</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalEmployeeFiles}</p>
                <p className="text-xs text-muted-foreground">Employee Files</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <MessageSquare className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalQuestions}</p>
                <p className="text-xs text-muted-foreground">Custom Questions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents">All Documents</TabsTrigger>
          <TabsTrigger value="by-employee">By Employee</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          {/* Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload Documents</CardTitle>
              <CardDescription>
                Drop files here or click to browse. Supported: PDF, Word, Excel, PowerPoint, Images
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                  ${isDragging 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif"
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      or click to browse from your computer
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Uploaded Documents</CardTitle>
              <CardDescription>
                These documents are used by AI to generate more informed interview questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {files.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No documents uploaded yet</p>
                  <p className="text-sm">Upload your first document to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${getExtensionColor(file.name)}`}>
                        {getFileExtension(file.name)}
                      </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {file.aiDescription}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              {file.uploadedAt.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(file.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="by-employee" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Employee Context</CardTitle>
              <CardDescription>
                Files and custom questions added to individual employees
              </CardDescription>
            </CardHeader>
            <CardContent>
              {employeeContexts.filter(e => e.files.length > 0 || e.questions.length > 0).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No employee context added yet</p>
                  <p className="text-sm">Add context to employees from their profile page</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {employeeContexts.filter(e => e.files.length > 0 || e.questions.length > 0).map((context) => (
                    <div key={context.employeeId} className="border rounded-lg p-4">
                      <div 
                        className="flex items-center gap-3 mb-4 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => navigate(`/employees/${context.employeeId}`)}
                      >
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {context.employeeName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium hover:text-primary transition-colors">{context.employeeName}</p>
                          <p className="text-xs text-muted-foreground">{context.department}</p>
                        </div>
                      </div>
                      {/* Files */}
                      {context.files.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                            Files ({context.files.length})
                          </p>
                          <div className="space-y-2">
                            {context.files.map((file) => (
                              <div key={file.id} className="flex items-start gap-3 p-2 bg-muted/50 rounded-lg">
                                <div className={`w-8 h-8 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${getExtensionColor(file.name)}`}>
                                  {getFileExtension(file.name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm truncate">{file.name}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                    {file.aiDescription}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {formatFileSize(file.size)} • {file.uploadedAt.toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Questions */}
                      {context.questions.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                            Custom Questions ({context.questions.length})
                          </p>
                          <div className="space-y-1">
                            {context.questions.map((question, idx) => (
                              <div key={idx} className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg">
                                <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                <p className="text-sm">{question}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataHub;
