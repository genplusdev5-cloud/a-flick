'use client'

import { useState, useMemo, useEffect, forwardRef } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { Box, Card, CardHeader, Typography, Grid, Divider, IconButton, Breadcrumbs } from '@mui/material'

import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'

import StickyListLayout from '@/components/common/StickyListLayout'
import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import PermissionGuard from '@/components/auth/PermissionGuard'

import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import styles from '@core/styles/table.module.css'
import { getPurchaseFilters } from '@/api/purchase/purchase_order/filter'
import { addMaterialRequest } from '@/api/transfer/materialRequest/add'
import { getMaterialRequestDropdowns } from '@/api/transfer/materialRequest/dropdown'
import { getVehicleDropdown } from '@/api/purchase/vehicle/dropdown'
import { showToast } from '@/components/common/Toasts'

import { format } from 'date-fns'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import CustomTextField from '@core/components/mui/TextField'

export default function AddMaterialRequestPage() {
  const router = useRouter()
  const { lang } = useParams()

  // Dropdown options
  const [originOptions, setOriginOptions] = useState([])
  const [employeeOptions, setEmployeeOptions] = useState([])
  const [chemicalOptions, setChemicalOptions] = useState([])
  const [uomOptions, setUomOptions] = useState([])
  const [supplierOptions, setSupplierOptions] = useState([])
  const [vehicleOptions, setVehicleOptions] = useState([])

  // Loading states
  const [initLoading, setInitLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  // Header fields
  const [requestDate, setRequestDate] = useState(new Date())
  const [origin, setOrigin] = useState(null)
  const [fromVehicle, setFromVehicle] = useState(null)
  const [toVehicle, setToVehicle] = useState(null)
  const [remarks, setRemarks] = useState('')
  const [currentUser, setCurrentUser] = useState(null)

  // Item fields
  const [chemical, setChemical] = useState(null)
  const [uom, setUom] = useState(null)
  const [quantity, setQuantity] = useState('')

  const [editId, setEditId] = useState(null)

  // Items list
  const [items, setItems] = useState([])

  const PoDateInput = forwardRef(function PoDateInput(props, ref) {
    const { label, value, ...rest } = props

    return <CustomTextField fullWidth inputRef={ref} label={label} value={value} {...rest} />
  })

  useEffect(() => {
    const stored = localStorage.getItem('user_info')
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored))
      } catch (e) {
        console.error('Error parsing user_info', e)
      }
    }
  }, [])

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setInitLoading(true)
        const [mrRes, filterRes, vehicleRes] = await Promise.all([
          getMaterialRequestDropdowns(),
          getPurchaseFilters(),
          getVehicleDropdown()
        ])
        const materialData = mrRes?.data || mrRes
        const filterData = filterRes?.data || filterRes
        const purchaseData = filterData?.data || filterData || {}

        // 1. Origins
        const origins =
          purchaseData?.company?.name?.map(item => ({
            label: item.name,
            value: item.name,
            id: item.id
          })) || []
        setOriginOptions(origins)

        // 2. Chemicals (PRIORITY: Specialized Purchase API)
        let chemRaw = []
        if (Array.isArray(purchaseData?.chemicals)) {
          chemRaw = purchaseData.chemicals
        } else if (Array.isArray(purchaseData?.chemicals?.name)) {
          chemRaw = purchaseData.chemicals.name
        } else if (Array.isArray(materialData?.chemicals?.name)) {
          chemRaw = materialData.chemicals.name
        }

        const chemicals = chemRaw.map(c => ({
          label: c.name,
          value: c.name,
          id: c.id,
          uom: c.uom || c.uom_name || c.unit
        }))
        setChemicalOptions(chemicals)

        // 3. UOM
        const uomRaw = materialData?.uom?.name || materialData?.uom || []
        const uoms = uomRaw.map(u => ({
          label: u.name,
          value: u.name,
          id: u.id
        }))
        setUomOptions(uoms)

        // 4. Employees
        setEmployeeOptions(
          (materialData?.employee?.name || []).map(e => ({
            label: e.name,
            id: e.id,
            value: e.id
          }))
        )

        // 5. Suppliers
        setSupplierOptions(
          (materialData?.supplier?.name || []).map(s => ({
            label: s.name,
            id: s.id,
            value: s.id
          }))
        )

        // 6. Vehicles
        const vehicles = (vehicleRes?.vehicle || []).map(v => ({
          label: v.vehicle_name || v.name,
          value: v.id,
          id: v.id
        }))
        setVehicleOptions(vehicles)

        // Set default origin if available
        const defaultOrigin = origins.find(o => o.label === 'A-Flick Pte Ltd') || origins[0]
        if (defaultOrigin) {
          setOrigin(defaultOrigin)
        }
      } catch (err) {
        console.error('Dropdown load failed:', err)
        showToast('error', 'Failed to load dropdown data')
      } finally {
        setInitLoading(false)
      }
    }
    fetchOptions()
  }, [])

  const handleChemicalChange = val => {
    setChemical(val)
    if (val && val.uom) {
      const uomStr = typeof val.uom === 'object' ? val.uom.label || val.uom.name : val.uom
      const foundUom = uomOptions.find(u => u.label.toLowerCase() === uomStr.toLowerCase())
      if (foundUom) {
        setUom(foundUom)
      } else {
        setUom({ label: uomStr, value: uomStr, id: null })
      }
    } else {
      setUom(null)
    }
  }

  const handleEditItem = row => {
    setEditId(row.id)
    setChemical({ label: row.chemical, id: row.chemicalId, uom: row.uom })
    setUom({ label: row.uom, id: row.uomId })
    setQuantity(row.quantity)
  }

  const handleAddItem = () => {
    if (!chemical || !uom || !quantity) {
      showToast('error', 'Please select a chemical, UOM, and enter quantity')
      return
    }

    // 💡 NEW: Deduplication logic
    const existingIndex = items.findIndex(
      item =>
        item.chemicalId === (chemical.id || chemical.value) &&
        item.uomId === (uom.id || uom.value) &&
        item.id !== editId
    )

    if (editId) {
      setItems(prev =>
        prev.map(item =>
          item.id === editId
            ? {
                ...item,
                chemical: chemical.label,
                chemicalId: chemical.id || chemical.value,
                uom: uom.label,
                uomId: uom.id || uom.value,
                quantity
              }
            : item
        )
      )
      setEditId(null)
    } else if (existingIndex !== -1) {
      // Update existing item if found
      setItems(prev =>
        prev.map((item, idx) =>
          idx === existingIndex
            ? {
                ...item,
                quantity: Number(item.quantity) + Number(quantity)
              }
            : item
        )
      )
    } else {
      setItems(prev => [
        ...prev,
        {
          id: Date.now(),
          chemical: chemical.label,
          chemicalId: chemical.id || chemical.value,
          uom: uom.label,
          uomId: uom.id || uom.value,
          quantity
        }
      ])
    }

    setChemical(null)
    setUom(null)
    setQuantity('')
  }

  const handleRemoveItem = id => {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const handleSaveAll = async () => {
    if (saveLoading) return

    if (items.length === 0) {
      showToast('warning', 'Please add at least one chemical')
      return
    }

    if (!fromVehicle) {
      showToast('error', 'Please select From Vehicle')
      return
    }

    if (!toVehicle) {
      showToast('error', 'Please select To Vehicle')
      return
    }

    try {
      setSaveLoading(true)
      const payload = {
        request_date: format(requestDate, 'yyyy-MM-dd'),
        remarks: remarks,
        employee_id: Number(fromVehicle?.id || currentUser?.id) || null,
        from_vehicle: fromVehicle?.label || '-',
        from_vehicle_id: Number(fromVehicle?.id) || null,
        to_vehicle: toVehicle?.label || '-',
        to_vehicle_id: Number(toVehicle?.id) || null,
        request_status: 'Pending',
        is_active: 1,
        status: 1,
        items: items.map(i => ({
          item_id: Number(i.chemicalId) || null,
          item_name: i.chemical,
          uom: i.uom,
          uom_id: Number(i.uomId) || null,
          quantity: Number(i.quantity),
          is_active: 1,
          status: 1
        }))
      }

      // Only include origin if it has a value
      if (origin?.id) {
        payload.origin_id = Number(origin.id) || null
        payload.company_id = Number(origin.id) || null
      }

      await addMaterialRequest(payload)
      showToast('success', 'Material Request added successfully')
      router.push(`/${lang}/admin/transfer/material-request`)
    } catch (err) {
      console.error('Save failed:', err)
      showToast('error', err?.response?.data?.message || 'Failed to save Material Request')
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
          <Typography color='text.primary'>Add</Typography>
        </Breadcrumbs>
      }
    >
      <Card>
        <CardHeader
          title={
            <Typography variant='h5' fontWeight={600}>
              Add Material Request
            </Typography>
          }
        />

        <Divider />

        {/* HEADER FORM */}
        <Box px={4} py={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <AppReactDatepicker
                selected={requestDate}
                onChange={date => setRequestDate(date)}
                dateFormat='dd/MM/yyyy'
                customInput={
                  <PoDateInput label='Request Date' value={requestDate ? format(requestDate, 'dd/MM/yyyy') : ''} />
                }
              />
            </Grid>

            {/* <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='Origin'
                options={originOptions}
                value={origin}
                onChange={setOrigin}
              />
            </Grid> */}

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='From Vehicle'
                options={vehicleOptions}
                value={fromVehicle}
                onChange={setFromVehicle}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='To Vehicle'
                options={vehicleOptions}
                value={toVehicle}
                onChange={setToVehicle}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalTextField
                label='Remarks'
                multiline
                minRows={3}
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
              />
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {/* ITEM ENTRY */}
        <Box px={4} py={3}>
          <Grid container spacing={2} alignItems='flex-end'>
            <Grid item xs={12} md={3}>
              <GlobalAutocomplete
                label='Chemicals'
                options={chemicalOptions}
                value={chemical}
                onChange={handleChemicalChange}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <GlobalTextField
                label='UOM'
                value={uom?.label || ''}
                InputProps={{
                  readOnly: true
                }}
                disabled
                sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#f5f5f5' } }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <GlobalTextField
                label='Quantity'
                type='number'
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={1}>
              <GlobalButton
                variant='contained'
                color={editId ? 'info' : 'primary'}
                startIcon={editId ? <EditIcon /> : <AddIcon />}
                onClick={handleAddItem}
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
                  <th style={{ width: '50px' }}>S.No</th>
                  <th align='center' style={{ width: '100px', textAlign: 'center' }}>
                    Action
                  </th>
                  <th style={{ width: '40%' }}>Chemical</th>
                  <th style={{ width: '25%' }}>UOM</th>
                  <th style={{ width: '25%', textAlign: 'right' }}>Quantity</th>
                </tr>
              </thead>

              <tbody>
                {items.length ? (
                  items.map((row, i) => (
                    <tr key={row.id}>
                      <td>{i + 1}</td>
                      <td align='center'>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                          <IconButton
                            size='small'
                            color='primary'
                            onClick={() => handleEditItem(row)}
                            sx={{ padding: '4px' }}
                          >
                            <EditIcon fontSize='small' sx={{ fontSize: '1.25rem' }} />
                          </IconButton>

                          <IconButton
                            size='small'
                            color='error'
                            onClick={() => handleRemoveItem(row.id)}
                            sx={{ padding: '4px' }}
                          >
                            <DeleteIcon fontSize='small' sx={{ fontSize: '1.25rem' }} />
                          </IconButton>
                        </div>
                      </td>
                      <td>{row.chemical}</td>
                      <td>{row.uom}</td>
                      <td style={{ textAlign: 'right' }}>{row.quantity}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>
                      No chemicals added
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
            Close
          </GlobalButton>
          <GlobalButton variant='contained' onClick={handleSaveAll} disabled={saveLoading || items.length === 0}>
            {saveLoading ? 'Saving...' : 'Save Request'}
          </GlobalButton>
        </Box>
      </Card>
    </StickyListLayout>
  )
}
