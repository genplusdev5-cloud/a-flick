'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { openDB } from 'idb'
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  InputAdornment,
  IconButton,
  Autocomplete,
  FormControl, // Added for rowsPerPage Select
  Select, // Added for rowsPerPage Select
  MenuItem, // Used in Select and Status rendering
  Pagination, // Added for Pagination component
  Divider // Added for card layout
} from '@mui/material'

// Icons
import SearchIcon from '@mui/icons-material/Search'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward' // For sorting up
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward' // For sorting down

// Components
import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import { format } from 'date-fns'

// ----------------------------------------------------
const DB_NAME = 'material_request_db'
const STORE_NAME = 'requests'

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

const loadRequestsFromDB = async () => {
  const db = await initDB()
  if (db.objectStoreNames.contains(STORE_NAME)) {
    // Original data load sorted by ID descending
    const allItems = await db.getAll(STORE_NAME)
    return allItems.sort((a, b) => b.id - a.id)
  }
  return []
}

const deleteRequestFromDB = async id => {
  const db = await initDB()
  const numericId = Number(id)
  await db.delete(STORE_NAME, numericId)
}
// ----------------------------------------------------

// Helper component to render the sort icon (Copied from Page A design)
const SortIcon = ({ field, sortField, sortDirection }) => {
  if (sortField !== field) return null
  return sortDirection === 'asc' ? (
    <ArrowUpwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
  ) : (
    <ArrowDownwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
  )
}

