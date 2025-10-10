'use client'

import { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  InputAdornment,
  Pagination
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'

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

export default function UsageReportPage() {
  const [searchText, setSearchText] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [date, setDate] = useState(new Date())

  // Dummy Data
  const [rows] = useState([
    {
      id: 1,
      employee: 'Admin',
      customer: 'GP Industries Pvt Ltd',
      supplier: 'Stock-TECH STOCK 1',
      material: 'Abate',
      usage: 20,
      dosageRemarks: 'Applied for pest control'
    },
    {
      id: 2,
      employee: 'Tech',
      customer: 'ABC Pvt Ltd',
      supplier: 'Stock-TECH STOCK 1',
      material: 'Advion Ant Gel',
      usage: 10,
      dosageRemarks: 'Test usage remarks'
    }
  ])

  // Filter rows
  const filteredRows = rows.filter(
    row =>
      row.employee.toLowerCase().includes(searchText.toLowerCase()) ||
      row.customer.toLowerCase().includes(searchText.toLowerCase()) ||
      row.material.toLowerCase().includes(searchText.toLowerCase())
  )

  // Table columns
  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'employee', headerName: 'Employee', flex: 1, minWidth: 150 },
    { field: 'customer', headerName: 'Customer', flex: 1.2, minWidth: 200 },
    { field: 'supplier', headerName: 'Supplier', flex: 1.2, minWidth: 200 },
    { field: 'material', headerName: 'Material', flex: 1, minWidth: 150 },
    { field: 'usage', headerName: 'Usage', flex: 1, minWidth: 120 },
    { field: 'dosageRemarks', headerName: 'Dosage Remarks', flex: 1.5, minWidth: 200 }
  ]

  return (
    <ContentLayout
      title="Usage Report"
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Usage Report' }]}
    >
      {/* Filters Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <AppReactDatepicker
                selected={date}
                id="date-filter"
                onChange={d => setDate(d)}
                placeholderText="Select Date"
                customInput={<CustomTextField fullWidth label="Date Filter" />}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <CustomTextField select fullWidth label="Employee">
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
                <MenuItem value="Tech">Tech</MenuItem>
              </CustomTextField>
            </Grid>

            <Grid item xs={12} md={3}>
              <CustomTextField select fullWidth label="Customer">
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="GP Industries Pvt Ltd">GP Industries Pvt Ltd</MenuItem>
                <MenuItem value="ABC Pvt Ltd">ABC Pvt Ltd</MenuItem>
              </CustomTextField>
            </Grid>

            <Grid item xs={12} md={3}>
              <CustomTextField select fullWidth label="Stock Supplier">
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Stock-TECH STOCK 1">Stock-TECH STOCK 1</MenuItem>
              </CustomTextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <CustomTextField select fullWidth label="Chemical">
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Abate">Abate</MenuItem>
                <MenuItem value="Advion Ant Gel">Advion Ant Gel</MenuItem>
                <MenuItem value="Aquabac">Aquabac</MenuItem>
                <MenuItem value="Falcon">Falcon</MenuItem>
              </CustomTextField>
            </Grid>

            <Grid item xs={12} md={6} display="flex" alignItems="flex-end">
              <Button variant="contained" startIcon={<RefreshIcon />}>
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table Section */}
      <Card>
        <CardContent>
          {/* Export + Search */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" gap={1}>
              {[
                { label: 'Copy', icon: <FileCopyIcon fontSize="small" /> },
                { label: 'CSV', icon: <FileDownloadIcon fontSize="small" /> },
                { label: 'Excel', icon: <TableChartIcon fontSize="small" /> },
                { label: 'PDF', icon: <PictureAsPdfIcon fontSize="small" /> },
                { label: 'Print', icon: <PrintIcon fontSize="small" /> }
              ].map(btn => (
                <Button
                  key={btn.label}
                  variant="contained"
                  size="small"
                  startIcon={btn.icon}
                  sx={{
                    borderRadius: '20px',
                    backgroundColor: '#f0f0f0',
                    color: '#333',
                    textTransform: 'none',
                    '&:hover': { backgroundColor: '#e0e0e0' }
                  }}
                >
                  {btn.label}
                </Button>
              ))}
            </Box>

            <CustomTextField
              size="small"
              placeholder="Search by Employee / Customer / Material..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              sx={{ width: 350 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }
              }}
            />
          </Box>

          {/* Entries per page */}
          <Box mb={2}>
            <CustomTextField
              select
              size="small"
              sx={{ width: 140 }}
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
            >
              {[5, 10, 25, 50, 100].map(opt => (
                <MenuItem key={opt} value={opt}>
                  {opt} entries
                </MenuItem>
              ))}
            </CustomTextField>
          </Box>

          {/* DataGrid */}
          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <DataGrid
              rows={filteredRows}
              columns={columns}
              autoHeight
              pageSizeOptions={[5, 10, 25, 50, 100]}
              pageSize={pageSize}
              onPageSizeChange={newSize => setPageSize(newSize)}
              disableRowSelectionOnClick
              rowHeight={52}
              sx={{
                minWidth: 1000,
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#fafafa',
                  fontWeight: 'bold'
                },
                border: '1px solid #e0e0e0',
                borderRadius: 2
              }}
              slots={{
                pagination: props => (
                  <Pagination {...props} shape="rounded" variant="outlined" color="primary" />
                )
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </ContentLayout>
  )
}
