'use client'

import { useState, useEffect, useRef } from 'react'
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
  Menu
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
// Icons
import { MdDelete } from 'react-icons/md'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import { openDB } from 'idb'
import Link from 'next/link'
import CustomTextField from '@core/components/mui/TextField'

const DB_NAME = 'uom_db'
const STORE_NAME = 'uoms'

export default function UnitOfMeasurementPage() {
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchText, setSearchText] = useState('')
  const [open, setOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editRow, setEditRow] = useState(null)

  // 1. UPDATED: Add new fields to formData state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'Active',
    uomStore: '',
    uomPurchase: '',
    conversion: ''
  })

  const [sortField, setSortField] = useState('id')
  const [sortDirection, setSortDirection] = useState('desc')
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const exportOpen = Boolean(exportAnchorEl)

  const submitRef = useRef(null)
  const statusRef = useRef(null)
  const nameRef = useRef(null)
  const descriptionRef = useRef(null)
  // 2. NEW: Refs for new fields for keyboard navigation
  const uomStoreRef = useRef(null)
  const uomPurchaseRef = useRef(null)
  const conversionRef = useRef(null)

  const statusOptions = ['Active', 'Inactive']

  const initDB = async () => {
    // FIX: Increment the database version to resolve VersionError
    const db = await openDB(DB_NAME, 2, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
        }
      }
    })
    return db
  }

  const loadRows = async () => {
    const db = await initDB()
    const allRows = await db.getAll(STORE_NAME)
    setRows(allRows.sort((a, b) => b.id - a.id))
  }

  useEffect(() => {
    loadRows()
  }, [])

  const toggleDrawer = () => setOpen(prev => !prev)
  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value })
  const handleSearch = e => {
    setSearchText(e.target.value)
    setPage(1)
  }

  const handleAdd = () => {
    setIsEdit(false)
    setEditRow(null)
    // 3. UPDATED: Reset formData with new fields
    setFormData({ name: '', description: '', status: 'Active', uomStore: '', uomPurchase: '', conversion: '' })
    setOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setEditRow(row)
    // 4. UPDATED: Spread row data into formData (will include new fields if they exist on the row)
    setFormData({ ...row })
    setOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  const handleDelete = async row => {
    const db = await initDB()
    await db.delete(STORE_NAME, row.id)
    setRows(prev => prev.filter(r => r.id !== row.id))
  }

  const handleSubmit = async e => {
    if (e && e.preventDefault) e.preventDefault()
    if (!formData.name) return

    const db = await initDB()
    let rowToSave
    if (isEdit && editRow) {
      // 5. No change needed here, editRow is merged with new formData
      rowToSave = { ...editRow, ...formData }
      await db.put(STORE_NAME, rowToSave)
      setRows(prev => prev.map(r => (r.id === editRow.id ? rowToSave : r)))
    } else {
      // 6. No change needed here, formData contains all fields
      const newRowData = { ...formData }
      const newId = await db.add(STORE_NAME, newRowData)
      rowToSave = { ...newRowData, id: newId }
      setRows(prev => [rowToSave, ...prev.filter(r => r.id !== newId)].sort((a, b) => b.id - a.id))
    }
    toggleDrawer()
    setSortField('id')
    setSortDirection('desc')
  }

  const handleExport = () => {
    if (!rows.length) return
    // 7. UPDATED: Add new headers for export
    const headers = ['ID', 'UOM Name', 'Description', 'Status', 'UOM Store', 'UOM Purchase', 'Conversion']
    // 8. UPDATED: Add new fields to CSV rows
    const csvRows = rows.map(r =>
      [r.id, `"${r.name}"`, `"${r.description}"`, r.status, `"${r.uomStore || ''}"`, `"${r.uomPurchase || ''}"`, r.conversion || ''].join(',')
    )
    const csv = [headers.join(','), ...csvRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'uom-list.csv'
    a.click()
    URL.revokeObjectURL(url)
    setExportAnchorEl(null)
  }

  const focusNext = ref => ref?.current?.focus()
  const handleKeyPress = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (nextRef) focusNext(nextRef)
      else submitRef.current?.focus()
    }
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <ArrowUpwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
    ) : (
      <ArrowDownwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
    )
  }

  const handleSort = field => {
    if (sortField === field) setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDirection('asc')
    }
    setPage(1)
  }

  const sortedRows = [...rows].sort((a, b) => {
    const aValue = a[sortField] || ''
    const bValue = b[sortField] || ''
    let comparison = 0
    if (!isNaN(Number(aValue)) && !isNaN(Number(bValue)) && sortField === 'id')
      comparison = Number(aValue) - Number(bValue)
    else comparison = String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' })
    return sortDirection === 'asc' ? comparison : comparison * -1
  })

  // 9. UPDATED: Include new fields in search filter
  const filteredRows = sortedRows.filter(
    row =>
      row.name.toLowerCase().includes(searchText.toLowerCase()) ||
      row.description.toLowerCase().includes(searchText.toLowerCase()) ||
      row.uomStore?.toLowerCase().includes(searchText.toLowerCase()) ||
      row.uomPurchase?.toLowerCase().includes(searchText.toLowerCase()) ||
      row.conversion?.toString().includes(searchText.toLowerCase())
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
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <Link
          href='/admin/dashboards'
          style={{
            textDecoration: 'none',
            fontSize: 14,
            color: theme.palette.primary.main
          }}
        >
          Dashboard
        </Link>
        <Typography sx={{ mx: 1, color: 'text.secondary' }}>/</Typography>
        <Typography variant='body2' sx={{ fontSize: 14 }}>
          Unit of Measurement
        </Typography>
      </Box>

      <Card sx={{ p: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant='h6'>Unit of Measurement List</Typography>
          <Box display='flex' gap={1}>
            <Button
              variant='outlined'
              endIcon={<ArrowDropDownIcon />}
              onClick={e => setExportAnchorEl(e.currentTarget)}
            >
              Export
            </Button>
            <Button variant='contained' startIcon={<AddIcon />} onClick={handleAdd}>
              Add UOM
            </Button>
            <Menu anchorEl={exportAnchorEl} open={exportOpen} onClose={() => setExportAnchorEl(null)}>
              <MenuItem onClick={handleExport}>Download CSV</MenuItem>
            </Menu>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

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
            placeholder='Search by Name, Description, UOM Store/Purchase or Conversion...'
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

        <Box sx={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: '1100px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>
                <th
                  onClick={() => handleSort('id')}
                  style={{ padding: '12px', width: '60px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    S.No <SortIcon field='id' />
                  </Box>
                </th>
                <th style={{ padding: '12px', width: '100px' }}>Action</th>
                <th
                  onClick={() => handleSort('name')}
                  style={{ padding: '12px', width: '150px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    UOM Name <SortIcon field='name' />
                  </Box>
                </th>
                {/* 10. NEW: Table headers for new fields */}
                <th
                  onClick={() => handleSort('uomStore')}
                  style={{ padding: '12px', width: '100px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    UOM Store <SortIcon field='uomStore' />
                  </Box>
                </th>
                <th
                  onClick={() => handleSort('uomPurchase')}
                  style={{ padding: '12px', width: '100px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    UOM Purchase <SortIcon field='uomPurchase' />
                  </Box>
                </th>
                <th
                  onClick={() => handleSort('conversion')}
                  style={{ padding: '12px', width: '100px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Conversion <SortIcon field='conversion' />
                  </Box>
                </th>
                <th
                  onClick={() => handleSort('description')}
                  style={{ padding: '12px', width: '340px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Description <SortIcon field='description' />
                  </Box>
                </th>
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
                      <IconButton size='small' onClick={() => handleEdit(r)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size='small' color='error' onClick={() => handleDelete(r)}>
                        <MdDelete />
                      </IconButton>
                    </Box>
                  </td>
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.name}</td>
                  {/* 11. NEW: Table cells for new fields */}
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.uomStore}</td>
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.uomPurchase}</td>
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.conversion}</td>
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

      <Drawer anchor='right' open={open} onClose={toggleDrawer}>
        <Box sx={{ width: 360, p: 3 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6'>{isEdit ? 'Edit UOM' : 'Add New UOM'}</Typography>
            <IconButton onClick={toggleDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>

          <form onSubmit={handleSubmit}>
            <CustomTextField
              inputRef={nameRef}
              fullWidth
              margin='normal'
              label='UOM Name'
              name='name'
              value={formData.name}
              onChange={handleChange}
              // 12. UPDATED: Next focus is now uomStoreRef
              onKeyDown={e => handleKeyPress(e, uomStoreRef)}
              required
            />
            {/* 13. NEW: UOM Store field */}
            <CustomTextField
              inputRef={uomStoreRef}
              fullWidth
              margin='normal'
              label='UOM Store'
              name='uomStore'
              value={formData.uomStore}
              onChange={handleChange}
              onKeyDown={e => handleKeyPress(e, uomPurchaseRef)}
              required
            />
            {/* 14. NEW: UOM Purchase field */}
            <CustomTextField
              inputRef={uomPurchaseRef}
              fullWidth
              margin='normal'
              label='UOM Purchase'
              name='uomPurchase'
              value={formData.uomPurchase}
              onChange={handleChange}
              onKeyDown={e => handleKeyPress(e, conversionRef)}
              required
            />
            {/* 15. NEW: Conversion field */}
            <CustomTextField
              inputRef={conversionRef}
              fullWidth
              margin='normal'
              label='Conversion'
              name='conversion'
              type='number'
              value={formData.conversion}
              onChange={handleChange}
              onKeyDown={e => handleKeyPress(e, descriptionRef)}
            />
            <CustomTextField
              inputRef={descriptionRef}
              fullWidth
              margin='normal'
              label='Description'
              name='description'
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={4}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (isEdit) focusNext(statusRef)
                  else submitRef.current?.focus()
                }
              }}
            />
            {isEdit && (
              <CustomTextField
                select
                fullWidth
                margin='normal'
                label='Status'
                name='status'
                value={formData.status}
                inputRef={statusRef}
                onChange={async e => {
                  const newStatus = e.target.value
                  setFormData(prev => ({ ...prev, status: newStatus }))
                  if (editRow) {
                    const updatedRow = { ...editRow, status: newStatus }
                    setRows(prev => prev.map(r => (r.id === editRow.id ? updatedRow : r)))
                    const db = await initDB()
                    await db.put(STORE_NAME, updatedRow)
                  }
                }}
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
