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

// Your global UI components (assumed present in project)
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

// ───────────────────────
// Dummy dataset (frontend only)
// ───────────────────────
const DUMMY_DATA = [
  {
    id: 1,
    customer: 'DBS Trustee Limited as Trustee of Mapletree Industrial Trust',
    contractCode: 'MIT/2023/001A',
    type: 'Limited Contract',
    serviceAddress: '163 & 165 Kallang Way, #03-01',
    postalCode: '349256',
    startDate: '2023-04-01',
    endDate: '2026-06-30',
    pests: 'Mosquitoes & Flies (V)',
    frequency: 'Weekly',
    pestServiceCount: 170,
    balance: 12,
    contractStatus: 'Current'
  },
  {
    id: 2,
    customer: 'DBS Trustee Limited as Trustee of Mapletree Industrial Trust',
    contractCode: 'MIT/2023/001A',
    type: 'Limited Contract',
    serviceAddress: 'KLB3 - 16 Kallang Place',
    postalCode: '339156',
    startDate: '2023-07-01',
    endDate: '2026-06-30',
    pests: 'Mosquitoes & Flies (V)',
    frequency: 'Weekly',
    pestServiceCount: 157,
    balance: 1,
    contractStatus: 'Current'
  },
  {
    id: 3,
    customer: 'SBCD ARC Pte Ltd',
    contractCode: 'GP900417',
    type: 'Limited Contract',
    serviceAddress: '460 Alexandra Road, #02-21 ARC',
    postalCode: '119963',
    startDate: '2023-07-01',
    endDate: '2024-02-29',
    pests: 'Rodents',
    frequency: 'Monthly',
    pestServiceCount: 12,
    balance: 4,
    contractStatus: 'Current'
  },
  {
    id: 4,
    customer: 'SBCD ARC Pte Ltd',
    contractCode: 'GP900417',
    type: 'Limited Contract',
    serviceAddress: '460 Alexandra Road, #02-21 ARC',
    postalCode: '119963',
    startDate: '2023-07-01',
    endDate: '2024-02-29',
    pests: 'Cockroaches',
    frequency: 'Monthly',
    pestServiceCount: 12,
    balance: 4,
    contractStatus: 'Current'
  },
  // add more dummy rows as needed
]

// helper to clone & expand dummy (so pagination looks real)
const makeRows = (base) => {
  const rows = []
  for (let i = 0; i < 6; i++) {
    base.forEach((r, idx) => {
      rows.push({
        ...r,
        id: r.id + i * 10 + idx,
        sno: rows.length + 1
      })
    })
  }
  return rows
}

// ───────────────────────────────────────────
// Component: Non-Preschedule Report Page (UI only)
// ───────────────────────────────────────────
export default function NonPreScheduleReportPage() {
  const router = useRouter()

  // states
  const [allRows] = useState(() => makeRows(DUMMY_DATA)) // master data (static)
  const [rows, setRows] = useState([])
  const [rowCount, setRowCount] = useState(allRows.length)
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [loading, setLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null })
  const [exportAnchorEl, setExportAnchorEl] = useState(null)

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
      // start with all
      let filtered = [...allRows]

      // customer filter
      if (customerFilter) {
        filtered = filtered.filter(r => r.customer === customerFilter)
      }

      // search across some fields
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

      // sort by id desc (same as your Contracts page)
      filtered.sort((a, b) => (b.id || 0) - (a.id || 0))

      // pagination
      const start = pagination.pageIndex * pagination.pageSize
      const end = start + pagination.pageSize
      const paginated = filtered.slice(start, end)

      // normalize (sno & formatted dates)
      const normalized = paginated.map((item, idx) => ({
        ...item,
        sno: start + idx + 1,
        startDateFormatted: item.startDate ? formatDate(item.startDate) : '',
        endDateFormatted: item.endDate ? formatDate(item.endDate) : ''
      }))

      setRows(normalized)
      setRowCount(filtered.length)
    } finally {
      // simulate small delay for UX
      setTimeout(() => setLoading(false), 220)
    }
  }

  // small helper to format date to DD-MM-YYYY (matches screenshot)
  const formatDate = (iso) => {
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

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.pageIndex, pagination.pageSize, searchText, customerFilter])

  // --- simple delete (local only) ---
  const handleEdit = (id) => {
    // mimic: navigate to edit page (you can wire actual route if exists)
    router.push(`/admin/contracts/${id}/edit`)
  }

  const confirmDelete = () => {
    if (!deleteDialog.row) {
      setDeleteDialog({ open: false, row: null })
      return
    }
    // remove from allRows — since allRows is state const, we can't mutate; show toast only and remove from visible rows
    const removedId = deleteDialog.row.id
    const newAll = allRows.filter(r => r.id !== removedId)
    // update visible rows locally (this page is UI-only so we only update current rows & rowCount)
    const newRows = rows.filter(r => r.id !== removedId)
    setRows(newRows)
    setRowCount(prev => prev - 1)
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
      ].map(h => `<th>${h}</th>`).join('')}
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
                onClick={() => loadData()}
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

        <Box
          sx={{
            mb: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <FormControl size='small' sx={{ width: 120 }}>
              <Select
                value={pagination.pageSize}
                onChange={e => setPagination(p => ({ ...p, pageSize: Number(e.target.value), pageIndex: 0 }))}
              >
                {[10, 25, 50, 100].map(s => (
                  <MenuItem key={s} value={s}>
                    {s} entries
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* CUSTOMER FILTER (only one) */}
            <GlobalAutocomplete
              fullWidth
              id='customer-filter'
              options={customerOptions}
              getOptionLabel={option => option?.name || ''}
              renderOption={(props, option) => (
                <li {...props} key={`${option.id}-${option.name}`}>
                  {option.name}
                </li>
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={customerOptions.find(c => c.id === customerFilter) || null}
              onChange={(e, newVal) => setCustomerFilter(newVal?.id || null)}
              renderInput={params => (
                <GlobalTextField {...params} label='Customer' placeholder='Select Customer' size='small' />
              )}
              sx={{ width: 420 }}
            />
          </Box>

          <DebouncedInput
            value={searchText}
            onChange={v => {
              setSearchText(String(v))
              setPagination(p => ({ ...p, pageIndex: 0 }))
            }}
            placeholder='Search customer, code, address, pests...'
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
