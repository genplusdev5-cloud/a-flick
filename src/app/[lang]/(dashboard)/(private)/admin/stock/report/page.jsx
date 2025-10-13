'use client'

import { useState, useMemo, useEffect } from 'react' // Added useMemo and useEffect
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
import { format } from 'date-fns' // Added date-fns

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

// Dummy Data Options (Extracted from Page A's MenuItem/filter structure)
const SUPPLIER_OPTIONS = ['Stock-TECH STOCK 1', 'Supplier-ABC', 'Vendor-XYZ']
const CHEMICAL_OPTIONS = ['Abate', 'Able Max', 'Advion Ant Gel', 'Aquabac', 'Falcon']

export default function StockReportPage() {
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(0) // Added for external pagination
  const [rowsPerPage, setRowsPerPage] = useState(10) // Changed from pageSize to rowsPerPage
  const [dateFilter, setDateFilter] = useState(new Date()) // Renamed 'date' to 'dateFilter' for consistency
  const [filterByDate, setFilterByDate] = useState(false) // Added custom date filter state
  const [supplierFilter, setSupplierFilter] = useState('')
  const [chemicalFilter, setChemicalFilter] = useState('')

  // Dummy data (expanded for filtering demonstration)
  const [rows] = useState([
    {
      id: 1,
      supplier: 'Stock-TECH STOCK 1',
      material: 'Abate',
      openingStock: 200,
      totalReceived: 150,
      totalSupplied: 100,
      totalConsumed: 50,
      received: 50,
      supplied: 20,
      consumed: 30,
      available: 200,
      reportDate: new Date(2025, 9, 10) // Oct 10, 2025
    },
    {
      id: 2,
      supplier: 'Supplier-ABC',
      material: 'Falcon',
      openingStock: 500,
      totalReceived: 200,
      totalSupplied: 150,
      totalConsumed: 50,
      received: 50,
      supplied: 20,
      consumed: 30,
      available: 550,
      reportDate: new Date(2025, 9, 10) // Oct 10, 2025
    },
    {
      id: 3,
      supplier: 'Stock-TECH STOCK 1',
      material: 'Aquabac',
      openingStock: 100,
      totalReceived: 50,
      totalSupplied: 50,
      totalConsumed: 0,
      received: 25,
      supplied: 15,
      consumed: 10,
      available: 100,
      reportDate: new Date(2025, 9, 11) // Oct 11, 2025
    }
  ])

  const handleRefreshTable = () => {
    // In a real app, this would re-fetch data from an API
    console.log('Refreshing Stock Report data...')
    setPage(0)
  }

  // Refactored to use useMemo for all filters
  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      const matchesSearch =
        row.supplier.toLowerCase().includes(searchText.toLowerCase()) ||
        row.material.toLowerCase().includes(searchText.toLowerCase())

      const matchesSupplier = !supplierFilter || row.supplier === supplierFilter
      const matchesChemical = !chemicalFilter || row.material === chemicalFilter

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

      return matchesSearch && matchesSupplier && matchesChemical && matchesDate
    })
  }, [rows, searchText, supplierFilter, chemicalFilter, filterByDate, dateFilter])

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
    { field: 'id', headerName: 'ID', width: 80 }, // Adjusted width for cleaner look
    { field: 'supplier', headerName: 'Supplier', flex: 1, minWidth: 200 },
    { field: 'material', headerName: 'Material', flex: 1, minWidth: 200 },
    { field: 'openingStock', headerName: 'Opening Stock', flex: 1, minWidth: 160 },
    { field: 'totalReceived', headerName: 'Total Received', flex: 1, minWidth: 160 },
    { field: 'totalSupplied', headerName: 'Total Supplied', flex: 1, minWidth: 160 },
    { field: 'totalConsumed', headerName: 'Total Consumed', flex: 1, minWidth: 160 },
    { field: 'received', headerName: 'Received', flex: 1, minWidth: 140 },
    { field: 'supplied', headerName: 'Supplied', flex: 1, minWidth: 140 },
    { field: 'consumed', headerName: 'Consumed', flex: 1, minWidth: 140 },
    { field: 'available', headerName: 'Available Stock', flex: 1, minWidth: 160 }
  ]

  return (
    <ContentLayout
      title='Stock Report'
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Stock Report' }]}
    >
      {/* Filters: Styled like Page B's filter card */}
      <Card sx={{ mb: 4, boxShadow: 'none' }} elevation={0}>
        <CardContent>
          <Grid container spacing={6}> {/* Increased spacing to match Page B */}
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
                  dateFormat='dd/MM/yyyy' // Added date format
                  customInput={
                    <CustomTextField
                      fullWidth
                      inputProps={{
                        disabled: !filterByDate, // Disable if checkbox is unchecked
                        sx: { backgroundColor: !filterByDate ? '#f3f4f6' : 'white' }
                      }}
                    />
                  }
                />
              </Box>
            </Grid>

            {/* Stock Supplier: Changed to Autocomplete like Page B */}
            <Grid item xs={12} md={3}>
              <Autocomplete
                freeSolo={false}
                options={SUPPLIER_OPTIONS}
                value={supplierFilter}
                onChange={(event, newValue) => setSupplierFilter(newValue || '')}
                renderInput={params => <CustomTextField {...params} fullWidth label='Stock Supplier' />}
              />
            </Grid>

            {/* Chemical: Changed to Autocomplete like Page B */}
            <Grid item xs={12} md={3}>
              <Autocomplete
                freeSolo={false}
                options={CHEMICAL_OPTIONS}
                value={chemicalFilter}
                onChange={(event, newValue) => setChemicalFilter(newValue || '')}
                renderInput={params => <CustomTextField {...params} fullWidth label='Chemical' />}
              />
            </Grid>

            <Grid item xs={12} md={3} display='flex' gap={2} sx={{ mt: 5 }}>
              <Button
                size='small'
                variant='contained'

                onClick={handleRefreshTable}
                sx={{
                  backgroundColor: '#7D70F7',
                  '&:hover': { backgroundColor: '#5D4CEF' },
                  paddingY: '10px' // Style from Page B's refresh button
                }}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table Card: Styled like Page B's table card */}
      <Card sx={{ mb: 4, boxShadow: 'none' }} elevation={0}>
        <CardContent>
          {/* Export + Search: Styled like Page B */}
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
            <Box display='flex' gap={1}>
              {[
                { label: 'Copy'  },
                { label: 'CSV' },
                { label: 'Excel' },
                { label: 'PDF'},
                { label: 'Print' }
              ].map(btn => (
                <Button
                  key={btn.label}
                  variant='contained'
                  size='small'
                  startIcon={btn.icon} // Retained icons as they were in Page A
                  sx={{
                    borderRadius: '0px', // Changed to square corners (Page B style)
                    backgroundColor: '#6c7783', // Changed color (Page B style)
                    color: '#ffffff',
                    textTransform: 'none',
                    '&:hover': { backgroundColor: '#5a626a' },
                    paddingY: '10px', // Page B style
                    lineHeight: 1 // Page B style
                  }}
                >
                  {btn.label}
                </Button>
              ))}
            </Box>

            <CustomTextField
              size='small'
              placeholder='Search' // Changed placeholder to match Page B
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              sx={{ width: 280 }} // Adjusted width to match Page B
              InputProps={{ // Changed slotProps to InputProps
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
              rows={paginatedRows} // Using paginatedRows
              columns={columns}
              disableRowSelectionOnClick
              autoHeight
              hideFooter // Hide internal footer for external pagination
              getRowId={row => row.id} // Added getRowId
              getRowHeight={() => 'auto'} // Style from Page B
              sx={{
                mt: 3,
                minWidth: 1000,
                border: '1px solid #e0e0e0', // Retained border
                borderRadius: 2, // Retained borderRadius
                '& .MuiDataGrid-row': { minHeight: '60px !important', padding: '12px 0' }, // Style from Page B
                '& .MuiDataGrid-cell': {
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                  alignItems: 'flex-start',
                  fontSize: '15px' // Style from Page B
                },
                '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' }, // Style from Page B
                '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': { outline: 'none' }, // Style from Page B
                '& .MuiDataGrid-columnHeaderTitle': { fontSize: '15px', fontWeight: 500 } // Style from Page B
                // Removed redundant background color from Page A
              }}
            />
          </Box>

          {/* Custom Pagination Footer from Page B */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
            <Typography variant='body2' color='text.secondary'>
              {paginationText}
            </Typography>

            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]} // Using Page B's options
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
