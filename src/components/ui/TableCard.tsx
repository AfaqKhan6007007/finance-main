import { TrendingUp, TrendingDown, DollarSign, Wallet, LucideIcon, FileText, CheckCircle, AlertCircle, Clock  } from 'lucide-react';

const iconMap: { [key: string]: LucideIcon } = {
  TrendingUp,
  TrendingDown, 
  DollarSign,
  Wallet,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock
};


interface CardProps{
    title: string;
    value: string;
    icon: string;
    trend?: string;
    trendValue?: string;
    className?: string;
}

export default function Card({ title, value, icon, trend, trendValue, className = '' }: CardProps) {

  const IconComponent = iconMap[icon];

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all duration-300 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{value}</h3>
          {trend && (
            <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
              <span>{trend === 'up' ? '↑' : '↓'}</span>
              <span>{trendValue}</span>
              <span className="text-gray-500 dark:text-gray-400">vs last month</span>
            </div>
          )}
        </div>
        {IconComponent && (
          <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
            <IconComponent className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
        )}
      </div>
    </div>
  );
}
