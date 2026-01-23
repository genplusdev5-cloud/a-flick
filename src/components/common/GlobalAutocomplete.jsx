'use client'

import { useMemo } from 'react'
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
  error,
  helperText,
  inputRef,
  ...props
}) => {
  // ⭐ Normalize all options to { label, value }
  const normalizedOptions = useMemo(
    () =>
      options.map((opt, i) => {
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
      }),
    [options]
  )

  // ⭐ Sync string-value selection
  const normalizedValue = useMemo(
    () =>
      typeof value === 'string' || typeof value === 'number'
        ? normalizedOptions.find(o => String(o.value) === String(value) || o.label === value) || null
        : value,
    [value, normalizedOptions]
  )

  // ⭐ Display text
  const finalGetLabel = useMemo(
    () =>
      getOptionLabel ??
      (option => {
        if (!option) return ''
        return typeof option === 'object' ? option.label || '' : String(option)
      }),
    [getOptionLabel]
  )

  // ⭐ Equality check (for highlighting selected option)
  const finalIsEqual = useMemo(
    () =>
      isOptionEqualToValue ??
      ((a, b) => {
        if (!a || !b) return false
        if (typeof a === 'object' && typeof b === 'object') return String(a.value) === String(b.value)
        return a === b
      }),
    [isOptionEqualToValue]
  )

  return (
    <CustomAutocomplete
      fullWidth
      size='small'
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
        <CustomTextField
          {...params}
          ref={inputRef}
          label={label}
          placeholder={placeholder || label}
          error={error}
          helperText={helperText}
        />
      )}
      {...props}
    />
  )
}

export default GlobalAutocomplete
