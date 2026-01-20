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
import { getMaterialRequestDropdowns } from '@/api/transfer/materialRequest/dropdown'
import { showToast } from '@/components/common/Toasts'

const EditPurchaseOrderPage = () => {
  const router = useRouter()
  const params = useParams()
  const { lang, id } = params
  const searchParams = useSearchParams()
  const type = searchParams.get('type') || 'tm'
  const decodedId = id ? atob(id) : null

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
  const [rate, setRate] = useState('')
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
        const [purchaseRes, materialRes, detailsRes] = await Promise.all([
          getPurchaseFilters(),
          getMaterialRequestDropdowns(),
          getPurchaseOrderDetails({ id: decodedId, type })
        ])

        // Parse Dropdowns
        const purchaseData = purchaseRes?.data?.data || {}
        const origins =
          purchaseData?.company?.name?.map(item => ({
            label: item.name,
            value: item.name,
            id: item.id
          })) || []
        const suppliers =
          purchaseData?.supplier?.name?.map(item => ({
            label: item.name,
            value: item.name,
            id: item.id
          })) || []

        const materialData = materialRes?.data || materialRes
        const chemicals =
          materialData?.chemicals?.name?.map(c => ({
            label: c.name,
            value: c.name,
            id: c.id
          })) || []
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
        const details = detailsRes?.data || {}
        setPoDate(details.po_date ? parseISO(details.po_date) : null)
        setRemarks(details.remarks || '')

        if (details.company_id) {
          const foundOrigin = origins.find(o => o.id === details.company_id)
          if (foundOrigin) setOrigin(foundOrigin)
        }

        if (details.supplier_id) {
          const foundSupplier = suppliers.find(s => s.id === details.supplier_id)
          if (foundSupplier) setSupplier(foundSupplier)
        }

        const itemsList =
          details.order_items || details.po_chemicals || details.items || details.purchase_order_chemicals || []
        const mappedItems = itemsList.map(item => {
          const chemId = item.chemical_id || item.item_id || item.chemical?.id || item.chemical_details?.id || item.chemical
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
            rate: item.unit_rate || item.rate,
            amount: (Number(item.quantity) || 0) * (Number(item.unit_rate || item.rate) || 0)
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

  const handleEditItem = row => {
    setEditId(row.id)
    setChemical({ label: row.chemical, id: row.chemicalId })
    setUom({ label: row.uom, id: row.uomId })
    setQuantity(row.quantity)
    setRate(row.rate)
  }

  const amount = useMemo(() => {
    const q = Number(quantity)
    const r = Number(rate)
    return q && r ? q * r : ''
  }, [quantity, rate])

  const handleAddItem = () => {
    if (!chemical || !uom || !quantity || !rate) {
      showToast('error', 'Please fill all chemical fields')
      return
    }

    if (editId) {
      // Update existing item
      setItems(prev =>
        prev.map(item =>
          item.id === editId
            ? {
                ...item,
                chemical: chemical?.label || (typeof chemical === 'string' ? chemical : ''),
                chemicalId: chemical?.id || (typeof chemical === 'object' ? chemical?.value : chemical),
                uom: uom?.label || (typeof uom === 'string' ? uom : ''),
                uomId: uom?.id || (typeof uom === 'object' ? uom?.value : uom),
                quantity,
                rate,
                amount
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
          chemical: chemical?.label || (typeof chemical === 'string' ? chemical : ''),
          chemicalId: chemical?.id || (typeof chemical === 'object' ? chemical?.value : chemical),
          uom: uom?.label || (typeof uom === 'string' ? uom : ''),
          uomId: uom?.id || (typeof uom === 'object' ? uom?.value : uom),
          quantity,
          rate,
          amount
        }
      ])
    }

    setChemical(null)
    setUom(null)
    setQuantity('')
    setRate('')
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
      const itemsPayload = items.map(item => {
        const itemObj = {
          chemical_id: item.chemicalId,
          uom_id: item.uomId,
          quantity: Number(item.quantity),
          unit_rate: Number(item.rate)
        }

        // Only add ID if NOT tx type, or if we want to risk it.
        // User says "like add", and "add" has NO IDs.
        // So for 'tx', we strictly omit IDs. 
        if (type !== 'tx') {
          itemObj.id = String(item.id).length > 10 ? null : item.id
        }

        return itemObj
      })

      const payload = {
        company_id: origin.id,
        po_date: format(poDate, 'yyyy-MM-dd'),
        supplier_id: supplier.id,
        remarks: remarks,
        order_items_input: items.map(item => ({
          id: String(item.id).length > 10 ? null : item.id,
          chemical_id: item.chemicalId,
          item_id: item.chemicalId,
          item_name: item.chemical,
          uom_id: item.uomId,
          uom: item.uom,
          quantity: Number(item.quantity),
          unit_rate: Number(item.rate),
          rate: Number(item.rate),
          is_active: 1,
          status: 1
        })),
        order_items: itemsPayload,
        items: itemsPayload, // Fallback key
        po_chemicals: itemsPayload, // Another fallback
        purchase_order_chemicals: itemsPayload, // Long form
        chemicals: itemsPayload // Simple form
      }

      await updatePurchaseOrder({ id: decodedId, payload, type })
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
              <GlobalAutocomplete label='Supplier' options={supplierOptions} value={supplier} onChange={setSupplier} />
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
              <GlobalAutocomplete label='Chemical' options={chemicalOptions} value={chemical} onChange={setChemical} />
            </Grid>

            <Grid item xs={12} md={2}>
              <GlobalAutocomplete label='UOM' options={uomOptions} value={uom} onChange={setUom} />
            </Grid>

            <Grid item xs={12} md={2}>
              <GlobalTextField
                label='Quantity'
                type='number'
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <GlobalTextField label='Rate' type='number' value={rate} onChange={e => setRate(e.target.value)} />
            </Grid>

            <Grid item xs={12} md={2}>
              <GlobalTextField label='Amount' value={amount} disabled />
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
                  <th style={{ width: '50px', minWidth: '50px' }}>ID</th>
                  <th align='center' style={{ width: '100px' }}>
                    Action
                  </th>
                  <th style={{ width: '25%' }}>Chemical</th>
                  <th style={{ width: '15%' }}>UOM</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Quantity</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Rate</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Amount</th>
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
                      <td style={{ textAlign: 'right' }}>{row.rate}</td>
                      <td style={{ textAlign: 'right' }}>{row.amount}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 24 }}>
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
