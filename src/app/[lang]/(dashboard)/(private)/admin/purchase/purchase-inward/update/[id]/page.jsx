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
import { getPurchaseFilters, getPurchaseInwardDetails, updatePurchaseInward } from '@/api/purchase_inward'
import { getMaterialRequestDropdowns } from '@/api/materialRequest/dropdown'
import { showToast } from '@/components/common/Toasts'

const EditPurchaseInwardPage = () => {
  const router = useRouter()
  const params = useParams()
  const { lang, id} = params
  const searchParams = useSearchParams()
  const type = searchParams.get('type') || 'tm'
  
  let decodedId = null
  try {
    if (id) {
      // First URL-decode, then base64-decode
      const urlDecoded = decodeURIComponent(id)
      decodedId = atob(urlDecoded)
    }
  } catch (e) {
    console.error('Failed to decode ID:', id, e)
    // Try without URL decoding
    try {
      decodedId = id ? atob(id) : null
    } catch {
      decodedId = id // Final fallback to using ID as-is
    }
  }

  // Dropdown options
  const [originOptions, setOriginOptions] = useState([])
  const [supplierOptions, setSupplierOptions] = useState([])
  const [purchaseOrderOptions, setPurchaseOrderOptions] = useState([])
  const [chemicalOptions, setChemicalOptions] = useState([])
  const [uomOptions, setUomOptions] = useState([])

  // Loading states
  const [initLoading, setInitLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  // Header fields
  const [origin, setOrigin] = useState(null)
  const [poDate, setPoDate] = useState(null)

  const [supplier, setSupplier] = useState(null)
  const [purchaseOrder, setPurchaseOrder] = useState(null)
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
          getPurchaseInwardDetails({ id: decodedId, type })
        ])

        // --- DROPDOWNS ---
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

        const purchaseOrders =
          purchaseData?.purchase_order?.name?.map(item => ({
            label: item.name,
            value: item.id,
            id: item.id
          })) || []

        setOriginOptions(origins)
        setSupplierOptions(suppliers)
        setPurchaseOrderOptions(purchaseOrders)

        // --- MATERIAL DROPDOWNS ---
        const materialData = materialRes?.data || materialRes

        setChemicalOptions(
          materialData?.chemicals?.name?.map(c => ({
            label: c.name,
            value: c.name,
            id: c.id
          })) || []
        )

        setUomOptions(
          materialData?.uom?.name?.map(u => ({
            label: u.name,
            value: u.name,
            id: u.id
          })) || []
        )

        // --- DETAILS ---
        const details = detailsRes?.data ?? detailsRes ?? {}

        setPoDate(details?.inward_date ? new Date(details.inward_date) : null)

        setRemarks(details.remarks || '')

        // ⚠️ IMPORTANT: match AFTER dropdowns ready
        setOrigin(origins.find(x => x.id === details.company_id) || null)
        setSupplier(suppliers.find(x => x.id === details.supplier_id) || null)
        setPurchaseOrder(purchaseOrders.find(x => x.id === details.po_id) || null)

        // --- ITEMS ---
        const inwardItems = details.inward_items || []

        setItems(
          inwardItems.map(item => ({
            id: item.id,
            chemical: item.chemical_name,
            chemicalId: item.chemical_id,
            uom: item.uom_name,
            uomId: item.uom_id,
            quantity: item.quantity,
            rate: item.unit_rate,
            amount: (Number(item.quantity) || 0) * (Number(item.unit_rate) || 0)
          }))
        )
      } catch (err) {
        console.error('Failed to fetch purchase inward details', err)
        showToast('error', 'Failed to load purchase inward data')
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
    setChemical(chemicalOptions.find(c => c.id === row.chemicalId) || null)
    setUom(uomOptions.find(u => u.id === row.uomId) || null)
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
          chemical: chemical.label,
          chemicalId: chemical.id,
          uom: uom.label,
          uomId: uom.id,
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
      const payload = {
        company_id: origin.id,
        inward_date: format(poDate, 'yyyy-MM-dd'),
        supplier_id: supplier.id,
        po_id: purchaseOrder?.id || null,
        remarks,
        inward_items: items.map(item => ({
          id: String(item.id).length > 10 ? null : item.id,
          chemical_id: item.chemicalId,
          uom_id: item.uomId,
          quantity: Number(item.quantity),
          unit_rate: Number(item.rate)
        }))
      }

      await updatePurchaseInward({ id: decodedId, payload })

      showToast('success', 'Purchase Inward updated successfully')

      router.push(`/${lang}/admin/purchase/purchase-inward`)
    } catch (err) {
      console.error('Failed to update Purchase Order', err)
      showToast('error', err?.response?.data?.message || 'Failed to update Purchase Order')
    } finally {
    }
  }

  return (
    <StickyListLayout
      header={
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link href={`/${lang}`} style={{ textDecoration: 'none' }}>
            Dashboard
          </Link>
          <Link href={`/${lang}/admin/purchase/purchase-inward`}>Purchase Inward</Link>

          <Typography color='text.primary'>Edit</Typography>
        </Breadcrumbs>
      }
    >
      <Card>
        <CardHeader
          title={
            <Typography variant='h5' fontWeight={600}>
              Update Purchase Inward
            </Typography>
          }
        />

        <Divider />

        {/* HEADER FORM */}
        <Box px={4} py={3} position='relative'>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <GlobalAutocomplete label='Origin' options={originOptions} value={origin} onChange={setOrigin} />
            </Grid>

            <Grid item xs={12} md={4}>
              <AppReactDatepicker
                selected={poDate}
                onChange={date => setPoDate(date)}
                dateFormat='dd/MM/yyyy'
                customInput={<PoDateInput label='Inward Date' value={poDate ? format(poDate, 'dd/MM/yyyy') : ''} />}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete label='Supplier' options={supplierOptions} value={supplier} onChange={setSupplier} />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='Purchase Order'
                options={purchaseOrderOptions}
                value={purchaseOrder}
                onChange={setPurchaseOrder}
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

            <Grid item xs={12} md={2}>
              <GlobalTextField label='Rate' type='number' value={rate || ''} onChange={e => setRate(e.target.value)} />
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
                  <th>ID</th>
                  <th style={{ width: '25%' }}>Chemical</th>
                  <th style={{ width: '15%' }}>UOM</th>
                  <th align='right' style={{ width: '15%' }}>
                    Quantity
                  </th>
                  <th align='right' style={{ width: '15%' }}>
                    Rate
                  </th>
                  <th align='right' style={{ width: '15%' }}>
                    Amount
                  </th>
                  <th align='center'>Action</th>
                </tr>
              </thead>

              <tbody>
                {items.length ? (
                  items.map((row, i) => (
                    <tr key={row.id}>
                      <td>{i + 1}</td>
                      <td>{row.chemical}</td>
                      <td>{row.uom}</td>
                      <td align='right'>{row.quantity}</td>
                      <td align='right'>{row.rate}</td>
                      <td align='right'>{isNaN(row.amount) ? '-' : row.amount}</td>
                      <td align='center'>
                        <IconButton size='small' color='primary' onClick={() => handleEditItem(row)}>
                          <EditIcon fontSize='small' />
                        </IconButton>
                        <IconButton size='small' color='error' onClick={() => handleRemoveItem(row.id)}>
                          <DeleteIcon fontSize='small' />
                        </IconButton>
                      </td>
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
          <GlobalButton color='secondary' onClick={() => router.push(`/${lang}/admin/purchase/purchase-inward`)}>
            Cancel
          </GlobalButton>
          <GlobalButton variant='contained' onClick={handleUpdate}>
            Update
          </GlobalButton>
        </Box>
      </Card>
    </StickyListLayout>
  )
}

export default function EditPurchaseInwardWrapper() {
  return (
    <PermissionGuard permission='Purchase Inward'>
      <EditPurchaseInwardPage />
    </PermissionGuard>
  )
}
