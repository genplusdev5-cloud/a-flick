'use client'

import CustomAutocomplete from '@core/components/mui/Autocomplete'
import CustomTextField from '@core/components/mui/TextField'

const GlobalAutocomplete = ({
  label = 'Select',
  placeholder = 'Search...',
  options = [],
  value = null,
  onChange = () => {},
  getOptionLabel = option => option?.label || option?.name || '',
  isOptionEqualToValue = (opt, val) => opt?.id === val?.id,
  ...props
}) => {

  // Create safe options with unique keys
  const safeOptions = options.map((opt, index) => ({
    ...opt,
    _key: opt.id ?? opt.value ?? index
  }))

  return (
    <CustomAutocomplete
      fullWidth
      options={safeOptions}
      value={value}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={isOptionEqualToValue}

      // FIX: Do NOT override key inside props
      renderOption={(params, option) => (
        <li {...params} key={option._key}>
          {getOptionLabel(option)}
        </li>
      )}

      // FIX: return full object, NOT id
      onChange={(event, newValue) => {
        onChange(newValue || null)
      }}

      renderInput={(params) => (
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
