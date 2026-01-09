'use client'

import { useState } from 'react'
import MenuItem from '@mui/material/MenuItem'
import CustomTextField from '@core/components/mui/TextField'

const GlobalSelect = ({ label = 'Status', defaultValue = 'Active', value, onChange, options, ...props }) => {

  const handleChange = e => {
    if (onChange) onChange(e)   // ✅ send original event
  }

  // Fallback options if none provided
  const finalOptions = options || [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
    { value: 1, label: 'Active' },
    { value: 0, label: 'Inactive' }
  ]

  // If value is provided as number but options use 'Active'/'Inactive', or vice-versa,
  // we might need some normalization. But for now, let's just render the options.

  return (
    <CustomTextField
      select
      fullWidth
      label={label}
      value={value ?? (options ? '' : defaultValue)}
      onChange={handleChange}   // e.target.value available now
      {...props}
    >
      {finalOptions.map((opt, index) => (
        <MenuItem key={index} value={opt.value}>
          {opt.label}
        </MenuItem>
      ))}
    </CustomTextField>
  )
}

export default GlobalSelect
