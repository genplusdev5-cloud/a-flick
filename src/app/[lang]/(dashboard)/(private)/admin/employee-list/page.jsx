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
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

// 📅 Format date as DD/MM/YYYY
const formatDate = date => {
  if (!date) return ''
  const d = new Date(date)
  const day = ('0' + d.getDate()).slice(-2)
  const month = ('0' + (d.getMonth() + 1)).slice(-2)
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

// 🧠 Parse date for editing
const parseDateForEdit = value => {
  if (typeof value === 'number') return new Date(value)
  if (value instanceof Date) return value
  return null
}

export default function EmployeePage() {
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchText, setSearchText] = useState('')
  const [open, setOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [formData, setFormData] = useState({
    client: '',
    total: '',
    issued_date: null,
    balance: '',
    invoice_status: 'Pending',
    status: 'Active'
  })

  const clientRef = useRef(null)
  const totalRef = useRef(null)
  const datePickerRef = useRef(null)
  const balanceRef = useRef(null)
  const submitRef = useRef(null)

  const dbName = 'EmployeeDB'
  const storeName = 'employees'

  // 📂 IndexedDB init + load
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
    // Convert Date object to timestamp (number) for storage
    const issuedTimestamp = row.issued_date instanceof Date ? row.issued_date.getTime() : null
    const rowToSave = { ...row, issued_date: issuedTimestamp }
    if (row.id) await db.put(storeName, rowToSave)
    else await db.add(storeName, rowToSave)
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

  const toggleDrawer = () => setOpen(prev => !prev)
  const handleAdd = () => {
    setIsEdit(false)
    setEditRow(null)
    setFormData({
      client: '',
      total: '',
      issued_date: null,
      balance: '',
      invoice_status: 'Pending',
      status: 'Active'
    })
    setOpen(true)
    setTimeout(() => clientRef.current?.focus(), 100)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setEditRow(row)
    // Convert timestamp (number) back to Date object for the date picker
    const dateObject = parseDateForEdit(row.issued_date)
    setFormData({ ...row, issued_date: dateObject })
    setOpen(true)
    setTimeout(() => clientRef.current?.focus(), 100)
  }

  const handleDelete = row => deleteRowDB(row.id)
  const handleSearch = e => setSearchText(e.target.value)

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleClientChange = e => {
    // Only allow letters and spaces
    const value = e.target.value.replace(/[^a-zA-Z\s]/g, '')
    setFormData(prev => ({ ...prev, client: value }))
  }

  const handleNumberChange = (e, field) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^0-9]/g, '')
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = e => {
    e.preventDefault()
    // Basic validation
    if (!formData.client || !formData.total || !formData.issued_date || !formData.balance) return

    // Determine whether to update or add
    if (isEdit && editRow) saveRow({ ...formData, id: editRow.id })
    else saveRow(formData)

    toggleDrawer()
  }

  const filteredRows = rows.filter(
    row =>
      row.client.toLowerCase().includes(searchText.toLowerCase()) ||
      // Search by formatted date string as well
      (row.issued_date ? formatDate(row.issued_date).includes(searchText) : false)
  )
  const paginatedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  // ---------- Pagination Text Logic (NEW) ----------
  const totalRows = filteredRows.length
  const startIndex = totalRows === 0 ? 0 : page * rowsPerPage + 1
  const endIndex = Math.min((page + 1) * rowsPerPage, totalRows)
  const paginationText = `Showing ${startIndex} to ${endIndex} of ${totalRows} entries`
  // -------------------------------------------------


  // 📊 Columns with normal multi-line text
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
    { field: 'client', headerName: 'Client', flex: 1 },
    { field: 'total', headerName: 'Total', flex: 0.5 },
    {
      field: 'issued_date',
      headerName: 'Issued Date',
      flex: 0.8,
      // Display the formatted date
      valueGetter: params => formatDate(params.row.issued_date)
    },
    { field: 'balance', headerName: 'Balance', flex: 0.5 },
    {
      field: 'invoice_status',
      headerName: 'Invoice Status',
      flex: 0.8,
      renderCell: params => (
        <Button
          size='small'
          variant='contained'
          color={params.value === 'Paid' ? 'success' : 'warning'}
          sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 500 }}
        >
          {params.value}
        </Button>
      )
    },
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
      {/* 🔍 Search */}
      <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', mt: 5 }}>
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

      {/* ✅ DataGrid with wrapped text like Page A */}
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

      {/* ✅ Pagination (MODIFIED) */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
        {/* Custom Status Text */}
        <Typography variant='body2' sx={{ color: 'text.secondary', ml: 1 }}>
          {paginationText}
        </Typography>

        {/* Table Pagination Component */}
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

      {/* ✏️ Drawer Form */}
      <Drawer anchor='right' open={open} onClose={toggleDrawer}>
        <Box sx={{ width: 380, p: 3 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6'>{isEdit ? 'Edit Employee' : 'Add Employee'}</Typography>
            <IconButton onClick={toggleDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>

          <form onSubmit={handleSubmit}>
            <CustomTextField
              fullWidth
              margin='normal'
              label='Client Name'
              name='client'
              value={formData.client}
              onChange={handleClientChange}
              inputRef={clientRef}
            />
            <CustomTextField
              fullWidth
              margin='normal'
              label='Total'
              name='total'
              type='text'
              value={formData.total}
              onChange={e => handleNumberChange(e, 'total')}
              inputRef={totalRef}
            />
            <AppReactDatepicker
              dateFormat='dd/MM/yyyy'
              selected={formData.issued_date}
              onChange={date => setFormData(prev => ({ ...prev, issued_date: date }))}
              placeholderText='DD/MM/YYYY'
              ref={datePickerRef}
              customInput={
                <CustomTextField
                  fullWidth
                  margin='normal'
                  label='Issued Date'
                  name='issued_date'
                  value={formData.issued_date ? formatDate(formData.issued_date) : ''}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <CalendarTodayIcon />
                      </InputAdornment>
                    )
                  }}
                />
              }
            />
            <CustomTextField
              fullWidth
              margin='normal'
              label='Balance'
              name='balance'
              type='text'
              value={formData.balance}
              onChange={e => handleNumberChange(e, 'balance')}
              inputRef={balanceRef}
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
