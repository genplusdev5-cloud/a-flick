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
  Pagination
} from '@mui/material'

// Icons and Components
import { MdDelete } from 'react-icons/md'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import DownloadIcon from '@mui/icons-material/Download'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import CustomTextField from '@core/components/mui/TextField'
import Link from 'next/link'
import { useTheme } from '@mui/material/styles'
export default function IndustryPage() {
  // ---------------- State ----------------
  const [rows, setRows] = useState([])
  const [searchText, setSearchText] = useState('')
  const [open, setOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [formData, setFormData] = useState({ name: '', description: '', status: 'Active' })

  // State for Sorting
  const [sortField, setSortField] = useState('id')
  const [sortDirection, setSortDirection] = useState('desc')

  // State for Pagination
  const [page, setPage] = useState(1) // 1-based indexing
  const [pageSize, setPageSize] = useState(10)

  // Refs
  const nameRef = useRef(null)
  const descriptionRef = useRef(null)
  const statusRef = useRef(null)
  const submitButtonRef = useRef(null)

  const dbName = 'industry-db'
  const storeName = 'industries'

  // ---------------- IndexedDB ----------------
  const initDB = async () => {
    const db = await openDB(dbName, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true })
        }
      }
    })
    return db
  }

  useEffect(() => {
    const loadData = async () => {
      const db = await initDB()
      const allItems = await db.getAll(storeName)
      // Initial load: sort by ID descending (latest first)
      setRows(allItems.sort((a, b) => b.id - a.id))
    }
    loadData()
  }, [])

  // ---------------- CRUD & Drawer ----------------
  const toggleDrawer = () => setOpen(prev => !prev)

  const handleAdd = () => {
    setIsEdit(false)
    setEditRow(null)
    setFormData({ name: '', description: '', status: 'Active' })
    setOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setEditRow(row)
    setFormData({ ...row })
    setOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  const handleDelete = async row => {
    const db = await initDB()
    await db.delete(storeName, row.id)
    setRows(prev => prev.filter(r => r.id !== row.id))
  }

  const handleChange = e => {
    const { name, value } = e.target
    if (name === 'name') {
      // Allow only letters and spaces
      const filtered = value.replace(/[^a-zA-Z\s]/g, '')
      setFormData(prev => ({ ...prev, [name]: filtered }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!formData.name) return

    const db = await initDB()
    if (isEdit && editRow) {
      const rowToSave = { ...formData, id: editRow.id }
      await db.put(storeName, rowToSave)
      setRows(prev => prev.map(r => (r.id === editRow.id ? rowToSave : r)))
    } else {
      const id = await db.add(storeName, formData)
      const newRow = { ...formData, id }
      setRows(prev => {
        const newRows = [newRow, ...prev.filter(r => r.id !== newRow.id)]
        return newRows.sort((a, b) => b.id - a.id)
      })
    }
    toggleDrawer()
    setSortField('id')
    setSortDirection('desc')
  }

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value
    setFormData(prev => ({ ...prev, status: newStatus }))
    if (isEdit && editRow) {
      const updatedRow = { ...editRow, status: newStatus }
      setRows(prev => prev.map(r => (r.id === editRow.id ? updatedRow : r)))
      const db = await initDB()
      await db.put(storeName, updatedRow)
    }
  }

  // ---------------- Sorting Logic ----------------
  const handleSort = field => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setPage(1)
  }

  const sortedRows = [...rows].sort((a, b) => {
    const aValue = a[sortField] || ''
    const bValue = b[sortField] || ''

    let comparison = 0
    if (sortField === 'id') {
      comparison = Number(a[sortField] || 0) - Number(b[sortField] || 0)
    } else {
      comparison = String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' })
    }

    return sortDirection === 'asc' ? comparison : comparison * -1
  })

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <ArrowUpwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
    ) : (
      <ArrowDownwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
    )
  }

  // ---------------- Search & Pagination Logic ----------------
  const handleSearch = e => {
    setSearchText(e.target.value)
    setPage(1)
  }

  const filteredRows = sortedRows.filter(
    r =>
      r.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchText.toLowerCase()) ||
      r.status?.toLowerCase().includes(searchText.toLowerCase())
  )

  const rowCount = filteredRows.length
  const pageCount = Math.max(1, Math.ceil(rowCount / pageSize))
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)
  const startIndex = rowCount === 0 ? 0 : (page - 1) * pageSize + 1
  const endIndex = Math.min(page * pageSize, rowCount)
  const paginationText = `Showing ${startIndex} to ${endIndex} of ${rowCount} entries`
