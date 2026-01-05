import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Upload, User, FileText, Plus, Check, X } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface AddEmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddEmployee?: (data: EmployeeFormData) => void;
}

interface EmployeeFormData {
  name: string;
  position: string;
  department: string;
  email: string;
}

const AddEmployeeModal = ({ open, onOpenChange, onAddEmployee }: AddEmployeeModalProps) => {
  const [activeTab, setActiveTab] = useState('individual');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [departments, setDepartments] = useState([
    'Operations', 'Sales', 'HR', 'Finance', 'IT', 'Marketing', 
    'Customer Success', 'Product', 'Engineering', 'Leadership'
  ]);
  const [showNewDepartment, setShowNewDepartment] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  
  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm<EmployeeFormData>();

  const departmentColors = {
    'Operations': 'bg-blue-100 text-blue-800 border-blue-200',
    'Sales': 'bg-green-100 text-green-800 border-green-200',
    'HR': 'bg-purple-100 text-purple-800 border-purple-200',
    'Finance': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'IT': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    'Marketing': 'bg-pink-100 text-pink-800 border-pink-200',
    'Customer Success': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'Product': 'bg-orange-100 text-orange-800 border-orange-200',
    'Engineering': 'bg-red-100 text-red-800 border-red-200',
    'Leadership': 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const getDepartmentColor = (dept: string) => {
    return departmentColors[dept as keyof typeof departmentColors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const onSubmitEmployee = (data: EmployeeFormData) => {
    console.log('Adding employee:', data);
    if (onAddEmployee) {
      onAddEmployee(data);
    }
    reset();
    setSelectedDepartment('');
    onOpenChange(false);
  };

  const handleAddNewDepartment = () => {
    if (newDepartmentName.trim() && !departments.includes(newDepartmentName.trim())) {
      const newDept = newDepartmentName.trim();
      setDepartments([...departments, newDept]);
      setSelectedDepartment(newDept);
      setValue('department', newDept);
      setNewDepartmentName('');
      setShowNewDepartment(false);
    }
  };

  const handleCancelNewDepartment = () => {
    setNewDepartmentName('');
    setShowNewDepartment(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddNewDepartment();
    } else if (e.key === 'Escape') {
      handleCancelNewDepartment();
    }
  };

  const generateCsvTemplate = () => {
    const csvContent = 'Name,Position,Department,Email\n"John Doe","Software Engineer","Engineering","john.doe@company.com"\n"Jane Smith","Product Manager","Product","jane.smith@company.com"';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCsvFile(file);
    }
  };

  const processCsvUpload = () => {
    if (!csvFile) return;
    
    console.log('Processing CSV file:', csvFile.name);
    // Here you would typically parse the CSV and send the data to your backend
    setCsvFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Add Employees
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="individual" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Add Individual
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Bulk CSV Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="individual" className="space-y-4 mt-4">
            <form onSubmit={handleSubmit(onSubmitEmployee)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    {...register('name', { required: 'Name is required' })}
                    placeholder="Enter full name"
                  />
                  {errors.name && (
                    <span className="text-sm text-red-500">{errors.name.message}</span>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="position">Position *</Label>
                  <Input
                    id="position"
                    {...register('position', { required: 'Position is required' })}
                    placeholder="Enter job position"
                  />
                  {errors.position && (
                    <span className="text-sm text-red-500">{errors.position.message}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select onValueChange={(value) => {
                    setSelectedDepartment(value);
                    setValue('department', value);
                  }} value={selectedDepartment} required>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select or type department" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border shadow-lg z-50">
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDepartmentColor(dept)}`}>
                              {dept}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                      <div className="border-t pt-2 mt-2">
                        {!showNewDepartment ? (
                          <button
                            type="button"
                            onClick={() => setShowNewDepartment(true)}
                            className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded"
                          >
                            <Plus className="w-4 h-4" />
                            Add new department
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 px-2 py-1">
                            <Input
                              value={newDepartmentName}
                              onChange={(e) => setNewDepartmentName(e.target.value)}
                              placeholder="Type department name"
                              className="text-sm h-8 flex-1"
                              onKeyDown={handleKeyPress}
                              autoFocus
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleAddNewDepartment}
                              className="h-8 px-2"
                              disabled={!newDepartmentName.trim()}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleCancelNewDepartment}
                              className="h-8 px-2"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </SelectContent>
                  </Select>
                  {errors.department && (
                    <span className="text-sm text-red-500">{errors.department.message}</span>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <span className="text-sm text-red-500">{errors.email.message}</span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Add Employee
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Bulk Employee Upload</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Upload a CSV file with employee information
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={generateCsvTemplate}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download CSV Template
                    </Button>
                    
                    <div className="text-xs text-gray-500">
                      Download the template to see the required format
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="space-y-3">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCsvUpload}
                        className="hidden"
                        id="csv-upload"
                      />
                      <label htmlFor="csv-upload">
                        <Button type="button" variant="outline" className="cursor-pointer flex items-center gap-2">
                          <Upload className="w-4 h-4" />
                          Choose CSV File
                        </Button>
                      </label>
                      
                      {csvFile && (
                        <div className="text-sm text-green-600">
                          Selected: {csvFile.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">CSV Format Requirements:</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Header row: Name, Position, Department, Email</li>
                  <li>• Each employee on a separate row</li>
                  <li>• All fields are required</li>
                  <li>• Email addresses must be valid</li>
                </ul>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={processCsvUpload}
                  disabled={!csvFile}
                >
                  Upload Employees
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddEmployeeModal;
