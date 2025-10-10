'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Box,
  Typography,
  Button,
  IconButton,
  Drawer,
  InputAdornment,
  Menu,
  MenuItem,
  TablePagination,
  ListItemIcon,
  ListItemText
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { MdDelete } from 'react-icons/md'

// Icons
import DownloadIcon from '@mui/icons-material/Download'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import PrintIcon from '@mui/icons-material/Print'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import FileCopyIcon from '@mui/icons-material/FileCopy'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import TableChartIcon from '@mui/icons-material/TableChart'

// Wrapper
import ContentLayout from '@/components/layout/ContentLayout'

// Vuexy input
import CustomTextField from '@core/components/mui/TextField'

// IndexedDB
import { openDB } from 'idb'

// ------------------- IndexedDB Helpers -------------------
const getDB = async () => {
  return openDB('companyDB', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('companies')) {
        db.createObjectStore('companies', { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

const getAllCompanies = async () => {
  const db = await getDB()
  return db.getAll('companies')
}

const saveCompany = async company => {
  const db = await getDB()
  await db.put('companies', company)
}

const deleteCompany = async id => {
  const db = await getDB()
  await db.delete('companies', id)
}

// ------------------- Columns -------------------
// ✅ FIX: Pass the 'filteredRows' array to reliably calculate the global S.No.
const getColumns = (handleEdit, handleDelete, page, rowsPerPage, filteredRows) => [
  {
    field: 'serial',
    headerName: 'S.No',
    flex: 0.2,
    minWidth: 70,
    sortable: false,
    // ✅ FINAL, RELIABLE FIX: Calculate S.No based on its index in the filtered dataset.
    valueGetter: params => {
      // Find the row's index in the full, filtered array
      const globalIndex = filteredRows.findIndex(row => row.id === params.row.id);

      // Return the global index + 1 (since it's 0-based)
      return globalIndex !== -1 ? globalIndex + 1 : 'N/A';
    }
  },
  {
    field: 'action',
    headerName: 'Action',
    flex: 0.5,
    minWidth: 100,
    sortable: false,
    renderCell: params => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton size='small' onClick={() => handleDelete(params.row)}>
          <MdDelete style={{ color: 'red' }} />
        </IconButton>
        <IconButton size='small' onClick={() => handleEdit(params.row)}>
          <EditIcon />
        </IconButton>
      </Box>
    )
  },
  { field: 'companyCode', headerName: 'Company Code', flex: 1, minWidth: 150 },
  { field: 'companyName', headerName: 'Company Name', flex: 1, minWidth: 200 },
  { field: 'phone', headerName: 'Phone', flex: 1, minWidth: 150 },
  { field: 'address', headerName: 'Address', flex: 1.2, minWidth: 200 },
  {
    field: 'status',
    headerName: 'Status',
    flex: 0.6,
    minWidth: 120,
    renderCell: params => (
      <Button
        size='small'
        variant='contained'
        color={params.value === 'Active' ? 'success' : 'error'}
        sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 500 }}
      >
        {params.value}
      </Button>
    )
  }
]

// ------------------- Component -------------------
export default function CompanyOriginPage() {
  const [open, setOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [formData, setFormData] = useState({ companyCode: '', companyName: '', phone: '', address: '' })
  const [rows, setRows] = useState([])
  const [searchText, setSearchText] = useState('')
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const exportOpen = Boolean(exportAnchorEl)

  // Pagination
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [phoneError, setPhoneError] = useState(false)

  // Input refs for keyboard navigation
  const codeRef = useRef(null)
  const nameRef = useRef(null)
  const phoneRef = useRef(null)
  const addressRef = useRef(null)
  const submitRef = useRef(null)

  // Load data from IndexedDB on mount
  useEffect(() => {
    const fetchCompanies = async () => {
      const allCompanies = await getAllCompanies()
      setRows(allCompanies)
    }
    fetchCompanies()
  }, [])

  const toggleDrawer = () => setOpen(prev => !prev)
  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleAdd = () => {
    setIsEdit(false)
    setFormData({ companyCode: '', companyName: '', phone: '', address: '' })
    setOpen(true)
    setTimeout(() => codeRef.current?.focus(), 100)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setEditRow(row)
    setFormData({ companyCode: row.companyCode, companyName: row.companyName, phone: row.phone, address: row.address })
    setOpen(true)
    setTimeout(() => codeRef.current?.focus(), 100)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!formData.companyCode || !formData.companyName) return

    const digitsOnly = formData.phone.replace(/\s/g, '')
    if (formData.phone && digitsOnly.length !== 10) {
      setPhoneError(true)
      return
    }
    setPhoneError(false)

    if (isEdit && editRow) {
      const updatedRow = { ...editRow, ...formData }
      setRows(rows.map(r => (r.id === editRow.id ? updatedRow : r)))
      await saveCompany(updatedRow)
    } else {
      // Create temporary ID for local state (IndexedDB will assign the final ID)
      const tempId = Date.now()
      const newRow = {
        id: tempId,
        ...formData,
        status: 'Active'
      }
      setRows(prev => [newRow, ...prev])
      // Save without temp ID
      await saveCompany({ ...formData, status: 'Active' })
    }

    setFormData({ companyCode: '', companyName: '', phone: '', address: '' })
    toggleDrawer()
  }

  // Keyboard navigation for Enter key
  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      switch (field) {
        case 'companyCode':
          nameRef.current?.focus()
          break
        case 'companyName':
          phoneRef.current?.focus()
          break
        case 'phone':
          addressRef.current?.focus()
          break
        case 'address':
          submitRef.current?.focus()
          break
        default:
          break
      }
    }
  }

  const handleSearch = e => setSearchText(e.target.value)

  const handleDelete = async row => {
    setRows(prev => prev.filter(r => r.id !== row.id))
    await deleteCompany(row.id)
  }

  const handleExportClose = () => setExportAnchorEl(null)
  const handleExportSelect = type => {
    alert(`Export as: ${type}`)
    handleExportClose()
  }
  const handleChangePage = (event, newPage) => setPage(newPage)
  const handleChangeRowsPerPage = event => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const filteredRows = rows.filter(
    row =>
      row.companyName.toLowerCase().includes(searchText.toLowerCase()) ||
      row.companyCode.toLowerCase().includes(searchText.toLowerCase())
  )

  const handleExportClick = event => setExportAnchorEl(event.currentTarget)

  // Calculate Pagination Data
  const totalRows = filteredRows.length
  const startIndex = totalRows === 0 ? 0 : page * rowsPerPage + 1
  const endIndex = Math.min((page + 1) * rowsPerPage, totalRows)
  const paginationText = `Showing ${startIndex} to ${endIndex} of ${totalRows} entries`

  const paginatedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  // ✅ FIX: Pass page, rowsPerPage, AND the filteredRows array to getColumns
  const columns = getColumns(handleEdit, handleDelete, page, rowsPerPage, filteredRows)

  return (
    <ContentLayout
      title='Origin Company List'
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Company Origin' }]}
      actions={
        <Box sx={{ m: 2, display: 'flex', gap: 2 }}>
          <Button variant='outlined' color='primary' startIcon={<DownloadIcon />} onClick={handleExportClick}>
            Export
          </Button>
          <Menu anchorEl={exportAnchorEl} open={exportOpen} onClose={handleExportClose}>
            <MenuItem onClick={() => handleExportSelect('print')}>
              <ListItemIcon>
                <PrintIcon fontSize='small' />
              </ListItemIcon>
              <ListItemText>Print</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleExportSelect('csv')}>
              <ListItemIcon>
                <FileDownloadIcon fontSize='small' />
              </ListItemIcon>
              <ListItemText>CSV</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleExportSelect('excel')}>
              <ListItemIcon>
                <TableChartIcon fontSize='small' />
              </ListItemIcon>
              <ListItemText>Excel</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleExportSelect('pdf')}>
              <ListItemIcon>
                <PictureAsPdfIcon fontSize='small' />
              </ListItemIcon>
              <ListItemText>PDF</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleExportSelect('copy')}>
              <ListItemIcon>
                <FileCopyIcon fontSize='small' />
              </ListItemIcon>
              <ListItemText>Copy</ListItemText>
            </MenuItem>
          </Menu>
          <Button variant='contained' startIcon={<AddIcon />} onClick={handleAdd}>
            Add Company
          </Button>
        </Box>
      }
    >
      <Box sx={{ p: 2, mt: 5, pt: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <CustomTextField
          size='small'
          placeholder='Search'
          value={searchText}
          onChange={handleSearch}
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
            minHeight: '50px !important',
            padding: '10px 0'
          },
          '& .MuiDataGrid-cell': {
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            alignItems: 'flex-start',
            fontSize: '15px' // <-- Make row text bigger
          },
          '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
          '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': { outline: 'none' },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontSize: '15px', // header font bigger
            fontWeight: 500
          }
        }}
      />

      {/* Pagination Footer with Custom Text (Showing X to Y of Z entries) */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pr: 2 }}>
        {/* Custom Status Text */}
        <Typography variant='body2' sx={{ color: 'text.secondary', ml: 1 }}>
          {paginationText}
        </Typography>

        {/* Table Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component='div'
          count={totalRows}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>

      <Drawer anchor='right' open={open} onClose={toggleDrawer}>
        <Box sx={{ width: 360, p: 3 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6'>{isEdit ? 'Edit Company' : 'Add New Company'}</Typography>
            <IconButton onClick={toggleDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>
          <form onSubmit={handleSubmit}>
            <CustomTextField
              fullWidth
              margin='normal'
              label='Company Code'
              name='companyCode'
              value={formData.companyCode}
              inputRef={codeRef}
              onChange={handleChange}
              onKeyDown={e => handleKeyDown(e, 'companyCode')}
            />
            <CustomTextField
              fullWidth
              margin='normal'
              label='Company Name'
              name='companyName'
              value={formData.companyName}
              inputRef={nameRef}
              onChange={e => {
                const lettersOnly = e.target.value.replace(/[^a-zA-Z\s]/g, '')
                setFormData(prev => ({ ...prev, companyName: lettersOnly }))
              }}
              onKeyDown={e => handleKeyDown(e, 'companyName')}
            />
            <CustomTextField
              fullWidth
              margin='normal'
              label='Phone'
              name='phone'
              value={formData.phone}
              error={phoneError}
              helperText={phoneError ? 'Enter a valid 10-digit number' : ''}
              inputRef={phoneRef}
              onChange={e => {
                // Allows only 10 digits and adds a space after the 5th digit
                let numbers = e.target.value.replace(/\D/g, '')
                numbers = numbers.slice(0, 10)
                if (numbers.length > 5) numbers = numbers.slice(0, 5) + ' ' + numbers.slice(5)
                setFormData(prev => ({ ...prev, phone: numbers }))
                if (phoneError) setPhoneError(false)
              }}
              onBlur={() => {
                const digitsOnly = formData.phone.replace(/\s/g, '')
                if (formData.phone && digitsOnly.length !== 10) setPhoneError(true)
                else setPhoneError(false)
              }}
              onKeyDown={e => handleKeyDown(e, 'phone')}
            />
            <CustomTextField
              fullWidth
              margin='normal'
              label='Address'
              name='address'
              value={formData.address}
              inputRef={addressRef}
              onChange={handleChange}
              multiline
              rows={4}
              onKeyDown={e => handleKeyDown(e, 'address')}
            />

            <Box mt={3} display='flex' gap={2}>
              <Button type='submit' variant='contained' fullWidth ref={submitRef}>
                {isEdit ? 'Update' : 'Submit'}
              </Button>
              <Button variant='outlined' fullWidth onClick={toggleDrawer}>
                Cancel
              </Button>
            </Box>
          </form>
        </Box>
      </Drawer>
    </ContentLayout>
  )
}