const theme = useTheme()
  return (
    <Box>
      {/* Breadcrumb */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
           <Link
      href='/admin/dashboards'
      style={{
        textDecoration: 'none',
        fontSize: 14,
        color: theme.palette.primary.main // 👈 Theme primary color used
      }}
    >
      Dashboard
    </Link>
        <Typography sx={{ mx: 1, color: 'text.secondary' }}>/</Typography>
        <Typography variant='body2' sx={{ fontSize: 14 }}>
          Industry List
        </Typography>
      </Box>

      <Card sx={{ p: 6 }}>
        {/* Header + actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant='h6'>Industry List</Typography>

          <Box display='flex' gap={1}>
            <Button variant='outlined' endIcon={<ArrowDropDownIcon />}>
              Export
            </Button>
            <Button variant='contained' startIcon={<AddIcon />} onClick={handleAdd}>
              Add Industry
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Search / entries control */}
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
            placeholder='Search by Name or Description...'
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

        {/* Manual HTML Table */}
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
                  style={{ padding: '12px', width: '80px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    S.No <SortIcon field='id' />
                  </Box>
                </th>

                <th style={{ padding: '12px', width: '100px' }}>Action</th>

                {/* Industry Name Header (Set to 250px) */}
                <th
                  onClick={() => handleSort('name')}
                  style={{ padding: '12px', width: '250px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Industry Name <SortIcon field='name' />
                  </Box>
                </th>

                {/* Description Header (Set to 250px - Equal to Name) */}
                <th
                  onClick={() => handleSort('description')}
                  style={{ padding: '12px', width: '250px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Description <SortIcon field='description' />
                  </Box>
                </th>

                {/* Status Header */}
                <th
                  onClick={() => handleSort('status')}
                  style={{ padding: '12px', width: '120px', cursor: 'pointer', userSelect: 'none' }}
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
                      <IconButton size='small' onClick={() => handleEdit(r)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size='small' color='error' onClick={() => handleDelete(r)}>
                        <MdDelete />
                      </IconButton>
                    </Box>
                  </td>
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.name}</td>
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.description}</td>
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

        {/* Pagination Footer */}
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
        <Box sx={{ width: 360, p: 3 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6'>{isEdit ? 'Edit Industry' : 'Add New Industry'}</Typography>
            <IconButton onClick={toggleDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>

          <form onSubmit={handleSubmit}>
            <CustomTextField
              fullWidth
              margin='normal'
              label='Industry Name'
              name='name'
              value={formData.name}
              onChange={handleChange}
              inputRef={nameRef}
              inputProps={{
                onKeyDown: e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    descriptionRef.current?.focus()
                  }
                }
              }}
            />

            <CustomTextField
              fullWidth
              margin='normal'
              multiline
              rows={4}
              label='Description'
              name='description'
              value={formData.description}
              onChange={handleChange}
              inputRef={descriptionRef}
              inputProps={{
                onKeyDown: e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (!isEdit) {
                        submitButtonRef.current?.focus()
                    }
                    else {
                        statusRef.current?.querySelector('select')?.focus()
                    }
                  }
                }
              }}
            />

            {isEdit && (
              <CustomTextField
                select
                fullWidth
                margin='normal'
                label='Status'
                value={formData.status}
                inputRef={statusRef}
                onChange={handleStatusChange}
              >
                <MenuItem value='Active'>Active</MenuItem>
                <MenuItem value='Inactive'>Inactive</MenuItem>
              </CustomTextField>
            )}

            <Box mt={3} display='flex' gap={2}>
              <Button
                type='submit'
                variant='contained'
                fullWidth
                ref={submitButtonRef}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    e.target.click()
                  }
                }}
              >
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
