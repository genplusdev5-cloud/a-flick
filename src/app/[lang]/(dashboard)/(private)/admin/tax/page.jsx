'use client'

import { useState, useRef, useEffect } from 'react'
import { openDB } from 'idb'
import {
  Box,
  Button,
  IconButton,
  Drawer,
  InputAdornment,
  Menu,
  MenuItem,
  Typography,
  ListItemText,
  TablePagination
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { MdDelete } from 'react-icons/md'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import DownloadIcon from '@mui/icons-material/Download'
import EditIcon from '@mui/icons-material/Edit'
import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'

export default function TaxPage() {
  const [open, setOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [formData, setFormData] = useState({ name: '', tax_value: '' })
  const [rows, setRows] = useState([])
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const exportOpen = Boolean(exportAnchorEl)

  const nameRef = useRef(null)
  const taxRef = useRef(null)
  const submitRef = useRef(null)

  const DB_NAME = 'tax_db'
  const STORE_NAME = 'taxes'

  // -------- IndexedDB Setup --------
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

  // Helper function to format the number as string with no scientific notation and 2 decimal places
  const formatTaxValue = value => {
    if (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) {
      const num = parseFloat(value)
      if (!isNaN(num)) {
        // Use minimumFractionDigits and maximumFractionDigits to ensure exactly two decimal places (.00)
        return num.toLocaleString('fullwide', {
          useGrouping: false,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
      }
    }
    return ''
  }

  const loadRows = async () => {
    const db = await initDB()
    const allRows = await db.getAll(STORE_NAME)
    const sortedRows = allRows
      .map(r => ({
        ...r,
        // Ensure the stored tax value is formatted for display (e.g., 12.00)
        tax: formatTaxValue(r.tax)
      }))
      .sort((a, b) => b.id - a.id)
    setRows(sortedRows)
  }

  useEffect(() => {
    loadRows()
  }, [])

  const toggleDrawer = () => setOpen(prev => !prev)
  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleAdd = () => {
    setIsEdit(false)
    setFormData({ name: '', tax_value: '' })
    setOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setEditRow(row)
    // row.tax is already formatted with .00 from loadRows
    setFormData({ name: row.name, tax_value: row.tax })
    setOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  const handleDelete = async row => {
    const db = await initDB()
    await db.delete(STORE_NAME, row.id)
    setRows(prev => prev.filter(r => r.id !== row.id))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!formData.name || !formData.tax_value) return

    // The value stored in DB and displayed in table is the formatted one (e.g., "123.00")
    const formattedTax = formatTaxValue(formData.tax_value)

    if (formattedTax === '') return // Basic validation for valid number

    const db = await initDB()
    if (isEdit && editRow) {
      await db.put(STORE_NAME, { ...editRow, name: formData.name, tax: formattedTax })
      setRows(rows.map(r => (r.id === editRow.id ? { ...r, name: formData.name, tax: formattedTax } : r)))
    } else {
      const id = await db.add(STORE_NAME, { name: formData.name, tax: formattedTax, status: 'Active' })
      setRows(prev => [{ id, name: formData.name, tax: formattedTax, status: 'Active' }, ...prev])
    }

    setFormData({ name: '', tax_value: '' })
    toggleDrawer()
  }

  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (field === 'name') taxRef.current?.focus()
      else if (field === 'tax') submitRef.current?.focus()
    }
  }

  const handleSearch = e => setSearchText(e.target.value)
  const handleExportClick = e => setExportAnchorEl(e.currentTarget)
  const handleExportClose = () => setExportAnchorEl(null)
  const handleExportSelect = type => {
    alert(`Export as: ${type}`)
    handleExportClose()
  }

  const handleChangePage = (e, newPage) => setPage(newPage)
  const handleChangeRowsPerPage = e => {
    setRowsPerPage(parseInt(e.target.value, 10))
    setPage(0)
  }

  const filteredRows = rows.filter(r => r.name.toLowerCase().includes(searchText.toLowerCase()))
  const totalRows = filteredRows.length
  const paginatedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  // Dynamically calculate the range text
  const startIndex = totalRows === 0 ? 0 : page * rowsPerPage + 1
  const endIndex = Math.min((page + 1) * rowsPerPage, totalRows)
  const paginationText = `Showing ${startIndex} to ${endIndex} of ${totalRows} entries`

  const columns = [
    {
      field: 'serial',
      headerName: 'S.No',
      flex: 0.2,
      minWidth: 70,
      sortable: false,
      // Find the index in the filteredRows for correct serial numbering
      valueGetter: params => filteredRows.findIndex(r => r.id === params.row.id) + 1
    },
    {
      field: 'action',
      headerName: 'Action',
      flex: 0.5,
      minWidth: 120,
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
    { field: 'name', headerName: 'Tax Name', flex: 1, minWidth: 100 },
    { field: 'tax', headerName: 'Tax (%)', flex: 0.5, minWidth: 100 },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.5,
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

  return (
    <ContentLayout
      title='Tax Management'
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Tax' }]}
      actions={
        <Box sx={{ m: 2, display: 'flex', gap: 2 }}>
          <Button variant='outlined' startIcon={<DownloadIcon />} onClick={handleExportClick}>
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
          <Button variant='contained' startIcon={<AddIcon />} onClick={handleAdd}>
            Add Tax
          </Button>
        </Box>
      }
    >
      <Box sx={{ p: 2, mt: 5, pt: 0 }}>
        <CustomTextField
          size='small'
          placeholder='Search'
          value={searchText}
          onChange={handleSearch}
          sx={{ width: 360 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon />
              </InputAdornment>
            )
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
            minHeight: '50px !important',
            padding: '10px 0'
          },
          '& .MuiDataGrid-cell': {
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            alignItems: 'flex-start',
            fontSize: '15px' // <-- Make row text bigger
          },
          '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
          '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': { outline: 'none' },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontSize: '15px', // header font bigger
            fontWeight: 500
          }
        }}
      />

      {/* Box containing the custom status text and TablePagination */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
        {/* Custom Status Text */}
        <Typography variant='body2' sx={{ color: 'text.secondary', ml: 1 }}>
          {paginationText}
        </Typography>

        {/* Table Pagination Component */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component='div'
          count={totalRows}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          // The TablePagination component automatically displays the page controls
        />
      </Box>

      <Drawer anchor='right' open={open} onClose={toggleDrawer}>
        <Box sx={{ width: 360, p: 3 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6'>{isEdit ? 'Edit Tax' : 'Add Tax'}</Typography>
            <IconButton onClick={toggleDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>

          <form onSubmit={handleSubmit}>
            <CustomTextField
              fullWidth
              label='Tax Name'
              name='name'
              value={formData.name}
              margin='normal'
              inputRef={nameRef}
              onChange={e => {
                const lettersOnly = e.target.value.replace(/[^a-zA-Z\s]/g, '')
                setFormData(prev => ({ ...prev, name: lettersOnly }))
              }}
              onKeyDown={e => handleKeyDown(e, 'name')}
            />

            <CustomTextField
              fullWidth
              label='Tax Value (%)'
              name='tax_value'
              value={formData.tax_value}
              margin='normal'
              inputRef={taxRef}
              onChange={e => {
                const val = e.target.value
                // FIX: On Change, only allow raw numeric input to prevent infinite loop.
                const numericValue = val.match(/^-?\d*\.?\d*$/)?.[0] || ''
                setFormData({ ...formData, tax_value: numericValue })
              }}
              onBlur={e => {
                let val = e.target.value
                if (val !== '' && !isNaN(parseFloat(val))) {
                  // Formatting (.00 suffix) is done ONLY on blur
                  const num = parseFloat(val)
                  val = num.toLocaleString('fullwide', {
                    useGrouping: false,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })
                } else {
                  val = ''
                }
                setFormData({ ...formData, tax_value: val })
              }}
              onKeyDown={e => handleKeyDown(e, 'tax')}
              type='text'
              inputProps={{ inputMode: 'decimal' }}
            />

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
    </ContentLayout>
  )
}
