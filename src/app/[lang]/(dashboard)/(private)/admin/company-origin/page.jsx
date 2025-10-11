'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  IconButton,
  InputAdornment,
  TablePagination,
  Button
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { MdDelete } from 'react-icons/md'

// Icons
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'

// Next.js router
import { useRouter } from 'next/navigation'

// Wrapper
import ContentLayout from '@/components/layout/ContentLayout'

// Vuexy input
import CustomTextField from '@core/components/mui/TextField'

// IndexedDB
import { openDB } from 'idb'

// ------------------- IndexedDB Helpers -------------------
const getDB = async () => {
  return openDB('companyDB', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('companies')) {
        db.createObjectStore('companies', { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

const getAllCompanies = async () => {
  const db = await getDB()
  return db.getAll('companies')
}

const saveCompany = async company => {
  const db = await getDB()
  await db.put('companies', company)
}

const deleteCompany = async id => {
  const db = await getDB()
  await db.delete('companies', id)
}

// ------------------- Columns -------------------
const getColumns = (handleEdit, handleDelete, filteredRows) => [
  {
    field: 'serial',
    headerName: 'S.No',
    flex: 0.2,
    minWidth: 70,
    sortable: false,
    valueGetter: params => {
      const globalIndex = filteredRows.findIndex(row => row.id === params.row.id)
      const sNo = globalIndex !== -1 ? globalIndex + 1 : 'N/A'
      params.row.sNo = sNo
      return sNo
    }
  },
  {
    field: 'action',
    headerName: 'Action',
    flex: 0.5,
    minWidth: 100,
    sortable: false,
    renderCell: params => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton size='small' onClick={() => handleDelete(params.row)}>
          <MdDelete style={{ color: 'red' }} />
        </IconButton>
        <IconButton size='small' onClick={() => handleEdit(params.row)}>
          <EditIcon />
        </IconButton>
      </Box>
    )
  },
  { field: 'companyCode', headerName: 'Company Code', flex: 1, minWidth: 150 },
  { field: 'companyName', headerName: 'Company Name', flex: 1, minWidth: 200 },
  { field: 'phone', headerName: 'Phone', flex: 1, minWidth: 150 },
  { field: 'address', headerName: 'Address', flex: 1.2, minWidth: 200 },
  {
    field: 'status',
    headerName: 'Status',
    flex: 0.6,
    minWidth: 120,
    renderCell: params => (
      <Button
        size='small'
        variant='contained'
        color={params.value === 'Active' ? 'success' : 'error'}
        sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 500 }}
      >
        {params.value}
      </Button>
    )
  }
]

// ------------------- Component -------------------
export default function CompanyOriginPage() {
  const router = useRouter()
  const [rows, setRows] = useState([])
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => {
    const fetchCompanies = async () => {
      const allCompanies = await getAllCompanies()
      if (allCompanies.length === 0) {
        const defaultRows = [
          {
            id: Date.now(),
            companyCode: 'C001',
            companyName: 'Default Company 1',
            phone: '12345 67890',
            address: '123, Main Street',
            status: 'Active'
          }
        ]
        for (const row of defaultRows) await saveCompany(row)
        setRows(defaultRows)
      } else {
        setRows(allCompanies)
      }
    }
    fetchCompanies()
  }, [])

  const handleEdit = row => {
    if (!row.sNo) {
      console.error('S.No not available for navigation.')
      return
    }
    router.push(`/admin/company-origin/${row.sNo}/edit?dbId=${row.id}`)
  }

  const handleDelete = async row => {
    setRows(prev => prev.filter(r => r.id !== row.id))
    await deleteCompany(row.id)
  }

  const handleSearch = e => setSearchText(e.target.value)
  const handleChangePage = (event, newPage) => setPage(newPage)
  const handleChangeRowsPerPage = event => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const filteredRows = rows.filter(
    row =>
      row.companyName.toLowerCase().includes(searchText.toLowerCase()) ||
      row.companyCode.toLowerCase().includes(searchText.toLowerCase())
  )

  const totalRows = filteredRows.length
  const startIndex = totalRows === 0 ? 0 : page * rowsPerPage + 1
  const endIndex = Math.min((page + 1) * rowsPerPage, totalRows)
  const paginationText = `Showing ${startIndex} to ${endIndex} of ${totalRows} entries`

  const paginatedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  const columns = getColumns(handleEdit, handleDelete, filteredRows)

  return (
    <ContentLayout
      title='Origin Company List'
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Company Origin' }]}
    >
      <Box sx={{ p: 2, mt: 5, pt: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <CustomTextField
          size='small'
          placeholder='Search'
          value={searchText}
          onChange={handleSearch}
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

      <DataGrid
        rows={paginatedRows}
        columns={columns}
        disableRowSelectionOnClick
        autoHeight
        hideFooter
        getRowHeight={() => 'auto'}
        getRowId={row => row.id}
        sx={{
          mt: 3,
          '& .MuiDataGrid-row': {
            minHeight: '60px !important',
            padding: '12px 0'
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

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pr: 2 }}>
        <Typography variant='body2' sx={{ color: 'text.secondary', ml: 1 }}>
          {paginationText}
        </Typography>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component='div'
          count={totalRows}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>
    </ContentLayout>
  )
}
