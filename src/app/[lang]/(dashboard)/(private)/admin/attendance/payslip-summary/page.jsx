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
  Select,
  MenuItem,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputAdornment
} from '@mui/material'

import GlobalDateRange from '@/components/common/GlobalDateRange'
import GlobalButton from '@/components/common/GlobalButton'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import SearchIcon from '@mui/icons-material/Search'
import styles from '@core/styles/table.module.css'

// --------------------------------------------------------------------

export default function TimesoftSummaryReport() {
  const [month, setMonth] = useState('January')
  const [year, setYear] = useState('2025')
  const [supervisor, setSupervisor] = useState(null)
  const [technician, setTechnician] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 })
  const [rows, setRows] = useState([])
  const [dateFilter, setDateFilter] = useState(true)
  const [dateRange, setDateRange] = useState([null, null])

  const monthsList = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ]

  const columns = [
    { key: 'index', label: '#' },
    { key: 'employee', label: 'Employee' },
    { key: 'normal', label: 'Normal' },
    { key: 'ot10l', label: 'OT1.0L' },
    { key: 'ot15l', label: 'OT1.5L' },
    { key: 'ot20l', label: 'OT2.0L' },
    { key: 'ot10c', label: 'OT1.0C' },
    { key: 'ot15c', label: 'OT1.5C' },
    { key: 'ot20c', label: 'OT2.0C' },
    { key: 'last_updated', label: 'Last Updated' },
    { key: 'updated_on', label: 'Updated On' },
    { key: 'updated_by', label: 'Updated By' }
  ]

  return (
    <Box>
      {/* Breadcrumb */}
      <Box sx={{ mb: 2 }}>
        <Link href='/admin/dashboards' className='text-primary'>
          Dashboard
        </Link>{' '}
        / <Typography component='span'>Timesoft Summary</Typography>
      </Box>

      {/* MAIN CARD */}
      <Card sx={{ p: 3 }}>
        <CardHeader
          sx={{
            pb: 1.5,
            pt: 1.5,
            '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '1.125rem' }
          }}
          title='Timesoft Summary Report'
        />

        <Divider sx={{ my: 3 }} />

        {/* FILTER ROW */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end', // ⭐ All bottom aligned
            mb: 4,
            gap: 2,
            flexWrap: 'nowrap'
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
          {/* Month (Autocomplete) */}
          <Box sx={{ width: 200 }}>
            <GlobalAutocomplete
              label='Month'
              placeholder='Select Month'
              options={monthsList.map(m => ({ label: m, value: m }))}
              value={month ? { label: month, value: month } : null}
              onChange={(_, v) => setMonth(v?.value || '')}
            />
          </Box>

          {/* Year */}
          <Box sx={{ width: 200 }}>
            <GlobalAutocomplete
              label='Year'
              placeholder='Select Year'
              options={[2023, 2024, 2025, 2026].map(y => ({ label: y.toString(), value: y }))}
              value={year ? { label: year.toString(), value: year } : null}
              onChange={(_, v) => setYear(v?.value || '')}
            />
          </Box>

          {/* Supervisor */}
          <Box sx={{ width: 240 }}>
            <GlobalAutocomplete
              label='Supervisor'
              placeholder='Select'
              options={[]}
              value={supervisor}
              onChange={setSupervisor}
            />
          </Box>

          {/* Technician */}
          <Box sx={{ width: 240 }}>
            <GlobalAutocomplete
              label='Technicians'
              placeholder='Select'
              options={[]}
              value={technician}
              onChange={setTechnician}
            />
          </Box>

          {/* Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
            <GlobalButton variant='contained' color='primary'>
              Refresh
            </GlobalButton>

            <GlobalButton variant='contained' color='primary'>
              Push To Timesoft
            </GlobalButton>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* BUTTONS + SEARCH IN ONE ROW */}
        {/* TOP BAR: Entries + Buttons + Search */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end', // ⭐ all bottom aligned
            gap: 2,
            mb: 3,
            flexWrap: 'nowrap'
          }}
        >
          {/* LEFT SIDE = Entries + Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
            {/* Entries Dropdown */}
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

            {/* Buttons */}
            <GlobalButton variant='contained' color='secondary' sx={{ background: '#e5e5e5', color: '#444' }}>
              Show 50 Rows
            </GlobalButton>

            <GlobalButton variant='contained' color='secondary' sx={{ background: '#e5e5e5', color: '#444' }}>
              Excel
            </GlobalButton>

            <GlobalButton variant='contained' color='secondary' sx={{ background: '#e5e5e5', color: '#444' }}>
              Print
            </GlobalButton>
          </Box>

          {/* RIGHT SIDE = Search */}
          <Box>
            <TextField
              size='small'
              placeholder='Search...'
              sx={{ width: 260 }}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
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

        {/* TABLE */}
        <div className='overflow-x-auto'>
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
                rows.map((row, index) => (
                  <tr key={index}>
                    {columns.map(col => (
                      <td key={col.key}>{row[col.key] ?? '-'}</td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className='text-center py-4'>
                    Loading...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <TablePaginationComponent totalCount={rows.length} pagination={pagination} setPagination={setPagination} />
      </Card>
    </Box>
  )
}
