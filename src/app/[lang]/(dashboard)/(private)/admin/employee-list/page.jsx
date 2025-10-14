'use client'

import { useState, useRef, useEffect } from 'react'
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
  Menu // Added Menu for Export like Page A
} from '@mui/material'

// Icons
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import { MdDelete } from 'react-icons/md'

// Wrapper & Custom Components
import CustomTextField from '@core/components/mui/TextField'
import Link from 'next/link'

// IndexedDB Config
const dbName = 'EmployeeDB'
const storeName = 'employees'
const DB_VERSION = 2

// ------------------- IndexedDB Operations -------------------

const initDB = async () => {
  return openDB(dbName, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(storeName)) {
        // NOTE: All employee fields must be created here
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

export default function EmployeePage() {
  const [rows, setRows] = useState([])
  const [open, setOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    state: '',
    pincode: '',
    address1: '',
    address2: '',
    status: 'Active'
  })
  const [errors, setErrors] = useState({})
  const [searchText, setSearchText] = useState('')

  // State for Sorting
  const [sortField, setSortField] = useState('id')
  const [sortDirection, setSortDirection] = useState('desc')

  // State variables for Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // File upload states
  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState('') // This holds the file name for the form
  const [isDragOver, setIsDragOver] = useState(false)
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const exportOpen = Boolean(exportAnchorEl)

  // Input refs for Drawer
  const nameRef = useRef(null)
  const phoneRef = useRef(null)
  const emailRef = useRef(null)
  const cityRef = useRef(null)
  const stateRef = useRef(null)
  const pincodeRef = useRef(null)
  const address1Ref = useRef(null)
  const address2Ref = useRef(null)
  const statusRef = useRef(null)
  const submitRef = useRef(null)

  // Helper for keyboard navigation
  const focusNext = ref => {
    if (!ref.current) return
    // Focus the actual input element within the CustomTextField component
    const input = ref.current.querySelector('input') || ref.current.querySelector('textarea') || ref.current.querySelector('button') || ref.current
    input.focus()
  }

  // ------------------- Data Loading -------------------

  const loadRows = async () => {
    const allRows = await getAllRows()
    // Initial load: sort by ID descending (latest first)
    allRows.sort((a, b) => b.id - a.id)
    setRows(allRows)
  }

  useEffect(() => {
    loadRows()
  }, [])

  // ------------------- CRUD & Drawer Handlers -------------------

  const toggleDrawer = () => {
    setOpen(prev => !prev)
    setErrors({})
  }

  const handleAdd = () => {
    setIsEdit(false)
    setEditRow(null)
    setFormData({
      name: '',
      phone: '',
      email: '',
      city: '',
      state: '',
      pincode: '',
      address1: '',
      address2: '',
      status: 'Active'
    })
    setSelectedFile('')
    setErrors({})
    setOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  const handleEdit = row => {
    if (!row) return
    setIsEdit(true)
    setEditRow(row)
    setFormData(row)
    setSelectedFile(row.fileName || '')
    setErrors({})
    setOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  const handleDelete = async row => {
    setRows(prev => prev.filter(r => r.id !== row.id))
    await deleteRowFromDB(row.id)
  }

  // ------------------- Validation & Form Handlers -------------------

  const validateEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleNameChange = e => {
    const value = e.target.value.replace(/[^a-zA-Z\s]/g, '')
    setFormData(prev => ({ ...prev, name: value }))
    setErrors(prev => {
      const newErrors = { ...prev }
      if (!value) newErrors.name = 'Name is required'
      else delete newErrors.name
      return newErrors
    })
  }

  const handlePhoneChange = e => {
    let value = e.target.value.replace(/\D/g, '')
    const displayValue = value.slice(0, 10)
    setFormData(prev => ({ ...prev, phone: displayValue }))
    setErrors(prev => {
      const newErrors = { ...prev }
      if (displayValue.length !== 10) newErrors.phone = 'Phone must be 10 digits'
      else delete newErrors.phone
      return newErrors
    })
  }

  const handleEmailChange = e => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, email: value }))
    setErrors(prev => {
      const newErrors = { ...prev }
      if (!validateEmail(value)) newErrors.email = 'Invalid email'
      else delete newErrors.email
      return newErrors
    })
  }

  const handleGenericChange = e => {
    const { name, value } = e.target
    let processedValue = value

    if (name === 'city' || name === 'state') {
      processedValue = value.replace(/[^a-zA-Z\s]/g, '')
    } else if (name === 'pincode') {
      processedValue = value.replace(/\D/g, '').slice(0, 6)
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const tempErrors = {}

    // Re-run all required validations
    if (!formData.name) tempErrors.name = 'Name is required'
    if (!formData.phone || formData.phone.length !== 10) tempErrors.phone = 'Phone must be 10 digits'
    if (!formData.email || !validateEmail(formData.email)) tempErrors.email = 'Invalid email'

    setErrors(tempErrors)
    if (Object.keys(tempErrors).length > 0) return

    // Save the file name from state
    const rowData = { ...formData, fileName: selectedFile }

    let rowToSave
    if (isEdit && editRow) {
      rowToSave = { ...rowData, id: editRow.id }
      await addOrUpdateRow(rowToSave)
    } else {
      const newId = await initDB().then(db => db.add(storeName, rowData))
      rowToSave = { ...rowData, id: newId }
    }

    await loadRows()
    setSortField('id')
    setSortDirection('desc')

    toggleDrawer()
  }

  // ------------------- Key Navigation -------------------

  // Using Page A's handleKeyDown logic for refs
  const handleKeyDown = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      // Special case for multiline text areas (address1/address2)
      if (e.target.name === 'address1' || e.target.name === 'address2') {
        if (!e.shiftKey) { // Allows Shift+Enter for new line
          focusNext(nextRef)
        }
      } else {
        focusNext(nextRef)
      }
    }
  }


  // ------------------- File Upload Handlers -------------------

  const handleFileChange = e => {
    const file = e.target.files[0]
    if (file) setSelectedFile(file.name)
  }

  const handleFileDrop = e => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) setSelectedFile(file.name)
    setIsDragOver(false)
  }

  // ------------------- Export Handler -------------------

  const handleExport = () => {
    if (!rows.length) return
    // Export all fields from the data model, including file name, even if not shown in table
    const headers = ['ID', 'Name', 'Phone', 'Email', 'City', 'State', 'Pin Code', 'Address 1', 'Address 2', 'File Name', 'Status']
    const csvRows = rows.map(r =>
      [r.id, `"${r.name}"`, r.phone, r.email, `"${r.city}"`, `"${r.state}"`, r.pincode, `"${r.address1 || ''}"`, `"${r.address2 || ''}"`, r.fileName || '', r.status].join(',')
    )
    const csv = [headers.join(','), ...csvRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'employee.csv'
    a.click()
    URL.revokeObjectURL(url)
    setExportAnchorEl(null)
  }

  // ------------------- Sorting Logic -------------------

  const handleSort = field => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection(['id', 'phone', 'pincode'].includes(field) ? 'desc' : 'asc')
    }
    setPage(1)
  }

  const sortedRows = [...rows].sort((a, b) => {
    const aValue = a[sortField] || ''
    const bValue = b[sortField] || ''

    let comparison = 0
    const isNumeric = ['id', 'phone', 'pincode'].includes(sortField)

    if (isNumeric) {
      comparison = Number(String(aValue).replace(/\s/g, '')) - Number(String(bValue).replace(/\s/g, ''))
    } else {
      comparison = String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' })
    }

    return sortDirection === 'asc' ? comparison : comparison * -1
  })

  // ------------------- Filtering and Pagination -------------------

  const handleSearch = e => {
    setSearchText(e.target.value)
    setPage(1)
  }

  // Client-side filtering based on search text (optimized for all fields)
  const filteredRows = sortedRows.filter(row =>
    Object.values(row).some(val =>
      String(val || '')
        .toLowerCase()
        .includes(searchText.toLowerCase())
    )
  )

  // Client-side pagination logic
  const rowCount = filteredRows.length
  const pageCount = Math.max(1, Math.ceil(rowCount / pageSize))
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)
  const startIndex = rowCount === 0 ? 0 : (page - 1) * pageSize + 1
  const endIndex = Math.min(page * pageSize, rowCount)
  const paginationText = `Showing ${startIndex} to ${endIndex} of ${rowCount} entries`

  // Helper component to render the sort icon
  const SortIcon = ({ field }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 16, ml: 0.5 }} /> : <ArrowDownwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
  }

  // Define ALL columns for the table EXCEPT 'File Name'
  const tableColumns = [
    { label: 'Name', field: 'name', minWidth: '150px' },
    { label: 'Phone', field: 'phone', minWidth: '120px' },
    { label: 'Email', field: 'email', minWidth: '220px' },
    { label: 'City', field: 'city', minWidth: '120px' },
    { label: 'State', field: 'state', minWidth: '120px' },
    { label: 'Pin Code', field: 'pincode', minWidth: '100px' },
    { label: 'Address 1', field: 'address1', minWidth: '180px' },
    { label: 'Address 2', field: 'address2', minWidth: '180px' },
    { label: 'Status', field: 'status', minWidth: '100px' }
  ];

  // Total minimum width needed for the table (S.No + Action + all data columns)
  const totalMinWidth = 60 + 100 + tableColumns.reduce((sum, col) => sum + parseInt(col.minWidth), 0) + 'px';


  // ------------------- Render -------------------

  return (
    <Box>
      {/* Breadcrumb (Modified for Employee page) */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <Link href='/' style={{ color: '#7367F0', textDecoration: 'none', fontSize: 14 }}>
          Dashboard
        </Link>
        <Typography sx={{ mx: 1, color: 'text.secondary' }}>/</Typography>
        <Typography variant='body2' sx={{ fontSize: 14 }}>
          Employee
        </Typography>
      </Box>

      <Card sx={{ p: 6 }}>
        {/* Header + actions (From Page A) */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant='h6'>Employee List</Typography>

          <Box display='flex' gap={1}>
            <Button
              variant='outlined'
              endIcon={<ArrowDropDownIcon />}
              onClick={e => setExportAnchorEl(e.currentTarget)}
            >
              Export
            </Button>
            <Button variant='contained' startIcon={<AddIcon />} onClick={handleAdd}>
              Add Employee
            </Button>
            {/* Export Menu (Like Page A) */}
             <Menu anchorEl={exportAnchorEl} open={exportOpen} onClose={() => setExportAnchorEl(null)}>
                <MenuItem onClick={handleExport}>Download CSV</MenuItem>
              </Menu>
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

        {/* Table (Manual HTML Table from Page A, adjusted to exclude File Name) */}
        <Box sx={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              tableLayout: 'fixed', // Fixed layout from Page A
              minWidth: totalMinWidth // Ensures all visible columns fit
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

                {/* Dynamic Data Columns (9 fields) */}
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
                  {/* Data Cells (9 fields) */}
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.name}</td>
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.phone}</td>
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.email}</td>
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.city}</td>
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.state}</td>
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.pincode}</td>
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.address1}</td>
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.address2}</td>
                  {/* Status Badge (From Page A) */}
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
      <Drawer anchor='right' open={open} onClose={toggleDrawer}>
        <Box sx={{ width: 360, p: 3 }}> {/* Width 360px from Page A */}
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6'>{isEdit ? 'Edit Employee' : 'Add Employee'}</Typography>
            <IconButton onClick={toggleDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>

          <form onSubmit={handleSubmit}>
            {/* Name, Phone, Email (Mandatory fields with validation) */}
            <CustomTextField
              fullWidth margin='normal' label={<span>Name <span style={{ color: 'red' }}>*</span></span>}
              name='name' value={formData.name} onChange={handleNameChange} inputRef={nameRef}
              inputProps={{ onKeyDown: e => handleKeyDown(e, phoneRef) }}
              error={!!errors.name} helperText={errors.name}
            />
            <CustomTextField
              fullWidth margin='normal' label={<span>Phone <span style={{ color: 'red' }}>*</span></span>}
              name='phone' value={formData.phone} onChange={handlePhoneChange} inputRef={phoneRef}
              inputProps={{ onKeyDown: e => handleKeyDown(e, emailRef) }}
              error={!!errors.phone} helperText={errors.phone}
            />
            <CustomTextField
              fullWidth margin='normal' label={<span>Email <span style={{ color: 'red' }}>*</span></span>}
              name='email' value={formData.email} onChange={handleEmailChange} inputRef={emailRef}
              inputProps={{ onKeyDown: e => handleKeyDown(e, cityRef) }}
              error={!!errors.email} helperText={errors.email}
            />

            {/* City, State, Pin Code */}
            <CustomTextField
              fullWidth margin='normal' label='City' name='city' value={formData.city} onChange={handleGenericChange} inputRef={cityRef}
              inputProps={{ onKeyDown: e => handleKeyDown(e, stateRef) }}
            />
            <CustomTextField
              fullWidth margin='normal' label='State' name='state' value={formData.state} onChange={handleGenericChange} inputRef={stateRef}
              inputProps={{ onKeyDown: e => handleKeyDown(e, pincodeRef) }}
            />
            <CustomTextField
              fullWidth margin='normal' label='Pin Code' name='pincode' value={formData.pincode} onChange={handleGenericChange} inputRef={pincodeRef}
              inputProps={{ onKeyDown: e => handleKeyDown(e, address1Ref) }}
            />

            {/* Address (using multiline/rows from Page A's description field) */}
            <CustomTextField
              fullWidth margin='normal' label='Address 1' name='address1' multiline rows={3} value={formData.address1} onChange={handleGenericChange} inputRef={address1Ref}
              inputProps={{ onKeyDown: e => handleKeyDown(e, address2Ref) }}
            />
            <CustomTextField
              fullWidth margin='normal' label='Address 2' name='address2' multiline rows={3} value={formData.address2} onChange={handleGenericChange} inputRef={address2Ref}
              inputProps={{ onKeyDown: e => {
                 if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); isEdit ? focusNext(statusRef) : focusNext(submitRef) }
              }}}
            />

            {/* File Upload (Retained as is, but not shown in table) */}
            <Box mt={2} mb={isEdit ? 0 : 3}>
              {/* Hidden input to trigger file selection */}
              <input type='file' ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
              <Typography variant="caption" display="block" color="text.secondary" mb={0.5}>Upload File</Typography>

              <Button
                variant='outlined'
                fullWidth
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleFileDrop}
                sx={{
                  borderColor: isDragOver ? 'primary.main' : 'divider',
                  borderStyle: 'solid',
                  borderWidth: 1,
                  justifyContent: 'space-between',
                  py: 1.5,
                  textTransform: 'none',
                  backgroundColor: isDragOver ? 'action.hover' : 'transparent',
                }}
              >
                <Typography sx={{ color: selectedFile ? 'text.primary' : 'text.disabled', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80%' }}>
                  {selectedFile || 'Choose File or Drag & Drop Here'}
                </Typography>
                <Typography variant='body2' color='primary' sx={{ whiteSpace: 'nowrap' }}>
                  Browse
                </Typography>
              </Button>
            </Box>


            {/* Status (Only in edit mode, using CustomTextField select like Page A) */}
            {isEdit && (
              <CustomTextField
                select
                fullWidth
                margin='normal'
                label='Status'
                name='status'
                value={formData.status}
                onChange={handleGenericChange}
                inputRef={statusRef}
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

            {/* Submit Buttons */}
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
