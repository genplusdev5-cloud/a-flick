'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'

// MUI
import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import StickyListLayout from '@/components/common/StickyListLayout'
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
  Button
} from '@mui/material'

import PermissionGuard from '@/components/auth/PermissionGuard'

import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'

// Components
import CustomContainedButton from '@/components/CustomContainedButton'
import CustomTextField from '@core/components/mui/TextField'
import CustomAutocomplete from '@core/components/mui/Autocomplete'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

// Toastify
import { toast } from 'react-toastify'
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

// Toast Helper
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

const UsageReportPageContent = () => {
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

      if (showToastMsg) {
        showToast('info', 'Usage report refreshed')
      }
    } catch {
      showToast('error', 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(false)
  }, [searchText, enableDateFilter, startDate, endDate, employeeFilter, customerFilter, supplierFilter, chemicalFilter])

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
    <StickyListLayout
      header={
        <Box sx={{ mb: 6 }}>
          <Box sx={{ mb: 2 }}>
            <Link href='/admin/dashboards' className='text-primary'>
              Dashboard
            </Link>{' '}
            / <Typography component='span'>Usage Report</Typography>
          </Box>
          <Typography variant='h5' sx={{ fontWeight: 600 }}>
            Usage Report
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
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: 'rgba(255,255,255,0.8)',
              backdropFilter: 'blur(2px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10
            }}
          >
            <ProgressCircularCustomization size={60} thickness={5} />
          </Box>
        )}
        <Box sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Divider sx={{ mb: 3 }} />

          {/* FILTERS — SINGLE ROW */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              mb: 3,
              flexWrap: 'nowrap',
              flexShrink: 0
            }}
          >
            {/* Date Range */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant='body2' sx={{ fontWeight: 500 }}>
                  Date Range
                </Typography>
                <Checkbox
                  size='small'
                  checked={enableDateFilter}
                  onChange={e => setEnableDateFilter(e.target.checked)}
                  sx={{ p: 0 }}
                />
              </Box>

              <AppReactDatepicker
                selectsRange
                startDate={startDate}
                endDate={endDate}
                onChange={dates => {
                  if (enableDateFilter && dates) {
                    setStartDate(dates[0])
                    setEndDate(dates[1])
                  }
                }}
                disabled={!enableDateFilter}
                readOnly={!enableDateFilter}
                customInput={
                  <CustomTextField
                    size='small'
                    sx={{
                      width: 260,
                      backgroundColor: 'white',
                      '& .MuiInputBase-root': { height: 40 }
                    }}
                    value={`${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`}
                  />
                }
              />
            </Box>

            {/* Employee */}
            <Box>
              <Typography variant='body2' sx={{ fontWeight: 500, mb: 0.5 }}>
                Employee
              </Typography>
              <CustomAutocomplete
                options={['Admin', 'Tech', 'User A']}
                value={employeeFilter || null}
                onChange={(e, val) => setEmployeeFilter(val || '')}
                renderInput={p => (
                  <CustomTextField {...p} size='small' sx={{ width: 220, '& .MuiInputBase-root': { height: 40 } }} />
                )}
              />
            </Box>

            {/* Customer */}
            <Box>
              <Typography variant='body2' sx={{ fontWeight: 500, mb: 0.5 }}>
                Customer
              </Typography>
              <CustomAutocomplete
                options={['GP Industries Pvt Ltd', 'ABC Pvt Ltd', 'Tech Solutions']}
                value={customerFilter || null}
                onChange={(e, val) => setCustomerFilter(val || '')}
                renderInput={p => (
                  <CustomTextField {...p} size='small' sx={{ width: 220, '& .MuiInputBase-root': { height: 40 } }} />
                )}
              />
            </Box>

            {/* Supplier */}
            <Box>
              <Typography variant='body2' sx={{ fontWeight: 500, mb: 0.5 }}>
                Supplier
              </Typography>
              <CustomAutocomplete
                options={['Stock-TECH STOCK 1', 'Supplier-B']}
                value={supplierFilter || null}
                onChange={(e, val) => setSupplierFilter(val || '')}
                renderInput={p => (
                  <CustomTextField {...p} size='small' sx={{ width: 220, '& .MuiInputBase-root': { height: 40 } }} />
                )}
              />
            </Box>

            {/* Chemical */}
            <Box>
              <Typography variant='body2' sx={{ fontWeight: 500, mb: 0.5 }}>
                Chemical
              </Typography>
              <CustomAutocomplete
                options={['Abate', 'Advion Ant Gel', 'Aquabac']}
                value={chemicalFilter || null}
                onChange={(e, val) => setChemicalFilter(val || '')}
                renderInput={p => (
                  <CustomTextField {...p} size='small' sx={{ width: 220, '& .MuiInputBase-root': { height: 40 } }} />
                )}
              />
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Toolbar Row */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
              mb: 3,
              flexShrink: 0
            }}
          >
            {/* LEFT: Entries + Export Buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <CustomTextField
                select
                size='small'
                sx={{ width: 140 }}
                value={pageSize}
                onChange={e => {
                  table.setPageSize(Number(e.target.value))
                  table.setPageIndex(0)
                }}
              >
                {[10, 25, 50, 100].map(size => (
                  <MenuItem key={size} value={size}>
                    {size} entries
                  </MenuItem>
                ))}
              </CustomTextField>

              <Box sx={{ display: 'flex', gap: 1.5 }}>
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
                      '&:hover': { backgroundColor: '#4b4b4b' }
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </Box>
            </Box>

            {/* RIGHT: Search */}
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

          <Box sx={{ position: 'relative', flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <StickyTableWrapper rowCount={rows.length}>
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
            </StickyTableWrapper>
          </Box>

          <Box sx={{ mt: 'auto', flexShrink: 0, pt: 4 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
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
        </Box>
      </Card>
    </StickyListLayout>
  )
}

// Wrapper for RBAC
export default function UsageReportPage() {
  return (
    <PermissionGuard permission='Usage Report'>
      <UsageReportPageContent />
    </PermissionGuard>
  )
}
