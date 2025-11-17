'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Box,
  Button,
  Card,
  CardHeader,
  Typography,
  Menu,
  MenuItem,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Breadcrumbs,
  Chip,
  TextField,
  FormControl,
  Select,
  InputAdornment
} from '@mui/material'

import AddIcon from '@mui/icons-material/Add'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import PrintIcon from '@mui/icons-material/Print'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'

import { useRouter } from 'next/navigation'

// Global Components
import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import { showToast } from '@/components/common/Toasts'

import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table'

import styles from '@core/styles/table.module.css'
import ChevronRight from '@menu/svg/ChevronRight'

// Debounce Input
const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
  const [value, setValue] = useState(initialValue)
  useEffect(() => setValue(initialValue), [initialValue])
  useEffect(() => {
    const t = setTimeout(() => onChange(value), debounce)
    return () => clearTimeout(t)
  }, [value])
  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

// Dummy Data
const BASE = [
  {
    id: 1,
    serviceDate: '2025-01-03',
    scheduleDate: '2025-01-01',
    backlogDays: 2,
    productivity: 3.4,
    frequency: 'Weekly',
    customer: 'DBS Trustee Ltd',
    contactPerson: 'Arun Kumar',
    phone: '91234567',
    timeIn: '10:00 AM',
    timeOut: '11:30 AM',
    serviceType: 'Routine',
    contractType: 'Limited',
    technician: 'Shan',
    pestCode: 'MC01',
    address: '163 Kallang Way',
    postalCode: '349256',
    scheduleStatus: 'Pending',
    serviceStatus: 'Missed',
    remarks: 'Customer not available',
    status: 'Active'
  },
  {
    id: 2,
    serviceDate: '2025-01-10',
    scheduleDate: '2025-01-08',
    backlogDays: 2,
    productivity: 4.2,
    frequency: 'Monthly',
    customer: 'SBCD ARC Pte Ltd',
    contactPerson: 'David Lee',
    phone: '98765432',
    timeIn: '09:00 AM',
    timeOut: '10:10 AM',
    serviceType: 'Follow-Up',
    contractType: 'Continuous',
    technician: 'Melvin',
    pestCode: 'RC02',
    address: '460 Alexandra Road',
    postalCode: '119963',
    scheduleStatus: 'Overdue',
    serviceStatus: 'Pending',
    remarks: 'Technician Delay',
    status: 'Active'
  }
]

// Duplicate for table population
const makeRows = () => {
  const arr = []
  for (let i = 0; i < 10; i++) {
    BASE.forEach((r, idx) => {
      arr.push({
        ...r,
        id: r.id + i * 10 + idx
      })
    })
  }
  return arr
}

