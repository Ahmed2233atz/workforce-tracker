const colorMap = {
  green: {
    ring: 'bg-success-100',
    text: 'text-success-600',
    trend_up: 'text-success-600',
    trend_down: 'text-danger-600',
  },
  blue: {
    ring: 'bg-blue-100',
    text: 'text-blue-600',
    trend_up: 'text-success-600',
    trend_down: 'text-danger-600',
  },
  amber: {
    ring: 'bg-warning-100',
    text: 'text-warning-600',
    trend_up: 'text-success-600',
    trend_down: 'text-danger-600',
  },
  red: {
    ring: 'bg-danger-100',
    text: 'text-danger-600',
    trend_up: 'text-success-600',
    trend_down: 'text-danger-600',
  },
  indigo: {
    ring: 'bg-primary-100',
    text: 'text-primary-600',
    trend_up: 'text-success-600',
    trend_down: 'text-danger-600',
  },
  purple: {
    ring: 'bg-purple-100',
    text: 'text-purple-600',
    trend_up: 'text-success-600',
    trend_down: 'text-danger-600',
  },
}

export default function StatCard({ title, value, subtitle, icon, color = 'indigo', trend }) {
  const colors = colorMap[color] || colorMap.indigo

  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 truncate">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500 truncate">{subtitle}</p>
          )}
          {trend !== undefined && trend !== null && (
            <div className={`mt-1 flex items-center gap-1 text-xs font-medium ${trend >= 0 ? colors.trend_up : colors.trend_down}`}>
              <span>{trend >= 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(trend)}% vs last week</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`stat-ring ${colors.ring} ml-4`}>
            <span className={`text-xl ${colors.text}`}>{icon}</span>
          </div>
        )}
      </div>
    </div>
  )
}
