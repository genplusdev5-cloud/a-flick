'use client'

import { useState, useRef, useEffect, useCallback } from 'react' // Added useCallback
import {
  Box,
  Typography,
  Button,
  IconButton,
  Drawer,
  InputAdornment,
  MenuItem,
  Card, // Added Card for layout
  Divider, // Added Divider for layout
  FormControl, // Added FormControl for page size select
  Select, // Added Select for page size
  Pagination // Added Pagination component
} from '@mui/material'

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

import { openDB } from 'idb'
import { useTheme } from '@mui/material/styles'
// import ContentLayout from '@/components/layout/ContentLayout' // Removed as layout logic is now inside
import CustomTextField from '@core/components/mui/TextField'
import Link from 'next/link' // Added Link for breadcrumb

const DB_NAME = 'site_risk_db'
const STORE_NAME = 'site_risks'

// ---------- IndexedDB ----------
const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

const getAllRows = async () => {
  const db = await initDB()
  return db.getAll(STORE_NAME)
}

const addOrUpdateRow = async row => {
  const db = await initDB()
  await db.put(STORE_NAME, row)
}

const deleteRowFromDB = async id => {
  const db = await initDB()
  await db.delete(STORE_NAME, id)
}

// ------------------- Component -------------------
export default function SiteRiskPage() {
  const [rows, setRows] = useState([])
  const [open, setOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [formData, setFormData] = useState({ name: '', description: '', status: 'Active' })
  const [searchText, setSearchText] = useState('')

  // State for Sorting: field to sort by and direction ('asc' or 'desc')
  const [sortField, setSortField] = useState('id') // Default sort by ID
  const [sortDirection, setSortDirection] = useState('desc') // Default sort descending

  // State variables for Pagination (Page A style: 1-based page, pageSize)
  const [page, setPage] = useState(1) // 1-based indexing
  const [pageSize, setPageSize] = useState(10)

  // UI State for Export Menu
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const exportOpen = Boolean(exportAnchorEl)

  // Refs
  const nameRef = useRef(null)
  const descriptionRef = useRef(null)
  const submitButtonRef = useRef(null)

  // Load rows on mount and sort by ID descending (latest first)
  useEffect(() => {
    async function loadRows() {
      const allRows = await getAllRows()
      allRows.sort((a, b) => b.id - a.id)
      setRows(allRows)
    }
    loadRows()
  }, [])

  // ---------- Handlers (Updated for consistency and Page A logic) ----------

  const toggleDrawer = () => setOpen(prev => !prev)
  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleAdd = () => {
    setIsEdit(false)
    setFormData({ name: '', description: '', status: 'Active' })
    setEditRow(null)
    setOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  const handleEdit = row => {
    if (!row) return
    setIsEdit(true)
    setEditRow(row)
    setFormData({ ...row, status: row.status || 'Active' }) // Ensure status is set
    setOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  const handleDelete = async row => {
    setRows(prev => prev.filter(r => r.id !== row.id))
    await deleteRowFromDB(row.id)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!formData.name) return

    let rowToSave
    if (isEdit && editRow) {
      rowToSave = { ...editRow, ...formData }
      setRows(prev => prev.map(r => (r.id === editRow.id ? rowToSave : r)))
    } else {
      // Find max ID for new row. If no rows, start at 1.
      const newId = rows.length ? Math.max(...rows.map(r => r.id)) + 1 : 1
      rowToSave = { id: newId, ...formData }
      // Add new row to the front and sort by 'id' descending to see it immediately
      setRows(prev => {
        const newRows = [rowToSave, ...prev.filter(r => r.id !== newId)] // Ensure no duplicates
        return newRows.sort((a, b) => b.id - a.id)
      })
    }

    await addOrUpdateRow(rowToSave)

    setFormData({ name: '', description: '', status: 'Active' })
    toggleDrawer()
    // Reset sort to 'id' desc to show the new/updated row easily
    setSortField('id')
    setSortDirection('desc')
    setPage(1) // Ensure we go back to the first page
  }

  // Tab/Enter key navigation from Page A
  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      switch (field) {
        case 'name':
          descriptionRef.current?.focus()
          break
        case 'description':
          submitButtonRef.current?.focus()
          break
        // Status field is a select, which often has different focus behavior
      }
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

  // Helper component to render the sort icon (From Page A)
  const SortIcon = ({ field }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <ArrowUpwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
    ) : (
      <ArrowDownwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
    )
  }

  // ------------------- Filtering and Pagination (From Page A) -------------------

  // Client-side filtering based on search text
  const filteredRows = sortedRows.filter(
    row =>
      row.name.toLowerCase().includes(searchText.toLowerCase()) ||
      row.description?.toLowerCase().includes(searchText.toLowerCase()) ||
      row.status.toLowerCase().includes(searchText.toLowerCase())
  )

  // Client-side pagination logic
  const rowCount = filteredRows.length
  const pageCount = Math.max(1, Math.ceil(rowCount / pageSize))
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)
  const startIndex = rowCount === 0 ? 0 : (page - 1) * pageSize + 1
  const endIndex = Math.min(page * pageSize, rowCount)
  const theme = useTheme()
  // ------------------- Render -------------------

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
          Site Risk
        </Typography>
      </Box>

      <Card sx={{ p: 6 }}>
        {/* Header + actions (From Page A) */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant='h6'>Site Risk List</Typography>

          <Box display='flex' gap={1}>
            <Button
              variant='outlined'
              endIcon={<ArrowDropDownIcon />}
              onClick={e => setExportAnchorEl(e.currentTarget)}
            >
              Export
            </Button>
            <Button variant='contained' startIcon={<AddIcon />} onClick={handleAdd}>
              Add Site Risk
            </Button>
            <Drawer anchor='right' open={exportOpen} onClose={() => setExportAnchorEl(null)}>
              {/* Export menu content is missing */}
            </Drawer>
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
            placeholder='Search by Name or Description...'
            value={searchText}
            onChange={e => {
              setSearchText(e.target.value)
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
              tableLayout: 'fixed'
            }}
          >
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>
                {/* S.No/ID Header */}
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
                  style={{ padding: '12px', width: '150px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Site Risk <SortIcon field='name' />
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
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>
                    {r.description}
                  </td>
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

      {/* Drawer Form (Modified for consistency with Page B form fields) */}
      <Drawer anchor='right' open={open} onClose={toggleDrawer}>
        <Box sx={{ width: 360, p: 3 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6'>{isEdit ? 'Edit Site Risk' : 'Add New Site Risk'}</Typography>
            <IconButton onClick={toggleDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>

          <form onSubmit={handleSubmit}>
            <CustomTextField
              fullWidth
              margin='normal'
              label='Site Risk Name'
              name='name'
              value={formData.name}
              onChange={handleChange}
              inputRef={nameRef}
              onKeyDown={e => handleKeyDown(e, 'name')}
            />

            <CustomTextField
              fullWidth
              margin='normal'
              label='Description'
              name='description'
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={3} // Changed rows to 3 for consistency
              inputRef={descriptionRef}
              onKeyDown={e => handleKeyDown(e, 'description')}
            />

            {/* Status Field — show only when editing */}
            {isEdit && (
              <CustomTextField
                select
                fullWidth
                margin='normal'
                label='Status'
                name='status'
                value={formData.status}
                onChange={handleChange} // Simple handleChange for status update in form
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
                ref={submitButtonRef}
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
