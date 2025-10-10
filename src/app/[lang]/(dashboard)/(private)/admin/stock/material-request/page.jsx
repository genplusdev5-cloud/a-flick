'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Menu,
  MenuItem,
  InputAdornment,
  IconButton,
  Pagination
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'

// Icons
import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import EditIcon from '@mui/icons-material/Edit'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import PrintIcon from '@mui/icons-material/Print'
import FileCopyIcon from '@mui/icons-material/FileCopy'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import TableChartIcon from '@mui/icons-material/TableChart'

// Wrapper
import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

export default function MaterialRequestPage() {
  const router = useRouter()

  const [rows] = useState([
    {
      id: 1,
      requestType: 'Stock Transfer',
      requestNo: 'REQ-001',
      requestDate: '2025-05-28',
      fromLocation: 'Stock-TECH STOCK 1',
      toLocation: 'Stock-TECH STOCK 2',
      requestedBy: 'Admin',
      approved: 'Yes',
      issued: 'No',
      completed: 'No',
      remarks: 'Urgent transfer',
      status: 'Pending'
    },
    {
      id: 2,
      requestType: 'Supplier Request',
      requestNo: 'REQ-002',
      requestDate: '2025-05-29',
      fromLocation: 'Supplier-ABC',
      toLocation: 'Stock-TECH STOCK 1',
      requestedBy: 'Tech',
      approved: 'Yes',
      issued: 'Yes',
      completed: 'Yes',
      remarks: 'Completed order',
      status: 'Approved'
    }
  ])

  const [searchText, setSearchText] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [date, setDate] = useState(new Date())

  // Menu for Action column
  const [anchorEl, setAnchorEl] = useState(null)
  const [menuRow, setMenuRow] = useState(null)
  const openMenu = Boolean(anchorEl)

  const handleMenuOpen = (event, row) => {
    setAnchorEl(event.currentTarget)
    setMenuRow(row)
  }
  const handleMenuClose = () => {
    setAnchorEl(null)
    setMenuRow(null)
  }

  // ✅ Filtered rows
  const filteredRows = rows.filter(row =>
    row.requestNo.toLowerCase().includes(searchText.toLowerCase())
  )

  // ✅ Table Columns
  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'requestType', headerName: 'Request Type', flex: 1, minWidth: 150 },
    { field: 'requestNo', headerName: 'Request No', flex: 1, minWidth: 140 },
    { field: 'requestDate', headerName: 'Request Date', flex: 1, minWidth: 140 },
    { field: 'fromLocation', headerName: 'From Location/Supplier', flex: 1.2, minWidth: 200 },
    { field: 'toLocation', headerName: 'To Location/Supplier', flex: 1.2, minWidth: 200 },
    { field: 'requestedBy', headerName: 'Requested By', flex: 1, minWidth: 140 },
    { field: 'approved', headerName: 'Is Approved', flex: 1, minWidth: 120 },
    { field: 'issued', headerName: 'Is Issued', flex: 1, minWidth: 120 },
    { field: 'completed', headerName: 'Is Completed', flex: 1, minWidth: 140 },
    { field: 'remarks', headerName: 'Remarks', flex: 1, minWidth: 180 },
    {
      field: 'status',
      headerName: 'Request Status',
      flex: 1,
      minWidth: 140,
      renderCell: params => {
        let bgColor = '#9e9e9e'
        switch (params.value) {
          case 'Approved':
          case 'Completed':
            bgColor = '#4caf50' // green
            break
          case 'Declined':
            bgColor = '#f44336' // red
            break
          case 'Pending':
            bgColor = '#ff9800' // orange
            break
          case 'Issued':
            bgColor = '#2196f3' // blue
            break
        }
        return (
          <Box
            sx={{
              px: 2,
              py: 0.5,
              borderRadius: '20px',
              backgroundColor: bgColor,
              color: '#fff',
              fontSize: '0.8rem',
              fontWeight: 600,
              textAlign: 'center',
              minWidth: 90
            }}
          >
            {params.value}
          </Box>
        )
      }
    },
    {
      field: 'actions',
      headerName: 'Action',
      width: 120,
      renderCell: params => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* 3 Dots Menu */}
          <IconButton size="small" onClick={e => handleMenuOpen(e, params.row)}>
            <MoreVertIcon />
          </IconButton>

          {/* Edit Pencil → navigate to update page */}
          <IconButton
            size="small"
            onClick={() =>
              router.push(`/admin/stock/material-request/${params.row.id}/update`)
            }
          >
            <EditIcon />
          </IconButton>
        </Box>
      )
    }
  ]

  return (
    <ContentLayout
      title="Material Request"
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Material Request' }]}
      actions={
        <Button variant="contained" href="/admin/stock/material-request/add">
          Add Request
        </Button>
      }
    >
      {/* ✅ Filters Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <AppReactDatepicker
                selected={date}
                id="date-filter"
                onChange={d => setDate(d)}
                placeholderText="Select Date"
                customInput={<CustomTextField fullWidth label="Date Filter" />}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <CustomTextField select fullWidth label="Request Status">
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Declined">Declined</MenuItem>
                <MenuItem value="Approved">Approved</MenuItem>
                <MenuItem value="Issued">Issued</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
              </CustomTextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <CustomTextField select fullWidth label="From Location/Supplier">
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Stock-TECH STOCK 1">Stock-TECH STOCK 1</MenuItem>
              </CustomTextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <CustomTextField select fullWidth label="To Location/Supplier">
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Stock-TECH STOCK 1">Stock-TECH STOCK 1</MenuItem>
              </CustomTextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <CustomTextField select fullWidth label="Requested By">
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
                <MenuItem value="Tech">Tech</MenuItem>
              </CustomTextField>
            </Grid>

            <Grid item xs={12} md={4} display="flex" alignItems="flex-end">
              <Button variant="contained" startIcon={<RefreshIcon />}>
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ✅ Table Section */}
      <Card>
        <CardContent>
          {/* Top Controls: Export + Search */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            {/* Export Buttons */}
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

            {/* Search */}
            <CustomTextField
              size="small"
              placeholder="Search by Request No..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              sx={{ width: 300 }}
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
                minWidth: 1,
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

      {/* ✅ Dropdown Menu for Actions */}
      <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
        <MenuItem onClick={() => alert(`View row ${menuRow?.id}`)}>View</MenuItem>
        <MenuItem onClick={() => alert(`Delete row ${menuRow?.id}`)}>Delete</MenuItem>
      </Menu>
    </ContentLayout>
  )
}
