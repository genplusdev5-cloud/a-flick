'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react' // 💡 FIX: Added React import
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Typography,
  Card,
  Divider,
  FormControl,
  Select,
  MenuItem,
  Pagination,
  Menu,
  ListItemText,
  TextField // 💡 FIX: Added TextField for the mock component
} from '@mui/material'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Icons
import { MdDelete } from 'react-icons/md'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import SearchIcon from '@mui/icons-material/Search'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'


// ----------------------------------------------------------------------
// ⚠️ MOCK/STUB COMPONENTS & INDEXEDDB HELPERS
// ----------------------------------------------------------------------

// Mock for custom TextField (Requires React and TextField import)
const CustomTextField = React.forwardRef((props, ref) => <TextField size='small' ref={ref} {...props} />)
CustomTextField.displayName = 'CustomTextField'

const DB_NAME = 'ContractDB'
const DB_VERSION = 1
const STORE_NAME = 'contracts'

const openDB_P = () => {
    return new Promise((resolve, reject) => {
        if (!('indexedDB' in window)) {
            reject(new Error('IndexedDB not supported.'))
            return
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION)
        request.onerror = event => { reject(event.target.error) }
        request.onsuccess = event => { resolve(event.target.result) }
        request.onupgradeneeded = event => {
            const db = event.target.result
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' })
            }
        }
    })
}

// Retrieves all contracts (latest first)
const getContracts_P = async () => {
    try {
        const db = await openDB_P()
        const transaction = db.transaction([STORE_NAME], 'readonly')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.getAll()
        return new Promise((resolve, reject) => {
            // Sort in reverse to get the latest first, matching your original logic
            request.onsuccess = event => { resolve(event.target.result.reverse()) }
            request.onerror = event => { reject(event.target.error) }
        })
    } catch (error) {
        console.error('Failed to open DB or get contracts:', error)
        return []
    }
}

// Deletes a contract by ID
const deleteContract_P = async (id) => {
    try {
        const db = await openDB_P()
        const transaction = db.transaction([STORE_NAME], 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.delete(id)
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve()
            request.onerror = (event) => reject(event.target.error)
        })
    } catch (error) {
        console.error('Failed to delete contract:', error)
    }
}
// ----------------------------------------------------------------------


// Helper component to render the sort icon
const SortIcon = ({ sortField, sortDirection, field }) => {
  if (sortField !== field) return null
  return sortDirection === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 16, ml: 0.5 }} /> : <ArrowDownwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
}

