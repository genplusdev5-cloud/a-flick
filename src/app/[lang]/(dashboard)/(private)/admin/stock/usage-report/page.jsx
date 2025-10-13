'use client'

import { useState, useMemo } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography, // Added Typography
  InputAdornment,
  TablePagination, // Changed from Pagination to TablePagination
  Autocomplete // Added Autocomplete
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { format } from 'date-fns' // Added date-fns for consistency

// Icons
import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import PrintIcon from '@mui/icons-material/Print'
import FileCopyIcon from '@mui/icons-material/FileCopy'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import TableChartIcon from '@mui/icons-material/TableChart'

// Layout
import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

// Extracted Filter Options
const EMPLOYEE_OPTIONS = ['Admin', 'Tech', 'User A']
const CUSTOMER_OPTIONS = ['GP Industries Pvt Ltd', 'ABC Pvt Ltd', 'Tech Solutions']
const SUPPLIER_OPTIONS = ['Stock-TECH STOCK 1', 'Supplier-B', 'Vendor-C']
const CHEMICAL_OPTIONS = ['Abate', 'Advion Ant Gel', 'Aquabac', 'Falcon', 'Able Max']

export default function UsageReportPage() {
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(0) // State for external pagination
  const [rowsPerPage, setRowsPerPage] = useState(10) // State for external pagination (renamed from pageSize)
  const [dateFilter, setDateFilter] = useState(new Date()) // Renamed 'date' to 'dateFilter'
  const [filterByDate, setFilterByDate] = useState(false) // Custom date filter state

  // Autocomplete filter states
  const [employeeFilter, setEmployeeFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [chemicalFilter, setChemicalFilter] = useState('')

  // Dummy Data (added reportDate for filter test)
  const [rows] = useState([
    {
      id: 1,
      employee: 'Admin',
      customer: 'GP Industries Pvt Ltd',
      supplier: 'Stock-TECH STOCK 1',
      material: 'Abate',
      usage: 20,
      dosageRemarks: 'Applied for pest control',
      reportDate: new Date(2025, 9, 10)
    },
    {
      id: 2,
      employee: 'Tech',
      customer: 'ABC Pvt Ltd',
      supplier: 'Stock-TECH STOCK 1',
      material: 'Advion Ant Gel',
      usage: 10,
      dosageRemarks: 'Test usage remarks',
      reportDate: new Date(2025, 9, 10)
    },
    {
      id: 3,
      employee: 'User A',
      customer: 'Tech Solutions',
      supplier: 'Supplier-B',
      material: 'Aquabac',
      usage: 5,
      dosageRemarks: 'Routine check',
      reportDate: new Date(2025, 9, 11)
    }
  ])

  const handleRefreshTable = () => {
    // In a real application, this would re-fetch data based on the current filters
    console.log('Refreshing Usage Report data...')
    setPage(0)
  }

  // Filter rows using useMemo to apply all filters
  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      // Search text filter
      const matchesSearch =
        row.employee.toLowerCase().includes(searchText.toLowerCase()) ||
        row.customer.toLowerCase().includes(searchText.toLowerCase()) ||
        row.material.toLowerCase().includes(searchText.toLowerCase())

      // Autocomplete filters
      const matchesEmployee = !employeeFilter || row.employee === employeeFilter
      const matchesCustomer = !customerFilter || row.customer === customerFilter
      const matchesSupplier = !supplierFilter || row.supplier === supplierFilter
      const matchesChemical = !chemicalFilter || row.material === chemicalFilter

      // Date filter logic (copied from Page B)
      let matchesDate = true
      if (filterByDate && row.reportDate) {
        const rowDate = new Date(row.reportDate)
        if (!isNaN(rowDate.getTime())) {
          matchesDate =
            rowDate.getFullYear() === dateFilter.getFullYear() &&
            rowDate.getMonth() === dateFilter.getMonth() &&
            rowDate.getDate() === dateFilter.getDate()
        } else {
          matchesDate = false
        }
      }

      return matchesSearch && matchesEmployee && matchesCustomer && matchesSupplier && matchesChemical && matchesDate
    })
  }, [rows, searchText, employeeFilter, customerFilter, supplierFilter, chemicalFilter, filterByDate, dateFilter])

  // Pagination logic from Page B
  const paginatedRows = useMemo(() => {
    return filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  }, [filteredRows, page, rowsPerPage])

  const totalRows = filteredRows.length
  const startIndex = totalRows === 0 ? 0 : page * rowsPerPage + 1
  const endIndex = Math.min((page + 1) * rowsPerPage, totalRows)
  const paginationText = `Showing ${startIndex} to ${endIndex} of ${totalRows} entries`

  const handleChangePage = (event, newPage) => setPage(newPage)
  const handleChangeRowsPerPage = event => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  // Table columns
  const columns = [
    { field: 'id', headerName: 'ID', width: 80 }, // Adjusted width
    { field: 'employee', headerName: 'Employee', flex: 1, minWidth: 150 },
    { field: 'customer', headerName: 'Customer', flex: 1.2, minWidth: 200 },
    { field: 'supplier', headerName: 'Supplier', flex: 1.2, minWidth: 200 },
    { field: 'material', headerName: 'Material', flex: 1, minWidth: 150 },
    { field: 'usage', headerName: 'Usage', flex: 1, minWidth: 120 },
    {
      field: 'reportDate',
      headerName: 'Report Date',
      width: 150,
      valueFormatter: params => {
        const date = new Date(params.value)
        return !isNaN(date.getTime()) ? format(date, 'dd/MM/yyyy') : 'N/A'
      }
    },
    { field: 'dosageRemarks', headerName: 'Dosage Remarks', flex: 1.5, minWidth: 200 }
  ]

  return (
    <ContentLayout title='Usage Report' breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Usage Report' }]}>
      {/* Filters Section: Styled like Page B */}
      <Card sx={{ mb: 4, boxShadow: 'none' }} elevation={0}>
        <CardContent>
          <Grid container spacing={6}>
            {' '}
            {/* Increased spacing to match Page B */}
            {/* Date Filter with Checkbox */}
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box display='flex' alignItems='center' gap={0.5} sx={{ pl: 0.5, position: 'relative' }}>
                  {/* Custom Checkbox from Page B */}
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
                      backgroundColor: filterByDate ? '#7D70F7' : 'white'
                    }}
                  />
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
                      <Typography component='span' sx={{ color: 'white', fontSize: '12px', top: '-1px' }}>
                        &#10003;
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

                <AppReactDatepicker
                  selected={dateFilter}
                  id='date-filter'
                  onChange={d => setDateFilter(d)}
                  placeholderText='Select Date'
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
            {/* Employee Filter: Changed to Autocomplete */}
            <Grid item xs={12} md={3}>
              <Autocomplete
                freeSolo={false}
                options={EMPLOYEE_OPTIONS}
                value={employeeFilter}
                onChange={(event, newValue) => setEmployeeFilter(newValue || '')}
                renderInput={params => <CustomTextField {...params} fullWidth label='Employee' />}
              />
            </Grid>
            {/* Customer Filter: Changed to Autocomplete */}
            <Grid item xs={12} md={3}>
              <Autocomplete
                freeSolo={false}
                options={CUSTOMER_OPTIONS}
                value={customerFilter}
                onChange={(event, newValue) => setCustomerFilter(newValue || '')}
                renderInput={params => <CustomTextField {...params} fullWidth label='Customer' />}
              />
            </Grid>
            {/* Stock Supplier Filter: Changed to Autocomplete */}
            <Grid item xs={12} md={3}>
              <Autocomplete
                freeSolo={false}
                options={SUPPLIER_OPTIONS}
                value={supplierFilter}
                onChange={(event, newValue) => setSupplierFilter(newValue || '')}
                renderInput={params => <CustomTextField {...params} fullWidth label='Stock Supplier' />}
              />
            </Grid>
            {/* Chemical Filter: Changed to Autocomplete */}
            <Grid item xs={12} md={4}>
              <Autocomplete
                freeSolo={false}
                options={CHEMICAL_OPTIONS}
                value={chemicalFilter}
                onChange={(event, newValue) => setChemicalFilter(newValue || '')}
                renderInput={params => <CustomTextField {...params} fullWidth label='Chemical' />}
              />
            </Grid>
            {/* Refresh Button: Styled like Page B */}
            <Grid item xs={12} md={4} display='flex' gap={2} sx={{ mt: 5 }}>
              <Button
                size='small'
                variant='contained'
                onClick={handleRefreshTable}
                sx={{
                  backgroundColor: '#7D70F7',
                  '&:hover': { backgroundColor: '#5D4CEF' },
                  paddingY: '10px'
                }}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table Section: Styled like Page B */}
      <Card sx={{ mb: 4, boxShadow: 'none' }} elevation={0}>
        <CardContent>
          {/* Export + Search: Styled like Page B */}
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
            <Box display='flex' gap={1}>
              {[{ label: 'Copy' }, { label: 'CSV' }, { label: 'Excel' }, { label: 'PDF' }, { label: 'Print' }].map(
                btn => (
                  <Button
                    key={btn.label}
                    variant='contained'
                    size='small'
                    startIcon={btn.icon}
                    sx={{
                      borderRadius: '0px', // Square corners
                      backgroundColor: '#6c7783',
                      color: '#ffffff',
                      textTransform: 'none',
                      '&:hover': { backgroundColor: '#5a626a' },
                      paddingY: '10px',
                      lineHeight: 1
                    }}
                  >
                    {btn.label}
                  </Button>
                )
              )}
            </Box>

            <CustomTextField
              size='small'
              placeholder='Search' // Simplified placeholder
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              sx={{ width: 280 }} // Adjusted width
              InputProps={{
                // Use InputProps for startAdornment
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Box>

          {/* DataGrid */}
          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <DataGrid
              rows={paginatedRows} // Use paginated rows
              columns={columns}
              disableRowSelectionOnClick
              autoHeight
              hideFooter // Hide internal footer
              getRowId={row => row.id} // Added getRowId
              getRowHeight={() => 'auto'}
              sx={{
                mt: 3,
                minWidth: 1000,
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                '& .MuiDataGrid-row': { minHeight: '60px !important', padding: '12px 0' }, // Custom row height
                '& .MuiDataGrid-cell': {
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                  alignItems: 'flex-start',
                  fontSize: '15px'
                },
                '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
                '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': { outline: 'none' },
                '& .MuiDataGrid-columnHeaderTitle': { fontSize: '15px', fontWeight: 500 }
              }}
            />
          </Box>

          {/* Custom Pagination Footer from Page B */}
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
