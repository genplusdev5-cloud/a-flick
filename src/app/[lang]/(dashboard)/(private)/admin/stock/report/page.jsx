'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Box,
  Card,
  CardHeader,
  Typography,
  Divider,
  Breadcrumbs,
  MenuItem,
  Checkbox,
  CircularProgress,
  Pagination,
  InputAdornment,
  FormControl,        // ← Required
  Select,
  Button
} from '@mui/material'

import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'


// Components
import CustomTextField from '@core/components/mui/TextField'
import CustomAutocomplete from '@core/components/mui/Autocomplete'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

// Toastify
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Table
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  createColumnHelper,
  flexRender
} from '@tanstack/react-table'

import classnames from 'classnames'
import styles from '@core/styles/table.module.css'
import ChevronRight from '@menu/svg/ChevronRight'

// Dummy Data
const dummyData = [
  {
    id: 1,
    supplier: 'Stock-TECH STOCK 1',
    material: 'Abate',
    openingStock: 200,
    totalReceived: 150,
    totalSupplied: 100,
    totalConsumed: 50,
    available: 200,
    reportDate: '10/10/2025'
  },
  {
    id: 2,
    supplier: 'Supplier-ABC',
    material: 'Falcon',
    openingStock: 500,
    totalReceived: 200,
    totalSupplied: 150,
    totalConsumed: 50,
    available: 550,
    reportDate: '10/10/2025'
  },
  {
    id: 3,
    supplier: 'Stock-TECH STOCK 1',
    material: 'Aquabac',
    openingStock: 100,
    totalReceived: 50,
    totalSupplied: 50,
    totalConsumed: 0,
    available: 100,
    reportDate: '11/10/2025'
  }
]

// Toast helper
// ──────────────────────────────────────────────────────────────
// Toast (Custom Styled, Global, with Icons & Colors)
// ──────────────────────────────────────────────────────────────
const showToast = (type, message = '') => {
  const icons = {
    success: 'tabler-circle-check',
    delete: 'tabler-trash',
    error: 'tabler-alert-triangle',
    warning: 'tabler-info-circle',
    info: 'tabler-refresh'
  }

  toast(
    <div className='flex items-center gap-2'>
      <i
        className={icons[type]}
        style={{
          color:
            type === 'success'
              ? '#16a34a'
              : type === 'error'
                ? '#dc2626'
                : type === 'delete'
                  ? '#dc2626'
                  : type === 'warning'
                    ? '#f59e0b'
                    : '#2563eb',
          fontSize: '22px'
        }}
      />
      <Typography variant='body2' sx={{ fontSize: '0.9rem', color: '#111' }}>
        {message}
      </Typography>
    </div>,
    {
      position: 'top-right',
      autoClose: 2000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: false,
      theme: 'light',
      style: {
        borderRadius: '10px',
        padding: '8px 14px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center'
      }
    }
  )
}

