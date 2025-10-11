'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Box,
  Button,
  IconButton,
  Drawer,
  Typography,
  InputAdornment,
  TablePagination,
  Autocomplete
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'

// Icons
import AddIcon from '@mui/icons-material/Add'
import DownloadIcon from '@mui/icons-material/Download'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'

// Layout & Custom Input
import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'

// IndexedDB
import { openDB } from 'idb'

const DB_NAME = 'PestDB'
const STORE_NAME = 'pests'

async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

async function getAllPests() {
  const db = await initDB()
  return db.getAll(STORE_NAME)
}

async function addPest(pest) {
  const db = await initDB()
  const id = await db.add(STORE_NAME, pest)
  return { ...pest, id }
}

async function updatePest(pest) {
  const db = await initDB()
  await db.put(STORE_NAME, pest)
  return pest
}

async function deletePest(id) {
  const db = await initDB()
  await db.delete(STORE_NAME, id)
}

// Map drawerType to data key
const getKeyFromDrawerType = type => {
  switch (type.toLowerCase()) {
    case 'chemicals':
      return 'chemicals'
    case 'checklist':
      return 'checklist'
    case 'finding':
      return 'finding'
    case 'action':
      return 'action'
    case 'adddesc':
    case 'add description':
      return 'addDesc'
    default:
      return 'addDesc'
  }
}

