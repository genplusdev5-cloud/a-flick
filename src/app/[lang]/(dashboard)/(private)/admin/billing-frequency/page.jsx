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
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import { MdDelete } from 'react-icons/md'

// Wrapper
import CustomTextField from '@core/components/mui/TextField'
import CustomAutocomplete from '@core/components/mui/Autocomplete'
import Link from 'next/link'

export default function BillingFrequencyPage() {
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchText, setSearchText] = useState('')
  const [open, setOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editRow, setEditRow] = useState(null)

  // State for Sorting
  const [sortField, setSortField] = useState('id')
  const [sortDirection, setSortDirection] = useState('desc')
  const [formData, setFormData] = useState({
    displayFrequency: '',
    frequencyCode: '',
    description: '',
    sortOrder: '',
    status: 'Active',
    incrementType: '',
    noOfIncrements: '',
    backlogAge: ''
  })
  const [incrementTypeOpen, setIncrementTypeOpen] = useState(false)
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const exportOpen = Boolean(exportAnchorEl)

  const DB_NAME = 'billing_frequency_db'
  const STORE_NAME = 'frequencies'

  // ---------------- Refs for keyboard navigation ----------------
  const incrementTypeRef = useRef(null)
  const noOfIncrementsRef = useRef(null)
  const backlogAgeRef = useRef(null)
  const frequencyCodeRef = useRef(null)
  const displayFrequencyRef = useRef(null)
  const sortOrderRef = useRef(null)
  const descriptionRef = useRef(null)
  const submitRef = useRef(null)

  const toggleDrawer = () => setOpen(prev => !prev)
  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value })
  const handleSearch = e => {
    setSearchText(e.target.value)
    setPage(1)
  }

  // Helper component to render the sort icon
  const SortIcon = ({ field }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 16, ml: 0.5 }} /> : <ArrowDownwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
  }

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

  // ---------------- CRUD & Export ----------------
  const handleAdd = () => {
    setIsEdit(false)
    setEditRow(null)
    setFormData({
      displayFrequency: '',
      frequencyCode: '',
      description: '',
      sortOrder: '',
      status: 'Active',
      incrementType: '',
      noOfIncrements: '',
      backlogAge: ''
    })
    setOpen(true)

  }

  const handleEdit = row => {
    setIsEdit(true)
    setEditRow(row)
    setFormData({
      displayFrequency: '',
      frequencyCode: '',
      description: '',
      sortOrder: '',
      status: 'Active',
      incrementType: '',
      noOfIncrements: '',
      backlogAge: '',
      ...row
    })
    setOpen(true)

  }

  const handleDelete = async row => {
    const db = await initDB()
    await db.delete(STORE_NAME, row.id)
    setRows(prev => prev.filter(r => r.id !== row.id))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const db = await initDB()
    let rowToSave

    if (isEdit && editRow) {
      rowToSave = { ...editRow, ...formData }
      await db.put(STORE_NAME, rowToSave)
      setRows(prev => prev.map(r => (r.id === editRow.id ? rowToSave : r)))
    } else {
      const newRowData = { ...formData }
      const newId = await db.add(STORE_NAME, newRowData)
      rowToSave = { ...newRowData, id: newId }
      setRows(prev => {
        const newRows = [rowToSave, ...prev.filter(r => r.id !== newId)]
        return newRows.sort((a, b) => b.id - a.id)
      })
    }
    toggleDrawer()
    setSortField('id')
    setSortDirection('desc')
  }

  const handleExport = () => {
    if (!rows.length) return
    // Export all fields from the data model, even if not displayed in table
    const headers = ['ID', 'Display Frequency', 'Frequency Code', 'Description', 'Sort Order', 'Increment Type', 'No of Increments', 'Backlog Age', 'Status']
    const csvRows = rows.map(r =>
      [r.id, `"${r.displayFrequency}"`, r.frequencyCode, `"${r.description}"`, r.sortOrder, r.incrementType, r.noOfIncrements, r.backlogAge, r.status].join(',')
    )
    const csv = [headers.join(','), ...csvRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'billing-frequency.csv'
    a.click()
    URL.revokeObjectURL(url)
    setExportAnchorEl(null)
  }

  // ---------------- Keyboard navigation ----------------
  const focusNext = ref => {
    if (!ref.current) return
    const input = ref.current.querySelector('input') || ref.current
    input.focus()
  }
  const handleKeyDown = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      focusNext(nextRef)
    }
  }

  // ---------------- Sorting Logic -------------------
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
    if (!isNaN(Number(aValue)) && !isNaN(Number(bValue)) && ['sortOrder', 'id', 'noOfIncrements', 'backlogAge'].includes(sortField)) {
      comparison = Number(aValue) - Number(bValue)
    } else {
      comparison = String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' })
    }

    return sortDirection === 'asc' ? comparison : comparison * -1
  })

  // ---------------- Filtering and Pagination Logic -------------------
  const filteredRows = sortedRows.filter(
    row =>
      row.displayFrequency?.toLowerCase().includes(searchText.toLowerCase()) ||
      row.frequencyCode?.toLowerCase().includes(searchText.toLowerCase()) ||
      row.incrementType?.toLowerCase().includes(searchText.toLowerCase()) ||
      row.description?.toLowerCase().includes(searchText.toLowerCase())
  )

  const rowCount = filteredRows.length
  const pageCount = Math.max(1, Math.ceil(rowCount / pageSize))
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)
  const startIndex = rowCount === 0 ? 0 : (page - 1) * pageSize + 1
  const endIndex = Math.min(page * pageSize, rowCount)
  const paginationText = `Showing ${startIndex} to ${endIndex} of ${rowCount} entries`
  const theme = useTheme()
  return (
    <Box>
      {/* Breadcrumb */}
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
          Billing Frequency
        </Typography>
      </Box>

      <Card sx={{ p: 6 }}>
        {/* Header + actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant='h6'>Billing Frequency List</Typography>

          <Box display='flex' gap={1}>
            <Button
              variant='outlined'
              endIcon={<ArrowDropDownIcon />}
              onClick={e => setExportAnchorEl(e.currentTarget)}
            >
              Export
            </Button>
            <Button variant='contained' startIcon={<AddIcon />} onClick={handleAdd}>
              Add Billing Frequency
            </Button>
             <Menu anchorEl={exportAnchorEl} open={exportOpen} onClose={() => setExportAnchorEl(null)}>
                <MenuItem onClick={handleExport}>Download CSV</MenuItem>
              </Menu>
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
            placeholder='Search by Code, Frequency or Type...'
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
              tableLayout: 'fixed',
              minWidth: '900px' // Adjusted min-width
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

                {/* Display Frequency Header */}
                <th
                  onClick={() => handleSort('displayFrequency')}
                  style={{ padding: '12px', width: '160px', cursor: 'pointer', userSelect: 'none' }}
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
                  style={{ padding: '12px', width: '250px', cursor: 'pointer', userSelect: 'none' }}
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
                  {/* Removed: Increment Type, No of Increments, Backlog Age columns */}
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

      {/* ----------------- Drawer Form (Fields retained for Add/Edit) ----------------- */}
      <Drawer anchor='right' open={open} onClose={toggleDrawer}>
        <Box sx={{ width: 360, p: 3 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6'>{isEdit ? 'Edit Billing Frequency' : 'Add New Billing Frequency'}</Typography>
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

            {/* Other fields */}
            <CustomTextField inputRef={noOfIncrementsRef} fullWidth margin='normal' label='No of Increments' name='noOfIncrements' value={formData.noOfIncrements} onChange={e => /^\d*$/.test(e.target.value) && handleChange(e)} inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', onKeyDown: e => handleKeyDown(e, backlogAgeRef) }} />
            <CustomTextField inputRef={backlogAgeRef} fullWidth margin='normal' label='Backlog Age' name='backlogAge' value={formData.backlogAge} onChange={e => /^\d*$/.test(e.target.value) && handleChange(e)} inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', onKeyDown: e => handleKeyDown(e, frequencyCodeRef) }} />
            <CustomTextField inputRef={frequencyCodeRef} fullWidth margin='normal' label='Frequency Code' name='frequencyCode' value={formData.frequencyCode} onChange={handleChange} inputProps={{ onKeyDown: e => handleKeyDown(e, displayFrequencyRef) }} />
            <CustomTextField inputRef={displayFrequencyRef} fullWidth margin='normal' label='Display Frequency' name='displayFrequency' value={formData.displayFrequency} onChange={handleChange} inputProps={{ onKeyDown: e => handleKeyDown(e, sortOrderRef) }} />
            <CustomTextField inputRef={sortOrderRef} fullWidth margin='normal' label='Sort Order' name='sortOrder' value={formData.sortOrder} onChange={e => /^\d*$/.test(e.target.value) && handleChange(e)} inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', onKeyDown: e => handleKeyDown(e, descriptionRef) }} />
            <CustomTextField
                inputRef={descriptionRef}
                fullWidth
                margin='normal'
                multiline
                rows={3}
                label='Description'
                name='description'
                value={formData.description}
                onChange={handleChange}
                inputProps={{ onKeyDown: e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); isEdit ? focusNext(null) : focusNext(submitRef) } } }}
            />

            {/* Status - only editable when editing */}
            {isEdit && (
              <CustomTextField
                select
                fullWidth
                margin='normal'
                label='Status'
                value={formData.status}
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
