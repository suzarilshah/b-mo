import { useState } from 'react'
import { startOfToday, startOfWeek, startOfMonth, startOfQuarter, startOfYear, subDays, format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export type TimeRange = {
  startDate: string
  endDate: string
  label: string
}

type TimeFilterOption = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'

interface TimeFilterProps {
  value: TimeRange
  onChange: (range: TimeRange) => void
}

export function TimeFilter({ value, onChange }: TimeFilterProps) {
  const [selectedOption, setSelectedOption] = useState<TimeFilterOption>('month')
  const [customStart, setCustomStart] = useState<string>('')
  const [customEnd, setCustomEnd] = useState<string>('')

  const getDateRange = (option: TimeFilterOption): TimeRange => {
    const today = new Date()
    let start: Date
    let label: string

    switch (option) {
      case 'today':
        start = startOfToday()
        label = 'Today'
        break
      case 'week':
        start = startOfWeek(today, { weekStartsOn: 1 })
        label = 'This Week'
        break
      case 'month':
        start = startOfMonth(today)
        label = 'This Month'
        break
      case 'quarter':
        start = startOfQuarter(today)
        label = 'This Quarter'
        break
      case 'year':
        start = startOfYear(today)
        label = 'This Year'
        break
      case 'custom':
        if (customStart && customEnd) {
          return {
            startDate: customStart,
            endDate: customEnd,
            label: `${format(new Date(customStart), 'MMM d')} - ${format(new Date(customEnd), 'MMM d, yyyy')}`,
          }
        }
        return value
      default:
        start = startOfMonth(today)
        label = 'This Month'
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      label,
    }
  }

  const handleOptionChange = (option: TimeFilterOption) => {
    setSelectedOption(option)
    if (option !== 'custom') {
      const range = getDateRange(option)
      onChange(range)
    }
  }

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      if (new Date(customStart) > new Date(customEnd)) {
        alert('Start date must be before end date')
        return
      }
      const range = getDateRange('custom')
      onChange(range)
    }
  }

  return (
    <Card className="glass-card">
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700 mr-2">Time Period:</span>
          <Button
            variant={selectedOption === 'today' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleOptionChange('today')}
            className={selectedOption === 'today' ? 'bg-teal-600 hover:bg-teal-700' : ''}
          >
            Today
          </Button>
          <Button
            variant={selectedOption === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleOptionChange('week')}
            className={selectedOption === 'week' ? 'bg-teal-600 hover:bg-teal-700' : ''}
          >
            This Week
          </Button>
          <Button
            variant={selectedOption === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleOptionChange('month')}
            className={selectedOption === 'month' ? 'bg-teal-600 hover:bg-teal-700' : ''}
          >
            This Month
          </Button>
          <Button
            variant={selectedOption === 'quarter' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleOptionChange('quarter')}
            className={selectedOption === 'quarter' ? 'bg-teal-600 hover:bg-teal-700' : ''}
          >
            This Quarter
          </Button>
          <Button
            variant={selectedOption === 'year' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleOptionChange('year')}
            className={selectedOption === 'year' ? 'bg-teal-600 hover:bg-teal-700' : ''}
          >
            This Year
          </Button>
          <Button
            variant={selectedOption === 'custom' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleOptionChange('custom')}
            className={selectedOption === 'custom' ? 'bg-teal-600 hover:bg-teal-700' : ''}
          >
            Custom
          </Button>
          
          {selectedOption === 'custom' && (
            <div className="flex items-center gap-2 ml-4">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <Button
                size="sm"
                onClick={handleCustomApply}
                disabled={!customStart || !customEnd}
                className="bg-teal-600 hover:bg-teal-700"
              >
                Apply
              </Button>
            </div>
          )}
          <div className="ml-auto text-sm text-gray-600">
            {value.label}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

