'use client'

import { useState, useRef, useEffect } from 'react'
import { openDB } from 'idb'
import {
  Box,
  Button,
  IconButton,
  Drawer,
  InputAdornment,
  Menu, // Added for Export Menu
  MenuItem,
  Typography,
  ListItemText,
  FormControl, // Added for rowsPerPage Select
  Select, // Added for rowsPerPage Select
  Pagination, // Added for Pagination component
  Card, // Added for card styling
  Divider, // Added for divider
  Autocomplete, // Retained from Page B
  TextField // Retained from Page B's Autocomplete usage
} from '@mui/material'

// Icons (Using Icons from Page A where available)
import { MdDelete } from 'react-icons/md' // Replaced DeleteIcon
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import DownloadIcon from '@mui/icons-material/Download' // From Page A's imports (though not used in Page A's component body)
import EditIcon from '@mui/icons-material/Edit'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward' // For sorting up
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward' // For sorting down
import Link from 'next/link' // Added for breadcrumb

// Wrapper
import CustomTextField from '@core/components/mui/TextField'

// ------------------- IndexedDB -------------------
const DB_NAME = 'supplierDB'
const STORE_NAME = 'suppliers'

const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

const loadRowsFromDB = async () => {
  const db = await initDB()
  const allRows = await db.getAll(STORE_NAME)
  // Page B didn't sort on load, but Page A sorted desc by ID. Retaining Page B's unsorted load here.
  return allRows
}

const addOrUpdateRowToDB = async row => {
  const db = await initDB()
  // Use put for update/add (Page B's logic used add for new, put for update - using put is safer)
  return db.put(STORE_NAME, row)
}

const deleteRowFromDB = async id => {
  const db = await initDB()
  await db.delete(STORE_NAME, id)
}
// ------------------- Component -------------------

// Helper component to render the sort icon (copied from Page A)
const SortIcon = ({ field, sortField, sortDirection }) => {
  if (sortField !== field) return null
  return sortDirection === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 16, ml: 0.5 }} /> : <ArrowDownwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
}

