import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { memo } from 'react';

const data = [
  { date: 'Mon', value: 0 },
  { date: 'Tue', value: 150 },
  { date: 'Wed', value: -80 },
  { date: 'Thu', value: 220 },
  { date: 'Fri', value: 180 },
  { date: 'Sat', value: 340 },
  { date: 'Sun', value: 270 },
];

export const PnLGraph = memo(function PnLGraph() {
  return (
    <div className="glass-card p-4 mb-4 bg-[rgb(158,113,113)] rounded-t-[16px] rounded-b-[0px] outline-none border-none active:border-none focus:border-none">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-[var(--text-primary)] font-semibold">P&L Chart</h3>
          <p className="text-[var(--text-muted)] text-xs">Last 7 days</p>
        </div>
        <div className="flex gap-2">
          <button className="px-2 py-1 text-xs bg-indigo-600 text-white rounded-lg font-medium">7D</button>
          <button className="px-2 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] rounded-lg">1M</button>
          <button className="px-2 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] rounded-lg">3M</button>
        </div>
      </div>
      
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              stroke="#888" 
              style={{ fontSize: '10px' }}
              tickLine={false}
            />
            <YAxis 
              stroke="#888" 
              style={{ fontSize: '10px' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(0,0,0,0.8)', 
                border: 'none', 
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'P&L']}
              isAnimationActive={false}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 3 }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});