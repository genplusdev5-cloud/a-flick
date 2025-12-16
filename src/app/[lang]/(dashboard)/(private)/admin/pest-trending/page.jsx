'use client'

// React Imports
import { useState, forwardRef } from 'react'

// MUI Imports
import { Box, Card, Grid, Typography, Checkbox, FormControlLabel, Chip } from '@mui/material'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from 'next/link'

// Date
import { format } from 'date-fns'

// Charts Imports
import dynamic from 'next/dynamic'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from '@/libs/Recharts'

const AppRecharts = dynamic(() => import('@/libs/styles/AppRecharts'))

// Components
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import CustomTextField from '@core/components/mui/TextField'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import GlobalButton from '@/components/common/GlobalButton'
import CustomAutocomplete from '@core/components/mui/Autocomplete'
import PermissionGuard from '@/components/auth/PermissionGuard'

/* ------------------------------------------------------------------
   📅 DATE RANGE PICKER
------------------------------------------------------------------ */
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
        value={`${s}${e}`}
        {...rest}
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
      customInput={<CustomInput label='Date Filter' start={startDate} end={endDate} />}
    />
  )
}

/* ------------------------------------------------------------------
   📉 DUMMY DATA GENERATOR
------------------------------------------------------------------ */
const generateDummyData = selectedPests => {
  if (!selectedPests || selectedPests.length === 0) return []

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

  return months.map(m => ({
    month: m,
    count: Math.floor(Math.random() * 50) + 10
  }))
}

/* ------------------------------------------------------------------
   📊 AREA CHART (AppRecharts Wrapper)
------------------------------------------------------------------ */
const DummyTrendingChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Box
        sx={{
          width: '100%',
          height: 350,
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'text.secondary'
        }}
      >
        No data available
      </Box>
    )
  }

  return (
    <Card sx={{ p: 2 }}>
      <AppRecharts>
        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='month' />
              <YAxis />
              <Tooltip />

              <Area type='monotone' dataKey='count' stroke='#1976d2' fill='#90caf9' strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </AppRecharts>
    </Card>
  )
}

/* ------------------------------------------------------------------
   MAIN PAGE — COMPLETED + WORKING
------------------------------------------------------------------ */
const PestTrendingPageContent = () => {
  const [customer, setCustomer] = useState(null)
  const [contract, setContract] = useState(null)
  const [selectedPests, setSelectedPests] = useState([])

  const customerOptions = [
    { label: 'GP Industries Pvt Ltd', value: 'gp' },
    { label: 'All Customers', value: 'all' }
  ]

  const contractOptions = [
    { label: 'Contract A', value: 'cA' },
    { label: 'Contract B', value: 'cB' }
  ]

  const pestOptions = [
    { label: '10 IPM SquareEye Camera Sensors', value: 'sensor' },
    { label: 'Rodents', value: 'rodents' },
    { label: 'Cockroaches', value: 'cockroach' }
  ]

  const chartData = generateDummyData(selectedPests)

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 2 }}>
        <Link href='/' style={{ textDecoration: 'none' }}>
          Dashboard
        </Link>
        <Typography color='text.primary'>Pest Trending</Typography>
      </Breadcrumbs>

      {/* FILTER CARD */}
      <Card sx={{ p: 2.5, borderRadius: 2, mb: 3, boxShadow: '0px 1px 4px rgba(0,0,0,0.1)' }}>
        <Grid container spacing={2} alignItems='center'>
          {/* Checkbox */}
          <Grid item xs={12} md={2}>
            <FormControlLabel control={<Checkbox defaultChecked />} label='Date Filter' />
          </Grid>

          {/* Date Picker */}
          <Grid item xs={12} md={3}>
            <DateRangePickerField />
          </Grid>

          {/* Customer */}
          <Grid item xs={12} md={3}>
            <GlobalAutocomplete
              label='Customer'
              placeholder='Select Customer'
              value={customer}
              onChange={(e, val) => setCustomer(val)}
              options={customerOptions}
              fullWidth
            />
          </Grid>

          {/* Contract */}
          <Grid item xs={12} md={4}>
            <GlobalAutocomplete
              label='Contracts'
              placeholder='Select Contract'
              value={contract}
              onChange={(e, val) => setContract(val)}
              options={contractOptions}
              fullWidth
            />
          </Grid>

          {/* Contract Pests – Chip Multi-select */}
          <Grid item xs={12} md={5}>
            <CustomAutocomplete
              multiple
              value={selectedPests}
              options={pestOptions}
              getOptionLabel={opt => opt.label || ''}
              onChange={(e, newValue) => setSelectedPests(newValue)}
              renderInput={params => <CustomTextField {...params} label='Contract Pests' placeholder='Select pests' />}
              renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => {
                  const props = getTagProps({ index })
                  delete props.key
                  return <Chip {...props} key={index} label={option.label} size='small' />
                })
              }
            />
          </Grid>

          {/* Refresh */}
          <Grid item xs={12} md={2}>
            <GlobalButton variant='contained' color='primary' fullWidth sx={{ height: 40 }}>
              Refresh
            </GlobalButton>
          </Grid>
        </Grid>
      </Card>

      {/* TRENDING CHART */}
      <DummyTrendingChart data={chartData} />
    </Box>
  )
}

// Wrapper for RBAC
export default function PestTrendingPage() {
  return (
    <PermissionGuard permission="Pest Trending">
      <PestTrendingPageContent />
    </PermissionGuard>
  )
}
