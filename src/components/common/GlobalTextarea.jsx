'use client'

import CustomTextField from '@core/components/mui/TextField'

const GlobalTextarea = ({ label = 'Description', rows = 4, ...props }) => {
  return (
    <CustomTextField
      multiline
      rows={rows}
      fullWidth
      label={label}
      {...props}
    />
  )
}

export default GlobalTextarea
