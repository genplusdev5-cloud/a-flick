'use client'

import { useState, forwardRef } from 'react'
import { format } from 'date-fns'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import CustomTextField from '@core/components/mui/TextField'

const formatDate = date => format(date, 'dd-MM-yyyy')

const GlobalDateRange = ({ label = 'Date Range', ...props }) => {
  const [start, setStart] = useState(new Date())
  const [end, setEnd] = useState(new Date())

  const onChange = (dates) => {
    const [s, e] = dates
    setStart(s)
    setEnd(e)
  }

  const CustomInput = forwardRef(({ start, end, label }, ref) => {
    const value = `${formatDate(start)} - ${end ? formatDate(end) : ''}`

    return (
      <CustomTextField
        fullWidth
        inputRef={ref}
        label={label}
        value={value}
        {...props}
      />
    )
  })

  return (
    <AppReactDatepicker
      selectsRange
      startDate={start}
      endDate={end}
      onChange={onChange}
      shouldCloseOnSelect={false}
      customInput={<CustomInput start={start} end={end} label={label} />}
    />
  )
}

export default GlobalDateRange
