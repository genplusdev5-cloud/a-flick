'use client'

import { useState, useRef, useEffect } from 'react'
import { openDB } from 'idb'
import {
  Box,
  Typography,
  Button,
  IconButton,
  Drawer,
  InputAdornment,
  TablePagination,
  Autocomplete,MenuItem
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { MdDelete } from 'react-icons/md'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import DownloadIcon from '@mui/icons-material/Download'
import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'

export default function ChemicalsPage() {
  // ---------------- State ----------------
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchText, setSearchText] = useState('')
  const [open, setOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    dosage: '',
    ingredients: '',
    status: 'Active',
    file: ''
  })
  const [unitOpen, setUnitOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)

  const unitOptions = ['kg', 'litre', 'bottle', 'pkt', 'box']
  const statusOptions = ['Active', 'Inactive']

  // File Upload
  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)

  // Keyboard Refs
  const nameRef = useRef(null)
  const unitRef = useRef(null)
  const dosageRef = useRef(null)
  const ingredientsRef = useRef(null)
  const statusRef = useRef(null)
  const submitRef = useRef(null)

  // ---------------- IndexedDB ----------------
  const DB_NAME = 'chemicals_db'
  const STORE_NAME = 'chemicals'

  const initDB = async () => {
    const db = await openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
        }
      }
    })
    return db
  }

  const loadRows = async () => {
    const db = await initDB()
    const all = await db.getAll(STORE_NAME)
    setRows(all.sort((a, b) => b.id - a.id))
  }

  useEffect(() => {
    loadRows()
  }, [])

  // ---------------- CRUD ----------------
  const toggleDrawer = () => setOpen(prev => !prev)

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleAdd = () => {
    setIsEdit(false)
    setFormData({ name: '', unit: '', dosage: '', ingredients: '', status: 'Active', file: '' })
    setSelectedFile('')
    setOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setEditRow(row)
    setFormData(row)
    setSelectedFile(row.file || '')
    setOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  const handleDelete = async row => {
    const db = await initDB()
    await db.delete(STORE_NAME, row.id)
    setRows(prev => prev.filter(r => r.id !== row.id))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const db = await initDB()
    const dataToSave = { ...formData, file: selectedFile }

    if (isEdit && editRow) {
      await db.put(STORE_NAME, { ...editRow, ...dataToSave })
      setRows(prev => prev.map(r => (r.id === editRow.id ? { ...editRow, ...dataToSave } : r)))
    } else {
      const id = await db.add(STORE_NAME, dataToSave)
      setRows(prev => [{ id, ...dataToSave }, ...prev])
    }
    toggleDrawer()
  }

  // ---------------- File Upload ----------------
  const handleFileChange = e => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file.name)
      setFormData(prev => ({ ...prev, file: file.name }))
    }
  }

  const handleFileDrop = e => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      setSelectedFile(file.name)
      setFormData(prev => ({ ...prev, file: file.name }))
    }
  }

  // ---------------- Keyboard Navigation ----------------
  const focusNext = ref => ref?.current?.focus()

  // ---------------- Search & Pagination ----------------
  const handleSearch = e => setSearchText(e.target.value)

  const filteredRows = rows.filter(
    row =>
      row.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      row.unit?.toLowerCase().includes(searchText.toLowerCase()) ||
      row.ingredients?.toLowerCase().includes(searchText.toLowerCase())
  )

  const paginatedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const totalRows = filteredRows.length
  const startIndex = totalRows === 0 ? 0 : page * rowsPerPage + 1
  const endIndex = Math.min((page + 1) * rowsPerPage, totalRows)
  const paginationText = `Showing ${startIndex} to ${endIndex} of ${totalRows} entries`

  // ---------------- Columns ----------------
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
            <MdDelete style={{ color: 'red' }} />
          </IconButton>
          <IconButton size='small' onClick={() => handleEdit(params.row)}>
            <EditIcon />
          </IconButton>
        </Box>
      )
    },
    { field: 'name', headerName: 'Chemical Name', flex: 1 },
    { field: 'unit', headerName: 'Unit', flex: 0.6 },
    { field: 'dosage', headerName: 'Dosage', flex: 0.6 },
    { field: 'ingredients', headerName: 'Ingredients', flex: 1 },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.6,
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
      title='Chemicals'
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Chemicals' }]}
      actions={
        <Box sx={{ m: 2, display: 'flex', gap: 2 }}>
          <Button variant='outlined' startIcon={<DownloadIcon />}>
            Export
          </Button>
          <Button variant='contained' startIcon={<AddIcon />} onClick={handleAdd}>
            Add Chemical
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
          '& .MuiDataGrid-row': {
            minHeight: '60px !important',
            padding: '12px 0'
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
          '& .MuiDataGrid-columnHeaderTitle': {
            fontSize: '15px',
            fontWeight: 500
          }
        }}
      />

      {/* Pagination Footer */}
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

      {/* Drawer Form */}
      <Drawer anchor='right' open={open} onClose={toggleDrawer}>
        <Box sx={{ width: 360, p: 3 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6'>{isEdit ? 'Edit Chemical' : 'Add New Chemical'}</Typography>
            <IconButton onClick={toggleDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>

          <form onSubmit={handleSubmit}>
            <CustomTextField
              inputRef={nameRef}
              fullWidth
              margin='normal'
              label='Chemical Name'
              name='name'
              value={formData.name}
              sx={{ mt: 2 }}
              onChange={handleChange}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  // Move focus to Unit field & open dropdown
                  setTimeout(() => {
                    unitRef.current?.querySelector('input')?.focus()
                    setUnitOpen(true)
                  }, 100)
                }
              }}
            />

            {/* Unit */}
            <Autocomplete
              ref={unitRef}
              freeSolo={false}
              options={unitOptions}
              value={formData.unit}
              open={unitOpen}
              onOpen={() => setUnitOpen(true)}
              onClose={() => setUnitOpen(false)}
              onFocus={() => setUnitOpen(true)}
              sx={{ mt: 5 }}
              onInputChange={(e, newValue, reason) => {
                if (reason === 'input' && !unitOptions.includes(newValue)) return
                setFormData(prev => ({ ...prev, unit: newValue }))
              }}
              onChange={(e, newValue) => setFormData(prev => ({ ...prev, unit: newValue }))}
              noOptionsText='No options'
              renderInput={params => (
                <CustomTextField
                  {...params}
                  label='Unit'
                  inputProps={{
                    ...params.inputProps,
                    onKeyDown: e => {
                      if (e.key === 'Enter' && unitOptions.includes(formData.unit)) {
                        e.preventDefault()
                        focusNext(dosageRef)
                      } else if (e.key === 'Enter') {
                        e.preventDefault()
                      }
                    }
                  }}
                />
              )}
            />

            {/* File Upload */}
            <Box sx={{ mt: 4 }}>
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
              <input type='file' ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
              <Button
                variant='outlined'
                fullWidth
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDragLeave={e => e.preventDefault()}
                onDrop={handleFileDrop}
                sx={{
                  borderColor: 'black',
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

            {/* Dosage */}
            <CustomTextField
              inputRef={dosageRef}
              fullWidth
              margin='normal'
              label='Dosage'
              name='dosage'
              value={formData.dosage}
              sx={{ mt: 5 }}
              onChange={e => /^\d*$/.test(e.target.value) && handleChange(e)}
              inputProps={{
                inputMode: 'numeric',
                pattern: '[0-9]*',
                onKeyDown: e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    focusNext(ingredientsRef)
                  }
                }
              }}
            />

            {/* Ingredients */}
            <CustomTextField
              inputRef={ingredientsRef}
              fullWidth
              margin='normal'
              multiline
              rows={3}
              sx={{ mt: 5 }}
              label='Ingredients'
              name='ingredients'
              value={formData.ingredients}
              onChange={handleChange}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  setTimeout(() => {
                    if (isEdit) focusNext(statusRef)
                    else focusNext(submitRef)
                  }, 100)
                }
              }}
            />

            {/* Status - Only show when editing */}
             {isEdit && (
              <CustomTextField
                select
                fullWidth
                margin='normal'
                label='Status'
                value={formData.status}
                inputRef={statusRef}
                onChange={async e => {
                  const newStatus = e.target.value
                  setFormData(prev => ({ ...prev, status: newStatus }))
                  if (editRow) {
                    const updatedRow = { ...editRow, status: newStatus }
                    setRows(prev => prev.map(r => (r.id === editRow.id ? updatedRow : r)))
                    const db = await initDB()
                    await db.put(STORE_NAME, updatedRow)
                  }
                }}
                inputProps={{
                  onKeyDown: e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      focusNext(submitRef)
                    }
                  }
                }}
              >
                <MenuItem value='Active'>Active</MenuItem>
                <MenuItem value='Inactive'>Inactive</MenuItem>
              </CustomTextField>
            )}

            {/* Submit / Cancel */}
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
