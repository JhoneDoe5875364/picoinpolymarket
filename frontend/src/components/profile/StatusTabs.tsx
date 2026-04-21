'use client'

export default function StatusTabs({ activeTab, setActiveTab }: { activeTab: 'active' | 'closed', setActiveTab: (tab: 'active' | 'closed') => void }) {

  return (
    <div className="inline-flex bg-background p-0">
      {/* Active */}
      <div
        onClick={() => setActiveTab('active')}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            setActiveTab('active')
          }
        }}
        role="button"
        tabIndex={0}
        className={`cursor-pointer px-4 py-2 text-sm font-semibold rounded-l-lg border border-border transition
          ${activeTab === 'active'
            ? 'bg-secondary text-foreground'
            : 'text-muted-foreground hover:text-foreground'}
        `}
      >
        Active
      </div>

      {/* Closed */}
      <div
        onClick={() => setActiveTab('closed')}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            setActiveTab('closed')
          }
        }}
        role="button"
        tabIndex={0}
        className={`cursor-pointer px-4 py-2 text-sm font-semibold rounded-r-lg border border-border border-l-0 transition
          ${activeTab === 'closed'
            ? 'bg-secondary text-foreground'
            : 'text-muted-foreground hover:text-foreground'}
        `}
      >
        Closed
      </div>
    </div>
  )
}