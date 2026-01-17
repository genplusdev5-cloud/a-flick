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

import { getPestList } from '@/api/pest'
import { getUnitList } from '@/api/unit'

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

export default function LocationListPage({ contractId: propContractId, contract }) {
  const [rows, setRows] = useState([])
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  const [pests, setPests] = useState([])
  const [units, setUnits] = useState([])

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editId, setEditId] = useState(null)

  const params = useParams()
  // Prioritize the prop (integer ID), fallback to params (likely UUID, which causes error)
  const contractId = propContractId || params.uuid || params.id

  const loadLocations = async () => {
    try {
      const res = await listContractLocations(contractId)
      const data = res?.data?.data?.results || []

      const formatted = data.map(item => ({
        id: item.id,
        pest: item.contract_pest_id || item.pest_id,
        name: item.name,
        stationNo: item.station_no,
        pestUnit: item.equipment_id || item.pest_unit_id,
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

  useEffect(() => {
    const fetchPests = async () => {
      try {
        const res = await getPestList({ page_size: 100 })
        const list = res?.data?.data?.results || res?.data?.results || []
        setPests(list)
      } catch (err) {
        console.error(err)
      }
    }
    fetchPests()
  }, [])

  const fetchUnits = async pestId => {
    if (!pestId) {
      setUnits([])
      return
    }
    try {
      const res = await getUnitList(pestId)
      const list = res?.data?.data?.results || res?.data?.results || []
      setUnits(list)
    } catch (err) {
      console.error(err)
      setUnits([])
    }
  }

  const handleAdd = () => {
    setIsEdit(false)
    setFormData({
      pest: null,
      name: '',
      stationNo: '',
      pestUnit: null,
      rentalType: 3, // Default to Customer (3)
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

    if (row.pest) {
      fetchUnits(row.pest)
    } else {
      setUnits([])
    }

    setDrawerOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name) {
      showToast('warning', 'Please enter location name')
      return
    }

    const payload = new FormData()

    payload.append('contract_id', contractId)
    payload.append('company_id', contract?.company_id ?? 1)
    payload.append('customer_id', contract?.customer_id ?? 1)
    payload.append('contract_level', 1)
    if (formData.pest) payload.append('contract_pest_id', formData.pest)
    payload.append('name', formData.name)
    payload.append('qr_code', formData.stationNo || '1233')
    payload.append('station_no', formData.stationNo)
    if (formData.pestUnit) payload.append('equipment_id', formData.pestUnit)
    if (formData.rentalType) payload.append('rental_type', formData.rentalType)
    payload.append('description', formData.description)
    payload.append('is_active', 1)
    payload.append('status', 1)

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
          maxHeight: '100%',
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
                  {['S.No', 'Actions', 'Pest', 'Name', 'Station No', 'Pest Unit', 'Rental Type'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {paginated.length ? (
                  paginated.map((row, index) => (
                    <tr key={row.id}>
                      <td>{index + 1 + pagination.pageIndex * pagination.pageSize}</td>

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
              options={pests}
              onChange={val => {
                const newPestId = val ? val.value : null
                setFormData(prev => ({ ...prev, pest: newPestId, pestUnit: null }))
                fetchUnits(newPestId)
              }}
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
              options={units}
              onChange={val => setFormData({ ...formData, pestUnit: val ? val.value : null })}
            />
          </Grid>

          <Grid item xs={12}>
            <GlobalAutocomplete
              label='Rental Type'
              value={formData.rentalType}
              options={[
                { label: 'Sold', value: 1 },
                { label: 'Rent', value: 2 },
                { label: 'Customer', value: 3 }
              ]}
              onChange={val => setFormData({ ...formData, rentalType: val ? val.value : null })}
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
