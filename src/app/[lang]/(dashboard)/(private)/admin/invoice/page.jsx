'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'

// MUI
import {
  Box,
  Card,
  CardHeader,
  Button,
  Typography,
  IconButton,
  Breadcrumbs,
  Divider,
  Chip,
  Grid,
  Select,
  MenuItem,
  InputAdornment,
  Pagination,
  Checkbox
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'

// Table
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'

// Local components
import CustomTextField from '@core/components/mui/TextField'
import CustomAutocomplete from '@core/components/mui/Autocomplete'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import tableStyles from '@core/styles/table.module.css'

// API
import { getInvoiceList, getInvoiceDropdowns } from '@/api/invoice' // adjust path if needed

import { showToast } from '@/components/common/Toasts'

const columnHelper = createColumnHelper()

export default function InvoiceListPageFull() {
  // ── Data & Dropdowns ────────────────────────
  const [data, setData] = useState([])
  const [dropdownData, setDropdownData] = useState({})

  // ── UI State ─────────────────────────────────
  const [loading, setLoading] = useState(false)

  // ── Filters ──────────────────────────────────
  const [dateFilterEnabled, setDateFilterEnabled] = useState(false)
  const [filterDate, setFilterDate] = useState(new Date())
  const [originFilter, setOriginFilter] = useState(null)
  const [contractTypeFilter, setContractTypeFilter] = useState('')
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('')
  const [serviceFreqFilter, setServiceFreqFilter] = useState('')
  const [billingFreqFilter, setBillingFreqFilter] = useState('')
  const [contractLevelFilter, setContractLevelFilter] = useState('')
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState('')
  const [salesPersonFilter, setSalesPersonFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [contractFilter, setContractFilter] = useState('')
  const [searchText, setSearchText] = useState('')
  const [totalCount, setTotalCount] = useState(0)

  // ── Pagination ───────────────────────────────
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  const loadContractsForCustomer = async customerId => {
    try {
      const res = await getInvoiceDropdowns({ customer_id: customerId })
      const dd = res?.data?.data || {}

      setDropdownData(prev => ({
        ...prev,
        contracts: normalizeList(dd.contract_list?.label, 'label')
      }))
    } catch (err) {
      console.log(err)
      showToast('error', 'Failed to load contracts')
    }
  }

  // ── Build query params for invoice-list API ─────────────────
  const buildListParams = () => {
    const params = {
      page: pagination.pageIndex + 1,
      page_size: pagination.pageSize
    }

    // DATE
    if (dateFilterEnabled && filterDate) {
      params.invoice_date = format(filterDate, 'yyyy-MM-dd')
    }

    // ORIGIN
    if (originFilter?.id) params.company_id = originFilter.id

    // CONTRACT TYPE
    if (contractTypeFilter?.id) params.contract_type = contractTypeFilter.id

    // INVOICE STATUS (Yes / No)
    if (invoiceStatusFilter?.label) {
      params.is_issued = invoiceStatusFilter.label === 'Yes' ? 1 : 0
    }

    // SERVICE FREQUENCY
    if (serviceFreqFilter?.id) params.service_frequency = serviceFreqFilter.id

    // BILLING FREQUENCY
    if (billingFreqFilter?.id) params.billing_frequency = billingFreqFilter.id

    // CONTRACT LEVEL
    if (contractLevelFilter?.id) params.contract_level = contractLevelFilter.id

    // INVOICE TYPE
    if (invoiceTypeFilter?.id) params.invoice_type = invoiceTypeFilter.id

    // SALES PERSON
    if (salesPersonFilter?.id) params.sales_person_id = salesPersonFilter.id

    // CUSTOMER
    if (customerFilter?.id) params.customer_id = customerFilter.id

    // CONTRACT
    if (contractFilter?.id) params.contract_id = contractFilter.id

    // SEARCH TEXT
    if (searchText) params.search = searchText

    return params
  }

  const buildFilters = () => {
    const params = {
      page: pagination.pageIndex + 1,
      page_size: pagination.pageSize
    }

    if (dateFilterEnabled && filterDate) params.invoice_date = format(filterDate, 'yyyy-MM-dd')

    if (originFilter?.id) params.company_id = originFilter.id
    if (contractTypeFilter?.id) params.contract_type = contractTypeFilter.id
    if (invoiceStatusFilter?.label) params.is_issued = invoiceStatusFilter.label === 'Yes' ? 1 : 0
    if (serviceFreqFilter?.id) params.service_frequency = serviceFreqFilter.id
    if (billingFreqFilter?.id) params.billing_frequency = billingFreqFilter.id
    if (contractLevelFilter?.id) params.contract_level = contractLevelFilter.id
    if (invoiceTypeFilter?.id) params.invoice_type = invoiceTypeFilter.id
    if (salesPersonFilter?.id) params.sales_person_id = salesPersonFilter.id
    if (customerFilter?.id) params.customer_id = customerFilter.id
    if (contractFilter?.id) params.contract_id = contractFilter.id

    if (searchText) params.search = searchText

    return params
  }

  const normalizeList = (list, key = 'name') => {
    if (!Array.isArray(list)) return []

    return list
      .map(item => ({
        id: item.id,
        label: item[key] || item.label || ''
      }))
      .filter((item, index, array) => array.findIndex(x => x.id === item.id) === index)
  }

  // ── Load List + Dropdowns ─────────────────────
  const loadEverything = async () => {
    setLoading(true)
    try {
      const params = buildListParams()

      const [listRes, dropdownRes] = await Promise.all([getInvoiceList(params), getInvoiceDropdowns()])

      // CORRECT response handling
      const results = listRes?.results || []
      const count = listRes?.count || 0

      const ddWrapper = dropdownRes?.data || dropdownRes || {}
      const dd = ddWrapper?.data || {}

      const processedDropdowns = {
        origins: normalizeList(dd.company?.name, 'name'),
        billing_frequencies: normalizeList(dd.billing_frequency?.name, 'name'),
        service_frequencies: normalizeList(dd.service_frequency?.name, 'name'),
        customers: normalizeList(dd.customer?.label, 'label'),
        contracts: normalizeList(dd.contract_list?.label, 'label'),
        sales_persons: normalizeList(dd.sales_person?.name, 'name'),
        contract_levels: normalizeList(dd.contract_level?.name, 'name'),
        invoice_statuses: normalizeList(dd.invoice_status?.name, 'name'),
        contract_types: normalizeList(dd.contract_type?.name, 'name'),
        invoice_types: normalizeList(dd.invoice_type?.name, 'name')
      }

      setDropdownData(processedDropdowns)
      setData(results.map(inv => mapInvoice(inv, processedDropdowns)))
      setTotalCount(count)
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  // இதை useEffect(() => { loadEverything() }, [pagination...]) க்கு கீழ போடுங்க
  useEffect(() => {
    loadEverything()
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    dateFilterEnabled ? format(filterDate, 'yyyy-MM-dd') : null,
    originFilter?.id,
    contractTypeFilter?.id,
    invoiceStatusFilter?.label,
    serviceFreqFilter?.id,
    billingFreqFilter?.id,
    contractLevelFilter?.id,
    invoiceTypeFilter?.id,
    salesPersonFilter?.id,
    customerFilter?.id,
    contractFilter?.id,
    searchText
  ])

  // ── Refresh ───────────────────────────────────
  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => loadEverything(), 300)
  }

  const mapInvoice = (inv, dd) => ({
    id: inv.id,
    invDate: inv.invoice_date || null,
    invNo: inv.invoice_number || '-',

    origin: dd.origins?.find(o => o.id == inv.company_id)?.label || inv.company_name || 'Unknown',

    invFrequency:
      dd.billing_frequencies?.find(f => f.id == inv.billing_frequency_id || f.id == inv.invoice_frequency_id)?.label ||
      '-',

    svcFrequency: dd.service_frequencies?.find(f => f.id == inv.service_frequency)?.label || '-',
    contractLevel: dd.contract_levels?.find(c => c.id == inv.contract_level)?.label || '-',
    invoiceType: dd.invoice_types?.find(t => t.id == inv.invoice_type)?.label || '-',
    contractType: dd.contract_types?.find(t => t.id == inv.contract_type)?.label || '-',
    salesPerson: dd.sales_persons?.find(s => s.id == inv.sales_person_id)?.label || '-',

    customerName: dd.customers?.find(c => c.id == inv.customer_id)?.label || inv.customer_name || '-',
    contractCode: dd.contracts?.find(c => c.id == inv.contract_id)?.label || inv.contract_code || '-',

    amount: inv.amount || 0,
    tax: inv.gst || 0,
    total: (inv.amount || 0) + (inv.gst || 0),
    issued: inv.is_issued === 1 || inv.is_issued === true
  })

  // ── Dropdown options from API (fallback to empty array) ─────
  const originOptions = dropdownData.origins || []
  const contractTypeOptions = dropdownData.contract_types || []
  const invoiceStatusOptions = dropdownData.invoice_statuses || []
  const serviceFreqOptions = dropdownData.service_frequencies || []
  const billingFreqOptions = dropdownData.billing_frequencies || []
  const contractLevelOptions = dropdownData.contract_levels || []
  const invoiceTypeOptions = dropdownData.invoice_types || []
  const salesPersonOptions = dropdownData.sales_persons || []
  const customerOptions = dropdownData.customers || []
  const contractOptions = dropdownData.contracts || []

  // ── Columns (exactly same as before) ─────────────────────
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'sno',
        header: 'S.No',
        enableSorting: false,
        cell: ({ row }) => row.index + 1 + pagination.pageIndex * pagination.pageSize
      }),

      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: () => (
          <div className='flex items-center gap-2'>
            <IconButton size='small'>
              <i className='tabler-circle-check text-green-600 text-lg' />
            </IconButton>
            <IconButton size='small'>
              <i className='tabler-edit text-blue-600 text-lg' />
            </IconButton>
            <IconButton size='small'>
              <i className='tabler-trash text-red-600 text-lg' />
            </IconButton>
            {/* <IconButton size='small'>
              <i className='tabler-eye text-gray-600 text-lg' />
            </IconButton> */}
            <IconButton size='small'>
              <i className='tabler-printer text-purple-600 text-lg' />
            </IconButton>
          </div>
        )
      }),

      columnHelper.accessor('invDate', {
        header: 'INV.Date',
        cell: info => {
          const val = info.getValue()
          if (!val) return '-'
          const d = new Date(val)
          return isNaN(d.getTime()) ? '-' : format(d, 'dd/MM/yyyy')
        }
      }),
      columnHelper.accessor('invNo', { header: 'INV.No' }),
      columnHelper.accessor('invFrequency', { header: 'INV.Frequency' }),
      columnHelper.accessor('svcFrequency', { header: 'SVC Frequency' }),
      columnHelper.accessor('noOfServices', { header: 'No.Of Value Services' }),
      columnHelper.accessor('lastSvcDate', {
        header: 'Last SVC Date',
        cell: info => {
          const val = info.getValue()
          if (!val) return '-'
          const d = new Date(val)
          return isNaN(d.getTime()) ? '-' : format(d, 'dd/MM/yyyy')
        }
      }),
      columnHelper.accessor('contractCode', { header: 'Contract Code' }),
      columnHelper.accessor('cardId', { header: 'Card ID' }),
      columnHelper.accessor('billingName', { header: 'Billing Name' }),
      columnHelper.accessor('address', { header: 'Service Address' }),
      columnHelper.accessor('amount', { header: 'Amount', cell: info => `₹ ${info.getValue() || 0}` }),
      columnHelper.accessor('tax', { header: 'Tax', cell: info => `₹ ${info.getValue() || 0}` }),
      columnHelper.accessor('taxAmount', { header: 'Tax Amount', cell: info => `₹ ${info.getValue() || 0}` }),
      columnHelper.accessor('total', {
        header: 'Total Amount',
        cell: info => <strong>₹ {info.getValue() || 0}</strong>
      }),
      columnHelper.accessor('accountItemCode', { header: 'Account Item Code' }),
      columnHelper.accessor('poNo', { header: 'PO.No' }),
      columnHelper.accessor('issued', {
        header: 'Issued?',
        cell: info => (
          <Chip
            label={info.getValue() ? 'Yes' : 'No'}
            color={info.getValue() ? 'success' : 'warning'}
            size='small'
            sx={{ color: '#fff', fontWeight: 600 }}
          />
        )
      })
    ],
    [pagination.pageIndex, pagination.pageSize]
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  // ── Filtering (same logic as before) ─────────────────────
  const filteredRows = useMemo(() => {
    return data.filter(r => {
      const combined = `${r.invNo} ${r.contractCode} ${r.billingName} ${r.address} ${r.invFrequency}`.toLowerCase()

      // SEARCH
      if (searchText && !combined.includes(searchText.toLowerCase())) return false

      // DATE FILTER
      if (dateFilterEnabled) {
        const rowDate = new Date(r.invDate).toDateString()
        if (rowDate !== filterDate.toDateString()) return false
      }

      // ORIGIN
      if (originFilter && r.origin !== originFilter.label) return false

      // CONTRACT TYPE
      if (contractTypeFilter && r.contractType !== contractTypeFilter.label) return false

      // INVOICE STATUS (Issued: Yes/No)
      if (invoiceStatusFilter) {
        const status = r.issued ? 'Yes' : 'No'
        if (status !== invoiceStatusFilter.label) return false
      }

      // SERVICE FREQUENCY
      if (serviceFreqFilter && r.svcFrequency !== serviceFreqFilter.label) return false

      // BILLING FREQUENCY
      if (billingFreqFilter && r.invFrequency !== billingFreqFilter.label) return false

      // CONTRACT LEVEL
      if (contractLevelFilter && r.contractLevel !== contractLevelFilter.label) return false

      // INVOICE TYPE
      if (invoiceTypeFilter && r.invoiceType !== invoiceTypeFilter.label) return false

      // SALES PERSON
      if (salesPersonFilter && r.salesPerson !== salesPersonFilter.label) return false

      // CUSTOMER
      if (customerFilter && r.customerName !== customerFilter.label) return false

      // CONTRACT
      if (contractFilter && r.contractCode !== contractFilter.label) return false

      return true
    })
  }, [
    data,
    searchText,
    dateFilterEnabled,
    filterDate,
    originFilter,
    contractTypeFilter,
    invoiceStatusFilter,
    serviceFreqFilter,
    billingFreqFilter,
    contractLevelFilter,
    invoiceTypeFilter,
    salesPersonFilter,
    customerFilter,
    contractFilter
  ])

  const pageIndex = pagination.pageIndex
  const pageSize = pagination.pageSize
  const pageCount = Math.ceil(totalCount / pageSize)
  const paginated = filteredRows // backend already paginated

  // Reset page when filters remove all rows
  useEffect(() => {
    if (pageIndex >= pageCount && pageCount > 0) {
      setPagination(p => ({ ...p, pageIndex: pageCount - 1 }))
    }
  }, [pageCount, pageIndex])

  return (
    <Box>
      {/* BREADCRUMB */}
      <Box role='presentation' sx={{ mb: 2 }}>
        <Breadcrumbs aria-label='breadcrumb'>
          <Link underline='hover' color='inherit' href='/'>
            Home
          </Link>
          <Typography color='text.primary'>Invoice List</Typography>
        </Breadcrumbs>
      </Box>

      <Card sx={{ p: 3 }}>
        {/* HEADER */}
        <CardHeader
          title={
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant='h5' sx={{ fontWeight: 600 }}>
                  Invoice List
                </Typography>

                <Button
                  variant='contained'
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
                  onClick={handleRefresh}
                  sx={{ textTransform: 'none', height: 36, px: 2.5 }}
                  size='small'
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </Button>
              </Box>
            </Box>
          }
          sx={{ pb: 1.5, pt: 1.5 }}
        />

        {/* FILTERS */}
        <Box px={3} pb={2}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, alignItems: 'end', mb: 2 }}>
            {/* Date */}
            <Box>
              <Box display='flex' alignItems='center' gap={1} sx={{ mb: 1 }}>
                <Checkbox
                  size='small'
                  checked={dateFilterEnabled}
                  onChange={e => setDateFilterEnabled(e.target.checked)}
                />
                <Typography variant='body2' sx={{ fontWeight: 600 }}>
                  Date
                </Typography>
              </Box>
              <AppReactDatepicker
                selected={filterDate}
                onChange={d => setFilterDate(d)}
                dateFormat='dd/MM/yyyy'
                customInput={<CustomTextField size='small' fullWidth disabled={!dateFilterEnabled} />}
              />
            </Box>

            <CustomAutocomplete
              options={originOptions}
              value={originFilter || null}
              onChange={(_, v) => setOriginFilter(v || '')}
              renderInput={p => <CustomTextField {...p} label='Origin' size='small' />}
            />
            <CustomAutocomplete
              options={contractTypeOptions}
              value={contractTypeFilter || null}
              onChange={(_, v) => setContractTypeFilter(v || '')}
              renderInput={p => <CustomTextField {...p} label='Contract Type' size='small' />}
            />
            <CustomAutocomplete
              options={invoiceStatusOptions}
              value={invoiceStatusFilter || null}
              onChange={(_, v) => setInvoiceStatusFilter(v || '')}
              renderInput={p => <CustomTextField {...p} label='Invoice Status' size='small' />}
            />
            <CustomAutocomplete
              options={serviceFreqOptions}
              value={serviceFreqFilter || null}
              onChange={(_, v) => setServiceFreqFilter(v || '')}
              renderInput={p => <CustomTextField {...p} label='Service Frequency' size='small' />}
            />
            <CustomAutocomplete
              options={billingFreqOptions}
              value={billingFreqFilter || null}
              onChange={(_, v) => setBillingFreqFilter(v || '')}
              renderInput={p => <CustomTextField {...p} label='Billing Frequency' size='small' />}
            />
            <CustomAutocomplete
              options={contractLevelOptions}
              value={contractLevelFilter || null}
              onChange={(_, v) => setContractLevelFilter(v || '')}
              renderInput={p => <CustomTextField {...p} label='Contract Level' size='small' />}
            />
            <CustomAutocomplete
              options={invoiceTypeOptions}
              value={invoiceTypeFilter || null}
              onChange={(_, v) => setInvoiceTypeFilter(v || '')}
              renderInput={p => <CustomTextField {...p} label='Invoice Type' size='small' />}
            />
            <CustomAutocomplete
              options={salesPersonOptions}
              value={salesPersonFilter || null}
              onChange={(_, v) => setSalesPersonFilter(v || '')}
              renderInput={p => <CustomTextField {...p} label='Sales Person' size='small' />}
            />
            <CustomAutocomplete
              options={customerOptions}
              value={customerFilter || null}
              getOptionLabel={option => option?.label || ''}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  {option.label}
                </li>
              )}
              onChange={(_, v) => {
                setCustomerFilter(v)
                if (v?.id) {
                  getInvoiceDropdowns({ customer_id: v.id }).then(res => {
                    const dd = res.data?.data || {}
                    setDropdownData(prev => ({
                      ...prev,
                      contracts: normalizeList(dd.contract_list?.label, 'label')
                    }))
                  })
                }
              }}
              renderInput={params => <CustomTextField {...params} label='Customer' size='small' />}
            />

            <CustomAutocomplete
              options={contractOptions}
              value={contractFilter || null}
              getOptionLabel={opt => opt?.label || ''}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              onChange={(_, v) => setContractFilter(v)}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  {option.label}
                </li>
              )}
              renderInput={params => <CustomTextField {...params} label='Contract' size='small' />}
            />
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* SEARCH + ENTRIES */}
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2} gap={2}>
            <Select
              size='small'
              value={pageSize}
              onChange={e => setPagination(p => ({ ...p, pageSize: Number(e.target.value), pageIndex: 0 }))}
              sx={{ width: 130 }}
            >
              {[25, 50, 75, 100].map(s => (
                <MenuItem key={s} value={s}>
                  {s} entries
                </MenuItem>
              ))}
            </Select>

            <CustomTextField
              size='small'
              placeholder='Search invoice, contract, customer...'
              value={searchText}
              onChange={e => {
                setSearchText(e.target.value)
                setPagination(p => ({ ...p, pageIndex: 0 }))
              }}
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

          {/* TABLE */}
          <div className='overflow-x-auto'>
            <table className={tableStyles.table}>
              <thead>
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id}>
                    {hg.headers.map(h => (
                      <th key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {data.length > 0 ? (
                  table.getRowModel().rows.map(row => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className='text-center py-6'>
                      {loading ? 'Loading...' : 'No results found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <Box
            sx={{
              mt: 2,
              py: 1.5,
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Typography color='text.disabled'>
              {data.length === 0
                ? 'Showing 0 to 0 of 0 entries'
                : `Showing ${pagination.pageIndex * pagination.pageSize + 1} to ${pagination.pageIndex * pagination.pageSize + data.length} of ${totalCount} entries`}
            </Typography>

            <Pagination
              shape='rounded'
              color='primary'
              variant='tonal'
              count={pageCount}
              page={pageIndex + 1}
              onChange={(_, p) => setPagination(v => ({ ...v, pageIndex: p - 1 }))}
              showFirstButton
              showLastButton
            />
          </Box>
        </Box>
      </Card>
    </Box>
  )
}
