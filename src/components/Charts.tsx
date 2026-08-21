import React from 'react';

// --- Donut Chart for Fund Sources ---
interface DonutChartProps {
  contributions: number;
  sponsorships: number;
  chandhalu: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({ contributions, sponsorships, chandhalu }) => {
  const total = contributions + sponsorships + chandhalu;
  const cPercent = total > 0 ? (contributions / total) * 100 : 0;
  const sPercent = total > 0 ? (sponsorships / total) * 100 : 0;
  const chPercent = total > 0 ? (chandhalu / total) * 100 : 0;

  // SVG parameters
  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  // Dash arrays and offsets for each sector
  const cDash = `${(cPercent / 100) * circumference} ${circumference}`;
  
  const sDash = `${(sPercent / 100) * circumference} ${circumference}`;
  const sOffset = -((cPercent / 100) * circumference);

  const chDash = `${(chPercent / 100) * circumference} ${circumference}`;
  const chOffset = -(((cPercent + sPercent) / 100) * circumference);

  return (
    <div className="flex items-center gap-6 bg-white border border-border-custom p-4.5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          <defs>
            <linearGradient id="maroonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8E2D32" />
              <stop offset="100%" stopColor="#52171B" />
            </linearGradient>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F5D078" />
              <stop offset="100%" stopColor="#A87A2A" />
            </linearGradient>
            <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2BB8A8" />
              <stop offset="100%" stopColor="#104D47" />
            </linearGradient>
          </defs>
          
          {/* Base empty circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            className="stroke-secondary-bg fill-none"
            strokeWidth="11"
          />
          
          {/* Contributions (Maroon) */}
          {cPercent > 0 && (
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke="url(#maroonGrad)"
              className="fill-none transition-all duration-500"
              strokeWidth="11"
              strokeDasharray={cDash}
              strokeDashoffset={0}
              strokeLinecap="round"
            />
          )}

          {/* Sponsorships (Gold) */}
          {sPercent > 0 && (
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke="url(#goldGrad)"
              className="fill-none transition-all duration-500"
              strokeWidth="11"
              strokeDasharray={sDash}
              strokeDashoffset={sOffset}
              strokeLinecap="round"
            />
          )}

          {/* Public Donations (Teal) */}
          {chPercent > 0 && (
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke="url(#tealGrad)"
              className="fill-none transition-all duration-500"
              strokeWidth="11"
              strokeDasharray={chDash}
              strokeDashoffset={chOffset}
              strokeLinecap="round"
            />
          )}
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-[9px] text-secondary-text font-bold uppercase tracking-wider">Total</span>
          <span className="text-xs font-black text-primary-text">₹{(total).toLocaleString()}</span>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col gap-2.5">
        {/* Members row */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-2 h-2 rounded-full bg-primary-maroon shrink-0 animate-pulse" />
              <span className="font-bold text-secondary-text uppercase truncate">Committee</span>
            </div>
            <span className="font-extrabold text-primary-text">₹{contributions.toLocaleString()}</span>
          </div>
          <div className="h-1 w-full bg-secondary-bg rounded-full overflow-hidden mt-0.5">
            <div className="h-full bg-primary-maroon rounded-full transition-all duration-500" style={{ width: `${cPercent}%` }} />
          </div>
        </div>

        {/* Sponsors row */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-2 h-2 rounded-full bg-antique-gold shrink-0 animate-pulse" />
              <span className="font-bold text-secondary-text uppercase truncate">Sponsors</span>
            </div>
            <span className="font-extrabold text-primary-text">₹{sponsorships.toLocaleString()}</span>
          </div>
          <div className="h-1 w-full bg-secondary-bg rounded-full overflow-hidden mt-0.5">
            <div className="h-full bg-antique-gold rounded-full transition-all duration-500" style={{ width: `${sPercent}%` }} />
          </div>
        </div>

        {/* Public row */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-2 h-2 rounded-full bg-soft-teal shrink-0 animate-pulse" />
              <span className="font-bold text-secondary-text uppercase truncate">Public</span>
            </div>
            <span className="font-extrabold text-primary-text">₹{chandhalu.toLocaleString()}</span>
          </div>
          <div className="h-1 w-full bg-secondary-bg rounded-full overflow-hidden mt-0.5">
            <div className="h-full bg-soft-teal rounded-full transition-all duration-500" style={{ width: `${chPercent}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Bar Chart for Income vs Expenses ---
interface BarChartProps {
  income: number;
  expenses: number;
}

export const BarChart: React.FC<BarChartProps> = ({ income, expenses }) => {
  const max = Math.max(income, expenses, 1);
  const incHeight = (income / max) * 100;
  const expHeight = (expenses / max) * 100;

  return (
    <div className="bg-white border border-border-custom p-5 rounded-2xl flex flex-col shadow-sm">
      <div className="h-32 flex items-end gap-8 px-6 pb-2 border-b border-border-custom">
        {/* Income Bar */}
        <div className="flex-1 flex flex-col items-center h-full justify-end group">
          <div className="text-xs font-black text-primary-maroon mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
            ₹{(income / 1000).toFixed(1)}k
          </div>
          <div 
            style={{ height: `${incHeight}%` }}
            className="w-full bg-primary-maroon rounded-t-lg transition-all duration-700 ease-out shadow-[0_0_15px_rgba(110,31,36,0.08)]"
          />
          <span className="text-[10px] text-secondary-text mt-2 font-bold uppercase tracking-wider">Income</span>
        </div>
        
        {/* Expenses Bar */}
        <div className="flex-1 flex flex-col items-center h-full justify-end group">
          <div className="text-xs font-black text-error mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
            ₹{(expenses / 1000).toFixed(1)}k
          </div>
          <div 
            style={{ height: `${expHeight}%` }}
            className="w-full bg-error rounded-t-lg transition-all duration-700 ease-out shadow-[0_0_15px_rgba(163,58,50,0.08)]"
          />
          <span className="text-[10px] text-secondary-text mt-2 font-bold uppercase tracking-wider">Expenses</span>
        </div>
      </div>
    </div>
  );
};

// --- Category Bar List ---
interface CategoryItem {
  category: string;
  amount: number;
}

interface CategoryBarsProps {
  data: CategoryItem[];
}

export const CategoryBars: React.FC<CategoryBarsProps> = ({ data }) => {
  const max = data.length > 0 ? Math.max(...data.map(d => d.amount), 1) : 1;

  return (
    <div className="bg-white border border-border-custom p-5 rounded-2xl flex flex-col gap-4 shadow-sm">
      {data.map((item, idx) => {
        const percent = (item.amount / max) * 100;
        return (
          <div key={idx} className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-secondary-text uppercase tracking-wider">{item.category}</span>
              <span className="font-extrabold text-primary-text">₹{item.amount.toLocaleString()}</span>
            </div>
            <div className="h-2 w-full bg-secondary-bg rounded-full overflow-hidden">
              <div 
                style={{ width: `${percent}%` }}
                className="h-full bg-primary-maroon rounded-full transition-all duration-500"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// --- Line Chart for Monthly Financial Trend ---
interface TrendItem {
  month: string;
  balance: number;
}

interface LineChartProps {
  data: TrendItem[];
}

export const LineChart: React.FC<LineChartProps> = ({ data }) => {
  if (data.length === 0) return null;

  const balances = data.map(d => d.balance);
  const minBalance = Math.min(...balances, 0);
  const maxBalance = Math.max(...balances, 1000);
  const range = maxBalance - minBalance;

  // Chart coordinates calculation
  const width = 300;
  const height = 120;
  const paddingX = 20;
  const paddingY = 15;

  const points = data.map((item, index) => {
    const x = paddingX + (index * (width - 2 * paddingX)) / (data.length - 1);
    const y = height - paddingY - ((item.balance - minBalance) / range) * (height - 2 * paddingY);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="bg-white border border-border-custom p-4 rounded-2xl shadow-sm">
      <svg className="w-full h-32" viewBox={`0 0 ${width} ${height}`}>
        {/* Horizontal gridlines */}
        <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} className="stroke-secondary-bg" strokeDasharray="3,3" />
        <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} className="stroke-secondary-bg" strokeDasharray="3,3" />
        <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} className="stroke-secondary-bg" strokeDasharray="3,3" />

        {/* Gradient under the line */}
        <defs>
          <linearGradient id="trend-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6E1F24" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#6E1F24" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Fill Area */}
        {data.length > 1 && (
          <polygon
            points={`${paddingX},${height - paddingY} ${points} ${width - paddingX},${height - paddingY}`}
            className="fill-[url(#trend-grad)]"
          />
        )}

        {/* Line */}
        <polyline
          fill="none"
          stroke="#6E1F24"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          className="drop-shadow-[0_2px_4px_rgba(110,31,36,0.06)]"
        />

        {/* Dots on line */}
        {data.map((item, index) => {
          const x = paddingX + (index * (width - 2 * paddingX)) / (data.length - 1);
          const y = height - paddingY - ((item.balance - minBalance) / range) * (height - 2 * paddingY);
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="4"
              className="fill-antique-gold stroke-white"
              strokeWidth="2"
            />
          );
        })}
      </svg>

      <div className="flex justify-between items-center px-4 mt-1 text-[9px] font-bold text-secondary-text">
        {data.map((item, idx) => (
          <span key={idx}>{item.month}</span>
        ))}
      </div>
    </div>
  );
};

export const ExpenseByCategoryChart: React.FC<{ data: Record<string, number> }> = ({ data }) => {
  const chartData = Object.entries(data).map(([category, amount]) => ({
    category,
    amount
  }));
  return <CategoryBars data={chartData} />;
};