// Date formatter
const formatDate = iso => {
  try {
    const d = new Date(iso)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}-${mm}-${yyyy}`
  } catch {
    return iso
  }
}

// MAIN PAGE
export default function BacklogFinderPage() {
  const router = useRouter()

  const [master] = useState(makeRows)
  const [rows, setRows] = useState([])

  const [rowCount, setRowCount] = useState(master.length)
  const [searchText, setSearchText] = useState('')

  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [loading, setLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null })

  const [exportAnchorEl, setExportAnchorEl] = useState(null)

  const loadData = () => {
    setLoading(true)

    try {
      let data = [...master]

      // Apply date filter
      if (fromDate) {
        data = data.filter(r => new Date(r.serviceDate) >= new Date(fromDate))
      }
      if (toDate) {
        data = data.filter(r => new Date(r.serviceDate) <= new Date(toDate))
      }

      // Search
      if (searchText) {
        const q = searchText.toLowerCase()
        data = data.filter(
          r =>
            String(r.customer).toLowerCase().includes(q) ||
            String(r.address).toLowerCase().includes(q) ||
            String(r.pestCode).toLowerCase().includes(q)
        )
      }

      // Sort by id desc
      data.sort((a, b) => b.id - a.id)

      // Pagination
      const start = pagination.pageIndex * pagination.pageSize
      const end = start + pagination.pageSize
      let pageData = data.slice(start, end)

      pageData = pageData.map((r, i) => ({
        ...r,
        sno: start + i + 1,
        serviceDateFormatted: formatDate(r.serviceDate),
        scheduleDateFormatted: formatDate(r.scheduleDate)
      }))

      setRows(pageData)
      setRowCount(data.length)
    } finally {
      setTimeout(() => setLoading(false), 200)
    }
  }

  useEffect(() => {
    loadData()
  }, [pagination.pageIndex, pagination.pageSize, searchText, fromDate, toDate])

  const handleEdit = id => router.push(`/admin/backlog/${id}/edit`)
  const confirmDelete = () => {
    showToast('delete', 'Deleted (UI only)')
    setDeleteDialog({ open: false, row: null })
  }

  const columnHelper = createColumnHelper()
  const columns = useMemo(
    () => [
      columnHelper.accessor('sno', { header: 'ID' }),
      columnHelper.display({
        id: 'action',
        header: 'Action',
        cell: info => (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton size='small' color='primary' onClick={() => handleEdit(info.row.original.id)}>
              <EditIcon />
            </IconButton>
            <IconButton
              size='small'
              color='error'
              onClick={() => setDeleteDialog({ open: true, row: info.row.original })}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        )
      }),

      columnHelper.accessor('serviceDateFormatted', { header: 'Service Date' }),
      columnHelper.accessor('scheduleDateFormatted', { header: 'Schedule Date' }),
      columnHelper.accessor('backlogDays', { header: 'BackLog Days' }),
      columnHelper.accessor('productivity', { header: 'Productivity Value' }),
      columnHelper.accessor('frequency', { header: 'Frequency' }),
      columnHelper.accessor('customer', { header: 'Customer' }),
      columnHelper.accessor('contactPerson', { header: 'Contact Person' }),
      columnHelper.accessor('phone', { header: 'Phone' }),
      columnHelper.accessor('timeIn', { header: 'Appointment Time In' }),
      columnHelper.accessor('timeOut', { header: 'Appointment Time Out' }),
      columnHelper.accessor('serviceType', { header: 'Service Type' }),
      columnHelper.accessor('contractType', { header: 'Contract Type' }),
      columnHelper.accessor('technician', { header: 'Technician' }),
      columnHelper.accessor('pestCode', { header: 'Pest Code' }),
      columnHelper.accessor('address', { header: 'Service Address' }),
      columnHelper.accessor('postalCode', { header: 'Postal Code' }),
      columnHelper.accessor('scheduleStatus', { header: 'Schedule Status' }),
      columnHelper.accessor('serviceStatus', { header: 'Service Status' }),
      columnHelper.accessor('remarks', { header: 'Appointment Remarks' }),

      columnHelper.accessor('status', {
        header: 'Status',
        cell: info => {
          const status = info.getValue()
          return (
            <Chip
              label={status}
              size='small'
              sx={{
                color: '#fff',
                bgcolor: status === 'Active' ? 'success.main' : 'error.main'
              }}
            />
          )
        }
      })
    ],
    []
  )

  const fuzzyFilter = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value)
    addMeta({ itemRank })
    return itemRank.passed
  }

  const table = useReactTable({
    data: rows,
    columns,
    manualPagination: true,
    pageCount: Math.ceil(rowCount / pagination.pageSize),
    state: { globalFilter: searchText, pagination },
    onPaginationChange: setPagination,
    onGlobalFilterChange: setSearchText,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  })

  // Export
  const exportCSV = () => {
    const headers = columns.map(c => c.header).join(',')
    const csv = [
      headers,
      ...rows.map(r =>
        [
          r.sno,
          r.serviceDateFormatted,
          r.scheduleDateFormatted,
          r.backlogDays,
          r.productivity,
          r.frequency,
          r.customer,
          r.contactPerson,
          r.phone,
          r.timeIn,
          r.timeOut,
          r.serviceType,
          r.contractType,
          r.technician,
          r.pestCode,
          r.address,
          r.postalCode,
          r.scheduleStatus,
          r.serviceStatus,
          r.remarks,
          r.status
        ].join(',')
      )
    ].join('\n')

    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = 'backlog_finder.csv'
    link.click()
    setExportAnchorEl(null)
  }

  // Print
  const exportPrint = () => {
    const w = window.open('', '_blank')
    const html = `
      <html><body><table border="1" style="width:100%; border-collapse:collapse;">
      <tr>${columns.map(c => `<th>${c.header}</th>`).join('')}</tr>
      ${rows
        .map(
          r => `<tr>
        <td>${r.sno}</td>
        <td>${r.serviceDateFormatted}</td>
        <td>${r.scheduleDateFormatted}</td>
        <td>${r.backlogDays}</td>
        <td>${r.productivity}</td>
        <td>${r.frequency}</td>
        <td>${r.customer}</td>
        <td>${r.contactPerson}</td>
        <td>${r.phone}</td>
        <td>${r.timeIn}</td>
        <td>${r.timeOut}</td>
        <td>${r.serviceType}</td>
        <td>${r.contractType}</td>
        <td>${r.technician}</td>
        <td>${r.pestCode}</td>
        <td>${r.address}</td>
        <td>${r.postalCode}</td>
        <td>${r.scheduleStatus}</td>
        <td>${r.serviceStatus}</td>
        <td>${r.remarks}</td>
        <td>${r.status}</td>
      </tr>`
        )
        .join('')}
      </table></body></html>
    `
    w.document.write(html)
    w.document.close()
    w.print()
    setExportAnchorEl(null)
  }

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link href='/'>Dashboard</Link>
        <Typography>Backlog Finder</Typography>
      </Breadcrumbs>

      <Card sx={{ p: 3 }}>
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
                Backlog Finder
              </Typography>

              {/* 🔥 REFRESH BUTTON */}
              <GlobalButton
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
                onClick={() => {
                  setPagination({ pageIndex: 0, pageSize: pagination.pageSize })
                  loadData()
                }}
                sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </GlobalButton>
            </Box>
          }
          action={
            <Box display='flex' alignItems='center' gap={2}>


              <Menu anchorEl={exportAnchorEl} open={Boolean(exportAnchorEl)} onClose={() => setExportAnchorEl(null)}>
                <MenuItem onClick={exportPrint}>
                  <PrintIcon fontSize='small' sx={{ mr: 1 }} /> Print
                </MenuItem>
                <MenuItem onClick={exportCSV}>
                  <FileDownloadIcon fontSize='small' sx={{ mr: 1 }} /> CSV
                </MenuItem>
              </Menu>
            </Box>
          }
        />

        <Divider sx={{ mb: 4 }} />

        {/* FILTERS */}
        <Box
          sx={{
            mb: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            flexWrap: 'wrap'
          }}
        >
          {/* 🔥 Entries Dropdown */}
          <FormControl size='small' sx={{ width: 120 }}>
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
              {[10, 25, 50, 100].map(s => (
                <MenuItem key={s} value={s}>
                  {s} entries
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* From Date */}
          <GlobalTextField
            type='date'
            label='From Date'
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            size='small'
            sx={{ width: 220 }}
          />

          {/* To Date */}
          <GlobalTextField
            type='date'
            label='To Date'
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            size='small'
            sx={{ width: 220 }}
          />

          {/* Search */}
          <DebouncedInput
            value={searchText}
            onChange={val => {
              setSearchText(val)
              setPagination(p => ({ ...p, pageIndex: 0 }))
            }}
            placeholder='Search customer, address, pest code...'
            sx={{ width: 340 }}
            size='small'
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

        {/* TABLE */}
        <div className='overflow-x-auto'>
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
                        }[h.column.getIsSorted()] || null}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody>
              {rows.length ? (
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
                    No results found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <TablePaginationComponent totalCount={rowCount} pagination={pagination} setPagination={setPagination} />
      </Card>

      {/* DELETE DIALOG */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false })}>
        <DialogTitle sx={{ textAlign: 'center' }}>
          <WarningAmberIcon color='error' sx={{ mr: 1 }} />
          Confirm Delete
          <DialogCloseButton onClick={() => setDeleteDialog({ open: false })} />
        </DialogTitle>

        <DialogContent>
          <Typography sx={{ textAlign: 'center' }}>Are you sure you want to delete this record?</Typography>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <GlobalButton variant='outlined' onClick={() => setDeleteDialog({ open: false })}>
            Cancel
          </GlobalButton>
          <GlobalButton variant='contained' color='error' onClick={confirmDelete}>
            Delete
          </GlobalButton>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
