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
  MenuItem,
  Card,
  Divider,
  FormControl,
  Select,
  Pagination,
  Menu
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
// Icons
import AddIcon from '@mui/icons-material/Add'
import DownloadIcon from '@mui/icons-material/Download'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward' // Icon for sorting up
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward' // Icon for sorting down
import { MdDelete } from 'react-icons/md'

// Wrapper
import CustomTextField from '@core/components/mui/TextField'
import CustomAutocomplete from '@core/components/mui/Autocomplete'
import Link from 'next/link' // Added for Breadcrumb

// ------------------- IndexedDB Setup -------------------
const dbName = 'serviceFrequencyDB'
const storeName = 'frequencies'

async function initDB() {
  return openDB(dbName, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true })
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
  // IndexedDB .put() handles both add (if no key) and update (if key exists)
  await db.put(storeName, row)
}

async function deleteRowFromDB(id) {
  const db = await initDB()
  await db.delete(storeName, id)
}

// ------------------- Component -------------------
export default function ServiceFrequencyPage() {
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false) // Drawer for Add/Edit
  const [isEdit, setIsEdit] = useState(false)
  const [editRow, setEditRow] = useState(null)

  // State for Sorting (from Page A)
  const [sortField, setSortField] = useState('id') // Default sort by ID
  const [sortDirection, setSortDirection] = useState('desc') // Default sort descending

  // State variables for Pagination (from Page A)
  const [page, setPage] = useState(1) // 1-based indexing
  const [pageSize, setPageSize] = useState(10)

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

  // Menu for action dropdown (removed from table, but keeping state for future use if needed)
  const [anchorEl, setAnchorEl] = useState(null)
  const [menuRow, setMenuRow] = useState(null)
  const [incrementTypeOpen, setIncrementTypeOpen] = useState(false)
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const exportOpen = Boolean(exportAnchorEl)

  // Refs for form navigation
  const incrementTypeRef = useRef(null)
  const noOfIncrementsRef = useRef(null)
  const backlogAgeRef = useRef(null)
  const frequencyCodeRef = useRef(null)
  const displayFrequencyRef = useRef(null)
  const sortOrderRef = useRef(null)
  const descriptionRef = useRef(null)
  const submitRef = useRef(null)

  // ------------------- Initial Load -------------------
  useEffect(() => {
    async function loadRows() {
      const allRows = await getAllRows()
      // Initial load: sort by ID descending (latest first)
      allRows.sort((a, b) => b.id - a.id)
      setRows(allRows)
    }
    loadRows()
  }, [])

  // ------------------- Helpers -------------------

  const toggleDrawer = () => setOpen(prev => !prev)

  const focusNext = ref => {
    if (!ref.current) return
    const input = ref.current.querySelector('input') || ref.current
    input.focus()
  }

  // Helper component to render the sort icon (from Page A)
  const SortIcon = ({ field }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 16, ml: 0.5 }} /> : <ArrowDownwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
  }

  const handleKeyDown = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      focusNext(nextRef)
    }
  }

  // ------------------- CRUD Handlers -------------------

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
    if (!row) return
    setIsEdit(true)
    setEditRow(row)
    // Ensure all keys are present for formData
    setFormData({
      incrementType: row.incrementType || '',
      noOfIncrements: row.noOfIncrements || '',
      backlogAge: row.backlogAge || '',
      frequencyCode: row.frequencyCode || '',
      displayFrequency: row.displayFrequency || '',
      sortOrder: row.sortOrder || '',
      description: row.description || '',
      status: row.status || 'Active'
    })
    setOpen(true)

  }

  const handleDelete = async rowToDelete => {
    if (rowToDelete) {
      setRows(prev => prev.filter(r => r.id !== rowToDelete.id))
      await deleteRowFromDB(rowToDelete.id)
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!formData.frequencyCode || !formData.displayFrequency) return // Simple validation

    let rowToSave
    if (isEdit && editRow) {
      rowToSave = { ...editRow, ...formData }
      setRows(prev => prev.map(r => (r.id === editRow.id ? rowToSave : r)))
    } else {
      // IndexedDB handles autoIncrement, so we save without an 'id' and retrieve the full row.
      const newRowData = { ...formData }
      const db = await initDB()
      const newId = await db.add(storeName, newRowData)
      rowToSave = { ...newRowData, id: newId }
      // Add new row to the front and sort by 'id' descending to see it immediately
      setRows(prev => {
        const newRows = [rowToSave, ...prev.filter(r => r.id !== newId)] // Ensure no duplicates
        return newRows.sort((a, b) => b.id - a.id)
      })
    }

    await addOrUpdateRow(rowToSave)
    setOpen(false)
    // Reset sort to 'id' desc to show the new/updated row easily
    setSortField('id')
    setSortDirection('desc')
  }

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
    setExportAnchorEl(null)
  }

  // ------------------- Sorting Logic (from Page A) -------------------

  const handleSort = field => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setPage(1) // Reset to first page on sort change
  }

  const sortedRows = [...rows].sort((a, b) => {
    const aValue = a[sortField] || ''
    const bValue = b[sortField] || ''

    let comparison = 0
    // Check if values are numerical (for sortOrder and id)
    if (!isNaN(Number(aValue)) && !isNaN(Number(bValue)) && ['sortOrder', 'id', 'noOfIncrements', 'backlogAge'].includes(sortField)) {
      comparison = Number(aValue) - Number(bValue)
    } else {
      // Case-insensitive string comparison
      comparison = String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' })
    }

    // Apply the sort direction
    return sortDirection === 'asc' ? comparison : comparison * -1
  })

  // ------------------- Filtering and Pagination Logic (from Page A) -------------------

  // Client-side filtering based on search text
  const filteredRows = sortedRows.filter(
    row =>
      row.displayFrequency?.toLowerCase().includes(search.toLowerCase()) ||
      row.frequencyCode?.toLowerCase().includes(search.toLowerCase()) ||
      row.description?.toLowerCase().includes(search.toLowerCase())
  )

  // Client-side pagination logic
  const rowCount = filteredRows.length
  const pageCount = Math.max(1, Math.ceil(rowCount / pageSize))
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)
  const startIndex = rowCount === 0 ? 0 : (page - 1) * pageSize + 1
  const endIndex = Math.min(page * pageSize, rowCount)

  // ------------------- Render -------------------
