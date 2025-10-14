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
  Pagination
} from '@mui/material'

// Icons
import AddIcon from '@mui/icons-material/Add'
import DownloadIcon from '@mui/icons-material/Download'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward' // New icon for sorting up
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward' // New icon for sorting down
import { MdDelete } from 'react-icons/md'

// Wrapper
import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'
import Link from 'next/link'

// ------------------- IndexedDB -------------------
const dbName = 'accountDB'
const storeName = 'accountItems'

async function initDB() {
  return openDB(dbName, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(storeName)) {
        // Added 'id' as keyPath, which is good for IndexedDB
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
  const [formData, setFormData] = useState({ name: '', itemNumber: '', description: '', status: 'Active' })
  const [search, setSearch] = useState('')

  // State for Sorting: field to sort by and direction ('asc' or 'desc')
  const [sortField, setSortField] = useState('id') // Default sort by ID
  const [sortDirection, setSortDirection] = useState('desc') // Default sort descending

  // State variables for Pagination
  const [page, setPage] = useState(1) // 1-based indexing
  const [pageSize, setPageSize] = useState(10)

  // UI State
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const exportOpen = Boolean(exportAnchorEl)

  // Input refs
  const nameRef = useRef(null)
  const itemNumberRef = useRef(null)
  const descriptionRef = useRef(null)
  const submitRef = useRef(null)

  useEffect(() => {
    async function loadRows() {
      const allRows = await getAllRows()
      // Initial load: sort by ID descending (latest first)
      allRows.sort((a, b) => b.id - a.id)
      setRows(allRows)
    }
    loadRows()
  }, [])

  // ------------------- IndexedDB CRUD Operations -------------------

  const toggleDrawer = () => setOpen(prev => !prev)

  const handleAdd = () => {
    setIsEdit(false)
    setFormData({ name: '', itemNumber: '', description: '', status: 'Active' })
    setEditRow(null)
    setOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  const handleEdit = row => {
    if (!row) return
    setIsEdit(true)
    setEditRow(row)
    setFormData({
      name: row.name,
      itemNumber: row.itemNumber,
      description: row.description,
      status: row.status || 'Active'
    })
    setOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  const handleDelete = async row => {
    // In a real app, you might want a confirmation dialog
    setRows(prev => prev.filter(r => r.id !== row.id))
    await deleteRowFromDB(row.id)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!formData.name || !formData.itemNumber) return

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

    setFormData({ name: '', itemNumber: '', description: '', status: 'Active' })
    toggleDrawer()
    // Reset sort to 'id' desc to show the new/updated row easily
    setSortField('id')
    setSortDirection('desc')
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

  // ------------------- Sorting Logic -------------------

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
    // Check if values are numerical (for itemNumber and id)
    if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
      comparison = Number(aValue) - Number(bValue)
    } else {
      // Case-insensitive string comparison for name, description, status
      comparison = String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' })
    }

    // Apply the sort direction
    return sortDirection === 'asc' ? comparison : comparison * -1
  })

  // ------------------- Filtering and Pagination -------------------

  // Client-side filtering based on search text
  const filteredRows = sortedRows.filter(
    row =>
      row.name.toLowerCase().includes(search.toLowerCase()) ||
      row.itemNumber.toLowerCase().includes(search.toLowerCase()) ||
      row.description?.toLowerCase().includes(search.toLowerCase())
  )

  // Client-side pagination logic
  const rowCount = filteredRows.length
  const pageCount = Math.max(1, Math.ceil(rowCount / pageSize))
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)
  const startIndex = rowCount === 0 ? 0 : (page - 1) * pageSize + 1
  const endIndex = Math.min(page * pageSize, rowCount)

  // Helper component to render the sort icon
  const SortIcon = ({ field }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 16, ml: 0.5 }} /> : <ArrowDownwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
  }

  // ------------------- Render -------------------

  return (
    <Box>
      {/* Breadcrumb */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <Link href='/' style={{ color: '#7367F0', textDecoration: 'none', fontSize: 14 }}>
          Dashboard
        </Link>
        <Typography sx={{ mx: 1, color: 'text.secondary' }}>/</Typography>
        <Typography variant='body2' sx={{ fontSize: 14 }}>
          Account Item Code
        </Typography>
      </Box>

      <Card sx={{ p: 6 }}>
        {/* Header + actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant='h6'>Account Item Code List</Typography>

          <Box display='flex' gap={1}>
            <Button
              variant='outlined'
              endIcon={<ArrowDropDownIcon />}
              onClick={e => setExportAnchorEl(e.currentTarget)}
            >
              Export
            </Button>
            <Button variant='contained' startIcon={<AddIcon />} onClick={handleAdd}>
              Add Item
            </Button>
            <Drawer anchor='right' open={exportOpen} onClose={() => setExportAnchorEl(null)}>
              {/* Export menu content is missing, but preserving the button functionality */}
            </Drawer>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Search / entries */}
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
            placeholder='Search by Name or Item Number...'
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

        {/* Table (Manual HTML Table) */}
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
                {/* ID Header (Hidden but used for default sort S.No) */}
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
                    Name <SortIcon field='name' />
                  </Box>
                </th>

                {/* Item Number Header */}
                <th
                  onClick={() => handleSort('itemNumber')}
                  style={{ padding: '12px', width: '150px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Item Number <SortIcon field='itemNumber' />
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
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.itemNumber}</td>
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.description}</td>
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

        {/* Pagination */}
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

      {/* Drawer Form (Unchanged) */}
      <Drawer anchor='right' open={open} onClose={toggleDrawer}>
        <Box sx={{ width: 360, p: 3 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6'>{isEdit ? 'Edit Account Item' : 'Add New Account Item'}</Typography>
            <IconButton onClick={toggleDrawer}><CloseIcon /></IconButton>
          </Box>
          <form onSubmit={handleSubmit}>
            <CustomTextField
              fullWidth margin='normal' label='Name' value={formData.name} inputRef={nameRef}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value.replace(/[^a-zA-Z\s]/g, '') }))}
              onKeyDown={e => handleKeyDown(e, 'name')}
            />
            <CustomTextField
              fullWidth margin='normal' label='Item Number' value={formData.itemNumber} inputRef={itemNumberRef}
              onChange={e => setFormData(prev => ({ ...prev, itemNumber: e.target.value.replace(/\D/g, '') }))}
              onKeyDown={e => handleKeyDown(e, 'itemNumber')}
            />
            <CustomTextField
              fullWidth margin='normal' label='Description' multiline rows={3} value={formData.description} inputRef={descriptionRef}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              onKeyDown={e => handleKeyDown(e, 'description')}
            />

            {/* Status appears only in edit */}
            {isEdit && (
              <CustomTextField
                fullWidth margin='normal' label='Status' select value={formData.status}
                onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value='Active'>Active</MenuItem>
                <MenuItem value='Inactive'>Inactive</MenuItem>
              </CustomTextField>
            )}

            <Box mt={3} display='flex' gap={2}>
              <Button type='submit' variant='contained' fullWidth ref={submitRef}>{isEdit ? 'Update' : 'Submit'}</Button>
              <Button variant='outlined' fullWidth onClick={toggleDrawer}>Cancel</Button>
            </Box>
          </form>
        </Box>
      </Drawer>
    </Box>
  )
}
