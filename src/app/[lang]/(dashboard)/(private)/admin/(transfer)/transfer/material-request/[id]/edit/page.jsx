"use client"

import { useState, useEffect, useMemo, forwardRef } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import {
  Box,
  Card,
  CardHeader,
  Typography,
  Grid,
  Divider,
  IconButton,
  Breadcrumbs,
  CircularProgress
} from '@mui/material'

import StickyListLayout from '@/components/common/StickyListLayout'
import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import PermissionGuard from '@/components/auth/PermissionGuard'

import { format, parseISO } from 'date-fns'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import CustomTextField from '@core/components/mui/TextField'

import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'

import styles from '@core/styles/table.module.css'
import { getMaterialRequestById, updateMaterialRequest } from '@/api/transfer/materialRequest/edit'
import { getMaterialRequestDropdowns } from '@/api/transfer/materialRequest/dropdown'
import { showToast } from '@/components/common/Toasts'

const EditMaterialRequestPage = () => {
  const router = useRouter()
  const params = useParams()
  const { lang, id } = params
  
  const decodedId = useMemo(() => {
    if (!id) return null
    try {
      const urlDecoded = decodeURIComponent(id)
      return atob(urlDecoded)
    } catch (e) {
      try {
        return atob(id)
      } catch {
        return id
      }
    }
  }, [id])

  // Dropdown options
  const [employeeOptions, setEmployeeOptions] = useState([])
  const [chemicalOptions, setChemicalOptions] = useState([])
  const [uomOptions, setUomOptions] = useState([])
  const [locationOptions, setLocationOptions] = useState([])

  // Loading states
  const [initLoading, setInitLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  // Header fields
  const [requestDate, setRequestDate] = useState(null)
  const [requestType, setRequestType] = useState(null)
  const [requestedBy, setRequestedBy] = useState(null)
  const [fromLocation, setFromLocation] = useState(null)
  const [toLocation, setToLocation] = useState(null)

  // Item entry fields
  const [remarks, setRemarks] = useState('')
  const [chemical, setChemical] = useState(null)
  const [uom, setUom] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [editId, setEditId] = useState(null)

  const [items, setItems] = useState([])

  const DateInput = forwardRef(function DateInput(props, ref) {
    const { label, value, ...rest } = props

    return <CustomTextField fullWidth inputRef={ref} label={label} value={value} {...rest} />
  })
  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitLoading(true)

        const [dropdownRes, detailsRes] = await Promise.all([
          getMaterialRequestDropdowns(),
          getMaterialRequestById(decodedId)
        ])

        // --- DROPDOWNS ---
        const dd = dropdownRes?.data || dropdownRes || {}

        const employees =
          dd.employee?.name?.map(item => ({
            label: item.name,
            value: item.id,
            id: item.id
          })) || []

        const chemicals =
          dd.chemicals?.name?.map(item => ({
            label: item.name,
            value: item.name,
            id: item.id
          })) || []

        const uoms =
          dd.uom?.name?.map(item => ({
            label: item.name,
            value: item.name,
            id: item.id
          })) || []

        const locations =
          dd.supplier?.name?.map(item => ({
            label: item.name,
            value: item.name,
            id: item.id
          })) || []

        setEmployeeOptions(employees)
        setChemicalOptions(chemicals)
        setUomOptions(uoms)
        setLocationOptions(locations)

        // --- DETAILS ---
        const data = detailsRes?.data ?? detailsRes ?? {}

        if (data.request_date) setRequestDate(new Date(data.request_date))

        setRequestType({ label: data.request_type, value: data.request_type })
        setRequestedBy(employees.find(e => e.id == data.employee_id) || null)
        setFromLocation(locations.find(l => l.label === data.from_location) || { label: data.from_location, value: data.from_location })
        setToLocation(locations.find(l => l.label === data.to_location) || { label: data.to_location, value: data.to_location })

        // --- ITEMS ---
        const itemsList = data.items || []

        const mappedItems = itemsList.map(item => {
          const chemId = item.item_id || item.item?.id || item.chemical_id
          const uomId = item.uom_id || item.uom?.id

          const foundChem = chemicals.find(c => String(c.id) === String(chemId))
          const foundUom = uoms.find(u => String(u.id) === String(uomId))

          return {
            id: item.id,
            chemical: item.item_name || item.chemical_name || item.item?.name || foundChem?.label || '',
            chemicalId: chemId,
            uom: item.uom_name || item.uom || item.uom_details?.name || foundUom?.label || '',
            uomId: uomId,
            quantity: item.quantity,
            remarks: item.remarks || ''
          }
        })

        setItems(mappedItems)
      } catch (err) {
        console.error('Failed to fetch material request details', err)
        showToast('error', 'Failed to load material request data')
      } finally {
        setInitLoading(false)
      }
    }

    if (decodedId) {
      fetchData()
    }
  }, [decodedId])

  const handleEditItem = row => {
    setEditId(row.id)
    setChemical(chemicalOptions.find(c => String(c.id) === String(row.chemicalId)) || { label: row.chemical, id: row.chemicalId })
    setUom(uomOptions.find(u => String(u.id) === String(row.uomId)) || { label: row.uom, id: row.uomId })
    setQuantity(row.quantity)
    setRemarks(row.remarks)
  }

  const handleAddItem = () => {
    if (!chemical || !uom || !quantity) {
      showToast('error', 'Please fill all required item fields')
      return
    }

    if (editId) {
      setItems(prev =>
        prev.map(item =>
          item.id === editId
            ? {
                ...item,
                chemical: chemical.label,
                chemicalId: chemical.id,
                uom: uom.label,
                uomId: uom.id,
                quantity,
                remarks
              }
            : item
        )
      )
      setEditId(null)
    } else {
      setItems(prev => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          chemical: chemical.label,
          chemicalId: chemical.id,
          uom: uom.label,
          uomId: uom.id,
          quantity,
          remarks
        }
      ])
    }

    setChemical(null)
    setUom(null)
    setQuantity('')
    setRemarks('')
  }

  const handleRemoveItem = id => {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const handleUpdate = async () => {
    if (!requestDate || !requestType || !requestedBy || !fromLocation || !toLocation || items.length === 0) {
      showToast('warning', 'Please fill all required fields and add at least one item')
      return
    }

    try {
      setSaveLoading(true)

      const payload = {
        id: Number(decodedId),
        request_date: format(requestDate, 'yyyy-MM-dd'),
        request_type: requestType.value,
        requested_by: requestedBy.id,
        from_location: fromLocation.label,
        to_location: toLocation.label,
        items: items.map(item => ({
          id: String(item.id).startsWith('temp') ? null : item.id,
          item_id: item.chemicalId,
          item_name: item.chemical,
          uom: item.uom,
          uom_id: item.uomId,
          quantity: Number(item.quantity),
          remarks: item.remarks || ''
        }))
      }

      await updateMaterialRequest(payload)

      showToast('success', 'Material Request updated successfully')
      router.push(`/${lang}/admin/transfer/material-request`)
    } catch (err) {
      console.error('Failed to update Material Request', err)
      showToast('error', err?.response?.data?.message || 'Failed to update Material Request')
    } finally {
      setSaveLoading(false)
    }
  }

  return (
    <StickyListLayout
      header={
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link href={`/${lang}`} style={{ textDecoration: 'none' }}>
            Dashboard
          </Link>
          <Link href={`/${lang}/admin/transfer/material-request`} style={{ textDecoration: 'none' }}>
            Material Request
          </Link>
          <Typography color='text.primary'>Edit</Typography>
        </Breadcrumbs>
      }
    >
      <Card>
        <CardHeader
          title={
            <Typography variant='h5' fontWeight={600}>
              Update Material Request
            </Typography>
          }
        />

        <Divider />

        {/* HEADER FORM */}
        <Box px={4} py={3} position='relative'>
          {initLoading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: 'rgba(255,255,255,0.7)',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CircularProgress size={40} />
            </Box>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <AppReactDatepicker
                selected={requestDate}
                onChange={date => setRequestDate(date)}
                dateFormat='dd/MM/yyyy'
                customInput={
                  <DateInput label='Request Date' value={requestDate ? format(requestDate, 'dd/MM/yyyy') : ''} />
                }
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='Request Type'
                options={[
                  { label: 'Material Request', value: 'Material Request' },
                  { label: 'Material Return', value: 'Material Return' },
                  { label: 'Opening Stock', value: 'Opening Stock' }
                ]}
                value={requestType}
                onChange={setRequestType}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='Requested By'
                options={employeeOptions}
                value={requestedBy}
                onChange={setRequestedBy}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='From Location'
                options={locationOptions}
                value={fromLocation}
                onChange={setFromLocation}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='To Location'
                options={locationOptions}
                value={toLocation}
                onChange={setToLocation}
              />
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {/* ITEM ENTRY */}
        <Box px={4} py={3}>
          <Grid container spacing={2} alignItems='flex-end'>
            <Grid item xs={12} md={3}>
              <GlobalAutocomplete label='Chemical' options={chemicalOptions} value={chemical} onChange={setChemical} />
            </Grid>

            <Grid item xs={12} md={2}>
              <GlobalAutocomplete label='UOM' options={uomOptions} value={uom} onChange={setUom} />
            </Grid>

            <Grid item xs={12} md={2}>
              <GlobalTextField
                label='Quantity'
                type='number'
                value={quantity || ''}
                onChange={e => setQuantity(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalTextField
                label='Remarks'
                value={remarks || ''}
                onChange={e => setRemarks(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={1}>
              <GlobalButton
                variant='contained'
                color={editId ? 'info' : 'primary'}
                startIcon={editId ? <EditIcon /> : <AddIcon />}
                onClick={handleAddItem}
                fullWidth
              >
                {editId ? 'Update' : 'Add'}
              </GlobalButton>
            </Grid>
          </Grid>
        </Box>

        {/* ITEMS TABLE */}
        <Box px={4} pb={3}>
          <StickyTableWrapper rowCount={items.length}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>ID</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Action</th>
                  <th style={{ width: '25%' }}>Chemical</th>
                  <th style={{ width: '15%' }}>UOM</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Quantity</th>
                  <th>Remarks</th>
                </tr>
              </thead>

              <tbody>
                {items.length ? (
                  items.map((row, i) => (
                    <tr key={row.id}>
                      <td>{i + 1}</td>
                      <td align='center'>
                        <IconButton size='small' color='primary' onClick={() => handleEditItem(row)}>
                          <EditIcon fontSize='small' />
                        </IconButton>
                        <IconButton size='small' color='error' onClick={() => handleRemoveItem(row.id)}>
                          <DeleteIcon fontSize='small' />
                        </IconButton>
                      </td>
                      <td>{row.chemical}</td>
                      <td>{row.uom}</td>
                      <td style={{ textAlign: 'right' }}>{row.quantity}</td>
                      <td>{row.remarks || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>
                      No items
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </StickyTableWrapper>
        </Box>

        <Divider />

        {/* ACTIONS */}
        <Box px={4} py={3} display='flex' justifyContent='flex-end' gap={2}>
          <GlobalButton color='secondary' onClick={() => router.push(`/${lang}/admin/transfer/material-request`)}>
            Cancel
          </GlobalButton>
          <GlobalButton variant='contained' onClick={handleUpdate} disabled={saveLoading}>
            {saveLoading ? 'Updating...' : 'Update Request'}
          </GlobalButton>
        </Box>
      </Card>
    </StickyListLayout>
  )
}

const RefactoredEditMaterialRequestPage = () => {
  return (
    <PermissionGuard permission='Material Request'>
      <EditMaterialRequestPage />
    </PermissionGuard>
  )
}

export default RefactoredEditMaterialRequestPage
