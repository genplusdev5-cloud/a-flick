'use client'

import { useState, useMemo, useEffect, forwardRef } from 'react'
import Link from 'next/link'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
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

import styles from '@core/styles/table.module.css'
import { getPurchaseFilters } from '@/api/purchase/purchase_order'
import { getMaterialRequestDropdowns } from '@/api/transfer/materialRequest/dropdown'
import { getMaterialReceiveDetails, updateMaterialReceive } from '@/api/transfer/material_receive'
import { getMaterialIssueList } from '@/api/transfer/material_issue'
import { getVehicleDropdown } from '@/api/purchase/vehicle/dropdown'
import { showToast } from '@/components/common/Toasts'

const EditMaterialRequestReceivedPage = () => {
  const router = useRouter()
  const { lang, id } = useParams()
  const searchParams = useSearchParams()
  const type = searchParams.get('type') || 'tm'

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

  // Dropdowns
  const [employeeOptions, setEmployeeOptions] = useState([])
  const [chemicalOptions, setChemicalOptions] = useState([])
  const [uomOptions, setUomOptions] = useState([])
  const [issueOptions, setIssueOptions] = useState([])
  const [vehicleOptions, setVehicleOptions] = useState([])

  // Loading
  const [initLoading, setInitLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  // Header fields
  const [origin, setOrigin] = useState(null)
  const [originOptions, setOriginOptions] = useState([])
  const [fromVehicle, setFromVehicle] = useState(null)
  const [toVehicle, setToVehicle] = useState(null)
  const [materialIssue, setMaterialIssue] = useState(null)
  const [receiveDate, setReceiveDate] = useState(null)
  const [remarks, setRemarks] = useState('')

  // Item fields
  const [chemical, setChemical] = useState(null)
  const [uom, setUom] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [editId, setEditId] = useState(null)

  const [items, setItems] = useState([])

  const DateInput = forwardRef(function DateInput(props, ref) {
    return <CustomTextField fullWidth inputRef={ref} {...props} />
  })

  // 🔥 FETCH DETAILS
  useEffect(() => {
    const fetchData = async () => {
      setInitLoading(true)
      try {
        // Step 1: Fetch Dropdowns (Parallel)
        const [purchaseRes, materialRes, issueRes, vehicleRes] = await Promise.all([
          getPurchaseFilters().catch(e => {
            console.error('Origin error', e)
            return null
          }),
          getMaterialRequestDropdowns().catch(e => {
            console.error('Material drop error', e)
            return null
          }),
          getMaterialIssueList({ page_size: 100 }).catch(e => {
            console.error('Issue list error', e)
            return null
          }),
          getVehicleDropdown().catch(e => {
            console.error('Vehicle drop error', e)
            return null
          })
        ])

        // --- DROPDOWNS ---
        const materialData = materialRes?.data?.data || materialRes?.data || materialRes || {}
        const filterData = purchaseRes?.data || purchaseRes || {}
        const purchaseData = filterData?.data || filterData || {}

        // 1. Employees
        const employeeRaw = materialData?.employee?.name || materialData?.employee || []
        const techs = employeeRaw.map(e => ({
          label: e.name || e.label || '',
          value: e.id || e.value,
          id: e.id || e.value
        }))
        setEmployeeOptions(techs)

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

        setChemicalOptions(
          chemRaw.map(c => ({
            label: c.name || c.label || '',
            value: c.id || c.value,
            id: c.id || c.value,
            uom: c.uom_name || c.uom || c.unit || c.uom_id
          }))
        )

        // 3. UOM
        const uomRaw = materialData?.uom?.name || materialData?.uom || []
        setUomOptions(
          uomRaw.map(u => ({
            label: u.name || u.label || '',
            value: u.id || u.value,
            id: u.id || u.value
          }))
        )

        // 4. Origins
        const originRaw = purchaseData?.company?.name || purchaseData?.company || []
        const origins = originRaw.map(i => ({
          label: i.name || i.label || '',
          value: i.id || i.value,
          id: i.id || i.value
        }))
        setOriginOptions(origins)

        // 5. Issues
        const issueData = issueRes?.data?.results || issueRes?.results || []
        const issues = issueData.map(i => {
          const trNo = i.num_series || i.issue_number || `Issue #${i.id}`
          const trDate =
            i.receive_date || i.issue_date ? format(parseISO(i.receive_date || i.issue_date), 'dd/MM/yyyy') : ''
          const tech = i.technician_name || i.technician || ''
          return {
            label: `${trNo}${trDate ? ` (${trDate})` : ''}${tech ? ` - ${tech}` : ''}`,
            value: i.id,
            id: i.id,
            items: i.items || i.transfer_items || []
          }
        })
        setIssueOptions(issues)

        // Vehicles
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
            const detailsRes = await getMaterialReceiveDetails(decodedId, type)
            const detailJson = detailsRes?.data || detailsRes || {}
            const details = detailJson?.data || detailJson

            if (details) {
              setReceiveDate(
                details.receive_date
                  ? parseISO(details.receive_date)
                  : details.issue_date
                    ? parseISO(details.issue_date)
                    : null
              )
              setRemarks(details.remarks || '')

              setOrigin(origins.find(o => String(o.id) === String(details.origin_id || details.company_id)) || null)
              setFromVehicle(
                vehicles.find(v => String(v.id) === String(details.from_vehicle_id)) ||
                  (details.from_vehicle && details.from_vehicle !== '-'
                    ? { label: details.from_vehicle, id: details.from_vehicle_id }
                    : null)
              )
              setToVehicle(
                vehicles.find(v => String(v.id) === String(details.to_vehicle_id)) ||
                  (details.to_vehicle && details.to_vehicle !== '-'
                    ? { label: details.to_vehicle, id: details.to_vehicle_id }
                    : null)
              )

              setMaterialIssue(
                issues.find(i => String(i.id) === String(details.issue_id)) ||
                  (details.issue_id ? { label: `Issue #${details.issue_id}`, id: details.issue_id } : null)
              )

              setItems(
                (details.items || details.transfer_items || details.transfer_in_items || []).map(item => ({
                  id: item.id,
                  chemical: item.item_name || item.chemical_name || item.chemical?.name || '',
                  chemicalId: item.item_id || item.chemical_id || item.chemical?.id,
                  uom: item.uom_name || item.uom?.name || item.uom_details?.name || item.uom,
                  uomId: item.uom_id || item.uom?.id || item.uom_details?.id,
                  quantity: item.quantity || item.transfer_quantity
                }))
              )
            }
          } catch (detErr) {
            console.error('Details load failed', detErr)
            // showToast('error', 'Failed to load record details') // Optional: don't annoy user if only details fail
          }
        }
      } catch (err) {
        console.error('Init failed', err)
        showToast('error', 'Failed to load metadata')
      } finally {
        setInitLoading(false)
      }
    }

    if (decodedId) fetchData()
  }, [decodedId, type])

  const handleIssueChange = val => {
    setMaterialIssue(val)
    if (val && val.items) {
      setItems(
        val.items.map(i => ({
          id: Date.now() + Math.random(),
          chemical: i.item_name || i.chemical_name || '',
          chemicalId: i.item_id || i.chemical_id,
          uom: i.uom || i.uom_name || '',
          uomId: i.uom_id,
          quantity: i.transfer_quantity || i.quantity || ''
        }))
      )
    }
  }

  const handleChemicalChange = val => {
    setChemical(val)
    if (val && val.uom) {
      const uomVal = typeof val.uom === 'object' ? val.uom.label || val.uom.name : val.uom

      // Try to find in uomOptions by ID or Label
      const foundUom = uomOptions.find(
        u =>
          String(u.id) === String(uomVal) ||
          String(u.label).toLowerCase() === String(uomVal).toLowerCase() ||
          String(u.value).toLowerCase() === String(uomVal).toLowerCase()
      )

      if (foundUom) {
        setUom(foundUom)
      } else if (typeof uomVal === 'string') {
        setUom({ label: uomVal, value: uomVal, id: null })
      } else {
        setUom(null)
      }
    } else {
      setUom(null)
    }
  }

  const handleAddItem = () => {
    if (!chemical || !uom || !quantity) {
      showToast('error', 'Fill all item fields')
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
                quantity
              }
            : item
        )
      )
      setEditId(null)
    } else {
      setItems(prev => [
        ...prev,
        {
          id: Date.now(),
          chemical: chemical.label,
          chemicalId: chemical.id,
          uom: uom.label,
          uomId: uom.id,
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
    if (saveLoading) return

    if (!fromVehicle || !toVehicle || !receiveDate || items.length === 0) {
      showToast('warning', 'Fill all required fields')
      return
    }

    try {
      setSaveLoading(true)

      const payload = {
        id: decodedId,
        origin_id: origin?.id || null,
        company_id: origin?.id || null,
        from_vehicle: fromVehicle?.label || '-',
        from_vehicle_id: fromVehicle?.id || null,
        to_vehicle: toVehicle?.label || '-',
        to_vehicle_id: toVehicle?.id || null,
        issue_id: materialIssue?.id || null,
        employee_id: fromVehicle?.id || null,
        from_employee_id: fromVehicle?.id || null,
        to_employee_id: toVehicle?.id || null,
        receive_date: format(receiveDate, 'yyyy-MM-dd'),
        receive_status: 'Pending',
        remarks,
        is_active: 1,
        status: 1,
        items: JSON.stringify(
          items.map(i => {
            const itemObj = {
              item_id: i.chemicalId,
              item_name: i.chemical,
              uom_id: i.uomId,
              uom: i.uom,
              quantity: Number(i.quantity),
              is_active: 1,
              status: 1
            }

            if (i.id && !String(i.id).startsWith('temp') && String(i.id).length < 12) {
              itemObj.id = Number(i.id)
            }

            return itemObj
          })
        )
      }

      await updateMaterialReceive(decodedId, payload)

      showToast('success', 'Material Received updated successfully')
      router.push(`/${lang}/admin/transfer/material-receive`)
    } catch (err) {
      console.error(err)
      showToast('error', err?.response?.data?.message || 'Update failed')
    } finally {
      setSaveLoading(false)
    }
  }

  return (
    <StickyListLayout
      header={
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link href={`/${lang}`}>Dashboard</Link>
          <Link href={`/${lang}/admin/transfer/material-receive`}>Material Receive</Link>
          <Typography>Update</Typography>
        </Breadcrumbs>
      }
    >
      <Card>
        <CardHeader title='Update Material Receive' />
        <Divider />

        {/* HEADER */}
        <Box px={4} py={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <GlobalAutocomplete label='Origin' options={originOptions} value={origin} onChange={setOrigin} />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='From Vehicle'
                options={vehicleOptions}
                value={fromVehicle}
                onChange={setFromVehicle}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <AppReactDatepicker
                selected={receiveDate}
                onChange={setReceiveDate}
                customInput={<DateInput label='Receive Date' />}
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
              <GlobalAutocomplete
                label='Material Issued'
                options={issueOptions}
                value={materialIssue}
                onChange={handleIssueChange}
              />
            </Grid>

            <Grid item xs={12} md={8}>
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

        {/* ITEMS */}
        <Box px={4} py={3}>
          <Grid container spacing={2} alignItems='flex-end'>
            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='Chemical'
                options={chemicalOptions}
                value={chemical}
                onChange={handleChemicalChange}
              />
            </Grid>
            <Grid item xs={12} md={3}>
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
            <Grid item xs={12} md={2}>
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

        {/* TABLE */}
        <Box px={4} pb={3}>
          <StickyTableWrapper rowCount={items.length}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th style={{ width: '40%' }}>Chemical</th>
                  <th style={{ width: '25%' }}>UOM</th>
                  <th align='right' style={{ width: '20%' }}>
                    Quantity
                  </th>
                  <th align='center'>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.length ? (
                  items.map((i, idx) => (
                    <tr key={i.id}>
                      <td>{idx + 1}</td>
                      <td>{i.chemical}</td>
                      <td>{i.uom}</td>
                      <td align='right'>{i.quantity}</td>
                      <td align='center'>
                        <IconButton
                          size='small'
                          color='primary'
                          onClick={() => {
                            setEditId(i.id)
                            setChemical({ label: i.chemical, id: i.chemicalId })
                            setUom({ label: i.uom, id: i.uomId })
                            setQuantity(i.quantity)
                          }}
                        >
                          <EditIcon fontSize='small' />
                        </IconButton>
                        <IconButton size='small' color='error' onClick={() => handleRemoveItem(i.id)}>
                          <DeleteIcon fontSize='small' />
                        </IconButton>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} align='center'>
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
          <GlobalButton color='secondary' onClick={() => router.push(`/${lang}/admin/transfer/material-receive`)}>
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

export default function EditMaterialRequestReceivedWrapper() {
  return (
    <PermissionGuard permission='Material Request Received'>
      <EditMaterialRequestReceivedPage />
    </PermissionGuard>
  )
}
