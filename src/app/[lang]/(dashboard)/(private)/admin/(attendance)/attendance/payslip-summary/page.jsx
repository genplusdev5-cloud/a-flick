'use client'

import { useState, useEffect } from 'react'
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

import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import StickyListLayout from '@/components/common/StickyListLayout'
import PermissionGuard from '@/components/auth/PermissionGuard'

import GlobalDateRange from '@/components/common/GlobalDateRange'
import GlobalButton from '@/components/common/GlobalButton'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import SearchIcon from '@mui/icons-material/Search'
import styles from '@core/styles/table.module.css'
import PresetDateRangePicker from '@/components/common/PresetDateRangePicker'

import classnames from 'classnames'
import ChevronRight from '@menu/svg/ChevronRight'

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table'

const TimesoftSummaryReportContent = () => {
  const [month, setMonth] = useState('January')
  const [year, setYear] = useState('2025')
  const [supervisor, setSupervisor] = useState(null)
  const [technician, setTechnician] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 })
  const [rows, setRows] = useState([])
  const [dateFilter, setDateFilter] = useState(true)
  const [dateRange, setDateRange] = useState([null, null])
  const [sorting, setSorting] = useState([])

  const [uiDateFilter, setUiDateFilter] = useState(true)
  const [uiDateRange, setUiDateRange] = useState([null, null])

  useEffect(() => {
    if (!rows.length) return

    setRows(prev =>
      prev.map((item, index) => ({
        ...item,
        sno: index + 1 + pagination.pageIndex * pagination.pageSize
      }))
    )
  }, [pagination.pageIndex, pagination.pageSize])

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

  const columnHelper = createColumnHelper()

  const columns = [
    columnHelper.accessor('sno', { header: 'S.No', enableSorting: true }),
    columnHelper.accessor('employee', { header: 'Employee' }),
    columnHelper.accessor('normal', { header: 'Normal' }),
    columnHelper.accessor('ot10l', { header: 'OT1.0L' }),
    columnHelper.accessor('ot15l', { header: 'OT1.5L' }),
    columnHelper.accessor('ot20l', { header: 'OT2.0L' }),
    columnHelper.accessor('ot10c', { header: 'OT1.0C' }),
    columnHelper.accessor('ot15c', { header: 'OT1.5C' }),
    columnHelper.accessor('ot20c', { header: 'OT2.0C' }),
    columnHelper.accessor('last_updated', { header: 'Last Updated' }),
    columnHelper.accessor('updated_on', { header: 'Updated On' }),
    columnHelper.accessor('updated_by', { header: 'Updated By' })
  ]

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  return (
    <StickyListLayout
      header={
        <Box sx={{ mb: 6 }}>
          <Box sx={{ mb: 2 }}>
            <Link href='/admin/dashboards' className='text-primary'>
              Dashboard
            </Link>{' '}
            / <Typography component='span'>Timesoft Summary</Typography>
          </Box>
          <Typography variant='h5' sx={{ fontWeight: 600 }}>
            Timesoft Summary Report
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
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              mb: 4,
              gap: 2,
              flexWrap: 'nowrap',
              flexShrink: 0
            }}
          >
            {/* Date Filter + Range */}
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <FormControlLabel
                control={<Checkbox checked={uiDateFilter} onChange={e => setUiDateFilter(e.target.checked)} />}
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

          <Divider sx={{ mb: 4 }} />

          {/* TOP BAR: Entries + Buttons + Search */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: 2,
              mb: 3,
              flexWrap: 'nowrap',
              flexShrink: 0
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
          <Box sx={{ position: 'relative', flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <StickyTableWrapper rowCount={rows.length}>
              <table className={styles.table}>
                <thead>
                  {table.getHeaderGroups().map(hg => (
                    <tr key={hg.id}>
                      {hg.headers.map(h => (
                        <th key={h.id}>
                          <div
                            className={classnames({
                              'flex items-center': h.column.getIsSorted(),
                              'cursor-pointer select-none': h.column.getCanSort()
                            })}
                            onClick={h.column.getToggleSortingHandler()}
                          >
                            {flexRender(h.column.columnDef.header, h.getContext())}
                            {{
                              asc: <ChevronRight className='-rotate-90' />,
                              desc: <ChevronRight className='rotate-90' />
                            }[h.column.getIsSorted()] ?? null}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>

                <tbody>
                  {table.getRowModel().rows.length ? (
                    table.getRowModel().rows.map(row => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={columns.length} className='text-center py-4'>
                        No data found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </StickyTableWrapper>
          </Box>

          {/* PAGINATION */}
          <Box sx={{ mt: 'auto', flexShrink: 0, pt: 4 }}>
            <TablePaginationComponent totalCount={rows.length} pagination={pagination} setPagination={setPagination} />
          </Box>
        </Box>
      </Card>
    </StickyListLayout>
  )
}

// Wrapper for RBAC
export default function TimesoftSummaryReport() {
  return (
    <PermissionGuard permission='Payslip Summary'>
      <TimesoftSummaryReportContent />
    </PermissionGuard>
  )
}
