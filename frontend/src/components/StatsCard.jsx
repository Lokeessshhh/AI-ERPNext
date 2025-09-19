import { ArrowUp, ArrowDown, TrendingUp } from 'lucide-react'

const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'bg-blue-500',
  trend = null,
  trendUp = true,
  subtitle = null,
  onClick = null,
  loading = false
}) => {
  const cardClasses = `card hover:shadow-lg transition-all duration-200 ${
    onClick ? 'cursor-pointer hover:scale-105' : ''
  }`

  if (loading) {
    return (
      <div className={cardClasses}>
        <div className="animate-pulse">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${color} opacity-50`}>
              <div className="h-6 w-6 bg-white/20 rounded"></div>
            </div>
            <div className="ml-4 flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cardClasses} onClick={onClick}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`p-3 rounded-lg ${color} shadow-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        
        {trend && (
          <div className={`flex items-center text-sm font-medium ${
            trendUp ? 'text-green-600' : 'text-red-600'
          }`}>
            {trendUp ? (
              <ArrowUp className="h-4 w-4 mr-1" />
            ) : (
              <ArrowDown className="h-4 w-4 mr-1" />
            )}
            {trend}
          </div>
        )}
      </div>
      
      {/* Progress bar for visual appeal */}
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div 
            className={`h-1 rounded-full ${color} transition-all duration-1000`}
            style={{ width: '75%' }}
          />
        </div>
      </div>
    </div>
  )
}

export default StatsCard