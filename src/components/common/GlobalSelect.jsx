'use client'

import { useState } from 'react'
import MenuItem from '@mui/material/MenuItem'
import CustomTextField from '@core/components/mui/TextField'

const GlobalSelect = ({ label = 'Status', defaultValue = 'Active', value, onChange }) => {

  const handleChange = e => {
    if (onChange) onChange(e)   // ✅ send original event
  }

  return (
    <CustomTextField
      select
      fullWidth
      label={label}
      value={value ?? defaultValue}
      onChange={handleChange}   // e.target.value available now
    >
      <MenuItem value='Active'>Active</MenuItem>
      <MenuItem value='Inactive'>Inactive</MenuItem>
    </CustomTextField>
  )
}

export default GlobalSelect
