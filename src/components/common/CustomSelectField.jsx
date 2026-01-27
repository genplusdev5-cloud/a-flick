'use client'

import { FormControl } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import CustomTextField from '@core/components/mui/TextField'

const CustomSelectField = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = '',
  ...props
}) => {

  const normalizedOptions = options.map(opt => ({
    id: opt?.id ?? opt?.value,
    label: opt?.label ?? opt?.name ?? String(opt)
  }))

  return (
    <FormControl fullWidth {...props}>
      <Autocomplete
        options={normalizedOptions}
        value={normalizedOptions.find(o => o.id === value) || null}
        getOptionLabel={option => option.label || ''}
        isOptionEqualToValue={(o, v) => o.id === v.id}

        // ✅ FIXED: sends event-like object
        onChange={(e, newVal) =>
          onChange({
            target: { value: newVal?.id ?? '' }
          })
        }

        renderInput={params => (
          <CustomTextField
            {...params}
            label={label}
            placeholder={placeholder}
            InputLabelProps={{ shrink: true }}
            required={props.required}
          />
        )}
        sx={{
          '& .MuiAutocomplete-inputRoot': {
            padding: '6px 8px',
            borderRadius: '10px'
          }
        }}
      />
    </FormControl>
  )
}

export default CustomSelectField
