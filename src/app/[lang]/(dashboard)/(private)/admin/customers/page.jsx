// MODIFIED page B

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
  Menu, // Added from Page A
  MenuItem, // Added from Page A
  ListItemText, // Added from Page A
  FormControl, // Added from Page A
  Select, // Added from Page A
  Pagination, // Added from Page A
  Divider // Added from Page A
} from '@mui/material'
import { useTheme } from '@mui/material/styles' // Added from Page A
import { useRouter } from 'next/navigation'
import { openDB } from 'idb'
import Link from 'next/link' // Added from Page A

// Icons
import AddIcon from '@mui/icons-material/Add'
// import DownloadIcon from '@mui/icons-material/Download' // Replaced by ArrowDropDownIcon
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'
import GroupIcon from '@mui/icons-material/Group'
import BarChartIcon from '@mui/icons-material/BarChart'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown' // Added from Page A
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward' // Added from Page A
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward' // Added from Page A

// Wrapper (Removed ContentLayout)
// import ContentLayout from '@/components/layout/ContentLayout'
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

// Cell style (Added from Page A)
const tableCellStyle = {
  padding: '12px',
  wordWrap: 'break-word',
  whiteSpace: 'normal',
  wordBreak: 'break-word',
  overflowWrap: 'break-word'
}


