'use client'

import { useState } from 'react'
import Link from 'react-redux'
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

import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import StickyListLayout from '@/components/common/StickyListLayout'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import GlobalDateRange from '@/components/common/GlobalDateRange'
import GlobalButton from '@/components/common/GlobalButton'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import SearchIcon from '@mui/icons-material/Search'
import styles from '@core/styles/table.module.css'

export default function AttendanceLeaveSummaryPage() {
  const [rows, setRows] = useState([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 })
  const [searchText, setSearchText] = useState('')
  const [dateFilter, setDateFilter] = useState(true)
  const [dateRange, setDateRange] = useState([null, null])

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'type', label: 'Type' },
    { key: 'technician', label: 'Technician' },
    { key: 'employee_no', label: 'Employee No' },
    { key: 'fingerprint_id', label: 'Fingerprint ID' },
    { key: 'location', label: 'Location' },
    { key: 'local_foreigner', label: 'Local/Foreigner' },
    { key: 'date', label: 'Date' },
    { key: 'day', label: 'Day' },
    { key: 'time_in', label: 'Time In' },
    { key: 'time_out', label: 'Time Out' },
    { key: 'slot_leave_type', label: 'Slot/Leave Type' },
    { key: 'is_ot', label: 'Is OT?' },
    { key: 'ot', label: 'OT' },
    { key: 'work_hours', label: 'Work Hours' },
    { key: 'lunch', label: 'Lunch' },
    { key: 'actual_time_in', label: 'Actual Time In' },
    { key: 'actual_time_out', label: 'Actual Time Out' },
    { key: 'from_ampm', label: 'FROM AM/PM' },
    { key: 'to_ampm', label: 'TO AM/PM' }
  ]

  return (
    <StickyListLayout
      header={
        <Box sx={{ mb: 6 }}>
          <Box sx={{ mb: 2 }}>
            <Link href='/admin/dashboards' className='text-primary'>
              Dashboard
            </Link>{' '}
            / <Typography component='span'>Attendance & Leave Summary</Typography>
          </Box>
          <Typography variant='h5' sx={{ fontWeight: 600 }}>
            Attendance & Leave Summary
          </Typography>
        </Box>
      }
    >
      <Card
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
          position: 'relative'
        }}
      >
        <Box sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* ==================== FILTER ROW  ==================== */}

          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 2,
              mb: 4,
              flexWrap: 'nowrap',
              flexShrink: 0
            }}
          >
            {/* Date Filter + Range */}
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <FormControlLabel
                control={<Checkbox checked={dateFilter} onChange={e => setDateFilter(e.target.checked)} />}
                label='Date Filter'
              />

              <Box sx={{ width: 240 }}>
                <GlobalDateRange
                  label=''
                  start={dateRange[0]}
                  end={dateRange[1]}
                  onSelectRange={({ start, end }) => setDateRange([start, end])}
                  disabled={!dateFilter}
                />
              </Box>
            </Box>

            {/* Customer */}
            <Box sx={{ width: 220 }}>
              <GlobalAutocomplete label='Customer' placeholder='Select' options={[]} />
            </Box>

            {/* Contracts */}
            <Box sx={{ width: 220 }}>
              <GlobalAutocomplete label='Contracts' placeholder='Select' options={[]} />
            </Box>

            {/* Technician */}
            <Box sx={{ width: 220 }}>
              <GlobalAutocomplete label='Technician' placeholder='Select' options={[]} />
            </Box>

            {/* Supervisor */}
            <Box sx={{ width: 220 }}>
              <GlobalAutocomplete label='Supervisor' placeholder='Select' options={[]} />
            </Box>

            {/* Status */}
            <Box sx={{ width: 200 }}>
              <Typography sx={{ mb: 0.5, fontSize: '0.8rem' }}>Appointment Status</Typography>
              <FormControl fullWidth size='small'>
                <Select defaultValue='' displayEmpty>
                  <MenuItem value=''>Select</MenuItem>
                  <MenuItem value='completed'>Completed</MenuItem>
                  <MenuItem value='pending'>Pending</MenuItem>
                  <MenuItem value='cancelled'>Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Refresh Button */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <GlobalButton variant='contained' color='primary'>
                Refresh
              </GlobalButton>
            </Box>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* TOP BAR: Entries + Download Button + Search */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
              flexWrap: 'wrap',
              gap: 2,
              flexShrink: 0
            }}
          >
            {/* LEFT SIDE — Entries + Download */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Show Entries */}
              <FormControl size='small' sx={{ width: 150 }}>
                <Select
                  value={pagination.pageSize}
                  onChange={e =>
                    setPagination(p => ({
                      ...p,
                      pageSize: Number(e.target.value),
                      pageIndex: 0
                    }))
                  }
                >
                  {[10, 25, 50, 75, 100].map(s => (
                    <MenuItem key={s} value={s}>
                      {s} entries
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Download Button */}
              <GlobalButton variant='contained' color='success'>
                Export Attendance & Leave Summary for HR
              </GlobalButton>
            </Box>

            {/* RIGHT SIDE — Search */}
            <Box>
              <TextField
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                placeholder='Search...'
                size='small'
                sx={{ width: 300 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position='start'>
                        <SearchIcon />
                      </InputAdornment>
                    )
                  }
                }}
              />
            </Box>
          </Box>

          {/* ==================== TABLE ==================== */}
          <Box sx={{ position: 'relative', flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <StickyTableWrapper rowCount={rows.length}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {columns.map(col => (
                      <th key={col.key}>
                        <div className='flex items-center'>{col.label}</div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {rows.length ? (
                    rows.map((row, i) => (
                      <tr key={i}>
                        {columns.map(col => (
                          <td key={col.key}>{row[col.key] ?? '-'}</td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={columns.length} className='text-center py-4'>
                        No data available in table
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </StickyTableWrapper>
          </Box>

          {/* Pagination */}
          <Box sx={{ mt: 'auto', flexShrink: 0, pt: 4 }}>
            <TablePaginationComponent totalCount={rows.length} pagination={pagination} setPagination={setPagination} />
          </Box>
        </Box>
      </Card>
    </StickyListLayout>
  )
}
