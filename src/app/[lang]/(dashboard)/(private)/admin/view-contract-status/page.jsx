'use client'
import { useEffect, useMemo, useState, useRef } from 'react'
import Link from 'next/link'
import {
  Box,
  Button,
  Card,
  CardHeader,
  CardContent,
  Typography,
  IconButton,
  Divider,
  Grid,
  Breadcrumbs,
  Chip,
  TextField,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  InputAdornment,
  Checkbox,
  FormControlLabel
} from '@mui/material'

import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import Autocomplete from '@mui/material/Autocomplete'
import CloseIcon from '@mui/icons-material/Close'
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
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

// ───────────────────────────────────────────
// Mock Data (Replace with IndexedDB later)
// ───────────────────────────────────────────
const mockData = [
  {
    id: 1,
    customer: 'GP Industries Pvt Ltd',
    services: 'Pest Control',
    contractCode: 'CON-2025-001',
    type: 'Annual Contract',
    serviceAddress: '123 Industrial Area, Delhi',
    postalCode: '110020',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    pest: 'Rodent',
    contractValue: 120000,
    prodValue: 15000,
    contactPerson: 'Mr. Rajesh Kumar',
    contactPhone: '+91 9876543210',
    renewalPending: 'No',
    renewalOn: null,
    holdedOn: null,
    terminatedOn: null,
    expiredOn: null,
    status: 'Current',
    origin: 'Genplus Innovations',
    reportEmail: 'report@gpindustries.com',
    picEmail: 'rajesh@gpindustries.com',
    billingEmail: 'billing@gpindustries.com'
  },
  {
    id: 2,
    customer: 'Acme Corp',
    services: 'Termite Treatment',
    contractCode: 'CON-2024-045',
    type: 'Limited Contract',
    serviceAddress: '456 MG Road, Mumbai',
    postalCode: '400001',
    startDate: '2024-06-01',
    endDate: '2024-11-30',
    pest: 'Termite',
    contractValue: 85000,
    prodValue: 12000,
    contactPerson: 'Ms. Priya Sharma',
    contactPhone: '+91 9123456789',
    renewalPending: 'Yes',
    renewalOn: '2024-11-01',
    holdedOn: null,
    terminatedOn: null,
    expiredOn: null,
    status: 'Current',
    origin: 'Pest Masters',
    reportEmail: 'reports@acmecorp.com',
    picEmail: 'priya@acmecorp.com',
    billingEmail: 'billing@acmecorp.com'
  }
]

const getContracts = async () => {
  return new Promise(resolve => setTimeout(() => resolve(mockData), 300))
}

// ───────────────────────────────────────────
// Toast helper – 100% JavaScript (no TypeScript)
// ───────────────────────────────────────────
const showToast = (type, message) => {
  // react-toastify gives us a `closeToast` function when we use a render-prop
  const content = ({ closeToast }) => (
    <div className='flex items-center justify-between gap-2'>
      <Typography variant='body2' sx={{ fontWeight: 500 }}>
        {message}
      </Typography>
      <IconButton size='small' onClick={closeToast}>
        <CloseIcon fontSize='small' />
      </IconButton>
    </div>
  )

  const options = { closeButton: false } // we draw our own X button

  if (type === 'success') toast.success(content, options)
  else if (type === 'error' || type === 'delete') toast.error(content, options)
  else if (type === 'warning') toast.warn(content, options)
  else toast.info(content, options)
}

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