const theme = useTheme()
  return (
    <Box>
      {/* Breadcrumb (from Page A) */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
       <Link
      href='/admin/dashboards'
      style={{
        textDecoration: 'none',
        fontSize: 14,
        color: theme.palette.primary.main  // 👈 Theme color used
      }}
    >
      Dashboard
    </Link>
        <Typography sx={{ mx: 1, color: 'text.secondary' }}>/</Typography>
        <Typography variant='body2' sx={{ fontSize: 14 }}>
          Service Frequency
        </Typography>
      </Box>

      <Card sx={{ p: 6 }}>
        {/* Header + actions (from Page A) */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant='h6'>Service Frequency List</Typography>

          <Box display='flex' gap={1}>
            <Button
              variant='outlined'
              endIcon={<ArrowDropDownIcon />}
              onClick={e => setExportAnchorEl(e.currentTarget)}
            >
              Export
            </Button>
            <Button variant='contained' startIcon={<AddIcon />} onClick={handleAdd}>
              Add Frequency
            </Button>
             <Menu anchorEl={exportAnchorEl} open={exportOpen} onClose={() => setExportAnchorEl(null)}>
                <MenuItem onClick={handleExport}>Download CSV</MenuItem>
              </Menu>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Search / entries (from Page A) */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <FormControl size='small' sx={{ minWidth: 120 }}>
            <Select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}>
              {[10, 25, 50, 100].map(i => (
                <MenuItem key={i} value={i}>
                  {i} entries
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <CustomTextField
            size='small'
            placeholder='Search by Display/Frequency Code...'
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              setPage(1) // reset page on search change
            }}
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

        {/* Table (Manual HTML Table from Page A) */}
        <Box sx={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              tableLayout: 'fixed',
              minWidth: '850px' // Added min-width for better display of all columns
            }}
          >
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>
                {/* S.No Header (Sorts by ID) */}
                <th
                  onClick={() => handleSort('id')}
                  style={{ padding: '12px', width: '60px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    S.No <SortIcon field='id' />
                  </Box>
                </th>

                <th style={{ padding: '12px', width: '100px' }}>Action</th>

                {/* Display Frequency Header */}
                <th
                  onClick={() => handleSort('displayFrequency')}
                  style={{ padding: '12px', width: '180px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Display Frequency <SortIcon field='displayFrequency' />
                  </Box>
                </th>

                {/* Frequency Code Header */}
                <th
                  onClick={() => handleSort('frequencyCode')}
                  style={{ padding: '12px', width: '120px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Frequency Code <SortIcon field='frequencyCode' />
                  </Box>
                </th>

                {/* Description Header */}
                <th
                  onClick={() => handleSort('description')}
                  style={{ padding: '12px', width: '300px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Description <SortIcon field='description' />
                  </Box>
                </th>

                {/* Sort Order Header */}
                <th
                  onClick={() => handleSort('sortOrder')}
                  style={{ padding: '12px', width: '100px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Sort Order <SortIcon field='sortOrder' />
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
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.displayFrequency}</td>
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.frequencyCode}</td>
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.description}</td>
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.sortOrder}</td>
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

        {/* Pagination (from Page A) */}
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

      {/* ----------------- Drawer Form ----------------- (Retained from Page B)*/}
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
                onKeyDown: e => handleKeyDown(e, backlogAgeRef)
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
                onKeyDown: e => handleKeyDown(e, frequencyCodeRef)
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
              onKeyDown={e => handleKeyDown(e, displayFrequencyRef)}
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
              onKeyDown={e => handleKeyDown(e, sortOrderRef)}
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
                onKeyDown: e => handleKeyDown(e, descriptionRef)
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
              inputProps={{ onKeyDown: e => handleKeyDown(e, submitRef) }}
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
                    // Directly update DB on status change for a quick save
                    await addOrUpdateRow(updatedRow)
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
    </Box>
  )
}
