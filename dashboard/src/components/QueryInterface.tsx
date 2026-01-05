import React, { useState } from 'react';
import { Search, ArrowUp, Filter, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
const QueryInterface = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const recentQueries = ["Which departments have the highest process dependencies?", "Show me all employees reporting to Operations Manager", "What are the bottlenecks in our customer onboarding process?", "Which processes take the longest to complete?"];
  const suggestedQueries = ["Which employees have the most cross-departmental interactions?", "What processes are causing the most delays?", "Show me the approval workflow for new hires", "Which departments need additional resources?"];
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setQuery('');
    }, 2000);
  };
  return <div className="p-4 pt-8 bg-gray-50 border-t border-gray-200">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Query Input */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 mt-4 px-[16px] my-[60px]">
          <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input type="text" placeholder="Ask about your business processes..." value={query} onChange={e => setQuery(e.target.value)} className="pl-10 pr-4 py-3 text-base" disabled={isLoading} />
            </div>
            <Button type="submit" disabled={!query.trim() || isLoading} className="px-4 py-3">
              {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ArrowUp className="w-5 h-5" />}
            </Button>
            <Button variant="outline" type="button" className="px-4 py-3">
              <Filter className="w-5 h-5" />
            </Button>
          </form>

          {/* Suggested Queries */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Suggested Queries</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {suggestedQueries.map((suggestion, index) => <button key={index} onClick={() => setQuery(suggestion)} className="text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full transition-colors">
                  {suggestion}
                </button>)}
            </div>
          </div>

          {/* Previous Queries */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Previous Queries</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {recentQueries.map((recentQuery, index) => <button key={index} onClick={() => setQuery(recentQuery)} className="text-left text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 p-2 rounded-md transition-colors">
                  {recentQuery}
                </button>)}
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default QueryInterface;