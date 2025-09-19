import { useState, useMemo } from 'react'

// Helper function to get nested values
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

export const useSearch = (data, searchFields = []) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('')

  const filteredData = useMemo(() => {
    let filtered = data

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item => {
        return searchFields.some(field => {
          const value = getNestedValue(item, field)
          return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        })
      })
    }

    // Apply category/type filter
    if (activeFilter) {
      filtered = filtered.filter(item => {
        // Check multiple possible filter fields
        const filterFields = ['category', 'type', 'status']
        return filterFields.some(field => {
          const value = getNestedValue(item, field)
          return value && value.toString().toLowerCase() === activeFilter.toLowerCase()
        })
      })
    }

    return filtered
  }, [data, searchTerm, activeFilter, searchFields])



  return {
    searchTerm,
    setSearchTerm,
    activeFilter,
    setActiveFilter,
    filteredData
  }
}

export default useSearch