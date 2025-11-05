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

import CustomTextField from '@core/components/mui/TextField'
import CustomAutocomplete from '@core/components/mui/Autocomplete'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

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

// ───────────────────────────────────────
// IndexedDB
// ───────────────────────────────────────
const DB_NAME = 'material_request_db'
const STORE_NAME = 'requests'

const initDB = async () => {
  return await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

const loadRequests = async () => {
  const db = await initDB()
  const all = await db.getAll(STORE_NAME)
  return all.sort((a, b) => b.id - a.id)
}

const deleteRequest = async id => {
  const db = await initDB()
  await db.delete(STORE_NAME, Number(id))
}

// ───────────────────────────────────────
// Toast (same style as Stock Report)
// ───────────────────────────────────────
const showToast = (type, message) => {
  toast(
    <div className='flex items-center gap-2'>
      <i
        className='tabler-info-circle'
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

// ───────────────────────────────────────
// Dummy Data (replace with API later)
// ───────────────────────────────────────
const dummyRequests = [
  {
    id: 1,
    requestNo: 'REQ-001',
    requestDate: '2025-10-15',
    requestType: 'Transfer',
    fromLocation: 'Stock-TECH STOCK 1',
    toLocation: 'Site-A',
    requestedBy: 'John Doe',
    status: 'Approved',
    approvedStatus: 'Approved',
    issuedStatus: 'Issued',
    completedStatus: 'Yes',
    remarks: 'Urgent transfer'
  },
  {
    id: 2,
    requestNo: 'REQ-002',
    requestDate: '2025-10-16',
    requestType: 'Purchase',
    fromLocation: 'Supplier-ABC',
    toLocation: 'Stock-TECH STOCK 1',
    requestedBy: 'Jane Smith',
    status: 'Pending',
    approvedStatus: 'Pending',
    issuedStatus: 'Pending',
    completedStatus: 'No',
    remarks: ''
  },
  {
    id: 3,
    requestNo: 'REQ-003',
    requestDate: '2025-10-17',
    requestType: 'Transfer',
    fromLocation: 'Stock-TECH STOCK 1',
    toLocation: 'Site-C',
    requestedBy: 'Admin',
    status: 'Issued',
    approvedStatus: 'Approved',
    issuedStatus: 'Issued',
    completedStatus: 'No',
    remarks: 'Partial issue'
  }
]

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

  const statusRef = useRef(null)
  const fromRef = useRef(null)
  const toRef = useRef(null)
  const byRef = useRef(null)

  // Load + Filter
  const loadData = async (showToastMsg = false) => {
    setLoading(true)
    try {
      let data = dummyRequests // Replace later with IndexedDB data: await loadRequests()

      // 🔍 Apply all filters
      const filtered = data.filter(r => {
        const reqNo = r.requestNo || `REQ-${r.id}`
        const matchesSearch =
          !searchText ||
          Object.values({ ...r, reqNo })
            .join(' ')
            .toLowerCase()
            .includes(searchText.toLowerCase())

        const matchesDate = !enableDateFilter
          ? true
          : new Date(r.requestDate) >= startDate && new Date(r.requestDate) <= endDate

        const matchesStatus = !requestStatus || r.status === requestStatus
        const matchesFrom = !fromLocation || r.fromLocation === fromLocation
        const matchesTo = !toLocation || r.toLocation === toLocation
        const matchesBy = !requestedBy || r.requestedBy === requestedBy

        return matchesSearch && matchesDate && matchesStatus && matchesFrom && matchesTo && matchesBy
      })

      // 🧾 Normalize with serial number
      const withSno = filtered.map((r, i) => ({ ...r, sno: i + 1 }))
      setRows(withSno)

      if (showToastMsg) showToast('info', 'Material requests refreshed')
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(false)
  }, [searchText, enableDateFilter, startDate, endDate, requestStatus, fromLocation, toLocation, requestedBy])

  // Actions
  const handleDelete = async row => {
    await deleteRequest(row.id)
    showToast('delete', 'Request deleted')
    loadData()
  }

  const handleEdit = row => {
    router.push(`/admin/stock/material-request/${row.id}/edit`)
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
        meta: { align: 'center' },
        enableSorting: false
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        size: 100,
        meta: { align: 'center' },
        cell: ({ row }) => (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton size='small' color='error' onClick={() => handleDelete(row.original)}>
              <DeleteIcon fontSize='small' />
            </IconButton>
            <IconButton size='small' onClick={() => handleEdit(row.original)}>
              <EditIcon fontSize='small' />
            </IconButton>
          </Box>
        )
      }),
      columnHelper.accessor('requestType', { header: 'Request Type', size: 150 }),
      columnHelper.accessor(row => row.requestNo || `REQ-${row.id}`, {
        id: 'requestNo',
        header: 'Request No',
        size: 150
      }),
      columnHelper.accessor('requestDate', {
        header: 'Request Date',
        size: 130,
        cell: info => {
          const d = info.getValue()
          return d ? format(new Date(d), 'dd/MM/yyyy') : ''
        }
      }),
      columnHelper.accessor('fromLocation', { header: 'From Location/Supplier', size: 200 }),
      columnHelper.accessor('toLocation', { header: 'To Location/Supplier', size: 200 }),
      columnHelper.accessor('requestedBy', { header: 'Requested By', size: 140 }),

      // ✅ Use StatusChip globally
      columnHelper.display({
        id: 'isApproved',
        header: 'Is Approved',
        size: 120,
        cell: ({ row }) => <StatusChip status={row.original.approvedStatus} />
      }),
      columnHelper.display({
        id: 'isIssued',
        header: 'Is Issued',
        size: 120,
        cell: ({ row }) => <StatusChip status={row.original.issuedStatus} />
      }),
      columnHelper.display({
        id: 'isCompleted',
        header: 'Is Completed',
        size: 120,
        cell: ({ row }) => <StatusChip status={row.original.completedStatus === 'Yes' ? 'Yes' : 'No'} />
      }),
      columnHelper.accessor('remarks', { header: 'Remarks', size: 200 }),
      columnHelper.accessor(row => row.status || 'Waiting', {
        id: 'status',
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
            '& .MuiCardHeader-action': { m: 0, alignItems: 'center' },
            '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '1.125rem' }
          }}
          title={
            <Box display='flex' alignItems='center' gap={2}>
              <Typography variant='h5' sx={{ fontWeight: 600 }}>
                Material Request List
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
                  await loadData(true)
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

        {/* Filters */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
          {/* Date Range */}
          <Box>
            <Box display='flex' alignItems='center' gap={1} sx={{ mb: 0.5 }}>
              <Typography variant='body2' sx={{ fontWeight: 500 }}>
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

          {/* Status */}
          <CustomAutocomplete
            className='is-[220px]'
            options={['Waiting', 'Pending', 'Rejected', 'Approved', 'Issued', 'Completed', 'Declined']}
            value={requestStatus || null}
            onChange={(e, val) => setRequestStatus(val || '')}
            renderInput={p => <CustomTextField {...p} label='Request Status' size='small' inputRef={statusRef} />}
          />

          {/* From */}
          <CustomAutocomplete
            className='is-[220px]'
            options={['Stock-TECH STOCK 1', 'Supplier-ABC']}
            value={fromLocation || null}
            onChange={(e, val) => setFromLocation(val || '')}
            renderInput={p => <CustomTextField {...p} label='From Location/Supplier' size='small' inputRef={fromRef} />}
          />

          {/* To */}
          <CustomAutocomplete
            className='is-[220px]'
            options={['Stock-TECH STOCK 1', 'Stock-TECH STOCK 2', 'Site-A', 'Site-B', 'Site-C']}
            value={toLocation || null}
            onChange={(e, val) => setToLocation(val || '')}
            renderInput={p => <CustomTextField {...p} label='To Location/Supplier' size='small' inputRef={toRef} />}
          />

          {/* Requested By */}
          <CustomAutocomplete
            className='is-[220px]'
            options={['Admin', 'Tech', 'John Doe', 'Jane Smith']}
            value={requestedBy || null}
            onChange={(e, val) => setRequestedBy(val || '')}
            renderInput={p => <CustomTextField {...p} label='Requested By' size='small' inputRef={byRef} />}
          />
        </Box>

        <Divider sx={{ mb: 4 }} />

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
          <FormControl size='small' sx={{ width: 140 }}>
            <Select value={pageSize} onChange={e => table.setPageSize(Number(e.target.value))}>
              {[10, 25, 50, 100].map(s => (
                <MenuItem key={s} value={s}>
                  {s} entries
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <CustomTextField
            size='small'
            placeholder='Search any field...'
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

      <ToastContainer />
    </Box>
  )
}
