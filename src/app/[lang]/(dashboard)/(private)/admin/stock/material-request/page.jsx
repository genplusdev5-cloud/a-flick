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
  TablePagination,
  Autocomplete
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'

// Icons
import SearchIcon from '@mui/icons-material/Search'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'

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

export default function MaterialRequestPage() {
  const router = useRouter()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [dateFilter, setDateFilter] = useState(new Date())
  const [filterByDate, setFilterByDate] = useState(false)
  const [requestStatus, setRequestStatus] = useState('')
  const [fromLocation, setFromLocation] = useState('')
  const [toLocation, setToLocation] = useState('')
  const [requestedBy, setRequestedBy] = useState('')

  const requestStatusRef = useRef(null)
  const fromLocationRef = useRef(null)
  const toLocationRef = useRef(null)
  const requestedByRef = useRef(null)

  const [requestStatusOpen, setRequestStatusOpen] = useState(false)
  const [fromLocationOpen, setFromLocationOpen] = useState(false)
  const [toLocationOpen, setToLocationOpen] = useState(false)
  const [requestedByOpen, setRequestedByOpen] = useState(false)

  const handleRefreshTable = async () => {
    setLoading(true)
    const data = await loadRequestsFromDB()
    setRows(data)
    setLoading(false)
    setPage(0)
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

  const focusNextInput = (currentRef, nextRef) => {
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
    if (newValue) focusNextInput(requestStatusRef, fromLocationRef)
  }

  const handleFromLocationChange = (e, newValue) => {
    setFromLocation(newValue || '')
    if (newValue) focusNextInput(fromLocationRef, toLocationRef)
  }

  const handleToLocationChange = (e, newValue) => {
    setToLocation(newValue || '')
    if (newValue) focusNextInput(toLocationRef, requestedByRef)
  }

  const handleRequestedByChange = (e, newValue) => {
    setRequestedBy(newValue || '')
  }

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

  const paginatedRows = useMemo(() => {
    return filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  }, [filteredRows, page, rowsPerPage])

  const totalRows = filteredRows.length
  const startIndex = totalRows === 0 ? 0 : page * rowsPerPage + 1
  const endIndex = Math.min((page + 1) * rowsPerPage, totalRows)
  const paginationText = `Showing ${startIndex} to ${endIndex} of ${totalRows} entries`

  const handleChangePage = (event, newPage) => setPage(newPage)
  const handleChangeRowsPerPage = event => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const columns = [
    {
      field: 'sno',
      headerName: 'S.No',
      width: 80,
      renderCell: params => {
        const index = filteredRows.findIndex(row => row.id === params.row.id)
        return index !== -1 ? index + 1 : ''
      }
    },
    {
      field: 'actions',
      headerName: 'Action',
      width: 100,
      renderCell: params => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size='small' onClick={() => handleDelete(params.row)}>
            <DeleteIcon style={{ color: 'red' }} />
          </IconButton>
          <IconButton size='small' onClick={() => handleEdit(params.row)}>
            <EditIcon />
          </IconButton>
        </Box>
      )
    },
    { field: 'requestType', headerName: 'Request Type', width: 180 },
    {
      field: 'requestNo',
      headerName: 'Request No',
      width: 160,
      valueGetter: params => params.row.requestNo || `REQ-${params.row.id}`
    },
    {
      field: 'requestDate',
      headerName: 'Request Date',
      width: 160,
      valueFormatter: params => {
        const date = new Date(params.value)
        return !isNaN(date.getTime()) ? format(date, 'dd/MM/yyyy') : ''
      }
    },
    { field: 'fromLocation', headerName: 'From Location/Supplier', width: 220 },
    { field: 'toLocation', headerName: 'To Location/Supplier', width: 220 },
    { field: 'requestedBy', headerName: 'Requested By', width: 150 },
    {
      field: 'isApproved',
      headerName: 'Is Approved',
      width: 150,
      renderCell: params => {
        const status = params.row.approvedStatus || params.row.status || 'Pending'
        if (status === 'Approved') return 'Approved'
        if (['Rejected', 'Declined'].includes(status)) return 'Rejected'
        return 'Pending'
      }
    },
    {
      field: 'isIssued',
      headerName: 'Is Issued',
      width: 150,
      renderCell: params => {
        const status = params.row.issuedStatus || params.row.status || 'Pending'
        if (status === 'Issued') return 'Issued'
        if (status === 'Pending') return 'Pending'
        return 'Not Issued'
      }
    },
    {
      field: 'isCompleted',
      headerName: 'Is Completed',
      width: 120,
      renderCell: params => (params.row.completedStatus === 'Yes' ? 'Yes' : 'No')
    },
    { field: 'remarks', headerName: 'Remarks', width: 200 },
    {
      field: 'status',
      headerName: 'Request Status',
      width: 150,
      renderCell: params => {
        const statusValue = params.row.status || 'Waiting'
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
            bgColor = '#9e9e9e'
            break
        }
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
    }
  ]

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
      <Card sx={{ mb: 4, boxShadow: 'none' }} elevation={0}>
        <CardContent>
          <Grid container spacing={6}>
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

      <Card sx={{ mb: 4, boxShadow: 'none' }} elevation={0}>
        <CardContent>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
            <Box display='flex' gap={1}>
              {['Copy', 'CSV', 'Excel', 'PDF', 'Print'].map(btn => (
                <Button
                  key={btn}
                  variant='contained'
                  size='small'
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
              placeholder='Search'
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
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

          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <DataGrid
              rows={paginatedRows}
              columns={columns}
              disableRowSelectionOnClick
              autoHeight
              hideFooter
              getRowId={row => row.id}
              loading={loading}
              getRowHeight={() => 'auto'}
              sx={{
                mt: 3,
                '& .MuiDataGrid-row': { minHeight: '60px !important', padding: '12px 0' },
                '& .MuiDataGrid-cell': {
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                  alignItems: 'flex-start',
                  fontSize: '15px'
                },
                '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
                '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': { outline: 'none' },
                '& .MuiDataGrid-columnHeaderTitle': { fontSize: '15px', fontWeight: 500 }
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
            <Typography variant='body2' color='text.secondary'>
              {paginationText}
            </Typography>

            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component='div'
              count={filteredRows.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Box>
        </CardContent>
      </Card>
    </ContentLayout>
  )
}