export default function StockReportPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [enableDateFilter, setEnableDateFilter] = useState(false)
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date())
  const [supplierFilter, setSupplierFilter] = useState('')
  const [chemicalFilter, setChemicalFilter] = useState('')
  const [searchText, setSearchText] = useState('')

  const columnHelper = createColumnHelper()
  const columns = useMemo(
    () => [
      columnHelper.accessor('id', { header: 'ID', size: 80 }),
      columnHelper.accessor('supplier', { header: 'Supplier', size: 200 }),
      columnHelper.accessor('material', { header: 'Material', size: 200 }),
      columnHelper.accessor('openingStock', { header: 'Opening Stock', size: 160 }),
      columnHelper.accessor('totalReceived', { header: 'Total Received', size: 160 }),
      columnHelper.accessor('totalSupplied', { header: 'Total Supplied', size: 160 }),
      columnHelper.accessor('totalConsumed', { header: 'Total Consumed', size: 160 }),
      columnHelper.accessor('received', { header: 'Received', size: 140 }),
      columnHelper.accessor('supplied', { header: 'Supplied', size: 140 }),
      columnHelper.accessor('consumed', { header: 'Consumed', size: 140 }),
      columnHelper.accessor('available', { header: 'Available Stock', size: 160 })
    ],
    []
  )

  const loadData = async (showToastMsg = false) => {
    setLoading(true)
    try {
      const filtered = dummyData.filter(r => {
        const matchSearch =
          !searchText || `${r.supplier} ${r.material}`.toLowerCase().includes(searchText.toLowerCase())

        const matchDate = (() => {
          if (!enableDateFilter) return true
          const [day, month, year] = r.reportDate.split('/')
          const rowDate = new Date(year + '-' + month + '-' + day)
          return rowDate >= startDate && rowDate <= endDate
        })()

        const matchSupplier = !supplierFilter || r.supplier === supplierFilter
        const matchChemical = !chemicalFilter || r.material === chemicalFilter

        return matchSearch && matchDate && matchSupplier && matchChemical
      })

      const withSno = filtered.map((r, i) => ({ ...r, sno: i + 1 }))
      setRows(withSno)

      if (showToastMsg) showToast('info', 'Stock report refreshed')
    } catch {
      showToast('error', 'Failed to load stock report')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(false)
  }, [searchText, enableDateFilter, startDate, endDate, supplierFilter, chemicalFilter])

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  const filteredRows = table.getFilteredRowModel().rows
  const total = filteredRows.length
  const pageSize = table.getState().pagination.pageSize || 10
  const pageIndex = table.getState().pagination.pageIndex || 0

  return (
    <Box>
      {/* Breadcrumb */}
      <Box role='presentation' sx={{ mb: 2 }}>
        <Breadcrumbs aria-label='breadcrumb'>
          <Link underline='hover' color='inherit' href='/'>
            Home
          </Link>
          <Typography color='text.primary'>Stock Report</Typography>
        </Breadcrumbs>
      </Box>

      {/* Main Card */}
      <Card sx={{ p: 3, mt: 2 }}>
        {/* Header with Refresh + Export */}
        <CardHeader
          sx={{
            pb: 1.5,
            pt: 1.5,
            '& .MuiCardHeader-action': { m: 0, alignItems: 'center' },
            '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '1.125rem' }
          }}
          title={
            <Box display='flex' alignItems='center' gap={2}>
              <Typography variant='h5' sx={{ fontWeight: 600 }}>
                Stock Report
              </Typography>
              <Button
                variant='contained'
                color='primary'
                startIcon={
                  <RefreshIcon
                    sx={{
                      animation: loading ? 'spin 1s linear infinite' : 'none',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' }
                      }
                    }}
                  />
                }
                disabled={loading}
                onClick={async () => {
                  setLoading(true)
                  await loadData(true) // show toast on refresh
                  setTimeout(() => setLoading(false), 600)
                }}
                sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </Box>
          }
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {['Copy', 'CSV', 'Excel', 'PDF', 'Print'].map(label => (
                <Button
                  key={label}
                  variant='contained'
                  sx={{
                    backgroundColor: '#5A5A5A',
                    color: 'white',
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '0.8rem',
                    px: 2,
                    py: 0.7,
                    borderRadius: 2,
                    minWidth: 68,
                    boxShadow: 'none',
                    '&:hover': { backgroundColor: '#4b4b4b' }
                  }}
                  onClick={() => showToast('info', `${label} export coming soon`)}
                >
                  {label}
                </Button>
              ))}
            </Box>
          }
        />
        {/* Loader */}
       {loading && (
  <Box
    sx={{
      position: 'fixed',
      inset: 0,
      bgcolor: 'rgba(255,255,255,0.65)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      zIndex: 2000,
      animation: 'fadeIn 0.3s ease-in-out',
      '@keyframes fadeIn': {
        from: { opacity: 0 },
        to: { opacity: 1 }
      }
    }}
  >
    <ProgressCircularCustomization size={70} thickness={5} />
    <Typography
      mt={2}
      sx={{
        color: 'primary.main',
        fontWeight: 600,
        fontSize: '1.05rem',
        letterSpacing: 0.3
      }}
    >
      Loading Stock Report...
    </Typography>
  </Box>
)}


        <Divider sx={{ mb: 2 }} />

        {/* Filters */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3, flexWrap: 'wrap' }}>
          <Box>
            <Box display='flex' alignItems='center' gap={1} sx={{ mb: 0.5 }}>
              <Typography variant='body2' sx={{ fontWeight: 500, color: 'text.primary' }}>
                Date Range
              </Typography>
              <Checkbox size='small' checked={enableDateFilter} onChange={e => setEnableDateFilter(e.target.checked)} />
            </Box>

            <AppReactDatepicker
              selectsRange
              startDate={startDate}
              endDate={endDate}
              onChange={dates => enableDateFilter && dates && setStartDate(dates[0]) && setEndDate(dates[1])}
              shouldCloseOnSelect={false}
              disabled={!enableDateFilter}
              readOnly={!enableDateFilter}
              customInput={
                <CustomTextField
                  size='small'
                  fullWidth
                  value={`${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`}
                  sx={{ minWidth: 260, backgroundColor: 'white' }}
                />
              }
            />
          </Box>

          <CustomAutocomplete
            className='is-[220px]'
            options={['Stock-TECH STOCK 1', 'Supplier-ABC']}
            value={supplierFilter || null}
            onChange={(e, val) => setSupplierFilter(val || '')}
            renderInput={p => <CustomTextField {...p} label='Supplier' size='small' />}
          />

          <CustomAutocomplete
            className='is-[220px]'
            options={['Abate', 'Falcon', 'Aquabac']}
            value={chemicalFilter || null}
            onChange={(e, val) => setChemicalFilter(val || '')}
            renderInput={p => <CustomTextField {...p} label='Chemical' size='small' />}
          />
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Search + Page Size */}
        {/* Search + Page Size */}
        <Box
          sx={{
            p: 2,
            pt: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          {/* Page Size Dropdown (EXACTLY like Material Request) */}
          <FormControl size='small' sx={{ width: 140 }}>
            <Select value={pageSize} onChange={e => table.setPageSize(Number(e.target.value))}>
              {[10, 25, 50, 100].map(s => (
                <MenuItem key={s} value={s}>
                  {s} entries
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Search */}
          <CustomTextField
            size='small'
            placeholder='Search supplier or chemical...'
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            sx={{ width: 360 }}
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
        {/* Table */}
        <Box sx={{ overflowX: 'auto' }}>
          <table
            className={styles.table}
            style={{
              width: 'max-content',
              minWidth: '100%',
              tableLayout: 'fixed' // Ensures column sizes are respected
            }}
          >
            <colgroup>
              <col style={{ width: 80 }} />
              <col style={{ width: 200 }} />
              <col style={{ width: 200 }} />
              <col style={{ width: 160 }} />
              <col style={{ width: 160 }} />
              <col style={{ width: 160 }} />
              <col style={{ width: 160 }} />
              <col style={{ width: 140 }} />
              <col style={{ width: 140 }} />
              <col style={{ width: 140 }} />
              <col style={{ width: 160 }} />
            </colgroup>
            <thead>
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(header => (
                    <th
                      key={header.id}
                      style={{
                        width: header.getSize(),
                        minWidth: header.getSize(),
                        maxWidth: header.getSize()
                      }}
                    >
                      <div
                        className={classnames({
                          'flex items-center': header.column.getIsSorted(),
                          'cursor-pointer select-none': header.column.getCanSort()
                        })}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' && (
                          <ChevronRight className='-rotate-90' fontSize='small' />
                        )}
                        {header.column.getIsSorted() === 'desc' && (
                          <ChevronRight className='rotate-90' fontSize='small' />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className='text-center'>
                    No data available
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} style={{ width: cell.column.getSize() }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            borderTop: '1px solid #e0e0e0',
            px: 3,
            py: 1.5,
            mt: 1,
            gap: 2
          }}
        >
          <Typography color='text.disabled'>
            {`Showing ${total === 0 ? 0 : pageIndex * pageSize + 1} to ${Math.min(
              (pageIndex + 1) * pageSize,
              total
            )} of ${total} entries`}
          </Typography>

          <Pagination
            shape='rounded'
            color='primary'
            variant='tonal'
            count={Math.ceil(total / pageSize) || 1}
            page={pageIndex + 1}
            onChange={(_, page) => {
              table.setPageIndex(page - 1)
            }}
            showFirstButton
            showLastButton
          />
        </Box>
      </Card>

      <ToastContainer />
    </Box>
  )
}
