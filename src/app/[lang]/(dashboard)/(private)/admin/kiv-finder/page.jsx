'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Box,
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
  Checkbox,
  TextField,
  FormControl,
  Select,
  InputAdornment
} from '@mui/material'

import PermissionGuard from '@/components/auth/PermissionGuard'

import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import GlobalDateRange from '@/components/common/GlobalDateRange'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import PrintIcon from '@mui/icons-material/Print'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'

import { getKviFinderList } from '@/api/kviFinder/list'
import { useRouter } from 'next/navigation'

// Global Components
import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'
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

// Debounced Input
const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
  const [value, setValue] = useState(initialValue)
  useEffect(() => setValue(initialValue), [initialValue])
  useEffect(() => {
    const t = setTimeout(() => onChange(value), debounce)
    return () => clearTimeout(t)
  }, [value])
  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

// Format DD-MM-YYYY
const formatDate = iso => {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`
  } catch {
    return iso
  }
}

const KivFinderPageContent = () => {
  const router = useRouter()

  const [allRows, setAllRows] = useState([])
  const [rows, setRows] = useState([])
  const [rowCount, setRowCount] = useState(0)

  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [searchText, setSearchText] = useState('')

  const [loading, setLoading] = useState(false)
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null })

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [enableDateFilter, setEnableDateFilter] = useState(false)

  // -----------------------------
  // FETCH DATA FROM API
  // -----------------------------
  const fetchKVI = async (payload = {}) => {
    setLoading(true)
    try {
      const res = await getKviFinderList(payload)

      if (res?.status === 'success') {
        let list = Array.isArray(res.results) ? res.results : []

        const normalized = list.map((item, index) => ({
          id: index + 1,
          sno: index + 1,

          customer: item.name, // ✅ correct
          address: item.address, // ✅ correct

          serviceDate: item.service_date, // original date
          nextRoutineDate: item.next_date, // correct key from API

          daysDiff: item.days_diff, // correct

          appointment: item.scheduled, // scheduled → appointment

          pest: item.pest_code, // correct
          technician: item.technician_name, // correct

          degree: item.degree, // correct
          purpose: item.purpose, // correct

          serviceDateFormatted: formatDate(item.service_date),
          nextRoutineDateFormatted: formatDate(item.next_date)
        }))

        setAllRows(normalized)
        setRowCount(normalized.length)
        setPagination(prev => ({ ...prev, pageIndex: 0 }))
      } else {
        showToast('error', res?.message || 'No data found')
        setAllRows([])
        setRowCount(0)
      }
    } catch (err) {
      console.error(err)
      showToast('error', 'Error loading KVI data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKVI()
  }, [])

  // -----------------------------
  // FILTER + PAGINATION
  // -----------------------------
  const loadData = () => {
    let data = [...allRows]

    // DATE FILTER
    if (fromDate) data = data.filter(r => new Date(r.serviceDate) >= new Date(fromDate))
    if (toDate) data = data.filter(r => new Date(r.serviceDate) <= new Date(toDate))

    // SEARCH
    if (searchText) {
      const q = searchText.toLowerCase()
      data = data.filter(
        r =>
          r.customer?.toLowerCase().includes(q) ||
          r.address?.toLowerCase().includes(q) ||
          r.pest?.toLowerCase().includes(q)
      )
    }

    // SORT NEWEST FIRST
    data.sort((a, b) => b.id - a.id)

    // PAGINATION
    const start = pagination.pageIndex * pagination.pageSize
    const end = start + pagination.pageSize

    const pageData = data.slice(start, end)
    setRows(pageData)
    setRowCount(data.length)
  }

  useEffect(() => {
    if (!allRows.length) {
      setRows([])
      setRowCount(0)
      return
    }
    loadData()
  }, [allRows, pagination.pageIndex, pagination.pageSize, fromDate, toDate, searchText])

  // -----------------------------
  // TABLE COLUMNS
  // -----------------------------
  const columnHelper = createColumnHelper()

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'actions',
        header: 'Action',
        cell: info => (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              size='small'
              color='primary'
              onClick={() => router.push(`/admin/kiv/${info.row.original.id}/edit`)}
            >
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
      columnHelper.accessor('nextRoutineDateFormatted', { header: 'Next Routine Date' }),
      columnHelper.accessor('daysDiff', { header: 'Days Diff' }),
      columnHelper.accessor('appointment', { header: 'Appointment' }),
      columnHelper.accessor('pest', { header: 'Pest' }),
      columnHelper.accessor('technician', { header: 'Technician' }),
      columnHelper.accessor('degree', { header: 'Degree' }),
      columnHelper.accessor('purpose', { header: 'Purpose' })
    ],
    []
  )

  const fuzzyFilter = (row, col, value, addMeta) => {
    const rank = rankItem(row.getValue(col), value)
    addMeta({ rank })
    return rank.passed
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
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  // -----------------------------
  // EXPORT CSV + PRINT
  // -----------------------------
  const exportCSV = () => {
    const headers = columns.map(c => c.header).join(',')
    const csv = [
      headers,
      ...rows.map(r =>
        [
          r.customer,
          r.address,
          r.serviceDateFormatted,
          r.nextRoutineDateFormatted,
          r.daysDiff,
          r.appointment,
          r.pest,
          r.technician,
          r.degree,
          r.purpose
        ].join(',')
      )
    ].join('\n')

    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = 'kvi_finder.csv'
    link.click()
    setExportAnchorEl(null)
  }

  const exportPrint = () => {
    const w = window.open('', '_blank')
    const html = `
      <html><body>
      <h2>KVI Finder Report</h2>
      <table border="1" style="width:100%;border-collapse:collapse;">
      <tr>${columns.map(c => `<th>${c.header}</th>`).join('')}</tr>

      ${rows
        .map(
          r => `<tr>
        <td>${r.customer}</td>
        <td>${r.address}</td>
        <td>${r.serviceDateFormatted}</td>
        <td>${r.nextRoutineDateFormatted}</td>
        <td>${r.daysDiff}</td>
        <td>${r.appointment}</td>
        <td>${r.pest}</td>
        <td>${r.technician}</td>
        <td>${r.degree}</td>
        <td>${r.purpose}</td>
      </tr>`
        )
        .join('')}
      </table></body></html>`

    w.document.write(html)
    w.document.close()
    w.print()
    setExportAnchorEl(null)
  }

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <StickyListLayout
      header={
        <Box sx={{ mb: 6 }}>
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link href='/'>Dashboard</Link>
            <Typography>KVI Finder</Typography>
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
                  KVI Finder
                </Typography>

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
                  onClick={() => fetchKVI()}
                  sx={{ textTransform: 'none', height: 36 }}
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </GlobalButton>
              </Box>
            }
            action={
              <Box display='flex' alignItems='center' gap={2}>
                <GlobalButton
                  variant='outlined'
                  color='secondary'
                  endIcon={<ArrowDropDownIcon />}
                  onClick={e => setExportAnchorEl(e.currentTarget)}
                  disabled={!rows.length}
                >
                  Export
                </GlobalButton>

                <Menu anchorEl={exportAnchorEl} open={Boolean(exportAnchorEl)} onClose={() => setExportAnchorEl(null)}>
                  <MenuItem onClick={exportPrint}>
                    <PrintIcon sx={{ mr: 1 }} /> Print
                  </MenuItem>
                  <MenuItem onClick={exportCSV}>
                    <FileDownloadIcon sx={{ mr: 1 }} /> CSV
                  </MenuItem>
                </Menu>
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

          {/* FILTERS */}
          <Box sx={{ mb: 4, flexShrink: 0 }}>
            {/* DATE RANGE BLOCK */}
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
                      fetchKVI() // reload full list
                    }
                  }}
                  size='small'
                />

                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Date Range</Typography>
              </Box>

              {/* Date Range Picker */}
              <GlobalDateRange
                label=''
                start={fromDate}
                end={toDate}
                onSelectRange={({ start, end }) => {
                  setFromDate(start)
                  setToDate(end)
                  fetchKVI({ from_date: start, to_date: end }) // 🔥 call API on date change
                }}
                disabled={!enableDateFilter}
              />
            </Box>

            <Divider sx={{ mb: 4 }} />

            {/* ENTRIES + SEARCH ROW */}
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
                  {[10, 25, 50, 100].map(n => (
                    <MenuItem key={n} value={n}>
                      {n} entries
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Search Box */}
              <DebouncedInput
                value={searchText}
                onChange={v => setSearchText(String(v))}
                placeholder='Search customer, address, pest...'
                sx={{ width: 340 }}
                size='small'
                variant='outlined'
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
                            }[h.column.getIsSorted()] ?? null}
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
          <GlobalButton variant='contained' color='error' onClick={() => showToast('delete', 'Deleted (UI only)')}>
            Delete
          </GlobalButton>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

// Wrapper for RBAC
export default function KivFinderPage() {
  return (
    <PermissionGuard permission="KIV Finder">
      <KivFinderPageContent />
    </PermissionGuard>
  )
}
