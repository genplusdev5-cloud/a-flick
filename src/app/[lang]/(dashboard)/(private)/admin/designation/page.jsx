'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  IconButton,
  Drawer,
  InputAdornment,
  MenuItem,
  Card, // Added Card for Page A's container style
  Divider, // Added Divider for Page A's visual separation
  FormControl, // Added for entries per page select
  Select, // Added for entries per page select
  Pagination // Added for page navigation
} from '@mui/material'
import { MdDelete } from 'react-icons/md'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import DownloadIcon from '@mui/icons-material/Download'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown' // Added for Export button
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward' // Added for sorting up
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward' // Added for sorting down
import { openDB } from 'idb'
import Link from 'next/link' // Added for Breadcrumb
import { useTheme } from '@mui/material/styles'
// Wrapper (Keeping ContentLayout import but will use manual layout to match Page A's design)
import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'

const DB_NAME = 'designation_db'
const STORE_NAME = 'designations'

// ---------- IndexedDB Functions (Re-used) ----------
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

const getAllRows = async () => {
  const db = await initDB()
  return db.getAll(STORE_NAME)
}

async function addOrUpdateRow(row) {
  const db = await initDB()
  await db.put(STORE_NAME, row)
}

async function deleteRowFromDB(id) {
  const db = await initDB()
  await db.delete(STORE_NAME, id)
}
// --------------------------------------------------

