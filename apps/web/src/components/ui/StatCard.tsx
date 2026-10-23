import * as React from 'react';
import { Card, CardContent } from './Card';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({ title, value, description, trend, icon, className }: StatCardProps) {
  return (
    <Card className={cn('overflow-hidden relative', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          {icon && (
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              {icon}
            </div>
          )}
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </h2>
          {trend && (
            <span
              className={cn(
                'text-xs font-semibold inline-flex items-center',
                trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              )}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
