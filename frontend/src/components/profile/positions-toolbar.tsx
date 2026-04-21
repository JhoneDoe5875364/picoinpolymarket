'use client';

import { Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type PositionsToolbarProps = {
  positionFilter: 'active' | 'closed';
  onPositionFilterChange: (value: 'active' | 'closed') => void;
  sortBy: string;
  sortOptions: readonly string[];
  onSortChange: (value: string) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
};

function PositionFilterToggle({
  positionFilter,
  onPositionFilterChange,
  activeClassName,
}: {
  positionFilter: 'active' | 'closed';
  onPositionFilterChange: (value: 'active' | 'closed') => void;
  activeClassName: string;
}) {
  return (
    <div className="flex rounded-lg border border-border p-1">
      <button
        type="button"
        onClick={() => onPositionFilterChange('active')}
        className={cn(
          'rounded-md px-4 py-1.5 text-sm font-semibold transition-colors',
          positionFilter === 'active' ? activeClassName : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Active
      </button>
      <button
        type="button"
        onClick={() => onPositionFilterChange('closed')}
        className={cn(
          'rounded-md px-4 py-1.5 text-sm font-semibold transition-colors',
          positionFilter === 'closed' ? activeClassName : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Closed
      </button>
    </div>
  );
}

function SortDropdown({
  sortBy,
  sortOptions,
  onSortChange,
}: {
  sortBy: string;
  sortOptions: readonly string[];
  onSortChange: (value: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-10 min-w-[7.3rem] justify-between gap-2">
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            {sortBy}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {sortOptions.map((option) => (
          <DropdownMenuItem
            key={option}
            onSelect={() => onSortChange(option)}
            className="flex items-center justify-between"
          >
            {option}
            {sortBy === option ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SearchField({ searchTerm, onSearchTermChange }: { searchTerm: string; onSearchTermChange: (value: string) => void }) {
  return (
    <div className="relative flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search positions"
        className="pl-9"
        value={searchTerm}
        onChange={(event) => onSearchTermChange(event.target.value)}
      />
    </div>
  );
}

export function PositionsToolbar({
  positionFilter,
  onPositionFilterChange,
  sortBy,
  sortOptions,
  onSortChange,
  searchTerm,
  onSearchTermChange,
}: PositionsToolbarProps) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        <div className="flex items-center justify-between gap-2">
          <PositionFilterToggle
            positionFilter={positionFilter}
            onPositionFilterChange={onPositionFilterChange}
            activeClassName="bg-secondary text-foreground shadow-sm"
          />
          <SortDropdown sortBy={sortBy} sortOptions={sortOptions} onSortChange={onSortChange} />
        </div>
        <SearchField searchTerm={searchTerm} onSearchTermChange={onSearchTermChange} />
      </div>

      <div className="hidden items-center gap-2 md:flex">
        <PositionFilterToggle
          positionFilter={positionFilter}
          onPositionFilterChange={onPositionFilterChange}
          activeClassName="bg-background text-foreground shadow-sm"
        />
        <SearchField searchTerm={searchTerm} onSearchTermChange={onSearchTermChange} />
        <SortDropdown sortBy={sortBy} sortOptions={sortOptions} onSortChange={onSortChange} />
      </div>
    </>
  );
}
