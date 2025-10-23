'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Box,
  Button,
  IconButton,
  Drawer,
  InputAdornment,
  Typography,
  Menu,
  MenuItem,
  ListItemText,
  FormControl,
  Select,
  Pagination,
  Card,
  Divider,
  Autocomplete
} from '@mui/material'
import Link from 'next/link'

// Icons
import { MdDelete } from 'react-icons/md'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import EditIcon from '@mui/icons-material/Edit'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import DeleteIcon from '@mui/icons-material/Delete' // For sub-drawer delete

// Wrapper
import CustomTextField from '@core/components/mui/TextField'

// IndexedDB
import { openDB } from 'idb'

// --- IndexedDB Configuration ---
const DB_NAME = 'PestDB'
const STORE_NAME = 'pests'

async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

async function getAllPests() {
  const db = await initDB()
  return db.getAll(STORE_NAME)
}

async function addPest(pest) {
  const db = await initDB()
  const newId = await db.add(STORE_NAME, pest)
  // Fetch the saved object to get its final ID and structure
  const allRows = await db.getAll(STORE_NAME)
  return allRows.find(r => r.id === newId) || { ...pest, id: newId }
}

async function updatePest(pest) {
  const db = await initDB()
  await db.put(STORE_NAME, pest)
  return pest
}

async function deletePest(id) {
  const db = await initDB()
  await db.delete(STORE_NAME, id)
}

// Map drawerType to data key
const getKeyFromDrawerType = type => {
  switch (type.toLowerCase()) {
    case 'chemicals':
      return 'chemicals'
    case 'checklist':
      return 'checklist'
    case 'finding':
      return 'finding'
    case 'action':
      return 'action'
    case 'adddesc':
    case 'add description':
      return 'addDesc'
    default:
      return 'addDesc'
  }
}

// Helper component to render the sort icon
const SortIcon = ({ currentSortField, currentSortDirection, field }) => {
  if (currentSortField !== field) return null
  return currentSortDirection === 'asc' ? (
    <ArrowUpwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
  ) : (
    <ArrowDownwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
  )
}

