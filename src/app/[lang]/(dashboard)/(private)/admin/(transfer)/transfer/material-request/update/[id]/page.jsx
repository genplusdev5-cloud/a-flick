'use client'

import { useState, useEffect, useMemo, forwardRef } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { Box, Card, CardHeader, Typography, Grid, Divider, IconButton, Breadcrumbs } from '@mui/material'

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

import { getPurchaseFilters } from '@/api/purchase/purchase_order/filter'
import { getMaterialRequestById, updateMaterialRequest } from '@/api/transfer/materialRequest/edit'
import { getMaterialRequestDropdowns } from '@/api/transfer/materialRequest/dropdown'
import { getVehicleDropdown } from '@/api/purchase/vehicle/dropdown'
import { showToast } from '@/components/common/Toasts'
import styles from '@core/styles/table.module.css'

const EditMaterialRequestPage = () => {
  const router = useRouter()
  const params = useParams()
  const { lang, id } = params

  const decodedId = useMemo(() => {
    if (!id) return null
    try {
      const urlDecoded = decodeURIComponent(id)
      return atob(urlDecoded.replace(/-/g, '+').replace(/_/g, '/'))
    } catch (e) {
      try {
        return atob(String(id).replace(/-/g, '+').replace(/_/g, '/'))
      } catch {
        return id
      }
    }
  }, [id])

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
  const [requestDate, setRequestDate] = useState(null)
  const [origin, setOrigin] = useState(null)
  const [fromVehicle, setFromVehicle] = useState(null)
  const [toVehicle, setToVehicle] = useState(null)
  const [remarks, setRemarks] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [originalData, setOriginalData] = useState(null) // 💡 NEW: Store original record data
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
    const fetchData = async () => {
      setInitLoading(true)
      try {
        // Step 1: Fetch Metadata (Parallel)
        const [dropdownRes, filterRes, vehicleRes] = await Promise.all([
          getMaterialRequestDropdowns(),
          getPurchaseFilters(),
          getVehicleDropdown()
        ])

        // --- DROPDOWNS ---
        const materialData = dropdownRes?.data?.data || dropdownRes?.data || dropdownRes || {}
        const filterData = filterRes?.data || filterRes || {}
        const purchaseData = filterData?.data || filterData || {}

        // 1. Origins
        const originRaw = purchaseData?.company?.name || purchaseData?.company || []
        const origins = originRaw.map(item => ({
          label: item.name || item.label || '',
          value: item.id || item.value,
          id: item.id || item.value
        }))
        setOriginOptions(origins)

        // 2. Chemicals
        let chemRaw = []
        if (Array.isArray(purchaseData?.chemicals)) {
          chemRaw = purchaseData.chemicals
        } else if (Array.isArray(purchaseData?.chemicals?.name)) {
          chemRaw = purchaseData.chemicals.name
        } else if (Array.isArray(materialData?.chemicals?.name)) {
          chemRaw = materialData.chemicals.name
        } else if (Array.isArray(materialData?.chemical?.name)) {
          chemRaw = materialData.chemical.name
        }

        const chemicals = chemRaw.map(c => ({
          label: c.name || c.label || '',
          value: c.id || c.value,
          id: c.id || c.value,
          uom: c.uom || c.uom_name || c.unit
        }))
        setChemicalOptions(chemicals)

        // 3. UOM
        const uomRaw = materialData?.uom?.name || materialData?.uom || []
        const uoms = uomRaw.map(u => ({
          label: u.name || u.label || '',
          value: u.id || u.value,
          id: u.id || u.value
        }))
        setUomOptions(uoms)

        // 4. Employees
        const employeeRaw = materialData?.employee?.name || materialData?.employee || []
        const employees = employeeRaw.map(item => ({
          label: item.name || item.label || '',
          value: item.id || item.value,
          id: item.id || item.value
        }))
        setEmployeeOptions(employees)

        // 5. Suppliers
        const supplierRaw = materialData?.supplier?.name || materialData?.supplier || []
        const suppliers = supplierRaw.map(item => ({
          label: item.name || item.label || '',
          value: item.id || item.value,
          id: item.id || item.value
        }))
        setSupplierOptions(suppliers)

        // 6. Vehicles
        const vehicleRaw = vehicleRes?.vehicle || []
        const vehicles = vehicleRaw.map(v => ({
          label: v.vehicle_name || v.name,
          value: v.id,
          id: v.id
        }))
        setVehicleOptions(vehicles)

        // Step 2: Fetch Details (Sequential or Parallel with fallback)
        if (decodedId && decodedId !== 'NaN') {
          try {
            const detailsRes = await getMaterialRequestById(decodedId)
            const data = detailsRes?.data ?? detailsRes ?? {}

            if (data) {
              setOriginalData(data) // 💡 Store original data for preservation
              if (data.request_date) setRequestDate(new Date(data.request_date))

              setOrigin(origins.find(o => String(o.id) === String(data.origin_id)) || null)
              setFromVehicle(
                vehicles.find(v => String(v.id) === String(data.from_vehicle_id)) ||
                  (data.from_vehicle && data.from_vehicle !== '-'
                    ? { label: data.from_vehicle, id: data.from_vehicle_id }
                    : null)
              )
              setToVehicle(
                vehicles.find(v => String(v.id) === String(data.to_vehicle_id)) ||
                  (data.to_vehicle && data.to_vehicle !== '-'
                    ? { label: data.to_vehicle, id: data.to_vehicle_id }
                    : null)
              )
              setRemarks(data.remarks || '')

              // --- ITEMS ---
              const itemsList = data.items || []

              const mappedItems = itemsList.map(item => {
                const chemId = item.item_id || item.item?.id || item.chemical_id || item.item_details?.id
                const uomId = item.uom_id || item.uom?.id || item.uom_details?.id

                return {
                  id: item.id,
                  chemical:
                    item.item_name ||
                    item.chemical_name ||
                    item.item?.name ||
                    item.item_details?.name ||
                    item.name ||
                    '',
                  chemicalId: chemId,
                  uom:
                    item.uom_name ||
                    item.uom_details?.name ||
                    (typeof item.uom === 'object' ? item.uom.name : item.uom) ||
                    '',
                  uomId: uomId,
                  quantity: item.quantity || item.transfer_quantity || item.transfer_in_quantity || '',
                  remarks: item.remarks || ''
                }
              })

              setItems(mappedItems)
            }
          } catch (detErr) {
            console.error('Details failed', detErr)
          }
        }
      } catch (err) {
        console.error('Failed to fetch metadata', err)
        showToast('error', 'Failed to load metadata')
      } finally {
        setInitLoading(false)
      }
    }

    if (decodedId) {
      fetchData()
    }
  }, [decodedId])

  const handleChemicalChange = val => {
    setChemical(val)
    if (val && val.uom) {
      const uomStr = typeof val.uom === 'object' ? val.uom.label || val.uom.name : val.uom
      const foundUom = uomOptions.find(u => u.label.toLowerCase() === uomStr.toLowerCase() || u.id == val.uom_id)
      if (foundUom) {
        setUom(foundUom)
      } else {
        setUom({ label: uomStr, value: uomStr, id: val.uom_id || null })
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
      showToast('error', 'Please fill all required item fields')
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
          id: `temp-${Date.now()}`,
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

  const handleUpdate = async () => {
    if (items.length === 0) {
      showToast('warning', 'Please add at least one item')
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
        ...originalData, // 💡 Preserve original fields (like supervisor_id, num_series, etc.)
        id: Number(decodedId),
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
        items_input: items.map(item => {
          const itemObj = {
            item_id: Number(item.chemicalId) || null,
            item_name: item.chemical,
            uom: item.uom,
            uom_id: Number(item.uomId) || null,
            quantity: Number(item.quantity),
            is_active: 1,
            status: 1
          }

          if (item.id && !String(item.id).startsWith('temp')) {
            itemObj.id = Number(item.id)
          }

          return itemObj
        })
      }

      // Only include origin if selected to avoid backend attribute errors
      if (origin?.id) {
        payload.origin_id = Number(origin.id) || null
        payload.company_id = Number(origin.id) || null
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
          <Typography color='text.primary'>Update</Typography>
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
        <Box px={4} py={3}>
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
              <GlobalAutocomplete label='Origin' options={originOptions} value={origin} onChange={setOrigin} />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='Request From Vehicle'
                options={vehicleOptions}
                value={fromVehicle}
                onChange={setFromVehicle}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete label='Vehicle' options={vehicleOptions} value={toVehicle} onChange={setToVehicle} />
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
                value={quantity || ''}
                onChange={e => setQuantity(e.target.value)}
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
                  <th style={{ width: '50px' }}>S.No</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Action</th>
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
                    <td colSpan={5} style={{ textAlign: 'center', padding: 24 }}>
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
