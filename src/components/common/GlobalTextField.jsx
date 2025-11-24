'use client'

import CustomTextField from '@core/components/mui/TextField'

const GlobalTextField = ({ label = '', placeholder = '', ...props }) => {
  return <CustomTextField label={label} placeholder={placeholder} fullWidth {...props} />
}

export default GlobalTextField
