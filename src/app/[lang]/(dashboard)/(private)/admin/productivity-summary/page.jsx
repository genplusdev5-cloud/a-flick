'use client'

// React Imports
import { useState, forwardRef } from 'react'

// MUI Imports
import { Box, Card, Grid, Typography } from '@mui/material'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from 'next/link'

// Third-party Imports
import { format } from 'date-fns'

// Custom Components
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import CustomTextField from '@core/components/mui/TextField'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import GlobalButton from '@/components/common/GlobalButton'

/* ----------------------------------------------
   📅 Date Range Picker
---------------------------------------------- */
const DateRangePickerField = () => {
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date())

  const handleChange = dates => {
    const [start, end] = dates
    setStartDate(start)
    setEndDate(end)
  }

  const CustomInput = forwardRef((props, ref) => {
    const { label, start, end, ...rest } = props

    const s = start ? format(start, 'MM/dd/yyyy') : ''
    const e = end ? ` - ${format(end, 'MM/dd/yyyy')}` : ''

    return (
      <CustomTextField
        fullWidth
        inputRef={ref}
        label={label}
        {...rest}
        value={`${s}${e}`}
        sx={{ '& .MuiInputBase-root': { height: 40 } }}
      />
    )
  })

  return (
    <AppReactDatepicker
      selectsRange
      startDate={startDate}
      endDate={endDate}
      selected={startDate}
      onChange={handleChange}
      shouldCloseOnSelect={false}
      customInput={<CustomInput label="Date Filter" start={startDate} end={endDate} />}
    />
  )
}

/* ----------------------------------------------
   MAIN PAGE – PRODUCTIVITY SUMMARY
---------------------------------------------- */
export default function ProductivitySummaryPage() {
  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link href="/" style={{ textDecoration: "none" }}>Dashboard</Link>
        <Typography color="text.primary">Productivity Summary</Typography>
      </Breadcrumbs>
      

      {/* Filter Card */}
      <Card
        sx={{
          p: 2.5,
          borderRadius: 2,
          boxShadow: "0px 1px 4px rgba(0,0,0,0.1)",
        }}
      >
        <Grid
          container
          spacing={2}
          alignItems="center"
          sx={{
            '& .MuiInputBase-root': { height: 40 },
          }}
        >
          {/* Date Filter */}
          <Grid item xs={12} md={3}>
            <DateRangePickerField />
          </Grid>

          {/* Technician */}
          <Grid item xs={12} md={3}>
            <GlobalAutocomplete
              label="Technician"
              placeholder="Select"
              fullWidth
              options={[
                { label: "All", value: "all" },
                { label: "Technician 1", value: "t1" },
                { label: "Technician 2", value: "t2" },
              ]}
            />
          </Grid>

          {/* Button */}
          <Grid item xs={12} md={2} display="flex" justifyContent="flex-start">
            <GlobalButton
              variant="contained"
              color="primary"
              fullWidth
              sx={{
                height: 40,
                fontWeight: 600
              }}
            >
              Generate Productivity
            </GlobalButton>
          </Grid>
        </Grid>
      </Card>

      <Box sx={{ mt: 5 }}></Box>
    </Box>
  )
}
