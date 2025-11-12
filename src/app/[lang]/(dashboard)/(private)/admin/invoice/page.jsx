'use client'

import { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardHeader,
  Typography,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Divider,
  Chip,
  InputAdornment,
  Paper // ✅ Added this line
} from '@mui/material'

import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import { DateRangePicker } from 'react-date-range'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import CustomTextField from '@core/components/mui/TextField'
import { format } from 'date-fns'
import classnames from 'classnames'
import ChevronRight from '@menu/svg/ChevronRight'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table'
import styles from '@core/styles/table.module.css'

export default function InvoicePage() {
const [dateRange, setDateRange] = useState({
  start: new Date(2025, 10, 1),
  end: new Date(2025, 10, 30)
})




  const [filters, setFilters] = useState({
    origin: "MAJOR'S PEST MANAGEMENT SERVICES PTE LTD",
    contractType: '',
    invoiceStatus: '',
    serviceFrequency: '',
    billingFrequency: '',
    contractLevel: '',
    invoiceType: '',
    salesPerson: '',
    customer: '',
    contract: ''
  })
const [rows, setRows] = useState([
  {
    id: 1,
    invDate: '01-11-2025',
    invNo: 'INV001',
    invFrequency: 'Monthly',
    svcFrequency: 'Quarterly',
    noOfServices: 2,
    lastSvcDate: '28-10-2025',
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
    invDate: '05-11-2025',
    invNo: 'INV002',
    invFrequency: 'Quarterly',
    svcFrequency: 'Monthly',
    noOfServices: 4,
    lastSvcDate: '02-11-2025',
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

  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [searchText, setSearchText] = useState('')

  // Table setup
  const columnHelper = createColumnHelper()
// ✅ Updated Columns — All Required Fields Added
const columns = [
  columnHelper.accessor('invDate', { header: 'INV.Date' }),
  columnHelper.accessor('invNo', { header: 'INV.No' }),
  columnHelper.accessor('invFrequency', { header: 'INV.Frequency' }),
  columnHelper.accessor('svcFrequency', { header: 'SVC Frequency' }),
  columnHelper.accessor('noOfServices', { header: 'No.Of Value Services' }),
  columnHelper.accessor('lastSvcDate', { header: 'Last SVC Date' }),
  columnHelper.accessor('contractCode', { header: 'Contract Code' }),
  columnHelper.accessor('cardId', { header: 'Card ID' }),
  columnHelper.accessor('billingName', { header: 'Billing Name' }),
  columnHelper.accessor('address', { header: 'Service Address' }),
  columnHelper.accessor('amount', {
    header: 'Amount',
    cell: info => `₹ ${info.getValue()}`
  }),
  columnHelper.accessor('tax', {
    header: 'Tax',
    cell: info => `₹ ${info.getValue()}`
  }),
  columnHelper.accessor('taxAmount', {
    header: 'Tax Amount',
    cell: info => `₹ ${info.getValue()}`
  }),
  columnHelper.accessor('total', {
    header: 'Total Amount',
    cell: info => `₹ ${info.getValue()}`
  }),
  columnHelper.accessor('accountItemCode', { header: 'Account Item Code' }),
  columnHelper.accessor('poNo', { header: 'PO.No' }),
  columnHelper.accessor('issued', {
    header: 'Issued?',
    cell: info => (
      <Chip
        label={info.getValue() ? 'Yes' : 'No'}
        size='small'
        sx={{
          color: '#fff',
          bgcolor: info.getValue() ? 'success.main' : 'warning.main',
          fontWeight: 600,
          borderRadius: '6px',
          px: 1.5
        }}
      />
    )
  }),
  columnHelper.accessor('myob', { header: 'MYOB' })
]

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  return (
    <Box>
      <Card sx={{ p: 3 }}>
        <CardHeader
          sx={{
            pb: 1.5,
            pt: 1.5,
            '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '1.125rem' }
          }}
          title={
            <Box display='flex' alignItems='center' gap={2}>
              <Typography variant='h5' sx={{ fontWeight: 600 }}>
                🧾 Invoice Summary
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
                onClick={() => setLoading(true)}
                sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </Box>
          }
        />

        {/* 🔹 Filters Section (Perfect Visual Alignment) */}
<Box sx={{ mt: 3, mb: 3 }}>
  <Grid container spacing={2} alignItems="center">
    {/* Date Filter */}
{/* 🔹 Date Filter Section */}
<Grid item xs={12} sm={6} md={3}>
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
    <FormControlLabel
      control={
        <Checkbox
          checked
          onChange={() => {}}
          size='small'
          sx={{ mt: -0.5 }}
        />
      }
      label={
        <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>
          Date Filter
        </Typography>
      }
      sx={{ m: 0 }}
    />

    {/* From Date */}
    <AppReactDatepicker
      selected={dateRange.start}
      onChange={date => setDateRange(prev => ({ ...prev, start: date }))}
      id='start-date'
      placeholderText='Start Date'
      customInput={
        <CustomTextField
          label='Start Date'
          fullWidth
          size='small'
          sx={{ height: 40 }}
        />
      }
    />

   
  </Box>
</Grid>

    {/* Origin */}
    <Grid item xs={12} sm={6} md={3}>
      <TextField
        label="Origin"
        value={filters.origin}
        onChange={(e) => setFilters({ ...filters, origin: e.target.value })}
        fullWidth
        size="small"
        InputProps={{ sx: { height: 40, fontSize: '0.875rem' } }}
      />
    </Grid>

    {/* Contract Type */}
    <Grid item xs={12} sm={6} md={3}>
      <FormControl fullWidth size="small">
        <InputLabel>Contract Type</InputLabel>
        <Select
          value={filters.contractType}
          onChange={(e) => setFilters({ ...filters, contractType: e.target.value })}
          sx={{ height: 40, fontSize: '0.875rem' }}
        >
          <MenuItem value="">Select</MenuItem>
          <MenuItem value="AMC">AMC</MenuItem>
          <MenuItem value="One-time">One-time</MenuItem>
        </Select>
      </FormControl>
    </Grid>

    {/* Invoice Status */}
    <Grid item xs={12} sm={6} md={3}>
      <FormControl fullWidth size="small">
        <InputLabel>Invoice Status</InputLabel>
        <Select
          value={filters.invoiceStatus}
          onChange={(e) => setFilters({ ...filters, invoiceStatus: e.target.value })}
          sx={{ height: 40, fontSize: '0.875rem' }}
        >
          <MenuItem value="">Select</MenuItem>
          <MenuItem value="Issued">Issued</MenuItem>
          <MenuItem value="Pending">Pending</MenuItem>
        </Select>
      </FormControl>
    </Grid>

    {/* Billing Frequency */}
    <Grid item xs={12} sm={6} md={3}>
      <FormControl fullWidth size="small">
        <InputLabel>Billing Frequency</InputLabel>
        <Select
          value={filters.billingFrequency}
          onChange={(e) => setFilters({ ...filters, billingFrequency: e.target.value })}
          sx={{ height: 40, fontSize: '0.875rem' }}
        >
          <MenuItem value="">Select</MenuItem>
          <MenuItem value="Monthly">Monthly</MenuItem>
          <MenuItem value="Quarterly">Quarterly</MenuItem>
        </Select>
      </FormControl>
    </Grid>

    {/* Customer */}
    <Grid item xs={12} sm={6} md={3}>
      <FormControl fullWidth size="small">
        <InputLabel>Customer</InputLabel>
        <Select
          value={filters.customer}
          onChange={(e) => setFilters({ ...filters, customer: e.target.value })}
          sx={{ height: 40, fontSize: '0.875rem' }}
        >
          <MenuItem value="">Select</MenuItem>
          <MenuItem value="Extra Space Tai Seng Pte Ltd">
            Extra Space Tai Seng Pte Ltd
          </MenuItem>
          <MenuItem value="Red Lantern Catering Culture Pte Ltd">
            Red Lantern Catering Culture Pte Ltd
          </MenuItem>
        </Select>
      </FormControl>
    </Grid>

    {/* Search */}
    <Grid item xs={12} sm={6} md={3}>
      <TextField
        label="Search"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        fullWidth
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          sx: { height: 40, fontSize: '0.875rem' },
        }}
      />
    </Grid>
  </Grid>
</Box>

        {/* Table */}
        <div className='overflow-x-auto'>
          <table className={styles.table}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      <div
                        className={classnames({
                          'flex items-center': header.column.getIsSorted(),
                          'cursor-pointer select-none': header.column.getCanSort()
                        })}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() ? (
                          header.column.getIsSorted() === 'asc' ? (
                            <ChevronRight fontSize='1.25rem' className='-rotate-90' />
                          ) : (
                            <ChevronRight fontSize='1.25rem' className='rotate-90' />
                          )
                        ) : null}
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
                    No results found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </Box>
  )
}
