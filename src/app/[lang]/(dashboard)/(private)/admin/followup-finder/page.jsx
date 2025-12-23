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
  Checkbox,
  FormControl,
  Select,
  InputAdornment
} from '@mui/material'

import PermissionGuard from '@/components/auth/PermissionGuard'

import { getReportFollowupList } from '@/api/reportFollowup/list'
import GlobalDateRange from '@/components/common/GlobalDateRange'

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
import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'
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
import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import StickyListLayout from '@/components/common/StickyListLayout'

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

const FollowupFinderPageContent = () => {
  const router = useRouter()

  const [allRows, setAllRows] = useState([])
  const [rows, setRows] = useState([])
  const [rowCount, setRowCount] = useState(0)

  const [searchText, setSearchText] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const [loading, setLoading] = useState(false)
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null })
  const [enableDateFilter, setEnableDateFilter] = useState(false)

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 25
  })

  // ----------------------------
  // Load table after filters / pagination
  // ----------------------------
  const loadData = () => {
    setLoading(true)
    try {
      let data = [...allRows]

      if (fromDate) {
        data = data.filter(r => new Date(r.serviceDate) >= new Date(fromDate))
      }
      if (toDate) {
        data = data.filter(r => new Date(r.serviceDate) <= new Date(toDate))
      }

      if (searchText) {
        const q = searchText.toLowerCase()
        data = data.filter(
          r =>
            r.customer.toLowerCase().includes(q) ||
            r.address.toLowerCase().includes(q) ||
            r.pest.toLowerCase().includes(q)
        )
      }

      data.sort((a, b) => b.id - a.id)

      const start = pagination.pageIndex * pagination.pageSize
      const end = start + pagination.pageSize

      const paginated = data.slice(start, end).map((r, i) => ({
        ...r,
        sno: start + i + 1,
        serviceDateFormatted: formatDate(r.serviceDate),
        nextServiceDateFormatted: formatDate(r.nextServiceDate)
      }))

      setRows(paginated)
      setRowCount(data.length)
    } finally {
      setTimeout(() => setLoading(false), 180)
    }
  }

  // ----------------------------
  // Fetch from API
  // ----------------------------
  const fetchFollowup = async (payload = {}) => {
    setLoading(true)
    try {
      const res = await getReportFollowupList(payload)

      if (res?.status === 'success') {
        let list = Array.isArray(res.results) ? res.results : []

        const normalized = list.map((item, index) => ({
          id: index + 1,
          sno: index + 1,

          customer: item.name, // ✅ correct
          address: item.address, // ✅ correct

          serviceDate: item.service_date, // date
          nextServiceDate: item.next_date || '', // correct key
          daysDiff: item.days_diff, // correct

          appointmentStatus: item.scheduled, // appointment status = scheduled

          pest: item.pest_code, // correct
          purpose: item.purpose, // correct
          degree: item.degree, // correct
          technician: item.technician_name // correct
        }))

        setAllRows(normalized)
        setRowCount(normalized.length)
        setPagination(prev => ({ ...prev, pageIndex: 0 }))
      } else {
        showToast('error', res?.message || 'No data')
        setAllRows([])
        setRowCount(0)
      }
    } catch (err) {
      console.error('fetch error:', err)
      showToast('error', 'Error fetching follow-up data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFollowup()
  }, [])

  useEffect(() => {
    if (!allRows.length) {
      setRows([])
      setRowCount(0)
      return
    }
    loadData()
  }, [allRows, pagination.pageIndex, pagination.pageSize, searchText, fromDate, toDate])

  const handleEdit = id => router.push(`/admin/followup/${id}/edit`)
  const confirmDelete = () => {
    showToast('delete', 'Deleted (UI only)')
    setDeleteDialog({ open: false, row: null })
  }

  const columnHelper = createColumnHelper()
  const columns = [
    columnHelper.accessor('sno', { header: 'ID' }),
    columnHelper.display({
      id: 'actions',
      header: 'Action',
      cell: info => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size='small' color='primary' onClick={() => handleEdit(info.row.original.id)}>
            <i className='tabler-edit text-blue-600 text-lg' />
          </IconButton>
          <IconButton
            size='small'
            color='error'
            onClick={() => setDeleteDialog({ open: true, row: info.row.original })}
          >
            <i className='tabler-trash text-red-600 text-lg' />
          </IconButton>
        </Box>
      )
    }),

    columnHelper.accessor('customer', { header: 'Customer' }),
    columnHelper.accessor('address', { header: 'Service Address' }),
    columnHelper.accessor('serviceDateFormatted', { header: 'Service Date' }),
    columnHelper.accessor('nextServiceDateFormatted', { header: 'Next Service Date' }),
    columnHelper.accessor('daysDiff', { header: 'Days Diff' }),
    columnHelper.accessor('appointmentStatus', { header: 'Appointment Status' }),
    columnHelper.accessor('pest', { header: 'Pest' }),
    columnHelper.accessor('purpose', { header: 'Purpose' }),
    columnHelper.accessor('degree', { header: 'Degree' }),
    columnHelper.accessor('technician', { header: 'Technician' })
  ]

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

  // ----------------------------
  // Export CSV + Print
  // ----------------------------
  const exportCSV = () => {
    const headers = columns.map(c => c.header).join(',')
    const csv = [
      headers,
      ...rows.map(r =>
        [
          r.sno,
          r.customer,
          r.address,
          r.serviceDateFormatted,
          r.nextServiceDateFormatted,
          r.daysDiff,
          r.appointmentStatus,
          r.pest,
          r.purpose,
          r.degree,
          r.technician
        ].join(',')
      )
    ].join('\n')

    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = 'followup_finder.csv'
    link.click()
    setExportAnchorEl(null)
  }

  const exportPrint = () => {
    const w = window.open('', '_blank')
    const html = `
      <html><body><h2>Follow-Up Finder</h2>
      <table border="1" style="width:100%;border-collapse:collapse;">
      <tr>${columns.map(c => `<th>${c.header}</th>`).join('')}</tr>
      ${rows
        .map(
          r => `<tr>
        <td>${r.sno}</td>
        <td>${r.customer}</td>
        <td>${r.address}</td>
        <td>${r.serviceDateFormatted}</td>
        <td>${r.nextServiceDateFormatted}</td>
        <td>${r.daysDiff}</td>
        <td>${r.appointmentStatus}</td>
        <td>${r.pest}</td>
        <td>${r.purpose}</td>
        <td>${r.degree}</td>
        <td>${r.technician}</td>
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
    <>
      <StickyListLayout
      header={
        <Box sx={{ mb: 6 }}>
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link href='/'>Dashboard</Link>
            <Typography>Follow-Up Finder</Typography>
          </Breadcrumbs>
          <CardHeader
            sx={{
              p: 0,
              '& .MuiCardHeader-action': { m: 0, alignItems: 'center' },
              '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '1.5rem' }
            }}
            title={
              <Box display='flex' alignItems='center' gap={2}>
                <Typography variant='h5' sx={{ fontWeight: 600 }}>
                  Follow-Up Finder
                </Typography>

                <GlobalButton
                  variant='contained'
                  color='primary'
                  startIcon={<RefreshIcon />}
                  disabled={loading}
                  onClick={() => fetchFollowup()}
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </GlobalButton>
              </Box>
            }
          />
        </Box>
      }
    >
      <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, position: 'relative' }}>
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

          {/* Filters */}
          <Box sx={{ mb: 4, flexShrink: 0 }}>
            {/* ROW 1 — Date Range ABOVE input */}
            <Box sx={{ display: 'flex', flexDirection: 'column', width: 260, mb: 3 }}>
              {/* Checkbox + Label */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Checkbox
                  checked={enableDateFilter}
                  onChange={e => {
                    const checked = e.target.checked
                    setEnableDateFilter(checked)

                    if (!checked) {
                      setFromDate('')
                      setToDate('')
                      fetchFollowup() // reload full list
                    }
                  }}
                  size='small'
                />
                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Date Range</Typography>
              </Box>

              {/* Single Date Range Picker */}
              <GlobalDateRange
                label=''
                start={fromDate}
                end={toDate}
                onSelectRange={({ start, end }) => {
                  setFromDate(start)
                  setToDate(end)
                  fetchFollowup({ from_date: start, to_date: end }) // 🔥 auto filter
                }}
                disabled={!enableDateFilter}
              />
            </Box>
            <Divider sx={{ mb: 4 }} />

            {/* ROW 2 — Entries Dropdown + Search Box */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 3
              }}
            >
              {/* Entries Dropdown */}
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

              {/* Search */}
              <DebouncedInput
                value={searchText}
                onChange={v => setSearchText(String(v))}
                placeholder='Search customer, address, pest...'
                sx={{ width: 340 }}
                variant='outlined'
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
          </Box>

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
            </StickyTableWrapper>
          </Box>

          <TablePaginationComponent totalCount={rowCount} pagination={pagination} setPagination={setPagination} />
        </Box>
      </Card>
    </StickyListLayout>

      {/* Delete Dialog */}
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
    </>
  )
}

// Wrapper for RBAC
export default function FollowupFinderPage() {
  return (
    <PermissionGuard permission="Followup Finder">
      <FollowupFinderPageContent />
    </PermissionGuard>
  )
}
