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

import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'

import styles from '@core/styles/table.module.css'

import { getPurchaseFilters } from '@/api/purchase/purchase_inward'
import { getMaterialRequestDropdowns } from '@/api/transfer/materialRequest/dropdown'
import { getMaterialIssueDetails, updateMaterialIssue } from '@/api/transfer/material_issue'
import { getVehicleDropdown } from '@/api/purchase/vehicle/dropdown'

import { showToast } from '@/components/common/Toasts'

const EditMaterialRequestIssuedPage = () => {
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

  /* ───── STATES ───── */
  const [employeeOptions, setEmployeeOptions] = useState([])
  const [originOptions, setOriginOptions] = useState([])
  const [chemicalOptions, setChemicalOptions] = useState([])
  const [uomOptions, setUomOptions] = useState([])
  const [vehicleOptions, setVehicleOptions] = useState([])

  const [requestNo, setRequestNo] = useState('')
  const [origin, setOrigin] = useState(null)
  const [fromVehicle, setFromVehicle] = useState(null)
  const [toVehicle, setToVehicle] = useState(null)
  const [issueDate, setIssueDate] = useState(null)
  const [remarks, setRemarks] = useState('')

  const [chemical, setChemical] = useState(null)
  const [uom, setUom] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [editId, setEditId] = useState(null)

  const [items, setItems] = useState([])

  const [initLoading, setInitLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  /* ───── DATE INPUT ───── */
  const DateInput = forwardRef(function DateInput(props, ref) {
    return <CustomTextField fullWidth inputRef={ref} {...props} />
  })

  /* ───── FETCH DATA ───── */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitLoading(true)

        const [purchaseRes, materialRes, detailsRes, vehicleRes] = await Promise.all([
          getPurchaseFilters(),
          getMaterialRequestDropdowns(),
          getMaterialIssueDetails(decodedId, type),
          getVehicleDropdown()
        ])

        /* DROPDOWNS */
        const purchaseData = purchaseRes?.data?.data || purchaseRes?.data || purchaseRes || {}
        const materialData = materialRes?.data?.data || materialRes?.data || materialRes || {}

        // Employees
        const employees = (materialData?.employee?.name || []).map(e => ({
          label: e.name,
          value: e.id,
          id: e.id
        }))
        setEmployeeOptions(employees)

        // Chemicals (Robust fetching)
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
          uom: c.uom || c.uom_name || c.unit || c.uom_id
        }))
        setChemicalOptions(chemicals)

        // Origin
        const origins = (purchaseData?.company?.name || []).map(i => ({
          label: i.name,
          value: i.id,
          id: i.id
        }))
        setOriginOptions(origins)

        // UOM
        const uomRaw = materialData?.uom?.name || materialData?.uom || []
        const uoms = uomRaw.map(u => ({
          label: u.name,
          value: u.id,
          id: u.id
        }))
        setUomOptions(uoms)

        // Vehicles
        const vehicles = (vehicleRes?.vehicle || []).map(v => ({
          label: v.vehicle_name || v.name,
          value: v.id,
          id: v.id
        }))
        setVehicleOptions(vehicles)

        /* DETAILS */
        const detailJson = detailsRes?.data || detailsRes || {}
        const d = detailJson?.data || detailJson

        if (d && Object.keys(d).length > 0) {
          setOrigin(origins.find(o => String(o.id) === String(d.company_id || d.origin_id)) || null)
          setRequestNo(d.request_no || d.request_details?.num_series || d.request_details?.request_no || '')
          setIssueDate(d.issue_date ? parseISO(d.issue_date) : d.receive_date ? parseISO(d.receive_date) : null)
          setRemarks(d.remarks || '')

          setFromVehicle(
            vehicles.find(v => String(v.id) === String(d.from_employee_id || d.from_vehicle_id)) ||
              (d.from_vehicle && d.from_vehicle !== '-'
                ? { label: d.from_vehicle, id: d.from_vehicle_id || d.from_employee_id }
                : null)
          )
          setToVehicle(
            vehicles.find(v => String(v.id) === String(d.to_employee_id || d.to_vehicle_id)) ||
              (d.to_vehicle && d.to_vehicle !== '-'
                ? { label: d.to_vehicle, id: d.to_vehicle_id || d.to_employee_id }
                : null)
          )

          setItems(
            (d.items || d.transfer_items || d.transfer_in_items || []).map(item => ({
              id: item.id,
              chemical: item.item_name || item.chemical_name || item.chemical?.name || '',
              chemicalId: item.item_id || item.chemical_id || item.chemical?.id,
              uom: item.uom_name || item.uom?.name || item.uom_details?.name || item.uom,
              uomId: item.uom_id || item.uom?.id || item.uom_details?.id,
              quantity: item.quantity || item.transfer_quantity
            }))
          )
        }
      } catch (err) {
        showToast('error', 'Failed to load details')
      } finally {
        setInitLoading(false)
      }
    }

    if (decodedId) fetchData()
  }, [decodedId, type])

  const handleChemicalChange = val => {
    setChemical(val)
    if (val && val.uom) {
      const uomVal = typeof val.uom === 'object' ? val.uom.label || val.uom.name : val.uom

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

  const handleEditItem = row => {
    setEditId(row.id)
    setChemical({ label: row.chemical, id: row.chemicalId, uom: row.uom })
    setUom({ label: row.uom, id: row.uomId })
    setQuantity(row.quantity)
  }

  /* ───── ITEM HANDLERS ───── */
  const handleAddItem = () => {
    if (!chemical || !uom || !quantity) {
      showToast('warning', 'Fill all item fields')
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

  /* ───── UPDATE ───── */
  const handleUpdate = async () => {
    if (!requestNo || !fromVehicle || !toVehicle || !issueDate || !items.length) {
      showToast('warning', 'Fill all required fields')
      return
    }

    try {
      setSaveLoading(true)

      const payload = {
        id: decodedId,
        request_no: requestNo,
        origin_id: origin?.id || null,
        company_id: origin?.id || null,
        from_employee_id: fromVehicle?.id || null,
        to_employee_id: toVehicle?.id || null,
        employee_id: fromVehicle?.id || null,
        from_vehicle: fromVehicle?.label || '-',
        from_vehicle_id: fromVehicle?.id || null,
        to_vehicle: toVehicle?.label || '-',
        to_vehicle_id: toVehicle?.id || null,
        issue_date: format(issueDate, 'yyyy-MM-dd'),
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

      await updateMaterialIssue(decodedId, payload)

      showToast('success', 'Material Issued updated successfully')
      router.push(`/${lang}/admin/transfer/material-issued`)
    } catch {
      showToast('error', 'Update failed')
    } finally {
      setSaveLoading(false)
    }
  }

  return (
    <StickyListLayout
      header={
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link href={`/${lang}`}>Dashboard</Link>
          <Link href={`/${lang}/admin/transfer/material-issued`}>Material Issued</Link>
          <Typography color='text.primary'>Edit</Typography>
        </Breadcrumbs>
      }
    >
      <Card>
        <CardHeader title='Update Material Issued' />
        <Divider />

        {/* HEADER */}
        <Box px={4} py={3}>
          <Grid container spacing={3}>
            <Grid item md={4} xs={12}>
              <AppReactDatepicker
                selected={issueDate}
                onChange={setIssueDate}
                customInput={<DateInput label='Issue Date' />}
              />
            </Grid>

            <Grid item md={4} xs={12}>
              <GlobalAutocomplete
                label='From Vehicle'
                options={vehicleOptions}
                value={fromVehicle}
                onChange={setFromVehicle}
              />
            </Grid>

            <Grid item md={4} xs={12}>
              <GlobalAutocomplete
                label='To Vehicle'
                options={vehicleOptions}
                value={toVehicle}
                onChange={setToVehicle}
              />
            </Grid>

            <Grid item md={4} xs={12}>
              <GlobalTextField label='Request No' value={requestNo} onChange={e => setRequestNo(e.target.value)} />
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
            <Grid item md={4} xs={12}>
              <GlobalAutocomplete
                label='Chemical'
                options={chemicalOptions}
                value={chemical}
                onChange={handleChemicalChange}
              />
            </Grid>

            <Grid item md={3} xs={12}>
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

            <Grid item md={3} xs={12}>
              <GlobalTextField
                label='Quantity'
                type='number'
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
              />
            </Grid>

            <Grid item md={2} xs={12}>
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
                  <th>ID</th>
                  <th style={{ width: '40%' }}>Chemical</th>
                  <th style={{ width: '25%' }}>UOM</th>
                  <th align='right' style={{ width: '20%' }}>
                    Qty
                  </th>
                  <th align='center'>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.length ? (
                  items.map((r, i) => (
                    <tr key={r.id}>
                      <td>{i + 1}</td>
                      <td>{r.chemical}</td>
                      <td>{r.uom}</td>
                      <td align='right'>{r.quantity}</td>
                      <td align='center'>
                        <IconButton size='small' color='primary' onClick={() => handleEditItem(r)}>
                          <EditIcon fontSize='small' />
                        </IconButton>
                        <IconButton size='small' color='error' onClick={() => handleRemoveItem(r.id)}>
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
          <GlobalButton color='secondary' onClick={() => router.push(`/${lang}/admin/transfer/material-issued`)}>
            Cancel
          </GlobalButton>

          <GlobalButton variant='contained' onClick={handleUpdate} disabled={saveLoading}>
            {saveLoading ? 'Updating...' : 'Update'}
          </GlobalButton>
        </Box>
      </Card>
    </StickyListLayout>
  )
}

export default function EditMaterialRequestIssuedWrapper() {
  return (
    <PermissionGuard permission='Material Request Issued'>
      <EditMaterialRequestIssuedPage />
    </PermissionGuard>
  )
}