export default function MaterialRequestPage() {
  const router = useRouter()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  // Filtering states (Retained from original component)
  const [searchText, setSearchText] = useState('')
  const [dateFilter, setDateFilter] = useState(new Date())
  const [filterByDate, setFilterByDate] = useState(false)
  const [requestStatus, setRequestStatus] = useState('')
  const [fromLocation, setFromLocation] = useState('')
  const [toLocation, setToLocation] = useState('')
  const [requestedBy, setRequestedBy] = useState('')

  // Pagination states (Updated to 1-based index from Page A design)
  const [page, setPage] = useState(1) // Changed from 0 to 1
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Sorting states (New from Page A design)
  const [sortField, setSortField] = useState('requestDate') // Default sort field
  const [sortDirection, setSortDirection] = useState('desc') // Default sort direction

  // Refs and Autocomplete state (Retained)
  const requestStatusRef = useRef(null)
  const fromLocationRef = useRef(null)
  const toLocationRef = useRef(null)
  const requestedByRef = useRef(null)

  const [requestStatusOpen, setRequestStatusOpen] = useState(false)
  const [fromLocationOpen, setFromLocationOpen] = useState(false)
  const [toLocationOpen, setToLocationOpen] = useState(false)
  const [requestedByOpen, setRequestedByOpen] = useState(false)

  // --- Handlers ---
  const handleRefreshTable = async () => {
    setLoading(true)
    const data = await loadRequestsFromDB()
    setRows(data)
    setLoading(false)
    setPage(1) // Reset page to 1
  }

  useEffect(() => {
    handleRefreshTable()
  }, [])

  const handleDelete = async row => {
    await deleteRequestFromDB(row.id)
    handleRefreshTable()
  }

  const handleEdit = row => {
    router.push(`/admin/stock/material-request/${row.id}/edit`)
  }

  // --- Sorting Logic (from Page A design) ---
  const handleSort = field => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setPage(1) // Reset to first page on sort change
  }

  // --- Filtering & Sorting & Pagination Logic ---

  const handleSearch = e => {
    setSearchText(e.target.value)
    setPage(1) // Reset page on search change
  }

  // 1. Filtering Logic (Retained from original)
  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      const rowNo = row.requestNo || `REQ-${row.id}`
      const matchesSearch = rowNo.toLowerCase().includes(searchText.toLowerCase())

      const matchesStatus = !requestStatus || (row.status || 'Pending') === requestStatus
      const matchesFrom = !fromLocation || row.fromLocation === fromLocation
      const matchesTo = !toLocation || row.toLocation === toLocation
      const matchesRequestedBy = !requestedBy || row.requestedBy === requestedBy

      let matchesDate = true
      if (filterByDate) {
        const rowDate = new Date(row.requestDate)
        if (!isNaN(rowDate.getTime())) {
          matchesDate =
            rowDate.getFullYear() === dateFilter.getFullYear() &&
            rowDate.getMonth() === dateFilter.getMonth() &&
            rowDate.getDate() === dateFilter.getDate()
        } else {
          matchesDate = false
        }
      }
      return matchesSearch && matchesStatus && matchesFrom && matchesTo && matchesRequestedBy && matchesDate
    })
  }, [rows, searchText, requestStatus, fromLocation, toLocation, requestedBy, filterByDate, dateFilter])

  // 2. Sorting Logic (New for client-side sorting)
  const sortedFilteredRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      const aValue = a[sortField] || ''
      const bValue = b[sortField] || ''

      let comparison = 0
      if (['id'].includes(sortField)) {
        comparison = Number(aValue) - Number(bValue)
      } else if (['requestDate'].includes(sortField)) {
        // Handle date sorting
        const aDate = new Date(aValue)
        const bDate = new Date(bValue)
        comparison = aDate.getTime() - bDate.getTime()
      } else {
        // String comparison for requestType, fromLocation, etc.
        comparison = String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' })
      }

      // Apply the sort direction
      return sortDirection === 'asc' ? comparison : comparison * -1
    })
  }, [filteredRows, sortField, sortDirection])

  // 3. Pagination Logic (Updated for 1-based page)
  const rowCount = sortedFilteredRows.length
  const pageCount = Math.max(1, Math.ceil(rowCount / rowsPerPage))
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage
    const end = page * rowsPerPage
    return sortedFilteredRows.slice(start, end)
  }, [sortedFilteredRows, page, rowsPerPage])

  const startIndex = rowCount === 0 ? 0 : (page - 1) * rowsPerPage + 1
  const endIndex = Math.min(page * rowsPerPage, rowCount)
  const paginationText = `Showing ${startIndex} to ${endIndex} of ${rowCount} entries`

  const handleChangePage = (event, newPage) => setPage(newPage) // newPage is 1-based
  const handleChangeRowsPerPage = event => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(1) // Reset page to 1
  }

  // --- Autocomplete/Ref Logic (Retained from original) ---
  const focusNextInput = (currentRef, nextRef) => {
    // ... existing logic ...
    if (nextRef && nextRef.current) {
      setTimeout(() => {
        const inputElement = nextRef.current.querySelector('input')
        if (inputElement) {
          inputElement.focus()
        }
      }, 50)
    }
  }

  const handleRequestStatusChange = (e, newValue) => {
    setRequestStatus(newValue || '')
    setPage(1) // Filter change resets page
    if (newValue) focusNextInput(requestStatusRef, fromLocationRef)
  }

  const handleFromLocationChange = (e, newValue) => {
    setFromLocation(newValue || '')
    setPage(1)
    if (newValue) focusNextInput(fromLocationRef, toLocationRef)
  }

  const handleToLocationChange = (e, newValue) => {
    setToLocation(newValue || '')
    setPage(1)
    if (newValue) focusNextInput(toLocationRef, requestedByRef)
  }

  const handleRequestedByChange = (e, newValue) => {
    setRequestedBy(newValue || '')
    setPage(1)
  }

  // --- Cell Value/Style Helpers (Mapped from original DataGrid columns) ---

  const getStatusStyle = statusValue => {
    let bgColor
    switch (statusValue) {
      case 'Completed':
        bgColor = '#4caf50'
        break
      case 'Pending':
        bgColor = '#ff9800'
        break
      case 'Issued':
        bgColor = '#2196f3'
        break
      case 'Approved':
        bgColor = '#8bc34a'
        break
      case 'Declined':
      case 'Rejected':
        bgColor = '#f44336'
        break
      default:
        bgColor = '#9e9e9e' // Waiting
        break
    }
    return bgColor
  }

  const renderStatusPill = statusValue => {
    const bgColor = getStatusStyle(statusValue)
    return (
      <Button
        size='small'
        variant='contained'
        sx={{
          backgroundColor: bgColor,
          color: '#fff',
          borderRadius: '20px',
          textTransform: 'none',
          fontWeight: 500,
          minWidth: 90,
          '&:hover': { backgroundColor: bgColor }
        }}
      >
        {statusValue}
      </Button>
    )
  }

  const getRequestNo = row => row.requestNo || `REQ-${row.id}`

  const getFormattedDate = dateValue => {
    const date = new Date(dateValue)
    return !isNaN(date.getTime()) ? format(date, 'dd/MM/yyyy') : ''
  }

  const getApprovalStatus = row => {
    const status = row.approvedStatus || row.status || 'Pending'
    if (status === 'Approved') return 'Approved'
    if (['Rejected', 'Declined'].includes(status)) return 'Rejected'
    return 'Pending'
  }

  const getIssuedStatus = row => {
    const status = row.issuedStatus || row.status || 'Pending'
    if (status === 'Issued') return 'Issued'
    if (status === 'Pending') return 'Pending'
    return 'Not Issued'
  }

  const getCompletedStatus = row => (row.completedStatus === 'Yes' ? 'Yes' : 'No')

  // --- Render ---
  return (
    <ContentLayout
      title='Material Request'
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Material Request' }]}
      actions={
        <Button variant='contained' onClick={() => router.push('/admin/stock/material-request/add')} sx={{ m: 2 }}>
          Add Request
        </Button>
      }
    >
      {/* Filtering Card (Design Retained from original, it's already a Card design) */}
      <Card sx={{ mb: 4, boxShadow: 'none' }} elevation={0}>
        <CardContent>
          <Grid container spacing={6}>
            {/* ... Date Filter and Autocomplete fields retained here ... */}
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box display='flex' alignItems='center' gap={0.5} sx={{ pl: 0.5, position: 'relative' }}>
                  <input
                    type='checkbox'
                    checked={filterByDate}
                    onChange={e => setFilterByDate(e.target.checked)}
                    id='dateFilterCheck'
                    style={{
                      width: '18px',
                      height: '18px',
                      appearance: 'none',
                      border: `1px solid ${filterByDate ? '#7D70F7' : '#999'}`,
                      borderRadius: '1px',
                      cursor: 'pointer',
                      outline: 'none',
                      backgroundColor: filterByDate ? '#7D70F7' : 'white'
                    }}
                  />
                  {filterByDate && (
                    <Box
                      component='span'
                      sx={{
                        position: 'absolute',
                        width: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none'
                      }}
                    >
                      <Typography component='span' sx={{ color: 'white', fontSize: '12px', top: '-1px' }}>
                        &#10003;
                      </Typography>
                    </Box>
                  )}
                  <label
                    htmlFor='dateFilterCheck'
                    style={{ cursor: 'pointer', fontWeight: 500, color: filterByDate ? '#7D70F7' : '#666' }}
                  >
                    Date Filter
                  </label>
                </Box>

                <AppReactDatepicker
                  selected={dateFilter}
                  onChange={date => setDateFilter(date)}
                  placeholderText='Select Start Date'
                  dateFormat='dd/MM/yyyy'
                  customInput={
                    <CustomTextField
                      fullWidth
                      inputProps={{
                        disabled: !filterByDate,
                        sx: { backgroundColor: !filterByDate ? '#f3f4f6' : 'white' }
                      }}
                    />
                  }
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Autocomplete
                freeSolo={false}
                options={['Waiting', 'Pending', 'Rejected', 'Approved', 'Issued', 'Completed', 'Declined']}
                value={requestStatus}
                onChange={handleRequestStatusChange}
                open={requestStatusOpen}
                onOpen={() => setRequestStatusOpen(true)}
                onClose={() => setRequestStatusOpen(false)}
                onFocus={() => setRequestStatusOpen(true)}
                ref={requestStatusRef}
                renderInput={params => <CustomTextField {...params} fullWidth label='Request Status' />}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Autocomplete
                freeSolo={false}
                options={['Stock-TECH STOCK 1', 'Supplier-ABC']}
                value={fromLocation}
                onChange={handleFromLocationChange}
                open={fromLocationOpen}
                onOpen={() => setFromLocationOpen(true)}
                onClose={() => setFromLocationOpen(false)}
                onFocus={() => setFromLocationOpen(true)}
                ref={fromLocationRef}
                renderInput={params => <CustomTextField {...params} fullWidth label='From Location/Supplier' />}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Autocomplete
                freeSolo={false}
                options={['Stock-TECH STOCK 1', 'Stock-TECH STOCK 2']}
                value={toLocation}
                onChange={handleToLocationChange}
                open={toLocationOpen}
                onOpen={() => setToLocationOpen(true)}
                onClose={() => setToLocationOpen(false)}
                onFocus={() => setToLocationOpen(true)}
                ref={toLocationRef}
                renderInput={params => <CustomTextField {...params} fullWidth label='To Location/Supplier' />}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Autocomplete
                freeSolo={false}
                options={['Admin', 'Tech']}
                value={requestedBy}
                onChange={handleRequestedByChange}
                open={requestedByOpen}
                onOpen={() => setRequestedByOpen(true)}
                onClose={() => setRequestedByOpen(false)}
                onFocus={() => setRequestedByOpen(true)}
                ref={requestedByRef}
                renderInput={params => <CustomTextField {...params} fullWidth label='Requested By' />}
              />
            </Grid>

            <Grid item xs={12} md={4} display='flex' gap={2} sx={{ mt: 5 }}>
              <Button
                size='small'
                variant='contained'
                sx={{ backgroundColor: '#7D70F7', '&:hover': { backgroundColor: '#5D4CEF' }, paddingY: '10px' }}
                onClick={handleRefreshTable}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* List Card (New Card layout from Page A design) */}
      <Card sx={{ p: 6, boxShadow: 'none' }}>
        {/* Header/Actions (Modified to include rowsPerPage Select from Page A) */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          {/* Rows Per Page Select (from Page A design) */}
          <FormControl size='small' sx={{ minWidth: 120 }}>
            <Select
              value={rowsPerPage}
              onChange={handleChangeRowsPerPage} // Already updates rowsPerPage and resets page to 1
            >
              {[10, 25, 50, 100].map(i => (
                <MenuItem key={i} value={i}>
                  {i} entries
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* Search Field and Export Buttons (Retained from original component) */}
          <Box display='flex' alignItems='center' gap={3}>
            <Box display='flex' gap={1}>
              {['Copy', 'CSV', 'Excel', 'PDF', 'Print'].map(btn => (
                <Button
                  key={btn}
                  variant='contained'
                  size='small'
                  // Placeholder action - replace with actual export logic if needed
                  onClick={() => alert(`Export as ${btn}`)}
                  sx={{
                    borderRadius: '0px',
                    backgroundColor: '#6c7783',
                    color: '#ffffff',
                    textTransform: 'none',
                    '&:hover': { backgroundColor: '#5a626a' },
                    paddingY: '10px',
                    lineHeight: 1
                  }}
                >
                  {btn}
                </Button>
              ))}
            </Box>
            <CustomTextField
              size='small'
              placeholder='Search by Request No...'
              value={searchText}
              onChange={handleSearch}
              sx={{ width: 280 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Manual HTML Table (from Page A design) */}
        <Box sx={{ overflowX: 'auto', minHeight: loading ? 100 : 'auto' }}>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 5 }}>
              <Typography color='text.secondary'>Loading requests...</Typography>
            </Box>
          ) : (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                tableLayout: 'auto' // Use auto for better column sizing with many columns
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

                  {/* Column Headers with Sorting */}
                  {[
                    { field: 'requestType', label: 'Request Type', width: '150px' },
                    { field: 'requestNo', label: 'Request No', width: '150px' },
                    { field: 'requestDate', label: 'Request Date', width: '150px' },
                    { field: 'fromLocation', label: 'From Location/Supplier', width: '200px' },
                    { field: 'toLocation', label: 'To Location/Supplier', width: '200px' },
                    { field: 'requestedBy', label: 'Requested By', width: '150px' },
                    { field: 'isApproved', label: 'Is Approved', width: '120px', sortable: false },
                    { field: 'isIssued', label: 'Is Issued', width: '120px', sortable: false },
                    { field: 'isCompleted', label: 'Is Completed', width: '120px', sortable: false },
                    { field: 'remarks', label: 'Remarks', width: '200px', sortable: false },
                    { field: 'status', label: 'Request Status', width: '150px' }
                  ].map(col => (
                    <th
                      key={col.field}
                      onClick={() => col.sortable !== false && handleSort(col.field)}
                      style={{
                        padding: '12px',
                        width: col.width,
                        cursor: col.sortable !== false ? 'pointer' : 'default',
                        userSelect: 'none'
                      }}
                    >
                      <Box display='flex' alignItems='center'>
                        {col.label}
                        {col.sortable !== false && (
                          <SortIcon field={col.field} sortField={sortField} sortDirection={sortDirection} />
                        )}
                      </Box>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {paginatedRows.map((r, i) => {
                  // Find the index in the *sorted and filtered* list to get the correct S.No
                  const snoIndex = sortedFilteredRows.findIndex(row => row.id === r.id)
                  const sno = snoIndex !== -1 ? snoIndex + 1 : (page - 1) * rowsPerPage + i + 1 // Fallback to page index

                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      {/* S.No */}
                      <td style={{ padding: '12px', wordWrap: 'break-word', whiteSpace: 'normal' }}>{sno}</td>
                      {/* Action */}
                      <td style={{ padding: '12px' }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size='small' color='error' onClick={() => handleDelete(r)}>
                            <DeleteIcon style={{ color: 'red' }} />
                          </IconButton>
                          <IconButton size='small' onClick={() => handleEdit(r)}>
                            <EditIcon />
                          </IconButton>
                        </Box>
                      </td>
                      {/* Data Columns */}
                      <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.requestType}</td>
                      <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>
                        {getRequestNo(r)}
                      </td>
                      <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>
                        {getFormattedDate(r.requestDate)}
                      </td>
                      <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>
                        {r.fromLocation}
                      </td>
                      <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.toLocation}</td>
                      <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.requestedBy}</td>
                      <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>
                        {getApprovalStatus(r)}
                      </td>
                      <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>
                        {getIssuedStatus(r)}
                      </td>
                      <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>
                        {getCompletedStatus(r)}
                      </td>
                      <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.remarks}</td>
                      <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>
                        {renderStatusPill(r.status || 'Waiting')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          {rowCount === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color='text.secondary'>No results found</Typography>
            </Box>
          )}
        </Box>

        {/* Pagination (from Page A design) */}
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
              onChange={handleChangePage} // Handles 1-based page change
              shape='rounded'
              color='primary'
              showFirstButton
              showLastButton
            />
          </Box>
        </Box>
      </Card>
    </ContentLayout>
  )
}
