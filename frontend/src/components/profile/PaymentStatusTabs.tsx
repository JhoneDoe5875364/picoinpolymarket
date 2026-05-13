'use client';

const baseSegment =
  'cursor-pointer px-4 py-2 text-sm font-semibold border border-border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const selected = 'bg-secondary text-foreground';
const unselected = 'text-muted-foreground hover:text-foreground';

export type PaymentStatusTabValue = 'ALL' | 'PENDING' | 'APPROVED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

const TABS: { value: PaymentStatusTabValue; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

type PaymentStatusTabsProps = {
  activeTab: PaymentStatusTabValue;
  setActiveTab: (tab: PaymentStatusTabValue) => void;
};

export function PaymentStatusTabs({ activeTab, setActiveTab }: PaymentStatusTabsProps) {
  const n = TABS.length;

  return (
    <div className="inline-flex min-w-0 flex-nowrap bg-background p-0">
      {TABS.map((tab, index) => {
        const isFirst = index === 0;
        const isLast = index === n - 1;
        const corners = isFirst ? 'rounded-l-lg' : isLast ? 'rounded-r-lg border-l-0' : 'border-l-0';

        return (
          <div
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setActiveTab(tab.value);
              }
            }}
            role="button"
            tabIndex={0}
            className={`${baseSegment} ${corners} ${activeTab === tab.value ? selected : unselected}`}
          >
            {tab.label}
          </div>
        );
      })}
    </div>
  );
}
