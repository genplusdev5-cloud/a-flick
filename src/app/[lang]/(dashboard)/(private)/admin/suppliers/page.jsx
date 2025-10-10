'use client'

import { useState } from 'react'
import {
  Box,
  Button,
  IconButton,
  Drawer,
  InputAdornment,
  Menu,
  MenuItem,
  Typography,
  Pagination,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'

// Icons
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import PrintIcon from '@mui/icons-material/Print'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import FileCopyIcon from '@mui/icons-material/FileCopy'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import TableChartIcon from '@mui/icons-material/TableChart'

// Wrapper
import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'

export default function SupplierPage() {
  const [open, setOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [formData, setFormData] = useState({ type: '', name: '', address: '' })
  const [rows, setRows] = useState([
    { id: 1, name: 'ABC Traders', type: 'Stock', status: 'Active' },
    { id: 2, name: 'XYZ Supplier', type: 'Supplier', status: 'Inactive' }
  ])
  const [searchText, setSearchText] = useState('')
  const [pageSize, setPageSize] = useState(10)

  // Export dropdown
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const exportOpen = Boolean(exportAnchorEl)

  const toggleDrawer = () => setOpen(prev => !prev)
  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleAdd = () => {
    setIsEdit(false)
    setFormData({ type: '', name: '', address: '' })
    setOpen(true)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setEditRow(row)
    setFormData({ type: row.type, name: row.name, address: row.address || '' })
    setOpen(true)
  }

  const handleSubmit = e => {
    e.preventDefault()
    if (!formData.name || !formData.type) return

    if (isEdit && editRow) {
      setRows(rows.map(r => (r.id === editRow.id ? { ...r, ...formData } : r)))
    } else {
      setRows(prev => [
        ...prev,
        {
          id: rows.length > 0 ? rows[rows.length - 1].id + 1 : 1,
          ...formData,
          status: 'Active'
        }
      ])
    }
    setFormData({ type: '', name: '', address: '' })
    toggleDrawer()
  }

  const handleSearch = e => setSearchText(e.target.value)

  // Export dropdown handlers
  const handleExportClick = event => setExportAnchorEl(event.currentTarget)
  const handleExportClose = () => setExportAnchorEl(null)

  const handleExportSelect = type => {
    alert(`Export as: ${type}`)
    handleExportClose()
  }

  const filteredRows = rows.filter(
    row =>
      row.name.toLowerCase().includes(searchText.toLowerCase()) ||
      row.id.toString().includes(searchText.toLowerCase())
  )

  const columns = [
    { field: 'id', headerName: 'ID #', minWidth: 80 },
    { field: 'name', headerName: 'Supplier Name', flex: 1, minWidth: 200 },
    { field: 'type', headerName: 'Supplier Type', flex: 1, minWidth: 160 },
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 140,
      renderCell: params => (
        <Chip
          label={params.value}
          color={params.value === 'Active' ? 'success' : 'default'}
          size="small"
          variant="outlined"
        />
      )
    },
    {
      field: 'action',
      headerName: 'Action',
      minWidth: 120,
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" onClick={() => handleEdit(params.row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => setRows(rows.filter(r => r.id !== params.row.id))}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ]

  return (
    <ContentLayout
      title="Suppliers"
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Suppliers' }]}
      actions={
        <>
          {/* Export Dropdown */}
          <Button
            variant="outlined"
            color="primary"
            endIcon={<ArrowDropDownIcon />}
            onClick={handleExportClick}
          >
            Export
          </Button>
          <Menu anchorEl={exportAnchorEl} open={exportOpen} onClose={handleExportClose}>
            <MenuItem onClick={() => handleExportSelect('print')}>
              <ListItemIcon><PrintIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Print</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleExportSelect('csv')}>
              <ListItemIcon><FileDownloadIcon fontSize="small" /></ListItemIcon>
              <ListItemText>CSV</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleExportSelect('excel')}>
              <ListItemIcon><TableChartIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Excel</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleExportSelect('pdf')}>
              <ListItemIcon><PictureAsPdfIcon fontSize="small" /></ListItemIcon>
              <ListItemText>PDF</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleExportSelect('copy')}>
              <ListItemIcon><FileCopyIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Copy</ListItemText>
            </MenuItem>
          </Menu>

          {/* Add Supplier */}
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
            Add Supplier
          </Button>
        </>
      }
    >
      {/* Search + Entries */}
      <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <CustomTextField
          size="small"
          select
          sx={{ width: 140 }}
          value={pageSize}
          onChange={e => setPageSize(Number(e.target.value))}
        >
          {[5, 10, 25, 50, 100].map(opt => (
            <MenuItem key={opt} value={opt}>
              {opt} entries
            </MenuItem>
          ))}
        </CustomTextField>

        <CustomTextField
          size="small"
          placeholder="Search by ID or Name..."
          value={searchText}
          onChange={handleSearch}
          sx={{ width: 300 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }
          }}
        />
      </Box>

      {/* Table */}
      <DataGrid
        rows={filteredRows}
        columns={columns}
        disableRowSelectionOnClick
        autoHeight
        pageSizeOptions={[5, 10, 25, 50, 100]}
        pageSize={pageSize}
        onPageSizeChange={newSize => setPageSize(newSize)}
        rowHeight={52}
        slots={{
          pagination: props => (
            <Pagination {...props} shape="rounded" variant="outlined" color="primary" />
          )
        }}
      />

      {/* Drawer for Add/Edit Supplier */}
      <Drawer anchor="right" open={open} onClose={toggleDrawer}>
        <Box sx={{ width: 350, p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">{isEdit ? 'Edit Supplier' : 'Add Supplier'}</Typography>
            <IconButton onClick={toggleDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>

          <form onSubmit={handleSubmit}>
            <CustomTextField
              select
              fullWidth
              label="Supplier Type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              margin="normal"
            >
              <MenuItem value="Stock">Stock</MenuItem>
              <MenuItem value="Supplier">Supplier</MenuItem>
              <MenuItem value="Vehicle">Vehicle</MenuItem>
              <MenuItem value="Adjustment">Adjustment</MenuItem>
              <MenuItem value="Opening Stock">Opening Stock</MenuItem>
            </CustomTextField>

            <CustomTextField
              fullWidth
              label="Supplier Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              margin="normal"
            />

            <CustomTextField
              fullWidth
              multiline
              rows={3}
              label="Billing Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              margin="normal"
            />

            <Box mt={3} display="flex" gap={2}>
              <Button type="submit" variant="contained" fullWidth>
                {isEdit ? 'Update' : 'Save'}
              </Button>
              <Button variant="outlined" fullWidth onClick={toggleDrawer}>
                Cancel
              </Button>
            </Box>
          </form>
        </Box>
      </Drawer>
    </ContentLayout>
  )
}
