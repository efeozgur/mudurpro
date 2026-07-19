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
  red: 'border-red-200 bg-red-50 text-red-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  blue: 'border-blue-200 bg-blue-50 text-blue-700',
  green: 'border-green-200 bg-green-50 text-green-700',
};

const iconBgClasses = {
  red: 'bg-red-100',
  amber: 'bg-amber-100',
  blue: 'bg-blue-100',
  green: 'bg-green-100',
};

export function StatsCard({ title, count, icon: Icon, color, onClick }: StatsCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-colors',
        colorClasses[color],
        onClick && 'cursor-pointer hover:opacity-80'
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-1">{count}</p>
        </div>
        <div className={cn('rounded-full p-2.5', iconBgClasses[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
