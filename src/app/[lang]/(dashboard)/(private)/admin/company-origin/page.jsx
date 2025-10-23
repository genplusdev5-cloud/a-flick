'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  IconButton,
  InputAdornment,
  Button,
  Card,
  Divider,
  FormControl,
  Select,
  MenuItem,
  Pagination
} from '@mui/material'

// Icons
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import { MdDelete } from 'react-icons/md'
import Link from 'next/link'
import { useTheme } from '@mui/material/styles'
// Next.js router
import { useRouter } from 'next/navigation'


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

// ------------------- Component -------------------
export default function CompanyOriginPage() {
  const router = useRouter()
  const [rows, setRows] = useState([])
  const [searchText, setSearchText] = useState('')

  // State for Sorting (from Page A)
  const [sortField, setSortField] = useState('id')
  const [sortDirection, setSortDirection] = useState('asc')

  // State variables for Pagination (from Page A)
  const [page, setPage] = useState(1) // 1-based indexing
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    const fetchCompanies = async () => {
      const db = await getDB()
      let allCompanies = await db.getAll('companies')

      if (allCompanies.length === 0) {
        // Default Data with full fields, including logo details
        const defaultRows = [
          {
            // The id will be auto-incremented by IndexedDB when using db.add,
            // but since we use db.put on first run, we set it to a unique value like Date.now()
            // for the first insertion. We must ensure to use db.put which will handle
            // the case where the data already exists.

            // Note: Since the IndexedDB helper uses `db.put` and expects an `id`
            // when loading from IndexedDB, we must ensure it's not present for a
            // fresh insert if the store is configured with autoIncrement.
            // However, the existing logic sets it:
            // const id = Date.now() // Using Date.now() for unique initial ID if db is empty
            // To ensure the default row has an ID for immediate display/sorting,
            // and since the `getDB` only creates the store with `autoIncrement: true`
            // but the `saveCompany` uses `db.put`, we'll keep the `id: Date.now()`
            // structure for the initial insertion, which will override/update
            // if an item with that ID exists (which it won't on first run).

            // To be more robust, we will check if any default row exists before
            // inserting the default data, to avoid multiple insertions.

            // Using a high fixed number for a deterministic default ID for testing.
            // If the store is empty, IndexedDB will assign a new ID on `db.put`
            // if we omit the `id`, but since the original code structure sets `id: Date.now()`
            // on the object passed to `db.put`, we must provide a unique one
            // to avoid overwriting on subsequent app loads if `db.put` is used.
            // Let's ensure a complete default row is defined.

            // --- FULL DEFAULT DATA FOR EDIT TESTING ---
            // If we omit `id` here, IndexedDB will assign one on `saveCompany` (db.put)
            // But Page A uses the id for the `key` prop and to send to Page B.
            // We'll trust the original code's `id: Date.now()` to create a unique one
            // if the DB is empty and then use that ID.

            companyCode: 'C001',
            companyName: 'Default Company 1',
            phone: '12345 67890',
            email: 'default@example.com',
            taxNumber: 'TN-001',
            addressLine1: '123, Main Street, Default Area',
            addressLine2: 'Near Default Landmark',
            city: 'Default City',
            glContractAccount: 'GLC001',
            glJobAccount: 'GLJ001',
            glContJobAccount: 'GLCJ001',
            glWarrantyAccount: 'GLW001',
            uenNumber: 'UEN12345678Z',
            gstNumber: 'GST987654321',
            invoicePrefixCode: 'INV-D',
            invoiceStartNumber: '1001',
            contractPrefixCode: 'CON-D',
            status: 'Active',
            bankName: 'Default Bank',
            bankAccountNumber: '9876543210',
            bankCode: 'DBK',
            swiftCode: 'DBKIDDXXXX',
            accountingDate: new Date().toISOString(), // Default date
            uploadedFileName: 'default_logo.png',
            // Placeholder URL, in a real app this would be a real file URL/blob
            uploadedFileURL: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
          }
        ]

        // Only insert if the database is truly empty
        if (allCompanies.length === 0) {
            const rowToSave = { ...defaultRows[0], id: Date.now() }; // Assign ID before saving
            await saveCompany(rowToSave)
            setRows([rowToSave]) // Set state with the saved row
        } else {
            setRows(allCompanies)
        }

      } else {
        setRows(allCompanies)
      }
    }
    fetchCompanies()
  }, [])

  // CORRECTION APPLIED HERE
  const handleEdit = (row, index) => {
    // Calculate the 1-based index (S.No) for the URL path segment
    const sNo = (page - 1) * pageSize + index + 1

    // RESTORED THE OLD PATH STRUCTURE
    router.push(`/admin/company-origin/${sNo}/edit?dbId=${row.id}`)
  }

  const handleDelete = async row => {
    setRows(prev => prev.filter(r => r.id !== row.id))
    await deleteCompany(row.id)
  }

  const handleSearch = e => {
    setSearchText(e.target.value)
    setPage(1) // reset page on search change
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
    // Check if values are numerical (for companyCode - if purely number, or id)
    if (sortField === 'id' || sortField === 'companyCode') {
      const aNum = Number(aValue)
      const bNum = Number(bValue)
      if (!isNaN(aNum) && !isNaN(bNum)) {
        comparison = aNum - bNum
      } else {
        // Fallback to string compare for codes or if not purely numerical
        comparison = String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' })
      }
    } else {
      // Case-insensitive string comparison for name, address, phone, status
      comparison = String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' })
    }

    return sortDirection === 'asc' ? comparison : comparison * -1
  })

  // Helper component to render the sort icon (from Page A)
  const SortIcon = ({ field }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 16, ml: 0.5 }} /> : <ArrowDownwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
  }

  // ------------------- Filtering and Pagination Logic (from Page A) -------------------

  // Client-side filtering based on search text
  const filteredRows = sortedRows.filter(
    row =>
      row.companyName.toLowerCase().includes(searchText.toLowerCase()) ||
      row.companyCode.toLowerCase().includes(searchText.toLowerCase()) ||
      row.address.toLowerCase().includes(searchText.toLowerCase()) ||
      row.phone.includes(searchText)
  )

  const rowCount = filteredRows.length
  const pageCount = Math.max(1, Math.ceil(rowCount / pageSize))
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)
  const startIndex = rowCount === 0 ? 0 : (page - 1) * pageSize + 1
  const endIndex = Math.min(page * pageSize, rowCount)
 const theme = useTheme()
  return (
    <Box>
      {/* Breadcrumb (from Page A) */}
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
          Company Origin
        </Typography>
      </Box>

      <Card sx={{ p: 6 }}>
        {/* Header + actions (Simplified for this page) */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant='h6'>Origin Company List</Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Search / entries (from Page A) */}
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
            placeholder='Search by Code, Name, Phone, or Address...'
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

        {/* Table (Manual HTML Table from Page A) */}
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

                {/* Company Code Header */}
                <th
                  onClick={() => handleSort('companyCode')}
                  style={{ padding: '12px', width: '120px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Code <SortIcon field='companyCode' />
                  </Box>
                </th>

                {/* Company Name Header */}
                <th
                  onClick={() => handleSort('companyName')}
                  style={{ padding: '12px', width: '180px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Name <SortIcon field='companyName' />
                  </Box>
                </th>

                {/* Phone Header */}
                <th
                  onClick={() => handleSort('phone')}
                  style={{ padding: '12px', width: '120px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Phone <SortIcon field='phone' />
                  </Box>
                </th>

                {/* Address Header */}
                <th
                  onClick={() => handleSort('address')}
                  style={{ padding: '12px', width: '250px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Address <SortIcon field='address' />
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
                      {/* CORRECTION APPLIED HERE - passing the index 'i' */}
                      <IconButton size='small' onClick={() => handleEdit(r, i)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size='small' color='error' onClick={() => handleDelete(r)}>
                        <MdDelete />
                      </IconButton>
                    </Box>
                  </td>
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.companyCode}</td>
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.companyName}</td>
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.phone}</td>
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.address}</td>
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
    </Box>
  )
}
