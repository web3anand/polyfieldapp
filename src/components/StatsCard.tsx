import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

export function StatsCard({ title, value, icon: Icon, change, changeType = 'neutral' }: StatsCardProps) {
  return (
    <div className="glass-card rounded-2xl p-5 hover-glow transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-medium">{title}</span>
        <div className="w-9 h-9 bg-indigo-500/10 rounded-lg flex items-center justify-center">
          <Icon className="w-4 h-4 text-indigo-500" />
        </div>
      </div>
      <div className="text-2xl font-semibold text-[var(--text-primary)] mb-1">{value}</div>
      {change && (
        <div className={`text-xs font-medium ${
          changeType === 'positive' ? 'text-emerald-500' : 
          changeType === 'negative' ? 'text-rose-500' : 
          'text-[var(--text-secondary)]'
        }`}>
          {change}
        </div>
      )}
    </div>
  );
}
