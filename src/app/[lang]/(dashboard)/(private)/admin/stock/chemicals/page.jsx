'use client'

import { useState } from 'react'

import dynamic from 'next/dynamic'

import {
  Box,
  Typography,
  Button,
  IconButton,
  Drawer,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Menu
} from '@mui/material'

// Lazy load DataGrid & Pagination
const DataGrid = dynamic(() => import('@mui/x-data-grid').then(mod => mod.DataGrid), { ssr: false })
const Pagination = dynamic(() => import('@mui/material/Pagination'), { ssr: false })

// Icons
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import NumbersIcon from '@mui/icons-material/Numbers'
import DescriptionIcon from '@mui/icons-material/Description'
import DownloadIcon from '@mui/icons-material/Download'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import EditIcon from '@mui/icons-material/Edit'

// Wrapper
import ContentLayout from '@/components/layout/ContentLayout'

// ✅ Vuexy Input
import CustomTextField from '@core/components/mui/TextField'

// Initial rows
const initialRows = [
  { id: 1, name: 'Chemical A', unit: 'kg', dosage: 12.5, ingredients: 'Ingredient 1, Ingredient 2', status: 'Active' },
  { id: 2, name: 'Chemical B', unit: 'litre', dosage: 7.8, ingredients: 'Ingredient 3', status: 'Inactive' }
]

export default function ChemicalsPage() {
  const [rows, setRows] = useState(initialRows)
  const [pageSize, setPageSize] = useState(10)
  const [selectionModel, setSelectionModel] = useState([])
  const [searchText, setSearchText] = useState('')

  const [open, setOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [formData, setFormData] = useState({ name: '', unit: '', dosage: '', ingredients: '', status: 'Active' })

  // Menu state
  const [anchorEl, setAnchorEl] = useState(null)
  const [menuRow, setMenuRow] = useState(null)
  const openMenu = Boolean(anchorEl)

  const toggleDrawer = () => setOpen(prev => !prev)

  const handleAdd = () => {
    setIsEdit(false)
    setFormData({ name: '', unit: '', dosage: '', ingredients: '', status: 'Active' })
    setOpen(true)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setEditRow(row)
    setFormData({ ...row })
    setOpen(true)
  }

  const handleMenuOpen = (e, row) => {
    setAnchorEl(e.currentTarget)
    setMenuRow(row)
  }
  const handleMenuClose = () => {
    setAnchorEl(null)
    setMenuRow(null)
  }

  const handleDelete = () => {
    setRows(rows.filter(r => r.id !== menuRow?.id))
    handleMenuClose()
  }

  const handleChange = e => {
    const { name, value } = e.target

    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = e => {
    e.preventDefault()

    if (formData.name && formData.unit) {
      if (isEdit && editRow) {
        setRows(prev => prev.map(r => (r.id === editRow.id ? { ...r, ...formData } : r)))
      } else {
        const newRow = { id: rows.length ? rows[rows.length - 1].id + 1 : 1, ...formData }

        setRows([...rows, newRow])
      }

      toggleDrawer()
    }
  }

  const handleSearch = e => setSearchText(e.target.value)

  const filteredRows = rows.filter(
    row =>
      row.id.toString().includes(searchText.toLowerCase()) ||
      row.name.toLowerCase().includes(searchText.toLowerCase()) ||
      row.unit.toLowerCase().includes(searchText.toLowerCase()) ||
      row.dosage.toString().includes(searchText.toLowerCase())
  )

  const columns = [
    { field: 'id', headerName: 'ID', flex: 0.5 },
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'unit', headerName: 'Unit', flex: 0.5 },
    { field: 'dosage', headerName: 'Dosage', flex: 0.5 },
    { field: 'ingredients', headerName: 'Ingredients', flex: 1 },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.5,
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
    },
    {
      field: 'action',
      headerName: 'Action',
      flex: 0.5,
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size='small' onClick={e => handleMenuOpen(e, params.row)}>
            <MoreVertIcon />
          </IconButton>
          <IconButton size='small' onClick={() => handleEdit(params.row)}>
            <EditIcon />
          </IconButton>
        </Box>
      )
    }
  ]

  return (
    <ContentLayout
      title='Chemicals List'
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Chemicals' }]}
      actions={
        <>
          <Button variant='outlined' startIcon={<DownloadIcon />}>
            Export
          </Button>
          <Button variant='contained' startIcon={<AddIcon />} onClick={handleAdd}>
            Add Chemical
          </Button>
        </>
      }
    >
      {/* Search + PageSize */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <CustomTextField
          size='small'
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
          size='small'
          placeholder='Search by ID, Name, Unit, Dosage...'
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

      {/* DataGrid */}
      <DataGrid
        rows={filteredRows}
        columns={columns}
        checkboxSelection
        disableRowSelectionOnClick
        autoHeight
        pageSize={pageSize}
        pageSizeOptions={[5, 10, 25, 50, 100]}
        onPageSizeChange={newSize => setPageSize(newSize)}
        onRowSelectionModelChange={newSelection => setSelectionModel(newSelection)}
        rowSelectionModel={selectionModel}
        slots={{
          pagination: props => <Pagination {...props} shape='rounded' variant='outlined' color='primary' />
        }}
      />

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            alert(`Details of ${menuRow?.name}`)
            handleMenuClose()
          }}
        >
          View Details
        </MenuItem>
        <MenuItem
          onClick={() => {
            alert(`Archived ${menuRow?.name}`)
            handleMenuClose()
          }}
        >
          Archive
        </MenuItem>
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </Menu>

      {/* Drawer Form */}
      <Drawer anchor='right' open={open} onClose={toggleDrawer}>
        <Box sx={{ width: 360, p: 3 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6'>{isEdit ? 'Edit Chemical' : 'Add New Chemical'}</Typography>
            <IconButton onClick={toggleDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>

          <form onSubmit={handleSubmit}>
            <CustomTextField
              fullWidth
              margin='normal'
              label='Chemical Name'
              name='name'
              value={formData.name}
              onChange={handleChange}
            />
            <FormControl fullWidth margin='normal'>
              <InputLabel>Unit</InputLabel>
              <Select name='unit' value={formData.unit} onChange={handleChange} label='Unit'>
                <MenuItem value=''>Select</MenuItem>
                <MenuItem value='kg'>Kg</MenuItem>
                <MenuItem value='litre'>Litre</MenuItem>
                <MenuItem value='bottle'>Bottle</MenuItem>
                <MenuItem value='pkt'>Packet</MenuItem>
                <MenuItem value='box'>Box</MenuItem>
              </Select>
            </FormControl>
            <CustomTextField
              fullWidth
              margin='normal'
              type='number'
              label='Dosage'
              name='dosage'
              value={formData.dosage}
              onChange={handleChange}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position='start'>
                      <NumbersIcon />
                    </InputAdornment>
                  )
                }
              }}
            />
            <CustomTextField
              fullWidth
              margin='normal'
              multiline
              rows={3}
              label='Ingredients'
              name='ingredients'
              value={formData.ingredients}
              onChange={handleChange}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position='start'>
                      <DescriptionIcon />
                    </InputAdornment>
                  )
                }
              }}
            />
            <FormControl fullWidth margin='normal'>
              <InputLabel>Status</InputLabel>
              <Select name='status' value={formData.status} onChange={handleChange} label='Status'>
                <MenuItem value='Active'>Active</MenuItem>
                <MenuItem value='Inactive'>Inactive</MenuItem>
              </Select>
            </FormControl>

            <Box mt={3} display='flex' gap={2}>
              <Button type='submit' variant='contained' fullWidth>
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
