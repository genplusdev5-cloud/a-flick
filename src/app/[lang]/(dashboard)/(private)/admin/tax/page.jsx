'use client'

import { useState, useRef, useEffect } from 'react'
import { openDB } from 'idb'
import {
  Box,
  Button,
  IconButton,
  Drawer,
  InputAdornment,
  Menu,
  MenuItem,
  Typography,
  ListItemText,
  FormControl, // Added for pageSize Select
  Select, // Added for pageSize Select
  Pagination, // Added for Pagination component
  Card, // Added for card styling
  Divider // Added for divider
} from '@mui/material'

// Icons
import { MdDelete } from 'react-icons/md'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import DownloadIcon from '@mui/icons-material/Download'
import EditIcon from '@mui/icons-material/Edit'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward' // For sorting up
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward' // For sorting down
import Link from 'next/link' // Added for breadcrumb

// Wrapper
import CustomTextField from '@core/components/mui/TextField'

// ------------------- IndexedDB -------------------
const DB_NAME = 'tax_db'
const STORE_NAME = 'taxes'

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

// Format tax value with 2 decimals
const formatTaxValue = value => {
  if (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) {
    const num = parseFloat(value)
    if (!isNaN(num)) {
      return num.toLocaleString('fullwide', {
        useGrouping: false,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }
  }
  return ''
}

// Load rows from DB
const loadRowsFromDB = async () => {
  const db = await initDB()
  const allRows = await db.getAll(STORE_NAME)
  // Ensure 'tax' is formatted on load
  return allRows.map(r => ({ ...r, tax: formatTaxValue(r.tax) })).sort((a, b) => b.id - a.id)
}

// Add/Update row
const addOrUpdateRowToDB = async row => {
  const db = await initDB()
  return db.put(STORE_NAME, row)
}

// Delete row
const deleteRowFromDB = async id => {
  const db = await initDB()
  await db.delete(STORE_NAME, id)
}
// ------------------- Component -------------------

export default function TaxPage() {
  const [open, setOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [formData, setFormData] = useState({ name: '', tax_value: '', status: 'Active' })
  const [rows, setRows] = useState([])
  const [searchText, setSearchText] = useState('')

  // State for Sorting (from Page A)
  const [sortField, setSortField] = useState('id') // Default sort by ID
  const [sortDirection, setSortDirection] = useState('desc') // Default sort descending

  // State variables for Pagination (from Page A)
  const [page, setPage] = useState(1) // 1-based indexing
  const [rowsPerPage, setRowsPerPage] = useState(10) // Renamed from pageSize in A, keeping value

  // UI State
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const exportOpen = Boolean(exportAnchorEl)

  const nameRef = useRef(null)
  const taxRef = useRef(null)
  const submitRef = useRef(null)

  // -------- Initial Load & DB Handlers --------

  useEffect(() => {
    async function initialLoad() {
      const allRows = await loadRowsFromDB()
      setRows(allRows)
    }
    initialLoad()
  }, [])

  const toggleDrawer = () => setOpen(prev => !prev)

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleAdd = () => {
    setIsEdit(false)
    setFormData({ name: '', tax_value: '', status: 'Active' })
    setEditRow(null) // Ensure editRow is null
    setOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setEditRow(row)
    setFormData({ name: row.name, tax_value: row.tax, status: row.status || 'Active' })
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
    if (!formData.name || !formData.tax_value) return

    const formattedTax = formatTaxValue(formData.tax_value)
    if (formattedTax === '') return

    let rowToSave
    if (isEdit && editRow) {
      rowToSave = {
        ...editRow,
        name: formData.name,
        tax: formattedTax,
        status: formData.status || 'Active'
      }
      await addOrUpdateRowToDB(rowToSave)
      setRows(prev => prev.map(r => (r.id === editRow.id ? rowToSave : r)))
    } else {
      // IndexedDB autoIncrement handles ID, but we predict for immediate state update (Page A style)
      // Note: This logic for ID prediction is flawed if 'rows' is not all data. Better to use the returned key from IndexedDB add or rely on a full reload.
      // We will use the approach from Page A's implementation of ID prediction:
      const newId = rows.length ? Math.max(...rows.map(r => r.id)) + 1 : 1
      rowToSave = {
        id: newId,
        name: formData.name,
        tax: formattedTax,
        status: formData.status || 'Active'
      }

      await addOrUpdateRowToDB(rowToSave) // Use put/add as appropriate. Since keyPath is 'id' and we set a predicted ID, put is safer.
      setRows(prev => {
        const newRows = [rowToSave, ...prev.filter(r => r.id !== newId)] // Ensure no duplicates
        return newRows.sort((a, b) => b.id - a.id)
      })
    }

    setFormData({ name: '', tax_value: '', status: 'Active' })
    toggleDrawer()
    // Reset sort to 'id' desc to show the new/updated row easily (from Page A)
    setSortField('id')
    setSortDirection('desc')
  }

  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (field === 'name') taxRef.current?.focus()
      else if (field === 'tax') submitRef.current?.focus()
    }
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
    // Check if values are numerical (for tax and id)
    if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
      comparison = Number(aValue) - Number(bValue)
    } else {
      // Case-insensitive string comparison for name, status
      comparison = String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' })
    }

    // Apply the sort direction
    return sortDirection === 'asc' ? comparison : comparison * -1
  })

  // Helper component to render the sort icon (from Page A)
  const SortIcon = ({ field }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 16, ml: 0.5 }} /> : <ArrowDownwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
  }

  // ------------------- Filtering and Pagination (from Page A) -------------------

  const handleSearch = e => {
    setSearchText(e.target.value)
    setPage(1) // reset page on search change
  }

  const filteredRows = sortedRows.filter(
    r =>
      r.name.toLowerCase().includes(searchText.toLowerCase()) ||
      r.tax.toLowerCase().includes(searchText.toLowerCase())
  )

  const rowCount = filteredRows.length
  const pageCount = Math.max(1, Math.ceil(rowCount / rowsPerPage))
  const paginatedRows = filteredRows.slice((page - 1) * rowsPerPage, page * rowsPerPage)
  const startIndex = rowCount === 0 ? 0 : (page - 1) * rowsPerPage + 1
  const endIndex = Math.min(page * rowsPerPage, rowCount)

  const handleExportClick = e => setExportAnchorEl(e.currentTarget)
  const handleExportClose = () => setExportAnchorEl(null)
  const handleExportSelect = type => {
    alert(`Export as: ${type}`)
    handleExportClose()
  }

  return (
    <Box>
      {/* Breadcrumb (from Page A) */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <Link href='/' style={{ color: '#7367F0', textDecoration: 'none', fontSize: 14 }}>
          Dashboard
        </Link>
        <Typography sx={{ mx: 1, color: 'text.secondary' }}>/</Typography>
        <Typography variant='body2' sx={{ fontSize: 14 }}>
          Tax Management
        </Typography>
      </Box>

      <Card sx={{ p: 6 }}>
        {/* Header + actions (from Page A) */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant='h6'>Tax List</Typography>

          <Box display='flex' gap={1}>
            <Button
              variant='outlined'
              endIcon={<ArrowDropDownIcon />}
              onClick={handleExportClick}
            >
              Export
            </Button>
            <Menu anchorEl={exportAnchorEl} open={exportOpen} onClose={handleExportClose}>
              <MenuItem onClick={() => handleExportSelect('print')}><ListItemText>Print</ListItemText></MenuItem>
              <MenuItem onClick={() => handleExportSelect('csv')}><ListItemText>CSV</ListItemText></MenuItem>
              <MenuItem onClick={() => handleExportSelect('excel')}><ListItemText>Excel</ListItemText></MenuItem>
              <MenuItem onClick={() => handleExportSelect('pdf')}><ListItemText>PDF</ListItemText></MenuItem>
              <MenuItem onClick={() => handleExportSelect('copy')}><ListItemText>Copy</ListItemText></MenuItem>
            </Menu>
            <Button variant='contained' startIcon={<AddIcon />} onClick={handleAdd}>
              Add Tax
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Search / entries (from Page A) */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <FormControl size='small' sx={{ minWidth: 120 }}>
            <Select
              value={rowsPerPage}
              onChange={e => {
                setRowsPerPage(Number(e.target.value))
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
            placeholder='Search by Tax Name or Value...'
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

        {/* Table (Manual HTML Table - from Page A) */}
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
                {/* S.No / ID Header (from Page A) */}
                <th
                  onClick={() => handleSort('id')}
                  style={{ padding: '12px', width: '60px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    S.No <SortIcon field='id' />
                  </Box>
                </th>

                <th style={{ padding: '12px', width: '100px' }}>Action</th>

                {/* Tax Name Header */}
                <th
                  onClick={() => handleSort('name')}
                  style={{ padding: '12px', width: '200px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Tax Name <SortIcon field='name' />
                  </Box>
                </th>

                {/* Tax Value Header */}
                <th
                  onClick={() => handleSort('tax')}
                  style={{ padding: '12px', width: '150px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Tax (%) <SortIcon field='tax' />
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
                    {(page - 1) * rowsPerPage + i + 1}
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
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.tax}</td>
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

      {/* Drawer Form (Modified for Page B's fields, keeping Page A's structure) */}
      <Drawer anchor='right' open={open} onClose={toggleDrawer}>
        <Box sx={{ width: 360, p: 3 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6'>{isEdit ? 'Edit Tax' : 'Add Tax'}</Typography>
            <IconButton onClick={toggleDrawer}><CloseIcon /></IconButton>
          </Box>

          <form onSubmit={handleSubmit}>
            <CustomTextField
              fullWidth
              label='Tax Name'
              name='name'
              value={formData.name}
              margin='normal'
              inputRef={nameRef}
              onChange={e => {
                // Allows letters and spaces, same as Page B's logic
                const lettersOnly = e.target.value.replace(/[^a-zA-Z\s]/g, '')
                setFormData(prev => ({ ...prev, name: lettersOnly }))
              }}
              onKeyDown={e => handleKeyDown(e, 'name')}
            />

            <CustomTextField
              fullWidth
              label='Tax Value (%)'
              name='tax_value'
              value={formData.tax_value}
              margin='normal'
              inputRef={taxRef}
              onChange={e => {
                const val = e.target.value
                const numericValue = val.match(/^-?\d*\.?\d*$/)?.[0] || ''
                setFormData({ ...formData, tax_value: numericValue })
              }}
              onBlur={e => {
                let val = e.target.value
                if (val !== '' && !isNaN(parseFloat(val))) {
                  const num = parseFloat(val)
                  val = num.toLocaleString('fullwide', {
                    useGrouping: false,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })
                } else val = ''
                setFormData({ ...formData, tax_value: val })
              }}
              onKeyDown={e => handleKeyDown(e, 'tax')}
              type='text'
              inputProps={{ inputMode: 'decimal' }}
            />

            {isEdit && (
              <CustomTextField
                fullWidth margin='normal' label='Status' name='status'
                select value={formData.status}
                onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value='Active'>Active</MenuItem>
                <MenuItem value='Inactive'>Inactive</MenuItem>
              </CustomTextField>
            )}

            <Box mt={3} display='flex' gap={2}>
              <Button type='submit' variant='contained' fullWidth ref={submitRef}>
                {isEdit ? 'Update' : 'Submit'}
              </Button>
              <Button variant='outlined' fullWidth onClick={toggleDrawer}>Cancel</Button>
            </Box>
          </form>
        </Box>
      </Drawer>
    </Box>
  )
}
