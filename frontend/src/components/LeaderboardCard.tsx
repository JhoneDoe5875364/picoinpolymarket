
import type { LeaderboardEntry } from '@/lib/types';
import { Card, CardContent } from './ui/card';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from './ui/avatar';

interface LeaderboardCardProps {
  entry: LeaderboardEntry;
}

const getRankColor = (rank: number) => {
  if (rank === 1) return 'text-yellow-400';
  if (rank === 2) return 'text-slate-400';
  if (rank === 3) return 'text-amber-600';
  return 'text-muted-foreground';
}

export function LeaderboardCard({ entry }: LeaderboardCardProps) {
  return (
    <Card className="hover:bg-secondary/50 transition-colors">
      <CardContent className="p-2 md:p-4 flex items-center justify-between gap-2 md:gap-4">
        <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
          <div className={cn("text-2xl font-bold w-10 text-center", getRankColor(entry.rank))}>
            {entry.rank <= 3 ? <Trophy className="inline-block h-6 w-6" /> : entry.rank}
          </div>
          <Avatar>
            <AvatarFallback>{entry.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-lg text-primary truncate">{entry.username}</p>
            <p className="text-sm text-muted-foreground font-mono truncate">{entry.user_id}</p>
          </div>
        </div>

        <div className="sm:flex items-center gap-2 md:gap-4 text-right">
          <div>
            <p className="text-sm text-muted-foreground">Volume</p>
            <p className="font-bold text-lg">{entry.volume.toLocaleString()} π</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Success</p>
            <p className="font-bold text-lg text-green-400">{entry.accuracy}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
