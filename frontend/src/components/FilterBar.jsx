import { Filter, X, Calendar, DollarSign, Package } from 'lucide-react'
import { useState } from 'react'

const FilterBar = ({ 
  filters = [], 
  activeFilters = {}, 
  onFilterChange = () => {},
  onClearFilters = () => {},
  showDateRange = false,
  showPriceRange = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })

  const handleFilterToggle = (filterKey, value) => {
    const currentValues = activeFilters[filterKey] || []
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value]
    
    onFilterChange({ ...activeFilters, [filterKey]: newValues })
  }

  const handleDateRangeChange = (field, value) => {
    const newRange = { ...dateRange, [field]: value }
    setDateRange(newRange)
    onFilterChange({ ...activeFilters, dateRange: newRange })
  }

  const handlePriceRangeChange = (field, value) => {
    const newRange = { ...priceRange, [field]: value }
    setPriceRange(newRange)
    onFilterChange({ ...activeFilters, priceRange: newRange })
  }

  const activeFilterCount = Object.values(activeFilters).flat().length

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <span className="font-medium text-gray-700">Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {activeFilterCount > 0 && (
            <button
              onClick={onClearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
            >
              <X className="h-4 w-4 mr-1" />
              Clear all
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {isExpanded ? 'Less' : 'More'} filters
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Category Filters */}
          {filters.map((filterGroup) => (
            <div key={filterGroup.key} className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {filterGroup.label}
              </label>
              <div className="flex flex-wrap gap-2">
                {filterGroup.options.map((option) => {
                  const isActive = (activeFilters[filterGroup.key] || []).includes(option.value)
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleFilterToggle(filterGroup.key, option.value)}
                      className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Date Range Filter */}
          {showDateRange && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                  className="input-field text-sm"
                  placeholder="Start date"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                  className="input-field text-sm"
                  placeholder="End date"
                />
              </div>
            </div>
          )}

          {/* Price Range Filter */}
          {showPriceRange && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                Price Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={priceRange.min}
                  onChange={(e) => handlePriceRangeChange('min', e.target.value)}
                  className="input-field text-sm"
                  placeholder="Min price"
                />
                <input
                  type="number"
                  value={priceRange.max}
                  onChange={(e) => handlePriceRangeChange('max', e.target.value)}
                  className="input-field text-sm"
                  placeholder="Max price"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FilterBar