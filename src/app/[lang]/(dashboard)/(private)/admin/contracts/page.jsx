'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  TablePagination,
  Typography
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { useRouter } from 'next/navigation'
import { MdDelete } from 'react-icons/md'

// Icons
import AddIcon from '@mui/icons-material/Add'
import DownloadIcon from '@mui/icons-material/Download'
import EditIcon from '@mui/icons-material/Edit'
import SearchIcon from '@mui/icons-material/Search'

// Wrapper
import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'

// Function to safely get contracts from Local Storage
const getContracts = () => {
  try {
    const savedContracts = localStorage.getItem('contracts')
    return JSON.parse(savedContracts || '[]')
  } catch (error) {
    console.error('Error reading contracts from localStorage:', error)
    return []
  }
}

// Function to safely save contracts to Local Storage
const saveContracts = contracts => {
  try {
    localStorage.setItem('contracts', JSON.stringify(contracts))
  } catch (error) {
    console.error('Error writing contracts to localStorage:', error)
  }
}

export default function ContractsPage() {
  const router = useRouter()

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchText, setSearchText] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const loadContracts = useCallback(() => {
    setLoading(true)
    const contracts = getContracts()
    setRows(contracts)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadContracts()
    window.addEventListener('focus', loadContracts)
    return () => {
      window.removeEventListener('focus', loadContracts)
    }
  }, [loadContracts])

  const handleDelete = useCallback(
    id => {
      const updatedRows = rows.filter(r => r.id !== id)
      setRows(updatedRows)
      saveContracts(updatedRows)

      const start = page * rowsPerPage
      const end = start + rowsPerPage
      const paginatedRows = rows.slice(start, end).filter(r => r.id !== id)

      if (updatedRows.length > 0 && paginatedRows.length === 0 && page > 0) {
        setPage(prevPage => prevPage - 1)
      }
    },
    [rows, page, rowsPerPage]
  )

  const handleChangePage = (event, newPage) => setPage(newPage)
  const handleChangeRowsPerPage = event => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const filteredRows = useMemo(() => {
    if (!searchText) return rows
    const lowerCaseSearchText = searchText.toLowerCase()
    return rows.filter(
      row =>
        row.customer?.toLowerCase().includes(lowerCaseSearchText) ||
        row.contractCode?.toLowerCase().includes(lowerCaseSearchText) ||
        row.serviceAddress?.toLowerCase().includes(lowerCaseSearchText) ||
        row.contractType?.toLowerCase().includes(lowerCaseSearchText) ||
        row.pest?.toLowerCase().includes(lowerCaseSearchText)
    )
  }, [rows, searchText])

  const paginatedRows = useMemo(() => {
    return filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  }, [filteredRows, page, rowsPerPage])

  const totalRows = filteredRows.length
  const startIndex = totalRows === 0 ? 0 : page * rowsPerPage + 1
  const endIndex = Math.min((page + 1) * rowsPerPage, totalRows)
  const paginationText = `Showing ${startIndex} to ${endIndex} of ${totalRows} entries`

  const handleServiceClick = contract => {
    router.push(`/admin/contracts/${contract.id}/services`)
  }

  const handleEditClick = id => {
    const indexInFullList = rows.findIndex(r => r.id === id)
    if (indexInFullList !== -1) {
      const serialNumber = indexInFullList + 1
      router.push(`/admin/contracts/${serialNumber}/edit`)
    } else {
      console.error(`Contract ID ${id} not found for editing.`)
      router.push(`/admin/contracts/${id}/edit`)
    }
  }

  const columns = [
    {
      field: 'serial',
      headerName: 'S.No',
      flex: 0.2,
      minWidth: 60,
      valueGetter: params => {
        const index = filteredRows.findIndex(r => r.id === params.row.id)
        return index !== -1 ? index + 1 : ''
      },
      sortable: false
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.8,
      minWidth: 100,
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size='small' onClick={() => handleDelete(params.row.id)} aria-label='delete'>
            <MdDelete style={{ color: 'red' }} />
          </IconButton>
          <IconButton
            size='small'
            onClick={() => handleEditClick(params.row.id)}
            sx={{ '&:focus': { outline: 'none' } }}
            aria-label='edit'
          >
            <EditIcon fontSize='small' />
          </IconButton>
        </Box>
      )
    },
    { field: 'customer', headerName: 'Customer', flex: 1, minWidth: 150 },
    { field: 'contractCode', headerName: 'Contract Code', flex: 1, minWidth: 120, valueGetter: params => params.row.contractCode || '' },
    {
      field: 'serviceAddress',
      headerName: 'Service Address',
      flex: 1.5,
      minWidth: 200,
      valueGetter: params => params.row.serviceAddress || ''
    },
    { field: 'contractType', headerName: 'Type', flex: 1, minWidth: 100, valueGetter: params => params.row.contractType || '' },
    {
      field: 'startDate',
      headerName: 'Date',
      flex: 1,
      minWidth: 120,
      valueGetter: params => (params.row.startDate ? new Date(params.row.startDate).toLocaleDateString('en-GB') : '')
    },
    { field: 'pest', headerName: 'Pests', flex: 1, minWidth: 120, valueGetter: params => params.row.pest || '' },
    {
      field: 'services',
      headerName: 'Services',
      flex: 1,
      minWidth: 120,
      sortable: false,
      renderCell: params => (
        <Button
          size='small'
          variant='outlined'
          color='info'
          onClick={() => handleServiceClick(params.row)}
          sx={{
            borderRadius: '5px',
            textTransform: 'none',
            fontWeight: 500,
            p: 1.5
          }}
        >
          Services
        </Button>
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.7,
      valueGetter: params => params.row.status || 'Active',
      renderCell: params => (
        <Button
          size='small'
          variant='contained'
          color={params.value === 'Active' ? 'success' : 'error'}
          sx={{
            borderRadius: '20px',
            textTransform: 'none',
            fontWeight: 500
          }}
        >
          {params.value}
        </Button>
      )
    }
  ]

  return (
    <ContentLayout
      title='Contracts List'
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Contracts' }]}
      actions={
        <Box sx={{ m: 2, display: 'flex', gap: 2 }}>
          <Button variant='outlined' startIcon={<DownloadIcon />} disabled={!rows.length}>
            Export
          </Button>
          <Button variant='contained' startIcon={<AddIcon />} onClick={() => router.push('/admin/contracts/add')}>
            Add Contract
          </Button>
        </Box>
      }
    >
      {/* Search */}
      <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'flex-start', mt: 5 }}>
        <CustomTextField
          size='small'
          placeholder='Search'
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          sx={{ width: 360 }}
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

      {/* DataGrid */}
      <DataGrid
        rows={paginatedRows}
        columns={columns}
        disableRowSelectionOnClick
        autoHeight
        hideFooter
        loading={loading}
        getRowHeight={() => 'auto'}
        getRowId={row => row.id}
        sx={{
          mt: 3,
          '& .MuiDataGrid-row': {
            minHeight: '60px !important',
            padding: '10px 0'
          },
          '& .MuiDataGrid-cell': {
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            alignItems: 'flex-start',
            fontSize: '15px'
          },
          '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
          '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': { outline: 'none' },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontSize: '15px',
            fontWeight: 500
          }
        }}
      />

      {/* Pagination */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
        <Typography variant='body2' color='text.secondary'>
          {paginationText}
        </Typography>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component='div'
          count={filteredRows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>
    </ContentLayout>
  )
}
