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
  FormControlLabel,
  InputAdornment
} from '@mui/material'

import StickyListLayout from '@/components/common/StickyListLayout'
import PermissionGuard from '@/components/auth/PermissionGuard'
import PresetDateRangePicker from '@/components/common/PresetDateRangePicker'

import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import GlobalButton from '@/components/common/GlobalButton'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import GlobalDateRange from '@/components/common/GlobalDateRange'

// -----------------------------------------------------

const AttendanceSummaryPageContent = () => {
  const [supervisor, setSupervisor] = useState('')
  const [technician, setTechnician] = useState('')
  const [otFilter, setOtFilter] = useState('all')

  const [uiDateFilter, setUiDateFilter] = useState(true)
  const [uiDateRange, setUiDateRange] = useState([null, null])

  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date())
  const [dateFilter, setDateFilter] = useState(true)
  const [dateRange, setDateRange] = useState([null, null])

  return (
    <StickyListLayout
      header={
        <Box sx={{ mb: 6 }}>
          <Box sx={{ mb: 2 }}>
            <Link href='/admin/dashboards' className='text-primary'>
              Dashboard
            </Link>{' '}
            / <Typography component='span'>Attendance Summary</Typography>
          </Box>
          <Typography variant='h5' sx={{ fontWeight: 600 }}>
            Attendance Summary
          </Typography>
        </Box>
      }
    >
      <Card
        sx={{
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '100%',
          minHeight: 0,
          position: 'relative'
        }}
      >
        <Box sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* FILTER ROW */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 3,
              alignItems: 'center',
              flexShrink: 0
            }}
          >
            {/* Date Filter + Range */}
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <FormControlLabel
                control={<Checkbox checked={dateFilter} onChange={e => setDateFilter(e.target.checked)} />}
                label='Date Filter'
              />

              <Box sx={{ width: 220 }}>
                <PresetDateRangePicker
                  start={uiDateRange[0]}
                  end={uiDateRange[1]}
                  onSelectRange={({ start, end }) => setUiDateRange([start, end])}
                  disabled={!uiDateFilter}
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

          <Divider sx={{ my: 4 }} />

          {/* BUTTON */}
          <Box sx={{ flexShrink: 0 }}>
            <GlobalButton variant='contained' color='primary' sx={{ textTransform: 'none', px: 3 }}>
              Generate Productivity
            </GlobalButton>
          </Box>
        </Box>
      </Card>
    </StickyListLayout>
  )
}

// Wrapper for RBAC
export default function AttendanceSummaryPage() {
  return (
    <PermissionGuard permission='Attendance Timesheet'>
      <AttendanceSummaryPageContent />
    </PermissionGuard>
  )
}
