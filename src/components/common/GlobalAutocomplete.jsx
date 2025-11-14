'use client'

import CustomAutocomplete from '@core/components/mui/Autocomplete'
import CustomTextField from '@core/components/mui/TextField'

const GlobalAutocomplete = ({
  label = 'Select',
  placeholder = 'Search...',
  options = [],
  value = null,               // ✅ controlled value
  onChange = () => {},        // ✅ callback
  ...props
}) => {
  // Convert simple string value → option object
  const selectedOption =
    options.find(opt => opt.value === value) || null

  return (
    <CustomAutocomplete
      fullWidth
      options={options}
      value={selectedOption}   // ✅ must be an object, not string
      onChange={(event, newValue) => {
        onChange(newValue ? newValue.value : '')  // return string only
      }}
      getOptionLabel={option => option?.label || ''}
      isOptionEqualToValue={(opt, val) => opt.value === val.value}  // 🔥 avoid duplicate key error
      renderInput={params => (
        <CustomTextField
          {...params}
          label={label}
          placeholder={placeholder}
        />
      )}
      {...props}
    />
  )
}

export default GlobalAutocomplete
