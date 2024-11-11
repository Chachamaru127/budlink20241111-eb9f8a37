"use client"

import { useState, useEffect, useCallback } from 'react'
import { IoFilterSharp, IoRefreshOutline } from 'react-icons/io5'
import { debounce } from 'lodash'

interface FilterOption {
  value: string | number
  label: string
}

interface FilterObject {
  id: string
  label: string
  type: 'select' | 'range' | 'text'
  options?: FilterOption[]
  min?: number
  max?: number
}

interface SearchFilterProps {
  filters: FilterObject[]
  onFilter: (filterValues: any) => void
}

interface RangeValues {
  min: number
  max: number
}

const SearchFilter = ({ filters, onFilter }: SearchFilterProps) => {
  const initialFilterValues = filters.reduce((acc: any, filter) => {
    if (filter.type === 'range') {
      acc[filter.id] = { min: filter.min || 0, max: filter.max || 10000 }
    } else {
      acc[filter.id] = ''
    }
    return acc
  }, {})

  const [filterValues, setFilterValues] = useState(initialFilterValues)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const debouncedFilter = useCallback(
    debounce((values: any) => {
      onFilter(values)
    }, 500),
    [onFilter]
  )

  const handleInputChange = (filterId: string, value: string | RangeValues) => {
    const newValues = { ...filterValues, [filterId]: value }
    setFilterValues(newValues)

    if (typeof value === 'object' && 'min' in value) {
      const { min, max } = value
      if (min < 0) {
        setErrors({ ...errors, [filterId]: '0以上の値を入力してください' })
        return
      }
      setErrors({ ...errors, [filterId]: '' })
    }

    debouncedFilter(newValues)
  }

  const handleReset = () => {
    setFilterValues(initialFilterValues)
    setErrors({})
    onFilter(initialFilterValues)
  }

  const handleApply = () => {
    onFilter(filterValues)
  }

  const renderFilter = (filter: FilterObject) => {
    switch (filter.type) {
      case 'select':
        return (
          <select
            className="w-full p-2 border rounded-md"
            value={filterValues[filter.id]}
            onChange={(e) => handleInputChange(filter.id, e.target.value)}
            aria-label={filter.label}
          >
            <option value="">すべて</option>
            {filter.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'range':
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="number"
                className="w-1/2 p-2 border rounded-md"
                value={filterValues[filter.id].min}
                onChange={(e) =>
                  handleInputChange(filter.id, {
                    ...filterValues[filter.id],
                    min: parseInt(e.target.value),
                  })
                }
                min={0}
                aria-label="最小価格"
              />
              <span className="flex items-center">-</span>
              <input
                type="number"
                className="w-1/2 p-2 border rounded-md"
                value={filterValues[filter.id].max}
                onChange={(e) =>
                  handleInputChange(filter.id, {
                    ...filterValues[filter.id],
                    max: parseInt(e.target.value),
                  })
                }
                min={0}
                aria-label="最大価格"
              />
            </div>
            {errors[filter.id] && (
              <p className="text-red-500 text-sm">{errors[filter.id]}</p>
            )}
          </div>
        )

      case 'text':
        return (
          <input
            type="text"
            className="w-full p-2 border rounded-md"
            value={filterValues[filter.id]}
            onChange={(e) => handleInputChange(filter.id, e.target.value)}
            placeholder={`${filter.label}を入力`}
            aria-label={filter.label}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex items-center gap-2 mb-4">
        <IoFilterSharp className="text-xl text-gray-600" />
        <h2 className="text-lg font-semibold">検索フィルター</h2>
      </div>

      <div className="space-y-4">
        {filters.map((filter) => (
          <div key={filter.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {filter.label}
            </label>
            {renderFilter(filter)}
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-6">
        <button
          onClick={handleReset}
          className="flex items-center gap-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          <IoRefreshOutline />
          リセット
        </button>
        <button
          onClick={handleApply}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          適用
        </button>
      </div>
    </div>
  )
}

export default SearchFilter