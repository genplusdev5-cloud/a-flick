'use client'

import { useState, useRef, useEffect } from 'react'
import { Box, Typography, Button, IconButton, Drawer, InputAdornment, TablePagination, MenuItem } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { Autocomplete, TextField } from '@mui/material'
import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'
import { openDB } from 'idb'

export default function SupplierPage() {
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchText, setSearchText] = useState('')
  const [open, setOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [formData, setFormData] = useState({ type: '', name: '', address: '', status: 'Active' })

  const submitRef = useRef(null)
  const typeRef = useRef(null)
  const nameRef = useRef(null)
  const addressRef = useRef(null)
  const statusRef = useRef(null)

  const supplierTypes = ['Stock', 'Supplier', 'Vehicle', 'Adjustment', 'Opening Stock']
  const statusOptions = ['Active', 'Inactive']

  // Initialize DB
  const initDB = async () => {
    return openDB('supplierDB', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('suppliers')) {
          db.createObjectStore('suppliers', { keyPath: 'id', autoIncrement: true })
        }
      }
    })
  }

  // Load suppliers from IndexedDB on mount
  useEffect(() => {
    const loadSuppliers = async () => {
      const db = await initDB()
      const all = await db.getAll('suppliers')
      setRows(all)
    }
    loadSuppliers()
  }, [])

  const toggleDrawer = () => setOpen(prev => !prev)
  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value })
  const handleSearch = e => setSearchText(e.target.value)

  const handleAdd = () => {
    setIsEdit(false)
    setEditRow(null)
    setFormData({ type: '', name: '', address: '', status: 'Active' })
    setOpen(true)
    setTimeout(() => typeRef.current?.focus(), 100)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setEditRow(row)
    setFormData({ ...row })
    setOpen(true)
    setTimeout(() => typeRef.current?.focus(), 100)
  }

  const handleDelete = async row => {
    const db = await initDB()
    await db.delete('suppliers', row.id)
    setRows(prev => prev.filter(r => r.id !== row.id))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!formData.name || !formData.type) return
    const db = await initDB()

    if (isEdit && editRow) {
      const updatedRow = { ...editRow, ...formData }
      await db.put('suppliers', updatedRow)
      setRows(prev => prev.map(r => (r.id === editRow.id ? updatedRow : r)))
    } else {
      const id = await db.add('suppliers', formData)
      setRows(prev => [{ ...formData, id }, ...prev])
    }
    toggleDrawer()
  }

  const focusNext = ref => ref?.current?.focus()
  const handleKeyPress = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (nextRef) focusNext(nextRef)
      else submitRef.current?.focus()
    }
  }

  const filteredRows = rows.filter(
    row =>
      row.name.toLowerCase().includes(searchText.toLowerCase()) || row.id.toString().includes(searchText.toLowerCase())
  )

  const paginatedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  const totalRows = filteredRows.length
  const startIndex = totalRows === 0 ? 0 : page * rowsPerPage + 1
  const endIndex = Math.min((page + 1) * rowsPerPage, totalRows)
  const paginationText = `Showing ${startIndex} to ${endIndex} of ${totalRows} entries`

  const columns = [
    {
      field: 'serial',
      headerName: 'S.No',
      flex: 0.2,
      valueGetter: params => filteredRows.findIndex(r => r.id === params.row.id) + 1,
      sortable: false
    },
    {
      field: 'action',
      headerName: 'Action',
      flex: 0.5,
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size='small' onClick={() => handleDelete(params.row)}>
            <DeleteIcon style={{ color: 'red' }} />
          </IconButton>
          <IconButton size='small' onClick={() => handleEdit(params.row)}>
            <EditIcon />
          </IconButton>
        </Box>
      )
    },
    { field: 'name', headerName: 'Supplier Name', flex: 1.5 },
    { field: 'type', headerName: 'Supplier Type', flex: 1 },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.5,
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

  return (
    <ContentLayout
      title='Suppliers'
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Suppliers' }]}
      actions={
        <Box sx={{ m: 2, display: 'flex', gap: 2 }}>
          <Button variant='contained' startIcon={<AddIcon />} onClick={handleAdd}>
            Add Supplier
          </Button>
        </Box>
      }
    >
      {/* Search */}
      <Box sx={{ p: 2, pt: 0, mt: 5, display: 'flex', justifyContent: 'flex-start' }}>
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

      {/* DataGrid */}
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

      {/* Pagination */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pr: 2 }}>
        <Typography variant='body2' sx={{ color: 'text.secondary', ml: 1 }}>
          {paginationText}
        </Typography>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component='div'
          count={filteredRows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={e => {
            setRowsPerPage(parseInt(e.target.value, 10))
            setPage(0)
          }}
        />
      </Box>

      {/* Drawer */}
      <Drawer anchor='right' open={open} onClose={toggleDrawer}>
        <Box sx={{ width: 360, p: 3 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6'>{isEdit ? 'Edit Supplier' : 'Add Supplier'}</Typography>
            <IconButton onClick={toggleDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>
          <form onSubmit={handleSubmit}>
            <Autocomplete
              freeSolo={false} // strictly allow only predefined options
              options={supplierTypes}
              value={formData.type}
              onChange={(event, newValue) => setFormData({ ...formData, type: newValue || '' })}
              renderInput={params => (
                <CustomTextField
                  {...params}
                  fullWidth
                  margin='normal'
                  label='Supplier Type'
                  inputRef={typeRef}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      // Only move to next field if the typed value is valid
                      if (supplierTypes.includes(formData.type)) {
                        focusNext(nameRef)
                      }
                      // Do nothing if invalid, stay in field
                    }
                  }}
                />
              )}
            />

            <CustomTextField
              fullWidth
              margin='normal'
              label='Supplier Name'
              name='name'
              value={formData.name}
              inputRef={nameRef}
              onChange={handleChange}
              onKeyDown={e => handleKeyPress(e, addressRef)}
            />
            <CustomTextField
              fullWidth
              multiline
              rows={3}
              margin='normal'
              label='Billing Address'
              name='address'
              value={formData.address}
              inputRef={addressRef}
              onChange={handleChange}
              onKeyDown={e => handleKeyPress(e, isEdit ? statusRef : submitRef)}
            />
            {isEdit && (
              <CustomTextField
                select
                fullWidth
                margin='normal'
                label='Status'
                name='status'
                value={formData.status}
                inputRef={statusRef}
                onChange={handleChange}
                onKeyDown={e => handleKeyPress(e, submitRef)}
              >
                {statusOptions.map(opt => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </CustomTextField>
            )}
            <Box mt={3} display='flex' gap={2}>
              <Button type='submit' variant='contained' fullWidth ref={submitRef}>
                {isEdit ? 'Update' : 'Save'}
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
