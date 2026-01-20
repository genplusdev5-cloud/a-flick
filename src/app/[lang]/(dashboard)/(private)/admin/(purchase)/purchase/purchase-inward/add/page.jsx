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
  MenuItem,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Breadcrumbs,
  CircularProgress
} from '@mui/material'

import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { getPurchaseFilters, addPurchaseInward } from '@/api/purchase/purchase_inward'
import { getPurchaseOrderList, getPurchaseOrderDetails } from '@/api/purchase/purchase_order'

import StickyListLayout from '@/components/common/StickyListLayout'
import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import PermissionGuard from '@/components/auth/PermissionGuard'

import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import styles from '@core/styles/table.module.css'
import { getMaterialRequestDropdowns } from '@/api/transfer/materialRequest/dropdown'
import { showToast } from '@/components/common/Toasts'

import { format } from 'date-fns'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import CustomTextField from '@core/components/mui/TextField'

const AddPurchaseInwardPage = () => {
  const router = useRouter()
  const { lang } = useParams()

  // Dropdown options
  const [originOptions, setOriginOptions] = useState([])
  const [supplierOptions, setSupplierOptions] = useState([])
  const [chemicalOptions, setChemicalOptions] = useState([])
  const [uomOptions, setUomOptions] = useState([])

  const [purchaseOrderOptions, setPurchaseOrderOptions] = useState([])
  const [purchaseOrder, setPurchaseOrder] = useState(null)

  // Loading states
  const [initLoading, setInitLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  // Header fields
  const [origin, setOrigin] = useState(null)
  const [poDate, setPoDate] = useState(new Date())
  const [supplier, setSupplier] = useState(null)
  const [remarks, setRemarks] = useState('')

  // Item fields
  const [chemical, setChemical] = useState(null)
  const [uom, setUom] = useState(null)
  const [in_quantity, setInQuantity] = useState('')
  const [conversion, setConversion] = useState('')
  const [additional, setAdditional] = useState('')
  const [editId, setEditId] = useState(null)

  // Items list
  const [items, setItems] = useState([])

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setInitLoading(true)

        const [purchaseRes, materialRes] = await Promise.all([getPurchaseFilters(), getMaterialRequestDropdowns()])

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
        setPurchaseOrderOptions(purchaseOrders)
        setChemicalOptions(chemicals)
        setUomOptions(uoms)

        if (origins.length > 0) {
          setOrigin(origins[0])
        }
      } catch (err) {
        console.error('Failed to fetch dropdowns', err)
        showToast('error', 'Failed to load dropdown data')
      } finally {
        setInitLoading(false)
      }
    }

    fetchOptions()
  }, [])

  useEffect(() => {
    const fetchPOs = async () => {
      if (supplier?.id) {
        try {
          const res = await getPurchaseFilters({ supplier_id: supplier.id })
          const purchaseData = res?.data?.data || res?.data || {}

          // Use robust mapping based on observed backend structures
          const rawPOs = purchaseData?.purchase_order?.name || purchaseData?.po_number?.po_number || []

          const pos = rawPOs.map(item => ({
            label: item.name || item.po_number || item.num_series || 'Unknown',
            value: item.id,
            id: item.id
          }))

          setPurchaseOrderOptions(pos)
        } catch (err) {
          console.error('Failed to fetch POs', err)
          setPurchaseOrderOptions([])
        }
      } else {
        setPurchaseOrderOptions([])
        setPurchaseOrder(null)
      }
    }

    if (!initLoading) {
      fetchPOs()
    }
  }, [supplier, initLoading])

  // ✅ NEW – Fetch PO Items when PO is selected
  useEffect(() => {
    const fetchPoDetails = async () => {
      if (!purchaseOrder?.id) return

      try {
        setInitLoading(true)
        const res = await getPurchaseOrderDetails({ id: purchaseOrder.id })
        const poData = res?.data || res

        if (poData?.order_items?.length) {
          const mappedItems = poData.order_items.map((item, index) => {
            // Calculate quantities
            const q = Number(item.quantity) || 0
            // Assuming conversion is 1 from PO context if not available, or part of logic
            // PO usually has 'quantity', might not have detailed packing info like 'in_quantity' vs 'conversion'
            // We'll assume direct mapping for now:
            // in_quantity = quantity, conversion = 1 (unless PO has these fields)

            // Check if PO item has specific packing details, otherwise default
            const inQty = Number(item.in_quantity) || q
            const conv = Number(item.conversion) || 1
            const total = inQty * conv + (Number(item.additional) || 0)

            return {
              id: Date.now() + index, // Unique ID
              item_name: item.item_name,
              item_id: item.item_id,
              uom: item.uom,
              uom_id: item.uom_id,
              in_quantity: inQty,
              conversion: conv,
              quantity: inQty * conv,
              additional: Number(item.additional) || 0,
              total_quantity: total,
              // Keep reference to PO Item ID if needed for backend
              po_item_id: item.id
            }
          })

          setItems(mappedItems)
          showToast('success', 'Items populated from Purchase Order')
        }
      } catch (err) {
        console.error('Failed to fetch PO details', err)
        showToast('error', 'Failed to load Purchase Order items')
      } finally {
        setInitLoading(false)
      }
    }

    fetchPoDetails()
  }, [purchaseOrder])

  const handleEditItem = row => {
    setEditId(row.id)
    // Fix: Match keys with items state
    setChemical({ label: row.item_name, id: row.item_id })
    setUom({ label: row.uom, id: row.uom_id })
    setInQuantity(row.in_quantity || '')
    setConversion(row.conversion || '')
    setAdditional(row.additional || '')
  }

  const PoDateInput = forwardRef(function PoDateInput(props, ref) {
    const { label, value, ...rest } = props

    return <CustomTextField fullWidth inputRef={ref} label={label} value={value} {...rest} />
  })

  const quantity = useMemo(() => {
    const q = Number(in_quantity)
    const c = Number(conversion)
    return q && c ? q * c : 0
  }, [in_quantity, conversion])

  const total_quantity = useMemo(() => {
    const a = Number(additional) || 0
    return quantity + a
  }, [quantity, additional])

  const handleAddItem = () => {
    if (!chemical || !uom || !in_quantity || !conversion) {
      showToast('error', 'Please fill required chemical fields (Chemical, UOM, In Qty, Conversion)')
      return
    }

    if (editId) {
      setItems(prev =>
        prev.map(item =>
          item.id === editId
            ? {
                ...item,
                item_name: chemical.label,
                item_id: chemical.id,
                uom: uom.label,
                uom_id: uom.id,
                in_quantity: in_quantity,
                conversion: conversion,
                quantity: quantity,
                additional: additional,
                total_quantity: total_quantity
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
          item_name: chemical.label,
          item_id: chemical.id,
          uom: uom.label,
          uom_id: uom.id,
          in_quantity: in_quantity,
          conversion: conversion,
          quantity: quantity,
          additional: additional,
          total_quantity: total_quantity
        }
      ])
    }

    // Reset item fields
    setChemical(null)
    setUom(null)
    setInQuantity('')
    setConversion('')
    setAdditional('')
  }

  const handleRemoveItem = id => {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const handleSave = async () => {
    if (!origin || !poDate || !supplier || items.length === 0) {
      showToast('warning', 'Please fill all required fields and add at least one chemical')
      return
    }

    try {
      setSaveLoading(true)

      const payload = {
        company_id: origin.id,
        inward_date: format(poDate, 'yyyy-MM-dd'),
        supplier_id: supplier.id,
        po_id: purchaseOrder?.id || null,
        remarks,
        inward_items: items.map(item => ({
          company_id: origin.id,
          supplier_id: supplier.id,
          po_id: purchaseOrder?.id || null,

          // 🔥 THIS IS THE KEY FIX
          po_item_id: item.po_item_id || null,

          item_id: item.item_id,
          item_name: item.item_name,
          uom_id: item.uom_id,

          in_quantity: Number(item.in_quantity),
          conversion: Number(item.conversion),
          quantity: Number(item.quantity),

          additional: Number(item.additional) || 0,
          total_quantity: Number(item.total_quantity),

          is_active: 1,
          status: 1
        }))
      }

      await addPurchaseInward(payload)

      showToast('success', 'Purchase Inward added successfully')
      router.push(`/${lang}/admin/purchase/purchase-inward`)
    } catch (err) {
      console.error('Failed to save Purchase Inward', err)
      showToast('error', err?.response?.data?.message || 'Failed to save Purchase Inward')
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
          <Link href={`/${lang}/admin/purchase/purchase-inward`}>Purchase Inward</Link>

          <Typography color='text.primary'>Add</Typography>
        </Breadcrumbs>
      }
    >
      <Card>
        <CardHeader
          title={
            <Typography variant='h5' fontWeight={600}>
              Add Purchase Inward
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
            <Grid item xs={12} md={3}>
              <GlobalAutocomplete label='Origin' options={originOptions} value={origin} onChange={setOrigin} />
            </Grid>

            <Grid item xs={12} md={3}>
              <AppReactDatepicker
                selected={poDate}
                onChange={date => setPoDate(date)}
                dateFormat='dd/MM/yyyy'
                customInput={<PoDateInput label='Inward Date' value={poDate ? format(poDate, 'dd/MM/yyyy') : ''} />}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <GlobalAutocomplete label='Suppliers' options={supplierOptions} value={supplier} onChange={setSupplier} />
            </Grid>

            {/* ✅ NEW – Purchase Order */}
            <Grid item xs={12} md={3}>
              <GlobalAutocomplete
                label='Purchase Order'
                options={purchaseOrderOptions}
                value={purchaseOrder}
                onChange={setPurchaseOrder}
                placeholder='Select PO'
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
          <Grid container spacing={3}>
            {/* Row 1 */}
            <Grid item xs={12} md={3}>
              <GlobalAutocomplete label='Chemicals' options={chemicalOptions} value={chemical} onChange={setChemical} />
            </Grid>

            <Grid item xs={12} md={2}>
              <GlobalAutocomplete label='UOM' options={uomOptions} value={uom} onChange={setUom} />
            </Grid>

            <Grid item xs={12} md={2}>
              <GlobalTextField
                label='In Qty'
                type='number'
                value={in_quantity}
                onChange={e => setInQuantity(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <GlobalTextField
                label='Conversion'
                type='number'
                value={conversion}
                onChange={e => setConversion(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <GlobalTextField label='Quantity' type='number' value={quantity} disabled />
            </Grid>

            {/* Row 2 */}
            <Grid item xs={12} md={3}>
              <GlobalTextField
                label='Additional'
                type='number'
                value={additional}
                onChange={e => setAdditional(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <GlobalTextField label='Total Amount' type='number' value={total_quantity} disabled />
            </Grid>

            <Grid item xs={12} md={3}>
              <GlobalButton
                fullWidth
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
                  <th align='center' style={{ width: '80px' }}>
                    ACTION
                  </th>
                  <th style={{ width: '20%' }}>CHEMICAL</th>
                  <th style={{ width: '10%' }}>UOM</th>
                  <th align='right' style={{ width: '10%', textAlign: 'right' }}>
                    IN QTY
                  </th>
                  <th align='right' style={{ width: '10%', textAlign: 'right' }}>
                    CONV.
                  </th>
                  <th align='right' style={{ width: '10%', textAlign: 'right' }}>
                    QTY
                  </th>
                  <th align='right' style={{ width: '12%', textAlign: 'right' }}>
                    ADDITIONAL
                  </th>
                  <th align='right' style={{ width: '15%', textAlign: 'right' }}>
                    TOTAL AMOUNT
                  </th>
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
                      <td>{row.item_name}</td>
                      <td>{row.uom}</td>
                      <td align='right' style={{ textAlign: 'right' }}>
                        {row.in_quantity}
                      </td>
                      <td align='right' style={{ textAlign: 'right' }}>
                        {row.conversion || '-'}
                      </td>
                      <td align='right' style={{ textAlign: 'right' }}>
                        {row.quantity}
                      </td>
                      <td align='right' style={{ textAlign: 'right' }}>
                        {row.additional || '-'}
                      </td>
                      <td align='right' style={{ textAlign: 'right' }}>
                        {row.total_quantity}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '24px' }}>
                      No chemicals added
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

export default function AddPurchaseInwardWrapper() {
  return (
    <PermissionGuard permission='Purchase Inward'>
      <AddPurchaseInwardPage />
    </PermissionGuard>
  )
}
