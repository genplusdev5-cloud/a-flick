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
  FormControlLabel,
  Select,
  Checkbox,
  InputAdornment
} from '@mui/material'

import { getNonPrescheduleList } from '@/api/nonPreschedule/list'

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

// Your global UI components (assumed present in project)
import GlobalDateRange from '@/components/common/GlobalDateRange'
import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
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

// Debounced Input (same as your Contracts page)
const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
  const [value, setValue] = useState(initialValue)
  useEffect(() => setValue(initialValue), [initialValue])
  useEffect(() => {
    const t = setTimeout(() => onChange(value), debounce)
    return () => clearTimeout(t)
  }, [value])
  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

export default function NonPreScheduleReportPage() {
  const router = useRouter()

  // states
  // allRows now comes from API
  const [allRows, setAllRows] = useState([])
  const [rows, setRows] = useState([])
  const [rowCount, setRowCount] = useState(0)

  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [loading, setLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null })
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const [dateRange, setDateRange] = useState({ start: null, end: null })
  const [checked, setChecked] = useState(false)

  // only customer filter per your request
  const [customerFilter, setCustomerFilter] = useState(null)

  // derive unique customer options from dummy
  const customerOptions = useMemo(() => {
    const map = new Map()
    allRows.forEach(r => {
      if (!map.has(r.customer)) map.set(r.customer, { id: r.customer, name: r.customer })
    })
    return Array.from(map.values())
  }, [allRows])

  // load & apply local filters, search, pagination — no API calls
  const loadData = () => {
    setLoading(true)
    try {
      let filtered = [...allRows]

      // customer filter
      if (customerFilter) {
        filtered = filtered.filter(r => r.customer === customerFilter)
      }

      // DATE RANGE FILTER
      if (dateRange.start && dateRange.end) {
        const start = new Date(dateRange.start)
        const end = new Date(dateRange.end)

        filtered = filtered.filter(r => {
          if (!r.startDate) return false
          const d = new Date(r.startDate)
          return d >= start && d <= end
        })
      }

      // search
      if (searchText && searchText.trim()) {
        const q = searchText.trim().toLowerCase()
        filtered = filtered.filter(r => {
          return (
            String(r.customer).toLowerCase().includes(q) ||
            String(r.contractCode).toLowerCase().includes(q) ||
            String(r.serviceAddress).toLowerCase().includes(q) ||
            String(r.pests).toLowerCase().includes(q)
          )
        })
      }

      // sort by id desc
      filtered.sort((a, b) => (b.id || 0) - (a.id || 0))

      // pagination
      const start = pagination.pageIndex * pagination.pageSize
      const end = start + pagination.pageSize
      const paginated = filtered.slice(start, end)

      const normalized = paginated.map((item, idx) => ({
        ...item,
        sno: start + idx + 1,
        startDateFormatted: item.startDate ? formatDate(item.startDate) : '',
        endDateFormatted: item.endDate ? formatDate(item.endDate) : ''
      }))

      setRows(normalized)
      setRowCount(filtered.length)
    } finally {
      setTimeout(() => setLoading(false), 220)
    }
  }

  // 🔹 Fetch from API and normalize data
  const fetchNonPreschedule = async () => {
    setLoading(true)
    try {
      const res = await getNonPrescheduleList()

      if (res?.status === 'success') {
        let list = Array.isArray(res.data) ? res.data : []

        // Some APIs return one empty object – filter that out
        list = list.filter(item => item.id)

        const normalized = list.map((item, index) => ({
          id: item.id,
          sno: index + 1, // will be recalculated after pagination
          customer: item.customer,
          contractCode: item.contract_code,
          type: item.type,
          serviceAddress: item.service_address,
          postalCode: item.postal_code,
          startDate: item.start_date, // still string (YYYY-MM-DD)
          endDate: item.end_date,
          pests: item.pests,
          frequency: item.frequency,
          pestServiceCount: item.pest_service_count,
          balance: item.balance,
          contractStatus: item.contract_status || 'Current'
        }))

        setAllRows(normalized)
        setRowCount(normalized.length)
        setPagination(prev => ({ ...prev, pageIndex: 0 })) // reset to first page
      } else {
        showToast('error', res?.message || 'Failed to fetch non-preschedule list')
        setAllRows([])
        setRowCount(0)
      }
    } catch (err) {
      console.error('Non-preschedule fetch error:', err)
      showToast('error', 'Error fetching non-preschedule list')
      setAllRows([])
      setRowCount(0)
    } finally {
      setLoading(false)
    }
  }

  // small helper to format date to DD-MM-YYYY (matches screenshot)
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

  // 1) First time, fetch from API
  useEffect(() => {
    fetchNonPreschedule()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 2) Whenever allRows / filters / pagination change, recompute visible rows
  useEffect(() => {
    if (!allRows.length) {
      setRows([])
      setRowCount(0)
      return
    }
    loadData()
  }, [allRows, pagination.pageIndex, pagination.pageSize, searchText, customerFilter, dateRange])

  // --- simple delete (local only) ---
  const handleEdit = id => {
    // mimic: navigate to edit page (you can wire actual route if exists)
    router.push(`/admin/contracts/${id}/edit`)
  }

  const confirmDelete = () => {
    if (!deleteDialog.row) {
      setDeleteDialog({ open: false, row: null })
      return
    }

    const removedId = deleteDialog.row.id

    // UI-only delete: update master list, rest will recalc via useEffect
    setAllRows(prev => prev.filter(r => r.id !== removedId))

    showToast('delete', `Contract ${deleteDialog.row.contractCode} deleted (UI only)`)
    setDeleteDialog({ open: false, row: null })
  }

  // --- columns for tanstack table (same style) ---
  const columnHelper = createColumnHelper()
  const columns = useMemo(
    () => [
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
      columnHelper.accessor('contractCode', { header: 'Contract Code' }),
      columnHelper.accessor('type', { header: 'Type' }),
      columnHelper.accessor('serviceAddress', { header: 'Service Address' }),
      columnHelper.accessor('postalCode', { header: 'Postal Code' }),
      columnHelper.accessor('startDateFormatted', { header: 'Start Date' }),
      columnHelper.accessor('endDateFormatted', { header: 'End Date' }),
      columnHelper.accessor('pests', { header: 'Pests' }),
      columnHelper.accessor('frequency', { header: 'Frequency' }),
      columnHelper.accessor('pestServiceCount', { header: 'Pest Service Count' }),
      columnHelper.accessor('balance', {
        header: 'Balance',
        cell: info => info.getValue() ?? '—'
      }),
      columnHelper.accessor('contractStatus', {
        header: 'Contract Status',
        cell: info => {
          const status = info.getValue() || 'Current'
          return (
            <Chip
              label={status}
              size='small'
              sx={{
                color: '#fff',
                bgcolor: status === 'Current' ? 'success.main' : 'error.main',
                fontWeight: 600,
                borderRadius: '6px',
                px: 1.5
              }}
            />
          )
        }
      })
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    pageCount: Math.ceil(rowCount / pagination.pageSize || 1),
    state: { globalFilter: searchText, pagination },
    onGlobalFilterChange: setSearchText,
    onPaginationChange: setPagination,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  // --- export handlers (CSV / Print) ---
  const exportOpen = Boolean(exportAnchorEl)
  const exportCSV = () => {
    const headers = [
      'ID',
      'Customer',
      'Contract Code',
      'Type',
      'Service Address',
      'Postal Code',
      'Start Date',
      'End Date',
      'Pests',
      'Frequency',
      'Pest Service Count',
      'Balance',
      'Contract Status'
    ]
    const csv = [
      headers.join(','),
      ...rows.map(r =>
        [
          r.sno,
          `"${r.customer}"`,
          r.contractCode,
          r.type,
          `"${r.serviceAddress}"`,
          r.postalCode,
          r.startDateFormatted,
          r.endDateFormatted,
          `"${r.pests}"`,
          r.frequency,
          r.pestServiceCount,
          r.balance,
          r.contractStatus
        ].join(',')
      )
    ].join('\n')
    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = 'non_preschedule_list.csv'
    link.click()
    showToast('success', 'CSV downloaded (UI only)')
    setExportAnchorEl(null)
  }

  const exportPrint = () => {
    const w = window.open('', '_blank')
    const html = `
      <html><head><title>Non-Preschedule List</title><style>
      body{font-family:Arial;padding:24px;}
      table{width:100%;border-collapse:collapse;}
      th,td{border:1px solid #ccc;padding:8px;text-align:left;}
      th{background:#f4f4f4;}
      </style></head><body>
      <h2>Non-Preschedule List</h2>
      <table><thead><tr>
      ${[
        'ID',
        'Customer',
        'Contract Code',
        'Type',
        'Service Address',
        'Postal Code',
        'Start Date',
        'End Date',
        'Pests',
        'Frequency',
        'Pest Service Count',
        'Balance',
        'Contract Status'
      ]
        .map(h => `<th>${h}</th>`)
        .join('')}
      </tr></thead><tbody>
      ${rows
        .map(
          r => `<tr>
            <td>${r.sno}</td>
            <td>${r.customer}</td>
            <td>${r.contractCode}</td>
            <td>${r.type}</td>
            <td>${r.serviceAddress}</td>
            <td>${r.postalCode}</td>
            <td>${r.startDateFormatted}</td>
            <td>${r.endDateFormatted}</td>
            <td>${r.pests}</td>
            <td>${r.frequency}</td>
            <td>${r.pestServiceCount}</td>
            <td>${r.balance}</td>
            <td>${r.contractStatus}</td>
          </tr>`
        )
        .join('')}
      </tbody></table></body></html>`
    w.document.write(html)
    w.document.close()
    w.print()
    setExportAnchorEl(null)
  }

  // ───────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────
  return (
    <Box>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 2 }}>
        <Link underline='hover' color='inherit' href='/'>
          Dashboard
        </Link>
        <Typography color='text.primary'>Non-Preschedule Report</Typography>
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
                Non-Preschedule Report
              </Typography>
              <GlobalButton
                variant='contained'
                color='primary'
                startIcon={<RefreshIcon />}
                disabled={loading}
                onClick={() => fetchNonPreschedule()}
                sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </GlobalButton>
            </Box>
          }
        />

        {loading && (
          <Box
            sx={{
              position: 'fixed',
              inset: 0,
              bgcolor: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(2px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000
            }}
          >
            <Box textAlign='center'>
              <ProgressCircularCustomization size={60} thickness={5} />
              <Typography mt={2} fontWeight={600} color='primary'>
                Loading...
              </Typography>
            </Box>
          </Box>
        )}

        <Divider sx={{ mb: 6 }} />

        {/* ROW 1 — FILTERS */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end', // ⭐ FIX: Align bottom of all fields
            gap: 2,
            mb: 3,
            flexWrap: 'nowrap'
          }}
        >
          {/* DATE RANGE BLOCK LIKE YOUR 2ND IMAGE */}
          <Box sx={{ display: 'flex', flexDirection: 'column', width: 260 }}>
            {/* Label + Checkbox ON TOP */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Checkbox checked={checked} onChange={e => setChecked(e.target.checked)} size='small' />
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Date Range</Typography>
            </Box>

            {/* Date Picker BELOW the label */}
            <GlobalDateRange
              label=''
              start={dateRange.start}
              end={dateRange.end}
              onSelectRange={({ start, end }) => setDateRange({ start, end })}
              disabled={!checked}
            />
          </Box>

          {/* Customer Autocomplete */}
          <GlobalAutocomplete
            id='customer-filter'
            options={customerOptions}
            fullWidth
            getOptionLabel={option => option?.name || ''}
            value={customerOptions.find(c => c.id === customerFilter) || null}
            onChange={(e, val) => setCustomerFilter(val?.id || null)}
            renderInput={params => (
              <GlobalTextField {...params} label='Customer' placeholder='Select Customer' size='small' />
            )}
            sx={{ width: 350 }}
          />
        </Box>

        <Divider sx={{ mb: 6 }} />

        {/* ROW 2 — ENTRIES + SEARCH */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          {/* Entries Dropdown */}
          <FormControl size='small' sx={{ width: 150 }}>
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
              {[10, 25, 50, 100].map(size => (
                <MenuItem key={size} value={size}>
                  {size} entries
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Search Box */}
          <DebouncedInput
            value={searchText}
            onChange={v => {
              setSearchText(String(v))
              setPagination(p => ({ ...p, pageIndex: 0 }))
            }}
            placeholder='Search customer, code, address, pests...'
            sx={{ width: 350 }}
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

        {/* ================== END FILTER SECTION ================== */}

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
                          asc: <ChevronRight fontSize='1.25rem' className='-rotate-90' />,
                          desc: <ChevronRight fontSize='1.25rem' className='rotate-90' />
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
                    {loading ? 'Loading non-preschedule data...' : 'No results found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <TablePaginationComponent totalCount={rowCount} pagination={pagination} setPagination={setPagination} />
      </Card>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog
        onClose={() => setDeleteDialog({ open: false })}
        aria-labelledby='customized-dialog-title'
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
        <DialogTitle
          id='customized-dialog-title'
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
          <DialogCloseButton
            onClick={() => setDeleteDialog({ open: false })}
            disableRipple
            sx={{ position: 'absolute', right: 1, top: 1 }}
          >
            <i className='tabler-x' />
          </DialogCloseButton>
        </DialogTitle>

        <DialogContent sx={{ px: 5, pt: 1 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: 14, lineHeight: 1.6 }}>
            Are you sure you want to delete contract{' '}
            <strong style={{ color: '#d32f2f' }}>{deleteDialog.row?.contractCode || 'this contract'}</strong>?
            <br />
            This action is <strong>UI-only</strong> and cannot be undone here.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3, pt: 2 }}>
          <GlobalButton
            onClick={() => setDeleteDialog({ open: false })}
            variant='tonal'
            color='secondary'
            sx={{ minWidth: 100, textTransform: 'none', fontWeight: 500 }}
          >
            Cancel
          </GlobalButton>
          <GlobalButton
            onClick={confirmDelete}
            variant='contained'
            color='error'
            sx={{ minWidth: 100, textTransform: 'none', fontWeight: 600 }}
          >
            Delete
          </GlobalButton>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
