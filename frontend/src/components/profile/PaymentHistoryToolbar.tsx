'use client';

import { Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { PaymentStatusTabs, type PaymentStatusTabValue } from '@/components/profile/PaymentStatusTabs';

type PaymentHistoryToolbarProps = {
  statusFilter: PaymentStatusTabValue;
  onStatusFilterChange: (value: PaymentStatusTabValue) => void;
  sortBy: string;
  sortOptions: readonly string[];
  onSortChange: (value: string) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
};

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

function SearchField({
  searchTerm,
  onSearchTermChange,
  placeholder,
}: {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        className="pl-9"
        value={searchTerm}
        onChange={(event) => onSearchTermChange(event.target.value)}
      />
    </div>
  );
}

export function PaymentHistoryToolbar({
  statusFilter,
  onStatusFilterChange,
  sortBy,
  sortOptions,
  onSortChange,
  searchTerm,
  onSearchTermChange,
}: PaymentHistoryToolbarProps) {
  const searchPlaceholder = 'Search market, Pi payment id, or tx id';

  return (
    <>
      <div className="space-y-3 md:hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1 overflow-x-auto scrollbar-none">
            <PaymentStatusTabs activeTab={statusFilter} setActiveTab={onStatusFilterChange} />
          </div>
          <SortDropdown sortBy={sortBy} sortOptions={sortOptions} onSortChange={onSortChange} />
        </div>
        <SearchField
          searchTerm={searchTerm}
          onSearchTermChange={onSearchTermChange}
          placeholder={searchPlaceholder}
        />
      </div>

      <div className="hidden items-center gap-2 md:flex">
        <div className="min-w-0 shrink overflow-x-auto scrollbar-none">
          <PaymentStatusTabs activeTab={statusFilter} setActiveTab={onStatusFilterChange} />
        </div>
        <SearchField
          searchTerm={searchTerm}
          onSearchTermChange={onSearchTermChange}
          placeholder={searchPlaceholder}
        />
        <SortDropdown sortBy={sortBy} sortOptions={sortOptions} onSortChange={onSortChange} />
      </div>
    </>
  );
}