export default function ContractsPage() {
  const router = useRouter()

  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [sortField, setSortField] = useState('id')
  const [sortDirection, setSortDirection] = useState('desc')
  const [searchText, setSearchText] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const loadContracts = useCallback(() => {
    setLoading(true)
    getContracts_P().then(contracts => {
      setRows(contracts)
      setLoading(false)
    }).catch(err => {
        console.error('Error loading contracts:', err);
        setRows([]);
        setLoading(false);
    });
  }, [])

  useEffect(() => {
    loadContracts()
    // Refresh data when the page regains focus (e.g., returning from Page B or C)
    window.addEventListener('focus', loadContracts)
    return () => {
      window.removeEventListener('focus', loadContracts)
    }
  }, [loadContracts])

  const sortedRows = useMemo(() => {
      const sortableRows = [...rows];
      sortableRows.sort((a, b) => {
          const aValue = a[sortField] || ''
          const bValue = b[sortField] || ''
          let comparison = 0
          if (sortField === 'id' && !isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
              comparison = Number(aValue) - Number(bValue)
          } else {
              comparison = String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' })
          }
          return sortDirection === 'asc' ? comparison : comparison * -1
      });
      return sortableRows;
  }, [rows, sortField, sortDirection]);

  const filteredRows = useMemo(() => {
    if (!searchText) return sortedRows;
    const lowerCaseSearchText = searchText.toLowerCase()
    return sortedRows.filter(
      row =>
        row.customer?.toLowerCase().includes(lowerCaseSearchText) ||
        row.contractCode?.toLowerCase().includes(lowerCaseSearchText) ||
        row.serviceAddress?.toLowerCase().includes(lowerCaseSearchText) ||
        row.contractType?.toLowerCase().includes(lowerCaseSearchText) ||
        row.pestItems?.some(item => item.pest.toLowerCase().includes(lowerCaseSearchText)) ||
        row.pestItems?.map(item => item.pest).join(', ').toLowerCase().includes(lowerCaseSearchText)
    )
  }, [sortedRows, searchText]);

  const handleDelete = useCallback(
    async (id) => {
      if (!window.confirm("Are you sure you want to delete this contract?")) return;

      await deleteContract_P(id); // Use IndexedDB delete function
      const updatedRows = rows.filter(r => r.id !== id);
      setRows(updatedRows);

      // Simple reload logic to re-evaluate pagination
      loadContracts();
    },
    [rows, loadContracts]
  )

  const handleSort = field => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setPage(1)
  }

  const handleSearch = e => {
    setSearchText(e.target.value)
    setPage(1)
  }

  const rowCount = filteredRows.length
  const pageCount = Math.max(1, Math.ceil(rowCount / rowsPerPage))
  const paginatedRows = filteredRows.slice((page - 1) * rowsPerPage, page * rowsPerPage)
  const startIndex = rowCount === 0 ? 0 : (page - 1) * rowsPerPage + 1
  const endIndex = Math.min(page * rowsPerPage, rowCount)

  const handlePageChange = (event, value) => setPage(value)
  const handleRowsPerPageChange = event => {
    setRowsPerPage(Number(event.target.value))
    setPage(1)
  }

  const handleEditClick = id => {
    // Page C-ஐ id-ஐ அடிப்படையாகக் கொண்டு திறக்கிறது (URL Match)
    router.push(`/admin/contracts/${id}/edit`)
  }

  // --- Export Menu Placeholder ---
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const exportOpen = Boolean(exportAnchorEl)
  const handleExportClick = e => setExportAnchorEl(e.currentTarget)
  const handleExportClose = () => setExportAnchorEl(null)
  const handleExportSelect = type => {
    alert(`Export as: ${type}`)
    handleExportClose()
  }

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <Link href='/' style={{  textDecoration: 'none', fontSize: 14 }}>
          Dashboard
        </Link>
        <Typography sx={{ mx: 1, color: 'text.secondary' }}>/</Typography>
        <Typography variant='body2' sx={{ fontSize: 14 }}>
          Contracts
        </Typography>
      </Box>

      <Card sx={{ p: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant='h6'>Contracts List</Typography>

          <Box display='flex' gap={1}>
             <Button
              variant='outlined'
              endIcon={<ArrowDropDownIcon />}
              onClick={handleExportClick}
              disabled={!rows.length}
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
            <Button
              variant='contained'
              startIcon={<AddIcon />}
              // Page B-ஐ திறக்கிறது
              onClick={() => router.push('/admin/contracts/add')}
            >
              Add Contract
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <FormControl size='small' sx={{ minWidth: 120 }}>
            <Select value={rowsPerPage} onChange={handleRowsPerPageChange}>
              {[10, 25, 50, 100].map(i => (
                <MenuItem key={i} value={i}>
                  {i} entries
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <CustomTextField
            size='small'
            placeholder='Search...'
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

        {/* Table */}
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
                <th onClick={() => handleSort('id')} style={{ padding: '12px', width: '60px', cursor: 'pointer', userSelect: 'none' }}>
                  <Box display='flex' alignItems='center'> S.No <SortIcon sortField={sortField} sortDirection={sortDirection} field='id' /> </Box>
                </th>
                <th style={{ padding: '12px', width: '100px' }}>Actions</th>
                <th onClick={() => handleSort('customer')} style={{ padding: '12px', width: '150px', cursor: 'pointer', userSelect: 'none' }}>
                  <Box display='flex' alignItems='center'> Customer <SortIcon sortField={sortField} sortDirection={sortDirection} field='customer' /> </Box>
                </th>
                <th onClick={() => handleSort('contractCode')} style={{ padding: '12px', width: '120px', cursor: 'pointer', userSelect: 'none' }}>
                  <Box display='flex' alignItems='center'> Code <SortIcon sortField={sortField} sortDirection={sortDirection} field='contractCode' /> </Box>
                </th>
                <th onClick={() => handleSort('serviceAddress')} style={{ padding: '12px', width: '200px', cursor: 'pointer', userSelect: 'none' }}>
                  <Box display='flex' alignItems='center'> Address <SortIcon sortField={sortField} sortDirection={sortDirection} field='serviceAddress' /> </Box>
                </th>
                <th onClick={() => handleSort('contractType')} style={{ padding: '12px', width: '100px', cursor: 'pointer', userSelect: 'none' }}>
                  <Box display='flex' alignItems='center'> Type <SortIcon sortField={sortField} sortDirection={sortDirection} field='contractType' /> </Box>
                </th>
                <th onClick={() => handleSort('startDate')} style={{ padding: '12px', width: '120px', cursor: 'pointer', userSelect: 'none' }}>
                  <Box display='flex' alignItems='center'> Date <SortIcon sortField={sortField} sortDirection={sortDirection} field='startDate' /> </Box>
                </th>
                <th onClick={() => handleSort('pest')} style={{ padding: '12px', width: '120px', cursor: 'pointer', userSelect: 'none' }}>
                  <Box display='flex' alignItems='center'> Pests <SortIcon sortField={sortField} sortDirection={sortDirection} field='pest' /> </Box>
                </th>
                <th style={{ padding: '12px', width: '120px' }}> Services </th>
                <th onClick={() => handleSort('status')} style={{ padding: '12px', width: '100px', cursor: 'pointer', userSelect: 'none' }}>
                  <Box display='flex' alignItems='center'> Status <SortIcon sortField={sortField} sortDirection={sortDirection} field='status' /> </Box>
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                 <tr><td colSpan={10} style={{ padding: '24px', textAlign: 'center' }}><Typography>Loading contracts...</Typography></td></tr>
              ) : (
                  paginatedRows.map((r, i) => {
                    const status = r.status || 'Active';
                    const date = r.startDate ? new Date(r.startDate).toLocaleDateString('en-GB') : '';
                    const pestList = r.pestItems && r.pestItems.length > 0 ? r.pestItems.map(p => p.pest).join(', ') : 'N/A';

                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '12px', wordWrap: 'break-word', whiteSpace: 'normal' }}>
                          {(page - 1) * rowsPerPage + i + 1}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton size='small' color='error' onClick={() => handleDelete(r.id)}>
                              <MdDelete />
                            </IconButton>
                            <IconButton size='small' onClick={() => handleEditClick(r.id)}>
                              <EditIcon />
                            </IconButton>
                          </Box>
                        </td>
                        <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.customer}</td>
                        <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.contractCode || ''}</td>
                        <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.serviceAddress || ''}</td>
                        <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.contractType || ''}</td>
                        <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{date}</td>
                        <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{pestList}</td>
                        <td style={{ padding: '12px' }}>
                          <Button size='small' variant='outlined' color='info' sx={{ borderRadius: '5px', textTransform: 'none', fontWeight: 500, p: '4px 8px' }}>
                            Services
                          </Button>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <Box
                            component='span'
                            sx={{
                              fontWeight: 600,
                              color: '#fff',
                              backgroundColor: status === 'Active' ? 'success.main' : 'error.main',
                              px: 1.5,
                              py: 0.5,
                              borderRadius: '6px',
                              display: 'inline-block'
                            }}
                          >
                            {status}
                          </Box>
                        </td>
                      </tr>
                    )
                  })
              )}
            </tbody>
          </table>
          {rowCount === 0 && !loading && (
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
              onChange={handlePageChange}
              shape='rounded'
              color='primary'
              showFirstButton
              showLastButton
            />
          </Box>
        </Box>
      </Card>
    </Box>
  )
}
