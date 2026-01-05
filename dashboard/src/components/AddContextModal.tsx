import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, MessageSquare, Plus, X, File, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddContextModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeName: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

interface QuestionItem {
  id: string;
  text: string;
}

const AddContextModal = ({ open, onOpenChange, employeeName }: AddContextModalProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('files');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles: UploadedFile[] = Array.from(files).map(file => ({
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type
      }));
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
    // Reset input
    event.target.value = '';
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
    const files = e.dataTransfer.files;
    if (files) {
      const newFiles: UploadedFile[] = Array.from(files).map(file => ({
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type
      }));
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleAddQuestion = () => {
    if (newQuestion.trim()) {
      setQuestions(prev => [
        ...prev,
        {
          id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: newQuestion.trim()
        }
      ]);
      setNewQuestion('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddQuestion();
    }
  };

  const removeQuestion = (questionId: string) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  const handleSave = () => {
    // Here you would typically send the data to your backend
    console.log('Saving context for:', employeeName);
    console.log('Files:', uploadedFiles);
    console.log('Questions:', questions);
    
    toast({
      title: "Context saved",
      description: `Added ${uploadedFiles.length} file(s) and ${questions.length} question(s) for ${employeeName}.`,
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Add Context for {employeeName}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="files" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Files
              {uploadedFiles.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                  {uploadedFiles.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Questions to Ask
              {questions.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                  {questions.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="space-y-4 mt-4 flex-1 overflow-auto">
            <div className="space-y-4">
              {/* Drop zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-foreground">Upload Documents</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Drag and drop files here, or click to browse
                    </p>
                  </div>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
                  />
                  <label htmlFor="file-upload">
                    <Button type="button" variant="outline" className="cursor-pointer" asChild>
                      <span>
                        <Plus className="w-4 h-4 mr-2" />
                        Choose Files
                      </span>
                    </Button>
                  </label>
                </div>
              </div>

              {/* File list */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</Label>
                  <div className="space-y-2 max-h-48 overflow-auto">
                    {uploadedFiles.map(file => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                            <File className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground truncate max-w-[300px]">
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info box */}
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <h4 className="text-sm font-medium text-foreground mb-2">Supported Documents:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• CVs and resumes</li>
                  <li>• Role handbooks and guidelines</li>
                  <li>• Process documentation</li>
                  <li>• Training materials</li>
                  <li>• Supported formats: PDF, DOC, DOCX, TXT, CSV, XLS, XLSX</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="questions" className="space-y-4 mt-4 flex-1 overflow-auto">
            <div className="space-y-4">
              {/* Add question input */}
              <div className="space-y-2">
                <Label htmlFor="new-question">Add a Question or Topic</Label>
                <div className="flex gap-2">
                  <Textarea
                    id="new-question"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="e.g., How do you handle escalations in your current workflow?"
                    className="min-h-[80px] flex-1"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">Press Enter to add</p>
                  <Button
                    type="button"
                    onClick={handleAddQuestion}
                    disabled={!newQuestion.trim()}
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Question
                  </Button>
                </div>
              </div>

              {/* Questions list */}
              {questions.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Questions to Ask ({questions.length})</Label>
                  <div className="space-y-2 max-h-48 overflow-auto">
                    {questions.map((question, index) => (
                      <div
                        key={question.id}
                        className="flex items-start justify-between p-3 rounded-lg border border-border bg-card/50"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-medium text-primary">{index + 1}</span>
                          </div>
                          <p className="text-sm text-foreground">{question.text}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(question.id)}
                          className="text-muted-foreground hover:text-destructive flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {questions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No questions added yet.</p>
                  <p className="text-xs mt-1">Add questions or topics you want the AI to explore during the interview.</p>
                </div>
              )}

              {/* Info box */}
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <h4 className="text-sm font-medium text-foreground mb-2">Question Examples:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• What tools do you use daily that aren't officially provided?</li>
                  <li>• How do you handle exceptions or edge cases in the process?</li>
                  <li>• What information do you wish you had access to?</li>
                  <li>• Who do you collaborate with most frequently?</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSave}
            disabled={uploadedFiles.length === 0 && questions.length === 0}
          >
            Save Context
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddContextModal;
