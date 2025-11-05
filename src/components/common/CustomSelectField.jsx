'use client'

import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'

const CustomSelectField = ({ label, value, onChange, options = [], ...props }) => {
  return (
    <FormControl fullWidth variant='outlined' {...props}>
      <InputLabel>{label}</InputLabel>
      <Select
        label={label}
        value={value}
        onChange={onChange}
        sx={{
          borderRadius: '10px',
          '& .MuiSelect-select': {
            padding: '12px 14px'
          }
        }}
      >
        {options.map(opt => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default CustomSelectField
