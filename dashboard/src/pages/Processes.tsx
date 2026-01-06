import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import ProcessTable from '@/components/processes/ProcessTable';
import ProcessDetail from '@/components/processes/ProcessDetail';
import { processData, Process } from '@/data/processData';

const Processes = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);

  const filteredProcesses = processData.filter(process => {
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
        </div>

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
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Process Table */}
      <ProcessTable
        processes={filteredProcesses}
        onProcessClick={setSelectedProcess}
      />
    </div>
  );
};

export default Processes;
