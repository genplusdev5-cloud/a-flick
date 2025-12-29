'use client'

// React Imports
import { useState, forwardRef } from 'react'

// MUI Imports
import { Box, Card, Grid, Typography, CardHeader, Divider } from '@mui/material'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from 'next/link'

// Third-party Imports
import { format } from 'date-fns'

// Components
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import CustomTextField from '@core/components/mui/TextField'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import GlobalButton from '@/components/common/GlobalButton'
import PermissionGuard from '@/components/auth/PermissionGuard'

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
      customInput={<CustomInput label='Date Range' start={startDate} end={endDate} />}
    />
  )
}

/* ----------------------------------------------
   MAIN PAGE – SALES REPORT
---------------------------------------------- */
const SalesReportPageContent = () => {
  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 2 }}>
        <Link href='/' style={{ textDecoration: 'none' }}>
          Dashboard
        </Link>
        <Typography color='text.primary'>Sales Report</Typography>
      </Breadcrumbs>

      {/* 🔥 FILTER CARD – SAME ALIGN AS OTHER REPORTS */}
      <Card
        sx={{
          borderRadius: 2,
          boxShadow: '0px 4px 20px rgba(0,0,0,0.08)'
        }}
      >
        {/* CARD HEADER */}
        <CardHeader
          sx={{ px: 4, pb: 2 }}
          title={
            <Typography variant='h5' fontWeight={600}>
              Sales Report
            </Typography>
          }
        />

        <Divider />

        {/* CARD CONTENT */}
        <Box sx={{ p: 4 }}>
          <Grid
            container
            spacing={3}
            alignItems='flex-start'
            sx={{
              '& .MuiInputBase-root': {
                height: 40,
                fontSize: 15
              }
            }}
          >
            {/* DATE RANGE */}
            <Grid item xs={12} md={3}>
              <DateRangePickerField />
            </Grid>

            {/* EMPLOYEE */}
            <Grid item xs={12} md={3}>
              <GlobalAutocomplete
                label='Employee'
                placeholder='Select Employee'
                fullWidth
                options={[
                  { label: 'All', value: 'all' },
                  { label: 'Employee 1', value: 'e1' },
                  { label: 'Employee 2', value: 'e2' }
                ]}
              />
            </Grid>

            {/* GENERATE BUTTON */}
            <Grid item xs={12} md={2} alignSelf='flex-end'>
              <GlobalButton variant='contained' color='primary' fullWidth sx={{ height: 45, fontWeight: 700 }}>
                Generate Sales Report
              </GlobalButton>
            </Grid>
          </Grid>
        </Box>
      </Card>

      <Box sx={{ mt: 5 }} />
    </Box>
  )
}

// Wrapper for RBAC
export default function SalesReportPage() {
  return (
    <PermissionGuard permission='Sales Report'>
      <SalesReportPageContent />
    </PermissionGuard>
  )
}
