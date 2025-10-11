'use client'

import { useState, useRef, useEffect } from 'react'
import { openDB } from 'idb'

// MUI Imports
import { Box, Typography, Button, IconButton, Drawer, InputAdornment, TablePagination, MenuItem } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { MdDelete } from 'react-icons/md'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import DownloadIcon from '@mui/icons-material/Download'

import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'

export default function EmployeeLeaveTypePage() {
  // Table State
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchText, setSearchText] = useState('')
  const [open, setOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [formData, setFormData] = useState({ leaveCode: '', name: '', status: 'Active' })

  const leaveCodeRef = useRef(null)
  const nameRef = useRef(null)
  const submitRef = useRef(null)

  // IndexedDB config
  const dbName = 'EmployeeLeaveDB'
  const storeName = 'leaveTypes'

  // Initialize DB & load stored rows
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

  // Save a row to DB
  const saveRowDB = async row => {
    const db = await openDB(dbName, 1)
    if (row.id) {
      await db.put(storeName, row)
    } else {
      const id = await db.add(storeName, row)
      row.id = id
    }
    const allRows = await db.getAll(storeName)
    allRows.sort((a, b) => b.id - a.id)
    setRows(allRows)
  }

  // Delete row from DB
  const deleteRowDB = async id => {
    const db = await openDB(dbName, 1)
    await db.delete(storeName, id)
    const allRows = await db.getAll(storeName)
    allRows.sort((a, b) => b.id - a.id)
    setRows(allRows)
  }

  // ---------- Handlers ----------
  const handleAdd = () => {
    setIsEdit(false)
    setEditRow(null)
    setFormData({ leaveCode: '', name: '', status: 'Active' })
    setOpen(true)
    setTimeout(() => leaveCodeRef.current?.focus(), 100)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setEditRow(row)
    setFormData({ leaveCode: row.leaveCode, name: row.name, status: row.status ?? 'Active' })
    setOpen(true)
    setTimeout(() => leaveCodeRef.current?.focus(), 100)
  }

  const handleDelete = row => {
    deleteRowDB(row.id)
  }

  const handleSubmit = e => {
    e.preventDefault()
    if (!formData.leaveCode || !formData.name) return

    if (isEdit && editRow) {
      saveRowDB({ ...formData, id: editRow.id })
    } else {
      saveRowDB({ ...formData, status: formData.status ?? 'Active' })
    }

    setOpen(false)
  }

  const handleSearch = e => setSearchText(e.target.value)

  // Keyboard navigation between fields
  const handleKeyPress = (e, currentField) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (currentField === 'leaveCode') nameRef.current?.focus()
      else if (currentField === 'name') submitRef.current?.focus()
    }
  }

  // ---------- Table Data ----------
  const filteredRows = rows.filter(
    row =>
      row.leaveCode.toLowerCase().includes(searchText.toLowerCase()) ||
      row.name.toLowerCase().includes(searchText.toLowerCase())
  )

  const paginatedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  // ---------- Pagination Text ----------
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
            <MdDelete style={{ color: 'red' }} />
          </IconButton>
          <IconButton size='small' onClick={() => handleEdit(params.row)}>
            <EditIcon />
          </IconButton>
        </Box>
      )
    },
    { field: 'leaveCode', headerName: 'Leave Code', flex: 0.8 },
    { field: 'name', headerName: 'Name', flex: 1 },
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
      title='Employee Leave Types'
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Employee Leave Type' }]}
      actions={
        <Box sx={{ m: 2, display: 'flex', gap: 2 }}>
          <Button variant='outlined' startIcon={<DownloadIcon />}>
            Export
          </Button>
          <Button variant='contained' startIcon={<AddIcon />} onClick={handleAdd}>
            Add Leave Type
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
      <Drawer anchor='right' open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: 360, p: 3 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6'>{isEdit ? 'Edit Leave Type' : 'Add Leave Type'}</Typography>
            <IconButton onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

         <form onSubmit={handleSubmit}>
  <CustomTextField
    fullWidth
    margin='normal'
    label='Leave Code'
    name='leaveCode'
    value={formData.leaveCode}
    onChange={e => setFormData(prev => ({ ...prev, leaveCode: e.target.value }))}
    inputRef={leaveCodeRef}
    onKeyDown={e => handleKeyPress(e, 'leaveCode')}
  />
  <CustomTextField
    fullWidth
    margin='normal'
    label='Name'
    name='name'
    value={formData.name}
    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
    inputRef={nameRef}
    onKeyDown={e => {
      if (
        !/^[a-zA-Z\s]$/.test(e.key) &&
        !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)
      ) {
        e.preventDefault()
      }
      handleKeyPress(e, 'name')
    }}
  />

  {isEdit && (
    <CustomTextField
      select
      fullWidth
      margin='normal'
      label='Status'
      name='status'
      value={formData.status ?? 'Active'}
      onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
    >
      <MenuItem value='Active'>Active</MenuItem>
      <MenuItem value='Inactive'>Inactive</MenuItem>
    </CustomTextField>
  )}

  <Box mt={3} display='flex' gap={2}>
    <Button type='submit' variant='contained' fullWidth ref={submitRef}>
      {isEdit ? 'Update' : 'Submit'}
    </Button>
    <Button variant='outlined' fullWidth onClick={() => setOpen(false)}>
      Cancel
    </Button>
  </Box>
</form>

        </Box>
      </Drawer>
    </ContentLayout>
  )
}
