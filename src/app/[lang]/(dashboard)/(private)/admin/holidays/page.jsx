'use client'

import { useState, useRef, useEffect } from 'react'
import { Box, Typography, Button, IconButton, Drawer, InputAdornment, TablePagination } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { MdDelete } from 'react-icons/md'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import DownloadIcon from '@mui/icons-material/Download'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import { Autocomplete } from '@mui/material'
import { openDB } from 'idb'

import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

const DB_NAME = 'HolidayDB'
const STORE_NAME = 'holidays'

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

const parseDateString = dateString => {
  if (!dateString) return null
  const parts = dateString.split('/')
  if (parts.length === 3) {
    const [day, month, year] = parts.map(Number)
    return new Date(Date.UTC(year, month - 1, day))
  }
  return null
}

export default function HolidayPage() {
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchText, setSearchText] = useState('')
  const [open, setOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [formData, setFormData] = useState({ name: '', date: '', year: '', status: 'Active' })

  const statusOptions = ['Active', 'Inactive']

  const nameRef = useRef(null)
  const dateRef = useRef(null)
  const statusRef = useRef(null)
  const statusInputRef = useRef(null)
  const submitButtonRef = useRef(null)
  const [statusOpen, setStatusOpen] = useState(false)

  // ✅ Load from IndexedDB
  useEffect(() => {
    (async () => {
      const db = await getDB()
      const allHolidays = await db.getAll(STORE_NAME)
      setRows(allHolidays.sort((a, b) => b.id - a.id))
    })()
  }, [])

  const toggleDrawer = () => setOpen(prev => !prev)

  const saveToDB = async holiday => {
    const db = await getDB()
    if (holiday.id) await db.put(STORE_NAME, holiday)
    else await db.add(STORE_NAME, holiday)
  }

  const deleteFromDB = async id => {
    const db = await getDB()
    await db.delete(STORE_NAME, id)
  }

  const handleAdd = () => {
    setIsEdit(false)
    setFormData({ name: '', date: '', year: '', status: 'Active' })
    setOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setEditRow(row)
    setFormData({ ...row })
    setOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  const handleDelete = row => {
    setRows(prev => prev.filter(r => r.id !== row.id))
    deleteFromDB(row.id)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (formData.name && formData.date) {
      const extractedYear = formData.date.split('/')[2] || ''
      const safeFormData = { ...formData, year: extractedYear }

      if (isEdit && editRow) {
        const updated = { ...editRow, ...safeFormData }
        setRows(prev => prev.map(r => (r.id === editRow.id ? updated : r)).sort((a, b) => b.id - a.id))
        await saveToDB(updated)
      } else {
        const newId = rows.length ? Math.max(...rows.map(r => r.id)) + 1 : 1
        const newHoliday = { id: newId, ...safeFormData }
        setRows(prev => [newHoliday, ...prev].sort((a, b) => b.id - a.id))
        await saveToDB(newHoliday)
      }
      toggleDrawer()
    }
  }

  const handleSearch = e => setSearchText(e.target.value)

  const filteredRows = rows
    .filter(
      r =>
        r.name.toLowerCase().includes(searchText.toLowerCase()) ||
        r.date.toLowerCase().includes(searchText.toLowerCase()) ||
        (r.year && r.year.toLowerCase().includes(searchText.toLowerCase()))
    )
    .sort((a, b) => b.id - a.id)

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
      sortable: false,
      valueGetter: params => filteredRows.findIndex(r => r.id === params.row.id) + 1
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
    { field: 'name', headerName: 'Holiday Name', flex: 1 },
    { field: 'year', headerName: 'Year', flex: 0.5 },
    { field: 'date', headerName: 'Date', flex: 0.7 },
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

  const handleExport = () => {
    const headers = ['S.No', 'Holiday Name', 'Year', 'Date', 'Status']
    const csv = [
      headers.join(','),
      ...rows.map((r, i) => [`${i + 1}`, `"${r.name}"`, r.year, `"${r.date}"`, r.status].join(','))
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'holidays.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <ContentLayout
      title='Holiday List'
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Holiday' }]}
      actions={
        <Box sx={{ m: 2, display: 'flex', gap: 2 }}>
          <Button variant='outlined' startIcon={<DownloadIcon />} onClick={handleExport}>
            Export
          </Button>
          <Button variant='contained' startIcon={<AddIcon />} onClick={handleAdd}>
            Add Holiday
          </Button>
        </Box>
      }
    >
      {/* Search */}
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
        <Box sx={{ width: 360, p: 3 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6'>{isEdit ? 'Edit Holiday' : 'Add New Holiday'}</Typography>
            <IconButton onClick={toggleDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>

          <form onSubmit={handleSubmit}>
            {/* Holiday Name */}
            <CustomTextField
              fullWidth
              margin='normal'
              label='Holiday Name'
              name='name'
              value={formData.name}
              onChange={e => {
                const value = e.target.value.replace(/[^a-zA-Z\s]/g, '')
                setFormData(prev => ({ ...prev, name: value }))
              }}
              inputRef={nameRef}
              inputProps={{
                onKeyDown: e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    dateRef.current?.setFocus()
                  }
                }
              }}
            />

            {/* Date */}
            <AppReactDatepicker
              dateFormat='dd/MM/yyyy'
              selected={formData.date ? parseDateString(formData.date) : null}
              onChange={date => {
                let formattedDate = ''
                if (date) {
                  const day = String(date.getUTCDate()).padStart(2, '0')
                  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
                  const year = date.getUTCFullYear()
                  formattedDate = `${day}/${month}/${year}`
                }
                setFormData(prev => ({ ...prev, date: formattedDate }))
              }}
              placeholderText='DD/MM/YYYY'
              ref={dateRef}
              customInput={
                <CustomTextField
                  fullWidth
                  margin='normal'
                  label='Date'
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <CalendarTodayIcon />
                      </InputAdornment>
                    )
                  }}
                  onFocus={() => dateRef.current?.setOpen(true)}
                />
              }
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  statusInputRef.current?.focus()
                  setStatusOpen(true)
                }
              }}
            />

            {/* Status */}
            <Autocomplete
              ref={statusRef}
              freeSolo={false}
              options={statusOptions}
              value={formData.status}
              open={statusOpen}
              onOpen={() => setStatusOpen(true)}
              onClose={() => setStatusOpen(false)}
              onChange={(e, newValue) => {
                setFormData(prev => ({ ...prev, status: newValue }))
                requestAnimationFrame(() => submitButtonRef.current?.focus())
              }}
              renderInput={params => (
                <CustomTextField
                  {...params}
                  label='Status'
                  fullWidth
                  margin='normal'
                  inputRef={statusInputRef}
                  inputProps={{
                    ...params.inputProps,
                    onFocus: () => setStatusOpen(true),
                    onKeyDown: e => {
                      if (e.key === 'Enter' && !statusOpen) {
                        e.preventDefault()
                        submitButtonRef.current?.focus()
                      }
                    }
                  }}
                />
              )}
            />

            {/* Buttons */}
            <Box mt={3} display='flex' gap={2}>
              <Button
                type='submit'
                variant='contained'
                fullWidth
                ref={submitButtonRef}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    e.target.click()
                  }
                }}
              >
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
