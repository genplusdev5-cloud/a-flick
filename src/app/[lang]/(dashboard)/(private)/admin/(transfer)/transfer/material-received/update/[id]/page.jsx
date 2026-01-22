'use client'

import { useState, useMemo, useEffect, forwardRef } from 'react'
import Link from 'next/link'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
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
import { getPurchaseFilters } from '@/api/purchase/purchase_order'
import { getMaterialRequestDropdowns } from '@/api/transfer/materialRequest/dropdown'
import { getMaterialReceiveDetails, updateMaterialReceive } from '@/api/transfer/material_receive'
import { getMaterialIssueList } from '@/api/transfer/material_issue'
import { showToast } from '@/components/common/Toasts'

const EditMaterialRequestReceivedPage = () => {
  const router = useRouter()
  const { lang, id } = useParams()
  const searchParams = useSearchParams()
  const type = searchParams.get('type') || 'tm'

  const decodedId = useMemo(() => {
    try {
      return Number(atob(id))
    } catch {
      return Number(id)
    }
  }, [id])

  // Dropdowns
  const [employeeOptions, setEmployeeOptions] = useState([])
  const [chemicalOptions, setChemicalOptions] = useState([])
  const [uomOptions, setUomOptions] = useState([])
  const [issueOptions, setIssueOptions] = useState([])

  // Loading
  const [initLoading, setInitLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  // Header fields
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
      try {
        setInitLoading(true)

        const [purchaseRes, materialRes, detailsRes, issueRes] = await Promise.all([
          getPurchaseFilters(),
          getMaterialRequestDropdowns(),
          getMaterialReceiveDetails(decodedId, type),
          getMaterialIssueList({ page_size: 100 })
        ])

        const materialData = materialRes?.data?.data || materialRes?.data || materialRes || {}

        // Materials
        const techs =
          materialData?.employee?.name?.map(e => ({
            label: e.name,
            value: e.id,
            id: e.id
          })) || []

        setEmployeeOptions(techs)

        setChemicalOptions(
          materialData?.chemicals?.name?.map(c => ({
            label: c.name,
            value: c.id,
            id: c.id,
            uom: c.uom || c.uom_name || c.unit
          })) || []
        )

        setUomOptions(
          materialData?.uom?.name?.map(u => ({
            label: u.name,
            value: u.id,
            id: u.id
          })) || []
        )

        const issues = (issueRes?.data?.results || issueRes?.results || []).map(i => {
          const trNo = i.num_series || i.issue_number || `Issue #${i.id}`
          const trDate = i.receive_date || i.issue_date ? format(parseISO(i.receive_date || i.issue_date), 'dd/MM/yyyy') : ''
          const tech = i.technician_name || i.technician || ''
          return {
            label: `${trNo}${trDate ? ` (${trDate})` : ''}${tech ? ` - ${tech}` : ''}`,
            value: i.id,
            id: i.id,
            items: i.items || i.transfer_items || []
          }
        })
        setIssueOptions(issues)

        // Details
        const detailJson = detailsRes?.data || detailsRes || {}
        const details = detailJson?.data || detailJson

        setReceiveDate(details.receive_date ? parseISO(details.receive_date) : details.issue_date ? parseISO(details.issue_date) : null)
        setRemarks(details.remarks || '')

        setFromVehicle(techs.find(t => t.id === details.from_vehicle_id) || (details.from_vehicle ? { label: details.from_vehicle, id: details.from_vehicle_id } : null))
        setToVehicle(techs.find(t => t.id === details.to_vehicle_id) || (details.to_vehicle ? { label: details.to_vehicle, id: details.to_vehicle_id } : null))

        setMaterialIssue(issues.find(i => i.id === details.issue_id) || (details.issue_id ? { label: `Issue #${details.issue_id}`, id: details.issue_id } : null))

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
      } catch (err) {
        console.error(err)
        showToast('error', 'Failed to load details')
      } finally {
        setInitLoading(false)
      }
    }

    if (decodedId) fetchData()
  }, [decodedId, type])

  const handleIssueChange = val => {
    setMaterialIssue(val)
    if (val && val.items) {
      setItems(val.items.map(i => ({
        id: Date.now() + Math.random(),
        chemical: i.item_name || i.chemical_name || '',
        chemicalId: i.item_id || i.chemical_id,
        uom: i.uom || i.uom_name || '',
        uomId: i.uom_id,
        quantity: i.transfer_quantity || i.quantity || ''
      })))
    }
  }

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
    if (!fromVehicle || !toVehicle || !receiveDate || items.length === 0) {
      showToast('warning', 'Fill all required fields')
      return
    }

    try {
      setSaveLoading(true)

      const payload = {
        id: decodedId,
        from_vehicle: fromVehicle.label,
        from_vehicle_id: fromVehicle.id,
        to_vehicle: toVehicle.label,
        to_vehicle_id: toVehicle.id,
        issue_id: materialIssue?.id || null,
        employee_id: fromVehicle.id,
        receive_date: format(receiveDate, 'yyyy-MM-dd'),
        remarks,
        is_active: 1,
        status: 1,
        items: JSON.stringify(items.map(i => ({
          id: typeof i.id === 'number' && i.id < 1000000000000 ? i.id : null,
          item_id: i.chemicalId,
          item_name: i.chemical,
          uom_id: i.uomId,
          uom: i.uom,
          quantity: Number(i.quantity),
          is_active: 1,
          status: 1
        })))
      }

      await updateMaterialReceive(decodedId, payload)

      showToast('success', 'Material Received updated successfully')
      router.push(`/${lang}/admin/transfer/material-received`)
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
          <Link href={`/${lang}/admin/transfer/material-received`}>Material Received</Link>
          <Typography>Edit</Typography>
        </Breadcrumbs>
      }
    >
      <Card>
        <CardHeader title='Update Material Received' />
        <Divider />

        {/* HEADER */}
        <Box px={4} py={3} position='relative'>
          {initLoading && (
            <Box
              sx={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1, bgcolor: 'rgba(255,255,255,0.7)' }}
            >
              <CircularProgress />
            </Box>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='From Vehicle'
                options={employeeOptions}
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
                options={employeeOptions}
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
              <GlobalAutocomplete label='Chemical' options={chemicalOptions} value={chemical} onChange={handleChemicalChange} />
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
                        <IconButton size='small' color='primary' onClick={() => {
                          setEditId(i.id)
                          setChemical({ label: i.chemical, id: i.chemicalId })
                          setUom({ label: i.uom, id: i.uomId })
                          setQuantity(i.quantity)
                        }}>
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
          <GlobalButton color='secondary' onClick={() => router.push(`/${lang}/admin/transfer/material-received`)}>
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

export default function EditMaterialRequestReceivedWrapper() {
  return (
    <PermissionGuard permission='Material Request Received'>
      <EditMaterialRequestReceivedPage />
    </PermissionGuard>
  )
}
