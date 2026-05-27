import { createContext, useContext, useState, type ReactNode } from 'react'
import { subMonths } from 'date-fns'
import type { DateRange } from 'react-day-picker'

interface DateFilterContextType {
  dateRange: DateRange | undefined
  setDateRange: (range: DateRange | undefined) => void
}

const DateFilterContext = createContext<DateFilterContextType | null>(null)

export function DateFilterProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  })

  return (
    <DateFilterContext.Provider value={{ dateRange, setDateRange }}>
      {children}
    </DateFilterContext.Provider>
  )
}

export function useDateFilter() {
  const context = useContext(DateFilterContext)
  if (!context) {
    throw new Error('useDateFilter must be used within a DateFilterProvider')
  }
  return context
}
