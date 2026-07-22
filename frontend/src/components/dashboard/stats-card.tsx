import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp } from 'lucide-react';

interface StatsCardProps {
  title: string;
  count: number;
  icon: LucideIcon;
  color: 'red' | 'amber' | 'blue' | 'green';
  onClick?: () => void;
  trend?: string;
}

const colorClasses = {
  red: 'border-l-[3px] border-l-critical',
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

export function StatsCard({ title, count, icon: Icon, color, onClick, trend }: StatsCardProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-all duration-200',
        colorClasses[color],
        'shadow-[0_1px_3px_0_rgba(25,22,21,0.04)]',
        onClick && 'cursor-pointer hover:shadow-[0_4px_12px_0_rgba(25,22,21,0.08)] hover:-translate-y-0.5'
      )}
      onClick={onClick}
    >
      <div className={cn('flex h-11 w-11 items-center justify-center rounded-lg', iconBgClasses[color])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold text-foreground font-serif tracking-tight">{count}</p>
        {trend && (
          <p className="text-[11px] text-success-text font-medium mt-0.5 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}
