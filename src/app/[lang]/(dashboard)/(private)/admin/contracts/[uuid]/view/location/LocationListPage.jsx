'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Card,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  Divider,
  Drawer,
  Grid,
  Select,
  MenuItem,
  FormControl
} from '@mui/material'

import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import {
  listContractLocations,
  addContractLocation,
  updateContractLocation,
  deleteContractLocation
} from '@/api/contract/details/location'

import { useParams } from 'next/navigation'

import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import PrintIcon from '@mui/icons-material/Print'
import RefreshIcon from '@mui/icons-material/Refresh'
import CloseIcon from '@mui/icons-material/Close'

import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import GlobalTextarea from '@/components/common/GlobalTextarea'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import { showToast } from '@/components/common/Toasts'

import TablePaginationComponent from '@/components/TablePaginationComponent'
import styles from '@core/styles/table.module.css'

export default function LocationListPage() {
  const [rows, setRows] = useState([])
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editId, setEditId] = useState(null)

  const params = useParams()
  const contractId = params.uuid || params.id

  const loadLocations = async () => {
    try {
      const res = await listContractLocations(contractId)
      const data = res?.data?.data?.results || []

      const formatted = data.map(item => ({
        id: item.id,
        pest: item.pest_id,
        name: item.name,
        stationNo: item.station_no,
        pestUnit: item.equipment_id,
        rentalType: item.rental_type,
        description: item.description
      }))

      setRows(formatted)
    } catch (err) {
      console.log(err)
      showToast('error', 'Failed to load locations')
    }
  }

  const [formData, setFormData] = useState({
    pest: null,
    name: '',
    stationNo: '',
    pestUnit: null,
    rentalType: null,
    description: ''
  })

  useEffect(() => {
    if (contractId) loadLocations()
  }, [contractId])

  const handleAdd = () => {
    setIsEdit(false)
    setFormData({
      pest: null,
      name: '',
      stationNo: '',
      pestUnit: null,
      rentalType: null,
      description: ''
    })
    setDrawerOpen(true)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setEditId(row.id)
    setFormData({
      pest: row.pest,
      name: row.name,
      stationNo: row.stationNo,
      pestUnit: row.pestUnit,
      rentalType: row.rentalType,
      description: row.description
    })
    setDrawerOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name) {
      showToast('warning', 'Please enter location name')
      return
    }

    const payload = {
      contract_id: contractId,
      pest_id: formData.pest,
      location_name: formData.name,
      station_no: formData.stationNo,
      unit: formData.pestUnit,
      rental_type: formData.rentalType,
      description: formData.description
    }

    try {
      if (isEdit) {
        await updateContractLocation(editId, payload)
        showToast('success', 'Location updated successfully')
      } else {
        await addContractLocation(payload)
        showToast('success', 'Location added successfully')
      }

      setDrawerOpen(false)
      loadLocations()
    } catch (err) {
      console.log(err)
      showToast('error', 'Failed to save location')
    }
  }

  const handleDelete = async id => {
    try {
      await deleteContractLocation(id)
      showToast('success', 'Location deleted')
      loadLocations()
    } catch (err) {
      showToast('error', 'Delete failed')
    }
  }

  const filtered = rows.filter(r => JSON.stringify(r).toLowerCase().includes(searchText.toLowerCase()))

  const paginated = filtered.slice(
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
        {/* ---------------------- TOP HEADER ---------------------- */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexShrink: 0
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant='h5' fontWeight={600}>
              Location List
            </Typography>

            <GlobalButton variant='contained' startIcon={<RefreshIcon />} onClick={loadLocations}>
              Refresh
            </GlobalButton>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <GlobalButton variant='outlined' endIcon={<PrintIcon />}>
              Export
            </GlobalButton>

            <GlobalButton variant='contained' startIcon={<AddIcon />} onClick={handleAdd}>
              Add Location
            </GlobalButton>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* ---------------------- ENTRIES + SEARCH ---------------------- */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2,
            flexShrink: 0
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant='body2'>Show</Typography>

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

          <TextField
            size='small'
            placeholder='Search location...'
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

        {/* ---------------------- TABLE ---------------------- */}
        <Box sx={{ position: 'relative', flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <StickyTableWrapper rowCount={rows.length}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {['ID', 'Actions', 'Pest', 'Name', 'Station No', 'Pest Unit', 'Rental Type'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {paginated.length ? (
                  paginated.map(row => (
                    <tr key={row.id}>
                      <td>{row.id}</td>

                      <td>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size='small' color='primary' onClick={() => handleEdit(row)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton size='small' color='error' onClick={() => handleDelete(row.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </td>

                      <td>{row.pest}</td>
                      <td>{row.name}</td>
                      <td>{row.stationNo}</td>
                      <td>{row.pestUnit}</td>
                      <td>{row.rentalType}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className='text-center py-4'>
                      No results found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </StickyTableWrapper>
        </Box>

        <Box sx={{ mt: 'auto', flexShrink: 0, pt: 4 }}>
          <TablePaginationComponent
            totalCount={filtered.length}
            pagination={pagination}
            setPagination={setPagination}
          />
        </Box>
      </Card>

      {/* ---------------------- DRAWER ---------------------- */}
      <Drawer
        anchor='right'
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 420, p: 4 } }}
      >
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='h5'>{isEdit ? 'Edit Location' : 'Add Location'}</Typography>

          <IconButton onClick={() => setDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <GlobalAutocomplete
              label='Select Pest'
              value={formData.pest}
              options={['Rodent', 'Cockroach', 'Termite']}
              onChange={val => setFormData({ ...formData, pest: val })}
            />
          </Grid>

          <Grid item xs={12}>
            <GlobalTextField
              label='Name'
              fullWidth
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </Grid>

          <Grid item xs={12}>
            <GlobalTextField
              label='Station No'
              fullWidth
              value={formData.stationNo}
              onChange={e => setFormData({ ...formData, stationNo: e.target.value })}
            />
          </Grid>

          <Grid item xs={12}>
            <GlobalAutocomplete
              label='Pest Unit'
              value={formData.pestUnit}
              options={['Unit-1', 'Unit-2', 'Unit-3']}
              onChange={val => setFormData({ ...formData, pestUnit: val })}
            />
          </Grid>

          <Grid item xs={12}>
            <GlobalAutocomplete
              label='Rental Type'
              value={formData.rentalType}
              options={['Monthly', 'Quarterly', 'Yearly']}
              onChange={val => setFormData({ ...formData, rentalType: val })}
            />
          </Grid>

          <Grid item xs={12}>
            <GlobalTextarea
              label='Description'
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </Grid>
        </Grid>

        <Box mt={4} display='flex' gap={2}>
          <GlobalButton fullWidth onClick={handleSubmit}>
            {isEdit ? 'Update' : 'Save'}
          </GlobalButton>

          <GlobalButton fullWidth variant='outlined' color='secondary' onClick={() => setDrawerOpen(false)}>
            Cancel
          </GlobalButton>
        </Box>
      </Drawer>
    </Box>
  )
}
