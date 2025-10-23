

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
  Card, // 💡 ADDED
  Divider, // 💡 ADDED
  FormControl, // 💡 ADDED
  Select, // 💡 ADDED
  Pagination, // 💡 ADDED
  Menu, // 💡 ADDED
  Checkbox // KEPT
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
// Icons
import AddIcon from '@mui/icons-material/Add'
import DownloadIcon from '@mui/icons-material/Download'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
// 💡 ADDED from page A for sorting/dropdown
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import { MdDelete } from 'react-icons/md'

// Removed ContentLayout
import CustomTextField from '@core/components/mui/TextField'
import Link from 'next/link' // 💡 ADDED for Breadcrumb

export default function UserPrivilegePage() {
  const [rows, setRows] = useState([])
  // 💡 UPDATED: 1-based page, pageSize
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchText, setSearchText] = useState('')
  const [open, setOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editRow, setEditRow] = useState(null)

  // 💡 ADDED: Sorting State
  const [sortField, setSortField] = useState('id')
  const [sortDirection, setSortDirection] = useState('desc')

  // 💡 ADDED: Export Menu State
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const exportOpen = Boolean(exportAnchorEl)

  const [formData, setFormData] = useState({ module: '', create: false, view: false, update: false, delete: false })
  const submitRef = useRef(null)
  const dbName = 'UserPrivilegeDB'
  const storeName = 'modules'

  // Initialize IndexedDB
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

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      const db = await initDB()
      const allRows = await db.getAll(storeName)
      allRows.sort((a, b) => b.id - a.id)
      setRows(allRows)
    }
    fetchData()
  }, [])

  const toggleDrawer = () => setOpen(prev => !prev)

  const handleAdd = () => {
    setIsEdit(false)
    setEditRow(null) // Reset edit row
    setFormData({ module: '', create: false, view: false, update: false, delete: false })
    setOpen(true)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setEditRow(row)
    setFormData({ ...row })
    setOpen(true)
  }

  const handleDelete = async row => {
    const db = await initDB()
    await db.delete(storeName, row.id)
    setRows(prev => prev.filter(r => r.id !== row.id))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!formData.module) return

    const db = await initDB()
    const dataToSave = {
      module: formData.module,
      create: formData.create,
      view: formData.view,
      update: formData.update,
      delete: formData.delete
    }

    if (isEdit && editRow) {
      const updatedData = { ...dataToSave, id: editRow.id }
      await db.put(storeName, updatedData)
      setRows(prev => prev.map(r => (r.id === editRow.id ? updatedData : r)))
    } else {
      const id = await db.add(storeName, dataToSave)
      const newRow = { ...dataToSave, id }
      setRows(prev => [newRow, ...prev].sort((a, b) => b.id - a.id))
    }
    toggleDrawer()
    setSortField('id') // Reset sorting after submission
    setSortDirection('desc')
  }

  const handleSearch = e => {
    setSearchText(e.target.value)
    setPage(1) // Reset page on search
  }

  // 💡 ADDED: Sorting Handler (from page A)
  const handleSort = field => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setPage(1)
  }

  // 💡 ADDED: Export Handler (adapted from page A)
  const handleExport = () => {
    if (!rows.length) return
    const headers = ['ID', 'Module', 'Create', 'View', 'Update', 'Delete']
    const csvRows = rows.map(r =>
      [
        r.id,
        `"${r.module}"`,
        r.create ? 'Yes' : 'No',
        r.view ? 'Yes' : 'No',
        r.update ? 'Yes' : 'No',
        r.delete ? 'Yes' : 'No'
      ].join(',')
    )
    const csv = [headers.join(','), ...csvRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'user-privileges.csv'
    a.click()
    URL.revokeObjectURL(url)
    setExportAnchorEl(null)
  }

  // 💡 ADDED: Sort Icon Helper (from page A)
  const SortIcon = ({ field }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 16, ml: 0.5 }} /> : <ArrowDownwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
  }

  // 💡 ADDED: Sorting Logic
  const sortedRows = [...rows].sort((a, b) => {
    const aValue = a[sortField] || ''
    const bValue = b[sortField] || ''

    let comparison = 0
    if (['id'].includes(sortField)) {
      comparison = Number(aValue) - Number(bValue)
    } else {
      comparison = String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' })
    }

    return sortDirection === 'asc' ? comparison : comparison * -1
  })

  // 💡 UPDATED: Filtering Logic (using sortedRows)
  const filteredRows = sortedRows.filter(
    row =>
      row.module.toLowerCase().includes(searchText.toLowerCase())
  )

  // 💡 UPDATED: Pagination Logic (from page A)
  const rowCount = filteredRows.length
  const pageCount = Math.max(1, Math.ceil(rowCount / pageSize))
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)
  const startIndex = rowCount === 0 ? 0 : (page - 1) * pageSize + 1
  const endIndex = Math.min(page * pageSize, rowCount)
  const paginationText = `Showing ${startIndex} to ${endIndex} of ${rowCount} entries`

  // 💡 ADDED: Table structure definition
  const tableColumns = [
    { label: 'Module', field: 'module', minWidth: '250px' },
    { label: 'Create', field: 'create', minWidth: '100px' },
    { label: 'View', field: 'view', minWidth: '100px' },
    { label: 'Edit/Update', field: 'update', minWidth: '140px' },
    { label: 'Delete', field: 'delete', minWidth: '100px' }
  ];
  // Calculate minimum width dynamically
  const totalMinWidth = 60 + 100 + tableColumns.reduce((sum, col) => sum + parseInt(col.minWidth), 0) + 'px';
  const theme = useTheme()

  return (
    <Box>
      {/* Breadcrumb (from page A) */}
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
          User Privilege
        </Typography>
      </Box>

      <Card sx={{ p: 6 }}>
        {/* Header + actions (from page A) */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant='h6'>User Privilege List</Typography>

          <Box display='flex' gap={1}>
            <Button
              variant='outlined'
              endIcon={<ArrowDropDownIcon />}
              onClick={e => setExportAnchorEl(e.currentTarget)}
            >
              Export
            </Button>
            <Button variant='contained' startIcon={<AddIcon />} onClick={handleAdd}>
              Add Module
            </Button>
            {/* Export Menu */}
             <Menu anchorEl={exportAnchorEl} open={exportOpen} onClose={() => setExportAnchorEl(null)}>
                <MenuItem onClick={handleExport}>Download CSV</MenuItem>
              </Menu>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Search / entries (from page A) */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <FormControl size='small' sx={{ minWidth: 120 }}>
            {/* Rows per page control */}
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

          {/* Search TextField */}
          <CustomTextField
            size='small'
            placeholder='Search by Module...'
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

        {/* Table (Manual HTML Table from page A) */}
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
                      {col.label}
                      {/* Sort only on 'Module' and 'S.No'/'id' */}
                      {['module'].includes(col.field) ? <SortIcon field={col.field} /> : null}
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
                  <td style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.module}</td>
                  {/* Checkbox Cells */}
                  <td style={{ padding: '12px', textAlign: 'start' }}><Checkbox checked={r.create} disabled size='small' /></td>
                  <td style={{ padding: '12px', textAlign: 'start' }}><Checkbox checked={r.view} disabled size='small' /></td>
                  <td style={{ padding: '12px', textAlign: 'start' }}><Checkbox checked={r.update} disabled size='small' /></td>
                  <td style={{ padding: '12px', textAlign: 'start' }}><Checkbox checked={r.delete} disabled size='small' /></td>
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

        {/* Pagination (from page A) */}
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

      {/* Drawer Form - No structural change needed here */}
      <Drawer anchor='right' open={open} onClose={toggleDrawer}>
        <Box sx={{ width: 360, p: 3 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6'>{isEdit ? 'Edit Module' : 'Add New Module'}</Typography>
            <IconButton onClick={toggleDrawer}><CloseIcon /></IconButton>
          </Box>

          <form onSubmit={handleSubmit}>
            <CustomTextField
              fullWidth
              margin='normal'
              label='Module'
              name='module'
              value={formData.module}
              onChange={e => setFormData(prev => ({ ...prev, module: e.target.value }))}
            />

            <Box display='flex' flexDirection='column' mt={2} gap={1}>
              <Box><Checkbox checked={formData.create} onChange={() => setFormData(prev => ({ ...prev, create: !prev.create }))} /> Create</Box>
              <Box><Checkbox checked={formData.view} onChange={() => setFormData(prev => ({ ...prev, view: !prev.view }))} /> View</Box>
              <Box><Checkbox checked={formData.update} onChange={() => setFormData(prev => ({ ...prev, update: !prev.update }))} /> Edit/Update</Box>
              <Box><Checkbox checked={formData.delete} onChange={() => setFormData(prev => ({ ...prev, delete: !prev.delete }))} /> Delete</Box>
            </Box>

            <Box mt={3} display='flex' gap={2}>
              <Button type='submit' variant='contained' fullWidth ref={submitRef}>{isEdit ? 'Update' : 'Submit'}</Button>
              <Button variant='outlined' fullWidth onClick={toggleDrawer}>Cancel</Button>
            </Box>
          </form>
        </Box>
      </Drawer>
    </Box>
  )
}
