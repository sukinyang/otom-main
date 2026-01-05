import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ProcessTable from '@/components/processes/ProcessTable';
import ProcessDetail from '@/components/processes/ProcessDetail';
import { api, Process } from '@/services/api';

const Processes = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProcesses = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const apiProcesses = await api.getProcesses();
      setProcesses(apiProcesses || []);
    } catch (err) {
      console.error('Failed to fetch processes:', err);
      setError('Failed to load processes from server.');
      setProcesses([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProcesses();
  }, []);

  const filteredProcesses = processes.filter(process => {
    return (
      searchQuery === '' ||
      process.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (process.department && process.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (process.description && process.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  if (selectedProcess) {
    return (
      <div className="flex-1 p-6 bg-background">
        <ProcessDetail
          process={selectedProcess}
          onBack={() => setSelectedProcess(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 bg-background">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Processes</h1>
            <p className="text-muted-foreground mt-1">
              Manage and analyze business processes across the organization
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProcesses}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search processes, owners, departments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading processes...</p>
        </div>
      ) : filteredProcesses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-2">No processes found</p>
          {searchQuery && (
            <Button variant="ghost" onClick={() => setSearchQuery('')}>
              Clear search
            </Button>
          )}
        </div>
      ) : (
        /* Process Table */
        <ProcessTable
          processes={filteredProcesses}
          onProcessClick={setSelectedProcess}
        />
      )}
    </div>
  );
};

export default Processes;
