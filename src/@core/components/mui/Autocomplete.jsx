// React imports
import { forwardRef } from 'react'

// MUI imports
import Paper from '@mui/material/Paper'
import Autocomplete from '@mui/material/Autocomplete'

const CustomAutocomplete = forwardRef(function CustomAutocomplete(props, ref) {
  const { slots, ...rest } = props

  return (
    <Autocomplete
      ref={ref}
      {...rest}
      // ✅ Merge slots properly (DO NOT overwrite)
      slots={{
        paper: paperProps => <Paper {...paperProps} />,
        ...(slots || {})
      }}
      // ✅ Prevent key warnings (required for custom renderOption)
      slotProps={{
        ...props.slotProps,
        paper: {
          elevation: 2
        }
      }}
    />
  )
})

export default CustomAutocomplete
