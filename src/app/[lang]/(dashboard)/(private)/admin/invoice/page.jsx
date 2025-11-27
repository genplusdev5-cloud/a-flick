'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
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
  Menu,
  MenuItem,
  Divider,
  Chip,
  Grid,
  TextField,
  Select,
  MenuList,
  FormControlLabel,
  InputAdornment,
  Pagination,
  Checkbox
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import GlobalDateRange from '@/components/common/GlobalDateRange'

// Table
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'

// Local components (adjust paths if needed)
import CustomTextField from '@core/components/mui/TextField'
import CustomAutocomplete from '@core/components/mui/Autocomplete'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import tableStyles from '@core/styles/table.module.css'

const columnHelper = createColumnHelper()

export default function InvoiceListPageFull() {
  // mock data — replace with API later
  const [data, setData] = useState([
    {
      id: 1,
      invDate: '2025-11-01',
      invNo: 'INV001',
      invFrequency: 'Monthly',
      svcFrequency: 'Quarterly',
      noOfServices: 2,
      lastSvcDate: '2025-10-28',
      contractCode: 'MJC0385',
      cardId: 'CARD001',
      billingName: 'Extra Space Tai Seng Pte Ltd',
      address: '14 Little Road, Singapore',
      amount: '150.00',
      tax: '10.00',
      taxAmount: '10.00',
      total: '160.00',
      accountItemCode: 'AIC001',
      poNo: 'PO001',
      issued: true,
      myob: 'Imported'
    },
    {
      id: 2,
      invDate: '2025-11-05',
      invNo: 'INV002',
      invFrequency: 'Quarterly',
      svcFrequency: 'Monthly',
      noOfServices: 4,
      lastSvcDate: '2025-11-02',
      contractCode: 'MJC0386',
      cardId: 'CARD002',
      billingName: 'Red Lantern Catering Culture Pte Ltd',
      address: '21 Cheong Chin Nam Road, Singapore',
      amount: '220.00',
      tax: '20.00',
      taxAmount: '20.00',
      total: '240.00',
      accountItemCode: 'AIC002',
      poNo: 'PO002',
      issued: false,
      myob: 'Pending'
    }
  ])

  // UI state
  const [loading, setLoading] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const exportOpen = Boolean(anchorEl)

  // Filters
  const [dateFilterEnabled, setDateFilterEnabled] = useState(false)
  const [filterDate, setFilterDate] = useState(new Date())
  const [originFilter, setOriginFilter] = useState('')
  const [contractTypeFilter, setContractTypeFilter] = useState('')
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('')
  const [serviceFreqFilter, setServiceFreqFilter] = useState('')
  const [billingFreqFilter, setBillingFreqFilter] = useState('')
  const [contractLevelFilter, setContractLevelFilter] = useState('')
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState('')
  const [salesPersonFilter, setSalesPersonFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [contractFilter, setContractFilter] = useState('')
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date())
  const [dateFilter, setDateFilter] = useState(true)
  const [dateRange, setDateRange] = useState([null, null])
  const [searchText, setSearchText] = useState('')

  // pagination
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  // Header options (dummy lists - replace with API/populated values)
  const originOptions = ['Genplus Innovations', 'Pest Masters']
  const contractTypeOptions = ['Annual Contract', 'Limited Contract']
  const invoiceStatusOptions = ['Pending', 'Issued', 'Paid']
  const serviceFreqOptions = ['Monthly', 'Quarterly', 'Yearly']
  const billingFreqOptions = ['Monthly', 'Quarterly', 'Yearly']
  const contractLevelOptions = ['Level 1', 'Level 2']
  const invoiceTypeOptions = ['Standard', 'Credit', 'Debit']
  const salesPersonOptions = ['Admin', 'Tech', 'Sales A']
  const customerOptions = ['GP Industries Pvt Ltd', 'Acme Corp', 'Extra Space']
  const contractOptions = ['MJC0385', 'MJC0386']

  // Table columns (kept same as you requested)
  const columns = useMemo(
    () => [
      // 1️⃣ S.NO — FIRST COLUMN
      columnHelper.display({
        id: 'sno',
        header: 'S.No',
        enableSorting: false,
        cell: ({ row }) => row.index + 1
      }),

      // 2️⃣ ACTIONS — SECOND COLUMN
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => (
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
            <IconButton size='small'>
              <i className='tabler-eye text-gray-600 text-lg' />
            </IconButton>
            <IconButton size='small'>
              <i className='tabler-printer text-purple-600 text-lg' />
            </IconButton>
          </div>
        )
      }),

      columnHelper.accessor('invDate', {
        header: 'INV.Date',
        cell: info => format(new Date(info.getValue()), 'dd/MM/yyyy')
      }),
      columnHelper.accessor('invNo', { header: 'INV.No' }),
      columnHelper.accessor('invFrequency', { header: 'INV.Frequency' }),
      columnHelper.accessor('svcFrequency', { header: 'SVC Frequency' }),
      columnHelper.accessor('noOfServices', { header: 'No.Of Value Services' }),
      columnHelper.accessor('lastSvcDate', {
        header: 'Last SVC Date',
        cell: info => format(new Date(info.getValue()), 'dd/MM/yyyy')
      }),
      columnHelper.accessor('contractCode', { header: 'Contract Code' }),
      columnHelper.accessor('cardId', { header: 'Card ID' }),
      columnHelper.accessor('billingName', { header: 'Billing Name' }),
      columnHelper.accessor('address', { header: 'Service Address' }),
      columnHelper.accessor('amount', { header: 'Amount', cell: info => `₹ ${info.getValue()}` }),
      columnHelper.accessor('tax', { header: 'Tax', cell: info => `₹ ${info.getValue()}` }),
      columnHelper.accessor('taxAmount', { header: 'Tax Amount', cell: info => `₹ ${info.getValue()}` }),
      columnHelper.accessor('total', { header: 'Total Amount', cell: info => <strong>₹ {info.getValue()}</strong> }),
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
    []
  )

  // Table instance
  const table = useReactTable({
    data,
    columns,
    state: {},
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  // Derived & filtered rows (apply filters & search)
  const filteredRows = useMemo(() => {
    return data.filter(r => {
      // search
      const combined = `${r.invNo} ${r.contractCode} ${r.billingName} ${r.address} ${r.invFrequency}`.toLowerCase()
      if (searchText && !combined.includes(searchText.toLowerCase())) return false

      // date filter (single date)
      if (dateFilterEnabled) {
        const rowDate = new Date(r.invDate).toDateString()
        if (rowDate !== filterDate.toDateString()) return false
      }
      // other filters
      if (originFilter && !r.origin?.includes(originFilter)) return false
      if (contractTypeFilter && !r.contractCode?.includes(contractTypeFilter)) return false
      if (invoiceStatusFilter && !(r.issued ? 'Issued' : 'Pending')) {
        // kept as example — if your data has invoice status separate use that
      }
      if (serviceFreqFilter && r.svcFrequency !== serviceFreqFilter) return false
      if (billingFreqFilter && r.invFrequency !== billingFreqFilter) return false
      if (contractLevelFilter && false) return false // placeholder
      if (invoiceTypeFilter && false) return false // placeholder
      if (salesPersonFilter && false) return false // placeholder
      if (customerFilter && !r.billingName?.includes(customerFilter)) return false
      if (contractFilter && r.contractCode !== contractFilter) return false

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

  // paging slice from filteredRows
  const pageIndex = pagination.pageIndex
  const pageSize = pagination.pageSize
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const paginated = filteredRows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)

  // handlers
  const handleExportClick = e => setAnchorEl(e.currentTarget)
  const handleExportClose = () => setAnchorEl(null)

  // refresh: emulate re-fetch
  const handleRefresh = async () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 500) // simulate
  }

  // effect: ensure pageIndex within bounds when filteredRows change
  useEffect(() => {
    if (pageIndex > pageCount - 1) {
      setPagination(p => ({ ...p, pageIndex: Math.max(0, pageCount - 1) }))
    }
  }, [filteredRows.length, pageCount])

  return (
    <Box>
      {/* ✅ BREADCRUMB */}
      <Box role='presentation' sx={{ mb: 2 }}>
        <Breadcrumbs aria-label='breadcrumb'>
          <Link underline='hover' color='inherit' href='/'>
            Home
          </Link>
          <Typography color='text.primary'>Invoice List</Typography>
        </Breadcrumbs>
      </Box>

      {/* ============================================= */}
      {/*                 MAIN CARD                     */}
      {/* ============================================= */}
      <Card sx={{ p: 3 }}>
        {/* ============================================= */}
        {/*                 HEADER BAR                    */}
        {/* ============================================= */}
        <CardHeader
          title={
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
              {/* LEFT: Page Title + Refresh */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
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
          action={null}
        />

        <Divider sx={{ mb: 2 }} />

        {/* ============================================= */}
        {/*                   FILTERS                     */}
        {/* ============================================= */}
        <Box px={3} pb={2}>
          {/* 4 Columns per row */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
              gap: 2,
              alignItems: 'end',
              mb: 2
            }}
          >
            {/* Date Filter + Range */}
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <FormControlLabel
                control={<Checkbox checked={dateFilter} onChange={e => setDateFilter(e.target.checked)} />}
                label='Date Filter'
              />

              <Box sx={{ width: 380 }}>
                <GlobalDateRange
                  label=''
                  start={dateRange[0]}
                  end={dateRange[1]}
                  onSelectRange={({ start, end }) => setDateRange([start, end])}
                  disabled={!dateFilter}
                />
              </Box>
            </Box>

            {/* Origin */}
            <CustomAutocomplete
              options={originOptions}
              value={originFilter || null}
              onChange={(e, v) => setOriginFilter(v || '')}
              renderInput={params => <CustomTextField {...params} label='Origin' size='small' />}
            />

            {/* Contract Type */}
            <CustomAutocomplete
              options={contractTypeOptions}
              value={contractTypeFilter || null}
              onChange={(e, v) => setContractTypeFilter(v || '')}
              renderInput={params => <CustomTextField {...params} label='Contract Type' size='small' />}
            />

            {/* Invoice Status */}
            <CustomAutocomplete
              options={invoiceStatusOptions}
              value={invoiceStatusFilter || null}
              onChange={(e, v) => setInvoiceStatusFilter(v || '')}
              renderInput={params => <CustomTextField {...params} label='Invoice Status' size='small' />}
            />

            {/* Service Frequency */}
            <CustomAutocomplete
              options={serviceFreqOptions}
              value={serviceFreqFilter || null}
              onChange={(e, v) => setServiceFreqFilter(v || '')}
              renderInput={params => <CustomTextField {...params} label='Service Frequency' size='small' />}
            />

            {/* Billing Frequency */}
            <CustomAutocomplete
              options={billingFreqOptions}
              value={billingFreqFilter || null}
              onChange={(e, v) => setBillingFreqFilter(v || '')}
              renderInput={params => <CustomTextField {...params} label='Billing Frequency' size='small' />}
            />

            {/* Contract Level */}
            <CustomAutocomplete
              options={contractLevelOptions}
              value={contractLevelFilter || null}
              onChange={(e, v) => setContractLevelFilter(v || '')}
              renderInput={params => <CustomTextField {...params} label='Contract Level' size='small' />}
            />

            {/* Invoice Type */}
            <CustomAutocomplete
              options={invoiceTypeOptions}
              value={invoiceTypeFilter || null}
              onChange={(e, v) => setInvoiceTypeFilter(v || '')}
              renderInput={params => <CustomTextField {...params} label='Invoice Type' size='small' />}
            />

            {/* Sales Person */}
            <CustomAutocomplete
              options={salesPersonOptions}
              value={salesPersonFilter || null}
              onChange={(e, v) => setSalesPersonFilter(v || '')}
              renderInput={params => <CustomTextField {...params} label='Sales Person' size='small' />}
            />

            {/* Customer */}
            <CustomAutocomplete
              options={customerOptions}
              value={customerFilter || null}
              onChange={(e, v) => setCustomerFilter(v || '')}
              renderInput={params => <CustomTextField {...params} label='Customer' size='small' />}
            />

            {/* Contract */}
            <CustomAutocomplete
              options={contractOptions}
              value={contractFilter || null}
              onChange={(e, v) => setContractFilter(v || '')}
              renderInput={params => <CustomTextField {...params} label='Contract' size='small' />}
            />
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* ============================================= */}
          {/*                 SEARCH BAR                   */}
          {/* ============================================= */}
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2} gap={2}>
            {/* LEFT: Entries Dropdown */}
            <Select
              size='small'
              value={pageSize}
              onChange={e => setPagination(p => ({ ...p, pageSize: Number(e.target.value), pageIndex: 0 }))}
              sx={{ width: 130 }}
            >
              {[5, 10, 25, 50].map(s => (
                <MenuItem key={s} value={s}>
                  {s} entries
                </MenuItem>
              ))}
            </Select>

            {/* RIGHT: Search */}
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

          {/* ============================================= */}
          {/*                   TABLE                        */}
          {/* ============================================= */}
          <div className='overflow-x-auto'>
            <table className={tableStyles.table}>
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</th>
                    ))}
                  </tr>
                ))}
              </thead>

              <tbody>
                {paginated.length ? (
                  paginated.map(rowData => {
                    const row = table.getRowModel().rows.find(r => r.original.id === rowData.id)

                    if (!row) return null

                    return (
                      <tr key={row.id}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={columns.length} className='text-center py-6'>
                      No results found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ============================================= */}
          {/*                PAGINATION FOOTER               */}
          {/* ============================================= */}
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
              {`Showing ${filteredRows.length === 0 ? 0 : pageIndex * pageSize + 1} to ${Math.min(
                (pageIndex + 1) * pageSize,
                filteredRows.length
              )} of ${filteredRows.length} entries`}
            </Typography>

            <Pagination
              shape='rounded'
              color='primary'
              variant='tonal'
              count={Math.max(1, pageCount)}
              page={pageIndex + 1}
              onChange={(_, page) => setPagination(p => ({ ...p, pageIndex: page - 1 }))}
              showFirstButton
              showLastButton
            />
          </Box>
        </Box>
      </Card>
    </Box>
  )
}
