import { Plus, Download, Upload, RefreshCw, BarChart3, Settings, Bell } from 'lucide-react'

const QuickActions = ({ 
  actions = [],
  onAction = () => {},
  loading = false,
  className = ''
}) => {
  const defaultActions = [
    {
      id: 'add',
      label: 'Add New',
      icon: Plus,
      color: 'bg-blue-500 hover:bg-blue-600',
      primary: true
    },
    {
      id: 'export',
      label: 'Export',
      icon: Download,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      id: 'import',
      label: 'Import',
      icon: Upload,
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      id: 'refresh',
      label: 'Refresh',
      icon: RefreshCw,
      color: 'bg-gray-500 hover:bg-gray-600'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ]

  const actionList = actions.length > 0 ? actions : defaultActions

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {actionList.map((action) => {
        const Icon = action.icon
        const isPrimary = action.primary
        
        return (
          <button
            key={action.id}
            onClick={() => onAction(action.id, action)}
            disabled={loading}
            className={`
              flex items-center px-4 py-2 rounded-lg text-white font-medium
              transition-all duration-200 transform hover:scale-105
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
              ${isPrimary ? 'px-6 py-3 text-base shadow-lg' : 'text-sm'}
              ${action.color}
            `}
            title={action.tooltip || action.label}
          >
            <Icon className={`${isPrimary ? 'h-5 w-5' : 'h-4 w-4'} mr-2 ${
              loading && action.id === 'refresh' ? 'animate-spin' : ''
            }`} />
            {action.label}
            {action.badge && (
              <span className="ml-2 bg-white/20 text-xs px-2 py-0.5 rounded-full">
                {action.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default QuickActions