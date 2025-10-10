'use client'

import { useState, useRef, useEffect } from 'react'
import { Box, Typography, Button, IconButton, Drawer, InputAdornment, TablePagination } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { Autocomplete } from '@mui/material'
import { openDB } from 'idb'

// Icons
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import DownloadIcon from '@mui/icons-material/Download'
import { MdDelete } from 'react-icons/md'

// Wrapper
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
  const [formData, setFormData] = useState({
    name: '',
    sortOrder: '',
    description: '',
    status: 'Active'
  })

  // --- Autocomplete ---
  const statusOptions = ['Active', 'Inactive']
  const [statusOpen, setStatusOpen] = useState(false)
  const statusRef = useRef(null)
  const statusInputRef = useRef(null)
  const submitButtonRef = useRef(null)

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
    const sortedRows = allRows.sort((a, b) => b.id - a.id)
    setRows(sortedRows)
  }

  useEffect(() => {
    loadRows()
  }, [])

  const toggleDrawer = () => setOpen(prev => !prev)

  const handleAdd = () => {
    setIsEdit(false)
    setFormData({ name: '', sortOrder: '', description: '', status: 'Active' })
    setEditRow(null)
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

  const handleChange = e => {
    const { name, value } = e.target
    let finalValue = value
    if (name === 'sortOrder') {
      if (value === '' || /^\d+$/.test(value)) finalValue = value
      else return
    }
    setFormData({ ...formData, [name]: finalValue })
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (formData.name && formData.sortOrder && /^\d+$/.test(formData.sortOrder)) {
      const db = await initDB()
      const dataToSave = { ...formData, sortOrder: BigInt(formData.sortOrder).toString() } // ✅ Save as string to keep full number

      if (isEdit && editRow) {
        await db.put(STORE_NAME, { ...dataToSave, id: editRow.id })
      } else {
        await db.add(STORE_NAME, dataToSave)
      }
      await loadRows()
      toggleDrawer()
    }
  }

  const handleKeyPress = (e, currentFieldIndex) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const form = e.target.form
      const inputs = Array.from(form.querySelectorAll('input, textarea')).filter(
        el => !el.disabled && el.type !== 'hidden'
      )

      const currentElement = e.target
      const currentIndex = inputs.findIndex(input => input === currentElement)

      if (currentFieldIndex === 0) {
        const nextInput = inputs[currentIndex + 1]
        nextInput?.focus()
      } else if (currentFieldIndex === 1) {
        const nextInput = form.querySelector('textarea[name="description"]')
        nextInput?.focus()
      } else if (currentFieldIndex === 2 && statusInputRef.current) {
        statusInputRef.current.focus()
        setStatusOpen(true)
      } else if (currentFieldIndex === 3) {
        submitButtonRef.current?.focus()
      } else {
        const nextIndex = currentIndex + 1
        if (nextIndex < inputs.length) inputs[nextIndex].focus()
      }
    }
  }

  const handleSearch = e => setSearchText(e.target.value)

  const filteredRows = rows.filter(
    row =>
      row.name.toLowerCase().includes(searchText.toLowerCase()) ||
      String(row.sortOrder).includes(searchText.toLowerCase())
  )

  const paginatedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const totalRows = filteredRows.length
  const startIndex = totalRows === 0 ? 0 : page * rowsPerPage + 1
  const endIndex = Math.min((page + 1) * rowsPerPage, totalRows)
  const paginationText = `Showing ${startIndex} to ${endIndex} of ${totalRows} entries`

  // ✅ Columns - fixed sortOrder to always show full number
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
    { field: 'name', headerName: 'Call Type Name', flex: 1 },
    {
      field: 'sortOrder',
      headerName: 'Sort Order',
      flex: 0.5,
      valueGetter: params => String(params.row.sortOrder) // ✅ Always convert to string to avoid scientific notation
    },
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
              fullWidth
              margin='normal'
              label='Call Type Name'
              name='name'
              value={formData.name}
              onChange={handleChange}
              onKeyDown={e => handleKeyPress(e, 0)}
            />

            <CustomTextField
              fullWidth
              margin='normal'
              label='Sort Order'
              name='sortOrder'
              value={formData.sortOrder}
              type='text'
              onChange={handleChange}
              inputProps={{
                inputMode: 'numeric',
                pattern: '[0-9]*',
                onKeyDown: e => {
                  if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault()
                  else if (e.key === 'Enter') {
                    e.preventDefault()
                    if (/^\d+$/.test(formData.sortOrder)) {
                      const nextInput = e.target.form.querySelector('textarea[name="description"]')
                      nextInput?.focus()
                    }
                  }
                }
              }}
            />
            <CustomTextField
              fullWidth
              margin='normal'
              label='Description'
              name='description'
              value={formData.description}
              multiline
              rows={3}
              onChange={handleChange}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === 'Tab') {
                  e.preventDefault()
                  if (statusInputRef.current) {
                    statusInputRef.current.focus()
                    setStatusOpen(true)
                  }
                }
              }}
            />

            <Autocomplete
              ref={statusRef}
              freeSolo={false}
              options={statusOptions}
              value={formData.status}
              open={statusOpen}
              onOpen={() => setStatusOpen(true)}
              onClose={() => setStatusOpen(false)}
              onChange={(e, newValue) => setFormData(prev => ({ ...prev, status: newValue }))}
              onInputChange={(e, newValue, reason) => {
                if (reason === 'input' && !statusOptions.includes(newValue)) return
                setFormData(prev => ({ ...prev, status: newValue }))
              }}
              noOptionsText='No options'
              renderInput={params => (
                <CustomTextField
                  {...params}
                  label='Status'
                  inputRef={statusInputRef}
                  inputProps={{
                    ...params.inputProps,
                    onKeyDown: e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (!statusOpen && statusOptions.includes(formData.status)) {
                          submitButtonRef.current?.focus()
                        }
                      }
                    }
                  }}
                />
              )}
              sx={{ mt: 2 }}
            />

            <Box mt={3} display='flex' gap={2}>
              <Button type='submit' variant='contained' fullWidth ref={submitButtonRef}>
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
