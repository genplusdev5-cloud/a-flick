'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Card,
  CardContent,
  Grid,
  Typography,
  TablePagination
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { useRouter } from 'next/navigation'
import { openDB } from 'idb'

// Icons
import AddIcon from '@mui/icons-material/Add'
import DownloadIcon from '@mui/icons-material/Download'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'
import GroupIcon from '@mui/icons-material/Group'
import BarChartIcon from '@mui/icons-material/BarChart'

// Wrapper
import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'

// IndexedDB helper
async function getCustomerDB() {
  return openDB('mainCustomerDB', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('customers')) {
        db.createObjectStore('customers', { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

export default function CustomersPage() {
  const router = useRouter()
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [rows, setRows] = useState([])

  const loadCustomers = async () => {
    try {
      const db = await getCustomerDB()
      const allCustomers = await db.getAll('customers')
      const validCustomers = allCustomers
        .filter(c => typeof c === 'object' && c !== null)
        .map(c => ({
          ...c,
          name: c.customerName || c.name || '',
          email: c.loginEmail || c.email || '',
          phone: c.picPhone || c.billingPhone || '',
          address: c.billingAddress || '',
          commenceDate: c.commenceDate || '',
          origin: c.origin || ''
        }))
        .reverse() // ✅ newest first
      setRows(validCustomers || [])
    } catch (error) {
      console.error('Failed to load customers from DB:', error)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  const handleEditClick = id => router.push(`/admin/customers/${id}/edit`)

  const handleDelete = async id => {
    try {
      const db = await getCustomerDB()
      await db.delete('customers', id)
      setRows(prev => prev.filter(r => r.id !== id))
    } catch (error) {
      console.error('Failed to delete customer:', error)
    }
  }

  const handlePageChange = (e, newPage) => setPage(newPage)

  const handleRowsPerPageChange = e => {
    setRowsPerPage(parseInt(e.target.value, 10))
    setPage(0)
  }

  // ✅ Filtering
  const filteredRows = rows.filter(
    row =>
      (row.name?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
      (row.email?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
      (row.origin?.toLowerCase() || '').includes(searchText.toLowerCase())
  )

  // ✅ Pagination
  const paginatedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  const totalRows = filteredRows.length
  const startIndex = totalRows === 0 ? 0 : page * rowsPerPage + 1
  const endIndex = Math.min((page + 1) * rowsPerPage, totalRows)
  const paginationText = `Showing ${startIndex} to ${endIndex} of ${totalRows} entries`

  // ✅ Final column order
  const columns = [
    {
      field: 'sno',
      headerName: 'S.No',
      flex: 0.2,
      sortable: false,
      valueGetter: params => filteredRows.findIndex(r => r.id === params.row.id) + 1
    },
    {
      field: 'actions',
      headerName: 'Action',
      flex: 0.4,
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size='small' onClick={() => handleEditClick(params.row.id)}>
            <EditIcon fontSize='small' />
          </IconButton>
          <IconButton size='small' onClick={() => handleDelete(params.row.id)}>
            <DeleteIcon sx={{ color: 'red' }} fontSize='small' />
          </IconButton>
        </Box>
      )
    },
    { field: 'origin', headerName: 'Origin', flex: 0.8 },
    {
      field: 'email',
      headerName: 'Contact Email',
      flex: 1.2,
      valueGetter: params => params.row.loginEmail || params.row.email || '-'
    },
    {
      field: 'address',
      headerName: 'Billing Address',
      flex: 1.5,
      valueGetter: params => params.row.billingAddress || '-'
    },
    {
      field: 'name',
      headerName: 'Customer Name',
      flex: 1,
      valueGetter: params => params.row.customerName || params.row.name || '-'
    },
    {
      field: 'commenceDate',
      headerName: 'Commence Date',
      flex: 0.8,
      valueGetter: params =>
        params.row.commenceDate
          ? new Date(params.row.commenceDate).toLocaleDateString('en-GB')
          : '-'
    },
    {
      field: 'phone',
      headerName: 'Contact Phone',
      flex: 0.8,
      valueGetter: params => params.row.picPhone || params.row.billingPhone || '-'
    },
    {
      field: 'contracts',
      headerName: 'Contract',
      flex: 0.8,
      renderCell: params => (
        <Button
          size='small'
          variant='outlined'
          color='success'
          sx={{
            borderRadius: '5px',
            textTransform: 'none',
            fontWeight: 500,
            py: 0.5
          }}
          onClick={() => router.push('/en/admin/contracts')}
        >
          Contracts
        </Button>
      )
    }
  ]

  return (
    <ContentLayout
      title='Customer List'
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Customer' }]}
      actions={
        <Box sx={{ m: 2, display: 'flex', gap: 2 }}>
          <Button variant='outlined' startIcon={<DownloadIcon />}>
            Export
          </Button>
          <Button
            variant='contained'
            startIcon={<AddIcon />}
            onClick={() => router.push('/admin/customers/add')}
          >
            Add Customer
          </Button>
        </Box>
      }
    >
      {/* Stats Card Section */}
      <Card elevation={0} sx={{ mb: 4, boxShadow: 'none' }} variant='outlined'>
        <CardContent>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
            <Typography variant='h6'>All Customers</Typography>
            <Typography variant='body2' color='text.secondary'>
              Updated 1 month ago
            </Typography>
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Box display='flex' alignItems='center' gap={2}>
                <BarChartIcon color='primary' fontSize='large' />
                <Box>
                  <Typography variant='h6'>230k</Typography>
                  <Typography variant='body2'>Sales</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box display='flex' alignItems='center' gap={2}>
                <GroupIcon color='info' fontSize='large' />
                <Box>
                  <Typography variant='h6'>8.549k</Typography>
                  <Typography variant='body2'>Renewed</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box display='flex' alignItems='center' gap={2}>
                <ShoppingCartIcon color='error' fontSize='large' />
                <Box>
                  <Typography variant='h6'>1.423k</Typography>
                  <Typography variant='body2'>Rejected</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box display='flex' alignItems='center' gap={2}>
                <MonetizationOnIcon color='success' fontSize='large' />
                <Box>
                  <Typography variant='h6'>$9745</Typography>
                  <Typography variant='body2'>Current</Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Search Field */}
      <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'flex-start', mt: 5 }}>
        <CustomTextField
          size='small'
          placeholder='Search'
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
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

      {/* DataGrid */}
      <DataGrid
        rows={paginatedRows}
        columns={columns}
        getRowId={row => row.id}
        disableRowSelectionOnClick
        autoHeight
        hideFooter
        getRowHeight={() => 'auto'}
        sx={{
          mt: 3,
          '& .MuiDataGrid-row': {
            minHeight: '60px !important',
            padding: '10px 0'
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
          '& .MuiDataGrid-columnHeaderTitle': { fontSize: '15px', fontWeight: 500 }
        }}
      />

      {/* Pagination Footer */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
        <Typography variant='body2' color='text.secondary'>
          {paginationText}
        </Typography>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component='div'
          count={filteredRows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Box>
    </ContentLayout>
  )
}
