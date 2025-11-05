'use client'
import { useState } from 'react'
import TextField from '@mui/material/TextField'

const CustomTextarea = ({ label, value, onChange, rows = 4, variant = 'outlined', ...props }) => {
  return (
    <TextField
      fullWidth
      multiline
      rows={rows}
      variant={variant}
      label={label}
      value={value}
      onChange={onChange}
      {...props}
    />
  )
}

export default CustomTextarea
