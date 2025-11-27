'use client';

import { useState, useCallback, useEffect } from 'react';
import { SessionFilter } from './SessionFilter';
import { ProjectGroupView } from './ProjectGroupView';
import { SessionSummary } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface SessionListProps {
  initialSessions: SessionSummary[];
  projects: string[];
}

export function SessionList({ initialSessions, projects }: SessionListProps) {
  const [sessions, setSessions] = useState<SessionSummary[]>(initialSessions);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    project: '',
    startDate: '',
    endDate: '',
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 50; // Increased limit for better grouped view

  const fetchSessions = useCallback(async (pageNum: number, reset = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', pageNum.toString());
      params.set('limit', limit.toString());
      if (filters.search) params.set('search', filters.search);
      if (filters.project) params.set('project', filters.project);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);

      const response = await fetch(`/api/sessions?${params.toString()}`);
      const data = await response.json();

      if (reset) {
        setSessions(data.sessions);
      } else {
        setSessions(prev => [...prev, ...data.sessions]);
      }

      setHasMore(pageNum < data.totalPages);
      setTotalCount(data.total || 0);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    setPage(1);
    fetchSessions(1, true);
  }, [filters, fetchSessions]);

  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchSessions(nextPage);
  };

  const handleDelete = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-4 w-full min-w-0">
      <SessionFilter projects={projects} onFilterChange={handleFilterChange} />

      <div className="text-sm text-muted-foreground">
        {sessions.length} of {totalCount || sessions.length} sessions loaded
      </div>

      <ProjectGroupView sessions={sessions} onDelete={handleDelete} />

      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && hasMore && sessions.length > 0 && (
        <div className="flex justify-center py-4">
          <Button variant="outline" onClick={handleLoadMore}>
            Load More
          </Button>
        </div>
      )}

      {!loading && sessions.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No sessions found
        </div>
      )}
    </div>
  );
}
