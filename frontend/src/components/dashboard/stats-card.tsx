import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  count: number;
  icon: LucideIcon;
  color: 'red' | 'amber' | 'blue' | 'green';
  onClick?: () => void;
}

const colorClasses = {
  red: 'border-l-[3px] border-l-destructive',
  amber: 'border-l-[3px] border-l-gold',
  blue: 'border-l-[3px] border-l-info',
  green: 'border-l-[3px] border-l-success',
};

const iconBgClasses = {
  red: 'bg-critical-bg text-critical-text',
  amber: 'bg-warning-bg text-gold-dark',
  blue: 'bg-normal-bg text-info',
  green: 'bg-success-bg text-success-text',
};

export function StatsCard({ title, count, icon: Icon, color, onClick }: StatsCardProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-[6px] border border-border bg-card p-3.5 shadow-sm transition-colors',
        colorClasses[color],
        onClick && 'cursor-pointer hover:bg-muted/30'
      )}
      onClick={onClick}
    >
      <div className={cn('flex h-9 w-9 items-center justify-center rounded-[6px]', iconBgClasses[color])}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
        <p className="text-[22px] font-bold text-foreground leading-tight">{count}</p>
      </div>
    </div>
  );
}
