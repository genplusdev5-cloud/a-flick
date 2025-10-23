'use client'

import { useState, useRef, useEffect } from 'react'
import { openDB } from 'idb'

// MUI Imports
import {
  Box,
  Typography,
  Button,
  IconButton,
  Drawer,
  InputAdornment,
  MenuItem,
  Card, // Added Card
  Divider, // Added Divider
  FormControl, // Added FormControl for entries dropdown
  Select, // Added Select for entries dropdown
  Pagination, // Replaced TablePagination with Pagination
  Menu // Added Menu for Export like Page A
} from '@mui/material'

// Icons
import { MdDelete } from 'react-icons/md'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown' // For export and sorting
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward' // For sorting
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward' // For sorting

// Custom Components
import CustomTextField from '@core/components/mui/TextField'
import Link from 'next/link' // Used for Breadcrumbs
import { useTheme } from '@mui/material/styles'
// IndexedDB config
const dbName = 'EmployeeLeaveDB'
const storeName = 'leaveTypes'

// ------------------- IndexedDB Operations -------------------
const initDB = async () => {
  return openDB(dbName, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

const loadRows = async () => {
  const db = await initDB()
  const allRows = await db.getAll(storeName)
  // Sort by ID descending (latest first)
  allRows.sort((a, b) => b.id - a.id)
  return allRows
}

// Save a row to DB
const saveRowDB = async row => {
  const db = await openDB(dbName, 1)
  if (row.id) {
    await db.put(storeName, row)
  } else {
    const id = await db.add(storeName, row)
    row.id = id
  }
}

// Delete row from DB
const deleteRowDB = async id => {
  const db = await openDB(dbName, 1)
  await db.delete(storeName, id)
}

// ------------------- Component -------------------

export default function EmployeeLeaveTypePage() {
  // Table State
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(1) // Page number (1-based)
  const [pageSize, setPageSize] = useState(10) // Rows per page
  const [searchText, setSearchText] = useState('')
  const [open, setOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [formData, setFormData] = useState({ leaveCode: '', name: '', status: 'Active' })
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const exportOpen = Boolean(exportAnchorEl)

  // Sorting State
  const [sortField, setSortField] = useState('id') // Default sort by ID
  const [sortDirection, setSortDirection] = useState('desc')

  const leaveCodeRef = useRef(null)
  const nameRef = useRef(null)
  const statusRef = useRef(null) // Added ref for status
  const submitRef = useRef(null)

  // Helper for keyboard navigation
  const focusNext = ref => {
    if (!ref.current) return
    const input = ref.current.querySelector('input') || ref.current
    input.focus()
  }

  const handleKeyPress = (e, currentField) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (currentField === 'leaveCode') focusNext(nameRef)
      else if (currentField === 'name') isEdit ? focusNext(statusRef) : focusNext(submitRef)
      else if (currentField === 'status') focusNext(submitRef)
    }
  }

  // Load data on mount and update
  const reloadRows = async () => {
    const updatedRows = await loadRows()
    setRows(updatedRows)
  }

  useEffect(() => {
    reloadRows()
  }, [])

  // ---------- Handlers ----------
  const toggleDrawer = () => setOpen(prev => !prev)

  const handleAdd = () => {
    setIsEdit(false)
    setEditRow(null)
    setFormData({ leaveCode: '', name: '', status: 'Active' })
    setOpen(true)
    setTimeout(() => leaveCodeRef.current?.focus(), 100)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setEditRow(row)
    setFormData({ leaveCode: row.leaveCode, name: row.name, status: row.status ?? 'Active' })
    setOpen(true)
    setTimeout(() => leaveCodeRef.current?.focus(), 100)
  }

  const handleDelete = async row => {
    await deleteRowDB(row.id)
    await reloadRows()
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!formData.leaveCode || !formData.name) return

    if (isEdit && editRow) {
      await saveRowDB({ ...formData, id: editRow.id })
    } else {
      await saveRowDB({ ...formData, status: formData.status ?? 'Active' })
    }

    // Reset sort to show newly added item at the top
    setSortField('id')
    setSortDirection('desc')
    await reloadRows()
    setOpen(false)
  }

  const handleSearch = e => {
    setSearchText(e.target.value)
    setPage(1)
  }

  const handleSort = field => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setPage(1)
  }

  const handleExport = () => {
    if (!rows.length) return
    const headers = ['ID', 'Leave Code', 'Name', 'Status']
    const csvRows = rows.map(r =>
      [r.id, `"${r.leaveCode}"`, `"${r.name}"`, r.status].join(',')
    )
    const csv = [headers.join(','), ...csvRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'employee_leave_types.csv'
    a.click()
    URL.revokeObjectURL(url)
    setExportAnchorEl(null)
  }

  // ---------- Table Data Filtering, Sorting, and Pagination ----------

  const sortedRows = [...rows].sort((a, b) => {
    const aValue = a[sortField] || ''
    const bValue = b[sortField] || ''

    let comparison = 0
    if (sortField === 'id') {
      comparison = aValue - bValue
    } else {
      comparison = String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' })
    }

    return sortDirection === 'asc' ? comparison : comparison * -1
  })

  const filteredRows = sortedRows.filter(
    row =>
      row.leaveCode.toLowerCase().includes(searchText.toLowerCase()) ||
      row.name.toLowerCase().includes(searchText.toLowerCase()) ||
      row.status.toLowerCase().includes(searchText.toLowerCase())
  )

  const rowCount = filteredRows.length
  const pageCount = Math.max(1, Math.ceil(rowCount / pageSize))
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)
  const startIndex = rowCount === 0 ? 0 : (page - 1) * pageSize + 1
  const endIndex = Math.min(page * pageSize, rowCount)
  const paginationText = `Showing ${startIndex} to ${endIndex} of ${rowCount} entries`

  const tableColumns = [
    { label: 'Leave Code', field: 'leaveCode', minWidth: '150px' },
    { label: 'Name', field: 'name', minWidth: '250px' },
    { label: 'Status', field: 'status', minWidth: '100px' }
  ]

  const totalMinWidth = 60 + 100 + tableColumns.reduce((sum, col) => sum + parseInt(col.minWidth), 0) + 'px'

  // Helper component to render the sort icon
  const SortIcon = ({ field }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <ArrowUpwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
    ) : (
      <ArrowDownwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
    )
  }
  const theme = useTheme()
  return (
    <Box>
      {/* Breadcrumb (Like Page A) */}
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
          Employee Leave Type
        </Typography>
      </Box>

      <Card sx={{ p: 6 }}>
        {/* Header + actions (Like Page A) */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant='h6'>Employee Leave Types</Typography>

          <Box display='flex' gap={1}>
            <Button
              variant='outlined'
              endIcon={<ArrowDropDownIcon />}
              onClick={e => setExportAnchorEl(e.currentTarget)}
            >
              Export
            </Button>
            <Button variant='contained' startIcon={<AddIcon />} onClick={handleAdd}>
              Add Leave Type
            </Button>
            {/* Export Menu (Like Page A) */}
            <Menu anchorEl={exportAnchorEl} open={exportOpen} onClose={() => setExportAnchorEl(null)}>
              <MenuItem onClick={handleExport}>Download CSV</MenuItem>
            </Menu>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Search / entries (Like Page A) */}
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
            placeholder='Search All Fields...'
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

        {/* Table (Manual HTML Table, matching Page A structure) */}
        <Box sx={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              tableLayout: 'fixed', // Fixed layout from Page A
              minWidth: totalMinWidth // Ensured all columns fit
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

                {/* Dynamic Data Columns */}
                {tableColumns.map(col => (
                  <th
                    key={col.field}
                    onClick={() => handleSort(col.field)}
                    style={{ padding: '12px', width: col.minWidth, cursor: 'pointer', userSelect: 'none' }}
                  >
                    <Box display='flex' alignItems='center'>
                      {col.label} <SortIcon field={col.field} />
                    </Box>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {paginatedRows.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
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
                  {/* Data Cells */}
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.leaveCode}</td>
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.name}</td>
                  {/* Status Badge (Like Page A) */}
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

        {/* Pagination (Like Page A) */}
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

      {/* Drawer Form (Page A width and flow applied) */}
      <Drawer anchor='right' open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: 360, p: 3 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6'>{isEdit ? 'Edit Leave Type' : 'Add Leave Type'}</Typography>
            <IconButton onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <form onSubmit={handleSubmit}>
            <CustomTextField
              fullWidth
              margin='normal'
              label={<span>Leave Code <span style={{ color: 'red' }}>*</span></span>}
              name='leaveCode'
              value={formData.leaveCode}
              onChange={e => setFormData(prev => ({ ...prev, leaveCode: e.target.value }))}
              inputRef={leaveCodeRef}
              inputProps={{ onKeyDown: e => handleKeyPress(e, 'leaveCode') }}
            />
            <CustomTextField
              fullWidth
              margin='normal'
              label={<span>Name <span style={{ color: 'red' }}>*</span></span>}
              name='name'
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value.replace(/[^a-zA-Z\s]/g, '') }))} // Added cleanup for non-alpha chars
              inputRef={nameRef}
              inputProps={{ onKeyDown: e => handleKeyPress(e, 'name') }}
            />

            {isEdit && (
              <CustomTextField
                select
                fullWidth
                margin='normal'
                label='Status'
                name='status'
                value={formData.status ?? 'Active'}
                onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                inputRef={statusRef}
                inputProps={{ onKeyDown: e => handleKeyPress(e, 'status') }}
              >
                <MenuItem value='Active'>Active</MenuItem>
                <MenuItem value='Inactive'>Inactive</MenuItem>
              </CustomTextField>
            )}

            <Box mt={3} display='flex' gap={2}>
              <Button type='submit' variant='contained' fullWidth ref={submitRef}>
                {isEdit ? 'Update' : 'Submit'}
              </Button>
              <Button variant='outlined' fullWidth onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </Box>
          </form>
        </Box>
      </Drawer>
    </Box>
  )
}
