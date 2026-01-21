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
import { getPurchaseFilters, getPurchaseOrderDetails, updatePurchaseOrder } from '@/api/purchase/purchase_order'
import { getSupplierList } from '@/api/stock/supplier'
import { getMaterialRequestDropdowns } from '@/api/transfer/materialRequest/dropdown'
import { showToast } from '@/components/common/Toasts'

const EditPurchaseOrderPage = () => {
  const router = useRouter()
  const params = useParams()
  const { lang, id } = params
  const searchParams = useSearchParams()
  const decodedId = useMemo(() => {
    if (!id) return null
    try {
      return atob(id)
    } catch (e) {
      return id
    }
  }, [id])

  // Dropdown options
  const [originOptions, setOriginOptions] = useState([])
  const [supplierOptions, setSupplierOptions] = useState([])
  const [chemicalOptions, setChemicalOptions] = useState([])
  const [uomOptions, setUomOptions] = useState([])

  // Loading states
  const [initLoading, setInitLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  // Header fields
  const [origin, setOrigin] = useState(null)
  const [poDate, setPoDate] = useState(null)

  const [supplier, setSupplier] = useState(null)
  const [remarks, setRemarks] = useState('')

  // Item entry fields
  const [chemical, setChemical] = useState(null)
  const [uom, setUom] = useState(null)
  const [quantity, setQuantity] = useState('')

  const [editId, setEditId] = useState(null)

  const [items, setItems] = useState([])

  const PoDateInput = forwardRef(function PoDateInput(props, ref) {
    const { label, value, ...rest } = props

    return <CustomTextField fullWidth inputRef={ref} label={label} value={value} {...rest} />
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitLoading(true)
        const [purchaseRes, materialRes, detailsRes, supplierRes] = await Promise.all([
          getPurchaseFilters(),
          getMaterialRequestDropdowns(),
          getPurchaseOrderDetails({ id: decodedId }),
          getSupplierList()
        ])

        // Parse Dropdowns
        // Fix: Check nested data
        const purchaseData = purchaseRes?.data?.data || purchaseRes?.data || {}
        const origins =
          purchaseData?.company?.name?.map(item => ({
            label: item.name,
            value: item.name,
            id: item.id
          })) || []

        // Fix: supplierRes might be { count: ..., results: ... } or { data: { results: ... } }
        console.log('Supplier Response:', supplierRes) // DEBUG
        const supplierList = supplierRes?.data?.results || supplierRes?.results || supplierRes?.data || []
        const suppliers = Array.isArray(supplierList)
          ? supplierList.map(item => ({
              label: item.name,
              value: item.name,
              id: item.id
            }))
          : []

        const materialData = materialRes?.data || materialRes

        // Chemicals (PRIORITY: Specialized Purchase API)
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

        const uoms =
          materialData?.uom?.name?.map(u => ({
            label: u.name,
            value: u.name,
            id: u.id
          })) || []

        setOriginOptions(origins)
        setSupplierOptions(suppliers)
        setChemicalOptions(chemicals)
        setUomOptions(uoms)

        // Parse Details
        const details = detailsRes?.data || detailsRes || {}
        console.log('PO Details Response:', details) // DEBUG DETAILS
        setPoDate(details.po_date ? parseISO(details.po_date) : null)
        setRemarks(details.remarks || '')

        if (details.company_id) {
          const foundOrigin = origins.find(o => o.id === details.company_id)
          if (foundOrigin) setOrigin(foundOrigin)
        }

        if (details.supplier_id) {
          const foundSupplier = suppliers.find(s => String(s.id) === String(details.supplier_id))
          if (foundSupplier) {
            setSupplier(foundSupplier)
          } else if (details.supplier) {
            // Fallback: Use name from details if ID match fails (since it's read-only)
            setSupplier({ label: details.supplier, value: details.supplier, id: details.supplier_id })
          }
        } else if (details.supplier) {
          setSupplier({ label: details.supplier, value: details.supplier, id: null })
        }

        const itemsList =
          details.order_items || details.po_chemicals || details.items || details.purchase_order_chemicals || []
        const mappedItems = itemsList.map(item => {
          const chemId =
            item.chemical_id || item.item_id || item.chemical?.id || item.chemical_details?.id || item.chemical
          const uomId = item.uom_id || item.uom_details?.id || item.uom?.id || item.uom

          // Fallback lookup if name is null
          const foundChem = chemicals.find(c => String(c.id) === String(chemId))
          const foundUom = uoms.find(u => String(u.id) === String(uomId))

          return {
            id: item.id,
            chemical:
              item.chemical_name ||
              item.item_name ||
              item.chemical?.name ||
              item.chemical_details?.name ||
              foundChem?.label ||
              (typeof item.chemical === 'string' ? item.chemical : '') ||
              '',
            chemicalId: chemId,
            uom:
              item.uom_name ||
              item.item_uom ||
              item.uom_details?.name ||
              foundUom?.label ||
              (typeof item.uom === 'string' ? item.uom : item.uom?.name) ||
              '',
            uomId: uomId,
            quantity: item.quantity,
            rate: 0,
            amount: 0,
            isNew: false
          }
        })
        setItems(mappedItems)
      } catch (err) {
        console.error('Failed to fetch PO details', err)
        showToast('error', 'Failed to load purchase order data')
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
      const foundUom = uomOptions.find(u => u.label.toLowerCase() === val.uom.toLowerCase())
      if (foundUom) {
        setUom(foundUom)
      } else {
        setUom({ label: val.uom, value: val.uom, id: null })
      }
    } else {
      setUom(null)
    }
  }

  const handleEditItem = row => {
    setEditId(row.id)
    setChemical({ label: row.chemical, id: row.chemicalId })
    setUom({ label: row.uom, id: row.uomId })
    setQuantity(row.quantity)
  }

 const handleAddItem = () => {
  if (!chemical) {
    showToast('error', 'Please select a chemical')
    return
  }
  if (!uom) {
    showToast('error', 'Please select a UOM')
    return
  }
  if (!quantity || Number(quantity) <= 0) {
    showToast('error', 'Please enter valid quantity')
    return
  }

  const chemId = chemical.id
  const uomId = uom.id
  const qty = Number(quantity)

  // 🔍 Check SAME chemical + SAME UOM already exists
  const existingIndex = items.findIndex(
    item =>
      String(item.chemicalId) === String(chemId) &&
      String(item.uomId) === String(uomId)
  )

  // 🟢 CASE 1: Same chemical + same UOM → ADD quantity
  if (existingIndex !== -1) {
    setItems(prev =>
      prev.map((item, index) =>
        index === existingIndex
          ? {
              ...item,
              quantity: Number(item.quantity) + qty
            }
          : item
      )
    )
  }
  // 🟡 CASE 2: Different chemical OR different UOM → NEW ROW
  else {
    setItems(prev => [
      ...prev,
      {
        id: Date.now(),
        chemical: chemical.label,
        chemicalId: chemId,
        uom: uom.label,
        uomId: uomId,
        quantity: qty,
        isNew: true
      }
    ])
  }

  // reset fields
  setChemical(null)
  setUom(null)
  setQuantity('')
}


  const handleRemoveItem = id => {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const handleUpdate = async () => {
    if (!origin || !poDate || !supplier || items.length === 0) {
      showToast('warning', 'Please fill all required fields and add at least one chemical')
      return
    }

    try {
      setSaveLoading(true)
      // Build payload
      const payload = {
        supplier_id: supplier.id,
        po_date: format(poDate, 'yyyy-MM-dd'),
        company_id: origin.id,
        remarks,
        employee_id: 1,
        po_status: 'Pending',
        is_completed: 0,

        order_items_input: items.map(item => {
          const obj = {
            company_id: origin.id,
            supplier_id: supplier.id,
            po_id: decodedId, // 🔥 MUST
            item_id: item.chemicalId,
            item_name: item.chemical,
            uom_id: item.uomId,
            quantity: Number(item.quantity),
            unit_rate: item.unit_rate || 0,
            is_active: 1,
            status: 1
          }

          // Existing item → UPDATE
          if (!item.isNew && item.id) {
            obj.id = item.id
          }

          return obj
        })
      }

      console.log('Update Payload:', JSON.stringify(payload, null, 2)) // DEBUG PAYLOAD

      await updatePurchaseOrder({ id: decodedId, payload })

      showToast('success', 'Purchase Order updated successfully')
      router.push(`/${lang}/admin/purchase/purchase-order`)
    } catch (err) {
      console.error('Failed to update Purchase Order', err)
      showToast('error', err?.response?.data?.message || 'Failed to update Purchase Order')
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
          <Link href={`/${lang}/admin/purchase/purchase-order`} style={{ textDecoration: 'none' }}>
            Purchase Order
          </Link>
          <Typography color='text.primary'>Edit</Typography>
        </Breadcrumbs>
      }
    >
      <Card>
        <CardHeader
          title={
            <Typography variant='h5' fontWeight={600}>
              Update Purchase Order
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
              <GlobalAutocomplete label='Origin' options={originOptions} value={origin} onChange={setOrigin} />
            </Grid>

            <Grid item xs={12} md={4}>
              <AppReactDatepicker
                selected={poDate}
                onChange={date => setPoDate(date)}
                dateFormat='dd/MM/yyyy'
                customInput={<PoDateInput label='PO Date' value={poDate ? format(poDate, 'dd/MM/yyyy') : ''} />}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalTextField
                label='Supplier'
                value={supplier?.label || ''}
                InputProps={{
                  readOnly: true
                }}
              />
            </Grid>

            <Grid item xs={12}>
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
                label='Chemical'
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
                  <th style={{ width: '25%', textAlign: 'left' }}>Quantity</th>
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
                      <td style={{ textAlign: 'left' }}>{row.quantity}</td>
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
          <GlobalButton color='secondary' onClick={() => router.push(`/${lang}/admin/purchase/purchase-order`)}>
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

export default function EditPurchaseOrderWrapper() {
  return (
    <PermissionGuard permission='Purchase Order'>
      <EditPurchaseOrderPage />
    </PermissionGuard>
  )
}
