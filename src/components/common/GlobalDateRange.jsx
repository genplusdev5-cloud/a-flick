'use client'

import { useState, forwardRef, useEffect } from 'react'
import { format } from 'date-fns'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import CustomTextField from '@core/components/mui/TextField'

const formatDate = date => (date ? format(date, 'dd-MM-yyyy') : '')

const GlobalDateRange = ({
  label = 'Date Range',
  onSelectRange,
  start,
  end,
  disabled = false   // ✅ NEW
}) => {
  const [localStart, setLocalStart] = useState(start)
  const [localEnd, setLocalEnd] = useState(end)

  // Sync selected range back to parent
  useEffect(() => {
    if (!disabled && onSelectRange && localStart && localEnd) {
      onSelectRange({ start: localStart, end: localEnd })
    }
  }, [localStart, localEnd, disabled])

  const onChange = dates => {
    if (disabled) return     // 🚫 Ignore changes when disabled

    const [s, e] = dates
    setLocalStart(s)
    setLocalEnd(e)
  }

  const CustomInput = forwardRef(({ value, onClick }, ref) => (
    <CustomTextField
      fullWidth
      label={label}
      inputRef={ref}
      value={value}
      onClick={disabled ? undefined : onClick} // disable click
      readOnly
      disabled={disabled}
      sx={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 }}
    />
  ))

  return (
    <AppReactDatepicker
      selectsRange
      startDate={localStart}
      endDate={localEnd}
      onChange={onChange}
      shouldCloseOnSelect={false}
      disabled={disabled}  // ✅ IMPORTANT
      customInput={
        <CustomInput
          value={`${formatDate(localStart)} - ${formatDate(localEnd)}`}
        />
      }
    />
  )
}

export default GlobalDateRange