export default function CustomersPage() {
  const router = useRouter()
  const theme = useTheme() // Added from Page A

  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1) // Changed from 0 to 1 for Pagination component logic
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [rows, setRows] = useState([])
  const [sortField, setSortField] = useState('id') // Added from Page A
  const [sortDirection, setSortDirection] = useState('desc') // Added from Page A
  const [exportAnchorEl, setExportAnchorEl] = useState(null) // Added from Page A
  const exportOpen = Boolean(exportAnchorEl) // Added from Page A

  const loadCustomers = async () => {
    try {
      const db = await getCustomerDB()
      const allCustomers = await db.getAll('customers')
      const validCustomers = (allCustomers || []) // Added check for safety
        .filter(c => typeof c === 'object' && c !== null)
        .map(c => ({
          ...c,
          // Consolidating property mapping for table display
          name: c.customerName || c.name || '',
          email: c.loginEmail || c.email || '', // Added for Page B's original columns
          phone: c.picPhone || c.billingPhone || '',
          address: c.billingAddress || '',
          commenceDate: c.commenceDate || '',
          origin: c.origin || '', // Added for Page B's original columns
          projectStatus: c.projectStatus || 'Active' // Added for Page A's column
        }))
        .reverse()
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
    if (!window.confirm(`Are you sure you want to delete customer ID: ${id}?`)) {
      return
    }
    try {
      const db = await getCustomerDB()
      await db.delete('customers', id)
      setRows(prev => prev.filter(r => r.id !== id))
    } catch (error) {
      console.error('Failed to delete customer:', error)
    }
  }

  // Export handlers (Copied from Page A)
  const handleExportClick = e => setExportAnchorEl(e.currentTarget)
  const handleExportClose = () => setExportAnchorEl(null)
  const handleExportSelect = type => {
    alert(`Export as: ${type} - (Feature not implemented)`)
    handleExportClose()
  }

  const handlePageChange = (e, newPage) => setPage(newPage)

  const handleRowsPerPageChange = e => {
    setRowsPerPage(Number(e.target.value))
    setPage(1) // Reset page to 1
  }

  // Sorting handlers (Copied from Page A)
  const handleSort = field => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setPage(1)
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc'
      ? <ArrowUpwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
      : <ArrowDownwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
  }

  // Sorting logic (Copied from Page A)
  const sortedRows = [...rows].sort((a, b) => {
    const field = sortField
    let aValue = a[field]
    let bValue = b[field]

    aValue = (aValue || '').toString().toLowerCase()
    bValue = (bValue || '').toString().toLowerCase()

    let comparison = 0
    if (field === 'id') {
      comparison = (Number(a.id) || 0) - (Number(b.id) || 0)
    } else {
      comparison = aValue.localeCompare(bValue)
    }
    return sortDirection === 'asc' ? comparison : comparison * -1
  })


  // Filtering logic from Page B, expanded to include all searchable fields from both pages
  const filteredRows = sortedRows.filter(
    row =>
      (row.name?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
      (row.phone?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
      (row.address?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
      (row.email?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
      (row.origin?.toLowerCase() || '').includes(searchText.toLowerCase())
  )

  // Pagination logic (Copied and adapted from Page A)
  const rowCount = filteredRows.length
  const pageCount = Math.max(1, Math.ceil(rowCount / rowsPerPage))
  const paginatedRows = filteredRows.slice((page - 1) * rowsPerPage, page * rowsPerPage)
  const startIndex = rowCount === 0 ? 0 : (page - 1) * rowsPerPage + 1
  const endIndex = Math.min(page * rowsPerPage, rowCount)
  const paginationText = `Showing ${startIndex} to ${endIndex} of ${rowCount} entries`


  // Columns Configuration: Using Page B's columns but adapted for Page A's manual table format
  const manualColumns = [
    { key: 'sno', header: 'S.No', sortable: false, width: '60px', render: (r, i) => (page - 1) * rowsPerPage + i + 1 },
    {
      key: 'actions', header: 'Action', sortable: false, width: '100px', render: r => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size='small' onClick={() => handleEditClick(r.id)}>
            <EditIcon fontSize='small' />
          </IconButton>
          <IconButton size='small' onClick={() => handleDelete(r.id)}>
            <DeleteIcon sx={{ color: 'red' }} fontSize='small' />
          </IconButton>
        </Box>
      )
    },
    { key: 'origin', header: 'Origin', sortable: true, minWidth: '100px', render: r => r.origin || '-' },
    { key: 'email', header: 'Contact Email', sortable: true, minWidth: '150px', render: r => r.email || '-' },
    { key: 'address', header: 'Billing Address', sortable: true, minWidth: '200px', render: r => r.address || '-' },
    { key: 'name', header: 'Customer Name', sortable: true, minWidth: '150px', render: r => r.name || '-' },
    {
      key: 'commenceDate', header: 'Commence Date', sortable: true, minWidth: '130px',
      render: r => r.commenceDate ? new Date(r.commenceDate).toLocaleDateString('en-GB') : '-'
    },
    { key: 'phone', header: 'Contact Phone', sortable: false, minWidth: '120px', render: r => r.phone || '-' },
    {
        key: 'contracts',
        header: 'Contract',
        sortable: false,
        minWidth: '120px',
        render: r => (
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
    // Note: Project Status column from Page A is not included to keep Page B's original columns, but it can be added if needed.
  ]

  return (
    <Box>
      {/* Breadcrumb (Copied from Page A) */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <Link
          href='/'
          style={{
            color: theme.palette.primary.main,
            textDecoration: 'none',
            fontSize: 14
          }}
        >
          Dashboard
        </Link>
        <Typography sx={{ mx: 1, color: 'text.secondary' }}>/</Typography>
        <Typography variant='body2' sx={{ fontSize: 14 }}>
          Customer List
        </Typography>
      </Box>

      {/* Stats (Copied from Page A) */}
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

      {/* Main Table Card (Copied from Page A) */}
      <Card sx={{ p: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant='h6'>Customer List</Typography>
          <Box display='flex' gap={1}>
            <Button variant='outlined' endIcon={<ArrowDropDownIcon />} onClick={handleExportClick}>
              Export
            </Button>
            <Menu anchorEl={exportAnchorEl} open={exportOpen} onClose={handleExportClose}>
              <MenuItem onClick={() => handleExportSelect('print')}><ListItemText>Print</ListItemText></MenuItem>
              <MenuItem onClick={() => handleExportSelect('csv')}><ListItemText>CSV</ListItemText></MenuItem>
              <MenuItem onClick={() => handleExportSelect('excel')}><ListItemText>Excel</ListItemText></MenuItem>
              <MenuItem onClick={() => handleExportSelect('pdf')}><ListItemText>PDF</ListItemText></MenuItem>
              <MenuItem onClick={() => handleExportSelect('copy')}><ListItemText>Copy</ListItemText></MenuItem>
            </Menu>
            <Button variant='contained' startIcon={<AddIcon />} onClick={() => router.push('/admin/customers/add')}>
              Add Customer
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <FormControl size='small' sx={{ minWidth: 120 }}>
            <Select value={rowsPerPage} onChange={handleRowsPerPageChange}>
              {[10, 25, 50, 100].map(i => (
                <MenuItem key={i} value={i}>{i} entries</MenuItem>
              ))}
            </Select>
          </FormControl>

          <CustomTextField
            size='small'
            placeholder='Search by Name, Email, Address, Origin...'
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
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

        <Box sx={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>
                {manualColumns.map(col => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    style={{
                      padding: '12px',
                      width: col.width || 'auto',
                      minWidth: col.minWidth || '100px',
                      cursor: col.sortable ? 'pointer' : 'default',
                      userSelect: 'none'
                    }}
                  >
                    <Box display='flex' alignItems='center'>
                      {col.header} {col.sortable && col.key !== 'sno' && <SortIcon field={col.key} />}
                    </Box>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  {manualColumns.map(col => (
                    <td key={col.key} style={tableCellStyle}>
                      {col.render(r, i)}
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

        {/* Pagination Footer (Copied from Page A) */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 2, mt: 2, flexWrap: 'wrap' }}>
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
              onChange={handlePageChange}
              shape='rounded'
              color='primary'
              showFirstButton
              showLastButton
            />
          </Box>
        </Box>
      </Card>
    </Box>
  )
}
