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
  // ⭐ Normalize all options to { label, value }
  const normalizedOptions = options.map((opt, i) => {
    if (typeof opt === 'string') {
      return {
        label: opt,
        value: opt,
        _key: `${opt}-${i}`
      }
    }

    return {
      label: opt.label ?? opt.name ?? '',
      value: opt.value ?? opt.id ?? '',
      ...opt,
      _key: `${opt.id ?? opt.value ?? i}-${i}`
    }
  })

  // ⭐ Sync string-value selection
  const normalizedValue =
    typeof value === 'string'
      ? normalizedOptions.find(o => o.value === value || o.label === value) || null
      : value

  // ⭐ Display text
  const finalGetLabel =
    getOptionLabel ??
    (option => {
      if (!option) return ''
      return typeof option === 'object' ? option.label || '' : String(option)
    })

  // ⭐ Equality check (for highlighting selected option)
  const finalIsEqual =
    isOptionEqualToValue ??
    ((a, b) => {
      if (!a || !b) return false
      if (typeof a === 'object' && typeof b === 'object') return String(a.value) === String(b.value)
      return a === b
    })

  return (
    <CustomAutocomplete
      fullWidth
      size="small"
      options={normalizedOptions}
      value={normalizedValue}
      getOptionLabel={finalGetLabel}
      isOptionEqualToValue={finalIsEqual}
      renderOption={(props, option, { selected }) => (
        <li
          {...props}
          key={option._key}
          style={{
            backgroundColor: selected ? '#f0d9d9' : '#fff',
            fontWeight: selected ? 600 : 400,
            padding: '6px 10px',
            cursor: 'pointer'
          }}
          onMouseEnter={e => {
            if (!selected) e.currentTarget.style.backgroundColor = '#f5f5f5'
          }}
          onMouseLeave={e => {
            if (!selected) e.currentTarget.style.backgroundColor = '#fff'
          }}
        >
          {finalGetLabel(option)}
        </li>
      )}
      onChange={(event, newValue) => onChange(newValue || null)}
      renderInput={params => (
        <CustomTextField {...params} label={label} placeholder={placeholder || label} />
      )}
      {...props}
    />
  )
}

export default GlobalAutocomplete
