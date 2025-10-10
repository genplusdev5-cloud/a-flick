'use client'

import { useState, useMemo, useRef } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  InputAdornment,
  IconButton,
  Typography,
  TablePagination,
  Autocomplete
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'

// Icons
import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh'
import PrintIcon from '@mui/icons-material/Print'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import MoreVertIcon from '@mui/icons-material/MoreVert'

// Layout + Custom Input
import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

export default function ContractStatusPage() {
  const [searchText, setSearchText] = useState('')
  const [dateFilter, setDateFilter] = useState(new Date())

  const [originFilter, setOriginFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [contractTypeFilter, setContractTypeFilter] = useState('')
  const [invoiceFrequencyFilter, setInvoiceFrequencyFilter] = useState('')
  const [contractStatusFilter, setContractStatusFilter] = useState('')
  const [renewalFilter, setRenewalFilter] = useState('')

  // Open states for each autocomplete
  const [originOpen, setOriginOpen] = useState(false)
  const [customerOpen, setCustomerOpen] = useState(false)
  const [contractTypeOpen, setContractTypeOpen] = useState(false)
  const [invoiceFrequencyOpen, setInvoiceFrequencyOpen] = useState(false)
  const [contractStatusOpen, setContractStatusOpen] = useState(false)
  const [renewalOpen, setRenewalOpen] = useState(false)

  // Refs for each autocomplete input
  const originRef = useRef()
  const customerRef = useRef()
  const contractTypeRef = useRef()
  const invoiceFrequencyRef = useRef()
  const contractStatusRef = useRef()
  const renewalRef = useRef()
  const submitRef = useRef()

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10) // Default 10 rows per page

  // 🆕 ADDED: State for the date filter checkbox
  const [filterByDate, setFilterByDate] = useState(false)

  const [rows] = useState([
    {
      id: 1,
      customer: 'GP Industries Pvt Ltd',
      services: 'Pest Control',
      contractCode: 'GPC0001',
      type: 'Limited Contract',
      serviceAddress: '15, Sitra, Avinashi Road',
      postalCode: '641600',
      startDate: '2024-07-01',
      endDate: '2025-07-01',
      pest: 'Bedbug Mgmt',
      contractValue: '₹50,000',
      prodValue: '₹10,000',
      contactPerson: 'John Doe',
      contactPhone: '+91 98765 43210',
      renewalPending: 'No',
      renewalOn: '—',
      holdedOn: '—',
      terminatedOn: '—',
      expiredOn: '—',
      status: 'Current',
      origin: 'Genplus Innovations',
      reportEmail: 'report@gp.com',
      picEmail: 'pic@gp.com',
      billingEmail: 'billing@gp.com'
    }
  ])

  // Apply search filter
  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      // 1. Text search filter
      const matchesSearch =
        row.customer.toLowerCase().includes(searchText.toLowerCase()) ||
        row.contractCode.toLowerCase().includes(searchText.toLowerCase())

      // 2. Date filter only if checkbox is checked
      const matchesDate = filterByDate ? new Date(row.startDate).toDateString() === dateFilter.toDateString() : true

      // 3. Autocomplete filters (Basic implementation - check if filter is set AND value matches)
      const matchesOrigin = !originFilter || row.origin === originFilter
      const matchesCustomer = !customerFilter || row.customer === customerFilter
      const matchesContractType = !contractTypeFilter || row.type === contractTypeFilter
      // Note: Other filters (invoiceFrequency, contractStatus, renewal) are not implemented here
      // as the 'rows' data structure doesn't contain them, but the pattern is the same:
      // const matchesStatus = !contractStatusFilter || row.status === contractStatusFilter;

      // Combine all filters
      return matchesSearch && matchesDate && matchesOrigin && matchesCustomer && matchesContractType
    })
  }, [rows, searchText, dateFilter, filterByDate, originFilter, customerFilter, contractTypeFilter]) // Added all filter dependencies

  // Paginate rows
  const paginatedRows = useMemo(() => {
    return filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  }, [filteredRows, page, rowsPerPage])

  // Pagination text
  const totalRows = filteredRows.length
  const startIndex = totalRows === 0 ? 0 : page * rowsPerPage + 1
  const endIndex = Math.min((page + 1) * rowsPerPage, totalRows)
  const paginationText = `Showing ${startIndex} to ${endIndex} of ${totalRows} entries`

  // Pagination handlers
  const handleChangePage = (event, newPage) => setPage(newPage)
  const handleChangeRowsPerPage = event => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const columns = [
    { field: 'id', headerName: 'ID #', width: 80, minWidth: 80 },
    { field: 'customer', headerName: 'Customer', width: 200, minWidth: 150 },
    { field: 'services', headerName: 'Services', width: 160, minWidth: 160 },
    { field: 'contractCode', headerName: 'Contract Code', width: 160, minWidth: 120 },
    { field: 'type', headerName: 'Type', width: 160, minWidth: 100 },
    { field: 'serviceAddress', headerName: 'Service Address', width: 200, minWidth: 200 },
    { field: 'postalCode', headerName: 'Postal Code', width: 140, minWidth: 100 },
    { field: 'startDate', headerName: 'Start Date', width: 140, minWidth: 120 },
    { field: 'endDate', headerName: 'End Date', width: 140, minWidth: 120 },
    { field: 'pest', headerName: 'Pest', width: 160, minWidth: 120 },
    { field: 'contractValue', headerName: 'Contract Value', width: 160, minWidth: 120 },
    { field: 'prodValue', headerName: 'Prod Value', width: 140, minWidth: 100 },
    { field: 'contactPerson', headerName: 'Contact Person Name', width: 200, minWidth: 150 },
    { field: 'contactPhone', headerName: 'Contact Phone', width: 180, minWidth: 150 },
    { field: 'renewalPending', headerName: 'Renewal Pending', width: 180, minWidth: 120 },
    { field: 'renewalOn', headerName: 'Renewal On', width: 140, minWidth: 100 },
    { field: 'holdedOn', headerName: 'Holded On', width: 140, minWidth: 100 },
    { field: 'terminatedOn', headerName: 'Terminated On', width: 160, minWidth: 120 },
    { field: 'expiredOn', headerName: 'Expired On', width: 140, minWidth: 100 },
    { field: 'status', headerName: 'Status', width: 140, minWidth: 100 },
    { field: 'origin', headerName: 'Origin', width: 200, minWidth: 150 },
    { field: 'reportEmail', headerName: 'Report Email', width: 200, minWidth: 150 },
    { field: 'picEmail', headerName: 'PIC Email', width: 200, minWidth: 150 },
    { field: 'billingEmail', headerName: 'Billing Email', width: 200, minWidth: 150 },
    {
      field: 'actions',
      headerName: 'Action',
      width: 100,
      minWidth: 80,
      renderCell: () => (
        <IconButton size='small'>
          <MoreVertIcon />
        </IconButton>
      )
    }
  ]

  return (
    <ContentLayout
      title='View Contract Status'
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'View Contract Status' }]}
      actions={
        <Button variant='contained' href='/admin/contracts/add' sx={{ m: 2 }}>
          Add Contract
        </Button>
      }
    >
      {/* Filters Section */}
      <Card sx={{ mb: 4, boxShadow: 'none' }} elevation={0}>
        <CardContent>
          <Grid container spacing={3}>
            {/* 🛠️ MODIFIED: Date Picker with Checkbox (as per image) */}
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {/* Checkbox and Label */}
                <Box display='flex' alignItems='center' gap={0.5} sx={{ pl: 0.5 }}>
                  <input
                    type='checkbox'
                    checked={filterByDate}
                    onChange={e => setFilterByDate(e.target.checked)}
                    id='dateFilterCheck'
                    // Inline styling to improve appearance/functionality
                    style={{
                      width: '18px',
                      height: '18px',
                      appearance: 'none',
                      border: `1px solid ${filterByDate ? '#7D70F7' : '#999'}`,
                      borderRadius: '1px',
                      cursor: 'pointer',
                      outline: 'none',
                      position: 'relative',
                      backgroundColor: filterByDate ? '#7D70F7' : 'white',
                      transition: 'background-color 0.2s, border-color 0.2s'
                    }}
                  />
                  {/* Checkmark styling for the custom checkbox */}
                  {filterByDate && (
                    <Box
                      component='span'
                      sx={{
                        position: 'absolute',
                        width: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none'
                      }}
                    >
                      <Typography
                        component='span'
                        sx={{
                          color: 'white',
                          fontSize: '12px',
                          position: 'relative',
                          top: '-1px'
                        }}
                      >
                        &#10003; {/* Unicode checkmark */}
                      </Typography>
                    </Box>
                  )}

                  <label
                    htmlFor='dateFilterCheck'
                    style={{ cursor: 'pointer', fontWeight: 500, color: filterByDate ? '#7D70F7' : '#666' }}
                  >
                    Date Filter
                  </label>
                </Box>

                {/* Datepicker Input (Disabled when checkbox is unchecked) */}
                <AppReactDatepicker
                  selected={dateFilter}
                  onChange={date => setDateFilter(date)}
                  placeholderText='Select Start Date'
                  dateFormat='dd/MM/yyyy'
                  customInput={
                    <CustomTextField
                      fullWidth
                      inputProps={{
                        disabled: !filterByDate, // Disable input if unchecked
                        sx: { backgroundColor: !filterByDate ? '#f3f4f6' : 'white' }
                      }}
                    />
                  }
                />
              </Box>
            </Grid>
            {/* 🔚 END OF MODIFIED: Date Picker with Checkbox */}

            {/* Origin */}
            <Grid item xs={12} md={4}>
              <Autocomplete
                freeSolo={false}
                options={['Genplus Innovations']}
                value={originFilter}
                open={originOpen}
                onOpen={() => setOriginOpen(true)}
                onClose={() => setOriginOpen(false)}
                onFocus={() => setOriginOpen(true)}
                onChange={(e, newValue) => {
                  setOriginFilter(newValue)
                  customerRef.current?.focus()
                  setCustomerOpen(true)
                }}
                renderInput={params => <CustomTextField {...params} label='Origin' inputRef={originRef} fullWidth />}
              />
            </Grid>

            {/* Customer */}
            <Grid item xs={12} md={4}>
              <Autocomplete
                freeSolo={false}
                options={['GP Industries Pvt Ltd']}
                value={customerFilter}
                open={customerOpen}
                onOpen={() => setCustomerOpen(true)}
                onClose={() => setCustomerOpen(false)}
                onFocus={() => setCustomerOpen(true)}
                onChange={(e, newValue) => {
                  setCustomerFilter(newValue)
                  contractTypeRef.current?.focus()
                  setContractTypeOpen(true)
                }}
                renderInput={params => (
                  <CustomTextField {...params} label='Customer' inputRef={customerRef} fullWidth />
                )}
              />
            </Grid>

            {/* Contract Type */}
            <Grid item xs={12} md={4}>
              <Autocomplete
                freeSolo={false}
                options={['Limited Contract']}
                value={contractTypeFilter}
                open={contractTypeOpen}
                onOpen={() => setContractTypeOpen(true)}
                onClose={() => setContractTypeOpen(false)}
                onFocus={() => setContractTypeOpen(true)}
                onChange={(e, newValue) => {
                  setContractTypeFilter(newValue)
                  invoiceFrequencyRef.current?.focus()
                  setInvoiceFrequencyOpen(true)
                }}
                renderInput={params => (
                  <CustomTextField {...params} label='Contract Type' inputRef={contractTypeRef} fullWidth />
                )}
              />
            </Grid>

            {/* Invoice Frequency */}
            <Grid item xs={12} md={4}>
              <Autocomplete
                freeSolo={false}
                options={['Monthly', 'Yearly']}
                value={invoiceFrequencyFilter}
                open={invoiceFrequencyOpen}
                onOpen={() => setInvoiceFrequencyOpen(true)}
                onClose={() => setInvoiceFrequencyOpen(false)}
                onFocus={() => setInvoiceFrequencyOpen(true)}
                onChange={(e, newValue) => {
                  setInvoiceFrequencyFilter(newValue)
                  contractStatusRef.current?.focus()
                  setContractStatusOpen(true)
                }}
                renderInput={params => (
                  <CustomTextField {...params} label='Invoice Frequency' inputRef={invoiceFrequencyRef} fullWidth />
                )}
              />
            </Grid>

            {/* Contract Status */}
            <Grid item xs={12} md={4}>
              <Autocomplete
                freeSolo={false}
                options={['Current', 'Expired']}
                value={contractStatusFilter}
                open={contractStatusOpen}
                onOpen={() => setContractStatusOpen(true)}
                onClose={() => setContractStatusOpen(false)}
                onFocus={() => setContractStatusOpen(true)}
                onChange={(e, newValue) => {
                  setContractStatusFilter(newValue)
                  renewalRef.current?.focus()
                  setRenewalOpen(true)
                }}
                renderInput={params => (
                  <CustomTextField {...params} label='Contract Status' inputRef={contractStatusRef} fullWidth />
                )}
              />
            </Grid>

            {/* New / Renewed */}
            <Grid item xs={12} md={4}>
              <Autocomplete
                freeSolo={false}
                options={['New', 'Renewed']}
                value={renewalFilter}
                open={renewalOpen}
                onOpen={() => setRenewalOpen(true)}
                onClose={() => setRenewalOpen(false)}
                onFocus={() => setRenewalOpen(true)}
                onChange={(e, newValue) => {
                  setRenewalFilter(newValue)
                  submitRef.current?.focus()
                }}
                renderInput={params => (
                  <CustomTextField {...params} label='New / Renewed' inputRef={renewalRef} fullWidth />
                )}
              />
            </Grid>
          </Grid>

          {/* Buttons */}
          <Grid item xs={12} md={8} display='flex' gap={2} sx={{ mt: 3 }}>
            <Button
              size='small'
              variant='contained'
              sx={{ backgroundColor: '#7D70F7', '&:hover': { backgroundColor: '#5D4CEF' }, paddingY: '10px' }}
            >
              Refresh
            </Button>
            <Button
              size='small'
              variant='contained'
              sx={{ backgroundColor: '#7D70F7', '&:hover': { backgroundColor: '#5D4CEF' }, paddingY: '10px' }}
            >
              Print Agreement
            </Button>
            <Button
              size='small'
              variant='contained'
              sx={{ backgroundColor: '#7D70F7', '&:hover': { backgroundColor: '#5D4CEF' }, paddingY: '10px' }}
            >
              Auto Review
            </Button>
          </Grid>
        </CardContent>
      </Card>

      {/* Table Section */}
      <Card sx={{ mb: 4, boxShadow: 'none' }} elevation={0}>
        <CardContent>
          {/* Top Controls */}
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={15}>
            <Box display='flex' gap={1}>
              {['Copy', 'CSV', 'Excel', 'PDF', 'Print'].map(label => (
                <Button
                  key={label}
                  variant='contained'
                  size='small'
                  sx={{
                    borderRadius: '0px',
                    backgroundColor: '#6c7783',
                    color: '#ffffff',
                    textTransform: 'none',
                    '&:hover': { backgroundColor: '#5a626a' },
                    paddingY: '10px',
                    lineHeight: 1
                  }}
                >
                  {label}
                </Button>
              ))}
            </Box>
            <CustomTextField
              size='small'
              placeholder='Search'
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              sx={{ width: 280 }}
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

          {/* DataGrid */}
          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <DataGrid
              rows={paginatedRows}
              columns={columns}
              disableRowSelectionOnClick
              autoHeight
              hideFooter
              getRowHeight={() => 'auto'}
              getRowId={row => row.id}
              sx={{
                mt: 3,
                '& .MuiDataGrid-row': {
                  minHeight: '60px !important',
                  padding: '12px 0'
                },
                '& .MuiDataGrid-cell': {
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  alignItems: 'flex-start',
                  fontSize: '15px'
                },
                '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
                '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': { outline: 'none' },
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontSize: '15px',
                  fontWeight: 500
                }
              }}
            />
          </Box>

          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
            <Typography variant='body2' color='text.secondary'>
              {paginationText}
            </Typography>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component='div'
              count={filteredRows.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Box>
        </CardContent>
      </Card>
    </ContentLayout>
  )
}