// ───────────────────────────────────────────
// Main Component
// ───────────────────────────────────────────
export default function ContractStatusPage() {
  const router = useRouter()
  const [rows, setRows] = useState([])
  const [rowCount, setRowCount] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [dateFilter, setDateFilter] = useState(new Date())
  const [filterByDate, setFilterByDate] = useState(false)
  const [originFilter, setOriginFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [contractTypeFilter, setContractTypeFilter] = useState('')
  const [invoiceFrequencyFilter, setInvoiceFrequencyFilter] = useState('')
  const [contractStatusFilter, setContractStatusFilter] = useState('')
  const [renewalFilter, setRenewalFilter] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)

  const originRef = useRef()
  const customerRef = useRef()
  const contractTypeRef = useRef()
  const invoiceFrequencyRef = useRef()
  const contractStatusRef = useRef()
  const renewalRef = useRef()

  // Load & Filter Data
  const loadData = async () => {
    setLoading(true)
    try {
      const all = await getContracts()

      const filtered = all.filter(r => {
        const matchesSearch =
          !searchText ||
          Object.values(r).some(v =>
            String(v || '')
              .toLowerCase()
              .includes(searchText.toLowerCase())
          )

        const matchesDate = !filterByDate || new Date(r.startDate).toDateString() === dateFilter.toDateString()
        const matchesOrigin = !originFilter || r.origin === originFilter
        const matchesCustomer = !customerFilter || r.customer === customerFilter
        const matchesType = !contractTypeFilter || r.type === contractTypeFilter
        const matchesStatus = !contractStatusFilter || r.status === contractStatusFilter
        const matchesRenewal = !renewalFilter || r.renewalPending === (renewalFilter === 'Renewed' ? 'No' : 'Yes')

        return (
          matchesSearch &&
          matchesDate &&
          matchesOrigin &&
          matchesCustomer &&
          matchesType &&
          matchesStatus &&
          matchesRenewal
        )
      })

      // 🔢 Sort latest first
      const sorted = filtered.sort((a, b) => (b.id || 0) - (a.id || 0))

      // 📄 Pagination
      const start = pagination.pageIndex * pagination.pageSize
      const end = start + pagination.pageSize
      const paginated = sorted.slice(start, end)

      // 🧾 Normalize + S.No
      const normalized = paginated.map((item, idx) => ({
        ...item,
        sno: start + idx + 1
      }))

      setRows(normalized)
      setRowCount(filtered.length)
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to load contracts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    searchText,
    filterByDate,
    dateFilter,
    originFilter,
    customerFilter,
    contractTypeFilter,
    contractStatusFilter,
    renewalFilter
  ])

  // Table Columns
  const columnHelper = createColumnHelper()
  const columns = useMemo(
    () => [
      columnHelper.accessor('sno', {
        header: 'S.No',
        meta: { width: '60px', align: 'center' },
        enableSorting: false
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: () => (
          <IconButton size='small'>
            <MoreVertIcon />
          </IconButton>
        ),
        meta: { width: '80px', align: 'center' }
      }),
      columnHelper.accessor('customer', { header: 'Customer', meta: { width: '150px' } }),
      columnHelper.accessor('services', { header: 'Services', meta: { width: '160px' } }),
      columnHelper.accessor('contractCode', { header: 'Contract Code', meta: { width: '120px' } }),
      columnHelper.accessor('type', { header: 'Type', meta: { width: '120px' } }),
      columnHelper.accessor('serviceAddress', { header: 'Service Address', meta: { width: '200px' } }),
      columnHelper.accessor('postalCode', { header: 'Postal Code', meta: { width: '100px' } }),
      columnHelper.accessor('startDate', {
        header: 'Start Date',
        cell: i => (i.getValue() ? new Date(i.getValue()).toLocaleDateString('en-GB') : ''),
        meta: { width: '120px' }
      }),
      columnHelper.accessor('endDate', {
        header: 'End Date',
        cell: i => (i.getValue() ? new Date(i.getValue()).toLocaleDateString('en-GB') : ''),
        meta: { width: '120px' }
      }),
      columnHelper.accessor('pest', { header: 'Pest', meta: { width: '120px' } }),
      columnHelper.accessor('contractValue', {
        header: 'Contract Value',
        cell: i => `$${Number(i.getValue() || 0).toLocaleString()}`,
        meta: { width: '120px', align: 'right' }
      }),
      columnHelper.accessor('prodValue', {
        header: 'Prod Value',
        cell: i => `$${Number(i.getValue() || 0).toLocaleString()}`,
        meta: { width: '100px', align: 'right' }
      }),
      columnHelper.accessor('contactPerson', { header: 'Contact Person Name', meta: { width: '150px' } }),
      columnHelper.accessor('contactPhone', { header: 'Contact Phone', meta: { width: '150px' } }),
      columnHelper.accessor('renewalPending', { header: 'Renewal Pending', meta: { width: '120px' } }),
      columnHelper.accessor('renewalOn', {
        header: 'Renewal On',
        cell: i => (i.getValue() ? new Date(i.getValue()).toLocaleDateString('en-GB') : ''),
        meta: { width: '100px' }
      }),
      columnHelper.accessor('holdedOn', {
        header: 'Holded On',
        cell: i => (i.getValue() ? new Date(i.getValue()).toLocaleDateString('en-GB') : ''),
        meta: { width: '100px' }
      }),
      columnHelper.accessor('terminatedOn', {
        header: 'Terminated On',
        cell: i => (i.getValue() ? new Date(i.getValue()).toLocaleDateString('en-GB') : ''),
        meta: { width: '120px' }
      }),
      columnHelper.accessor('expiredOn', {
        header: 'Expired On',
        cell: i => (i.getValue() ? new Date(i.getValue()).toLocaleDateString('en-GB') : ''),
        meta: { width: '100px' }
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: info => {
          const s = info.getValue() || 'Current'
          const bg =
            s === 'Current'
              ? 'success.main'
              : s === 'Expired'
                ? 'error.main'
                : s === 'Hold'
                  ? 'warning.main'
                  : s === 'Terminated'
                    ? 'error.main'
                    : 'info.main'
          return (
            <Chip
              label={s}
              size='small'
              sx={{ color: '#fff', bgcolor: bg, fontWeight: 600, borderRadius: '6px', px: 1.5 }}
            />
          )
        },
        meta: { width: '100px' }
      }),
      columnHelper.accessor('origin', { header: 'Origin', meta: { width: '150px' } }),
      columnHelper.accessor('reportEmail', { header: 'Report Email', meta: { width: '150px' } }),
      columnHelper.accessor('picEmail', { header: 'PIC Email', meta: { width: '150px' } }),
      columnHelper.accessor('billingEmail', { header: 'Billing Email', meta: { width: '150px' } })
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
    onGlobalFilterChange: setSearchText,
    onPaginationChange: setPagination,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  // Export
  const exportCSV = () => {
    const headers = columns.map(c => c.header).filter(Boolean)
    const csv = [headers.join(','), ...rows.map(r => columns.map(c => `"${r[c.accessorKey] ?? ''}"`).join(','))].join(
      '\n'
    )
    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = 'contracts.csv'
    link.click()
    showToast('success', 'CSV downloaded')
  }

  const exportPrint = () => {
    const w = window.open('', '_blank')
    const html = `
      <html><head><title>Contract Status</title><style>
      body{font-family:Arial;padding:24px;}
      table{border-collapse:collapse;width:100%;font-size:11px;}
      th,td{border:1px solid #ccc;padding:6px;text-align:left;}
      th{background:#f4f4f4;}
      .text-right{text-align:right;}
      </style></head><body>
      <h2>Contract List</h2>
      <table><thead><tr>
      ${columns.map(c => `<th style="width:${c.meta?.width}">${c.header}</th>`).join('')}
      </tr></thead><tbody>
      ${rows
        .map(
          r =>
            `<tr>${columns
              .map(c => {
                const val = r[c.accessorKey]
                const formatted = c.accessorKey.includes('Value')
                  ? `$${Number(val || 0).toLocaleString()}`
                  : c.accessorKey.includes('Date') && val
                    ? new Date(val).toLocaleDateString('en-GB')
                    : val || ''
                return `<td class="${c.meta?.align === 'right' ? 'text-right' : ''}">${formatted}</td>`
              })
              .join('')}</tr>`
        )
        .join('')}
      </tbody></table></body></html>`
    w.document.write(html)
    w.document.close()
    w.print()
  }

  // ───────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────
  return (
    <Box>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 2 }}>
        <Link underline='hover' color='inherit' href='/admin/dashboard'>
          Dashboard
        </Link>
        <Typography color='text.primary'>View Contract Status</Typography>
      </Breadcrumbs>

      {/* Filters */}
      <Card sx={{ mb: 4, boxShadow: 'none' }} elevation={0}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={<Checkbox checked={filterByDate} onChange={e => setFilterByDate(e.target.checked)} />}
                  label='Date Filter'
                  sx={{ ml: 0.5, '& .MuiFormControlLabel-label': { fontWeight: 500 } }}
                />
                <AppReactDatepicker
                  selected={dateFilter}
                  onChange={setDateFilter}
                  dateFormat='dd/MM/yyyy'
                  customInput={<TextField fullWidth size='small' disabled={!filterByDate} />}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={['Genplus Innovations', 'Pest Masters']}
                value={originFilter}
                onChange={(_, v) => setOriginFilter(v)}
                renderInput={p => <TextField {...p} label='Origin' inputRef={originRef} size='small' />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={['GP Industries Pvt Ltd', 'Acme Corp']}
                value={customerFilter}
                onChange={(_, v) => setCustomerFilter(v)}
                renderInput={p => <TextField {...p} label='Customer' inputRef={customerRef} size='small' />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={['Limited Contract', 'Annual Contract']}
                value={contractTypeFilter}
                onChange={(_, v) => setContractTypeFilter(v)}
                renderInput={p => <TextField {...p} label='Contract Type' inputRef={contractTypeRef} size='small' />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={['Monthly', 'Yearly']}
                value={invoiceFrequencyFilter}
                onChange={(_, v) => setInvoiceFrequencyFilter(v)}
                renderInput={p => (
                  <TextField {...p} label='Invoice Frequency' inputRef={invoiceFrequencyRef} size='small' />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={['Current', 'Expired', 'Hold', 'Terminated']}
                value={contractStatusFilter}
                onChange={(_, v) => setContractStatusFilter(v)}
                renderInput={p => (
                  <TextField {...p} label='Contract Status' inputRef={contractStatusRef} size='small' />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={['New', 'Renewed']}
                value={renewalFilter}
                onChange={(_, v) => setRenewalFilter(v)}
                renderInput={p => <TextField {...p} label='New / Renewed' inputRef={renewalRef} size='small' />}
              />
            </Grid>
          </Grid>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item>
              <Button variant='contained' size='small' onClick={loadData}>
                Refresh
              </Button>
            </Grid>
            <Grid item>
              <Button variant='contained' size='small' onClick={exportPrint}>
                Print Agreement
              </Button>
            </Grid>
            <Grid item>
              <Button variant='contained' size='small'>
                Auto Review
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card sx={{ p: 3 }}>
        <CardHeader
          sx={{ pb: 1.5, pt: 1.5, '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '1.125rem' } }}
          title={
            <Box display='flex' alignItems='center' gap={2}>
              <Typography variant='h5' sx={{ fontWeight: 600 }}>
                Contract List
              </Typography>
              <Button variant='contained' startIcon={<RefreshIcon />} disabled={loading} onClick={loadData}>
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </Box>
          }
          action={
            <Box display='flex' alignItems='center' gap={1}>
              {['Copy', 'CSV', 'Excel', 'PDF', 'Print'].map(btn => (
                <Button
                  key={btn}
                  variant='contained'
                  size='small'
                  onClick={
                    btn === 'CSV'
                      ? exportCSV
                      : btn === 'Print'
                        ? exportPrint
                        : () => showToast('info', `${btn} coming soon`)
                  }
                  sx={{
                    bgcolor: '#6c757d', // Gray background
                    color: '#fff',
                    fontWeight: 500,
                    textTransform: 'none',
                    borderRadius: '8px', // Rounded corners
                    px: 2,
                    py: 1.25,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)', // Subtle shadow
                    '&:hover': {
                      bgcolor: '#5a6268', // Darker on hover
                      boxShadow: '0 3px 6px rgba(0,0,0,0.2)'
                    },
                    '&:active': {
                      boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                      transform: 'translateY(1px)'
                    }
                  }}
                >
                  {btn}
                </Button>
              ))}
              <Button variant='contained' startIcon={<AddIcon />} onClick={() => router.push('/admin/contracts/add')}>
                Add Contract
              </Button>
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
                Loading Contracts...
              </Typography>
            </Box>
          </Box>
        )}

        <Divider sx={{ mb: 2 }} />
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <FormControl size='small' sx={{ width: 140 }}>
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
          <DebouncedInput
            value={searchText}
            onChange={v => {
              setSearchText(String(v))
              setPagination(p => ({ ...p, pageIndex: 0 }))
            }}
            placeholder='Search any field...'
            sx={{ width: 420 }}
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

        {/* Scrollable Table */}
        <div className='overflow-x-auto'>
          <div style={{ minWidth: '4200px' }}>
            <table className={styles.table}>
              <thead>
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id}>
                    {hg.headers.map((h, idx) => (
                      <th
                        key={h.id}
                        style={{
                          width: h.column.columnDef.meta?.width,
                          position: idx < 2 ? 'sticky' : 'relative',
                          left: idx === 0 ? 0 : idx === 1 ? '60px' : 'auto',
                          background: '#fff',
                          zIndex: idx < 2 ? 10 : 1,
                          boxShadow: idx === 1 ? '2px 0 4px -2px rgba(0,0,0,0.1)' : 'none'
                        }}
                      >
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
                      {row.getVisibleCells().map((cell, idx) => (
                        <td
                          key={cell.id}
                          style={{
                            textAlign: cell.column.columnDef.meta?.align || 'left',
                            position: idx < 2 ? 'sticky' : 'relative',
                            left: idx === 0 ? 0 : idx === 1 ? '60px' : 'auto',
                            background: '#fff',
                            zIndex: idx < 2 ? 9 : 1,
                            boxShadow: idx === 1 ? '2px 0 4px -2px rgba(0,0,0,0.1)' : 'none'
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className='text-center py-4'>
                      {loading ? 'Loading...' : 'No results found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <TablePaginationComponent totalCount={rowCount} pagination={pagination} setPagination={setPagination} />
      </Card>
    </Box>
  )
}
