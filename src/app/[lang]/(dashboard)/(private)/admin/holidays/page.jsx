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

// Icons
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import DownloadIcon from '@mui/icons-material/Download'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import { MdDelete } from 'react-icons/md'
import { openDB } from 'idb'

// Wrapper/Custom Components
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import Link from 'next/link'
import { useTheme } from '@mui/material/styles'
// ------------------- IndexedDB -------------------
const DB_NAME = 'HolidayDB'
const STORE_NAME = 'holidays'

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

async function getAllHolidays() {
  const db = await getDB()
  return db.getAll(STORE_NAME)
}

const parseDateString = dateString => {
  if (!dateString) return null
  const parts = dateString.split('/')
  if (parts.length === 3) {
    const [day, month, year] = parts.map(Number)
    return new Date(Date.UTC(year, month - 1, day))
  }
  return null
}

// ------------------- Component -------------------
export default function HolidayPage() {
  const [rows, setRows] = useState([])

  // State for Pagination (1-based index)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [searchText, setSearchText] = useState('')
  const [open, setOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [formData, setFormData] = useState({ name: '', date: '', year: '', status: 'Active' })

  // State for Sorting: field to sort by and direction ('asc' or 'desc')
  const [sortField, setSortField] = useState('id')
  const [sortDirection, setSortDirection] = useState('desc')

  const nameRef = useRef(null)
  const dateRef = useRef(null)
  const statusRef = useRef(null)
  const submitButtonRef = useRef(null)

  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const exportOpen = Boolean(exportAnchorEl)

  // ------------------- Initial Load -------------------
  useEffect(() => {
    async function loadRows() {
      const allHolidays = await getAllHolidays()
      // Initial load: sort by ID descending (latest first)
      allHolidays.sort((a, b) => b.id - a.id)
      setRows(allHolidays)
    }
    loadRows()
  }, [])

  // ------------------- IndexedDB CRUD Operations -------------------
  const toggleDrawer = () => setOpen(prev => !prev)

  const saveToDB = async holiday => {
    const db = await getDB()
    await db.put(STORE_NAME, holiday)
  }

  const deleteFromDB = async id => {
    const db = await getDB()
    await db.delete(STORE_NAME, id)
  }

  const handleAdd = () => {
    setIsEdit(false)
    setFormData({ name: '', date: '', year: '', status: 'Active' })
    setEditRow(null)
    setOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  const handleEdit = row => {
    if (!row) return
    setIsEdit(true)
    setEditRow(row)
    setFormData({ ...row })
    setOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  const handleDelete = async row => {
    setRows(prev => prev.filter(r => r.id !== row.id))
    await deleteFromDB(row.id)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!formData.name || !formData.date) return

    const extractedYear = formData.date.split('/')[2] || ''
    const safeFormData = { ...formData, year: extractedYear }

    let rowToSave
    if (isEdit && editRow) {
      rowToSave = { ...editRow, ...safeFormData }
      setRows(prev => prev.map(r => (r.id === editRow.id ? rowToSave : r)))
    } else {
      const newId = rows.length ? Math.max(...rows.map(r => r.id)) + 1 : 1
      rowToSave = { id: newId, ...safeFormData }
      setRows(prev => {
        const newRows = [rowToSave, ...prev.filter(r => r.id !== newId)]
        return newRows.sort((a, b) => b.id - a.id)
      })
    }

    await saveToDB(rowToSave)

    setFormData({ name: '', date: '', year: '', status: 'Active' })
    toggleDrawer()
    setSortField('id')
    setSortDirection('desc')
  }

  // ------------------- Export Function (FIXED: Missing in previous attempt) -------------------
  const handleExport = () => {
    // Use all rows, sorted by ID descending (latest first)
    const exportRows = [...rows].sort((a, b) => b.id - a.id);

    const headers = ['S.No', 'Holiday Name', 'Year', 'Date', 'Status']
    const csv = [
      headers.join(','),
      ...exportRows.map((r, i) => [
        `${i + 1}`,
        `"${r.name.replace(/"/g, '""')}"`, // Handle quotes in names
        r.year,
        `"${r.date.replace(/"/g, '""')}"`, // Handle quotes in dates
        r.status
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'holidays.csv'
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
    setPage(1) // Reset to first page on sort change
  }

  const sortedRows = [...rows].sort((a, b) => {
    const aValue = a[sortField] || ''
    const bValue = b[sortField] || ''

    let comparison = 0
    if (sortField === 'id' || sortField === 'year') {
      comparison = Number(aValue) - Number(bValue)
    } else if (sortField === 'date') {
      // Custom date comparison (DD/MM/YYYY)
      const [dA, mA, yA] = aValue.split('/')
      const [dB, mB, yB] = bValue.split('/')
      // Create date objects for comparison (time set to 0 to compare dates only)
      const dateA = new Date(yA, mA - 1, dA).getTime()
      const dateB = new Date(yB, mB - 1, dB).getTime()
      comparison = dateA - dateB
    }
    else {
      // Case-insensitive string comparison for name, status
      comparison = String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' })
    }

    // Apply the sort direction
    return sortDirection === 'asc' ? comparison : comparison * -1
  })

  // Helper component to render the sort icon
  const SortIcon = ({ field }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 16, ml: 0.5 }} /> : <ArrowDownwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
  }

  // ------------------- Filtering and Pagination -------------------

  const handleSearch = e => {
    setSearchText(e.target.value)
    setPage(1) // reset page on search change
  }

  // Client-side filtering based on search text
  const filteredRows = sortedRows.filter(
    r =>
      r.name.toLowerCase().includes(searchText.toLowerCase()) ||
      r.date.toLowerCase().includes(searchText.toLowerCase()) ||
      (r.year && r.year.toString().includes(searchText.toLowerCase()))
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
          Holiday List
        </Typography>
      </Box>

      <Card sx={{ p: 6 }}>
        {/* Header + actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant='h6'>Holiday List</Typography>

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
              Add Holiday
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

        {/* Search / entries */}
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
            placeholder='Search by Holiday Name or Date...'
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

                <th style={{ padding: '12px', width: '100px' }}>Action</th>

                {/* Holiday Name Header */}
                <th
                  onClick={() => handleSort('name')}
                  style={{ padding: '12px', width: '200px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Holiday Name <SortIcon field='name' />
                  </Box>
                </th>

                {/* Date Header */}
                <th
                  onClick={() => handleSort('date')}
                  style={{ padding: '12px', width: '150px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Date <SortIcon field='date' />
                  </Box>
                </th>

                {/* Year Header */}
                <th
                  onClick={() => handleSort('year')}
                  style={{ padding: '12px', width: '100px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Year <SortIcon field='year' />
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
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.name}</td>
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.date}</td>
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.year}</td>

                  {/* Status cell (Styled like Page A) */}
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

      {/* Drawer Form */}
      <Drawer anchor='right' open={open} onClose={toggleDrawer}>
        <Box sx={{ width: 360, p: 3 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6'>{isEdit ? 'Edit Holiday' : 'Add New Holiday'}</Typography>
            <IconButton onClick={toggleDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>

          <form onSubmit={handleSubmit}>
            {/* Holiday Name */}
            <CustomTextField
              fullWidth
              margin='normal'
              label='Holiday Name'
              name='name'
              value={formData.name}
              onChange={e => {
                const value = e.target.value.replace(/[^a-zA-Z\s]/g, '')
                setFormData(prev => ({ ...prev, name: value }))
              }}
              inputRef={nameRef}
              inputProps={{
                onKeyDown: e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    dateRef.current?.input.focus()
                  }
                }
              }}
            />

            {/* Date Picker */}
            <AppReactDatepicker
              dateFormat='dd/MM/yyyy'
              selected={formData.date ? parseDateString(formData.date) : null}
              onChange={date => {
                let formattedDate = ''
                if (date) {
                  const day = String(date.getUTCDate()).padStart(2, '0')
                  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
                  const year = date.getUTCFullYear()
                  formattedDate = `${day}/${month}/${year}`
                }
                setFormData(prev => ({ ...prev, date: formattedDate }))
              }}
              placeholderText='DD/MM/YYYY'
              ref={dateRef}
              customInput={
                <CustomTextField
                  fullWidth
                  margin='normal'
                  label='Date'
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <CalendarTodayIcon />
                      </InputAdornment>
                    )
                  }}
                />
              }
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (isEdit) {
                    statusRef.current?.focus()
                  } else {
                    submitButtonRef.current?.focus()
                  }
                }
              }}
            />

            {/* Status (only in edit mode) */}
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
                  // Update DB and local state immediately
                  if (editRow) {
                    const updatedRow = { ...editRow, status: newStatus, year: editRow.year }
                    setRows(prev => prev.map(r => (r.id === editRow.id ? updatedRow : r)))
                    await saveToDB(updatedRow)
                  }
                }}
                onKeyDown={e => {
                    if (e.key === 'Enter') {
                        e.preventDefault()
                        submitButtonRef.current?.focus()
                    }
                }}
              >
                <MenuItem value='Active'>Active</MenuItem>
                <MenuItem value='Inactive'>Inactive</MenuItem>
              </CustomTextField>
            )}

            {/* Buttons */}
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
