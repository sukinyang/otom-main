import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus, User, CheckCircle2, Clock, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, FileText, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AddEmployeeModal from '@/components/AddEmployeeModal';
import AddContextModal from '@/components/AddContextModal';
import { api, Employee as ApiEmployee } from '@/services/api';

// Local Employee interface that extends API data with UI-specific fields
interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  status: 'completed' | 'scheduled' | 'pending';
  email: string;
  phone: string;
  interviewDate: string | null;
  interviewTime: string | null;
  manager: string;
  engagement: 'High' | 'Medium' | 'Low';
  tenure: string;
  location: string;
}

// Helper function to transform API employee to local format
const transformApiEmployee = (emp: ApiEmployee): Employee => ({
  id: emp.id,
  name: emp.name,
  role: emp.role || 'Not specified',
  department: emp.department || 'Unassigned',
  status: (emp.status as 'completed' | 'scheduled' | 'pending') || 'pending',
  email: emp.email || '',
  phone: emp.phone_number || '',
  interviewDate: null,
  interviewTime: null,
  manager: 'Not Assigned',
  engagement: 'Medium',
  tenure: 'New',
  location: 'Remote'
});

// Helper function to format interview status for display
const formatInterviewStatus = (employee: Employee): { label: string; detail: string } => {
  switch (employee.status) {
    case 'completed':
      return {
        label: 'Completed',
        detail: employee.interviewDate
          ? new Date(employee.interviewDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : 'Recently'
      };
    case 'scheduled':
      return {
        label: 'Scheduled',
        detail: employee.interviewTime || 'Soon'
      };
    case 'pending':
      return {
        label: 'Pending',
        detail: "Hasn't booked"
      };
  }
};

type SortField = 'name' | 'role' | 'department' | 'status';
type SortDirection = 'asc' | 'desc' | null;

const Employees = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Data state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);

  // Filter and UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [contextEmployee, setContextEmployee] = useState<Employee | null>(null);
  const [sortField, setSortField] = useState<SortField | null>('status');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Fetch employees from API
  const fetchEmployees = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      }
      setError(null);

      const data = await api.getEmployees();
      const transformedEmployees = data.map(transformApiEmployee);
      setEmployees(transformedEmployees);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch employees';
      setError(errorMessage);
      toast({
        title: "Error loading employees",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  // Initial data fetch
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Refresh handler
  const handleRefresh = () => {
    fetchEmployees(true);
  };

  const departments = [...new Set(employees.map(e => e.department))];

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 text-muted-foreground/50" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="w-4 h-4 ml-1 text-primary" />;
    }
    return <ArrowDown className="w-4 h-4 ml-1 text-primary" />;
  };

  const filteredAndSortedEmployees = useMemo(() => {
    let result = employees.filter(employee => {
      const matchesSearch = 
        employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
      const matchesDepartment = departmentFilter === 'all' || employee.department === departmentFilter;
      
      return matchesSearch && matchesStatus && matchesDepartment;
    });

    if (sortField && sortDirection) {
      result = [...result].sort((a, b) => {
        let comparison = 0;
        
        switch (sortField) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'role':
            comparison = a.role.localeCompare(b.role);
            break;
          case 'department':
            comparison = a.department.localeCompare(b.department);
            break;
          case 'status':
            const statusOrder = { completed: 0, scheduled: 1, pending: 2 };
            comparison = statusOrder[a.status] - statusOrder[b.status];
            break;
        }
        
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return result;
  }, [employees, searchQuery, statusFilter, departmentFilter, sortField, sortDirection]);

  const handleAddEmployee = async (data: { name: string; position: string; department: string; email: string }) => {
    setIsAddingEmployee(true);
    try {
      const newEmployeeData = {
        name: data.name,
        role: data.position,
        department: data.department,
        email: data.email,
        status: 'pending' as const,
      };

      const createdEmployee = await api.createEmployee(newEmployeeData);
      const transformedEmployee = transformApiEmployee(createdEmployee);

      setEmployees(prev => [transformedEmployee, ...prev]);
      toast({
        title: "Employee added",
        description: `${data.name} has been added successfully.`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add employee';
      toast({
        title: "Error adding employee",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAddingEmployee(false);
    }
  };

  const getStatusBadge = (employee: Employee) => {
    switch (employee.status) {
      case 'completed':
        return (
          <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20 hover:bg-warning/20">
            <Clock className="w-3 h-3 mr-1" />
            Scheduled
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-muted text-muted-foreground border-muted-foreground/20 hover:bg-muted/80">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{employee.status}</Badge>;
    }
  };

  const getStatusDetail = (employee: Employee) => {
    const statusInfo = formatInterviewStatus(employee);
    return statusInfo.detail;
  };

  const handleOpenContextModal = (employee: Employee, e: React.MouseEvent) => {
    e.stopPropagation();
    setContextEmployee(employee);
    setIsContextModalOpen(true);
  };

  // Calculate stats from current employees data
  const stats = useMemo(() => ({
    total: employees.length,
    completed: employees.filter(e => e.status === 'completed').length,
    scheduled: employees.filter(e => e.status === 'scheduled').length,
    pending: employees.filter(e => e.status === 'pending').length,
  }), [employees]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">Employees</h1>
          <p className="text-muted-foreground">Manage employee profiles and interview status</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Employees</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mt-1" />
                ) : (
                  <p className="text-2xl font-display font-semibold text-foreground">{stats.total}</p>
                )}
              </div>
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mt-1" />
                ) : (
                  <p className="text-2xl font-display font-semibold text-success">{stats.completed}</p>
                )}
              </div>
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mt-1" />
                ) : (
                  <p className="text-2xl font-display font-semibold text-warning">{stats.scheduled}</p>
                )}
              </div>
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mt-1" />
                ) : (
                  <p className="text-2xl font-display font-semibold text-muted-foreground">{stats.pending}</p>
                )}
              </div>
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card className="shadow-card">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filters */}
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead 
                    className="font-semibold cursor-pointer select-none hover:bg-muted/80 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Employee
                      {getSortIcon('name')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-semibold cursor-pointer select-none hover:bg-muted/80 transition-colors"
                    onClick={() => handleSort('role')}
                  >
                    <div className="flex items-center">
                      Role
                      {getSortIcon('role')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-semibold cursor-pointer select-none hover:bg-muted/80 transition-colors"
                    onClick={() => handleSort('department')}
                  >
                    <div className="flex items-center">
                      Department
                      {getSortIcon('department')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-semibold cursor-pointer select-none hover:bg-muted/80 transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Interview Status
                      {getSortIcon('status')}
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeleton rows
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-9 h-9 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-40" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Skeleton className="h-6 w-24 rounded-full" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  filteredAndSortedEmployees.map((employee) => (
                    <TableRow
                      key={employee.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/employees/${employee.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{employee.name}</p>
                            <p className="text-xs text-muted-foreground">{employee.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{employee.role}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-muted/50">
                          {employee.department}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(employee)}
                          <span className="text-xs text-muted-foreground">{getStatusDetail(employee)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleOpenContextModal(employee, e)}
                          className="text-xs"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Add Context
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Error state */}
          {error && !isLoading && (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
              <p className="text-destructive font-medium mb-2">Failed to load employees</p>
              <p className="text-muted-foreground text-sm mb-4">{error}</p>
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          )}

          {/* Empty state - only show when not loading and no error */}
          {!isLoading && !error && filteredAndSortedEmployees.length === 0 && (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {employees.length === 0
                  ? "No employees yet. Add your first employee to get started."
                  : "No employees found matching your filters."}
              </p>
              {employees.length === 0 && (
                <Button className="mt-4" onClick={() => setIsAddModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Employee
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Employee Modal */}
      <AddEmployeeModal 
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onAddEmployee={handleAddEmployee}
      />

      {/* Add Context Modal */}
      {contextEmployee && (
        <AddContextModal
          open={isContextModalOpen}
          onOpenChange={setIsContextModalOpen}
          employeeName={contextEmployee.name}
        />
      )}
    </div>
  );
};

export default Employees;
