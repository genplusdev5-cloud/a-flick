'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'

// MUI
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
  Button // ✅ Added here
} from '@mui/material'

import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'

// Components
import CustomContainedButton from '@/components/CustomContainedButton'
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

// ─────────────────────────────────────────────
// Dummy Data
// ─────────────────────────────────────────────
const dummyData = [
  {
    id: 1,
    employee: 'Admin',
    customer: 'GP Industries Pvt Ltd',
    supplier: 'Stock-TECH STOCK 1',
    material: 'Abate',
    usage: 20,
    dosageRemarks: 'Applied for pest control',
    reportDate: '10/10/2025'
  },
  {
    id: 2,
    employee: 'Tech',
    customer: 'ABC Pvt Ltd',
    supplier: 'Stock-TECH STOCK 1',
    material: 'Advion Ant Gel',
    usage: 10,
    dosageRemarks: 'Test usage remarks',
    reportDate: '10/10/2025'
  },
  {
    id: 3,
    employee: 'User A',
    customer: 'Tech Solutions',
    supplier: 'Supplier-B',
    material: 'Aquabac',
    usage: 5,
    dosageRemarks: 'Routine check',
    reportDate: '11/10/2025'
  }
]

// ─────────────────────────────────────────────
// Toast Helper
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// Toast Helper (Fixed)
// ─────────────────────────────────────────────
const showToast = (type, message) => {
  const icons = {
    success: 'tabler-circle-check',
    error: 'tabler-alert-triangle',
    warning: 'tabler-info-circle',
    info: 'tabler-refresh'
  }

  toast(
    <div className='flex items-center gap-2'>
      <i
        className={icons[type] || 'tabler-info-circle'}
        style={{
          color:
            type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : type === 'warning' ? '#f59e0b' : '#2563eb',
          fontSize: '22px'
        }}
      />
      <Typography variant='body2' sx={{ fontSize: '0.9rem', color: '#111' }}>
        {message}
      </Typography>
    </div>,
    {
      position: 'top-right',
      autoClose: 2200,
      hideProgressBar: true,
      pauseOnHover: false,
      closeOnClick: true,
      draggable: false,
      theme: 'light',
      style: {
        borderRadius: '10px',
        padding: '8px 14px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.06)'
      }
    }
  )
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export default function UsageReportPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  const [enableDateFilter, setEnableDateFilter] = useState(false)
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date())

  const [employeeFilter, setEmployeeFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [chemicalFilter, setChemicalFilter] = useState('')
  const [searchText, setSearchText] = useState('')

  // ===== Table Columns =====
  const columnHelper = createColumnHelper()
  const columns = useMemo(
    () => [
      columnHelper.accessor('sno', { header: 'S.No', cell: info => info.getValue() }),
      columnHelper.accessor('employee', { header: 'Employee', cell: info => info.getValue() }),
      columnHelper.accessor('customer', { header: 'Customer', cell: info => info.getValue() }),
      columnHelper.accessor('supplier', { header: 'Supplier', cell: info => info.getValue() }),
      columnHelper.accessor('material', { header: 'Chemical', cell: info => info.getValue() }),
      columnHelper.accessor('usage', { header: 'Usage', cell: info => info.getValue() }),
      columnHelper.accessor('dosageRemarks', { header: 'Dosage Remarks', cell: info => info.getValue() }),
      columnHelper.accessor('reportDate', { header: 'Report Date', cell: info => info.getValue() })
    ],
    []
  )

  const loadData = async (showToastMsg = false) => {
    setLoading(true)
    try {
      const filtered = dummyData.filter(r => {
        const matchSearch =
          !searchText ||
          `${r.employee} ${r.customer} ${r.supplier} ${r.material} ${r.dosageRemarks}`
            .toLowerCase()
            .includes(searchText.toLowerCase())

        const matchDate = (() => {
          if (!enableDateFilter) return true
          const [day, month, year] = r.reportDate.split('/')
          const rowDate = new Date(year + '-' + month + '-' + day)
          return rowDate >= startDate && rowDate <= endDate
        })()

        const matchEmployee = !employeeFilter || r.employee === employeeFilter
        const matchCustomer = !customerFilter || r.customer === customerFilter
        const matchSupplier = !supplierFilter || r.supplier === supplierFilter
        const matchChemical = !chemicalFilter || r.material === chemicalFilter

        return matchSearch && matchDate && matchEmployee && matchCustomer && matchSupplier && matchChemical
      })

      const withSno = filtered.map((r, i) => ({ ...r, sno: i + 1 }))
      setRows(withSno)

      // ✅ only show toast if manually triggered
      if (showToastMsg) {
        showToast('info', 'Usage report refreshed')
      }
    } catch {
      showToast('error', 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // ✅ Correct useEffect — no stray characters
  useEffect(() => {
    loadData(false) // no toast
  }, [searchText, enableDateFilter, startDate, endDate, employeeFilter, customerFilter, supplierFilter, chemicalFilter])

  // ===== React Table =====
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
        {' '}
        <Breadcrumbs aria-label='breadcrumb'>
          {' '}
          <Link underline='hover' color='inherit' href='/'>
            Home{' '}
          </Link>{' '}
          <Typography color='text.primary'>Usage Report</Typography>{' '}
        </Breadcrumbs>{' '}
      </Box>
      <Card sx={{ p: 3, mt: 2 }}>
        {/* Header */}
        <CardHeader
          title={
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2
              }}
            >
              {/* Left Section — Title + Refresh Button */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant='h5' sx={{ fontWeight: 600 }}>
                  Usage Report
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
                    await loadData(true) // show toast only when manually refreshed
                    setTimeout(() => setLoading(false), 600)
                  }}
                  sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </Button>
              </Box>

              {/* Right Section — Export Buttons */}
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
                      py: 2,
                      borderRadius: 1,
                      minWidth: 68,
                      boxShadow: 'none',
                      '&:hover': { backgroundColor: '#4b4b4b' }
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </Box>
            </Box>
          }
          sx={{
            pb: 1.5,
            pt: 1.5,
            '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '1.125rem' }
          }}
        />

        {/* Full-screen Loader */}
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
              Loading Usage Report...
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
              <Checkbox
                size='small'
                checked={enableDateFilter}
                onChange={e => setEnableDateFilter(e.target.checked)}
                sx={{
                  color: '#9c27b0',
                  '&.Mui-checked': { color: '#7367f0' }
                }}
              />
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
                  sx={{
                    minWidth: 260,
                    backgroundColor: 'white',
                    '& .MuiInputBase-input.Mui-disabled': {
                      WebkitTextFillColor: '#555'
                    },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: enableDateFilter ? '#7367f0' : '#d0d0d0'
                      }
                    }
                  }}
                />
              }
            />
          </Box>

          <CustomAutocomplete
            className='is-[220px]'
            options={['Admin', 'Tech', 'User A']}
            value={employeeFilter || null}
            onChange={(e, val) => setEmployeeFilter(val || '')}
            renderInput={params => <CustomTextField {...params} label='Employee' size='small' />}
          />

          <CustomAutocomplete
            className='is-[220px]'
            options={['GP Industries Pvt Ltd', 'ABC Pvt Ltd', 'Tech Solutions']}
            value={customerFilter || null}
            onChange={(e, val) => setCustomerFilter(val || '')}
            renderInput={params => <CustomTextField {...params} label='Customer' size='small' />}
          />

          <CustomAutocomplete
            className='is-[220px]'
            options={['Stock-TECH STOCK 1', 'Supplier-B']}
            value={supplierFilter || null}
            onChange={(e, val) => setSupplierFilter(val || '')}
            renderInput={params => <CustomTextField {...params} label='Supplier' size='small' />}
          />

          <CustomAutocomplete
            className='is-[220px]'
            options={['Abate', 'Advion Ant Gel', 'Aquabac']}
            value={chemicalFilter || null}
            onChange={(e, val) => setChemicalFilter(val || '')}
            renderInput={params => <CustomTextField {...params} label='Chemical' size='small' />}
          />
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Search + Entries control */}
        <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant='body2' color='text.secondary'>
              Show
            </Typography>
            <CustomTextField
              select
              size='small'
              sx={{ width: 140 }}
              value={table.getState().pagination.pageSize}
              onChange={e => {
                table.setPageSize(Number(e.target.value))
                table.setPageIndex(0)
              }}
            >
              {[5, 10, 25, 50, 100].map(size => (
                <MenuItem key={size} value={size}>
                  {size} entries
                </MenuItem>
              ))}
            </CustomTextField>
          </Box>

          <CustomTextField
            size='small'
            placeholder='Search by employee, customer, or chemical...'
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
          <table className={styles.table}>
            <thead>
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(header => (
                    <th key={header.id}>
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
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className='text-center'>
                    Loading...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className='text-center'>
                    No data available
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination Footer */}
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
        </Box>
      </Card>
      <ToastContainer />
    </Box>
  )
}
