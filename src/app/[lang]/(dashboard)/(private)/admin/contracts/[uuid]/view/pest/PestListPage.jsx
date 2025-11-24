'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Card,
  CardHeader,
  Typography,
  IconButton,
  Divider,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  DialogActions,
  FormControl,
  Select,
  InputAdornment,
  Menu,
  MenuItem
} from '@mui/material'

import {
  listContractPests,
  addContractPest,
  updateContractPest,
  deleteContractPest,
  getContractPestDetails
} from '@/api/contract/details/pest'

import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import PrintIcon from '@mui/icons-material/Print'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import GlobalButton from '@/components/common/GlobalButton'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import GlobalTextField from '@/components/common/GlobalTextField'
import { showToast } from '@/components/common/Toasts'
import GlobalDrawer from '@/components/common/GlobalDrawer'

import styles from '@core/styles/table.module.css'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import classnames from 'classnames'
import ChevronRight from '@menu/svg/ChevronRight'
import { useParams } from 'next/navigation'

export default function PestListPage() {
  const [rows, setRows] = useState([])
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)

  const params = useParams()
  const contractId = params.id // ⭐ dynamic contract id from URL

  const loadPests = async () => {
    try {
      setLoading(true)
      const res = await listContractPests(contractId)

      const data = res?.data?.data?.results || []

      const formatted = data.map(item => ({
        id: item.id,
        pest: item.pest_id, // << temporarily use ID
        frequency: item.frequency_id, // << temporarily use ID
        chemicals: item.chemical_id || '',
        pestValue: Number(item.pest_value),
        totalValue: Number(item.total_value),
        workTime: item.work_time,
        items: Number(item.pest_service_count)
      }))

      setRows(formatted)
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to load pest list')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPests()
  }, [])

  // Form state
  const [formData, setFormData] = useState({
    pest: null,
    frequency: null,
    items: '',
    pestCount: '',
    pestValue: '',
    total: '',
    chemicals: []
  })

  // ADD THIS ABOVE return()
  const handleSubmit = async e => {
    e.preventDefault()

    if (!formData?.pest) return showToast('error', 'Please select a pest')
    if (!formData?.frequency) return showToast('error', 'Please select frequency')

    const payload = {
      contract_id: contractId,
      pest: formData.pest,
      frequency: formData.frequency,
      items: Number(formData.items),
      pest_count: Number(formData.pestCount),
      pest_value: Number(formData.pestValue),
      total: Number(formData.total),
      chemicals: Array.isArray(formData.chemicals) ? formData.chemicals.join(',') : ''
    }

    try {
      setLoading(true)

      if (isEdit) {
        payload.id = formData.id
        await updateContractPest(payload)
        showToast('success', 'Pest updated successfully!')
      } else {
        await addContractPest(payload)
        showToast('success', 'Pest added successfully!')
      }

      setDrawerOpen(false)
      await loadPests()
    } catch (err) {
      console.log(err)
      showToast('error', err?.response?.data?.message || 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAdd = () => {
    setIsEdit(false)
    setFormData({
      pest: '',
      frequency: '',
      items: '',
      pestCount: '',
      pestValue: '',
      total: '',
      time: '',
      chemicals: []
    })
    setDrawerOpen(true) // ✅ FIXED
  }

  const handleOpenEdit = row => {
    setIsEdit(true)
    setFormData({
      id: row.id,
      pest: row.pest,
      frequency: row.frequency,
      items: row.items,
      pestCount: row.workTime,
      pestValue: row.pestValue,
      total: row.totalValue,
      chemicals: row.chemicals?.split(',') || []
    })
    setDrawerOpen(true)
  }

  const handleDelete = async id => {
    if (!confirm('Are you sure you want to delete this pest?')) return

    try {
      await deleteContractPest(id)
      showToast('success', 'Pest deleted successfully')
      await loadPests()
    } catch (err) {
      console.error(err)
      showToast('error', 'Delete failed')
    }
  }

  const handleClose = () => {
    setOpenDialog(false)
  }

  // ----------- TABLE COLUMNS -----------
  const columns = [
    {
      id: 'sno',
      header: 'S.No',
      cell: (row, index) => index + 1
    },

    {
      id: 'actions',
      header: 'Action',
      cell: row => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size='small' color='info'>
            <VisibilityIcon />
          </IconButton>
          <IconButton size='small' color='primary' onClick={() => handleOpenEdit(row)}>
            <EditIcon />
          </IconButton>

          <IconButton size='small' color='error' onClick={() => handleDelete(row.id)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      )
    },
    { id: 'pest', header: 'Pest' },
    { id: 'frequency', header: 'Frequency' },
    { id: 'chemicals', header: 'Chemicals' },
    { id: 'pestValue', header: 'Pest Value', cell: row => `₹ ${row.pestValue}` },
    { id: 'totalValue', header: 'Total Value', cell: row => `₹ ${row.totalValue}` },
    { id: 'workTime', header: 'Work Time (Hrs)' },
    { id: 'items', header: 'No of Items' }
  ]

  // ----------- FILTERING & SEARCH -----------
  const filteredRows = rows.filter(r => JSON.stringify(r).toLowerCase().includes(searchText.toLowerCase()))

  const paginated = filteredRows.slice(
    pagination.pageIndex * pagination.pageSize,
    pagination.pageIndex * pagination.pageSize + pagination.pageSize
  )

  // ------------------------------------------
  return (
    <Box className='mt-2'>
      <Card sx={{ p: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            {/* LEFT SIDE: Pest List + Refresh Button */}
            <Box display='flex' alignItems='center' gap={2}>
              <Typography variant='h5' sx={{ fontWeight: 600 }}>
                Pest List
              </Typography>

              <GlobalButton
                startIcon={
                  <RefreshIcon
                    sx={{
                      animation: loading ? 'spin 1s linear infinite' : 'none',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' }
                      }
                    }}
                  />
                }
                disabled={loading}
                onClick={async () => {
                  setLoading(true)
                  setPagination({ pageIndex: 0, pageSize: 25 })
                  await loadPests()
                  setTimeout(() => setLoading(false), 800)
                }}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </GlobalButton>
            </Box>

            {/* RIGHT SIDE: Export + Add */}
            <Box display='flex' alignItems='center' gap={2}>
              <GlobalButton variant='outlined' color='secondary' endIcon={<PrintIcon />}>
                Export
              </GlobalButton>
              <GlobalButton variant='contained' startIcon={<AddIcon />} onClick={handleOpenAdd}>
                Add Pest
              </GlobalButton>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Row 2 — PAGE ENTRIES + SEARCH BAR */}
          {/* 🌟 PAGE ENTRIES + SEARCH BAR (Updated Matching All Pages) */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
              flexWrap: 'wrap',
              gap: 2
            }}
          >
            {/* LEFT — Entries Dropdown */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant='body2' fontWeight={500}>
                Show
              </Typography>

              <FormControl size='small' sx={{ width: 120 }}>
                <Select
                  value={pagination.pageSize}
                  onChange={e =>
                    setPagination(prev => ({
                      ...prev,
                      pageSize: Number(e.target.value),
                      pageIndex: 0
                    }))
                  }
                >
                  {[10, 25, 50, 100].map(size => (
                    <MenuItem key={size} value={size}>
                      {size} entries
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* RIGHT — Search */}
            <TextField
              size='small'
              placeholder='Search Pest, Frequency, Chemical...'
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              sx={{ width: 350 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Box>
        </Box>

        {/* Table */}
        <div className='overflow-x-auto'>
          <table className={styles.table}>
            <thead>
              <tr>
                {columns.map(col => (
                  <th key={col.id}>{col.header}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {paginated.length ? (
                paginated.map((row, index) => (
                  <tr key={row.id}>
                    {columns.map(col => (
                      <td key={col.id}>{col.cell ? col.cell(row, index, pagination) : row[col.id]}</td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className='text-center py-4'>
                    No results found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <TablePaginationComponent
          totalCount={filteredRows.length}
          pagination={pagination}
          setPagination={setPagination}
        />
      </Card>

      {/* 🔥 PEST ADD / EDIT DRAWER (Vuexy Style) */}
      <GlobalDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={isEdit ? 'Edit Pest' : 'Add Pest'}>
        <Box>
          {/* FORM */}
          <Box component='form' onSubmit={handleSubmit}>
            {/* Pest */}
            <Box sx={{ mb: 3 }}>
              <GlobalAutocomplete
                label='Select Pest'
                placeholder='Search pest...'
                options={['Cockroach', 'Termite', 'Rodent']}
                value={formData.pest}
                onChange={v => setFormData(prev => ({ ...prev, pest: v }))}
              />
            </Box>

            {/* Frequency */}
            <Box sx={{ mb: 3 }}>
              <GlobalAutocomplete
                label='Frequency'
                placeholder='Search frequency...'
                options={['Weekly', 'Monthly']}
                value={formData.frequency}
                onChange={v => setFormData(prev => ({ ...prev, frequency: v }))}
              />
            </Box>

            {/* No of Items */}
            <Box sx={{ mb: 3 }}>
              <GlobalTextField
                label='No of Items'
                value={formData.items}
                onChange={e => setFormData(prev => ({ ...prev, items: e.target.value }))}
              />
            </Box>

            {/* Pest Count */}
            <Box sx={{ mb: 3 }}>
              <GlobalTextField
                label='Pest Count'
                value={formData.pestCount}
                onChange={e => {
                  const val = e.target.value
                  setFormData(prev => ({
                    ...prev,
                    pestCount: val,
                    total: Number(val || 0) * Number(prev.pestValue || 0)
                  }))
                }}
              />
            </Box>

            {/* Pest Value */}
            <Box sx={{ mb: 3 }}>
              <GlobalTextField
                label='Pest Value'
                value={formData.pestValue}
                onChange={e => {
                  const val = e.target.value
                  setFormData(prev => ({
                    ...prev,
                    pestValue: val,
                    total: Number(prev.pestCount || 0) * Number(val || 0)
                  }))
                }}
              />
            </Box>

            {/* Total */}
            <Box sx={{ mb: 3 }}>
              <GlobalTextField label='Total' value={formData.total} disabled />
            </Box>

            {/* Chemicals */}
            <Box sx={{ mb: 3 }}>
              <GlobalAutocomplete
                label='Chemicals'
                multiple
                options={['C1', 'C2', 'C3']}
                value={formData.chemicals}
                onChange={v => setFormData(prev => ({ ...prev, chemicals: v }))}
              />
            </Box>

            {/* Buttons */}
            <Box mt={4} display='flex' gap={2}>
              <GlobalButton fullWidth variant='contained' type='submit'>
                {isEdit ? 'Update' : 'Save'}
              </GlobalButton>

              <GlobalButton fullWidth variant='outlined' color='secondary' onClick={() => setDrawerOpen(false)}>
                Cancel
              </GlobalButton>
            </Box>
          </Box>
        </Box>
      </GlobalDrawer>
    </Box>
  )
}
