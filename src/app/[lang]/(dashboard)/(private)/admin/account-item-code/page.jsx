'use client'

import { useState, useEffect, useRef } from 'react'
import { openDB } from 'idb'
import {
  Box,
  Typography,
  Button,
  IconButton,
  Drawer,
  InputAdornment,
  TablePagination,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'

// Icons
import AddIcon from '@mui/icons-material/Add'
import DownloadIcon from '@mui/icons-material/Download'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import { MdDelete } from 'react-icons/md'

// Wrapper
import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'

// ------------------- Columns -------------------
const getColumns = (handleEdit, handleDelete, filteredRows) => [
  {
    field: 'serial',
    headerName: 'S.No',
    flex: 0.3,
    minWidth: 70,
    sortable: false,
    valueGetter: params => {
      const globalIndex = filteredRows.findIndex(row => row.id === params.row.id)
      return globalIndex !== -1 ? globalIndex + 1 : 'N/A'
    }
  },
  {
    field: 'action',
    headerName: 'Action',
    flex: 0.5,
    minWidth: 100,
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
    field: 'name',
    headerName: 'Name',
    flex: 1,
    minWidth: 150
  },
  {
    field: 'itemNumber',
    headerName: 'Item Number',
    flex: 1,
    minWidth: 120
  },
  {
    field: 'description',
    headerName: 'Description',
    flex: 1.5,
    minWidth: 200
  },
  {
    field: 'status',
    headerName: 'Status',
    flex: 0.8,
    minWidth: 120,
    renderCell: params => (
      <Button
        size='small'
        variant='contained'
        color={params.value === 'Active' ? 'success' : 'error'}
        sx={{
          borderRadius: '20px',
          textTransform: 'none',
          fontWeight: 500
        }}
      >
        {params.value}
      </Button>
    )
  }
]

// ------------------- IndexedDB -------------------
const dbName = 'accountDB'
const storeName = 'accountItems'

async function initDB() {
  return openDB(dbName, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id' })
      }
    }
  })
}

async function getAllRows() {
  const db = await initDB()
  return db.getAll(storeName)
}

async function addOrUpdateRow(row) {
  const db = await initDB()
  await db.put(storeName, row)
}

async function deleteRowFromDB(id) {
  const db = await initDB()
  await db.delete(storeName, id)
}

// ------------------- Component -------------------
export default function AccountItemCodePage() {
  const [rows, setRows] = useState([])
  const [open, setOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [formData, setFormData] = useState({ name: '', itemNumber: '', description: '' })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Input refs
  const nameRef = useRef(null)
  const itemNumberRef = useRef(null)
  const descriptionRef = useRef(null)
  const submitRef = useRef(null)

  // Load data
  useEffect(() => {
    async function loadRows() {
      const allRows = await getAllRows()
      allRows.sort((a, b) => b.id - a.id)
      setRows(allRows)
    }
    loadRows()
  }, [])

  const toggleDrawer = () => setOpen(prev => !prev)

  const handleAdd = () => {
    setIsEdit(false)
    setFormData({ name: '', itemNumber: '', description: '' })
    setEditRow(null)
    setOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  const handleEdit = row => {
    if (!row) return
    setIsEdit(true)
    setEditRow(row)
    setFormData({ name: row.name, itemNumber: row.itemNumber, description: row.description })
    setOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  const handleDelete = async row => {
    setRows(prev => prev.filter(r => r.id !== row.id))
    await deleteRowFromDB(row.id)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (formData.name && formData.itemNumber) {
      if (isEdit && editRow) {
        const updatedRow = { ...editRow, ...formData }
        setRows(prev => prev.map(r => (r.id === editRow.id ? updatedRow : r)))
        await addOrUpdateRow(updatedRow)
      } else {
        const newId = rows.length ? Math.max(...rows.map(r => r.id)) + 1 : 1
        const newRow = { id: newId, ...formData, status: 'Active' }
        setRows(prev => [newRow, ...prev])
        await addOrUpdateRow(newRow)
      }
      toggleDrawer()
    }
  }

  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      switch (field) {
        case 'name':
          itemNumberRef.current?.focus()
          break
        case 'itemNumber':
          descriptionRef.current?.focus()
          break
        case 'description':
          submitRef.current?.focus()
          break
      }
    }
  }

  const filteredRows = rows.filter(
    row =>
      row.name.toLowerCase().includes(search.toLowerCase()) ||
      row.itemNumber.toLowerCase().includes(search.toLowerCase())
  )

  const paginatedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  const columns = getColumns(handleEdit, handleDelete, filteredRows)

  const totalRows = filteredRows.length
  const startIndex = totalRows === 0 ? 0 : page * rowsPerPage + 1
  const endIndex = Math.min((page + 1) * rowsPerPage, totalRows)
  const paginationText = `Showing ${startIndex} to ${endIndex} of ${totalRows} entries`

  return (
    <ContentLayout
      title='Account Item Code List'
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Account Item Code' }]}
      actions={
        <Box sx={{ m: 2, display: 'flex', gap: 2 }}>
          <Button variant='outlined' startIcon={<DownloadIcon />}>
            Export
          </Button>
          <Button variant='contained' startIcon={<AddIcon />} onClick={handleAdd}>
            Add Item
          </Button>
        </Box>
      }
    >
      {/* Search */}
      <Box sx={{ p: 2, mt: 5, pt: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <CustomTextField
          size='small'
          placeholder='Search'
          value={search}
          onChange={e => setSearch(e.target.value)}
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

      {/* ✅ Page A Style DataGrid */}
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

      {/* ✅ Pagination Footer */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pr: 2 }}>
        <Typography variant='body2' sx={{ color: 'text.secondary', ml: 1 }}>
          {paginationText}
        </Typography>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component='div'
          count={totalRows}
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
            <Typography variant='h6'>{isEdit ? 'Edit Account Item' : 'Add New Account Item'}</Typography>
            <IconButton onClick={toggleDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>
          <form onSubmit={handleSubmit}>
            <CustomTextField
              fullWidth
              margin='normal'
              label='Name'
              value={formData.name}
              inputRef={nameRef}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value.replace(/[^a-zA-Z\s]/g, '') }))}
              onKeyDown={e => handleKeyDown(e, 'name')}
            />
            <CustomTextField
              fullWidth
              margin='normal'
              label='Item Number'
              value={formData.itemNumber}
              inputRef={itemNumberRef}
              onChange={e => setFormData(prev => ({ ...prev, itemNumber: e.target.value.replace(/\D/g, '') }))}
              onKeyDown={e => handleKeyDown(e, 'itemNumber')}
            />
            <CustomTextField
              fullWidth
              margin='normal'
              label='Description'
              multiline
              rows={3}
              value={formData.description}
              inputRef={descriptionRef}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              onKeyDown={e => handleKeyDown(e, 'description')}
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
