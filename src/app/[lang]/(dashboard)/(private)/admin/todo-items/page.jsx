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
import { Autocomplete } from '@mui/material'
import { openDB } from 'idb'

import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'

const DB_NAME = 'todo_db'
const STORE_NAME = 'todos'

export default function TodoItemsPage() {
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchText, setSearchText] = useState('')
  const [open, setOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [formData, setFormData] = useState({ title: '', status: 'Active' })
  const [statusOpen, setStatusOpen] = useState(false)

  const titleRef = useRef(null)
  const statusInputRef = useRef(null)
  const submitButtonRef = useRef(null)
  const statusOptions = ['Active', 'Inactive']

  // ------------- IndexedDB functions -------------
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
    // Sort descending by id so latest entries come first
    const sorted = allRows.sort((a, b) => b.id - a.id)
    setRows(sorted)
  }

  useEffect(() => {
    loadRows()
  }, [])

  const toggleDrawer = () => setOpen(prev => !prev)

  const handleChange = e => {
    const { name, value } = e.target
    if (name === 'title') {
      // Allow letters and spaces only
      const filtered = value.replace(/[^a-zA-Z\s]/g, '')
      setFormData(prev => ({ ...prev, [name]: filtered }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSearch = e => setSearchText(e.target.value)

  const handleAdd = () => {
    setIsEdit(false)
    setFormData({ title: '', status: 'Active' })
    setOpen(true)
    setTimeout(() => titleRef.current?.focus(), 100)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setEditRow(row)
    setFormData({ ...row })
    setOpen(true)
    setTimeout(() => titleRef.current?.focus(), 100)
  }

  const handleDelete = async row => {
    const db = await initDB()
    await db.delete(STORE_NAME, row.id)
    setRows(prev => prev.filter(r => r.id !== row.id))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!formData.title) return
    const db = await initDB()

    if (isEdit && editRow) {
      await db.put(STORE_NAME, { ...editRow, ...formData })
    } else {
      await db.add(STORE_NAME, { ...formData })
    }

    await loadRows()
    toggleDrawer()
  }

  // Filter + Pagination
  const filteredRows = rows.filter(
    row =>
      row.title.toLowerCase().includes(searchText.toLowerCase()) ||
      row.status.toLowerCase().includes(searchText.toLowerCase())
  )
  const paginatedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  // ---------------- Pagination Text Logic ----------------
  const totalRows = filteredRows.length
  const startIndex = totalRows === 0 ? 0 : page * rowsPerPage + 1
  const endIndex = Math.min((page + 1) * rowsPerPage, totalRows)
  const paginationText = `Showing ${startIndex} to ${endIndex} of ${totalRows} entries`
  // -------------------------------------------------------

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
    {
      field: 'title',
      headerName: 'Todo Title',
      flex: 1,
      renderCell: params => (
        <Box sx={{ whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
          {params.value}
        </Box>
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
      title='Todo Items List'
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Todo Items' }]}
      actions={
        <Box sx={{ m: 2, display: 'flex', gap: 2 }}>
          <Button variant='outlined' startIcon={<DownloadIcon />}>
            Export
          </Button>
          <Button variant='contained' startIcon={<AddIcon />} onClick={handleAdd}>
            Add Todo
          </Button>
        </Box>
      }
    >
      {/* Search Bar */}
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


      {/* ------------------------------------------------------------- */}
      {/* ✅ Pagination Footer with Custom Text (Added logic here) */}
      {/* ------------------------------------------------------------- */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
        {/* Custom Status Text */}
        <Typography variant='body2' sx={{ color: 'text.secondary', ml: 1 }}>
          {paginationText}
        </Typography>

        {/* Table Pagination */}
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
      {/* ------------------------------------------------------------- */}

      {/* Drawer Form */}
      <Drawer anchor='right' open={open} onClose={toggleDrawer}>
        <Box sx={{ width: 360, p: 3 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6'>{isEdit ? 'Edit Todo' : 'Add New Todo'}</Typography>
            <IconButton onClick={toggleDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>

          <form onSubmit={handleSubmit}>
            <CustomTextField
              fullWidth
              margin='normal'
              label='Todo Title'
              name='title'
              value={formData.title}
              onChange={handleChange}
              inputRef={titleRef}
              inputProps={{
                onKeyDown: e => {
                  if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault()
                    statusInputRef.current?.focus()
                  }
                }
              }}
            />

            <Autocomplete
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
                  inputRef={statusInputRef}
                  onFocus={() => setStatusOpen(true)}
                  inputProps={{
                    ...params.inputProps,
                    onKeyDown: e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        submitButtonRef.current?.focus()
                      }
                    }
                  }}
                />
              )}
              sx={{ mt: 2 }}
            />

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
