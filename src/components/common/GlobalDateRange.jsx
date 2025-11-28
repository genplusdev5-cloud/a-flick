'use client'

import { useState, forwardRef, useEffect } from 'react'
import { format } from 'date-fns'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import CustomTextField from '@core/components/mui/TextField'

const formatDate = date => (date ? format(date, 'dd/MM/yyyy') : '')

const GlobalDateRange = ({ label = '', onSelectRange, start, end, disabled = false }) => {
  const [localStart, setLocalStart] = useState(start)
  const [localEnd, setLocalEnd] = useState(end)

  // 🛑 Prevent infinite loop
  useEffect(() => {
    if (start !== localStart) setLocalStart(start)
    if (end !== localEnd) setLocalEnd(end)
  }, [start, end])

  // 🛑 Prevent infinite loop parent sync
  useEffect(() => {
    if (!disabled && localStart && localEnd) {
      if (start !== localStart || end !== localEnd) {
        onSelectRange?.({ start: localStart, end: localEnd })
      }
    }
  }, [localStart, localEnd, disabled])

  const onChange = dates => {
    if (disabled) return
    const [s, e] = dates
    setLocalStart(s)
    setLocalEnd(e)
  }

  const safeStart = localStart || new Date()
  const safeEnd = localEnd || safeStart

  const displayValue = `${formatDate(safeStart)} - ${formatDate(safeEnd)}`

  const CustomInput = forwardRef(({ onClick }, ref) => (
    <CustomTextField
      fullWidth
      label={label}
      inputRef={ref}
      value={displayValue}
      onClick={disabled ? undefined : onClick}
      readOnly
      disabled={disabled}
      sx={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1
      }}
    />
  ))

  return (
    <AppReactDatepicker
      selectsRange
      disabled={disabled}
      startDate={localStart}
      endDate={localEnd}
      onChange={onChange}
      shouldCloseOnSelect={false}
      customInput={<CustomInput />}
    />
  )
}

export default GlobalDateRange
