'use client'

import CustomAutocomplete from '@core/components/mui/Autocomplete'
import CustomTextField from '@core/components/mui/TextField'

const GlobalAutocomplete = ({
  label = 'Select',
  placeholder = '',
  options = [],
  value = null,
  onChange = () => {},
  getOptionLabel,
  isOptionEqualToValue,
  ...props
}) => {
  // ⭐ Normalize options
  const normalizedOptions = options.map((opt, i) => {
    if (typeof opt === 'string') {
      return {
        id: opt,
        label: opt,
        value: opt,
        _key: opt
      }
    }
    return {
      ...opt,
      _key: `${opt.id ?? opt.value ?? i}-${i}`
    }
  })

  // ⭐ Normalize current value
  const normalizedValue =
    typeof value === 'string' ? normalizedOptions.find(o => o.value === value || o.label === value) || null : value

  // ⭐ Default label renderer
  const finalGetLabel = getOptionLabel ?? (option => option?.label || option?.value || option?.name || '')

  // ⭐ Default equality check
  const finalIsEqual = isOptionEqualToValue ?? ((opt, val) => opt?.id === val?.id || opt?.value === val?.value)

  return (
    <CustomAutocomplete
      fullWidth
      options={normalizedOptions}
      value={normalizedValue}
      getOptionLabel={finalGetLabel}
      isOptionEqualToValue={finalIsEqual}
      renderOption={(params, option) => (
        <li {...params} key={option._key}>
          {finalGetLabel(option)}
        </li>
      )}
      // ⭐ FIX: Return FULL OBJECT (never return string)
      onChange={(event, newValue) => {
        onChange(newValue || null)
      }}
      renderInput={params => <CustomTextField {...params} label={label} placeholder={placeholder} />}
      {...props}
    />
  )
}

export default GlobalAutocomplete
