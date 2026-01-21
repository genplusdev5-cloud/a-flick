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

import { getPurchaseFilters } from '@/api/purchase/purchase_order/filter'
import { getMaterialRequestById, updateMaterialRequest } from '@/api/transfer/materialRequest/edit'
import { getMaterialRequestDropdowns } from '@/api/transfer/materialRequest/dropdown'
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
  const [originOptions, setOriginOptions] = useState([])
  const [employeeOptions, setEmployeeOptions] = useState([])
  const [chemicalOptions, setChemicalOptions] = useState([])
  const [uomOptions, setUomOptions] = useState([])
  const [supplierOptions, setSupplierOptions] = useState([])

  // Loading states
  const [initLoading, setInitLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  // Header fields
  const [requestDate, setRequestDate] = useState(null)
  const [origin, setOrigin] = useState(null)
  const [fromEmployee, setFromEmployee] = useState(null)
  const [toEmployee, setToEmployee] = useState(null)

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

        const [dropdownRes, detailsRes, filterRes] = await Promise.all([
          getMaterialRequestDropdowns(),
          getMaterialRequestById(decodedId),
          getPurchaseFilters()
        ])

        // --- DROPDOWNS ---
        const dd = dropdownRes?.data || dropdownRes || {}
        const filterData = filterRes?.data || filterRes || {}

        const employees =
          dd.employee?.name?.map(item => ({
            label: item.name,
            value: item.id,
            id: item.id
          })) || []

        const chemicals =
          dd.chemicals?.name?.map(item => ({
            label: item.name,
            value: item.id,
            id: item.id
          })) || []

        const uoms =
          dd.uom?.name?.map(item => ({
            label: item.name,
            value: item.id,
            id: item.id
          })) || []

        const suppliers =
          dd.supplier?.name?.map(item => ({
            label: item.name,
            value: item.id,
            id: item.id
          })) || []

        const purchaseData = filterData?.data || filterData || {}
        const origins =
          purchaseData?.company?.name?.map(item => ({
            label: item.name,
            value: item.name,
            id: item.id
          })) || []

        setEmployeeOptions(employees)
        setChemicalOptions(chemicals)
        setUomOptions(uoms)
        setSupplierOptions(suppliers)
        setOriginOptions(origins)

        // --- DETAILS ---
        const data = detailsRes?.data ?? detailsRes ?? {}

        if (data.request_date) setRequestDate(new Date(data.request_date))

        setOrigin(origins.find(o => o.id == data.origin_id) || null)
        setFromEmployee(employees.find(e => e.label === data.from_location) || (data.from_location ? { label: data.from_location, id: data.from_location } : null))
        setToEmployee(employees.find(e => e.label === data.to_location) || (data.to_location ? { label: data.to_location, id: data.to_location } : null))
        setRemarks(data.remarks || '')

        // --- ITEMS ---
        const itemsList = data.items || []

        const mappedItems = itemsList.map(item => {
          const chemId = item.item_id || item.item?.id || item.chemical_id
          const uomId = item.uom_id || item.uom?.id

          return {
            id: item.id,
            chemical: item.item_name || item.chemical_name || item.item?.name || '',
            chemicalId: chemId,
            uom: item.uom_name || item.uom || item.uom_details?.name || '',
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
    setChemical({ label: row.chemical, id: row.chemicalId })
    setUom({ label: row.uom, id: row.uomId })
    setQuantity(row.quantity)
    // In update, remarks for individual items might be handled differently, 
    // but the user's focus is on header fields and UI alignment.
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
          id: `temp-${Date.now()}`,
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
    if (items.length === 0) {
      showToast('warning', 'Please add at least one item')
      return
    }

    try {
      setSaveLoading(true)

      const payload = {
        id: Number(decodedId),
        request_date: format(requestDate, 'yyyy-MM-dd'),
        origin_id: origin?.id || null,
        from_location: fromEmployee?.label || null,
        to_location: toEmployee?.label || null,
        remarks: remarks,
        items: items.map(item => ({
          id: String(item.id).startsWith('temp') ? null : item.id,
          item_id: item.chemicalId,
          item_name: item.chemical,
          uom: item.uom,
          uom_id: item.uomId,
          quantity: Number(item.quantity)
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
                label='Origin'
                options={originOptions}
                value={origin}
                onChange={setOrigin}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='From Employee'
                options={employeeOptions}
                value={fromEmployee}
                onChange={setFromEmployee}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='To Employee'
                options={employeeOptions}
                value={toEmployee}
                onChange={setToEmployee}
              />
            </Grid>

            <Grid item xs={12} md={8}>
              <GlobalTextField
                label='Remarks'
                multiline
                minRows={1}
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
              <GlobalAutocomplete label='Chemical' options={chemicalOptions} value={chemical} onChange={setChemical} />
            </Grid>

            <Grid item xs={12} md={2}>
              <GlobalAutocomplete label='UOM' options={uomOptions} value={uom} onChange={setUom} />
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
