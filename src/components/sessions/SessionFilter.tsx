'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, Filter } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface SessionFilterProps {
  projects: string[];
  onFilterChange: (filters: {
    search: string;
    project: string;
    startDate: string;
    endDate: string;
  }) => void;
}

export function SessionFilter({ projects, onFilterChange }: SessionFilterProps) {
  const [search, setSearch] = useState('');
  const [project, setProject] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    onFilterChange({
      search,
      project: project === 'all' ? '' : project,
      startDate,
      endDate,
    });
  }, [search, project, startDate, endDate, onFilterChange]);

  const handleClear = () => {
    setSearch('');
    setProject('all');
    setStartDate('');
    setEndDate('');
  };

  const hasFilters = search || project !== 'all' || startDate || endDate;
  const activeFilterCount = [search, project !== 'all' ? project : '', startDate, endDate].filter(Boolean).length;

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center w-full">
      {/* Search input - always visible */}
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search sessions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 w-full"
        />
      </div>

      {/* Desktop filters */}
      <div className="hidden md:flex items-center gap-2">
        <Select value={project} onValueChange={setProject}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-[140px]"
          placeholder="Start date"
        />

        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-[140px]"
          placeholder="End date"
        />

        {hasFilters && (
          <Button variant="ghost" size="icon" onClick={handleClear}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Mobile filter button */}
      <div className="flex md:hidden items-center gap-2">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project</label>
                <Select value={project} onValueChange={setProject}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {hasFilters && (
                  <Button variant="outline" onClick={handleClear} className="flex-1">
                    Clear Filters
                  </Button>
                )}
                <Button onClick={() => setIsOpen(false)} className="flex-1">
                  Apply
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {hasFilters && (
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleClear}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
