'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Box,
  Button,
  IconButton,
  Drawer,
  InputAdornment,
  Typography,
  TablePagination
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import Autocomplete from '@mui/material/Autocomplete'

// Icons
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'

// Wrapper
import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'

// ---------------------------
// IndexedDB helper functions
// ---------------------------
const DB_NAME = 'SupplierDB'
const STORE_NAME = 'Suppliers'
const DB_VERSION = 1

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = function (event) {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
    request.onsuccess = function (event) {
      resolve(event.target.result)
    }
    request.onerror = function () {
      reject('IndexedDB error')
    }
  })
}

function getAllSuppliers(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function saveSupplier(db, supplier) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(supplier)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function deleteSupplier(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// ---------------------------
// Main Component
// ---------------------------
export default function SupplierPage() {
  const [db, setDb] = useState(null)
  const [rows, setRows] = useState([])
  const [open, setOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [formData, setFormData] = useState({ type: '', name: '', address: '' })
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const typeRef = useRef(null)
  const nameRef = useRef(null)
  const addressRef = useRef(null)
  const typeOptions = ['Stock', 'Supplier', 'Vehicle', 'Adjustment', 'Opening Stock']

  // ---------------------------
  // Load DB and suppliers
  // ---------------------------
  useEffect(() => {
    async function initDB() {
      const database = await openDB()
      setDb(database)
      const suppliers = await getAllSuppliers(database)
      // show latest added on top
      setRows(suppliers.sort((a, b) => b.id - a.id))
    }
    initDB()
  }, [])

  // ---------------------------
  // Handlers
  // ---------------------------
  const toggleDrawer = () => setOpen(prev => !prev)
  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value })
  const handleAutocompleteChange = (name, newValue) => {
    setFormData(prev => ({ ...prev, [name]: newValue || '' }))
    setTimeout(() => nameRef.current?.focus(), 150)
  }

  const handleAdd = () => {
    setIsEdit(false)
    setFormData({ type: '', name: '', address: '' })
    setEditRow(null)
    setOpen(true)
    setTimeout(() => typeRef.current?.focus(), 200)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setEditRow(row)
    setFormData({ type: row.type, name: row.name, address: row.address || '' })
    setOpen(true)
    setTimeout(() => typeRef.current?.focus(), 200)
  }

  const handleDelete = async id => {
    if (!db) return
    await deleteSupplier(db, id)
    setRows(prev => prev.filter(r => r.id !== id))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!formData.name || !formData.type || !db) return

    let supplierData = { ...formData, status: 'Active' }

    if (isEdit && editRow) {
      supplierData.id = editRow.id
    }

    const id = await saveSupplier(db, supplierData)
    // reload rows from db
    const suppliers = await getAllSuppliers(db)
    setRows(suppliers.sort((a, b) => b.id - a.id))
    setFormData({ type: '', name: '', address: '' })
    toggleDrawer()
  }

  const handleSearch = e => setSearchText(e.target.value)
  const filteredRows = rows.filter(
    row =>
      row.name.toLowerCase().includes(searchText.toLowerCase()) ||
      row.id.toString().includes(searchText.toLowerCase()) ||
      row.type.toLowerCase().includes(searchText.toLowerCase())
  )
  const paginatedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  const totalRows = filteredRows.length
  const startIndex = totalRows === 0 ? 0 : page * rowsPerPage + 1
  const endIndex = Math.min((page + 1) * rowsPerPage, totalRows)
  const paginationText = `Showing ${startIndex} to ${endIndex} of ${totalRows} entries`

  // ---------------------------
  // Columns
  // ---------------------------
  const columns = [
    { field: 'serial', headerName: 'S.No', flex: 0.2, minWidth: 80, valueGetter: params => filteredRows.findIndex(r => r.id === params.row.id) + 1, sortable: false },
    {
      field: 'action',
      headerName: 'Action',
      minWidth: 120,
      flex: 0.5,
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" onClick={() => handleEdit(params.row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    },
    { field: 'name', headerName: 'Supplier Name', flex: 1, minWidth: 200 },
    { field: 'type', headerName: 'Supplier Type', flex: 1, minWidth: 160 },
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 140,
      flex: 0.5,
      renderCell: params => (
        <Button size='small' variant='contained' color={params.value === 'Active' ? 'success' : 'error'} sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 500 }}>
          {params.value}
        </Button>
      )
    }
  ]

  // ---------------------------
  // Render
  // ---------------------------
  return (
    <ContentLayout
      title="Suppliers"
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Suppliers' }]}
      actions={
        <Box sx={{ m: 2, display: 'flex', gap: 2 }}>
          <Button variant='outlined' startIcon={<DownloadIcon />}>Export</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>Add Supplier</Button>
        </Box>
      }
    >
      <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', mt: 5 }}>
        <CustomTextField
          size='small'
          placeholder='Search'
          value={searchText}
          onChange={handleSearch}
          sx={{ width: 360 }}
          slotProps={{ input: { startAdornment: <InputAdornment position='start'><SearchIcon /></InputAdornment> } }}
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
          '& .MuiDataGrid-row': { minHeight: '60px !important', padding: '12px 0' },
          '& .MuiDataGrid-cell': { whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', alignItems: 'flex-start', fontSize: '15px' },
          '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
          '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': { outline: 'none' },
          '& .MuiDataGrid-columnHeaderTitle': { fontSize: '15px', fontWeight: 500 }
        }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
        <Typography variant='body2' sx={{ color: 'text.secondary', ml: 1 }}>{paginationText}</Typography>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component='div'
          count={filteredRows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0) }}
        />
      </Box>

      <Drawer anchor="right" open={open} onClose={toggleDrawer}>
        <Box sx={{ width: 350, p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">{isEdit ? 'Edit Supplier' : 'Add Supplier'}</Typography>
            <IconButton onClick={toggleDrawer}><CloseIcon /></IconButton>
          </Box>

          <form onSubmit={handleSubmit}>
            <Autocomplete
              disableClearable
              options={typeOptions}
              value={formData.type}
              onChange={(e, newValue) => handleAutocompleteChange('type', newValue)}
              renderInput={params => <CustomTextField {...params} label="Supplier Type" margin="normal" fullWidth inputRef={typeRef} />}
              noOptionsText="No options"
            />
            <CustomTextField
              fullWidth
              label="Supplier Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              margin="normal"
              inputRef={nameRef}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addressRef.current?.focus() } }}
            />
            <CustomTextField
              fullWidth
              multiline
              rows={3}
              label="Billing Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              margin="normal"
              inputRef={addressRef}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(e) } }}
            />
            <Box mt={3} display="flex" gap={2}>
              <Button type="submit" variant="contained" fullWidth>{isEdit ? 'Update' : 'Save'}</Button>
              <Button variant="outlined" fullWidth onClick={toggleDrawer}>Cancel</Button>
            </Box>
          </form>
        </Box>
      </Drawer>
    </ContentLayout>
  )
}
