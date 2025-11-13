import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Market } from '../types';

interface PriceChartProps {
  market: Market;
  betSide: 'yes' | 'no';
}

// Generate mock historical data
const generateMockData = (yesPrice: number, noPrice: number) => {
  const data = [];
  const days = 30;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Simulate price movement with some randomness
    const yesVariation = (Math.random() - 0.5) * 10;
    const noVariation = (Math.random() - 0.5) * 10;
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      timestamp: date.getTime(),
      yes: Math.max(5, Math.min(95, yesPrice - 15 + yesVariation + (i * 0.3))),
      no: Math.max(5, Math.min(95, noPrice - 15 + noVariation + (i * 0.3))),
    });
  }
  
  return data;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-3 shadow-xl">
        <p className="text-xs text-[var(--text-muted)] mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-[var(--text-secondary)] capitalize">{entry.name}:</span>
            <span className="font-semibold text-[var(--text-primary)]">{entry.value.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function PriceChart({ market, betSide }: PriceChartProps) {
  const data = generateMockData(market.yesPrice, market.noPrice);

  return (
    <div className="glass-card rounded-xl p-2 bg-slate-900/50 dark:bg-slate-950/50 relative overflow-hidden">
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-xs font-semibold text-[var(--text-primary)]">Price History</h3>
        <div className="flex gap-2 text-[10px]">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[var(--text-secondary)]">YES {market.yesPrice}%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span className="text-[var(--text-secondary)]">NO {market.noPrice}%</span>
          </div>
        </div>
      </div>
      
      <div className="relative overflow-hidden">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="yesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="noGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgba(255,255,255,0.05)" 
              vertical={false}
            />
            
            <XAxis 
              dataKey="date" 
              stroke="rgba(255,255,255,0.2)"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={30}
            />
            
            <YAxis 
              stroke="rgba(255,255,255,0.2)"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Line 
              type="monotone" 
              dataKey="yes" 
              stroke="#10b981" 
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: '#10b981' }}
              name="yes"
            />
            
            <Line 
              type="monotone" 
              dataKey="no" 
              stroke="#ef4444" 
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: '#ef4444' }}
              name="no"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex gap-1.5 mt-1.5 justify-center">
        {['7D', '1M', '3M', 'ALL'].map((period) => (
          <button
            key={period}
            className="px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] rounded transition-colors"
          >
            {period}
          </button>
        ))}
      </div>
    </div>
  );
}