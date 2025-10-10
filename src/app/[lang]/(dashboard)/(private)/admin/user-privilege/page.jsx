'use client'

import { useState, useRef, useEffect } from 'react'
import { Box, Button, IconButton, Drawer, InputAdornment, Typography, Checkbox, TablePagination } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import DownloadIcon from '@mui/icons-material/Download'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import { MdDelete } from 'react-icons/md'
import { openDB } from 'idb'

import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'

export default function UserPrivilegePage() {
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchText, setSearchText] = useState('')
  const [open, setOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [formData, setFormData] = useState({ module: '', create: false, view: false, update: false, delete: false })
  const submitRef = useRef(null)
  const dbName = 'UserPrivilegeDB'
  const storeName = 'modules'

  // Initialize IndexedDB
  const initDB = async () => {
    const db = await openDB(dbName, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true })
        }
      }
    })
    return db
  }

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      const db = await initDB()
      const allRows = await db.getAll(storeName)
      allRows.sort((a, b) => b.id - a.id)
      setRows(allRows)
    }
    fetchData()
  }, [])

  const toggleDrawer = () => setOpen(prev => !prev)

  const handleAdd = () => {
    setIsEdit(false)
    setEditRow(null) // Reset edit row
    setFormData({ module: '', create: false, view: false, update: false, delete: false })
    setOpen(true)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setEditRow(row)
    setFormData({ ...row })
    setOpen(true)
  }

  const handleDelete = async row => {
    const db = await initDB()
    await db.delete(storeName, row.id)
    setRows(prev => prev.filter(r => r.id !== row.id))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!formData.module) return

    const db = await initDB()
    const dataToSave = {
      module: formData.module,
      create: formData.create,
      view: formData.view,
      update: formData.update,
      delete: formData.delete
    }

    if (isEdit && editRow) {
      const updatedData = { ...dataToSave, id: editRow.id }
      await db.put(storeName, updatedData)
      setRows(prev => prev.map(r => (r.id === editRow.id ? updatedData : r)))
    } else {
      const id = await db.add(storeName, dataToSave)
      const newRow = { ...dataToSave, id }
      setRows(prev => [newRow, ...prev].sort((a, b) => b.id - a.id))
    }
    toggleDrawer()
  }

  const handleSearch = e => setSearchText(e.target.value)

  const filteredRows = rows.filter(
    row =>
      row.module.toLowerCase().includes(searchText.toLowerCase()) ||
      row.id.toString().includes(searchText.toLowerCase())
  )

  const paginatedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  // ---------- Pagination Text Logic (ADDED) ----------
  const totalRows = filteredRows.length
  const startIndex = totalRows === 0 ? 0 : page * rowsPerPage + 1
  const endIndex = Math.min((page + 1) * rowsPerPage, totalRows)
  const paginationText = `Showing ${startIndex} to ${endIndex} of ${totalRows} entries`
  // -------------------------------------------------

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
    { field: 'module', headerName: 'Module', flex: 1 },
    { field: 'create', headerName: 'Create', flex: 0.5, renderCell: params => <Checkbox checked={params.value} disabled /> },
    { field: 'view', headerName: 'View', flex: 0.5, renderCell: params => <Checkbox checked={params.value} disabled /> },
    { field: 'update', headerName: 'Edit/Update', flex: 0.6, renderCell: params => <Checkbox checked={params.value} disabled /> },
    { field: 'delete', headerName: 'Delete', flex: 0.5, renderCell: params => <Checkbox checked={params.value} disabled /> }
  ]

  return (
    <ContentLayout
      title='User Privilege'
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'User Privilege' }]}
      actions={
        <Box sx={{ display: 'flex', gap: 2, m: 2 }}>
          <Button variant='outlined' startIcon={<DownloadIcon />}>Export</Button>
          <Button variant='contained' startIcon={<AddIcon />} onClick={handleAdd}>Add Module</Button>
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
          slotProps={{ input: { startAdornment: <InputAdornment position='start'><SearchIcon /></InputAdornment> } }}
        />
      </Box>

      {/* Updated DataGrid with multiline support */}
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

      {/* ✅ Pagination (MODIFIED to include status text) */}
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
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0) }}
        />
      </Box>

      {/* Drawer Form */}
      <Drawer anchor='right' open={open} onClose={toggleDrawer}>
        <Box sx={{ width: 360, p: 3 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6'>{isEdit ? 'Edit Module' : 'Add New Module'}</Typography>
            <IconButton onClick={toggleDrawer}><CloseIcon /></IconButton>
          </Box>

          <form onSubmit={handleSubmit}>
            <CustomTextField
              fullWidth
              margin='normal'
              label='Module'
              name='module'
              value={formData.module}
              onChange={e => setFormData(prev => ({ ...prev, module: e.target.value }))}
            />

            <Box display='flex' flexDirection='column' mt={2} gap={1}>
              <Box><Checkbox checked={formData.create} onChange={() => setFormData(prev => ({ ...prev, create: !prev.create }))} /> Create</Box>
              <Box><Checkbox checked={formData.view} onChange={() => setFormData(prev => ({ ...prev, view: !prev.view }))} /> View</Box>
              <Box><Checkbox checked={formData.update} onChange={() => setFormData(prev => ({ ...prev, update: !prev.update }))} /> Edit/Update</Box>
              <Box><Checkbox checked={formData.delete} onChange={() => setFormData(prev => ({ ...prev, delete: !prev.delete }))} /> Delete</Box>
            </Box>

            <Box mt={3} display='flex' gap={2}>
              <Button type='submit' variant='contained' fullWidth ref={submitRef}>{isEdit ? 'Update' : 'Submit'}</Button>
              <Button variant='outlined' fullWidth onClick={toggleDrawer}>Cancel</Button>
            </Box>
          </form>
        </Box>
      </Drawer>
    </ContentLayout>
  )
}
