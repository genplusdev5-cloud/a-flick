'use client'
import CustomTextField from '@core/components/mui/TextField'

const CustomTextFieldWrapper = ({ label, placeholder, value, onChange, ...props }) => {
  return (
    <CustomTextField
      fullWidth
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      {...props}
    />
  )
}

export default CustomTextFieldWrapper
