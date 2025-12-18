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

import PermissionGuard from '@/components/auth/PermissionGuard'

// 🔥 Global UI Components (use everywhere)
import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import GlobalTextarea from '@/components/common/GlobalTextarea'
import GlobalSelect from '@/components/common/GlobalSelect'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import { showToast } from '@/components/common/Toasts'

import { getContractView } from '@/api/contract/viewStatus'

import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { useRouter } from 'next/navigation'
import { usePermission } from '@/hooks/usePermission'
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
import { getAllDropdowns } from '@/api/contract/dropdowns'

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

const contractStatusOptions = [
  { label: 'Current', value: 'Current' },
  { label: 'Renewal Pending', value: 'Renewal Pending' },
  { label: 'Renewed', value: 'Renewed' },
  { label: 'Hold', value: 'Hold' },
  { label: 'Terminated', value: 'Terminated' },
  { label: 'Expired', value: 'Expired' }
]

const renewalOptions = [
  { label: 'New', value: 'New' },
  { label: 'Renewed', value: 'Renewed' }
]

// ───────────────────────────────────────────
// Main Component
// ───────────────────────────────────────────
// ───────────────────────────────────────────
const ContractStatusPageContent = () => {
  const router = useRouter()
  const { canAccess } = usePermission()
  const [rows, setRows] = useState([])
  const [rowCount, setRowCount] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [dateFilter, setDateFilter] = useState({ start: null, end: null })

  const [filterByDate, setFilterByDate] = useState(false)
  const [originFilter, setOriginFilter] = useState(null)
  const [customerFilter, setCustomerFilter] = useState(null)
  const [contractTypeFilter, setContractTypeFilter] = useState(null)
  const [invoiceFrequencyFilter, setInvoiceFrequencyFilter] = useState(null)
  const [contractStatusFilter, setContractStatusFilter] = useState(null)
  const [renewalFilter, setRenewalFilter] = useState(null)

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [loading, setLoading] = useState(false)

  const [originOptions, setOriginOptions] = useState([])
  const [customerOptions, setCustomerOptions] = useState([])
  const [contractTypeOptions, setContractTypeOptions] = useState([])
  const [invoiceOptions, setInvoiceOptions] = useState([])

  const [companyMap, setCompanyMap] = useState(new Map()) // For mapping company ID to name

  const originRef = useRef()
  const customerRef = useRef()
  const contractTypeRef = useRef()
  const invoiceFrequencyRef = useRef()
  const contractStatusRef = useRef()
  const renewalRef = useRef()

  const loadData = async () => {
    setLoading(true)
    console.log('🟡 Invoice Filter Object →', invoiceFrequencyFilter)

    try {
      // 1️⃣ CALL API WITH FILTERS + PAGINATION
      const params = {}

      if (originFilter?.value) params.company_id = originFilter.value
      if (customerFilter?.value) params.customer_id = customerFilter.value
      if (contractTypeFilter?.value) params.contract_type = contractTypeFilter.value
      if (invoiceFrequencyFilter?.value) params.billing_frequency_id = invoiceFrequencyFilter.value
      if (contractStatusFilter?.value) params.contract_status = contractStatusFilter.value
      if (renewalFilter?.value) params.is_renewed = renewalFilter.value === 'Renewed' ? true : false

      if (filterByDate && dateFilter.start && dateFilter.end) {
        params.from_date = dateFilter.start.toISOString().split('T')[0]
        params.to_date = dateFilter.end.toISOString().split('T')[0]
      } else {
        delete params.from_date
        delete params.to_date
      }

      params.page = pagination.pageIndex + 1
      params.page_size = pagination.pageSize

      console.log('🔍 Params sending to API: ', params)

      const response = await getContractView(params)

      // Safely handle both response formats
      const apiData = response.data.data ?? response.data

      const count = apiData.count ?? 0
      const results = apiData.results ?? []

      setRowCount(count)

      // 2️⃣ MAP API FIELDS → UI FIELDS
      // 2️⃣ MAP API FIELDS → UI FIELDS
      const normalized = results.map((item, index) => {
        // 🔹 Proper Status Text Convert
        const statusMap = {
          1: 'Current',
          2: 'Expired',
          3: 'Hold',
          4: 'Terminated'
        }
        // Remove number mapping — API gives correct status string
        const statusText = item.contract_status || 'Current'

        // Date Formatter
        const formatDate = d => {
          if (!d) return ''
          // Convert "DD-MM-YYYY" & "2025-12-06" (BE)
          const clean = d.replace(/[/\s].*/, '')
          const parts = clean.split(/[-/]/)

          if (parts.length === 3) {
            if (parts[0].length === 2) {
              // dd-mm-yyyy
              return `${parts[0]}-${parts[1]}-${parts[2]}`
            } else if (parts[0].length === 4) {
              // yyyy-mm-dd
              return `${parts[2]}-${parts[1]}-${parts[0]}`
            }
          }

          return new Date(d).toLocaleDateString('en-GB')
        }

        return {
          sno: index + 1 + pagination.pageIndex * pagination.pageSize,
          id: item.id,

          customer: item.customer_name || '—',
          services: item.call_type_id || item.category || item.sales_mode || '—',
          contractCode: item.contract_code || '—',
          type: item.contract_type || '—',
          serviceAddress: item.service_address || item.agreement_add_1 || item.agreement_add_2 || '—',
          postalCode: item.postal_address || '—',

          // 👇 Final Display Date Conversion
          startDate: formatDate(item.start_date),
          endDate: formatDate(item.end_date),
          renewalOn: formatDate(item.renewed_on),
          holdedOn: formatDate(item.holded_on),
          terminatedOn: formatDate(item.terminated_on),
          expiredOn: formatDate(item.expired_on),

          pest:
            item.ref_contract_pests?.map(p => p.pest).join(', ') ||
            item.ref_job_pests?.map(p => p.pest).join(', ') ||
            '—',

          contractValue: item.contract_value || 0,
          prodValue: item.product_value || 0,

          contactPerson: item.contact_person_name || '—',
          contactPhone: item.mobile || item.phone || '—',

          renewalPending: item.is_renewed === 1 ? 'No' : 'Yes',

          status: statusText, // 👈 Correct Status Value

          origin: companyMap.get(item.company_id) || item.company_id || '—',
          reportEmail: item.report_email || '—',
          picEmail: item.appointment_remarks || '—',
          billingEmail: item.billing_remarks || '—'
        }
      })

      // 3️⃣ SET DATA TO TABLE
      setRows(normalized)
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to load contracts')
    } finally {
      setLoading(false)
    }
  }

  // STEP 2: Filter change aana page 1 ku po
  // When filters change -> Reset to first page + load
  useEffect(() => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }))
    loadData()
  }, [
    searchText,
    filterByDate,
    dateFilter.start,
    dateFilter.end,
    originFilter,
    customerFilter,
    contractTypeFilter,
    invoiceFrequencyFilter,
    contractStatusFilter,
    renewalFilter
  ])

  // When pagination changes -> load
  useEffect(() => {
    loadData()
  }, [pagination.pageIndex, pagination.pageSize])

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const result = await getAllDropdowns()

        console.log('Dropdowns from API:', result)

        // Origin (Company)
        setOriginOptions(result.companies || [])
        setCompanyMap(new Map(result.companies?.map(c => [c.value, c.label]) || []))

        // Customer
        setCustomerOptions(result.customers || [])

        // Contract Type
        setContractTypeOptions(
          (result.callTypes || []).map(type => ({
            label: type,
            value: type
          }))
        )

        setInvoiceOptions(result.billingFreq || [])
      } catch (err) {
        console.error('Failed to load dropdowns:', err)
        showToast('error', 'Failed to load filters')
      }
    }

    fetchDropdowns()
  }, [])
  // Table Columns
  const columnHelper = createColumnHelper()
  const columns = useMemo(
    () => [
      columnHelper.accessor('sno', {
        header: 'S.No',
        meta: { width: '60px', align: 'center' },
         enableSorting: true
      }),
      columnHelper.display({
        id: 'actions_column',
        header: 'Actions',
        meta: { width: '120px', align: 'center' }, // 👈 FIXED WIDTH

        cell: ({ row }) => {
          const item = row.original

          return (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center', // 👈 PERFECT CENTER
                gap: 1.5,
                width: '100%'
              }}
            >
              {/* 👁 VIEW */}
              <IconButton
                size='small'
                color='info'
                sx={{ p: 0.8 }}
                onClick={() => router.push(`/admin/contracts/${item.id}/view`)}
              >
                <i className='tabler-eye' />
              </IconButton>

              {/* ✏ EDIT */}
              {/* <IconButton size='small' sx={{ p: 0.8 }} onClick={() => handleEdit(item)}>
                <i className='tabler-edit text-blue-600 text-[18px]' />
              </IconButton> */}

              {/* 🗑 DELETE */}
              {/* <IconButton size='small' sx={{ p: 0.8 }} onClick={() => setDeleteDialog({ open: true, row: item })}>
                <i className='tabler-trash text-red-600 text-[18px]' />
              </IconButton> */}
            </Box>
          )
        }
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
              ? '#28a745'
              : s === 'Terminated'
                ? '#dc3545'
                : s === 'Hold'
                  ? '#ffc107'
                  : s === 'Expired'
                    ? '#fd7e14'
                    : '#6c757d'

          return (
            <Chip
              label={s}
              size='small'
              sx={{
                color: '#fff',
                bgcolor: bg,
                fontWeight: 700,
                fontSize: '0.75rem',
                borderRadius: '6px',
                px: 1.5,
                textTransform: 'capitalize'
              }}
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
    [companyMap]
  )

  const fuzzyFilter = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value)
    addMeta({ itemRank })
    return itemRank.passed
  }

  const table = useReactTable({
    data: rows,
    columns,

    // CHANGE 1: manualPagination true aakku
    manualPagination: true,

    // CHANGE 2: pageCount loading-la iruntha -1 aakku (important!)
    pageCount: loading ? -1 : Math.ceil(rowCount / pagination.pageSize),

    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
    // getFilteredRowModel remove pannu if not needed (optional)
  })

  // ADD THIS FULL BLOCK — Jumping 100% Stop Aagum
  useEffect(() => {
    if (!loading && rowCount > 0) {
      const maxPageIndex = Math.max(0, Math.ceil(rowCount / pagination.pageSize) - 1)
      if (pagination.pageIndex > maxPageIndex) {
        setPagination(prev => ({ ...prev, pageIndex: maxPageIndex }))
      }
    }
  }, [rowCount, pagination.pageSize, loading])

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
      {loading && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            bgcolor: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <ProgressCircularCustomization size={60} thickness={5} />
        </Box>
      )}

      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 2 }}>
        <Link underline='hover' color='inherit' href='/admin/dashboard'>
          Dashboard
        </Link>
        <Typography color='text.primary'>View Contract Status</Typography>
      </Breadcrumbs>

      {/* Table */}
      <Card sx={{ p: 4 }}>
        <CardHeader
          title={
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2
              }}
            >
              {/* LEFT — Title + Refresh */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant='h5' sx={{ fontWeight: 600 }}>
                  View Contract Status
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

              {/* RIGHT — ADD CONTRACT */}
              {canAccess('Contracts', 'create') && (
                <Button
                  variant='contained'
                  color='primary'
                  startIcon={<AddIcon />}
                  onClick={() => router.push('/admin/contracts/add')}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    px: 3,
                    height: 36
                  }}
                >
                  Add Contract
                </Button>
              )}
            </Box>
          }
          sx={{
            pb: 1.5,
            pt: 1.5,
            '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '1.125rem' }
          }}
        />

        <Divider sx={{ mb: 2 }} />

        {/* SINGLE ROW FILTER BAR */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 3,
            flexWrap: 'wrap',
            mb: 4
          }}
        >
          {/* Date Filter */}
          <Box sx={{ position: 'relative', zIndex: 30 }}>
            {' '}
            {/* 👈 FIX is here */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Checkbox
                checked={filterByDate}
                onChange={e => {
                  const checked = e.target.checked
                  setFilterByDate(checked)

                  if (checked) {
                    const today = new Date()
                    const onlyDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())

                    const updatedRange = {
                      start: onlyDate,
                      end: onlyDate
                    }

                    setDateFilter(updatedRange)

                    // 👇 THIS IS MISSING EARLIER → Force API call
                    setTimeout(() => {
                      loadData()
                    }, 0)
                  } else {
                    setDateFilter({ start: null, end: null })
                    setTimeout(() => {
                      loadData()
                    }, 0)
                  }
                }}
                size='small'
              />

              <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>Date Range</Typography>
            </Box>
            <AppReactDatepicker
              selectsRange
              startDate={dateFilter?.start || null}
              endDate={dateFilter?.end || null}
              onChange={dates => {
                const [start, end] = dates
                setDateFilter({ start, end })
              }}
              shouldCloseOnSelect={false}
              disabled={!filterByDate}
              popperProps={{ strategy: 'fixed' }}
              popperPlacement='bottom-start'
              customInput={
                <TextField
                  fullWidth
                  size='small'
                  disabled={!filterByDate}
                  sx={{ width: 220, bgcolor: '#fff' }}
                  placeholder='Select Date Range'
                />
              }
            />
          </Box>

          {/* Origin */}
          <GlobalAutocomplete
            label='Origin'
            options={originOptions}
            value={originFilter}
            onChange={v => setOriginFilter(v)}
            sx={{ width: 200 }}
          />

          {/* Customer */}
          <GlobalAutocomplete
            label='Customer'
            options={customerOptions}
            value={customerFilter}
            onChange={v => setCustomerFilter(v)}
            sx={{ width: 200 }}
          />

          {/* Contract Type */}
          <GlobalAutocomplete
            label='Contract Type'
            options={contractTypeOptions}
            value={contractTypeFilter}
            onChange={v => setContractTypeFilter(v)}
            sx={{ width: 200 }}
          />

          {/* Invoice Frequency */}
          <GlobalAutocomplete
            label='Invoice Frequency'
            options={invoiceOptions}
            value={invoiceFrequencyFilter}
            onChange={v => setInvoiceFrequencyFilter(v)}
            sx={{ width: 200 }}
          />

          {/* Contract Status */}
          <GlobalAutocomplete
            label='Contract Status'
            options={contractStatusOptions}
            value={contractStatusFilter}
            onChange={v => setContractStatusFilter(v)}
            sx={{ width: 200 }}
          />

          {/* New / Renewed */}
          <GlobalAutocomplete
            label='New / Renewed'
            options={renewalOptions}
            value={renewalFilter}
            onChange={v => setRenewalFilter(v)}
            sx={{ width: 200 }}
          />
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* TOOLBAR: Entries + Export + Search */}
        <Box
          sx={{
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap'
          }}
        >
          {/* LEFT SIDE — Entries + Export */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Entries Dropdown */}
            <FormControl size='small' sx={{ width: 140 }}>
              <Select
                value={pagination.pageSize}
                onChange={e => setPagination(p => ({ ...p, pageSize: Number(e.target.value), pageIndex: 0 }))}
              >
                {[25, 50, 75, 100].map(s => (
                  <MenuItem key={s} value={s}>
                    {s} entries
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Export Buttons next to Entries */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {['Copy', 'CSV', 'Excel', 'PDF', 'Print'].map(btn => (
                <GlobalButton
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
                    bgcolor: '#6c757d',
                    color: '#fff',
                    textTransform: 'none',
                    borderRadius: '8px',
                    px: 2,
                    py: 1,
                    minWidth: 60,
                    '&:hover': { bgcolor: '#5a6268' }
                  }}
                >
                  {btn}
                </GlobalButton>
              ))}
            </Box>
          </Box>

          {/* RIGHT SIDE — Search */}
          <DebouncedInput
            value={searchText}
            onChange={v => {
              setSearchText(String(v))
              setPagination(p => ({ ...p, pageIndex: 0 }))
            }}
            placeholder='Search any field...'
            sx={{ width: 350 }}
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
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className='text-center py-4'>
                      {loading ? 'Loading...' : 'No contracts found'}
                    </td>
                  </tr>
                ) : (
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

// Wrapper for RBAC
export default function ContractStatusPage() {
  return (
    <PermissionGuard permission="Contract Status">
      <ContractStatusPageContent />
    </PermissionGuard>
  )
}
