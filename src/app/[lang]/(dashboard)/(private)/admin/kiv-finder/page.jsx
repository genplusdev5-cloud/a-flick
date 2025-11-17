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
  TextField,
  FormControl,
  Select,
  InputAdornment
} from '@mui/material'

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

// Dummy KIV Data
const BASE = [
  {
    id: 1,
    customer: 'DBS Trustee Ltd',
    address: '163 Kallang Way',
    serviceDate: '2025-01-03',
    nextRoutineDate: '2025-01-17',
    appointment: 'Pending',
    pest: 'Rodents',
    degree: 'Medium',
    purpose: 'Revisit',
    technician: 'Shan'
  },
  {
    id: 2,
    customer: 'SBCD ARC Pte Ltd',
    address: '460 Alexandra Road',
    serviceDate: '2025-01-05',
    nextRoutineDate: '2025-01-20',
    appointment: 'Completed',
    pest: 'Mosquito',
    degree: 'High',
    purpose: 'Follow Up',
    technician: 'Melvin'
  }
]

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

// Format DD-MM-YYYY
const formatDate = iso => {
  try {
    const d = new Date(iso)
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(
      2,
      '0'
    )}-${d.getFullYear()}`
  } catch {
    return iso
  }
}

export default function KivFinderPage() {
  const router = useRouter()

  const [master] = useState(makeRows)
  const [rows, setRows] = useState([])
  const [rowCount, setRowCount] = useState(master.length)

  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [searchText, setSearchText] = useState('')
  const [loading, setLoading] = useState(false)
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null })

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 25
  })

  const loadData = () => {
    setLoading(true)
    try {
      let data = [...master]

      // Date Filter
      if (fromDate) {
        data = data.filter(r => new Date(r.serviceDate) >= new Date(fromDate))
      }
      if (toDate) {
        data = data.filter(r => new Date(r.serviceDate) <= new Date(toDate))
      }

      // Search
      if (searchText) {
        const q = searchText.toLowerCase()
        data = data.filter(r =>
          r.customer.toLowerCase().includes(q) ||
          r.address.toLowerCase().includes(q) ||
          r.pest.toLowerCase().includes(q)
        )
      }

      // Sort Newest First
      data.sort((a, b) => b.id - a.id)

      const start = pagination.pageIndex * pagination.pageSize
      const end = start + pagination.pageSize

      const paginated = data.slice(start, end).map((r, i) => ({
        ...r,
        sno: start + i + 1,
        serviceDateFormatted: formatDate(r.serviceDate),
        nextRoutineDateFormatted: formatDate(r.nextRoutineDate),
        daysDiff:
          (new Date(r.nextRoutineDate) - new Date(r.serviceDate)) /
          (1000 * 60 * 60 * 24)
      }))

      setRows(paginated)
      setRowCount(data.length)
    } finally {
      setTimeout(() => setLoading(false), 180)
    }
  }

  useEffect(() => {
    loadData()
  }, [pagination.pageIndex, pagination.pageSize, fromDate, toDate, searchText])

  const handleEdit = id => router.push(`/admin/kiv/${id}/edit`)
  const confirmDelete = () => {
    showToast('delete', 'Deleted (UI only)')
    setDeleteDialog({ open: false, row: null })
  }

  const columnHelper = createColumnHelper()

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'actions',
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
    link.download = 'kiv_finder.csv'
    link.click()
    setExportAnchorEl(null)
  }

  const exportPrint = () => {
    const w = window.open('', '_blank')
    const html = `
      <html><body>
      <h2>KIV Finder</h2>
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
      </table>
      </body></html>
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
        <Typography>KIV Finder</Typography>
      </Breadcrumbs>

      <Card sx={{ p: 3 }}>
        <CardHeader
          title={
            <Box display='flex' alignItems='center' gap={2}>
              <Typography variant='h5' sx={{ fontWeight: 600 }}>
                KIV Finder
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
                onClick={() => {
                  setPagination({ ...pagination, pageIndex: 0 })
                  loadData()
                }}
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

              <Menu
                anchorEl={exportAnchorEl}
                open={Boolean(exportAnchorEl)}
                onClose={() => setExportAnchorEl(null)}
              >
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
          <FormControl size='small' sx={{ width: 120 }}>
            <Select
              value={pagination.pageSize}
              onChange={e =>
                setPagination({
                  ...pagination,
                  pageSize: Number(e.target.value),
                  pageIndex: 0
                })
              }
            >
              {[10, 25, 50, 100].map(n => (
                <MenuItem key={n} value={n}>
                  {n} entries
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <GlobalTextField
            type='date'
            label='From Date'
            size='small'
            sx={{ width: 220 }}
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
          />

          <GlobalTextField
            type='date'
            label='To Date'
            size='small'
            sx={{ width: 220 }}
            value={toDate}
            onChange={e => setToDate(e.target.value)}
          />

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
                      <td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
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

        <TablePaginationComponent
          totalCount={rowCount}
          pagination={pagination}
          setPagination={setPagination}
        />
      </Card>

      {/* DELETE DIALOG */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false })}>
        <DialogTitle sx={{ textAlign: 'center' }}>
          <WarningAmberIcon color='error' sx={{ mr: 1 }} />
          Confirm Delete
          <DialogCloseButton onClick={() => setDeleteDialog({ open: false })} />
        </DialogTitle>

        <DialogContent>
          <Typography sx={{ textAlign: 'center' }}>
            Are you sure you want to delete this record?
          </Typography>
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
