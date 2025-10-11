'use client'

import { useState, useEffect, useRef } from 'react'
import { openDB } from 'idb'
import {
  Box,
  Button,
  IconButton,
  Drawer,
  InputAdornment,
  Typography,
  TablePagination,
  MenuItem,
  Autocomplete
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'

// Icons
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import DownloadIcon from '@mui/icons-material/Download'
import { MdDelete } from 'react-icons/md'
import CustomTextField from '@core/components/mui/TextField'

// Layout wrapper
import ContentLayout from '@/components/layout/ContentLayout'

export default function BillingFrequencyPage() {
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchText, setSearchText] = useState('')
  const [open, setOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [formData, setFormData] = useState({
    displayFrequency: '',
    frequencyCode: '',
    description: '',
    sortOrder: '',
    status: 'Active',
    incrementType: '',
    noOfIncrements: '',
    backlogAge: ''
  })
  const [incrementTypeOpen, setIncrementTypeOpen] = useState(false)

  const DB_NAME = 'billing_frequency_db'
  const STORE_NAME = 'frequencies'

  // ---------------- Refs for keyboard navigation ----------------
  const incrementTypeRef = useRef(null)
  const noOfIncrementsRef = useRef(null)
  const backlogAgeRef = useRef(null)
  const frequencyCodeRef = useRef(null)
  const displayFrequencyRef = useRef(null)
  const sortOrderRef = useRef(null)
  const descriptionRef = useRef(null)
  const statusRef = useRef(null)
  const submitRef = useRef(null)

  const toggleDrawer = () => setOpen(prev => !prev)
  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value })
  const handleSearch = e => setSearchText(e.target.value)

  // ---------------- IndexedDB ----------------
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
    const allRows = await db.getAll(STORE_NAME)
    setRows(allRows.sort((a, b) => b.id - a.id))
  }

  useEffect(() => {
    loadRows()
  }, [])

  // ---------------- CRUD ----------------
  const handleAdd = () => {
    setIsEdit(false)
    setEditRow(null)
    setFormData({
      displayFrequency: '',
      frequencyCode: '',
      description: '',
      sortOrder: '',
      status: 'Active',
      incrementType: '',
      noOfIncrements: '',
      backlogAge: ''
    })
    setOpen(true)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setEditRow(row)
    setFormData({
      displayFrequency: '',
      frequencyCode: '',
      description: '',
      sortOrder: '',
      status: 'Active',
      incrementType: '',
      noOfIncrements: '',
      backlogAge: '',
      ...row
    })
    setOpen(true)
  }

  const handleDelete = async row => {
    const db = await initDB()
    await db.delete(STORE_NAME, row.id)
    setRows(prev => prev.filter(r => r.id !== row.id))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const db = await initDB()
    if (isEdit && editRow) {
      const updatedRow = { ...editRow, ...formData }
      await db.put(STORE_NAME, updatedRow)
      setRows(prev => prev.map(r => (r.id === editRow.id ? updatedRow : r)))
    } else {
      const id = await db.add(STORE_NAME, { ...formData })
      setRows(prev => [{ id, ...formData }, ...prev])
    }
    toggleDrawer()
  }

  // ---------------- Keyboard navigation ----------------
  const focusNext = ref => ref?.current?.focus()

  // ---------------- Filtering & Pagination ----------------
  const filteredRows = rows.filter(
    row =>
      row.displayFrequency?.toLowerCase().includes(searchText.toLowerCase()) ||
      row.frequencyCode?.toLowerCase().includes(searchText.toLowerCase()) ||
      row.incrementType?.toLowerCase().includes(searchText.toLowerCase())
  )
  const paginatedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  const totalRows = filteredRows.length
  const startIndex = totalRows === 0 ? 0 : page * rowsPerPage + 1
  const endIndex = Math.min((page + 1) * rowsPerPage, totalRows)
  const paginationText = `Showing ${startIndex} to ${endIndex} of ${totalRows} entries`

  // ---------------- Columns ----------------
  const columns = [
    { field: 'serial', headerName: 'S.No', flex: 0.2, valueGetter: params => filteredRows.findIndex(r => r.id === params.row.id) + 1, sortable: false },
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
    { field: 'displayFrequency', headerName: 'Display Frequency', flex: 1 },
    { field: 'frequencyCode', headerName: 'Frequency Code', flex: 1 },
    { field: 'description', headerName: 'Description', flex: 1 },
    { field: 'sortOrder', headerName: 'Sort Order', flex: 0.7 },
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
      title='Billing Frequency'
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Billing Frequency' }]}
      actions={
        <Box sx={{ m: 2, display: 'flex', gap: 2 }}>
          <Button variant='outlined' startIcon={<DownloadIcon />}>
            Export
          </Button>
          <Button variant='contained' startIcon={<AddIcon />} onClick={handleAdd}>
            Add Billing Frequency
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
          '& .MuiDataGrid-cell': { whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', alignItems: 'flex-start', fontSize: '15px' },
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

      {/* Drawer Form */}
      <Drawer anchor='right' open={open} onClose={toggleDrawer}>
        <Box sx={{ width: 360, p: 3 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6'>{isEdit ? 'Edit Billing Frequency' : 'Add New Billing Frequency'}</Typography>
            <IconButton onClick={toggleDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>

          <form onSubmit={handleSubmit}>
            {/* Increment Type */}
            <Autocomplete
              ref={incrementTypeRef}
              freeSolo={false}
              options={['Year', 'Month', 'Week', 'Day', 'Others']}
              value={formData.incrementType}
              open={incrementTypeOpen}
              onOpen={() => setIncrementTypeOpen(true)}
              onClose={() => setIncrementTypeOpen(false)}
              onFocus={() => setIncrementTypeOpen(true)}
              onInputChange={(e, newValue, reason) => {
                if (reason === 'input' && !['Year', 'Month', 'Week', 'Day', 'Others'].includes(newValue)) return
                setFormData(prev => ({ ...prev, incrementType: newValue }))
              }}
              onChange={(e, newValue) => setFormData(prev => ({ ...prev, incrementType: newValue }))}
              noOptionsText='No options'
              renderInput={params => (
                <CustomTextField
                  label='Increment Type'
                  {...params}
                  inputProps={{
                    ...params.inputProps,
                    onKeyDown: e => {
                      if (e.key === 'Enter' && ['Year', 'Month', 'Week', 'Day', 'Others'].includes(formData.incrementType)) {
                        e.preventDefault()
                        focusNext(noOfIncrementsRef)
                      } else if (e.key === 'Enter') e.preventDefault()
                    }
                  }}
                  sx={{ minWidth: 200 }}
                />
              )}
            />

            {/* Other fields */}
            <CustomTextField inputRef={noOfIncrementsRef} fullWidth margin='normal' label='No of Increments' name='noOfIncrements' value={formData.noOfIncrements} onChange={e => /^\d*$/.test(e.target.value) && handleChange(e)} inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', onKeyDown: e => { if (e.key === 'Enter') { e.preventDefault(); focusNext(backlogAgeRef) } } }} />
            <CustomTextField inputRef={backlogAgeRef} fullWidth margin='normal' label='Backlog Age' name='backlogAge' value={formData.backlogAge} onChange={e => /^\d*$/.test(e.target.value) && handleChange(e)} inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', onKeyDown: e => { if (e.key === 'Enter') { e.preventDefault(); focusNext(frequencyCodeRef) } } }} />
            <CustomTextField inputRef={frequencyCodeRef} fullWidth margin='normal' label='Frequency Code' name='frequencyCode' value={formData.frequencyCode} onChange={handleChange} inputProps={{ onKeyDown: e => { if (e.key === 'Enter') { e.preventDefault(); focusNext(displayFrequencyRef) } } }} />
            <CustomTextField inputRef={displayFrequencyRef} fullWidth margin='normal' label='Display Frequency' name='displayFrequency' value={formData.displayFrequency} onChange={handleChange} inputProps={{ onKeyDown: e => { if (e.key === 'Enter') { e.preventDefault(); focusNext(sortOrderRef) } } }} />
            <CustomTextField inputRef={sortOrderRef} fullWidth margin='normal' label='Sort Order' name='sortOrder' value={formData.sortOrder} onChange={e => /^\d*$/.test(e.target.value) && handleChange(e)} inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', onKeyDown: e => { if (e.key === 'Enter') { e.preventDefault(); focusNext(descriptionRef) } } }} />
            <CustomTextField inputRef={descriptionRef} fullWidth margin='normal' multiline rows={3} label='Description' name='description' value={formData.description} onChange={handleChange} inputProps={{ onKeyDown: e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); isEdit ? focusNext(statusRef) : focusNext(submitRef) } } }} />

            {/* Status - only editable when editing */}
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

            <Box mt={3} display='flex' gap={2}>
              <Button type='submit' variant='contained' fullWidth ref={submitRef} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(e) } }}>
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
