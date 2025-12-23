'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Card,
  Typography,
  IconButton,
  Divider,
  TextField,
  FormControl,
  Select,
  InputAdornment,
  MenuItem
} from '@mui/material'

import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import {
  listContractPests,
  addContractPest,
  updateContractPest,
  deleteContractPest
} from '@/api/contract/details/pest'

import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import PrintIcon from '@mui/icons-material/Print'
import GlobalButton from '@/components/common/GlobalButton'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import GlobalTextField from '@/components/common/GlobalTextField'
import { showToast } from '@/components/common/Toasts'
import GlobalDrawer from '@/components/common/GlobalDrawer'

import styles from '@core/styles/table.module.css'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import { useParams } from 'next/navigation'

export default function PestListPage() {
  const [rows, setRows] = useState([])
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)

  const params = useParams()
  const contractId = params.uuid || params.id

  const loadPests = async () => {
    try {
      setLoading(true)
      const res = await listContractPests(contractId)
      const data = res?.data?.data?.results || []

      const formatted = data.map(item => ({
        id: item.id,
        pest: item.pest_id,
        frequency: item.frequency_id,
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
    if (contractId) loadPests()
  }, [contractId])

  const [formData, setFormData] = useState({
    pest: null,
    frequency: null,
    items: '',
    pestCount: '',
    pestValue: '',
    total: '',
    chemicals: []
  })

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
      chemicals: []
    })
    setDrawerOpen(true)
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
      chemicals: typeof row.chemicals === 'string' ? row.chemicals.split(',') : []
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

  const columns = [
    { id: 'sno', header: 'S.No', cell: (row, index) => index + 1 },
    {
      id: 'actions',
      header: 'Action',
      cell: row => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size='small' color='info'><VisibilityIcon /></IconButton>
          <IconButton size='small' color='primary' onClick={() => handleOpenEdit(row)}><EditIcon /></IconButton>
          <IconButton size='small' color='error' onClick={() => handleDelete(row.id)}><DeleteIcon /></IconButton>
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

  const filteredRows = rows.filter(r => JSON.stringify(r).toLowerCase().includes(searchText.toLowerCase()))
  const paginated = filteredRows.slice(
    pagination.pageIndex * pagination.pageSize,
    pagination.pageIndex * pagination.pageSize + pagination.pageSize
  )

  return (
    <Box className='mt-2'>
      <Card
        sx={{
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
          position: 'relative'
        }}
      >
        <Box sx={{ mb: 2, flexShrink: 0 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Box display='flex' alignItems='center' gap={2}>
              <Typography variant='h5' sx={{ fontWeight: 600 }}>Pest List</Typography>
              <GlobalButton
                startIcon={
                  <RefreshIcon
                    sx={{
                      animation: loading ? 'spin 1s linear infinite' : 'none',
                      '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } }
                    }}
                  />
                }
                disabled={loading}
                onClick={async () => {
                  setLoading(true)
                  await loadPests()
                  setTimeout(() => setLoading(false), 800)
                }}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </GlobalButton>
            </Box>
            <Box display='flex' alignItems='center' gap={2}>
              <GlobalButton variant='outlined' color='secondary' endIcon={<PrintIcon />}>Export</GlobalButton>
              <GlobalButton variant='contained' startIcon={<AddIcon />} onClick={handleOpenAdd}>Add Pest</GlobalButton>
            </Box>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant='body2' fontWeight={500}>Show</Typography>
              <FormControl size='small' sx={{ width: 120 }}>
                <Select
                  value={pagination.pageSize}
                  onChange={e => setPagination(prev => ({ ...prev, pageSize: Number(e.target.value), pageIndex: 0 }))}
                >
                  {[10, 25, 50, 100].map(size => (
                    <MenuItem key={size} value={size}>{size} entries</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <TextField
              size='small'
              placeholder='Search Pest, Frequency, Chemical...'
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              sx={{ width: 350 }}
              InputProps={{ startAdornment: (<InputAdornment position='start'><SearchIcon /></InputAdornment>) }}
            />
          </Box>
        </Box>

        <Box sx={{ position: 'relative', flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <StickyTableWrapper rowCount={rows.length}>
            <table className={styles.table}>
              <thead>
                <tr>{columns.map(col => (<th key={col.id}>{col.header}</th>))}</tr>
              </thead>
              <tbody>
                {paginated.length ? (
                  paginated.map((row, index) => (
                    <tr key={row.id}>
                      {columns.map(col => (<td key={col.id}>{col.cell ? col.cell(row, index, pagination) : row[col.id]}</td>))}
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={columns.length} className='text-center py-4'>No results found</td></tr>
                )}
              </tbody>
            </table>
          </StickyTableWrapper>
        </Box>

        <Box sx={{ mt: 'auto', flexShrink: 0, pt: 4 }}>
          <TablePaginationComponent totalCount={filteredRows.length} pagination={pagination} setPagination={setPagination} />
        </Box>
      </Card>

      <GlobalDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={isEdit ? 'Edit Pest' : 'Add Pest'}>
        <Box component='form' onSubmit={handleSubmit}>
          <Box sx={{ mb: 3 }}>
            <GlobalAutocomplete
              label='Select Pest'
              options={['Cockroach', 'Termite', 'Rodent']}
              value={formData.pest}
              onChange={v => setFormData(prev => ({ ...prev, pest: v }))}
            />
          </Box>
          <Box sx={{ mb: 3 }}>
            <GlobalAutocomplete
              label='Frequency'
              options={['Weekly', 'Monthly']}
              value={formData.frequency}
              onChange={v => setFormData(prev => ({ ...prev, frequency: v }))}
            />
          </Box>
          <Box sx={{ mb: 3 }}>
            <GlobalTextField label='No of Items' value={formData.items} onChange={e => setFormData(prev => ({ ...prev, items: e.target.value }))} />
          </Box>
          <Box sx={{ mb: 3 }}>
            <GlobalTextField label='Pest Count' value={formData.pestCount} onChange={e => setFormData(prev => ({ ...prev, pestCount: e.target.value }))} />
          </Box>
          <Box sx={{ mb: 3 }}>
            <GlobalTextField label='Pest Value' value={formData.pestValue} onChange={e => setFormData(prev => ({ ...prev, pestValue: e.target.value }))} />
          </Box>
          <Box sx={{ mb: 3 }}>
            <GlobalAutocomplete multiple label='Chemicals' options={['C1', 'C2', 'C3']} value={formData.chemicals} onChange={v => setFormData(prev => ({ ...prev, chemicals: v }))} />
          </Box>
          <Box mt={4} display='flex' gap={2}>
            <GlobalButton fullWidth variant='contained' type='submit'>{isEdit ? 'Update' : 'Save'}</GlobalButton>
            <GlobalButton fullWidth variant='outlined' color='secondary' onClick={() => setDrawerOpen(false)}>Cancel</GlobalButton>
          </Box>
        </Box>
      </GlobalDrawer>
    </Box>
  )
}
