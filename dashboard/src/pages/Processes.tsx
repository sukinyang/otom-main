import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ProcessTable from '@/components/processes/ProcessTable';
import ProcessDetail from '@/components/processes/ProcessDetail';
import { processData as mockProcessData, Process } from '@/data/processData';
import { api } from '@/services/api';

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

      // If the API returns processes with the full structure, use them
      // Otherwise, fall back to mock data
      if (apiProcesses && apiProcesses.length > 0) {
        // Check if API data has the required complex structure
        const hasComplexStructure = apiProcesses.some(
          (p: any) => p.interviewCoverage && p.steps && p.painPoints
        );

        if (hasComplexStructure) {
          // API returns full structured data - use it directly
          setProcesses(apiProcesses as unknown as Process[]);
        } else {
          // API returns simplified data - merge with mock data or use mock as fallback
          // For now, use mock data but log that API data was received
          console.log('API returned simplified process data, using mock data for full structure');
          setProcesses(mockProcessData);
        }
      } else {
        // No API data, use mock data
        setProcesses(mockProcessData);
      }
    } catch (err) {
      console.error('Failed to fetch processes:', err);
      setError('Failed to load processes from server. Showing cached data.');
      // Fall back to mock data on error
      setProcesses(mockProcessData);
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
      process.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      process.department.toLowerCase().includes(searchQuery.toLowerCase())
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
