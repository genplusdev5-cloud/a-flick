'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { openDB } from 'idb'
import {
  Box,
  Button,
  Card,
  CardHeader,
  Typography,
  Divider,
  Breadcrumbs,
  Checkbox,
  CircularProgress,
  Pagination,
  InputAdornment,
  Chip,
  IconButton,
  Grid,
  FormControl,
  Select,
  MenuItem,
  FormControlLabel
} from '@mui/material'

import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import StatusChip from '@/components/common/StatusChip'

import { getTmMaterialRequestList } from '@/api/materialRequest/list'
import { deleteTmMaterialRequest } from '@/api/materialRequest/delete'

import CustomTextField from '@core/components/mui/TextField'
import CustomAutocomplete from '@core/components/mui/Autocomplete'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import GlobalDateRange from '@/components/common/GlobalDateRange'

import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'

import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

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
import { format } from 'date-fns'
import { showToast } from '@/components/common/Toasts'

// ───────────────────────────────────────
// Main Component
// ───────────────────────────────────────
export default function MaterialRequestPage() {
  const router = useRouter()

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  // Filters
  const [enableDateFilter, setEnableDateFilter] = useState(false)
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date())
  const [requestStatus, setRequestStatus] = useState('')
  const [fromLocation, setFromLocation] = useState('')
  const [toLocation, setToLocation] = useState('')
  const [requestedBy, setRequestedBy] = useState('')
  const [searchText, setSearchText] = useState('')
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null })
  const [sorting, setSorting] = useState([])

  // ✅ Confirm delete (properly scoped)
  const confirmDelete = async () => {
    try {
      const row = deleteDialog.row
      if (!row) return

      await deleteTmMaterialRequest(row.id)

      showToast('delete', `Request ${row.requestNo || `REQ-${row.id}`} deleted`)
      await loadData()
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to delete request')
    } finally {
      setDeleteDialog({ open: false, row: null })
    }
  }

  const statusRef = useRef(null)
  const fromRef = useRef(null)
  const toRef = useRef(null)
  const byRef = useRef(null)

  // Load + Filter
  const loadData = async (showToastMsg = false) => {
    setLoading(true)
    try {
      const response = await getTmMaterialRequestList()
      const data = response?.data?.results || []

      // 1️⃣ MAP API → UI FIELDS (camelCase)
      const mapped = data.map(r => {
        const reqNo = r.request_no || `REQ-${r.id}`

        return {
          id: r.id,

          // table columns
          requestType: r.request_type || 'Material',
          requestNo: reqNo,
          requestDate: r.request_date, // "2025-11-04"

          fromLocation: r.from_location || r.from_location_supplier || '',
          toLocation: r.to_location || r.to_location_supplier || '',

          requestedBy: r.requested_by_name || r.employee_name || (r.employee_id ? `EMP-${r.employee_id}` : ''),

          approvedStatus: r.is_approved === 1 ? 'Yes' : 'N/A',
          issuedStatus: r.is_issued === 1 ? 'Yes' : 'N/A', // if API doesn’t have, stays N/A
          completedStatus: r.is_completed === 1 ? 'Yes' : 'No',

          remarks: r.remarks || '',
          status: r.request_status || 'Waiting'
        }
      })

      // 2️⃣ APPLY FILTERS ON MAPPED DATA
      const filtered = mapped.filter(row => {
        const text = searchText.trim().toLowerCase()

        const matchesSearch = !text || Object.values(row).join(' ').toLowerCase().includes(text)

        const matchesDate = !enableDateFilter
          ? true
          : row.requestDate && new Date(row.requestDate) >= startDate && new Date(row.requestDate) <= endDate

        const matchesStatus = !requestStatus || row.status === requestStatus
        const matchesFrom = !fromLocation || row.fromLocation === fromLocation
        const matchesTo = !toLocation || row.toLocation === toLocation
        const matchesBy = !requestedBy || row.requestedBy === requestedBy

        return matchesSearch && matchesDate && matchesStatus && matchesFrom && matchesTo && matchesBy
      })

      // 3️⃣ ADD S.NO
      const withSno = filtered.map((row, i) => ({ ...row, sno: i + 1 }))

      setRows(withSno)

      // toast only from Refresh button
      if (showToastMsg) {
        showToast('info', 'Material requests refreshed')
      }
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(false) // Never show toast here
  }, [searchText, enableDateFilter, startDate, endDate, requestStatus, fromLocation, toLocation, requestedBy])

  // Actions
  const handleDelete = async row => {
    await deleteTmMaterialRequest(row.id)

    showToast('delete', 'Request deleted')
    loadData()
  }

  const handleEdit = row => {
    router.push(`/admin/stock/material-request/${encodeURIComponent(row.id)}/edit`)
  }

  const getStatusColor = status => {
    switch (status) {
      case 'Completed':
        return '#4caf50'
      case 'Pending':
        return '#ff9800'
      case 'Issued':
        return '#2196f3'
      case 'Approved':
        return '#8bc34a'
      case 'Declined':
      case 'Rejected':
        return '#f44336'
      default:
        return '#9e9e9e'
    }
  }

  // Export
  const exportCSV = () => {
    const headers = columns.map(c => c.header).filter(Boolean)
    const csv = [
      headers.join(','),
      ...rows.map(r =>
        columns.map(col => `"${(r[col.accessorKey ?? col.id] ?? '').toString().replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n')
    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = 'material_requests.csv'
    link.click()
    showToast('success', 'CSV downloaded')
  }

  const exportPrint = () => {
    const w = window.open('', '_blank')
    const html = `
      <html><head><title>Material Requests</title>
      <style>
        body{font-family:Arial;padding:24px;}
        table{border-collapse:collapse;width:100%;font-size:11px;}
        th,td{border:1px solid #ccc;padding:6px;text-align:left;}
        th{background:#f4f4f4;}
        .pill{padding:2px 8px;border-radius:12px;color:#fff;font-weight:600;}
      </style></head><body>
      <h2>Material Request List</h2>
      <table><thead><tr>
      ${columns.map(c => `<th>${c.header}</th>`).join('')}
      </tr></thead><tbody>
      ${rows
        .map(
          r =>
            `<tr>${columns
              .map(col => {
                const raw = r[col.accessorKey ?? col.id] ?? ''
                let val = raw
                if (col.accessorKey?.includes('Date') && raw) val = new Date(raw).toLocaleDateString('en-GB')
                else if (col.id === 'status')
                  val = `<span class="pill" style="background:${getStatusColor(raw)}">${raw}</span>`
                return `<td>${val}</td>`
              })
              .join('')}</tr>`
        )
        .join('')}
      </tbody></table></body></html>`
    w?.document.write(html)
    w?.document.close()
    w?.print()
  }

  // Columns
  const columnHelper = createColumnHelper()
  const columns = useMemo(
    () => [
      columnHelper.accessor('sno', {
        header: 'S.No',
        size: 60,
        enableSorting: false
      }),

      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        size: 100,
        enableSorting: false,
        cell: ({ row }) => {
          const encodedId = btoa(String(row.original.id))

          return (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                size='small'
                color='primary'
                onClick={() => router.push(`/admin/stock/material-request/${encodedId}/edit`)}
              >
                <i className='tabler-edit text-blue-600 text-lg' />
              </IconButton>

              <IconButton size='small' color='error' onClick={() => setDeleteDialog({ open: true, row: row.original })}>
                <i className='tabler-trash text-red-600 text-lg' />
              </IconButton>
            </Box>
          )
        }
      }),
      // ✔ Comes from mapped.requestType
      columnHelper.accessor('requestType', {
        header: 'Request Type',
        size: 150
      }),

      // ✔ Comes from mapped.requestNo
      columnHelper.accessor('requestNo', {
        header: 'Request No',
        size: 150
      }),

      // ✔ Comes from mapped.requestDate
      columnHelper.accessor('requestDate', {
        header: 'Request Date',
        size: 130,
        cell: info => {
          const d = info.getValue()
          return d ? format(new Date(d), 'dd/MM/yyyy') : ''
        }
      }),

      // ✔ Comes from mapped.fromLocation
      columnHelper.accessor('fromLocation', {
        header: 'From Location/Supplier',
        size: 200
      }),

      // ✔ Comes from mapped.toLocation
      columnHelper.accessor('toLocation', {
        header: 'To Location/Supplier',
        size: 200
      }),

      // ✔ Comes from mapped.requestedBy
      columnHelper.accessor('requestedBy', {
        header: 'Requested By',
        size: 140
      }),

      // ------- STATUS COLUMNS -------

      columnHelper.display({
        id: 'isApproved',
        header: 'Is Approved',
        size: 120,
        enableSorting: false,
        cell: ({ row }) => <StatusChip status={row.original.approvedStatus} />
      }),

      columnHelper.display({
        id: 'isIssued',
        header: 'Is Issued',
        size: 120,
        enableSorting: false,
        cell: ({ row }) => <StatusChip status={row.original.issuedStatus} />
      }),

      columnHelper.display({
        id: 'isCompleted',
        header: 'Is Completed',
        size: 120,
        enableSorting: false,
        cell: ({ row }) => <StatusChip status={row.original.completedStatus} />
      }),

      // ✔ Comes from mapped.remarks
      columnHelper.accessor('remarks', {
        header: 'Remarks',
        size: 200
      }),

      // ✔ Comes from mapped.status
      columnHelper.accessor('status', {
        header: 'Request Status',
        size: 150,
        cell: info => <StatusChip status={info.getValue()} />
      })
    ],
    []
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      sorting
    },
    onSortingChange: setSorting,
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
          <Typography color='text.primary'>Material Request</Typography>
        </Breadcrumbs>
      </Box>

      {/* Main Card */}
      <Card sx={{ p: 3, mt: 2 }}>
        {/* Header */}
        <CardHeader
          sx={{
            pb: 1.5,
            pt: 1.5,
            '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '1.125rem' },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between' // ⭐ this aligns Refresh & Add Request right
          }}
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Title */}
              <Typography variant='h5' sx={{ fontWeight: 600 }}>
                Material Request List
              </Typography>

              {/* Refresh Button */}
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
                onClick={() => {
                  setLoading(true)
                  setTimeout(async () => {
                    await loadData(true)
                    setLoading(false)
                  }, 50)
                }}
                sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </Box>
          }
          action={
            <Button
              variant='contained'
              color='primary'
              startIcon={<AddIcon />}
              onClick={() => router.push('/admin/stock/material-request/add')}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                px: 2.5,
                height: 36
              }}
            >
              Add Request
            </Button>
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
              Loading Material Requests...
            </Typography>
          </Box>
        )}

        <Divider sx={{ mb: 2 }} />

        {/* FILTER WRAPPER */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '260px repeat(4, 220px)',
            columnGap: 3,
            rowGap: 1,
            mb: 3
          }}
        >
          {/* ---------- ROW 1: LABELS ---------- */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant='body2' sx={{ fontWeight: 500 }}>
              Date Filter
            </Typography>
            <Checkbox size='small' checked={enableDateFilter} onChange={e => setEnableDateFilter(e.target.checked)} />
          </Box>

          <Typography variant='body2' sx={{ fontWeight: 500 }}>
            Request Status
          </Typography>
          <Typography variant='body2' sx={{ fontWeight: 500 }}>
            From Location/Supplier
          </Typography>
          <Typography variant='body2' sx={{ fontWeight: 500 }}>
            To Location/Supplier
          </Typography>
          <Typography variant='body2' sx={{ fontWeight: 500 }}>
            Requested By
          </Typography>

          {/* ---------- ROW 2: INPUTS ---------- */}
          <Box sx={{ width: '100%' }}>
            <GlobalDateRange
              label=''
              start={startDate}
              end={endDate}
              onSelectRange={({ start, end }) => {
                setStartDate(start)
                setEndDate(end)
              }}
              disabled={!enableDateFilter}
            />
          </Box>

          <CustomAutocomplete
            options={['Waiting', 'Pending', 'Rejected', 'Approved', 'Issued', 'Completed', 'Declined']}
            value={requestStatus || null}
            onChange={(e, val) => setRequestStatus(val || '')}
            renderInput={p => <CustomTextField {...p} size='small' />}
          />

          <CustomAutocomplete
            options={['Stock-TECH STOCK 1', 'Supplier-ABC']}
            value={fromLocation || null}
            onChange={(e, val) => setFromLocation(val || '')}
            renderInput={p => <CustomTextField {...p} size='small' />}
          />

          <CustomAutocomplete
            options={['Stock-TECH STOCK 1', 'Stock-TECH STOCK 2', 'Site-A', 'Site-B', 'Site-C']}
            value={toLocation || null}
            onChange={(e, val) => setToLocation(val || '')}
            renderInput={p => <CustomTextField {...p} size='small' />}
          />

          <CustomAutocomplete
            options={['Admin', 'Tech', 'John Doe', 'Jane Smith']}
            value={requestedBy || null}
            onChange={(e, val) => setRequestedBy(val || '')}
            renderInput={p => <CustomTextField {...p} size='small' />}
          />
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Search + Page Size */}
        {/* Toolbar Row */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            mb: 2
          }}
        >
          {/* LEFT SIDE: Entries + Export Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {/* Entries */}
            <FormControl size='small' sx={{ width: 120 }}>
              <Select value={pageSize} onChange={e => table.setPageSize(Number(e.target.value))}>
                {[10, 25, 50, 100].map(s => (
                  <MenuItem key={s} value={s}>
                    {s} entries
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Export Buttons */}
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
                    boxShadow: 'none',
                    '&:hover': { backgroundColor: '#4b4b4b' }
                  }}
                  onClick={() => {
                    if (label === 'CSV') exportCSV()
                    else if (label === 'Print') exportPrint()
                    else showToast('info', `${label} export coming soon`)
                  }}
                >
                  {label}
                </Button>
              ))}
            </Box>
          </Box>

          {/* RIGHT SIDE: Search */}
          <CustomTextField
            size='small'
            placeholder='Search any field...'
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            sx={{ width: 350 }}
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
              tableLayout: 'fixed'
            }}
          >
            <colgroup>
              <col style={{ width: 60 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 150 }} />
              <col style={{ width: 150 }} />
              <col style={{ width: 130 }} />
              <col style={{ width: 200 }} />
              <col style={{ width: 200 }} />
              <col style={{ width: 140 }} />
              <col style={{ width: 120 }} />
              <col style={{ width: 120 }} />
              <col style={{ width: 120 }} />
              <col style={{ width: 200 }} />
              <col style={{ width: 150 }} />
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
                  <td colSpan={columns.length} className='text-center py-4'>
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

        {/* Pagination */}
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
            onChange={(_, page) => table.setPageIndex(page - 1)}
            showFirstButton
            showLastButton
          />
        </Box>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        onClose={() => setDeleteDialog({ open: false, row: null })}
        aria-labelledby='delete-request-dialog'
        open={deleteDialog.open}
        closeAfterTransition={false}
        PaperProps={{
          sx: {
            overflow: 'visible',
            width: 420,
            borderRadius: 1,
            textAlign: 'center'
          }
        }}
      >
        {/* 🔴 Header with Close Button */}
        <DialogTitle
          id='delete-request-dialog'
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            color: 'error.main',
            fontWeight: 700,
            pb: 1,
            position: 'relative'
          }}
        >
          <WarningAmberIcon color='error' sx={{ fontSize: 26 }} />
          Confirm Delete
          {/* ❌ Close Button */}
          <DialogCloseButton
            onClick={() => setDeleteDialog({ open: false, row: null })}
            disableRipple
            sx={{ position: 'absolute', right: 1, top: 1 }}
          >
            <i className='tabler-x' />
          </DialogCloseButton>
        </DialogTitle>

        {/* 🧾 Message */}
        <DialogContent sx={{ px: 5, pt: 1 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: 14, lineHeight: 1.6 }}>
            Are you sure you want to delete material request{' '}
            <strong style={{ color: '#d32f2f' }}>
              {deleteDialog.row?.requestNo || `REQ-${deleteDialog.row?.id || ''}`}
            </strong>
            ?
            <br />
            This action cannot be undone.
          </Typography>
        </DialogContent>

        {/* ⚙️ Buttons */}
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3, pt: 2 }}>
          <Button
            onClick={() => setDeleteDialog({ open: false, row: null })}
            variant='tonal'
            color='secondary'
            sx={{ minWidth: 100, textTransform: 'none', fontWeight: 500 }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            variant='contained'
            color='error'
            sx={{ minWidth: 100, textTransform: 'none', fontWeight: 600 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer />
    </Box>
  )
}
