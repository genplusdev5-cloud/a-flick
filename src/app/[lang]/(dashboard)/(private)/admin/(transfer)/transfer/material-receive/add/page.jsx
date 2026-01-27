'use client'

import { useState, useMemo, useEffect, forwardRef } from 'react'
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

import { getPurchaseFilters } from '@/api/purchase/purchase_order'
import { getMaterialRequestDropdowns } from '@/api/transfer/materialRequest/dropdown'
import { addMaterialReceive } from '@/api/transfer/material_receive'
import { getMaterialIssueList } from '@/api/transfer/material_issue'
import { showToast } from '@/components/common/Toasts'

import { format, parseISO } from 'date-fns'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import CustomTextField from '@core/components/mui/TextField'

const AddMaterialReceivePage = () => {
  const router = useRouter()
  const { lang } = useParams()

  // Dropdowns
  const [employeeOptions, setEmployeeOptions] = useState([])
  const [chemicalOptions, setChemicalOptions] = useState([])
  const [uomOptions, setUomOptions] = useState([])
  const [issueOptions, setIssueOptions] = useState([])

  // Loading
  const [initLoading, setInitLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  // Header fields
  const [origin, setOrigin] = useState(null)
  const [originOptions, setOriginOptions] = useState([])
  const [fromVehicle, setFromVehicle] = useState(null)
  const [toVehicle, setToVehicle] = useState(null)
  const [materialIssue, setMaterialIssue] = useState(null)
  const [receiveDate, setReceiveDate] = useState(new Date())
  const [remarks, setRemarks] = useState('')

  // Item fields
  const [chemical, setChemical] = useState(null)
  const [uom, setUom] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [editId, setEditId] = useState(null)

  const [items, setItems] = useState([])

  // 🔹 Fetch dropdowns
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setInitLoading(true)

        const [purchaseRes, materialRes] = await Promise.all([getPurchaseFilters(), getMaterialRequestDropdowns()])

        const purchaseData = purchaseRes?.data?.data || purchaseRes?.data || {}

        const materialData = materialRes?.data?.data || materialRes?.data || materialRes || {}

        const techs =
          materialData?.employee?.name?.map(e => ({
            label: e.name,
            value: e.id,
            id: e.id
          })) || []

        setEmployeeOptions(techs)

        setChemicalOptions(
          (materialData?.chemicals?.name || materialData?.chemicals || []).map(c => ({
            label: c.label || c.name || '',
            value: c.value || c.id,
            id: c.value || c.id,
            uom: c.uom || c.unit || c.uom_id
          }))
        )

        setUomOptions(
          materialData?.uom?.name?.map(u => ({
            label: u.name,
            value: u.id,
            id: u.id
          })) || []
        )

        const origins = (purchaseData?.company?.name || []).map(i => ({
          label: i.name,
          value: i.id,
          id: i.id
        }))
        setOriginOptions(origins)
        if (origins.length > 0) setOrigin(origins[0])

        const issueRes = await getMaterialIssueList({ page_size: 100 })
        const issueData = issueRes?.data?.results || issueRes?.results || []
        setIssueOptions(
          issueData.map(i => {
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
        )
      } catch (err) {
        console.error(err)
        showToast('error', 'Failed to load dropdowns')
      } finally {
        setInitLoading(false)
      }
    }

    fetchOptions()
  }, [])

  const handleEditItem = row => {
    setEditId(row.id)
    setChemical({ label: row.chemical, id: row.chemicalId })
    setUom({ label: row.uom, id: row.uomId })
    setQuantity(row.quantity)
  }

  const handleChemicalChange = val => {
    setChemical(val)
    if (val && val.uom) {
      const uomVal = val.uom
      // Try to find in uomOptions by ID or Label
      const foundUom = uomOptions.find(
        u => String(u.id) === String(uomVal) || String(u.label).toLowerCase() === String(uomVal).toLowerCase()
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

  // Date input
  const DateInput = forwardRef(function DateInput(props, ref) {
    return <CustomTextField fullWidth inputRef={ref} {...props} />
  })

  // Add item
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

  // Save
  const handleSave = async () => {
    if (!fromVehicle || !toVehicle || !receiveDate || items.length === 0) {
      showToast('warning', 'Fill all required fields')
      return
    }

    try {
      setSaveLoading(true)

      const payload = {
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
        items: items.map(i => ({
          item_id: i.chemicalId,
          item_name: i.chemical,
          uom_id: i.uomId,
          uom: i.uom,
          quantity: Number(i.quantity),
          is_active: 1,
          status: 1
        }))
      }

      await addMaterialReceive(payload)

      showToast('success', 'Material Receive added successfully')
      router.push(`/${lang}/admin/transfer/material-receive`)
    } catch (err) {
      console.error(err)
      showToast('error', err?.response?.data?.message || 'Failed to save record')
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
          <Typography>Add</Typography>
        </Breadcrumbs>
      }
    >
      <Card>
        <CardHeader title='Add Material Receive' />
        <Divider />

        {/* HEADER */}
        <Box px={4} py={3} position='relative'>
          {initLoading && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1,
                bgcolor: 'rgba(255,255,255,0.7)'
              }}
            >
              <CircularProgress />
            </Box>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <AppReactDatepicker
                selected={receiveDate}
                onChange={setReceiveDate}
                customInput={<DateInput label='Receive Date' />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <GlobalAutocomplete label='Origin' options={originOptions} value={origin} onChange={setOrigin} />
            </Grid>
            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='From Vehicle'
                options={employeeOptions}
                value={fromVehicle}
                onChange={setFromVehicle}
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
                        <IconButton size='small' color='primary' onClick={() => handleEditItem(i)}>
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
            Close
          </GlobalButton>
          <GlobalButton variant='contained' onClick={handleSave} disabled={saveLoading}>
            {saveLoading ? 'Saving...' : 'Save'}
          </GlobalButton>
        </Box>
      </Card>
    </StickyListLayout>
  )
}

export default function AddMaterialReceiveWrapper() {
  return (
    <PermissionGuard permission='Material Request Received'>
      <AddMaterialReceivePage />
    </PermissionGuard>
  )
}