// --- Main Component ---
export default function PestPage() {
  // ---------------- State Management ----------------
  // Main Drawer
  const [mainDrawerOpen, setMainDrawerOpen] = useState(false)
  const [editPest, setEditPest] = useState(null)
  const [mainFormData, setMainFormData] = useState({
    pest_code: '',
    parent_code: '',
    name: '',
    value: '',
    description: '',
    status: 'Active',
    user_role: 'Admin'
  })
  const statusOptions = ['Active', 'Inactive']

  // Sub Drawer
  const [subDrawerOpen, setSubDrawerOpen] = useState(false)
  const [drawerType, setDrawerType] = useState('Finding')
  const [formData, setFormData] = useState({ name: '', status: 'Active' })
  const [editRow, setEditRow] = useState(null)
  const [selectedPestId, setSelectedPestId] = useState(null)

  // Table & Search
  const [rows, setRows] = useState([])
  const [searchText, setSearchText] = useState('')
  const [sortField, setSortField] = useState('id')
  const [sortDirection, setSortDirection] = useState('desc')

  // Pagination
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // UI State
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const exportOpen = Boolean(exportAnchorEl)

  const submitRef = useRef(null)
  const statusInputRef = useRef(null)

  // Load data from IndexedDB on mount
  useEffect(() => {
    async function fetchData() {
      const pests = await getAllPests()
      setRows(pests.sort((a, b) => b.id - a.id))
    }
    fetchData()
  }, [])

  // ---------------- Sorting, Filtering, and Pagination Logic ----------------
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
    if (['id', 'value'].includes(sortField) && !isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
      comparison = Number(aValue) - Number(bValue)
    } else {
      comparison = String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' })
    }

    return sortDirection === 'asc' ? comparison : comparison * -1
  })

  const handleSearch = e => {
    setSearchText(e.target.value)
    setPage(1)
  }

  const filteredRows = sortedRows.filter(
    r =>
      r.name.toLowerCase().includes(searchText.toLowerCase()) ||
      r.pest_code.toLowerCase().includes(searchText.toLowerCase()) ||
      r.parent_code.toLowerCase().includes(searchText.toLowerCase())
  )

  const rowCount = filteredRows.length
  const pageCount = Math.max(1, Math.ceil(rowCount / rowsPerPage))
  const paginatedRows = filteredRows.slice((page - 1) * rowsPerPage, page * rowsPerPage)
  const startIndex = rowCount === 0 ? 0 : (page - 1) * rowsPerPage + 1
  const endIndex = Math.min(page * rowsPerPage, rowCount)

  // ---------------- Main Drawer Functions ----------------
  const handleKeyPress = e => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const form = e.target.form
      const inputs = Array.from(form.querySelectorAll('input, textarea')).filter(
        el => !el.disabled && el.type !== 'hidden'
      )
      const nextIndex = inputs.findIndex(input => input === e.target) + 1
      if (nextIndex < inputs.length) inputs[nextIndex].focus()
      else submitRef.current?.focus()
    }
  }

  const handleMainSubmit = async () => {
    if (!mainFormData.pest_code || !mainFormData.name) return

    if (editPest) {
      const updated = { ...editPest, ...mainFormData }
      const updatedRow = await updatePest(updated)
      setRows(prev => prev.map(r => (r.id === updatedRow.id ? updatedRow : r)))
    } else {
      const newPest = {
        ...mainFormData,
        finding: [],
        action: [],
        chemicals: [],
        checklist: [],
        addDesc: []
      }
      const savedPest = await addPest(newPest)
      setRows(prev => [savedPest, ...prev].sort((a, b) => b.id - a.id))
      setSortField('id')
      setSortDirection('desc')
    }

    setMainFormData({
      pest_code: '',
      parent_code: '',
      name: '',
      value: '',
      description: '',
      status: 'Active',
      user_role: 'Admin'
    })
    setEditPest(null)
    setMainDrawerOpen(false)
  }

  const handleMainDelete = async row => {
    setRows(prev => prev.filter(r => r.id !== row.id))
    await deletePest(row.id)
  }

  // ---------------- Sub Drawer Functions ----------------
  const openSubDrawer = (row, type) => {
    setSelectedPestId(row.id)
    setDrawerType(type)
    setFormData({ name: '', status: 'Active' })
    setEditRow(null)
    setSubDrawerOpen(true)
  }

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleAddItem = async () => {
    if (!formData.name) return
    const key = getKeyFromDrawerType(drawerType)

    const updatedRows = await Promise.all(
      rows.map(async r => {
        if (r.id !== selectedPestId) return r

        let newRow
        if (editRow) {
          // Update existing sub-item
          newRow = { ...r, [key]: r[key].map(f => (f.id === editRow.id ? { ...f, ...formData } : f)) }
        } else {
          // Add new sub-item
          const newSubId = r[key]?.length ? Math.max(...r[key].map(f => f.id)) + 1 : 1
          newRow = { ...r, [key]: [...(r[key] || []), { id: newSubId, ...formData }] }
        }
        await updatePest(newRow)
        return newRow
      })
    )
    setRows(updatedRows.sort((a, b) => b.id - a.id))

    setFormData({ name: '', status: 'Active' })
    setEditRow(null)
  }

  const handleSubEdit = row => {
    setFormData({ name: row.name, status: row.status })
    setEditRow(row)
  }

  const handleSubDelete = async id => {
    const key = getKeyFromDrawerType(drawerType)

    const updatedRows = await Promise.all(
      rows.map(async r => {
        if (r.id !== selectedPestId) return r
        const newRow = { ...r, [key]: (r[key] || []).filter(f => f.id !== id) }
        await updatePest(newRow)
        return newRow
      })
    )
    setRows(updatedRows.sort((a, b) => b.id - a.id))
  }

  const getDrawerRows = () => {
    if (!selectedPestId) return []
    const pest = rows.find(r => r.id === selectedPestId)
    if (!pest) return []
    const key = getKeyFromDrawerType(drawerType)
    return pest[key] || []
  }

  // ---------------- Export Functions ----------------
  const handleExportClick = e => setExportAnchorEl(e.currentTarget)
  const handleExportClose = () => setExportAnchorEl(null)
  const handleExportSelect = type => {
    alert(`Export as: ${type}`)
    handleExportClose()
  }

  return (
    <Box>
      {/* Breadcrumb */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', ml: 6 }}>
        <Typography
          component='span' // Renders as an inline element
          variant='body2' // Uses the theme's body2 font style
          sx={{
            // Use 'primary.main' to access the theme's main primary color
            color: 'primary.main',
            fontSize: 14,
            '&:hover': {
              textDecoration: 'none'
            }
          }}
        >
          Dashboard
        </Typography>
        <Typography sx={{ mx: 1, color: 'text.secondary' }}>/</Typography>
        <Typography variant='body2' sx={{ fontSize: 14 }}>
          Service Type (Pest)
        </Typography>
      </Box>

      <Card sx={{ p: 6 }}>
        {/* Header + actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant='h6'>Pest List</Typography>

          <Box display='flex' gap={1}>
            <Button variant='outlined' endIcon={<ArrowDropDownIcon />} onClick={handleExportClick}>
              Export
            </Button>
            <Menu anchorEl={exportAnchorEl} open={exportOpen} onClose={handleExportClose}>
              <MenuItem onClick={() => handleExportSelect('print')}>
                <ListItemText>Print</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleExportSelect('csv')}>
                <ListItemText>CSV</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleExportSelect('excel')}>
                <ListItemText>Excel</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleExportSelect('pdf')}>
                <ListItemText>PDF</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleExportSelect('copy')}>
                <ListItemText>Copy</ListItemText>
              </MenuItem>
            </Menu>
            <Button
              variant='contained'
              startIcon={<AddIcon />}
              onClick={() => {
                setEditPest(null)
                setMainFormData({
                  pest_code: '',
                  parent_code: '',
                  name: '',
                  value: '',
                  description: '',
                  status: 'Active',
                  user_role: 'Admin'
                })
                setMainDrawerOpen(true)
              }}
            >
              Add Pest
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Search / entries */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <FormControl size='small' sx={{ minWidth: 120 }}>
            <Select
              value={rowsPerPage}
              onChange={e => {
                setRowsPerPage(Number(e.target.value))
                setPage(1)
              }}
            >
              {[5, 10, 25, 50, 100].map(i => (
                <MenuItem key={i} value={i}>
                  {i} entries
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <CustomTextField
            size='small'
            placeholder='Search by Code or Name...'
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

        {/* --- Table (Manual HTML Table) --- */}
        <Box sx={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              tableLayout: 'auto'
            }}
          >
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>
                <th
                  onClick={() => handleSort('id')}
                  style={{ padding: '12px', width: '60px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    S.No <SortIcon currentSortField={sortField} currentSortDirection={sortDirection} field='id' />
                  </Box>
                </th>

                <th style={{ padding: '12px', width: '100px' }}>Action</th>

                <th
                  onClick={() => handleSort('pest_code')}
                  style={{ padding: '12px', minWidth: '150px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Pest Code{' '}
                    <SortIcon currentSortField={sortField} currentSortDirection={sortDirection} field='pest_code' />
                  </Box>
                </th>

                <th
                  onClick={() => handleSort('parent_code')}
                  style={{ padding: '12px', minWidth: '400px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Parent Group{' '}
                    <SortIcon currentSortField={sortField} currentSortDirection={sortDirection} field='parent_code' />
                  </Box>
                </th>

                <th
                  onClick={() => handleSort('name')}
                  style={{ padding: '12px', minWidth: '180px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Display Pest Name{' '}
                    <SortIcon currentSortField={sortField} currentSortDirection={sortDirection} field='name' />
                  </Box>
                </th>

                <th
                  onClick={() => handleSort('value')}
                  style={{ padding: '12px', minWidth: '100px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Value <SortIcon currentSortField={sortField} currentSortDirection={sortDirection} field='value' />
                  </Box>
                </th>

                <th style={{ padding: '12px', minWidth: '120px' }}>Finding</th>
                <th style={{ padding: '12px', minWidth: '120px' }}>Action</th>
                <th style={{ padding: '12px', minWidth: '120px' }}>Chemicals</th>
                <th style={{ padding: '12px', minWidth: '120px' }}>Checklist</th>
                <th style={{ padding: '12px', minWidth: '150px' }}>Add Description</th>

                <th
                  onClick={() => handleSort('status')}
                  style={{ padding: '12px', minWidth: '100px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box display='flex' alignItems='center'>
                    Status <SortIcon currentSortField={sortField} currentSortDirection={sortDirection} field='status' />
                  </Box>
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedRows.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td
                    style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word', wordBreak: 'break-word' }}
                  >
                    {(page - 1) * rowsPerPage + i + 1}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size='small'
                        onClick={() => {
                          setEditPest(r)
                          setMainFormData(prev => ({ ...prev, ...r }))
                          setMainDrawerOpen(true)
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton size='small' color='error' onClick={() => handleMainDelete(r)}>
                        <MdDelete />
                      </IconButton>
                    </Box>
                  </td>
                  {/* Text wrapping applied here */}
                  <td
                    style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word', wordBreak: 'break-word' }}
                  >
                    {r.pest_code}
                  </td>
                  <td
                    style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word', wordBreak: 'break-word' }}
                  >
                    {r.parent_code}
                  </td>
                  <td
                    style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word', wordBreak: 'break-word' }}
                  >
                    {r.name}
                  </td>
                  <td
                    style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word', wordBreak: 'break-word' }}
                  >
                    {r.value}
                  </td>
                  {/* Button columns */}
                  <td style={{ padding: '12px', whiteSpace: 'normal' }}>
                    <Button
                      variant='outlined'
                      size='small'
                      onClick={() => openSubDrawer(r, 'Finding')}
                      sx={{ borderRadius: '999px', px: 2, textWrap: 'nowrap' }}
                    >
                      Finding({r.finding?.length || 0})
                    </Button>
                  </td>
                  <td style={{ padding: '12px', whiteSpace: 'normal' }}>
                    <Button
                      variant='outlined'
                      size='small'
                      onClick={() => openSubDrawer(r, 'Action')}
                      sx={{ borderRadius: '999px', px: 2, textWrap: 'nowrap' }}
                    >
                      Action({r.action?.length || 0})
                    </Button>
                  </td>
                  <td style={{ padding: '12px', whiteSpace: 'normal' }}>
                    <Button
                      variant='outlined'
                      size='small'
                      onClick={() => openSubDrawer(r, 'Chemicals')}
                      sx={{ borderRadius: '999px', px: 2, textWrap: 'nowrap' }}
                    >
                      Chemicals({r.chemicals?.length || 0})
                    </Button>
                  </td>
                  <td style={{ padding: '12px', whiteSpace: 'normal' }}>
                    <Button
                      variant='outlined'
                      size='small'
                      onClick={() => openSubDrawer(r, 'Checklist')}
                      sx={{ borderRadius: '999px', px: 2, textWrap: 'nowrap' }}
                    >
                      Checklist({r.checklist?.length || 0})
                    </Button>
                  </td>
                  <td style={{ padding: '12px', whiteSpace: 'normal' }}>
                    <Button
                      variant='outlined'
                      size='small'
                      onClick={() => openSubDrawer(r, 'Add Description')}
                      sx={{ borderRadius: '999px', px: 2, textWrap: 'nowrap' }}
                    >
                      AddDesc({r.addDesc?.length || 0})
                    </Button>
                  </td>
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
        {/* --- End Table --- */}

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
              onChange={(e, value) => setPage(value)}
              shape='rounded'
              color='primary'
              showFirstButton
              showLastButton
            />
          </Box>
        </Box>
      </Card>

      {/* --- Main Drawer --- */}
      <Drawer anchor='right' open={mainDrawerOpen} onClose={() => setMainDrawerOpen(false)}>
        <Box sx={{ width: 400, p: 3 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6'>{editPest ? 'Edit Pest' : 'Add New Pest'}</Typography>
            <IconButton onClick={() => setMainDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <form>
            <CustomTextField
              fullWidth
              margin='normal'
              label='Service Type Code'
              name='pest_code'
              value={mainFormData.pest_code}
              onChange={e => setMainFormData({ ...mainFormData, pest_code: e.target.value })}
              onKeyDown={handleKeyPress}
            />
            <CustomTextField
              fullWidth
              margin='normal'
              label='Parent Pest Group Code'
              name='parent_code'
              value={mainFormData.parent_code}
              onChange={e => setMainFormData({ ...mainFormData, parent_code: e.target.value })}
              onKeyDown={handleKeyPress}
            />
            <CustomTextField
              fullWidth
              margin='normal'
              label='Display Pest Name'
              name='name'
              value={mainFormData.name}
              onChange={e => setMainFormData({ ...mainFormData, name: e.target.value })}
              onKeyDown={handleKeyPress}
            />
            <CustomTextField
              fullWidth
              margin='normal'
              label='Pest Value'
              name='value'
              type='text'
              inputProps={{ inputMode: 'decimal' }}
              value={mainFormData.value}
              onChange={e => {
                const numericValue = e.target.value.match(/^-?\d*\.?\d*$/)?.[0] || ''
                setMainFormData({ ...mainFormData, value: numericValue })
              }}
              onKeyDown={handleKeyPress}
            />
            <CustomTextField
              fullWidth
              margin='normal'
              label='Description'
              name='description'
              multiline
              rows={3}
              value={mainFormData.description}
              onChange={e => setMainFormData({ ...mainFormData, description: e.target.value })}
              onKeyDown={handleKeyPress}
            />

            {/* Status only visible in Edit mode */}
            {editPest && (
              <Autocomplete
                freeSolo={false}
                options={statusOptions}
                value={mainFormData.status}
                openOnFocus
                onChange={(e, val) => {
                  setMainFormData(prev => ({ ...prev, status: val }))
                }}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    label='Status'
                    inputRef={statusInputRef}
                    onKeyDown={e => {
                      if (e.key === 'Enter') submitRef.current?.focus()
                    }}
                  />
                )}
                sx={{ mt: 2 }}
              />
            )}

            <Box mt={3} display='flex' gap={2}>
              <Button type='button' variant='contained' fullWidth ref={submitRef} onClick={handleMainSubmit}>
                {editPest ? 'Update' : 'Submit'}
              </Button>
              <Button variant='outlined' fullWidth onClick={() => setMainDrawerOpen(false)}>
                Cancel
              </Button>
            </Box>
          </form>
        </Box>
      </Drawer>

      {/* --- Sub Drawer (For Finding/Action/Chemicals etc.) --- */}
      <Drawer anchor='right' open={subDrawerOpen} onClose={() => setSubDrawerOpen(false)}>
        <Box sx={{ width: 550, p: 4 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6'>Manage {drawerType}</Typography>
            <IconButton onClick={() => setSubDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <CustomTextField
            fullWidth
            label={`${drawerType} Name`}
            name='name'
            value={formData.name}
            onChange={handleChange}
            margin='normal'
          />
          <CustomTextField
            fullWidth
            margin='normal'
            label='Status'
            name='status'
            select
            value={formData.status}
            onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
          >
            <MenuItem value='Active'>Active</MenuItem>
            <MenuItem value='Inactive'>Inactive</MenuItem>
          </CustomTextField>
          <Button variant='contained' fullWidth sx={{ mt: 2 }} onClick={handleAddItem}>
            {editRow ? 'Update' : 'Add'} {drawerType}
          </Button>
          <Box mt={3}>
            <Typography variant='subtitle1' mb={1}>
              {drawerType} List
            </Typography>
            {/* Manual table for sub-drawer list */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                tableLayout: 'fixed'
              }}
            >
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ padding: '12px', width: '100px' }}>Actions</th>
                  <th style={{ padding: '12px', width: '300px' }}>{drawerType} Name</th>
                  <th style={{ padding: '12px', width: '100px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {getDrawerRows().map(row => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '12px' }}>
                      <IconButton size='small' onClick={() => handleSubEdit(row)}>
                        <EditIcon fontSize='small' />
                      </IconButton>
                      <IconButton size='small' color='error' onClick={() => handleSubDelete(row.id)}>
                        <DeleteIcon fontSize='small' />
                      </IconButton>
                    </td>
                    {/* Text wrapping applied here */}
                    <td
                      style={{ padding: '12px', whiteSpace: 'normal', wordWrap: 'break-word', wordBreak: 'break-word' }}
                    >
                      {row.name}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <Box
                        component='span'
                        sx={{
                          fontWeight: 600,
                          color: '#fff',
                          backgroundColor: row.status === 'Active' ? 'success.main' : 'error.main',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: '6px',
                          display: 'inline-block'
                        }}
                      >
                        {row.status}
                      </Box>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Box>
      </Drawer>
    </Box>
  )
}
