'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Box,
  Typography,
  Button,
  IconButton,
  Drawer,
  InputAdornment,
  Menu,
  MenuItem,
  TablePagination
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'

// Icons
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import DownloadIcon from '@mui/icons-material/Download'
import EditIcon from '@mui/icons-material/Edit'
import { MdDelete } from 'react-icons/md'
import CustomAutocomplete from '@core/components/mui/Autocomplete'

// Wrapper
import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'
import { openDB } from 'idb'

// ------------------- Columns -------------------
const getColumns = (handleEdit, handleDelete, paginatedRows) => [
  {
    field: 'serial',
    headerName: 'S.No',
    flex: 0.3,
    minWidth: 70,
    sortable: false,
    valueGetter: params => paginatedRows.findIndex(r => r.id === params.row.id) + 1
  },
  {
    field: 'action',
    headerName: 'Action',
    flex: 0.8,
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
  { field: 'displayFrequency', headerName: 'Display Frequency', flex: 1 },
  { field: 'frequencyCode', headerName: 'Frequency Code', flex: 1 },
  { field: 'description', headerName: 'Description', flex: 1 },
  { field: 'sortOrder', headerName: 'Sort Order', flex: 0.5 },
  {
    field: 'status',
    headerName: 'Status',
    flex: 0.8,
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

export default function ServiceFrequencyPage() {
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [formData, setFormData] = useState({
    incrementType: '',
    noOfIncrements: '',
    backlogAge: '',
    frequencyCode: '',
    displayFrequency: '',
    sortOrder: '',
    description: '',
    status: 'Active'
  })
  const [anchorEl, setAnchorEl] = useState(null)
  const [menuRow, setMenuRow] = useState(null)
  const [incrementTypeOpen, setIncrementTypeOpen] = useState(false)
  const openMenu = Boolean(anchorEl)

  const dbName = 'serviceFrequencyDB'
  const storeName = 'frequencies'

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

  const loadRows = async () => {
    const db = await initDB()
    const allRows = await db.getAll(storeName)
    setRows(allRows.sort((a, b) => b.id - a.id))
  }

  const saveRow = async row => {
    const db = await initDB()
    await db.put(storeName, row)
  }

  const deleteRowFromDB = async id => {
    const db = await initDB()
    await db.delete(storeName, id)
  }

  useEffect(() => {
    loadRows()
  }, [])

  // ---------------- CRUD Handlers ----------------
  const handleAdd = () => {
    setIsEdit(false)
    setFormData({
      incrementType: '',
      noOfIncrements: '',
      backlogAge: '',
      frequencyCode: '',
      displayFrequency: '',
      sortOrder: '',
      description: '',
      status: 'Active'
    })
    setEditRow(null)
    setOpen(true)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setEditRow(row)
    setFormData({ ...row })
    setOpen(true)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (isEdit && editRow) {
      const updatedRow = { ...formData, id: editRow.id }
      setRows(prev => prev.map(r => (r.id === editRow.id ? updatedRow : r)))
      await saveRow(updatedRow)
    } else {
      const newRowData = { ...formData }
      const db = await initDB()
      const newId = await db.add(storeName, newRowData)
      const newRow = { ...newRowData, id: newId }
      setRows(prev => [newRow, ...prev])
    }
    setOpen(false)
  }

  const handleMenuOpen = (e, row) => {
    setAnchorEl(e.currentTarget)
    setMenuRow(row)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setMenuRow(null)
  }

  const handleDelete = async rowToDelete => {
    if (rowToDelete) {
      setRows(prev => prev.filter(r => r.id !== rowToDelete.id))
      await deleteRowFromDB(rowToDelete.id)
    }
    handleMenuClose()
  }

  const handleSearch = e => setSearch(e.target.value)

  const handleExport = () => {
    if (!rows.length) return
    const headers = ['ID', 'Display Frequency', 'Frequency Code', 'Description', 'Sort Order', 'Status']
    const csvRows = rows.map(r =>
      [r.id, `"${r.displayFrequency}"`, r.frequencyCode, `"${r.description}"`, r.sortOrder, r.status].join(',')
    )
    const csv = [headers.join(','), ...csvRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'service-frequency.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredRows = rows.filter(
    r =>
      r.displayFrequency.toLowerCase().includes(search.toLowerCase()) ||
      r.frequencyCode.toLowerCase().includes(search.toLowerCase())
  )

  const paginatedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  const columns = getColumns(handleEdit, handleDelete, paginatedRows)

  const totalRows = filteredRows.length
  const startIndex = totalRows === 0 ? 0 : page * rowsPerPage + 1
  const endIndex = Math.min((page + 1) * rowsPerPage, totalRows)
  const paginationText = `Showing ${startIndex} to ${endIndex} of ${totalRows} entries`

  // ---------------- Refs for keyboard navigation ----------------
  const incrementTypeRef = useRef(null)
  const noOfIncrementsRef = useRef(null)
  const backlogAgeRef = useRef(null)
  const frequencyCodeRef = useRef(null)
  const displayFrequencyRef = useRef(null)
  const sortOrderRef = useRef(null)
  const descriptionRef = useRef(null)
  const submitRef = useRef(null)

  const focusNext = ref => {
    if (!ref.current) return
    const input = ref.current.querySelector('input') || ref.current
    input.focus()
  }

  const toggleDrawer = () => setOpen(prev => !prev)

  return (
    <ContentLayout
      title='Service Frequency'
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Service Frequency' }]}
      actions={
        <Box sx={{ m: 2, display: 'flex', gap: 2 }}>
          <Button variant='outlined' startIcon={<DownloadIcon />} onClick={handleExport}>
            Export
          </Button>
          <Button variant='contained' startIcon={<AddIcon />} onClick={handleAdd}>
            Service Frequency
          </Button>
        </Box>
      }
    >
      <Box sx={{ p: 2, mt: 5, pt: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

      <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            alert(`Details of ${menuRow?.displayFrequency}`)
            handleMenuClose()
          }}
        >
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleDelete(menuRow)}>Delete</MenuItem>
      </Menu>

      {/* ----------------- Drawer Form ----------------- */}
      <Drawer anchor='right' open={open} onClose={toggleDrawer}>
        <Box sx={{ width: 360, p: 3 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6'>{isEdit ? 'Edit Frequency' : 'Add New Frequency'}</Typography>
            <IconButton onClick={toggleDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>

          <form onSubmit={handleSubmit}>
            {/* Increment Type */}
            <CustomAutocomplete
              ref={incrementTypeRef}
              freeSolo={false}
              options={['Year', 'Month', 'Week', 'Day', 'Others']}
              value={formData.incrementType}
              open={incrementTypeOpen}
              onOpen={() => setIncrementTypeOpen(true)}
              onClose={() => setIncrementTypeOpen(false)}
              onFocus={() => setIncrementTypeOpen(true)}
              onInputChange={(e, newValue, reason) => {
                if (reason === 'input' && !['Year','Month','Week','Day','Others'].includes(newValue)) return
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
                      if (e.key === 'Enter' && ['Year','Month','Week','Day','Others'].includes(formData.incrementType)) {
                        e.preventDefault()
                        focusNext(noOfIncrementsRef)
                      } else if (e.key === 'Enter') e.preventDefault()
                    }
                  }}
                  sx={{ minWidth: 200 }}
                />
              )}
            />

            {/* No of Increments */}
            <CustomTextField
              inputRef={noOfIncrementsRef}
              fullWidth
              margin='normal'
              label='No of Increments'
              name='noOfIncrements'
              value={formData.noOfIncrements}
              onChange={e => /^\d*$/.test(e.target.value) && setFormData(prev => ({ ...prev, noOfIncrements: e.target.value }))}
              inputProps={{
                inputMode: 'numeric',
                pattern: '[0-9]*',
                onKeyDown: e => {
                  if (e.key === 'Enter') { e.preventDefault(); focusNext(backlogAgeRef) }
                }
              }}
            />

            {/* Backlog Age */}
            <CustomTextField
              inputRef={backlogAgeRef}
              fullWidth
              margin='normal'
              label='Backlog Age'
              name='backlogAge'
              value={formData.backlogAge}
              onChange={e => /^\d*$/.test(e.target.value) && setFormData(prev => ({ ...prev, backlogAge: e.target.value }))}
              inputProps={{
                inputMode: 'numeric',
                pattern: '[0-9]*',
                onKeyDown: e => { if (e.key === 'Enter') { e.preventDefault(); focusNext(frequencyCodeRef) } }
              }}
            />

            {/* Frequency Code */}
            <CustomTextField
              inputRef={frequencyCodeRef}
              fullWidth
              margin='normal'
              label='Frequency Code'
              name='frequencyCode'
              value={formData.frequencyCode}
              onChange={e => setFormData(prev => ({ ...prev, frequencyCode: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); focusNext(displayFrequencyRef) } }}
            />

            {/* Display Frequency */}
            <CustomTextField
              inputRef={displayFrequencyRef}
              fullWidth
              margin='normal'
              label='Display Frequency'
              name='displayFrequency'
              value={formData.displayFrequency}
              onChange={e => setFormData(prev => ({ ...prev, displayFrequency: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); focusNext(sortOrderRef) } }}
            />

            {/* Sort Order */}
            <CustomTextField
              inputRef={sortOrderRef}
              fullWidth
              margin='normal'
              label='Sort Order'
              name='sortOrder'
              value={formData.sortOrder}
              onChange={e => /^\d*$/.test(e.target.value) && setFormData(prev => ({ ...prev, sortOrder: e.target.value }))}
              inputProps={{
                inputMode: 'numeric',
                pattern: '[0-9]*',
                onKeyDown: e => { if (e.key === 'Enter') { e.preventDefault(); focusNext(descriptionRef) } }
              }}
            />

            {/* Description */}
            <CustomTextField
              inputRef={descriptionRef}
              fullWidth
              margin='normal'
              multiline
              rows={3}
              label='Description'
              name='description'
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              inputProps={{ onKeyDown: e => { if (e.key === 'Enter') { e.preventDefault(); focusNext(submitRef) } } }}
            />

            {/* Status - Only for Edit */}
            {isEdit && (
              <CustomTextField
                fullWidth
                margin='normal'
                label='Status'
                select
                value={formData.status || 'Active'}
                onChange={async e => {
                  const newStatus = e.target.value
                  setFormData(prev => ({ ...prev, status: newStatus }))
                  if (editRow) {
                    const updatedRow = { ...editRow, status: newStatus }
                    setRows(prev => prev.map(r => (r.id === editRow.id ? updatedRow : r)))
                    const db = await initDB()
                    await db.put(storeName, updatedRow)
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
