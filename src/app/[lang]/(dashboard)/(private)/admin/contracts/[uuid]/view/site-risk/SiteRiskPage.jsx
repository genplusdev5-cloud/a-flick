'use client'

import { useState } from 'react'

// MUI
import { Box, Card, Typography, Chip, Divider } from '@mui/material'

// Your Components
import CustomAutocomplete from '@core/components/mui/Autocomplete'
import CustomTextField from '@core/components/mui/TextField'
import GlobalButton from '@/components/common/GlobalButton'

// Example risk options (replace later with API if needed)
const riskOptions = [
  { label: 'Children/ elderly/ disabled/ public traffic' },
  { label: 'Pets/ livestock/ animals / pests e.g. guard dogs, snakes, bees, centipede' },
  { label: 'Vehicle / lifting trucks / lifting machines' },
  { label: 'Open pits / dangerous areas' },
  { label: 'Chemical hazard zones' }
]

export default function SiteRiskPage() {
  const [value, setValue] = useState([riskOptions[0], riskOptions[1], riskOptions[2]])

  const handleUpdate = () => {
    console.log('Selected Risks:', value)
    alert('Site Risks Updated!')
  }

  return (
    <Box className='mt-2'>
      <Card sx={{ p: 3 }}>
        {/* TITLE */}
        <Typography variant='h6' sx={{ fontWeight: 700, mb: 2 }}>
          SITE RISK
        </Typography>

        <Divider sx={{ mb: 5 }} />

        {/* LABEL */}
        <Typography variant='subtitle1' sx={{ mb: 1 }}>
          Site risks
        </Typography>

        {/* AUTOCOMPLETE */}
        <CustomAutocomplete
          multiple
          fullWidth
          id='site-risk-selector'
          value={value}
          options={riskOptions}
          getOptionLabel={option => option.label}
          onChange={(event, newValue) => setValue(newValue)}
          renderInput={params => <CustomTextField {...params} placeholder='Select risks...' />}
          renderTags={(tagValue, getTagProps) =>
            tagValue.map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index }) // remove key from spread

              return (
                <Chip
                  key={key} // key added directly
                  label={option.label}
                  {...tagProps} // safe to spread now
                  size='small'
                  sx={{
                    backgroundColor: '#03A9F4',
                    color: 'white',
                    fontWeight: 500,
                    borderRadius: '4px'
                  }}
                />
              )
            })
          }
        />

        {/* BUTTON */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <GlobalButton variant='contained' color='primary' sx={{ px: 4 }} onClick={handleUpdate}>
            UPDATE
          </GlobalButton>
        </Box>
      </Card>
    </Box>
  )
}