export default function DesignationPage() {
  const [rows, setRows] = useState([])
  const [open, setOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [formData, setFormData] = useState({ name: '', description: '', status: 'Active' })
  const [searchText, setSearchText] = useState('')

  // State for Sorting (from Page A)
  const [sortField, setSortField] = useState('id') // Default sort by ID
  const [sortDirection, setSortDirection] = useState('desc') // Default sort descending

  // State variables for Pagination (from Page A)
  const [page, setPage] = useState(1) // 1-based indexing
  const [pageSize, setPageSize] = useState(10)

  // UI State
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const exportOpen = Boolean(exportAnchorEl)

  const submitRef = useRef(null)
  const disRef = useRef(null)

  const loadRows = async () => {
    const allRows = await getAllRows()
    // Initial load: sort by ID descending (latest first)
    allRows.sort((a, b) => b.id - a.id)
    setRows(allRows)
  }

  useEffect(() => {
    loadRows()
  }, [])

  const toggleDrawer = () => setOpen(prev => !prev)
  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value })

  // Adjusted to reset page on search change
  const handleSearch = e => {
    setSearchText(e.target.value)
    setPage(1)
  }

  const handleAdd = () => {
    setIsEdit(false)
    setFormData({ name: '', description: '', status: 'Active' })
    setEditRow(null)
    setOpen(true)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setEditRow(row)
    setFormData({ name: row.name, description: row.description, status: row.status || 'Active' })
    setOpen(true)
  }

  const handleDelete = async row => {
    setRows(prev => prev.filter(r => r.id !== row.id))
    await deleteRowFromDB(row.id)
  }

  const handleSubmit = async e => {
    if (e && e.preventDefault) e.preventDefault()

    if (!formData.name) return

    let rowToSave
    if (isEdit && editRow) {
      rowToSave = { ...editRow, ...formData }
    } else {
      // Logic for new row ID generation like Page A
      const newId = rows.length ? Math.max(...rows.map(r => r.id)) + 1 : 1
      rowToSave = { id: newId, ...formData, status: 'Active' }
    }

    await addOrUpdateRow(rowToSave)
    await loadRows() // Reload to get the latest data with correct ID from DB

    setFormData({ name: '', description: '', status: 'Active' })
    toggleDrawer()
    // Reset sort to 'id' desc to show the new/updated row easily, matching Page A
    setSortField('id')
    setSortDirection('desc')
  }

  // ---------- Key Navigation (Simplified from Page B) ----------
  const handleKeyPress = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      nextRef?.current?.focus()
    }
  }

  // ------------------- Sorting Logic (From Page A) -------------------

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
    // ID comparison (numerical)
    if (sortField === 'id') {
      comparison = Number(aValue) - Number(bValue)
    } else {
      // Case-insensitive string comparison for name, description, status
      comparison = String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' })
    }

    // Apply the sort direction
    return sortDirection === 'asc' ? comparison : comparison * -1
  })

  // ------------------- Filtering and Pagination (From Page A) -------------------

  // Client-side filtering based on search text (using Page B's searchText)
  const filteredRows = sortedRows.filter(
    row =>
      row.name.toLowerCase().includes(searchText.toLowerCase()) ||
      row.description?.toLowerCase().includes(searchText.toLowerCase())
  )

  // Client-side pagination logic
  const rowCount = filteredRows.length
  const pageCount = Math.max(1, Math.ceil(rowCount / pageSize))
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)
  const startIndex = rowCount === 0 ? 0 : (page - 1) * pageSize + 1
  const endIndex = Math.min(page * pageSize, rowCount)

  // Helper component to render the sort icon (From Page A)
  const SortIcon = ({ field }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 16, ml: 0.5 }} /> : <ArrowDownwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
  }
 const theme = useTheme()
  // ------------------- Render -------------------

  // Removing ContentLayout and using Page A's Card/Box structure
  return (
    <Box>
      {/* Breadcrumb (From Page A) */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
      <Link
      href='/admin/dashboards'
      style={{
        textDecoration: 'none',
        fontSize: 14,
        color: theme.palette.primary.main // 👈 Theme primary color used
      }}
    >
      Dashboard
    </Link>
        <Typography sx={{ mx: 1, color: 'text.secondary' }}>/</Typography>
        <Typography variant='body2' sx={{ fontSize: 14 }}>
          Designation
        </Typography>
      </Box>

      <Card sx={{ p: 6 }}>
        {/* Header + actions (Modified from Page B's ContentLayout actions) */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant='h6'>Designation List</Typography>

          <Box display='flex' gap={1}>
            <Button
              variant='outlined'
              endIcon={<ArrowDropDownIcon />}
              onClick={e => setExportAnchorEl(e.currentTarget)}
            >
              Export
            </Button>
            <Button variant='contained' startIcon={<AddIcon />} onClick={handleAdd}>
              Add Designation
            </Button>
            {/* Export menu content is missing, but preserving the button functionality */}
            <Drawer anchor='right' open={exportOpen} onClose={() => setExportAnchorEl(null)} />
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Search / entries (From Page A) */}
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
            placeholder='Search by Name or Description...'
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

        {/* Table (Manual HTML Table from Page A, adapted for Page B's fields) */}
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
                {/* ID Header for S.No */}
                <th
                  onClick={() => handleSort('id')}
                  style={{ padding: '12px', width: '60px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    S.No <SortIcon field='id' />
                  </Box>
                </th>

                <th style={{ padding: '12px', width: '100px' }}>Action</th>

                {/* Name Header */}
                <th
                  onClick={() => handleSort('name')}
                  style={{ padding: '12px', width: '200px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Designation Name <SortIcon field='name' />
                  </Box>
                </th>

                {/* Description Header */}
                <th
                  onClick={() => handleSort('description')}
                  style={{ padding: '12px', width: '400px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Description <SortIcon field='description' />
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
                  {/* S.No calculation */}
                  <td style={{ padding: '12px', wordWrap: 'break-word', whiteSpace: 'normal' }}>
                    {(page - 1) * pageSize + i + 1}
                  </td>
                  {/* Actions */}
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
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.description}</td>
                  {/* Status badge style from Page A */}
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
                      {r.status || 'Active'}
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

        {/* Pagination (From Page A) */}
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

      {/* Drawer Form (Unchanged functionality) */}
      <Drawer anchor='right' open={open} onClose={toggleDrawer}>
        <Box sx={{ width: 360, p: 3 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6'>{isEdit ? 'Edit Designation' : 'Add New Designation'}</Typography>
            <IconButton onClick={toggleDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>

          <form onSubmit={handleSubmit}>
            <CustomTextField
              fullWidth
              margin='normal'
              label='Designation Name'
              name='name'
              value={formData.name}
              onChange={e => {
                const value = e.target.value
                // Only allow letters and spaces (Page B's validation)
                if (/^[A-Za-z\s]*$/.test(value)) handleChange(e)
              }}
              onKeyDown={e => handleKeyPress(e,disRef )}
            />

            <CustomTextField
              fullWidth
              margin='normal'
              label='Description'
              name='description'
              value={formData.description}
              onChange={handleChange}
              multiline
                ref={disRef}
              rows={4}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  submitRef.current?.focus()
                }
              }}
            />

            {/* Status dropdown only in edit mode */}
            {isEdit && (
              <CustomTextField
                fullWidth
                margin='normal'
                select
                label='Status'
                name='status'
                value={formData.status || 'Active'}
                onChange={handleChange}
              >
                <MenuItem value='Active'>Active</MenuItem>
                <MenuItem value='Inactive'>Inactive</MenuItem>
              </CustomTextField>
            )}

            <Box mt={3} display='flex' gap={2}>
              <Button
                type='submit'
                variant='contained'
                fullWidth
                ref={submitRef}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSubmit(e)
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
    </Box>
  )
}
