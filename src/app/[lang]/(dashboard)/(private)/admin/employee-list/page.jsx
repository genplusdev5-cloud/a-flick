'use client'

import { useState, useRef, useEffect } from 'react'
import { openDB } from 'idb'
import { Box, Typography, Button, IconButton, Drawer, InputAdornment, TablePagination } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import DownloadIcon from '@mui/icons-material/Download'
import { MdDelete } from 'react-icons/md'
import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'

// IndexedDB Config
const dbName = 'EmployeeDB'
const storeName = 'employees'

export default function EmployeePage() {
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchText, setSearchText] = useState('')
  const [open, setOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    state: '',
    pincode: '',
    address1: '',
    address2: '',
    status: 'Active'
  })
  const [errors, setErrors] = useState({})

  // File upload states
  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)

  const nameRef = useRef(null)
  const submitRef = useRef(null)

  // IndexedDB Init
  const initDB = async () => {
    const db = await openDB(dbName, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true })
        }
      }
    })
    const allRows = await db.getAll(storeName)
    allRows.sort((a, b) => b.id - a.id)
    setRows(allRows)
  }

  useEffect(() => {
    initDB()
  }, [])

  const saveRow = async row => {
    const db = await openDB(dbName, 1)
    if (row.id) await db.put(storeName, row)
    else await db.add(storeName, row)
    const allRows = await db.getAll(storeName)
    allRows.sort((a, b) => b.id - a.id)
    setRows(allRows)
  }

  const deleteRowDB = async id => {
    const db = await openDB(dbName, 1)
    await db.delete(storeName, id)
    const allRows = await db.getAll(storeName)
    allRows.sort((a, b) => b.id - a.id)
    setRows(allRows)
  }

  const toggleDrawer = () => {
    setOpen(prev => !prev)
    setErrors({})
  }

  const handleAdd = () => {
    setIsEdit(false)
    setEditRow(null)
    setFormData({
      name: '',
      phone: '',
      email: '',
      city: '',
      state: '',
      pincode: '',
      address1: '',
      address2: '',
      status: 'Active'
    })
    setSelectedFile('')
    setErrors({})
    setOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setEditRow(row)
    setFormData(row)
    setSelectedFile(row.fileName || '')
    setErrors({})
    setOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  const handleDelete = row => deleteRowDB(row.id)
  const handleSearch = e => setSearchText(e.target.value)

  // Validation helpers
  const validateEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleNameChange = e => {
    const value = e.target.value.replace(/[^a-zA-Z\s]/g, '')
    setFormData(prev => ({ ...prev, name: value }))
    setErrors(prev => {
      const newErrors = { ...prev }
      if (!value) newErrors.name = 'Name is required'
      else delete newErrors.name
      return newErrors
    })
  }

  const handlePhoneChange = e => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 10) value = value.slice(0, 10)
    if (value.length > 5) value = value.slice(0, 5) + ' ' + value.slice(5)
    setFormData(prev => ({ ...prev, phone: value }))
    setErrors(prev => {
      const newErrors = { ...prev }
      if (value.replace(/\s/g, '').length !== 10) newErrors.phone = 'Phone must be 10 digits'
      else delete newErrors.phone
      return newErrors
    })
  }

  const handleEmailChange = e => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, email: value }))
    setErrors(prev => {
      const newErrors = { ...prev }
      if (!validateEmail(value)) newErrors.email = 'Invalid email'
      else delete newErrors.email
      return newErrors
    })
  }

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = e => {
    e.preventDefault()
    const tempErrors = {}
    if (!formData.name) tempErrors.name = 'Name is required'
    if (!formData.phone || formData.phone.replace(/\s/g, '').length !== 10) tempErrors.phone = 'Phone must be 10 digits'
    if (!formData.email || !validateEmail(formData.email)) tempErrors.email = 'Invalid email'
    setErrors(tempErrors)
    if (Object.keys(tempErrors).length > 0) return

    const rowData = { ...formData, fileName: selectedFile }

    if (isEdit && editRow) saveRow({ ...rowData, id: editRow.id })
    else saveRow(rowData)
    toggleDrawer()
  }

  // File upload handlers
  const handleFileChange = e => {
    const file = e.target.files[0]
    if (file) setSelectedFile(file.name)
  }

  const handleFileDrop = e => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) setSelectedFile(file.name)
    setIsDragOver(false)
  }

  // Filter & pagination
  const filteredRows = rows.filter(row =>
    Object.values(row).some(val =>
      String(val || '')
        .toLowerCase()
        .includes(searchText.toLowerCase())
    )
  )
  const paginatedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  const totalRows = filteredRows.length
  const startIndex = totalRows === 0 ? 0 : page * rowsPerPage + 1
  const endIndex = Math.min((page + 1) * rowsPerPage, totalRows)
  const paginationText = `Showing ${startIndex} to ${endIndex} of ${totalRows} entries`

  // Columns
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
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'phone', headerName: 'Phone', flex: 0.8 },
    { field: 'email', headerName: 'Email', flex: 1 },
    { field: 'city', headerName: 'City', flex: 0.6 },
    { field: 'state', headerName: 'State', flex: 0.6 },
    { field: 'pincode', headerName: 'Pin Code', flex: 0.6 },
    { field: 'address1', headerName: 'Address 1', flex: 1 },
    { field: 'address2', headerName: 'Address 2', flex: 1 },
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
      title='Employee List'
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Employee' }]}
      actions={
        <Box sx={{ m: 2, display: 'flex', gap: 2 }}>
          <Button variant='outlined' startIcon={<DownloadIcon />} onClick={() => {}}>
            Export
          </Button>
          <Button variant='contained' startIcon={<AddIcon />} onClick={handleAdd}>
            Add Employee
          </Button>
        </Box>
      }
    >
      {/* Search */}
      <Box sx={{ p: 2, pt: 0, display: 'flex', alignItems: 'center', mt: 5 }}>
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

      {/* Table */}
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
            overflowWrap: 'break-word',
            alignItems: 'flex-start',
            fontSize: '15px'
          },
          '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
          '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': { outline: 'none' },
          '& .MuiDataGrid-columnHeaderTitle': { fontSize: '15px', fontWeight: 500 }
        }}
      />

      {/* Pagination */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
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

      {/* Drawer Form */}
      <Drawer anchor='right' open={open} onClose={toggleDrawer}>
        <Box sx={{ width: 400, p: 3 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6'>{isEdit ? 'Edit Employee' : 'Add Employee'}</Typography>
            <IconButton onClick={toggleDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>

          <form onSubmit={handleSubmit}>
            {/* Name, Phone, Email */}
            <CustomTextField
              fullWidth
              margin='normal'
              label={
                <span>
                  Name <span style={{ color: 'red' }}>*</span>
                </span>
              }
              name='name'
              value={formData.name}
              onChange={handleNameChange}
              inputRef={nameRef}
              error={!!errors.name}
              helperText={errors.name}
            />
            <CustomTextField
              fullWidth
              margin='normal'
              label={
                <span>
                  Phone <span style={{ color: 'red' }}>*</span>
                </span>
              }
              name='phone'
              value={formData.phone}
              onChange={handlePhoneChange}
              error={!!errors.phone}
              helperText={errors.phone}
            />
            <CustomTextField
              fullWidth
              margin='normal'
              label={
                <span>
                  Email <span style={{ color: 'red' }}>*</span>
                </span>
              }
              name='email'
              value={formData.email}
              onChange={handleEmailChange}
              error={!!errors.email}
              helperText={errors.email}
            />

            {/* City, State, Pin Code */}
            <CustomTextField
              fullWidth
              margin='normal'
              label='City'
              name='city'
              value={formData.city}
              onChange={e => setFormData(prev => ({ ...prev, city: e.target.value.replace(/[^a-zA-Z\s]/g, '') }))}
            />
            <CustomTextField
              fullWidth
              margin='normal'
              label='State'
              name='state'
              value={formData.state}
              onChange={e => setFormData(prev => ({ ...prev, state: e.target.value.replace(/[^a-zA-Z\s]/g, '') }))}
            />
            <CustomTextField
              fullWidth
              margin='normal'
              label='Pin Code'
              name='pincode'
              value={formData.pincode}
              onChange={e => setFormData(prev => ({ ...prev, pincode: e.target.value.replace(/\D/g, '') }))}
            />

            {/* Address */}
            <CustomTextField
              fullWidth
              margin='normal'
              label='Address 1'
              name='address1'
              multiline
              rows={3}
              value={formData.address1}
              onChange={handleChange}
            />
            <CustomTextField
              fullWidth
              margin='normal'
              label='Address 2'
              name='address2'
              multiline
              rows={3}
              value={formData.address2}
              onChange={handleChange}
            />

            {/* File Upload */}
            {/* File Upload */}
            {/* File Upload */}
            <Box>
              {/* Label using CustomTextField (hidden input, just for label) */}
              <CustomTextField
                label='Upload File'
                fullWidth
                margin='normal'
                InputProps={{
                  readOnly: true
                }}
                value=''
                sx={{
                  '& .MuiInputBase-root': {
                    display: 'none'
                  }
                }}
              />

              {/* Actual hidden file input */}
              <input type='file' ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />

              {/* Upload button with black border */}
              <Button
                variant='outlined'
                fullWidth
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDragLeave={e => e.preventDefault()}
                onDrop={handleFileDrop}
                sx={{
                  borderColor: 'black', // always black
                  borderStyle: 'solid',
                  borderWidth: 1,
                  justifyContent: 'space-between',
                  py: 1.5
                }}
              >
                <Typography sx={{ color: selectedFile ? 'text.primary' : 'text.disabled' }}>
                  {selectedFile || 'Choose File or Drag & Drop Here'}
                </Typography>
                <Typography variant='body2' color='primary'>
                  Browse
                </Typography>
              </Button>
            </Box>

            {/* Status */}
            {isEdit && (
              <CustomTextField
                fullWidth
                margin='normal'
                label='Status'
                name='status'
                select
                SelectProps={{ native: true }}
                value={formData.status}
                onChange={handleChange}
              >
                <option value='Active'>Active</option>
                <option value='Inactive'>Inactive</option>
              </CustomTextField>
            )}

            {/* Submit Buttons */}
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
