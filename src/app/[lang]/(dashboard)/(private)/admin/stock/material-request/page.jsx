'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Card,
  CardHeader,
  Typography,
  Divider,
  Breadcrumbs,
  Checkbox,
  Pagination,
  InputAdornment,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'

import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import StickyListLayout from '@/components/common/StickyListLayout'
import PermissionGuard from '@/components/auth/PermissionGuard'
import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import StatusChip from '@/components/common/StatusChip'

import { getTmMaterialRequestList } from '@/api/materialRequest/list'
import { deleteTmMaterialRequest } from '@/api/materialRequest/delete'

import CustomTextField from '@core/components/mui/TextField'
import CustomAutocomplete from '@core/components/mui/Autocomplete'
import GlobalDateRange from '@/components/common/GlobalDateRange'

import { toast } from 'react-toastify'
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

const MaterialRequestPageContent = () => {
  const router = useRouter()
  const PAGE_SIZE = 25

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // -- UI (TEMPORARY) FILTER STATES --
  const [uiEnableDateFilter, setUiEnableDateFilter] = useState(false)
  const [uiStartDate, setUiStartDate] = useState(new Date())
  const [uiEndDate, setUiEndDate] = useState(new Date())
  const [uiRequestStatus, setUiRequestStatus] = useState('')
  const [uiFromLocation, setUiFromLocation] = useState('')
  const [uiToLocation, setUiToLocation] = useState('')
  const [uiRequestedBy, setUiRequestedBy] = useState('')
  const [uiSearchText, setUiSearchText] = useState('')

  // -- APPLIED (PERSISTENT) FILTER STATES --
  const [appliedFilters, setAppliedFilters] = useState({
    enableDateFilter: false,
    startDate: new Date(),
    endDate: new Date(),
    requestStatus: '',
    fromLocation: '',
    toLocation: '',
    requestedBy: '',
    searchText: ''
  })

  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null })
  const [sorting, setSorting] = useState([])

  const confirmDelete = async () => {
    try {
      setLoading(true)
      const row = deleteDialog.row
      if (!row) return
      await deleteTmMaterialRequest(row.id)
      showToast('delete', `Request ${row.requestNo || `REQ-${row.id}`} deleted`)
      await loadData()
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to delete request')
    } finally {
      setLoading(false)
      setDeleteDialog({ open: false, row: null })
    }
  }

  const loadData = async (showToastMsg = false) => {
    setLoading(true)
    try {
      const response = await getTmMaterialRequestList(page)
      setTotalCount(response.count || 0)
      const data = response.data?.results || []

      const mapped = data.map(r => ({
        id: r.id,
        requestType: r.request_type || 'Material',
        requestNo: r.request_no || `REQ-${r.id}`,
        requestDate: r.request_date,
        fromLocation: r.from_location || r.from_location_supplier || '',
        toLocation: r.to_location || r.to_location_supplier || '',
        requestedBy: r.requested_by_name || r.employee_name || (r.employee_id ? `EMP-${r.employee_id}` : ''),
        approvedStatus: r.is_approved === 1 ? 'Yes' : 'N/A',
        issuedStatus: r.is_issued === 1 ? 'Yes' : 'N/A',
        completedStatus: r.is_completed === 1 ? 'Yes' : 'No',
        remarks: r.remarks || '',
        status: r.request_status || 'Waiting'
      }))

      const filtered = mapped.filter(row => {
        const text = (appliedFilters.searchText || '').trim().toLowerCase()
        const matchesSearch = !text || Object.values(row).join(' ').toLowerCase().includes(text)
        const matchesDate = !appliedFilters.enableDateFilter
          ? true
          : row.requestDate &&
            new Date(row.requestDate) >= appliedFilters.startDate &&
            new Date(row.requestDate) <= appliedFilters.endDate
        const matchesStatus = !appliedFilters.requestStatus || row.status === appliedFilters.requestStatus
        const matchesFrom = !appliedFilters.fromLocation || row.fromLocation === appliedFilters.fromLocation
        const matchesTo = !appliedFilters.toLocation || row.toLocation === appliedFilters.toLocation
        const matchesBy = !appliedFilters.requestedBy || row.requestedBy === appliedFilters.requestedBy
        return matchesSearch && matchesDate && matchesStatus && matchesFrom && matchesTo && matchesBy
      })

      const withSno = filtered.map((row, i) => ({
        ...row,
        sno: (page - 1) * PAGE_SIZE + i + 1
      }))

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
  }, [page, appliedFilters])

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

  const columnHelper = createColumnHelper()
  const columns = useMemo(
    () => [
      columnHelper.accessor('sno', { header: 'S.No' }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        size: 100,
        cell: ({ row }) => {
          const encodedId = btoa(String(row.original.id))
          return (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                size='small'
                color='primary'
                onClick={() => router.push(`/admin/stock/material-request/${encodedId}/edit`)}
              >
                <i className='tabler-edit' />
              </IconButton>
              <IconButton size='small' color='error' onClick={() => setDeleteDialog({ open: true, row: row.original })}>
                <i className='tabler-trash text-red-600 text-lg' />
              </IconButton>
            </Box>
          )
        }
      }),
      columnHelper.accessor('requestType', { header: 'Request Type', size: 150 }),
      columnHelper.accessor('requestNo', { header: 'Request No', size: 150 }),
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
        cell: ({ row }) => <StatusChip status={row.original.completedStatus} />
      }),
      columnHelper.accessor('remarks', { header: 'Remarks', size: 200 }),
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
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  const pageIndex = table.getState().pagination.pageIndex || 0
  const pageSize = table.getState().pagination.pageSize || 10
  const total = table.getFilteredRowModel().rows.length

  return (
    <>
      <StickyListLayout
        header={
          <Box sx={{ mb: 2 }}>
            <Link href='/admin/dashboards' className='text-primary'>
              Dashboard
            </Link>{' '}
            / <Typography component='span'>Material Request</Typography>
          </Box>
        }
      >
        <Card
          sx={{
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '100%',
            minHeight: 0,
            position: 'relative'
          }}
        >
          <CardHeader
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
                  onClick={() => {
                    setPage(1)
                    setAppliedFilters({
                      enableDateFilter: uiEnableDateFilter,
                      startDate: uiStartDate,
                      endDate: uiEndDate,
                      requestStatus: uiRequestStatus,
                      fromLocation: uiFromLocation,
                      toLocation: uiToLocation,
                      requestedBy: uiRequestedBy,
                      searchText: uiSearchText
                    })
                    loadData(true)
                  }}
                  sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </Button>
              </Box>
            }
            action={
              <Box display='flex' alignItems='center' gap={2}>
                <Button
                  variant='contained'
                  color='primary'
                  startIcon={<AddIcon />}
                  onClick={() => router.push('/admin/stock/material-request/add')}
                  sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
                >
                  Add Request
                </Button>
              </Box>
            }
            sx={{
              pb: 1.5,
              pt: 5,
              px: 10,
              '& .MuiCardHeader-action': { m: 0, alignItems: 'center' },
              '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '1.125rem' }
            }}
          />

          <Divider />

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
            {/* Filters */}
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, mb: 3, flexWrap: 'nowrap', flexShrink: 0 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <FormControlLabel
                  control={
                    <Checkbox checked={uiEnableDateFilter} onChange={e => setUiEnableDateFilter(e.target.checked)} />
                  }
                  label='Date Filter'
                />
                <Box sx={{ width: 220 }}>
                  <GlobalDateRange
                    start={uiStartDate}
                    end={uiEndDate}
                    onSelectRange={({ start, end }) => {
                      setUiStartDate(start)
                      setUiEndDate(end)
                    }}
                    disabled={!uiEnableDateFilter}
                  />
                </Box>
              </Box>
              <CustomAutocomplete
                options={['Waiting', 'Pending', 'Rejected', 'Approved', 'Issued', 'Completed', 'Declined']}
                value={uiRequestStatus || null}
                onChange={(e, val) => setUiRequestStatus(val || '')}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    size='small'
                    label='Request Status'
                    sx={{ width: 180 }}
                    placeholder='Select status'
                  />
                )}
              />
              <CustomAutocomplete
                options={['Stock-TECH STOCK 1', 'Supplier-ABC']}
                value={uiFromLocation || null}
                onChange={(e, val) => setUiFromLocation(val || '')}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    size='small'
                    label='From Location'
                    sx={{ width: 180 }}
                    placeholder='From'
                  />
                )}
              />
              <CustomAutocomplete
                options={['Stock-TECH STOCK 1', 'Site-A', 'Site-B']}
                value={uiToLocation || null}
                onChange={(e, val) => setUiToLocation(val || '')}
                renderInput={params => (
                  <CustomTextField {...params} size='small' label='To Location' sx={{ width: 180 }} placeholder='To' />
                )}
              />
              <CustomAutocomplete
                options={['Admin', 'Tech', 'John Doe']}
                value={uiRequestedBy || null}
                onChange={(e, val) => setUiRequestedBy(val || '')}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    size='small'
                    label='Requested By'
                    sx={{ width: 180 }}
                    placeholder='Employee'
                  />
                )}
              />
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Toolbar */}
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <FormControl size='small' sx={{ width: 120 }}>
                  <Select value={pageSize} onChange={e => table.setPageSize(Number(e.target.value))}>
                    {[10, 25, 50, 100].map(s => (
                      <MenuItem key={s} value={s}>
                        {s} entries
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
              <CustomTextField
                size='small'
                placeholder='Search any field...'
                value={uiSearchText}
                onChange={e => setUiSearchText(e.target.value)}
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

            <Box sx={{ position: 'relative', flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <StickyTableWrapper rowCount={rows.length}>
                <table
                  className={styles.table}
                  style={{ width: 'max-content', minWidth: '100%', tableLayout: 'fixed' }}
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
                            style={{ width: header.getSize(), minWidth: header.getSize(), maxWidth: header.getSize() }}
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
                  Showing {(page - 1) * 25 + 1} to {Math.min(page * 25, totalCount)} of {totalCount} entries
                </Typography>
                <Pagination
                  shape='rounded'
                  color='primary'
                  variant='tonal'
                  count={Math.ceil(totalCount / 25) || 1}
                  page={page}
                  onChange={(_, p) => setPage(p)}
                  showFirstButton
                  showLastButton
                />
              </Box>
            </Box>
          </Box>
        </Card>
      </StickyListLayout>

      {/* Delete Confirmation Dialog */}
      <Dialog
        onClose={() => setDeleteDialog({ open: false, row: null })}
        aria-labelledby='delete-request-dialog'
        open={deleteDialog.open}
        closeAfterTransition={false}
        PaperProps={{ sx: { overflow: 'visible', width: 420, borderRadius: 1, textAlign: 'center' } }}
      >
        <DialogTitle sx={{ pt: 12 }}>
          <Box
            sx={{
              position: 'absolute',
              top: -40,
              left: '50%',
              transform: 'translateX(-50%)',
              bgcolor: 'error.main',
              color: 'white',
              width: 80,
              height: 80,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '4px solid white',
              boxShadow: 3
            }}
          >
            <WarningAmberIcon sx={{ fontSize: 40 }} />
          </Box>
          <Typography variant='h5' sx={{ fontWeight: 600 }}>
            Confirm Deletion
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 8, pb: 4 }}>
          <Typography>Are you sure you want to delete this material request? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 3, pb: 10 }}>
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
    </>
  )
}

export default function MaterialRequestPage() {
  return (
    <PermissionGuard permission='Material Request'>
      <MaterialRequestPageContent />
    </PermissionGuard>
  )
}
