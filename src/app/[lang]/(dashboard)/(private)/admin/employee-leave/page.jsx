'use client'

import { useState, useRef, useEffect } from 'react'
import { openDB } from 'idb'
import { Box, Typography, Button, IconButton, Drawer, InputAdornment, TablePagination } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'

// Icons
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import { MdDelete } from 'react-icons/md'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import DownloadIcon from '@mui/icons-material/Download'

// Components
import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

const DB_NAME = 'employee_leave_db'
const STORE_NAME = 'leaves'

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

export default function EmployeeLeavePage() {
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [search, setSearch] = useState('')

  const [open, setOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editRow, setEditRow] = useState(null)

  const [formData, setFormData] = useState({
    employee: '',
    supervisor: '',
    leaveType: '',
    fromDate: new Date(),
    toDate: new Date(),
    status: 'Pending'
  })

  const [dateError, setDateError] = useState('')
  const submitRef = useRef(null)

  // Load rows from IndexedDB
  const loadRows = async () => {
    const db = await initDB()
    const allRows = await db.getAll(STORE_NAME)
    setRows(allRows.sort((a, b) => b.id - a.id))
  }

  useEffect(() => {
    loadRows()
  }, [])

  const toggleDrawer = () => setOpen(prev => !prev)

  const handleAdd = () => {
    setIsEdit(false)
    setEditRow(null)
    setFormData({
      employee: '',
      supervisor: '',
      leaveType: '',
      fromDate: new Date(),
      toDate: new Date(),
      status: 'Pending'
    })
    setDateError('')
    setOpen(true)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setEditRow(row)
    setFormData({ ...row })
    setDateError('')
    setOpen(true)
  }

  const handleDelete = async row => {
    const db = await initDB()
    await db.delete(STORE_NAME, row.id)
    setRows(prev => prev.filter(r => r.id !== row.id))
  }

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFromDateChange = date => {
    setFormData(prev => ({ ...prev, fromDate: date }))
    if (date > formData.toDate) setDateError('From Date cannot be later than To Date!')
    else setDateError('')
  }

  const handleToDateChange = date => {
    setFormData(prev => ({ ...prev, toDate: date }))
    if (formData.fromDate > date) setDateError('From Date cannot be later than To Date!')
    else setDateError('')
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!formData.employee || !formData.leaveType) return
    if (formData.fromDate > formData.toDate) {
      setDateError('From Date cannot be later than To Date!')
      return
    }

    const db = await initDB()

    if (isEdit && editRow) {
      await db.put(STORE_NAME, { ...formData, id: editRow.id })
    } else {
      await db.add(STORE_NAME, { ...formData })
    }

    await loadRows()
    toggleDrawer()
  }

  const handleSearch = e => setSearch(e.target.value)

  const handleKeyPress = e => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const form = e.target.form
      const inputs = Array.from(form.querySelectorAll('input, textarea')).filter(
        el => !el.disabled && el.type !== 'hidden'
      )
      const nextIndex = inputs.findIndex(input => input === e.target) + 1
      if (nextIndex < inputs.length) inputs[nextIndex].focus()
      else submitRef.current?.focus()
    }
  }

  const filteredRows = rows.filter(
    row =>
      row.employee.toLowerCase().includes(search.toLowerCase()) ||
      row.supervisor.toLowerCase().includes(search.toLowerCase()) ||
      row.leaveType.toLowerCase().includes(search.toLowerCase())
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
      flex: 0.3,
      valueGetter: params => filteredRows.findIndex(r => r.id === params.row.id) + 1,
      sortable: false
    },
    {
      field: 'action',
      headerName: 'Action',
      flex: 0.6,
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
    { field: 'employee', headerName: 'Employee', flex: 1 },
    { field: 'supervisor', headerName: 'Supervisor', flex: 1 },
    { field: 'leaveType', headerName: 'Leave Type', flex: 1 },
    {
      field: 'fromDate',
      headerName: 'From Date & Time',
      flex: 1,
      valueGetter: params => new Date(params.row.fromDate).toLocaleString()
    },
    {
      field: 'toDate',
      headerName: 'To Date & Time',
      flex: 1,
      valueGetter: params => new Date(params.row.toDate).toLocaleString()
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.7,
      renderCell: params => (
        <Button
          size='small'
          variant='contained'
          color={params.value === 'Approved' ? 'success' : params.value === 'Pending' ? 'warning' : 'error'}
          sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 500 }}
        >
          {params.value}
        </Button>
      )
    }
  ]

  return (
    <ContentLayout
      title='Employee Leave'
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Employee Leave' }]}
      actions={
        <Box sx={{ m: 2, display: 'flex', gap: 2 }}>
          <Button variant='outlined' startIcon={<DownloadIcon />}>
            Export
          </Button>
          <Button variant='contained' startIcon={<AddIcon />} onClick={handleAdd}>
            Add Leave
          </Button>
        </Box>
      }
    >
      {/* Search */}
      <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', mt: 5 }}>
        <CustomTextField
          size='small'
          placeholder='Search'
          value={search}
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

      {/* ✅ DataGrid with multi-line wrapping (like Page A) */}
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

      {/* ✅ Pagination with status text */}
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
            <Typography variant='h6'>{isEdit ? 'Edit Leave' : 'Add Leave'}</Typography>
            <IconButton onClick={toggleDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>

          <form onSubmit={handleSubmit}>
            <CustomTextField
              fullWidth
              margin='normal'
              label='Employee'
              name='employee'
              value={formData.employee}
              onChange={e => setFormData(prev => ({ ...prev, employee: e.target.value.replace(/[^a-zA-Z\s]/g, '') }))}
              onKeyDown={handleKeyPress}
            />
            <CustomTextField
              fullWidth
              margin='normal'
              label='Supervisor'
              name='supervisor'
              value={formData.supervisor}
              onChange={e => setFormData(prev => ({ ...prev, supervisor: e.target.value.replace(/[^a-zA-Z\s]/g, '') }))}
              onKeyDown={handleKeyPress}
            />
            <CustomTextField
              fullWidth
              margin='normal'
              label='Leave Type'
              name='leaveType'
              value={formData.leaveType}
              onChange={e => setFormData(prev => ({ ...prev, leaveType: e.target.value.replace(/[^a-zA-Z\s]/g, '') }))}
              onKeyDown={handleKeyPress}
            />

            <AppReactDatepicker
              showTimeSelect
              timeIntervals={15}
              selected={formData.fromDate}
              onChange={handleFromDateChange}
              dateFormat='dd/MM/yyyy h:mm aa'
              customInput={
                <CustomTextField
                  fullWidth
                  margin='normal'
                  label='From Date & Time'
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

            <AppReactDatepicker
              showTimeSelect
              timeIntervals={15}
              selected={formData.toDate}
              onChange={handleToDateChange}
              dateFormat='dd/MM/yyyy h:mm aa'
              customInput={
                <CustomTextField
                  fullWidth
                  margin='normal'
                  label='To Date & Time'
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

            {dateError && (
              <Typography variant='body2' sx={{ mt: 1, color: 'red', fontWeight: 500 }}>
                {dateError}
              </Typography>
            )}

            <Box mt={3} display='flex' gap={2}>
              <Button type='submit' variant='contained' fullWidth ref={submitRef} disabled={!!dateError}>
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
