'use client'

import { useState, useRef, useEffect } from 'react'
import { openDB } from 'idb'
import {
  Box,
  Typography,
  Button,
  IconButton,
  Drawer,
  InputAdornment,
  Autocomplete,
  MenuItem,
  Card, // Added for Card layout
  Divider, // Added for Divider
  FormControl, // Added for Select
  Select, // Added for Select
  Pagination // Added for Pagination
} from '@mui/material'

// Icons (Updated to include sorting icons)
import { MdDelete } from 'react-icons/md'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import DownloadIcon from '@mui/icons-material/Download'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'

// Custom Components
import CustomTextField from '@core/components/mui/TextField'
import Link from 'next/link' // Added for Breadcrumb Link

export default function ChemicalsPage() {
  // ---------------- State ----------------
  const [rows, setRows] = useState([])
  const [searchText, setSearchText] = useState('')
  const [open, setOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    dosage: '',
    ingredients: '',
    status: 'Active',
    file: ''
  })
  const [unitOpen, setUnitOpen] = useState(false) // Used for Autocomplete control

  // State for Sorting (From Page A)
  const [sortField, setSortField] = useState('id')
  const [sortDirection, setSortDirection] = useState('desc')

  // State for Pagination (From Page A)
  const [page, setPage] = useState(1) // 1-based indexing
  const [pageSize, setPageSize] = useState(10) // Equivalent to rowsPerPage

  const unitOptions = ['kg', 'litre', 'bottle', 'pkt', 'box']

  // File Upload
  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState('')

  // Keyboard Refs
  const nameRef = useRef(null)
  const unitRef = useRef(null)
  const dosageRef = useRef(null)
  const ingredientsRef = useRef(null)
  const statusRef = useRef(null)
  const submitRef = useRef(null)

  // ---------------- IndexedDB ----------------
  const DB_NAME = 'chemicals_db'
  const STORE_NAME = 'chemicals'

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
    const all = await db.getAll(STORE_NAME)
    // Initial load: sort by ID descending (latest first)
    setRows(all.sort((a, b) => b.id - a.id))
  }

  useEffect(() => {
    loadRows()
  }, [])

  // ---------------- CRUD ----------------
  const toggleDrawer = () => setOpen(prev => !prev)

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleAdd = () => {
    setIsEdit(false)
    setFormData({ name: '', unit: '', dosage: '', ingredients: '', status: 'Active', file: '' })
    setSelectedFile('')
    setEditRow(null)
    setOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setEditRow(row)
    setFormData(row)
    setSelectedFile(row.file || '')
    setOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  const handleDelete = async row => {
    const db = await initDB()
    await db.delete(STORE_NAME, row.id)
    setRows(prev => prev.filter(r => r.id !== row.id))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const db = await initDB()
    const dataToSave = { ...formData, file: selectedFile }

    if (isEdit && editRow) {
      const rowToSave = { ...editRow, ...dataToSave }
      await db.put(STORE_NAME, rowToSave)
      setRows(prev => prev.map(r => (r.id === editRow.id ? rowToSave : r)))
    } else {
      // IndexedDB auto-increments, so we just use the ID returned by db.add
      const id = await db.add(STORE_NAME, dataToSave)
      const newRow = { id, ...dataToSave }

      // Add new row to the front and sort by 'id' descending to see it immediately
      setRows(prev => {
        const newRows = [newRow, ...prev.filter(r => r.id !== newRow.id)]
        return newRows.sort((a, b) => b.id - a.id)
      })
    }
    toggleDrawer()
    // Reset sort to 'id' desc to show the new/updated row easily
    setSortField('id')
    setSortDirection('desc')
  }

  // ---------------- File Upload ----------------
  const handleFileChange = e => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file.name)
      setFormData(prev => ({ ...prev, file: file.name }))
    }
  }

  const handleFileDrop = e => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      setSelectedFile(file.name)
      setFormData(prev => ({ ...prev, file: file.name }))
    }
  }

  // ---------------- Sorting Logic (From Page A) ----------------
  const handleSort = field => {
    // If clicking the current sort field, toggle direction
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      // If clicking a new field, set it as the sort field and default to 'asc'
      setSortField(field)
      setSortDirection('asc')
    }
    setPage(1) // Reset to first page on sort change
  }

  const sortedRows = [...rows].sort((a, b) => {
    const aValue = a[sortField] || ''
    const bValue = b[sortField] || ''

    let comparison = 0
    // Check if values are numerical (for dosage and id)
    if (sortField === 'id' || sortField === 'dosage') {
      comparison = Number(a[sortField] || 0) - Number(b[sortField] || 0)
    } else {
      // Case-insensitive string comparison
      comparison = String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' })
    }

    // Apply the sort direction
    return sortDirection === 'asc' ? comparison : comparison * -1
  })

  // Helper component to render the sort icon
  const SortIcon = ({ field }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <ArrowUpwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
    ) : (
      <ArrowDownwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
    )
  }

  // ---------------- Filtering and Pagination (From Page A) ----------------
  const handleSearch = e => {
    setSearchText(e.target.value)
    setPage(1) // Reset page on search
  }

  // Client-side filtering based on search text (uses sortedRows)
  const filteredRows = sortedRows.filter(
    row =>
      row.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      row.unit?.toLowerCase().includes(searchText.toLowerCase()) ||
      row.ingredients?.toLowerCase().includes(searchText.toLowerCase())
  )

  // Client-side pagination logic
  const rowCount = filteredRows.length
  const pageCount = Math.max(1, Math.ceil(rowCount / pageSize))
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)
  const startIndex = rowCount === 0 ? 0 : (page - 1) * pageSize + 1
  const endIndex = Math.min(page * pageSize, rowCount)

  // ---------------- Keyboard Navigation ----------------
  const focusNext = ref => ref?.current?.focus()

  // This handles the status update logic which was immediate in Page B original
  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setFormData(prev => ({ ...prev, status: newStatus }));

    // Only update DB/State immediately if we are in Edit mode
    if (isEdit && editRow) {
      const updatedRow = { ...editRow, status: newStatus };
      setRows(prev => prev.map(r => (r.id === editRow.id ? updatedRow : r)));
      const db = await initDB();
      await db.put(STORE_NAME, updatedRow);
    }
  }


  return (
    <Box>
      {/* Breadcrumb (From Page A) */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <Link href='/' style={{ color: '#7367F0', textDecoration: 'none', fontSize: 14 }}>
          Dashboard
        </Link>
        <Typography sx={{ mx: 1, color: 'text.secondary' }}>/</Typography>
        <Typography variant='body2' sx={{ fontSize: 14 }}>
          Chemicals
        </Typography>
      </Box>

      <Card sx={{ p: 6 }}>
        {/* Header + actions (From Page A's structure) */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant='h6'>Chemicals List</Typography>

          <Box display='flex' gap={1}>
            <Button variant='outlined' endIcon={<ArrowDropDownIcon />}>
              Export
            </Button>
            <Button variant='contained' startIcon={<AddIcon />} onClick={handleAdd}>
              Add Chemical
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Search / entries (From Page A) */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <FormControl size='small' sx={{ minWidth: 120 }}>
            <Select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value))
                setPage(1)
              }}
            >
              {[10, 25, 50, 100].map(i => (
                <MenuItem key={i} value={i}>
                  {i} entries
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <CustomTextField
            size='small'
            placeholder='Search by Name, Unit, or Ingredients...'
            value={searchText}
            onChange={handleSearch}
            sx={{ width: 420 }}
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

        {/* Table (Manual HTML Table - From Page A) */}
        <Box sx={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              tableLayout: 'fixed'
            }}
          >
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>
                {/* S.No Header */}
                <th
                  onClick={() => handleSort('id')}
                  style={{ padding: '12px', width: '60px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    S.No <SortIcon field='id' />
                  </Box>
                </th>

                <th style={{ padding: '12px', width: '100px' }}>Action</th>

                {/* Chemical Name Header */}
                <th
                  onClick={() => handleSort('name')}
                  style={{ padding: '12px', width: '150px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Chemical Name <SortIcon field='name' />
                  </Box>
                </th>

                {/* Unit Header */}
                <th
                  onClick={() => handleSort('unit')}
                  style={{ padding: '12px', width: '100px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Unit <SortIcon field='unit' />
                  </Box>
                </th>

                {/* Dosage Header */}
                <th
                  onClick={() => handleSort('dosage')}
                  style={{ padding: '12px', width: '100px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Dosage <SortIcon field='dosage' />
                  </Box>
                </th>

                {/* Ingredients Header */}
                <th
                  onClick={() => handleSort('ingredients')}
                  style={{ padding: '12px', width: '300px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Ingredients <SortIcon field='ingredients' />
                  </Box>
                </th>

                {/* Status Header */}
                <th
                  onClick={() => handleSort('status')}
                  style={{ padding: '12px', width: '100px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Status <SortIcon field='status' />
                  </Box>
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedRows.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '12px', wordWrap: 'break-word', whiteSpace: 'normal' }}>
                    {(page - 1) * pageSize + i + 1}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton size='small' onClick={() => handleEdit(r)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size='small' color='error' onClick={() => handleDelete(r)}>
                        <MdDelete />
                      </IconButton>
                    </Box>
                  </td>
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.name}</td>
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.unit}</td>
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.dosage}</td>
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.ingredients}</td>
                  <td style={{ padding: '12px' }}>
                    <Box
                      component='span'
                      sx={{
                        fontWeight: 600,
                        color: '#fff',
                        backgroundColor: r.status === 'Active' ? 'success.main' : 'error.main',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '6px',
                        display: 'inline-block'
                      }}
                    >
                      {r.status}
                    </Box>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rowCount === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color='text.secondary'>No results found</Typography>
            </Box>
          )}
        </Box>

        {/* Pagination Footer (From Page A) */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 2,
            py: 2,
            mt: 2,
            flexWrap: 'wrap'
          }}
        >
          <Typography variant='body2' color='text.secondary'>
            Showing {startIndex} to {endIndex} of {rowCount} entries
          </Typography>

          <Box display='flex' alignItems='center' gap={2}>
            <Typography variant='body2' color='text.secondary'>
              Page {page} of {pageCount}
            </Typography>

            <Pagination
              count={pageCount}
              page={page}
              onChange={(e, value) => setPage(value)}
              shape='rounded'
              color='primary'
              showFirstButton
              showLastButton
            />
          </Box>
        </Box>
      </Card>

      {/* Drawer Form (Retains original logic and fields) */}
      <Drawer anchor='right' open={open} onClose={toggleDrawer}>
        <Box sx={{ width: 360, p: 3 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6'>{isEdit ? 'Edit Chemical' : 'Add New Chemical'}</Typography>
            <IconButton onClick={toggleDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>

          <form onSubmit={handleSubmit}>
            <CustomTextField
              inputRef={nameRef}
              fullWidth
              margin='normal'
              label='Chemical Name'
              name='name'
              value={formData.name}
              sx={{ mt: 2 }}
              onChange={handleChange}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  // Move focus to Unit field & open dropdown
                  setTimeout(() => {
                    unitRef.current?.querySelector('input')?.focus()
                    setUnitOpen(true)
                  }, 100)
                }
              }}
            />

            {/* Unit (Autocomplete retained from Page B) */}
            <Autocomplete
              ref={unitRef}
              freeSolo={false}
              options={unitOptions}
              value={formData.unit}
              open={unitOpen}
              onOpen={() => setUnitOpen(true)}
              onClose={() => setUnitOpen(false)}
              onFocus={() => setUnitOpen(true)}
              sx={{ mt: 5 }}
              onInputChange={(e, newValue) => {
                setFormData(prev => ({ ...prev, unit: newValue }))
              }}
              onChange={(e, newValue) => setFormData(prev => ({ ...prev, unit: newValue }))}
              noOptionsText='No options'
              renderInput={params => (
                <CustomTextField
                  {...params}
                  label='Unit'
                  inputProps={{
                    ...params.inputProps,
                    onKeyDown: e => {
                      if (e.key === 'Enter' && unitOptions.includes(formData.unit)) {
                        e.preventDefault()
                        focusNext(dosageRef)
                      } else if (e.key === 'Enter') {
                        e.preventDefault()
                      }
                    }
                  }}
                />
              )}
            />

            {/* File Upload (Retained from Page B) */}
            <Box sx={{ mt: 4 }}>
              <CustomTextField
                label='Upload File'
                fullWidth
                margin='normal'
                InputProps={{ readOnly: true }}
                value=''
                sx={{
                  '& .MuiInputBase-root': {
                    display: 'none'
                  }
                }}
              />
              <input type='file' ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
              <Button
                variant='outlined'
                fullWidth
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDragLeave={e => e.preventDefault()}
                onDrop={handleFileDrop}
                sx={{
                  borderColor: 'black',
                  borderStyle: 'solid',
                  borderWidth: 1,
                  justifyContent: 'space-between',
                  py: 1.5
                }}
              >
                <Typography sx={{ color: selectedFile ? 'text.primary' : 'text.disabled' }}>
                  {selectedFile || 'Choose File or Drag & Drop Here'}
                </Typography>
                <Typography variant='body2' color='primary'>
                  Browse
                </Typography>
              </Button>
            </Box>

            {/* Dosage (Retained from Page B - numeric only) */}
            <CustomTextField
              inputRef={dosageRef}
              fullWidth
              margin='normal'
              label='Dosage'
              name='dosage'
              value={formData.dosage}
              sx={{ mt: 5 }}
              onChange={e => /^\d*$/.test(e.target.value) && handleChange(e)}
              inputProps={{
                inputMode: 'numeric',
                pattern: '[0-9]*',
                onKeyDown: e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    focusNext(ingredientsRef)
                  }
                }
              }}
            />

            {/* Ingredients */}
            <CustomTextField
              inputRef={ingredientsRef}
              fullWidth
              margin='normal'
              multiline
              rows={3}
              sx={{ mt: 5 }}
              label='Ingredients'
              name='ingredients'
              value={formData.ingredients}
              onChange={handleChange}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  setTimeout(() => {
                    if (isEdit) focusNext(statusRef)
                    else focusNext(submitRef)
                  }, 100)
                }
              }}
            />

            {/* Status - Only show when editing (Logic retained from Page B) */}
            {isEdit && (
              <CustomTextField
                select
                fullWidth
                margin='normal'
                label='Status'
                value={formData.status}
                inputRef={statusRef}
                // Uses the dedicated handler to update status immediately on change
                onChange={handleStatusChange}
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

            {/* Submit / Cancel */}
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
    </Box>
  )
}
