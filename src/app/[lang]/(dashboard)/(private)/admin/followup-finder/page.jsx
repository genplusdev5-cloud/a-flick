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

export default function FollowupFinderPage() {
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
  const fetchFollowup = async () => {
    setLoading(true)
    try {
      const res = await getReportFollowupList()

      if (res?.status === 'success') {
        let list = Array.isArray(res.data) ? res.data : []

        // Remove empty rows from backend
        list = list.filter(item => item.customer)

        const normalized = list.map((item, index) => ({
          id: index + 1,
          sno: index + 1,

          customer: item.customer,
          address: item.service_address,
          serviceDate: item.service_date,
          nextServiceDate: item.next_service_date,
          daysDiff: item.days_diff,

          appointmentStatus: item.appointment_status,
          pest: item.pest,
          purpose: item.purpose,
          degree: item.degree,
          technician: item.technician
        }))

        setAllRows(normalized)
        setRowCount(normalized.length)
        setPagination(prev => ({ ...prev, pageIndex: 0 }))
      } else {
        showToast('error', res?.message || 'Failed to fetch follow-up report')
        setAllRows([])
        setRowCount(0)
      }
    } catch (err) {
      console.error('followup fetch error:', err)
      showToast('error', 'Error fetching follow-up report')
      setAllRows([])
      setRowCount(0)
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
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link href='/'>Dashboard</Link>
        <Typography>Follow-Up Finder</Typography>
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
          action={
            <Menu anchorEl={exportAnchorEl} open={Boolean(exportAnchorEl)} onClose={() => setExportAnchorEl(null)}>
              <MenuItem onClick={exportPrint}>
                <PrintIcon sx={{ mr: 1 }} /> Print
              </MenuItem>
              <MenuItem onClick={exportCSV}>
                <FileDownloadIcon sx={{ mr: 1 }} /> CSV
              </MenuItem>
            </Menu>
          }
        />

        <Divider sx={{ mb: 4 }} />

        {/* Filters */}
        {/* FILTERS BLOCK (Date Range ONLY — same layout as other pages) */}
        <Box sx={{ mb: 4 }}>
          {/* ROW 1 — Date Range ABOVE input */}
          <Box sx={{ display: 'flex', flexDirection: 'column', width: 260, mb: 3 }}>
            {/* Checkbox + Label */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Checkbox
                checked={!!fromDate || !!toDate}
                onChange={e => {
                  if (!e.target.checked) {
                    setFromDate('')
                    setToDate('')
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
              }}
              disabled={!fromDate && !toDate}
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

        {/* Table */}
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
    </Box>
  )
}
