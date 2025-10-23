// page B (Refactored Table Section with Export Button)

'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  InputAdornment,
  IconButton,
  Typography,
  Autocomplete,
  FormControl,
  Select,
  MenuItem,
  Pagination,
  Divider,
  Menu, // 🆕 Added for export menu
  ListItemText // 🆕 Added for export menu
} from '@mui/material'

// Icons
import SearchIcon from '@mui/icons-material/Search'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import Link from 'next/link'
import AddIcon from '@mui/icons-material/Add'
import DownloadIcon from '@mui/icons-material/Download' // 🆕 Added for export button
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown' // 🆕 Added for export button dropdown

// Wrapper
import CustomTextField from '@core/components/mui/TextField'

// Layout + Custom Input (Assuming these imports are correct for Page B's context)
import ContentLayout from '@/components/layout/ContentLayout'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'


// New: Utility function for robust comparison (from Page A's core logic)
const compareValues = (aValue, bValue, isNumeric) => {
  if (isNumeric) {
    // Treat null/undefined/empty string as 0 for sorting numbers
    const numA = Number(String(aValue || '0').replace(/[^0-9.-]+/g, "")) // Remove currency symbols for comparison
    const numB = Number(String(bValue || '0').replace(/[^0-9.-]+/g, "")) // Remove currency symbols for comparison
    return numA - numB
  }
  // Case-insensitive string comparison
  return String(aValue || '').localeCompare(String(bValue || ''), undefined, { sensitivity: 'base' })
}

