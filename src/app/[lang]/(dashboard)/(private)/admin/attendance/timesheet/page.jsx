'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Box,
  Card,
  CardHeader,
  Typography,
  Divider,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel 
} from '@mui/material'

import PermissionGuard from '@/components/auth/PermissionGuard'

import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import GlobalButton from '@/components/common/GlobalButton'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import GlobalDateRange from '@/components/common/GlobalDateRange'

// -----------------------------------------------------

// ───────────────────────────────────────────
const AttendanceSummaryPageContent = () => {
  const [supervisor, setSupervisor] = useState('')
  const [technician, setTechnician] = useState('')
  const [otFilter, setOtFilter] = useState('all')

  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date())
  const [dateFilter, setDateFilter] = useState(true)
  const [dateRange, setDateRange] = useState([null, null])

  return (
    <Box>
      {/* Breadcrumb */}
      <Box sx={{ mb: 2 }}>
        <Link href='/admin/dashboards' className='text-primary'>
          Dashboard
        </Link>{' '}
        / <Typography component='span'>Attendance Summary</Typography>
      </Box>

      {/* MAIN CARD */}
      <Card sx={{ p: 3 }}>
        <CardHeader
          sx={{
            pb: 1.5,
            pt: 1.5,
            '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '1.125rem' }
          }}
          title='Attendance Summary'
        />

        <Divider sx={{ my: 3 }} />

        {/* FILTER ROW */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            alignItems: 'center'
          }}
        >
          {/* Date Filter + Range */}
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <FormControlLabel
              control={<Checkbox checked={dateFilter} onChange={e => setDateFilter(e.target.checked)} />}
              label='Date Filter'
            />

            <Box sx={{ width: 220 }}>
              <GlobalDateRange
                label=''
                start={dateRange[0]}
                end={dateRange[1]}
                onSelectRange={({ start, end }) => setDateRange([start, end])}
                disabled={!dateFilter}
              />
            </Box>
          </Box>
          {/* SUPERVISOR */}
          <Box sx={{ width: 240 }}>
            <Typography sx={{ mb: 0.5 }}>Supervisor</Typography>
            <GlobalAutocomplete placeholder='Select' label='' value={null} options={[]} onChange={() => {}} />
          </Box>

          {/* TECHNICIAN */}
          <Box sx={{ width: 240 }}>
            <Typography sx={{ mb: 0.5 }}>Technician</Typography>
            <GlobalAutocomplete placeholder='Select' label='' value={null} options={[]} onChange={() => {}} />
          </Box>

          {/* OT / NORMAL */}
          <Box sx={{ width: 200 }}>
            <Typography sx={{ mb: 0.5 }}>OT/NORMAL</Typography>
            <FormControl size='small' fullWidth>
              <Select value={otFilter} onChange={e => setOtFilter(e.target.value)}>
                <MenuItem value='all'>All</MenuItem>
                <MenuItem value='ot'>OT</MenuItem>
                <MenuItem value='normal'>Normal</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* BUTTON */}
        <Box sx={{ mt: 4 }}>
          <GlobalButton variant='contained' color='primary' sx={{ textTransform: 'none', px: 3 }}>
            Generate Productivity
          </GlobalButton>
        </Box>
      </Card>
    </Box>
  )
}

// Wrapper for RBAC
export default function AttendanceSummaryPage() {
  return (
    <PermissionGuard permission="Timesheet">
      <AttendanceSummaryPageContent />
    </PermissionGuard>
  )
}
