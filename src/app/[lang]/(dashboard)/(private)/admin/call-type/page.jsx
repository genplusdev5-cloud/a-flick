'use client'

import { useState, useRef, useEffect } from 'react'
import { Box, Typography, Button, IconButton, Drawer, InputAdornment, TablePagination, MenuItem } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { MdDelete } from 'react-icons/md'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import DownloadIcon from '@mui/icons-material/Download'
import { openDB } from 'idb'

import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'

const DB_NAME = 'calltype_db'
const STORE_NAME = 'calltypes'

export default function CallTypePage() {
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchText, setSearchText] = useState('')
  const [open, setOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [formData, setFormData] = useState({ name: '', sortOrder: '', description: '', status: 'Active' })
  const statusOptions = ['Active', 'Inactive']
  const [statusOpen, setStatusOpen] = useState(false)

  const submitRef = useRef(null)
  const statusRef = useRef(null)
  const nameRef = useRef(null)
  const sortRef = useRef(null)
  const descriptionRef = useRef(null)

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

  const toggleDrawer = () => setOpen(prev => !prev)
  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value })
  const handleSearch = e => setSearchText(e.target.value)

  // ---------------- CRUD ----------------
  const handleAdd = () => {
    setIsEdit(false)
    setEditRow(null)
    setFormData({ name: '', sortOrder: '', description: '', status: 'Active' })
    setOpen(true)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setEditRow(row)
    setFormData({ ...row, sortOrder: String(row.sortOrder) })
    setOpen(true)
  }

  const handleDelete = async row => {
    const db = await initDB()
    await db.delete(STORE_NAME, row.id)
    setRows(prev => prev.filter(r => r.id !== row.id))
  }

  const handleSubmit = async e => {
    if (e && e.preventDefault) e.preventDefault()
    if (!formData.name || !formData.sortOrder || !/^\d+$/.test(formData.sortOrder)) return

    const db = await initDB()
    const dataToSave = { ...formData, sortOrder: BigInt(formData.sortOrder).toString() }

    if (isEdit && editRow) {
      await db.put(STORE_NAME, { ...dataToSave, id: editRow.id })
    } else {
      await db.add(STORE_NAME, dataToSave)
    }
    await loadRows()
    toggleDrawer()
  }

  // ---------------- Keyboard Navigation ----------------
  const focusNext = ref => ref?.current?.focus()
  const handleKeyPress = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (nextRef) focusNext(nextRef)
      else submitRef.current?.focus()
    }
  }

  // ---------------- Filtering & Pagination ----------------
  const filteredRows = rows.filter(
    row => row.name.toLowerCase().includes(searchText.toLowerCase()) || String(row.sortOrder).includes(searchText)
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
    { field: 'name', headerName: 'Call Type Name', flex: 1 },
    { field: 'sortOrder', headerName: 'Sort Order', flex: 0.5, valueGetter: params => String(params.row.sortOrder) },
    { field: 'description', headerName: 'Description', flex: 1 },
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
      title='Call Type List'
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Call Type' }]}
      actions={
        <Box sx={{ m: 2, display: 'flex', gap: 2 }}>
          <Button variant='outlined' startIcon={<DownloadIcon />}>
            Export
          </Button>
          <Button variant='contained' startIcon={<AddIcon />} onClick={handleAdd}>
            Add Call Type
          </Button>
        </Box>
      }
    >
      {/* Search */}
      <Box sx={{ p: 2, pt: 0, mt: 5 }}>
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
            overflowWrap: 'break-word',
            alignItems: 'flex-start',
            fontSize: '15px'
          },
          '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
          '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': { outline: 'none' },
          '& .MuiDataGrid-columnHeaderTitle': { fontSize: '15px', fontWeight: 500 }
        }}
      />

      {/* Pagination Footer */}
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
            <Typography variant='h6'>{isEdit ? 'Edit Call Type' : 'Add New Call Type'}</Typography>
            <IconButton onClick={toggleDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>

          <form onSubmit={handleSubmit}>
            <CustomTextField
              inputRef={nameRef}
              fullWidth
              margin='normal'
              label='Call Type Name'
              name='name'
              value={formData.name}
              onChange={handleChange}
              onKeyDown={e => handleKeyPress(e, sortRef)}
            />
            <CustomTextField
              inputRef={sortRef}
              fullWidth
              margin='normal'
              label='Sort Order'
              name='sortOrder'
              value={formData.sortOrder}
              onChange={e => {
                const value = e.target.value
                if (/^\d*$/.test(value)) {
                  handleChange(e)
                }
              }}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleKeyPress(e, descriptionRef)
                }
              }}
            />

            <CustomTextField
              inputRef={descriptionRef}
              fullWidth
              margin='normal'
              label='Description'
              name='description'
              multiline
              rows={3}
              value={formData.description}
              onChange={handleChange}
              onKeyDown={e => handleKeyPress(e, isEdit ? statusRef : submitRef)}
            />

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
