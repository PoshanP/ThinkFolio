import { TrendingUp } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
}

export function StatsCard({ title, value, icon, trend }: StatsCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <div className="text-gray-400">
          {icon}
        </div>
        {trend && (
          <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
        {title}
      </p>
    </div>
  );
}