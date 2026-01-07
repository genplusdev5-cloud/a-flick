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

import styles from '@core/styles/table.module.css'
import { getPurchaseFilters } from '@/api/purchase_inward'
import { getPurchaseReturnDetails, updatePurchaseReturn } from '@/api/purchase_return'

import { getMaterialRequestDropdowns } from '@/api/materialRequest/dropdown'
import { showToast } from '@/components/common/Toasts'

const EditPurchaseReturnPage = () => {
  const router = useRouter()
  const params = useParams()
  const { lang, id } = params
  const searchParams = useSearchParams()
  const type = searchParams.get('type') || 'tm'
  const decodedId = useMemo(() => {
    if (!id) return null

    try {
      const decoded = atob(id)
      return Number(decoded)
    } catch {
      return Number(id)
    }
  }, [id])

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
  const [returnDate, setReturnDate] = useState(null)

  const [supplier, setSupplier] = useState(null)
  const [purchaseOrder, setPurchaseOrder] = useState(null)
  const [remarks, setRemarks] = useState('')

  // Item entry fields
  const [chemical, setChemical] = useState(null)
  const [uom, setUom] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [rate, setRate] = useState('')

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
          getPurchaseReturnDetails({ id: decodedId, type })
        ])

        // Dropdowns
        const purchaseData = purchaseRes?.data || {}

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

        // 🔥 Purchase Inward Details
        const details = detailsRes?.data || {}

        setReturnDate(details.return_date ? parseISO(details.return_date) : null)

        setRemarks(details.remarks || '')

        if (details.company_id) {
          const o = origins.find(x => x.id === details.company_id)
          if (o) setOrigin(o)
        }

        if (details.supplier_id) {
          const s = suppliers.find(x => x.id === details.supplier_id)
          if (s) setSupplier(s)
        }

        if (details.po_id) {
          const p = purchaseOrders.find(x => x.id === details.po_id)
          if (p) setPurchaseOrder(p)
        }

        // 🔥 Inward items
        const returnItems = details.return_items || details.items || []

        setItems(
          returnItems.map(item => ({
            id: item.id,
            chemical: item.chemical_name || item.chemical,
            chemicalId: item.chemical_id,
            uom: item.uom_name || item.uom,
            uomId: item.uom_id,
            quantity: item.return_quantity,
            rate: item.unit_rate,
            amount: item.return_quantity * item.unit_rate
          }))
        )
      } catch (err) {
        console.error(err)
        showToast('error', 'Failed to load purchase return data')
      } finally {
        setInitLoading(false)
      }
    }

    if (decodedId && !isNaN(decodedId)) {
      fetchData()
    }
  }, [decodedId])

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

    setChemical(null)
    setUom(null)
    setQuantity('')
    setRate('')
  }

  const handleRemoveItem = id => {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const handleUpdate = async () => {
    if (!origin || !returnDate || !supplier || items.length === 0) {
      showToast('warning', 'Please fill all required fields and add at least one chemical')
      return
    }

    try {
      setSaveLoading(true)
      const payload = {
        company_id: origin.id,
        return_date: format(returnDate, 'yyyy-MM-dd'),
        supplier_id: supplier.id,
        remarks,
        return_items: items.map(item => ({
          chemical_id: item.chemicalId,
          uom_id: item.uomId,
          return_quantity: Number(item.quantity),
          unit_rate: Number(item.rate)
        }))
      }

      await updatePurchaseReturn({ id: decodedId, payload })

      showToast('success', 'Purchase Return updated successfully')

      router.push(`/${lang}/admin/purchase/purchase-return`)
    } catch (err) {
      console.error('Failed to update Purchase Return', err)
      showToast('error', 'Failed to update Purchase Return')
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
          <Link href={`/${lang}/admin/purchase/purchase-return`}>Purchase Return</Link>

          <Typography color='text.primary'>Edit</Typography>
        </Breadcrumbs>
      }
    >
      <Card>
        <CardHeader title={<Typography variant='h5'>Update Purchase Return</Typography>} />

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
                selected={returnDate}
                onChange={date => setReturnDate(date)}
                customInput={
                  <PoDateInput label='Return Date' value={returnDate ? format(returnDate, 'dd/MM/yyyy') : ''} />
                }
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
              <GlobalTextField label='Quantity' type='number' value={quantity} onChange={setQuantity} />
            </Grid>

            <Grid item xs={12} md={2}>
              <GlobalTextField label='Rate' type='number' value={rate} onChange={e => setRate(e.target.value)} />
            </Grid>

            <Grid item xs={12} md={2}>
              <GlobalTextField label='Amount' value={amount} disabled />
            </Grid>

            <Grid item xs={12} md={1}>
              <GlobalButton variant='contained' startIcon={<AddIcon />} onClick={handleAddItem}>
                Add
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
                  <th>Chemical</th>
                  <th>UOM</th>
                  <th align='right'>Quantity</th>
                  <th align='right'>Rate</th>
                  <th align='right'>Amount</th>
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
                      <td align='right'>{row.amount}</td>
                      <td align='center'>
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
          <GlobalButton color='secondary' onClick={() => router.push(`/${lang}/admin/purchase/purchase-return`)}>
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

export default function EditPurchaseReturnWrapper() {
  return (
    <PermissionGuard permission='Purchase Return'>
      <EditPurchaseReturnPage />
    </PermissionGuard>
  )
}