export default function SupplierPage() {
  const [rows, setRows] = useState([])
  const [open, setOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [formData, setFormData] = useState({ type: '', name: '', address: '', status: 'Active' })
  const [searchText, setSearchText] = useState('')

  // State for Sorting (from Page A)
  const [sortField, setSortField] = useState('id') // Default sort by ID
  const [sortDirection, setSortDirection] = useState('asc') // Using 'asc' as default, since Page A used 'id' desc but supplier list is generally loaded without sort. Using 'asc' for ID initially seems better for display.

  // State variables for Pagination (from Page A)
  const [page, setPage] = useState(1) // 1-based indexing (from Page A)
  const [rowsPerPage, setRowsPerPage] = useState(10) // Renamed from pageSize in A, keeping value

  // UI State
  const [exportAnchorEl, setExportAnchorEl] = useState(null) // From Page A
  const exportOpen = Boolean(exportAnchorEl)

  // Refs from Page B
  const submitRef = useRef(null)
  const typeRef = useRef(null)
  const nameRef = useRef(null)
  const addressRef = useRef(null)
  const statusRef = useRef(null)

  const supplierTypes = ['Stock', 'Supplier', 'Vehicle', 'Adjustment', 'Opening Stock']
  const statusOptions = ['Active', 'Inactive']

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
    setEditRow(null)
    setFormData({ type: '', name: '', address: '', status: 'Active' })
    setOpen(true)
    setTimeout(() => typeRef.current?.focus(), 100)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setEditRow(row)
    setFormData({ ...row }) // Page B used spread to populate all fields
    setOpen(true)
    setTimeout(() => typeRef.current?.focus(), 100)
  }

  const handleDelete = async row => {
    setRows(prev => prev.filter(r => r.id !== row.id))
    await deleteRowFromDB(row.id)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!formData.name || !formData.type) return

    let savedRow

    if (isEdit && editRow) {
      const updatedRow = { ...editRow, ...formData }
      await addOrUpdateRowToDB(updatedRow)
      setRows(prev => prev.map(r => (r.id === editRow.id ? updatedRow : r)))
      savedRow = updatedRow
    } else {
      // IndexedDB auto-increments ID. Better to reload all or use the key returned by db.add if possible.
      // Since Page A used a flawed client-side ID prediction, and Page B used db.add which returns the key:
      const id = await initDB().then(db => db.add(STORE_NAME, formData))
      savedRow = { ...formData, id }
      setRows(prev => [savedRow, ...prev])
    }

    setFormData({ type: '', name: '', address: '', status: 'Active' })
    toggleDrawer()
    // Reset sort to 'id' asc to show the new/updated row easily (Adjusted from Page A's 'desc')
    setSortField('id')
    setSortDirection('asc')
  }

  // Key navigation logic (Copied from Page B, simplified focusNext)
  const focusNext = ref => ref?.current?.focus()
  const handleKeyPress = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (nextRef) focusNext(nextRef)
      else submitRef.current?.focus()
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
    // Check if values are numerical (only ID is guaranteed to be number)
    if (sortField === 'id' && !isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
      comparison = Number(aValue) - Number(bValue)
    } else {
      // Case-insensitive string comparison for name, type, status, address
      comparison = String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' })
    }

    // Apply the sort direction
    return sortDirection === 'asc' ? comparison : comparison * -1
  })

  // ------------------- Filtering and Pagination (from Page A) -------------------

  const handleSearch = e => {
    setSearchText(e.target.value)
    setPage(1) // reset page on search change
  }

  // Filtering logic adapted from Page B's search to match Page A's implementation style
  const filteredRows = sortedRows.filter(
    r =>
      r.name.toLowerCase().includes(searchText.toLowerCase()) ||
      r.type.toLowerCase().includes(searchText.toLowerCase()) ||
      r.id?.toString().includes(searchText.toLowerCase()) // Include ID search from Page B
  )

  const rowCount = filteredRows.length
  const pageCount = Math.max(1, Math.ceil(rowCount / rowsPerPage))
  const paginatedRows = filteredRows.slice((page - 1) * rowsPerPage, page * rowsPerPage)
  const startIndex = rowCount === 0 ? 0 : (page - 1) * rowsPerPage + 1
  const endIndex = Math.min(page * rowsPerPage, rowCount)

  // ------------------- Export Handlers (from Page A) -------------------

  const handleExportClick = e => setExportAnchorEl(e.currentTarget)
  const handleExportClose = () => setExportAnchorEl(null)
  const handleExportSelect = type => {
    alert(`Export Suppliers as: ${type}`)
    handleExportClose()
  }

  // ------------------- Render -------------------

  return (
    <Box>
      {/* Breadcrumb (from Page A) */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <Link href='/' style={{ color: '#7367F0', textDecoration: 'none', fontSize: 14 }}>
          Dashboard
        </Link>
        <Typography sx={{ mx: 1, color: 'text.secondary' }}>/</Typography>
        <Typography variant='body2' sx={{ fontSize: 14 }}>
          Supplier Management
        </Typography>
      </Box>

      <Card sx={{ p: 6 }}>
        {/* Header + actions (from Page A) */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant='h6'>Supplier List</Typography>

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
              Add Supplier
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
            placeholder='Search by Name, Type, or ID...'
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
                {/* S.No / ID Header */}
                <th
                  onClick={() => handleSort('id')}
                  style={{ padding: '12px', width: '60px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    S.No <SortIcon field='id' sortField={sortField} sortDirection={sortDirection} />
                  </Box>
                </th>

                <th style={{ padding: '12px', width: '100px' }}>Action</th>

                {/* Supplier Name Header (Field from Page B) */}
                <th
                  onClick={() => handleSort('name')}
                  style={{ padding: '12px', width: '200px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Supplier Name <SortIcon field='name' sortField={sortField} sortDirection={sortDirection} />
                  </Box>
                </th>

                {/* Supplier Type Header (Field from Page B) */}
                <th
                  onClick={() => handleSort('type')}
                  style={{ padding: '12px', width: '150px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Supplier Type <SortIcon field='type' sortField={sortField} sortDirection={sortDirection} />
                  </Box>
                </th>

                {/* Status Header (Field from Page B) */}
                <th
                  onClick={() => handleSort('status')}
                  style={{ padding: '12px', width: '100px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Status <SortIcon field='status' sortField={sortField} sortDirection={sortDirection} />
                  </Box>
                </th>
                 {/* Billing Address Header (New Field - optional to show in table) */}
                <th
                  style={{ padding: '12px', width: '250px' }}
                >
                  Billing Address
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
                      {/* Page B used Delete then Edit. Reversing to Page A's order for consistency, but using MdDelete icon*/}
                      <IconButton size='small' onClick={() => handleEdit(r)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size='small' color='error' onClick={() => handleDelete(r)}>
                        <MdDelete />
                      </IconButton>
                    </Box>
                  </td>
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.name}</td>
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.type}</td>
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
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.address}</td>
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

      {/* Drawer Form (Retaining Page B's fields/logic, using Page A's component style) */}
      <Drawer anchor='right' open={open} onClose={toggleDrawer}>
        <Box sx={{ width: 360, p: 3 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6'>{isEdit ? 'Edit Supplier' : 'Add Supplier'}</Typography>
            <IconButton onClick={toggleDrawer}><CloseIcon /></IconButton>
          </Box>

          <form onSubmit={handleSubmit}>
            {/* Supplier Type Autocomplete (from Page B) */}
            <Autocomplete
              freeSolo={false} // strictly allow only predefined options
              options={supplierTypes}
              value={formData.type}
              onChange={(event, newValue) => setFormData({ ...formData, type: newValue || '' })}
              renderInput={params => (
                <CustomTextField
                  {...params}
                  fullWidth
                  margin='normal'
                  label='Supplier Type'
                  inputRef={typeRef}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      // Only move to next field if the value is a valid option or empty (Page B's behavior was a bit complex here, simplifying to check if the field has a value when moving)
                      if (formData.type || !e.target.value) { // e.target.value for the input field
                        focusNext(nameRef)
                      }
                    }
                  }}
                />
              )}
            />
            {/* Supplier Name (from Page B) */}
            <CustomTextField
              fullWidth
              margin='normal'
              label='Supplier Name'
              name='name'
              value={formData.name}
              inputRef={nameRef}
              onChange={handleChange}
              onKeyDown={e => handleKeyPress(e, addressRef)}
            />
            {/* Billing Address (from Page B) */}
            <CustomTextField
              fullWidth
              multiline
              rows={3}
              margin='normal'
              label='Billing Address'
              name='address'
              value={formData.address}
              inputRef={addressRef}
              onChange={handleChange}
              onKeyDown={e => handleKeyPress(e, isEdit ? statusRef : submitRef)}
            />
            {/* Status (from Page B, only if isEdit) */}
            {isEdit && (
              <CustomTextField
                select
                fullWidth
                margin='normal'
                label='Status'
                name='status'
                value={formData.status}
                inputRef={statusRef}
                onChange={handleChange}
                onKeyDown={e => handleKeyPress(e, submitRef)}
              >
                {statusOptions.map(opt => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </CustomTextField>
            )}

            <Box mt={3} display='flex' gap={2}>
              <Button type='submit' variant='contained' fullWidth ref={submitRef}>
                {isEdit ? 'Update' : 'Submit'} {/* Used 'Submit' from Page A for consistency, though Page B used 'Save' */}
              </Button>
              <Button variant='outlined' fullWidth onClick={toggleDrawer}>Cancel</Button>
            </Box>
          </form>
        </Box>
      </Drawer>
    </Box>
  )
}