export default function PestPage() {
  // ---------------- Main Drawer ----------------
  const [mainDrawerOpen, setMainDrawerOpen] = useState(false)
  const [editPest, setEditPest] = useState(null)
  const [mainFormData, setMainFormData] = useState({
    pest_code: '',
    parent_code: '',
    name: '',
    value: '',
    description: '',
    status: 'Active',
    user_role: 'Admin'
  })

  const submitRef = useRef(null)
  const statusInputRef = useRef(null)
  const statusOptions = ['Active', 'Inactive']

  // ---------------- Sub Drawer ----------------
  const [subDrawerOpen, setSubDrawerOpen] = useState(false)
  const [drawerType, setDrawerType] = useState('Finding')
  const [formData, setFormData] = useState({ name: '', status: 'Active' })
  const [editRow, setEditRow] = useState(null)
  const [selectedPestId, setSelectedPestId] = useState(null)

  // ---------------- Table & Search ----------------
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(5)
  const [rows, setRows] = useState([])

  // Load data from IndexedDB on mount
  useEffect(() => {
    async function fetchData() {
      const pests = await getAllPests()
      setRows(pests.sort((a, b) => b.id - a.id)) // recent first
    }
    fetchData()
  }, [])

  const filteredRows = rows.filter(
    row =>
      row.name.toLowerCase().includes(searchText.toLowerCase()) ||
      row.pest_code.toLowerCase().includes(searchText.toLowerCase()) ||
      row.parent_code.toLowerCase().includes(searchText.toLowerCase())
  )
  const paginatedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const totalRows = filteredRows.length
  const startIndex = totalRows === 0 ? 0 : page * rowsPerPage + 1
  const endIndex = Math.min((page + 1) * rowsPerPage, totalRows)
  const paginationText = `Showing ${startIndex} to ${endIndex} of ${totalRows} entries`

  // ---------------- Drawer Functions ----------------
  const handleKeyPress = (e, currentFieldIndex) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (currentFieldIndex === 4 && statusInputRef.current) {
        statusInputRef.current.focus()
        return
      }
      const form = e.target.form
      const inputs = Array.from(form.querySelectorAll('input, textarea')).filter(
        el => !el.disabled && el.type !== 'hidden'
      )
      const nextIndex = inputs.findIndex(input => input === e.target) + 1
      if (nextIndex < inputs.length) inputs[nextIndex].focus()
    }
  }

  const handleMainSubmit = async () => {
    if (!mainFormData.pest_code || !mainFormData.name) return

    if (editPest) {
      const updated = { ...editPest, ...mainFormData }
      await updatePest(updated)
      setRows(prev => prev.map(r => (r.id === updated.id ? updated : r)))
    } else {
      const newPest = {
        ...mainFormData,
        finding: [],
        action: [],
        chemicals: [],
        checklist: [],
        addDesc: []
      }
      const savedPest = await addPest(newPest)
      setRows(prev => [savedPest, ...prev])
    }

    setMainFormData({
      pest_code: '',
      parent_code: '',
      name: '',
      value: '',
      description: '',
      status: 'Active',
      user_role: 'Admin'
    })
    setEditPest(null)
    setMainDrawerOpen(false)
  }

  const openSubDrawer = (row, type) => {
    setSelectedPestId(row.id)
    setDrawerType(type)
    setFormData({ name: '', status: 'Active' })
    setEditRow(null)
    setSubDrawerOpen(true)
  }

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleAddItem = async () => {
    if (!formData.name) return
    const key = getKeyFromDrawerType(drawerType)

    const updatedRows = await Promise.all(
      rows.map(async r => {
        if (r.id !== selectedPestId) return r

        let newRow
        if (editRow) {
          // Update existing sub-item
          newRow = { ...r, [key]: r[key].map(f => (f.id === editRow.id ? { ...f, ...formData } : f)) }
        } else {
          // Add new sub-item
          const newSubId = r[key].length ? Math.max(...r[key].map(f => f.id)) + 1 : 1
          newRow = { ...r, [key]: [...r[key], { id: newSubId, ...formData }] }
        }
        await updatePest(newRow)
        return newRow
      })
    )
    setRows(updatedRows)
    setFormData({ name: '', status: 'Active' })
    setEditRow(null)
  }

  const handleEdit = row => {
    setFormData({ name: row.name, status: row.status })
    setEditRow(row)
  }

  const handleDelete = async id => {
    const key = getKeyFromDrawerType(drawerType)

    const updatedRows = await Promise.all(
      rows.map(async r => {
        if (r.id !== selectedPestId) return r
        const newRow = { ...r, [key]: r[key].filter(f => f.id !== id) }
        await updatePest(newRow)
        return newRow
      })
    )
    setRows(updatedRows)
  }

  const getDrawerRows = () => {
    if (!selectedPestId) return []
    const pest = rows.find(r => r.id === selectedPestId)
    if (!pest) return []
    const key = getKeyFromDrawerType(drawerType)
    return pest[key] || []
  }

  // ---------------- Columns ----------------
  const drawerColumns = [
    {
      field: 'actions',
      headerName: 'Actions',
      minWidth: 100,
      renderCell: params => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size='small' onClick={() => handleEdit(params.row)}>
            <EditIcon fontSize='small' />
          </IconButton>
          <IconButton size='small' color='error' onClick={() => handleDelete(params.row.id)}>
            <DeleteIcon fontSize='small' />
          </IconButton>
        </Box>
      )
    },
    { field: 'name', headerName: `${drawerType} Name`, minWidth: 150, flex: 1 },
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 100,
      renderCell: params => (
        <Button
          variant='contained'
          size='small'
          color={params.value === 'Active' ? 'success' : 'error'}
          sx={{ borderRadius: '999px', px: 2 }}
        >
          {params.value}
        </Button>
      )
    }
  ]

  const columns = [
    { field: 'pest_code', headerName: 'Pest Code', minWidth: 150, flex: 1 },
    {
      field: 'edit',
      headerName: 'Actions',
      minWidth: 100,
      sortable: false,
      disableColumnMenu: true,
      renderCell: params => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            size='small'
            color='error'
            onClick={async () => {
              await deletePest(params.row.id)
              setRows(prev => prev.filter(r => r.id !== params.row.id))
            }}
          >
            <DeleteIcon />
          </IconButton>
          <IconButton
            size='small'
            onClick={() => {
              setEditPest(params.row)
              setMainFormData(prev => ({ ...prev, ...params.row }))
              setMainDrawerOpen(true)
            }}
          >
            <EditIcon />
          </IconButton>
        </Box>
      )
    },
    { field: 'parent_code', headerName: 'Parent Group', minWidth: 150, flex: 1 },
    { field: 'name', headerName: 'Display Pest Name', minWidth: 180, flex: 1 },
    { field: 'value', headerName: 'Pest Value', minWidth: 100 },
    { field: 'description', headerName: 'Description', minWidth: 200, flex: 1 },
    {
      field: 'finding',
      headerName: 'Finding',
      minWidth: 120,
      renderCell: params => (
        <Button
          variant='outlined'
          size='small'
          onClick={() => openSubDrawer(params.row, 'Finding')}
          sx={{ borderRadius: '999px', px: 2 }}
        >
          Finding({params.row.finding?.length || 0})
        </Button>
      )
    },
    {
      field: 'action',
      headerName: 'Action',
      minWidth: 120,
      renderCell: params => (
        <Button
          variant='outlined'
          size='small'
          onClick={() => openSubDrawer(params.row, 'Action')}
          sx={{ borderRadius: '999px', px: 2 }}
        >
          Action({params.row.action?.length || 0})
        </Button>
      )
    },
    {
      field: 'addDesc',
      headerName: 'Add Description',
      minWidth: 120,
      renderCell: params => (
        <Button
          variant='outlined'
          size='small'
          onClick={() => openSubDrawer(params.row, 'Add Description')}
          sx={{ borderRadius: '999px', px: 2 }}
        >
          AddDesc({params.row.addDesc?.length || 0})
        </Button>
      )
    },
    {
      field: 'chemicals',
      headerName: 'Chemicals',
      minWidth: 120,
      renderCell: params => (
        <Button
          variant='outlined'
          size='small'
          onClick={() => openSubDrawer(params.row, 'Chemicals')}
          sx={{ borderRadius: '999px', px: 2 }}
        >
          Chemicals({params.row.chemicals?.length || 0})
        </Button>
      )
    },
    {
      field: 'checklist',
      headerName: 'Checklist',
      minWidth: 120,
      renderCell: params => (
        <Button
          variant='outlined'
          size='small'
          onClick={() => openSubDrawer(params.row, 'Checklist')}
          sx={{ borderRadius: '999px', px: 2 }}
        >
          Checklist({params.row.checklist?.length || 0})
        </Button>
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 100,
      renderCell: params => (
        <Button
          variant='contained'
          size='small'
          color={params.value === 'Active' ? 'success' : 'error'}
          sx={{ borderRadius: '999px', px: 2 }}
        >
          {params.value}
        </Button>
      )
    }
  ]

  return (
    <ContentLayout
      title='Service Type (Pest)'
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Service Type (Pest)' }]}
      actions={
        <Box sx={{ m: 2, display: 'flex', gap: 2 }}>
          <Button variant='outlined' startIcon={<DownloadIcon />}>
            Export
          </Button>
          <Button
            variant='contained'
            startIcon={<AddIcon />}
            onClick={() => {
              setEditPest(null)
              setMainFormData({
                pest_code: '',
                parent_code: '',
                name: '',
                value: '',
                description: '',
                status: 'Active',
                user_role: 'Admin'
              })
              setMainDrawerOpen(true)
            }}
          >
            Add Pest
          </Button>
        </Box>
      }
    >
      {/* Search */}
      <Box sx={{ p: 2, mt: 5, pt: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <CustomTextField
          size='small'
          placeholder='Search'
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
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
      <Box sx={{ width: '100%', overflowX: 'auto', mt: 5 }}>
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
      </Box>

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

      {/* Main Drawer */}
      <Drawer anchor='right' open={mainDrawerOpen} onClose={() => setMainDrawerOpen(false)}>
        <Box sx={{ width: 400, p: 3 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6'>{editPest ? 'Edit Pest' : 'Add New Pest'}</Typography>
            <IconButton onClick={() => setMainDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <form>
            <CustomTextField
              fullWidth
              margin='normal'
              label='Service Type Code'
              name='pest_code'
              value={mainFormData.pest_code}
              onChange={e => setMainFormData({ ...mainFormData, pest_code: e.target.value })}
              onKeyDown={e => handleKeyPress(e, 0)}
            />
            <CustomTextField
              fullWidth
              margin='normal'
              label='Parent Pest Group Code'
              name='parent_code'
              value={mainFormData.parent_code}
              onChange={e => setMainFormData({ ...mainFormData, parent_code: e.target.value })}
              onKeyDown={e => handleKeyPress(e, 1)}
            />
            <CustomTextField
              fullWidth
              margin='normal'
              label='Display Pest Name'
              name='name'
              value={mainFormData.name}
              onChange={e => setMainFormData({ ...mainFormData, name: e.target.value })}
              onKeyDown={e => handleKeyPress(e, 2)}
            />
            <CustomTextField
              fullWidth
              margin='normal'
              label='Pest Value'
              name='value'
              type='number'
              value={mainFormData.value}
              onChange={e => setMainFormData({ ...mainFormData, value: e.target.value })}
              onKeyDown={e => {
                handleKeyPress(e, 3)
                if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault()
              }}
              InputProps={{
                sx: {
                  '& input[type=number]': { MozAppearance: 'textfield' },
                  '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                    WebkitAppearance: 'none',
                    margin: 0
                  }
                }
              }}
            />
            <CustomTextField
              fullWidth
              margin='normal'
              label='Description'
              name='description'
              multiline
              rows={3}
              value={mainFormData.description}
              onChange={e => setMainFormData({ ...mainFormData, description: e.target.value })}
              onKeyDown={e => handleKeyPress(e, 4)}
            />

            {/* ✅ Status only in Edit mode */}
            {editPest && (
              <Autocomplete
                freeSolo={false}
                options={statusOptions}
                value={mainFormData.status}
                openOnFocus
                onChange={(e, val) => {
                  setMainFormData(prev => ({ ...prev, status: val }))
                  // Update table immediately
                  setRows(prev => prev.map(r => (r.id === editPest.id ? { ...r, status: val } : r)))
                }}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    label='Status'
                    inputRef={statusInputRef}
                    onKeyDown={e => {
                      if (e.key === 'Enter') submitRef.current?.focus()
                    }}
                  />
                )}
                sx={{ mt: 2 }}
              />
            )}

            <Box mt={3} display='flex' gap={2}>
              <Button variant='contained' fullWidth ref={submitRef} onClick={handleMainSubmit}>
                {editPest ? 'Update' : 'Submit'}
              </Button>
              <Button variant='outlined' fullWidth onClick={() => setMainDrawerOpen(false)}>
                Cancel
              </Button>
            </Box>
          </form>
        </Box>
      </Drawer>

      {/* Sub Drawer */}
      <Drawer anchor='right' open={subDrawerOpen} onClose={() => setSubDrawerOpen(false)}>
        <Box sx={{ width: 550, p: 4 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6'>Manage {drawerType}</Typography>
            <IconButton onClick={() => setSubDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <CustomTextField
            fullWidth
            label={`${drawerType} Name`}
            name='name'
            value={formData.name}
            onChange={handleChange}
            margin='normal'
          />
          <Button variant='contained' fullWidth sx={{ mt: 2 }} onClick={handleAddItem}>
            {editRow ? 'Update' : 'Add'} {drawerType}
          </Button>
          <Box mt={3}>
            <Typography variant='subtitle1' mb={1}>
              {drawerType} List
            </Typography>
            <DataGrid
              rows={getDrawerRows()}
              columns={drawerColumns}
              autoHeight
              getRowId={row => row.id}
              disableRowSelectionOnClick
              hideFooter
              getRowHeight={() => 'auto'}
              sx={{
                '& .MuiDataGrid-row': { minHeight: '50px !important', padding: '10px 0' },
                '& .MuiDataGrid-cell': {
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  alignItems: 'flex-start',
                  display: 'flex'
                },
                '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
                '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': { outline: 'none' }
              }}
            />
          </Box>
        </Box>
      </Drawer>
    </ContentLayout>
  )
}
