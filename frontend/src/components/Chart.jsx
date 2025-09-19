import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react'

const Chart = ({ 
  data = [], 
  type = 'bar', 
  title = 'Chart', 
  height = 'h-64',
  showLegend = true,
  colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500']
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`${height} flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300`}>
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 font-medium">{title}</p>
          <p className="text-sm text-gray-400 mt-1">No data available</p>
        </div>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(item => item.value))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {showLegend && (
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-600">Growth</span>
          </div>
        )}
      </div>
      
      <div className={`${height} flex items-end justify-between space-x-2 p-4 bg-gray-50 rounded-lg`}>
        {data.map((item, index) => {
          const heightPercentage = (item.value / maxValue) * 100
          const colorClass = colors[index % colors.length]
          
          return (
            <div key={item.label || index} className="flex flex-col items-center flex-1">
              <div className="w-full flex flex-col items-center">
                <div className="text-xs font-medium text-gray-700 mb-1">
                  {item.value.toLocaleString()}
                </div>
                <div 
                  className={`w-full ${colorClass} rounded-t transition-all duration-500 hover:opacity-80`}
                  style={{ height: `${Math.max(heightPercentage, 5)}%` }}
                  title={`${item.label}: ${item.value}`}
                />
              </div>
              <div className="text-xs text-gray-600 mt-2 text-center truncate w-full">
                {item.label}
              </div>
            </div>
          )
        })}
      </div>
      
      {data.length > 0 && (
        <div className="flex justify-between text-sm text-gray-500">
          <span>Total: {data.reduce((sum, item) => sum + item.value, 0).toLocaleString()}</span>
          <span>Items: {data.length}</span>
        </div>
      )}
    </div>
  )
}

export default Chart