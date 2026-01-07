import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  Trash2,
  Download,
  FolderOpen,
  Database,
  Users,
  MessageSquare,
  FileText,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { api, Employee, Document } from '@/services/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DataHub = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Employee data from API
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [employeesError, setEmployeesError] = useState<string | null>(null);

  // Document data from API
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Upload options
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');

  // Fetch employees from API
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setEmployeesLoading(true);
        setEmployeesError(null);
        const data = await api.getEmployees();
        setEmployees(data);
      } catch (err) {
        console.error('Failed to fetch employees:', err);
        setEmployeesError('Failed to load employees');
      } finally {
        setEmployeesLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Fetch documents from API
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setDocumentsLoading(true);
        const data = await api.getDocuments();
        setDocuments(data.documents || []);
      } catch (err) {
        console.error('Failed to fetch documents:', err);
      } finally {
        setDocumentsLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const [isDragging, setIsDragging] = useState(false);

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

  const handleFiles = async (fileList: File[]) => {
    // Only allow PDFs for now
    const pdfFiles = fileList.filter(f => f.name.toLowerCase().endsWith('.pdf'));

    if (pdfFiles.length === 0) {
      toast({
        title: "Invalid file type",
        description: "Only PDF files are currently supported",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    let successCount = 0;

    for (const file of pdfFiles) {
      try {
        const result = await api.uploadDocument(
          file,
          selectedCategory || undefined,
          selectedDepartment || undefined
        );

        if (result.status === 'uploaded') {
          // Add to local state
          const newDoc: Document = {
            id: result.document.id,
            name: result.document.name,
            file_url: result.document.file_url,
            file_type: 'pdf',
            file_size: file.size,
            category: result.document.category,
            department: result.document.department,
            summary: result.document.summary,
            status: 'active',
            created_at: new Date().toISOString()
          };
          setDocuments(prev => [newDoc, ...prev]);
          successCount++;
        }
      } catch (err) {
        console.error('Failed to upload file:', err);
        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive"
        });
      }
    }

    setUploading(false);

    if (successCount > 0) {
      toast({
        title: "Files uploaded",
        description: `${successCount} file${successCount > 1 ? 's' : ''} uploaded and processed by AI`
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteDocument(id);
      setDocuments(prev => prev.filter(f => f.id !== id));
      toast({
        title: "File removed",
        description: "File has been removed from Data Hub"
      });
    } catch (err) {
      console.error('Failed to delete document:', err);
      toast({
        title: "Delete failed",
        description: "Failed to remove the file",
        variant: "destructive"
      });
    }
  };

  const stats = {
    total: documents.length,
    employeesWithContext: employees.filter(e => e.notes).length,
    totalQuestions: 0, // Questions will be stored in employee notes or a separate API
    totalEmployeeFiles: 0 // Files per employee will come from a separate API
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
                Upload PDF files (employee handbooks, SOPs, policies) to help AI ask smarter interview questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category and Department Selection */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="handbook">Employee Handbook</SelectItem>
                      <SelectItem value="sop">Standard Operating Procedure</SelectItem>
                      <SelectItem value="policy">Company Policy</SelectItem>
                      <SelectItem value="training">Training Material</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Department</label>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="all">All Departments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center transition-all
                  ${uploading ? 'cursor-wait opacity-50' : 'cursor-pointer'}
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
                  accept=".pdf"
                  disabled={uploading}
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-primary/10 rounded-full">
                    {uploading ? (
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {uploading ? 'Uploading and analyzing...' : isDragging ? 'Drop files here' : 'Drag & drop PDF files here'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {uploading ? 'AI is extracting text and generating summaries' : 'or click to browse from your computer'}
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
              {documentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading documents...</span>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No documents uploaded yet</p>
                  <p className="text-sm">Upload your first document to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${getExtensionColor(doc.name)}`}>
                        {getFileExtension(doc.name)}
                      </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {doc.summary || 'Processing document...'}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {doc.file_size && (
                              <>
                                <span className="text-xs text-muted-foreground">
                                  {formatFileSize(doc.file_size)}
                                </span>
                                <span className="text-xs text-muted-foreground">•</span>
                              </>
                            )}
                            {doc.category && (
                              <>
                                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                                  {doc.category}
                                </span>
                                <span className="text-xs text-muted-foreground">•</span>
                              </>
                            )}
                            {doc.department && (
                              <>
                                <span className="text-xs text-muted-foreground">
                                  {doc.department}
                                </span>
                                <span className="text-xs text-muted-foreground">•</span>
                              </>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {new Date(doc.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {doc.file_url && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => window.open(doc.file_url, '_blank')}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(doc.id)}
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
                View employees and their associated context data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {employeesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading employees...</span>
                </div>
              ) : employeesError ? (
                <div className="text-center py-12 text-destructive">
                  <p>{employeesError}</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              ) : employees.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No employees found</p>
                  <p className="text-sm">Add employees to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {employees.map((employee) => (
                    <div key={employee.id} className="border rounded-lg p-4">
                      <div
                        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => navigate(`/employees/${employee.id}`)}
                      >
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {employee.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium hover:text-primary transition-colors">{employee.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {employee.department || 'No department'} {employee.role && `- ${employee.role}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            employee.status === 'active'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                          }`}>
                            {employee.status}
                          </span>
                        </div>
                      </div>
                      {employee.notes && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                            Notes
                          </p>
                          <div className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg">
                            <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                            <p className="text-sm">{employee.notes}</p>
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
