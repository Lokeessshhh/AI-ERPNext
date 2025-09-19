import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Package, Users, TrendingUp, BarChart3, Bell, Settings, User } from 'lucide-react'
import AIAssistant from './AIAssistant'
import NotificationCenter from './NotificationCenter'

const Layout = ({ children }) => {
  const location = useLocation()
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'warning',
      title: 'Low Stock Alert',
      message: '5 products are running low on stock',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      read: false
    },
    {
      id: 2,
      type: 'success',
      title: 'Transaction Complete',
      message: 'Sale transaction #1234 processed successfully',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      read: false
    },
    {
      id: 3,
      type: 'info',
      title: 'New Supplier Added',
      message: 'TechCorp has been added to your suppliers',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      read: true
    }
  ])

  const handleDismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }
  
  const navigation = [
    { name: 'Dashboard', href: '/', icon: BarChart3 },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Suppliers', href: '/suppliers', icon: Users },
    { name: 'Transactions', href: '/transactions', icon: TrendingUp },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <div className="fixed top-0 left-64 right-0 z-40 bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <NotificationCenter
              notifications={notifications}
              onDismiss={handleDismissNotification}
              onMarkAllRead={handleMarkAllRead}
            />
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
              <Settings className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
              <User className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex h-16 items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary-600">Mini ERP Lite</h1>
        </div>
        
        <nav className="mt-6 px-3">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-2 mb-1 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="pl-64 pt-16">
        <main className="py-6 px-8">
          {children}
        </main>
      </div>

      {/* AI Assistant */}
      <AIAssistant />
    </div>
  )
}

export default Layout