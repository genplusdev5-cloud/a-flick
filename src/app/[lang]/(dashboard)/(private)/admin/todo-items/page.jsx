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
  FormControl,
  Select,
  Pagination,
  Card,
  Divider
} from '@mui/material'
import { openDB } from 'idb'
import Link from 'next/link'

// Icons
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import DownloadIcon from '@mui/icons-material/Download'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import { MdDelete } from 'react-icons/md'
import { useTheme } from '@mui/material/styles'
// Layout & Custom Components
import CustomTextField from '@core/components/mui/TextField'

// ------------------- IndexedDB -------------------
const DB_NAME = 'todo_db'
const STORE_NAME = 'todos'

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

// ------------------- Component -------------------
export default function TodoItemsPage() {
  // Refs
  const titleRef = useRef(null)
  const statusRef = useRef(null)
  const submitButtonRef = useRef(null)

  const [rows, setRows] = useState([])

  // State for Custom Pagination (1-based index)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [searchText, setSearchText] = useState('')
  const [open, setOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [formData, setFormData] = useState({ title: '', status: 'Active' })

  // State for Sorting
  const [sortField, setSortField] = useState('id')
  const [sortDirection, setSortDirection] = useState('desc')

  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const exportOpen = Boolean(exportAnchorEl)

  // ------------------- Data Load -------------------
  const loadRows = async () => {
    const db = await getDB()
    const allRows = await db.getAll(STORE_NAME)
    allRows.sort((a, b) => b.id - a.id)
    setRows(allRows)
  }

  useEffect(() => {
    loadRows()
  }, [])

  // ------------------- Handlers -------------------
  const toggleDrawer = () => setOpen(prev => !prev)

  const handleChange = e => {
    const { name, value } = e.target
    if (name === 'title') {
      const filtered = value.replace(/[^a-zA-Z\s]/g, '')
      setFormData(prev => ({ ...prev, [name]: filtered }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleAdd = () => {
    setIsEdit(false)
    setFormData({ title: '', status: 'Active' })
    setEditRow(null)
    setOpen(true)
    setTimeout(() => titleRef.current?.focus(), 100)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setEditRow(row)
    setFormData({ ...row })
    setOpen(true)
    setTimeout(() => titleRef.current?.focus(), 100)
  }

  const handleDelete = async row => {
    const db = await getDB()
    await db.delete(STORE_NAME, row.id)
    setRows(prev => prev.filter(r => r.id !== row.id))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!formData.title.trim()) return
    const db = await getDB()

    if (isEdit && editRow) {
      await db.put(STORE_NAME, { ...editRow, ...formData })
    } else {
      await db.add(STORE_NAME, { ...formData })
    }

    await loadRows()
    toggleDrawer()
    setSortField('id')
    setSortDirection('desc')
  }

  // ------------------- Export Function (CSV) -------------------
  const handleExport = () => {
    const exportRows = [...rows].sort((a, b) => b.id - a.id);

    const headers = ['S.No', 'Todo Title', 'Status']
    const csv = [
      headers.join(','),
      ...exportRows.map((r, i) => [
        `${i + 1}`,
        `"${r.title.replace(/"/g, '""')}"`,
        r.status
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'todo_items.csv'
    a.click()
    URL.revokeObjectURL(url)

    setExportAnchorEl(null);
  }

  // ------------------- Sorting Logic -------------------
  const handleSort = field => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setPage(1)
  }

  const sortedRows = [...rows].sort((a, b) => {
    const aValue = a[sortField] || ''
    const bValue = b[sortField] || ''

    let comparison = 0
    if (sortField === 'id') {
      comparison = Number(aValue) - Number(bValue)
    } else {
      comparison = String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' })
    }

    return sortDirection === 'asc' ? comparison : comparison * -1
  })

  // Helper component to render the sort icon
  const SortIcon = ({ field }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 16, ml: 0.5 }} /> : <ArrowDownwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
  }

  // ------------------- Filtering and Pagination Logic -------------------
  const handleSearch = e => {
    setSearchText(e.target.value)
    setPage(1)
  }

  const filteredRows = sortedRows.filter(
    row =>
      row.title.toLowerCase().includes(searchText.toLowerCase()) ||
      row.status.toLowerCase().includes(searchText.toLowerCase())
  )

  const rowCount = filteredRows.length
  const pageCount = Math.max(1, Math.ceil(rowCount / pageSize))
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)
  const startIndex = rowCount === 0 ? 0 : (page - 1) * pageSize + 1
  const endIndex = Math.min(page * pageSize, rowCount)
 const theme = useTheme()
  // ------------------- Render -------------------

  return (
    <Box>
      {/* Breadcrumb */}
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
          Todo Items List
        </Typography>
      </Box>

      <Card sx={{ p: 6 }}>
        {/* Header + actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant='h6'>Todo Items List</Typography>

          {/* Actions - Export and Add */}
          <Box display='flex' gap={1}>
            <Button
              variant='outlined'
              endIcon={<ArrowDropDownIcon />}
              onClick={e => setExportAnchorEl(e.currentTarget)}
            >
              Export
            </Button>
            <Button variant='contained' startIcon={<AddIcon />} onClick={handleAdd}>
              Add Todo
            </Button>
            {/* Export Drawer */}
            <Drawer anchor='right' open={exportOpen} onClose={() => setExportAnchorEl(null)}>
              <Box sx={{ width: 300, p: 3 }}>
                <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
                    <Typography variant='h6'>Export Data</Typography>
                    <IconButton onClick={() => setExportAnchorEl(null)}><CloseIcon /></IconButton>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Button onClick={handleExport} startIcon={<DownloadIcon />} fullWidth variant='contained'>
                    Download All as CSV
                </Button>
              </Box>
            </Drawer>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Entries / Search */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <FormControl size='small' sx={{ minWidth: 120 }}>
            <Select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setPage(1)
              }}
              displayEmpty
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
            placeholder='Search by Todo Title or Status...'
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
                {/* S.No Header */}
                <th
                  onClick={() => handleSort('id')}
                  style={{ padding: '12px', width: '60px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    S.No <SortIcon field='id' />
                  </Box>
                </th>

                {/* Action Header - FIXED WIDTH: 100px */}
                <th style={{ padding: '12px', width: '100px' }}>Action</th>

                {/* Todo Title Header - DYNAMIC WIDTH: auto */}
                <th
                  onClick={() => handleSort('title')}
                  style={{ padding: '12px', width: '200px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Todo Title <SortIcon field='title' />
                  </Box>
                </th>

                {/* Status Header - FIXED WIDTH: 150px */}
                <th
                  onClick={() => handleSort('status')}
                  style={{ padding: '12px', width: '150px', cursor: 'pointer', userSelect: 'none' }}
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
                  {/* S.No cell */}
                  <td style={{ padding: '12px', wordWrap: 'break-word', whiteSpace: 'normal' }}>
                    {(page - 1) * pageSize + i + 1}
                  </td>

                  {/* Action cell */}
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

                  {/* Data cells */}
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.title}</td>

                  {/* Status cell */}
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

        {/* Custom Pagination Footer */}
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
            <Typography variant='h6'>{isEdit ? 'Edit Todo' : 'Add New Todo'}</Typography>
            <IconButton onClick={toggleDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>

          <form onSubmit={handleSubmit}>
            <CustomTextField
              fullWidth
              margin='normal'
              label='Todo Title'
              name='title'
              value={formData.title}
              onChange={handleChange}
              inputRef={titleRef}
              inputProps={{
                onKeyDown: e => {
                  if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault()
                    if (isEdit) statusRef.current?.focus()
                    else submitButtonRef.current?.focus()
                  }
                }
              }}
            />

            {/* Status field only for Edit */}
            {isEdit && (
              <CustomTextField
                select
                fullWidth
                margin='normal'
                label='Status'
                name='status'
                value={formData.status}
                inputRef={statusRef}
                onChange={async e => {
                  const newStatus = e.target.value
                  setFormData(prev => ({ ...prev, status: newStatus }))
                  if (editRow) {
                    const updatedRow = { ...editRow, status: newStatus }
                    setRows(prev => prev.map(r => (r.id === editRow.id ? updatedRow : r)))
                    const db = await getDB()
                    await db.put(STORE_NAME, updatedRow)
                  }
                }}
                inputProps={{
                  onKeyDown: e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      submitButtonRef.current?.focus()
                    }
                  }
                }}
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
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    e.target.click()
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