// New: Array of column fields for easy mapping and sorting
const COLUMN_FIELDS = [
  { id: 'id', header: 'S.No', width: '60px', isNumeric: true, displayIndex: true },

  { id: 'customer', header: 'Customer', width: '150px' },
  { id: 'services', header: 'Services', width: '160px' },
  { id: 'contractCode', header: 'Contract Code', width: '120px' },
  { id: 'type', header: 'Type', width: '120px' },
  { id: 'serviceAddress', header: 'Service Address', width: '200px' },
  { id: 'postalCode', header: 'Postal Code', width: '100px' },
  { id: 'startDate', header: 'Start Date', width: '120px' },
  { id: 'endDate', header: 'End Date', width: '120px' },
  { id: 'pest', header: 'Pest', width: '120px' },
  { id: 'contractValue', header: 'Contract Value', width: '120px', isNumeric: true },
  { id: 'prodValue', header: 'Prod Value', width: '100px', isNumeric: true },
  { id: 'contactPerson', header: 'Contact Person Name', width: '150px' },
  { id: 'contactPhone', header: 'Contact Phone', width: '150px' },
  { id: 'renewalPending', header: 'Renewal Pending', width: '120px' },
  { id: 'renewalOn', header: 'Renewal On', width: '100px' },
  { id: 'holdedOn', header: 'Holded On', width: '100px' },
  { id: 'terminatedOn', header: 'Terminated On', width: '120px' },
  { id: 'expiredOn', header: 'Expired On', width: '100px' },
  { id: 'status', header: 'Status', width: '100px' },
  { id: 'origin', header: 'Origin', width: '150px' },
  { id: 'reportEmail', header: 'Report Email', width: '150px' },
  { id: 'picEmail', header: 'PIC Email', width: '150px' },
  { id: 'billingEmail', header: 'Billing Email', width: '150px' },
]

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

  // Pagination states (from Page A)
  const [page, setPage] = useState(1) // 1-based indexing
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // State for the date filter checkbox
  const [filterByDate, setFilterByDate] = useState(false)

  // State for Sorting (from Page A)
  const [sortField, setSortField] = useState('id')
  const [sortDirection, setSortDirection] = useState('asc')

  // 🆕 State for Export Menu (from Page A)
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const exportOpen = Boolean(exportAnchorEl)

  // 🆕 Handlers for Export Menu (from Page A)
  const handleExportClick = event => setExportAnchorEl(event.currentTarget)
  const handleExportClose = () => setExportAnchorEl(null)


  // Dummy rows
  const [rows] = useState([


  ])

  // Apply filter logic (Unchanged)
  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      // 1. Text search filter
      const matchesSearch =
        row.customer.toLowerCase().includes(searchText.toLowerCase()) ||
        row.contractCode.toLowerCase().includes(searchText.toLowerCase()) ||
        row.serviceAddress.toLowerCase().includes(searchText.toLowerCase()) ||
        row.contactPerson.toLowerCase().includes(searchText.toLowerCase()) ||
        row.contactPhone.toLowerCase().includes(searchText.toLowerCase())

      // 2. Date filter only if checkbox is checked
      const matchesDate = filterByDate ? new Date(row.startDate).toDateString() === dateFilter.toDateString() : true

      // 3. Autocomplete filters
      const matchesOrigin = !originFilter || row.origin === originFilter
      const matchesCustomer = !customerFilter || row.customer === customerFilter
      const matchesContractType = !contractTypeFilter || row.type === contractTypeFilter
      const matchesStatus = !contractStatusFilter || row.status === contractStatusFilter
      const matchesRenewal = !renewalFilter || row.renewalPending === (renewalFilter === 'Renewed' ? 'Yes' : 'No')
      const matchesInvoiceFreq = !invoiceFrequencyFilter

      return matchesSearch && matchesDate && matchesOrigin && matchesCustomer && matchesContractType && matchesStatus && matchesRenewal
    })
  }, [
    rows,
    searchText,
    dateFilter,
    filterByDate,
    originFilter,
    customerFilter,
    contractTypeFilter,
    contractStatusFilter,
    renewalFilter,
    invoiceFrequencyFilter
  ])


  // Sorting Logic (Unchanged)
  const handleSort = useCallback(
    field => {
      if (sortField === field) {
        setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortField(field)
        setSortDirection(field === 'id' ? 'desc' : 'asc')
      }
      setPage(1)
    },
    [sortField]
  )

  const sortedRows = useMemo(() => {
    if (!sortField) return filteredRows

    const sortConfig = COLUMN_FIELDS.find(c => c.id === sortField)
    if (!sortConfig) return filteredRows

    return [...filteredRows].sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      const isNumeric = sortConfig.isNumeric

      let comparison = compareValues(aValue, bValue, isNumeric)

      return sortDirection === 'asc' ? comparison : comparison * -1
    })
  }, [filteredRows, sortField, sortDirection])


  // Helper component to render the sort icon (Unchanged)
  const SortIcon = useCallback(
    ({ field }) => {
      if (sortField !== field) return null
      return sortDirection === 'asc' ? (
        <ArrowUpwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
      ) : (
        <ArrowDownwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
      )
    },
    [sortField, sortDirection]
  )

  // Pagination calculations (Unchanged)
  const rowCount = sortedRows.length
  const pageCount = Math.max(1, Math.ceil(rowCount / rowsPerPage))
  const paginatedRows = sortedRows.slice((page - 1) * rowsPerPage, page * rowsPerPage)
  const startIndex = rowCount === 0 ? 0 : (page - 1) * rowsPerPage + 1
  const endIndex = Math.min(page * rowsPerPage, rowCount)
  const paginationText = `Showing ${startIndex} to ${endIndex} of ${rowCount} entries`

  // Pagination handlers (Unchanged)
  const handleChangePage = (event, value) => setPage(value)
  const handleChangeRowsPerPage = event => {
    setRowsPerPage(Number(event.target.value))
    setPage(1)
  }

  // Helper to get status color (Unchanged)
  const getStatusColor = (status) => {
    switch (status) {
      case 'Current':
        return 'success.main'
      case 'Expired':
        return 'error.main'
      default:
        return 'warning.main'
    }
  }


  return (
    <ContentLayout
      title='View Contract Status'
      breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'View Contract Status' }]}
      actions={
        <Button variant='contained' href='/admin/contracts/add' startIcon={<AddIcon />} sx={{ m: 2 }}>
          Add Contract
        </Button>
      }
    >
      {/* Filters Section (Unchanged) */}
      <Card sx={{ mb: 4, boxShadow: 'none' }} elevation={0}>
        <CardContent>
          <Grid container spacing={3}>
            {/* Date Picker with Checkbox */}
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {/* Checkbox and Label */}
                <Box display='flex' alignItems='center' gap={0.5} sx={{ pl: 0.5 }}>
                  <input
                    type='checkbox'
                    checked={filterByDate}
                    onChange={e => setFilterByDate(e.target.checked)}
                    id='dateFilterCheck'
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
                        &#10003;
                      </Typography>
                    </Box>
                  )}

                  <label
                    htmlFor='dateFilterCheck'
                    style={{ cursor: 'pointer', fontWeight: 500, color: filterByDate ? 'black' : '#666' }}
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
                        disabled: !filterByDate,
                        sx: { backgroundColor: !filterByDate ? '#f3f4f6' : 'white' }
                      }}
                    />
                  }
                />
              </Box>
            </Grid>
            {/* Origin */}
            <Grid item xs={12} md={4}>
              <Autocomplete
                freeSolo={false}
                options={['Genplus Innovations', 'Pest Masters']}
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
                options={['GP Industries Pvt Ltd', 'Acme Corp', 'Zeta Solutions']}
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
                options={['Limited Contract', 'Annual Contract']}
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
              sx={{ paddingY: '10px' }}
            >
              Refresh
            </Button>
            <Button
              size='small'
              variant='contained'
              sx={{  paddingY: '10px' }}
            >
              Print Agreement
            </Button>
            <Button
              size='small'
              variant='contained'
              sx={{  paddingY: '10px' }}
            >
              Auto Review
            </Button>
          </Grid>
        </CardContent>
      </Card>

      {/* 🛠️ REFACTORED: Table Section */}
      <Card sx={{ p: 6 ,"boxShadow": "none"}}>
        <Typography variant='h6' sx={{ mb: 3 }}>
          Contract List
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {/* 🛠️ MODIFIED: Search / entries / Export Button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>

          {/* Entries per page AND Export Button */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {/* Entries per page (from Page A) */}
            <FormControl size='small' sx={{ minWidth: 120 }}>
              <Select
                value={rowsPerPage}
                onChange={handleChangeRowsPerPage}
              >
                {[10, 25, 50, 100].map(i => (
                  <MenuItem key={i} value={i}>
                    {i} entries
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Export Button (Added back from Page A) */}
              <Box display='flex' gap={1}>
              {['Copy', 'CSV', 'Excel', 'PDF', 'Print'].map(btn => (
                <Button
                  key={btn}
                  variant='contained'
                  size='small'
                  // Placeholder action - replace with actual export logic if needed
                  onClick={() => alert(`Export as ${btn}`)}
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
                  {btn}
                </Button>
              ))}
            </Box>
          </Box>


          {/* Search (from Page A) */}
          <CustomTextField
            size='small'
            placeholder='Search by Customer, Code, Address, etc...'
            value={searchText}
            onChange={e => {setSearchText(e.target.value); setPage(1)}}
            sx={{ width: 420 }}
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

        {/* Table (Manual HTML Table - Unchanged) */}
        <Box sx={{ overflowX: 'auto', width: '100%' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: '3500px'
            }}
          >
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>
                {COLUMN_FIELDS.map(col => (
                  <th
                    key={col.id}
                    onClick={() => col.sortable !== false && handleSort(col.id)}
                    style={{
                      padding: '12px',
                      width: col.width,
                      cursor: col.sortable !== false ? 'pointer' : 'default',
                      userSelect: 'none',
                      textAlign: col.isNumeric || col.displayIndex ? 'right' : 'left'
                    }}
                  >
                    <Box
                      display='flex'
                      alignItems='center'
                      justifyContent={col.isNumeric || col.displayIndex ? 'flex-end' : 'flex-start'}
                    >
                      {col.header} {col.sortable !== false && <SortIcon field={col.id} />}
                    </Box>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {paginatedRows.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  {COLUMN_FIELDS.map(col => (
                    <td
                      key={col.id}
                      style={{
                        padding: '12px',
                        wordWrap: 'break-word',
                        whiteSpace: 'normal',
                        textAlign: col.isNumeric || col.displayIndex ? 'right' : 'left'
                      }}
                    >
                      {col.id === 'actions' ? (
                        <IconButton size='small'>
                          <MoreVertIcon />
                        </IconButton>
                      ) : col.displayIndex ? (
                        (page - 1) * rowsPerPage + i + 1
                      ) : col.id === 'status' ? (
                        <Box
                          component='span'
                          sx={{
                            fontWeight: 600,
                            color: '#fff',
                            backgroundColor: getStatusColor(r.status),
                            px: 1.5,
                            py: 0.5,
                            borderRadius: '6px',
                            display: 'inline-block'
                          }}
                        >
                          {r.status}
                        </Box>
                      ) : (
                        r[col.id]
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {rowCount === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color='text.secondary'>No results found</Typography>
            </Box>
          )}
        </Box>

        {/* Pagination (Unchanged) */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 2,
            py: 2,
            mt: 2,
            flexWrap: 'wrap'
          }}
        >
          <Typography variant='body2' color='text.secondary'>
            {paginationText}
          </Typography>

          <Box display='flex' alignItems='center' gap={2}>
            <Typography variant='body2' color='text.secondary'>
              Page {page} of {pageCount}
            </Typography>

            <Pagination
              count={pageCount}
              page={page}
              onChange={handleChangePage}
              shape='rounded'
              color='primary'
              showFirstButton
              showLastButton
            />
          </Box>
        </Box>
      </Card>
      {/* 🔚 END OF REFACTORED: Table Section */}
    </ContentLayout>
  )
}
