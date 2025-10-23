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
  Card, // Added for Card layout
  Divider, // Added for Divider
  FormControl, // Added for Select
  Select, // Added for PageSize Select
  Pagination, // Added for manual Pagination
  Menu // Added for Export Menu
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
// Icons
import { MdDelete } from 'react-icons/md'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import { openDB } from 'idb'
import Link from 'next/link' // Added for Breadcrumb

import CustomTextField from '@core/components/mui/TextField'

const DB_NAME = 'calltype_db'
const STORE_NAME = 'calltypes'

export default function CallTypePage() {
  // State changes for manual table, 1-based pagination, and sorting
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(1) // Changed to 1-based index
  const [pageSize, setPageSize] = useState(10) // Renamed rowsPerPage to pageSize
  const [searchText, setSearchText] = useState('')
  const [open, setOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [formData, setFormData] = useState({ name: '', sortOrder: '', description: '', status: 'Active' })

  // State for Sorting and Export
  const [sortField, setSortField] = useState('id') // Default sort field
  const [sortDirection, setSortDirection] = useState('desc') // Default sort direction
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const exportOpen = Boolean(exportAnchorEl)

  const statusOptions = ['Active', 'Inactive']

  const submitRef = useRef(null)
  const statusRef = useRef(null)
  const nameRef = useRef(null)
  const sortRef = useRef(null)
  const descriptionRef = useRef(null)

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
    setRows(allRows.sort((a, b) => b.id - a.id))
  }

  useEffect(() => {
    loadRows()
  }, [])

  const toggleDrawer = () => setOpen(prev => !prev)
  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value })
  const handleSearch = e => {
    setSearchText(e.target.value)
    setPage(1) // Reset to first page on search change
  }

  // ---------------- CRUD ----------------
  const handleAdd = () => {
    setIsEdit(false)
    setEditRow(null)
    setFormData({ name: '', sortOrder: '', description: '', status: 'Active' })
    setOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setEditRow(row)
    // Convert to string for the input field to display the full number
    setFormData({ ...row, sortOrder: String(row.sortOrder) })
    setOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  const handleDelete = async row => {
    const db = await initDB()
    await db.delete(STORE_NAME, row.id)
    setRows(prev => prev.filter(r => r.id !== row.id))
  }

  const handleSubmit = async e => {
    if (e && e.preventDefault) e.preventDefault()
    // Validation check for numeric sortOrder
    if (!formData.name || !formData.sortOrder || !/^\d+$/.test(formData.sortOrder)) return

    const db = await initDB()
    // CRITICAL FIX: Keep sortOrder as a string to preserve full precision for large numbers
    const dataToSave = { ...formData, sortOrder: formData.sortOrder }

    if (isEdit && editRow) {
      await db.put(STORE_NAME, { ...dataToSave, id: editRow.id })
    } else {
      await db.add(STORE_NAME, dataToSave)
    }

    // Reload and reset sort to show the new/updated row easily
    await loadRows()
    setSortField('id')
    setSortDirection('desc')

    toggleDrawer()
  }

  // ---------------- Export ----------------
  const handleExport = () => {
    if (!rows.length) return
    const headers = ['ID', 'Call Type Name', 'Sort Order', 'Description', 'Status']
    // Ensure sortOrder is converted to string for CSV
    const csvRows = rows.map(r =>
      [r.id, `"${r.name}"`, String(r.sortOrder), `"${r.description}"`, r.status].join(',')
    )
    const csv = [headers.join(','), ...csvRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'call-type-list.csv'
    a.click()
    URL.revokeObjectURL(url)
    setExportAnchorEl(null)
  }

  // ---------------- Keyboard Navigation ----------------
  const focusNext = ref => ref?.current?.focus()
  const handleKeyPress = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (nextRef) focusNext(nextRef)
      else submitRef.current?.focus()
    }
  }

  // ---------------- Sorting Logic -------------------
  const SortIcon = ({ field }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 16, ml: 0.5 }} /> : <ArrowDownwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
  }

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

    if (sortField === 'sortOrder') {
        // FIX: Use BigInt for accurate comparison of potentially huge number strings
        try {
            const aBigInt = aValue ? BigInt(aValue) : BigInt(0)
            const bBigInt = bValue ? BigInt(bValue) : BigInt(0)

            if (aBigInt < bBigInt) comparison = -1
            else if (aBigInt > bBigInt) comparison = 1
            else comparison = 0
        } catch (e) {
            // Fallback for non-BigInt-parseable values
            comparison = 0;
        }

    } else if (sortField === 'id') {
        // Standard numeric comparison for id (which is a standard number)
        comparison = Number(aValue) - Number(bValue)
    }
    else {
        // Case-insensitive string comparison for other fields
        comparison = String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' })
    }


    return sortDirection === 'asc' ? comparison : comparison * -1
  })

  // ---------------- Filtering & Pagination ----------------
  const filteredRows = sortedRows.filter(
    row =>
      row.name.toLowerCase().includes(searchText.toLowerCase()) ||
      String(row.sortOrder).includes(searchText) ||
      row.description.toLowerCase().includes(searchText.toLowerCase())
  )

  // 1-based Pagination Logic
  const rowCount = filteredRows.length
  const pageCount = Math.max(1, Math.ceil(rowCount / pageSize))
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)
  const startIndex = rowCount === 0 ? 0 : (page - 1) * pageSize + 1
  const endIndex = Math.min(page * pageSize, rowCount)
  const paginationText = `Showing ${startIndex} to ${endIndex} of ${rowCount} entries`
  const theme = useTheme()
  return (
    <Box>
      {/* Breadcrumb (Manual) */}
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
          Call Type
        </Typography>
      </Box>

      <Card sx={{ p: 6 }}>
        {/* Header + actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant='h6'>Call Type List</Typography>

          <Box display='flex' gap={1}>
            <Button
              variant='outlined'
              endIcon={<ArrowDropDownIcon />}
              onClick={e => setExportAnchorEl(e.currentTarget)}
            >
              Export
            </Button>
            <Button variant='contained' startIcon={<AddIcon />} onClick={handleAdd}>
              Add Call Type
            </Button>
            <Menu anchorEl={exportAnchorEl} open={exportOpen} onClose={() => setExportAnchorEl(null)}>
              <MenuItem onClick={handleExport}>Download CSV</MenuItem>
            </Menu>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Search / entries controls */}
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
            placeholder='Search by Name, Sort Order or Description...'
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

        {/* HTML Table (Manual) */}
        <Box sx={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              tableLayout: 'fixed',
              minWidth: '1000px'
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

                {/* Call Type Name Header */}
                <th
                  onClick={() => handleSort('name')}
                  style={{ padding: '12px', width: '200px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Call Type Name <SortIcon field='name' />
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
                  {/* FIX: Displays the exact number stored as string */}
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.sortOrder}</td>
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

        {/* Pagination Controls (Manual) */}
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
            {paginationText}
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

      {/* Drawer Form (Retained as is) */}
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
              inputRef={nameRef}
              fullWidth
              margin='normal'
              label='Call Type Name'
              name='name'
              value={formData.name}
              onChange={handleChange}
              onKeyDown={e => handleKeyPress(e, sortRef)}
            />
            <CustomTextField
              inputRef={sortRef}
              fullWidth
              margin='normal'
              label='Sort Order'
              name='sortOrder'
              value={formData.sortOrder}
              onChange={e => {
                const value = e.target.value
                if (/^\d*$/.test(value)) {
                  handleChange(e)
                }
              }}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', onKeyDown: e => handleKeyPress(e, descriptionRef) }}
            />

            <CustomTextField
              inputRef={descriptionRef}
              fullWidth
              margin='normal'
              label='Description'
              name='description'
              multiline
              rows={3}
              value={formData.description}
              onChange={handleChange}
              onKeyDown={e => {
                 if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleKeyPress(e, isEdit ? statusRef : submitRef)
                  }
              }}
            />

            {isEdit && (
              <CustomTextField
                select
                fullWidth
                margin='normal'
                label='Status'
                value={formData.status}
                inputRef={statusRef}
                onChange={async e => {
                  const newStatus = e.target.value
                  setFormData(prev => ({ ...prev, status: newStatus }))
                  if (editRow) {
                    const updatedRow = { ...editRow, status: newStatus }
                    setRows(prev => prev.map(r => (r.id === editRow.id ? updatedRow : r)))
                    const db = await initDB()
                    await db.put(STORE_NAME, updatedRow)
                  }
                }}
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
