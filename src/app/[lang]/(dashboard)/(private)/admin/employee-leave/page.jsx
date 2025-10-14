
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
  Card,
  Divider,
  FormControl,
  Select,
  Pagination,
  Menu,
  Autocomplete // 💡 ADDED Autocomplete
} from '@mui/material'

// Icons
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import { MdDelete } from 'react-icons/md'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'

// Components (Assuming these are available in the runtime environment)
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import Link from 'next/link'

// --- IndexedDB Configuration ---
const DB_NAME = 'employee_leave_db'
const STORE_NAME = 'leaves'

const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

// 💡 Default/Permanent leave types
const DEFAULT_LEAVE_OPTIONS = [
  'Annual Leave',
  'Sick Leave',
  'Casual Leave',
  'Maternity Leave',
  'Paternity Leave'
]

// --- Main Component ---
export default function EmployeeLeavePage() {
  // --- State ---
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(1) // 1-based page number
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')

  const [open, setOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editRow, setEditRow] = useState(null)

  const [formData, setFormData] = useState({
    employee: '',
    supervisor: '',
    leaveType: '',
    fromDate: new Date(),
    toDate: new Date(),
    status: 'Pending'
  })

  const [dateError, setDateError] = useState('')
  const [sortField, setSortField] = useState('id')
  const [sortDirection, setSortDirection] = useState('desc')
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const exportOpen = Boolean(exportAnchorEl)

  // 💡 Merge default options with unique existing leave types for Autocomplete options
  const existingLeaveTypes = rows.map(row => row.leaveType).filter(Boolean)
  const leaveTypeOptions = Array.from(new Set([...DEFAULT_LEAVE_OPTIONS, ...existingLeaveTypes]))

  // --- Refs for keyboard navigation ---
  const employeeRef = useRef(null)
  const supervisorRef = useRef(null)
  const leaveTypeRef = useRef(null) // Ref for Autocomplete
  const fromDateRef = useRef(null)
  const toDateRef = useRef(null)
  const statusRef = useRef(null)
  const submitRef = useRef(null)

  // --- Data & Initialization ---

  const loadRows = async () => {
    const db = await initDB()
    const allRows = await db.getAll(STORE_NAME)
    setRows(allRows)
  }

  useEffect(() => {
    loadRows()
  }, [])

  // --- Handlers ---

  const toggleDrawer = () => setOpen(prev => !prev)

  const handleAdd = () => {
    setIsEdit(false)
    setEditRow(null)
    setFormData({
      employee: '',
      supervisor: '',
      leaveType: '',
      fromDate: new Date(),
      toDate: new Date(),
      status: 'Pending'
    })
    setDateError('')
    setOpen(true)
    setTimeout(() => {
      focusNext(employeeRef)
    }, 100)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setEditRow(row)
    // Convert date string/number from DB back to Date object for the picker
    setFormData({
      ...row,
      fromDate: row.fromDate ? new Date(row.fromDate) : new Date(),
      toDate: row.toDate ? new Date(row.toDate) : new Date()
    })
    setDateError('')
    setOpen(true)
    setTimeout(() => {
      focusNext(employeeRef)
    }, 100)
  }

  const handleDelete = async row => {
    const db = await initDB()
    await db.delete(STORE_NAME, row.id)
    await loadRows()
  }

  const handleChange = e => {
    const { name, value } = e.target
    // Basic cleanup for names, allowing only letters and spaces
    const cleanedValue = ['employee', 'supervisor'].includes(name) ? value.replace(/[^a-zA-Z\s]/g, '') : value
    setFormData(prev => ({ ...prev, [name]: cleanedValue }))
  }

  const handleDateChange = (date, fieldName, otherDate) => {
    setFormData(prev => ({ ...prev, [fieldName]: date }))

    const from = fieldName === 'fromDate' ? date : otherDate
    const to = fieldName === 'toDate' ? date : otherDate

    if (from && to && new Date(from).getTime() > new Date(to).getTime()) {
      setDateError('From Date cannot be later than To Date!')
    } else {
      setDateError('')
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    // 💡 Validation: Ensure leaveType is set (which now must be from options)
    if (!formData.employee || !formData.leaveType || !leaveTypeOptions.includes(formData.leaveType)) return
    if (dateError) return

    const db = await initDB()

    // Ensure dates are stored as timestamp numbers for IndexedDB compatibility
    const dataToSave = {
      ...formData,
      fromDate: formData.fromDate.getTime(),
      toDate: formData.toDate.getTime()
    }

    if (isEdit && editRow) {
      await db.put(STORE_NAME, { ...dataToSave, id: editRow.id })
    } else {
      await db.add(STORE_NAME, dataToSave)
    }

    // Reset sort to see the new entry easily
    setSortField('id')
    setSortDirection('desc')
    await loadRows()
    toggleDrawer()
  }

  const handleSearch = e => {
    setSearch(e.target.value)
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
    const headers = ['ID', 'Employee', 'Supervisor', 'Leave Type', 'From Date & Time', 'To Date & Time', 'Status']
    const csvRows = rows.map(r =>
      [
        r.id,
        `"${r.employee}"`,
        `"${r.supervisor}"`,
        `"${r.leaveType}"`,
        `"${new Date(r.fromDate).toLocaleString()}"`,
        `"${new Date(r.toDate).toLocaleString()}"`,
        r.status
      ].join(',')
    )
    const csv = [headers.join(','), ...csvRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'employee_leaves.csv'
    a.click()
    URL.revokeObjectURL(url)
    setExportAnchorEl(null)
  }

  // Helper for keyboard navigation (Tab/Enter)
  const focusNext = ref => {
    if (!ref.current) return
    // Targets the native input element within the CustomTextField/Autocomplete
    const element = ref.current.querySelector('input') || ref.current
    element.focus()
  }

  const handleKeyPress = (e, currentField) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (currentField === 'employee') focusNext(supervisorRef)
      else if (currentField === 'supervisor') focusNext(leaveTypeRef)
      // For Autocomplete ('leaveType'), navigation to 'fromDate' is handled by the Autocomplete's props below
      else submitRef.current?.focus()
    }
  }

  // --- Data Processing (Sort -> Filter -> Paginate) ---

  const sortedRows = [...rows].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]

    let comparison = 0
    if (sortField === 'id' || sortField === 'fromDate' || sortField === 'toDate') {
      // Numerical/Date comparison (Date objects or timestamps)
      comparison = new Date(aValue).getTime() - new Date(bValue).getTime()
    } else {
      // String comparison
      comparison = String(aValue || '').localeCompare(String(bValue || ''), undefined, { sensitivity: 'base' })
    }

    return sortDirection === 'asc' ? comparison : comparison * -1
  })

  const filteredRows = sortedRows.filter(
    row =>
      row.employee.toLowerCase().includes(search.toLowerCase()) ||
      row.supervisor.toLowerCase().includes(search.toLowerCase()) ||
      row.leaveType.toLowerCase().includes(search.toLowerCase()) ||
      row.status.toLowerCase().includes(search.toLowerCase())
  )

  const rowCount = filteredRows.length
  const pageCount = Math.max(1, Math.ceil(rowCount / pageSize))
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)
  const startIndex = rowCount === 0 ? 0 : (page - 1) * pageSize + 1
  const endIndex = Math.min(page * pageSize, rowCount)
  const paginationText = `Showing ${startIndex} to ${endIndex} of ${rowCount} entries`

  const tableColumns = [
    { label: 'Employee', field: 'employee', minWidth: '150px' },
    { label: 'Supervisor', field: 'supervisor', minWidth: '150px' },
    { label: 'Leave Type', field: 'leaveType', minWidth: '120px' },
    { label: 'From Date & Time', field: 'fromDate', minWidth: '180px', isDate: true },
    { label: 'To Date & Time', field: 'toDate', minWidth: '180px', isDate: true },
    { label: 'Status', field: 'status', minWidth: '100px' }
  ]
  const totalMinWidth =
    60 + 100 + tableColumns.reduce((sum, col) => sum + parseInt(col.minWidth), 0) + 'px'

  // Helper component to render the sort icon
  const SortIcon = ({ field }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <ArrowUpwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
    ) : (
      <ArrowDownwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
    )
  }

  // --- JSX Rendering ---

  return (
    <Box>
      {/* Breadcrumb (Matching Page A) */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <Link href='/' style={{ color: '#7367F0', textDecoration: 'none', fontSize: 14 }}>
          Dashboard
        </Link>
        <Typography sx={{ mx: 1, color: 'text.secondary' }}>/</Typography>
        <Typography variant='body2' sx={{ fontSize: 14 }}>
          Employee Leaves
        </Typography>
      </Box>

      <Card sx={{ p: 6 }}>
        {/* Header + actions (Matching Page A) */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant='h6'>Employee Leave Requests</Typography>

          <Box display='flex' gap={1}>
            <Button
              variant='outlined'
              endIcon={<ArrowDropDownIcon />}
              onClick={e => setExportAnchorEl(e.currentTarget)}
            >
              Export
            </Button>
            <Button variant='contained' startIcon={<AddIcon />} onClick={handleAdd}>
              Add Leave
            </Button>
            {/* Export Menu */}
            <Menu anchorEl={exportAnchorEl} open={exportOpen} onClose={() => setExportAnchorEl(null)}>
              <MenuItem onClick={handleExport}>Download CSV</MenuItem>
            </Menu>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Search / entries (Matching Page A) */}
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
            placeholder='Search All Fields...'
            value={search}
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
              minWidth: totalMinWidth
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
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.employee}</td>
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.supervisor}</td>
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.leaveType}</td>
                  {/* Date Formatting */}
                  <td style={{ padding: '12px' }}>{new Date(r.fromDate).toLocaleString()}</td>
                  <td style={{ padding: '12px' }}>{new Date(r.toDate).toLocaleString()}</td>
                  {/* Status Badge */}
                  <td style={{ padding: '12px' }}>
                    <Box
                      component='span'
                      sx={{
                        fontWeight: 600,
                        color: '#fff',
                        backgroundColor:
                          r.status === 'Approved'
                            ? 'success.main'
                            : r.status === 'Pending'
                            ? 'warning.main'
                            : 'error.main',
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
              <Typography color='text.secondary'>No leave requests found</Typography>
            </Box>
          )}
        </Box>

        {/* Pagination (Matching Page A) */}
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

      {/* Drawer Form */}
      <Drawer anchor='right' open={open} onClose={toggleDrawer}>
        <Box sx={{ width: 400, p: 3 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6'>{isEdit ? 'Edit Leave Request' : 'Add Leave Request'}</Typography>
            <IconButton onClick={toggleDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>

          <form onSubmit={handleSubmit}>
            {/* Employee TextField (Kept as is) */}
            <CustomTextField
              fullWidth
              margin='normal'
              label={<span>Employee <span style={{ color: 'red' }}>*</span></span>}
              name='employee'
              value={formData.employee}
              onChange={handleChange}
              inputRef={employeeRef}
              inputProps={{ onKeyDown: e => handleKeyPress(e, 'employee') }}
            />
            {/* Supervisor TextField (Kept as is) */}
            <CustomTextField
              fullWidth
              margin='normal'
              label='Supervisor'
              name='supervisor'
              value={formData.supervisor}
              onChange={handleChange}
              inputRef={supervisorRef}
              inputProps={{ onKeyDown: e => handleKeyPress(e, 'supervisor') }}
            />
            {/* Leave Type Autocomplete (New Component) */}
            <Autocomplete
              // 💡 UPDATED: Set to false to restrict input to options only.
              freeSolo={false}
              options={leaveTypeOptions}
              value={formData.leaveType || ''}
              onChange={(e, newValue) => {
                // newValue will be null if user clears the field or if a non-option value is typed and then focus moves away.
                // Apply the cleanup logic here on selection/change
                const cleanedValue = (newValue || '').replace(/[^a-zA-Z\s]/g, '')
                setFormData(prev => ({ ...prev, leaveType: cleanedValue }))

                // Move focus to next field (From Date Picker) only if a valid option is selected
                if (cleanedValue && leaveTypeOptions.includes(cleanedValue)) {
                  setTimeout(() => {
                    const nextFieldInput = document.querySelector('[name="fromDate"] input')
                    nextFieldInput?.focus()
                  }, 50)
                }
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  // Move focus to next field (From Date Picker) only if the current value is a valid option
                  if (leaveTypeOptions.includes(formData.leaveType)) {
                    const nextFieldInput = document.querySelector('[name="fromDate"] input')
                    nextFieldInput?.focus()
                  }
                }
              }}
              openOnFocus
              renderInput={params => (
                <CustomTextField
                  {...params}
                  fullWidth
                  margin='normal'
                  label={<span>Leave Type <span style={{ color: 'red' }}>*</span></span>}
                  name='leaveType'
                  inputRef={leaveTypeRef} // Pass ref to CustomTextField for focus management
                  // Use params.inputProps.onChange to handle user typing for filtering
                  inputProps={{
                    ...params.inputProps,
                    // Keep the Autocomplete text input value updated for filtering
                    onChange: e => {
                      // Autocomplete handles the list filtering internally.
                      // We just ensure the ref-passed props are maintained.
                      if (params.inputProps.onChange) {
                        params.inputProps.onChange(e)
                      }
                      // You might want to update the state as the user types,
                      // but since freeSolo is false, the value only matters upon selection.
                    }
                  }}
                />
              )}
            />

            {/* From Date Picker */}
            <AppReactDatepicker
              showTimeSelect
              timeIntervals={15}
              selected={formData.fromDate}
              onChange={date => handleDateChange(date, 'fromDate', formData.toDate)}
              dateFormat='dd/MM/yyyy h:mm aa'
              customInput={
                <CustomTextField
                  fullWidth
                  margin='normal'
                  label='From Date & Time'
                  name='fromDate' // Added name for query selection in focus logic
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <CalendarTodayIcon />
                      </InputAdornment>
                    )
                  }}
                  inputRef={fromDateRef}
                />
              }
            />

            {/* To Date Picker */}
            <AppReactDatepicker
              showTimeSelect
              timeIntervals={15}
              selected={formData.toDate}
              onChange={date => handleDateChange(date, 'toDate', formData.fromDate)}
              dateFormat='dd/MM/yyyy h:mm aa'
              customInput={
                <CustomTextField
                  fullWidth
                  margin='normal'
                  label='To Date & Time'
                  name='toDate' // Added name for query selection
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <CalendarTodayIcon />
                      </InputAdornment>
                    )
                  }}
                  inputRef={toDateRef}
                />
              }
            />

            {dateError && (
              <Typography variant='body2' sx={{ mt: 1, color: 'error.main', fontWeight: 500 }}>
                {dateError}
              </Typography>
            )}

            {/* Status dropdown ONLY when editing */}
            {isEdit && (
              <CustomTextField
                select
                fullWidth
                margin='normal'
                label='Status'
                name='status'
                value={formData.status ?? 'Pending'}
                onChange={handleChange}
                inputRef={statusRef}
                inputProps={{ onKeyDown: e => handleKeyPress(e, 'status') }}
              >
                <MenuItem value='Pending'>Pending</MenuItem>
                <MenuItem value='Approved'>Approved</MenuItem>
                <MenuItem value='Rejected'>Rejected</MenuItem>
              </CustomTextField>
            )}

            <Box mt={3} display='flex' gap={2}>
              <Button type='submit' variant='contained' fullWidth ref={submitRef} disabled={!!dateError}>
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
