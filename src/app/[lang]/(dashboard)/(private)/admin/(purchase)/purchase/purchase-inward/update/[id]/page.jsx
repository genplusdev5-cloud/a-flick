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
import { getPurchaseFilters, getPurchaseInwardDetails, updatePurchaseInward } from '@/api/purchase/purchase_inward'
import { getPurchaseOrderList } from '@/api/purchase/purchase_order'
import { getMaterialRequestDropdowns } from '@/api/transfer/materialRequest/dropdown'
import { showToast } from '@/components/common/Toasts'

const EditPurchaseInwardPage = () => {
  const router = useRouter()
  const params = useParams()
  const { lang, id } = params
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
  const [in_quantity, setInQuantity] = useState('')
  const [conversion, setConversion] = useState('')
  const [additional, setAdditional] = useState('')
  const [editId, setEditId] = useState(null)

  const [items, setItems] = useState([])
  const [details, setDetails] = useState({})

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

        // 3. Chemicals (PRIORITY: Check multiple sources)
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

        setChemicalOptions(chemicals)
        setUomOptions(uoms)

        // --- DETAILS ---
        let details = {}
        if (detailsRes?.inward_items || detailsRes?.items) {
          details = detailsRes
        } else if (detailsRes?.data?.inward_items || detailsRes?.data?.items) {
          details = detailsRes.data
        } else {
          details = detailsRes?.data?.data || detailsRes?.data || detailsRes || {}
        }

        setDetails(details)

        setPoDate(details?.inward_date ? new Date(details.inward_date) : null)

        setRemarks(details.remarks || '')

        // ⚠️ IMPORTANT: match AFTER dropdowns ready
        if (details.company_id) {
          setOrigin(origins.find(x => x.id == details.company_id) || null)
        }
        if (details.supplier_id) {
          setSupplier(suppliers.find(x => x.id == details.supplier_id) || null)
        }
        if (details.po_id) {
          setPurchaseOrder(purchaseOrders.find(x => x.id == details.po_id) || null)
        }

        // --- ITEMS ---
        const itemsList = details.inward_items || details.items || []

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
            item_id: item.item_id,
            chemicalId: item.item_id, // For chemicalOptions finding
            item_name: item.item_name || '',
            uom_id: item.uom_id,
            uomId: item.uom_id, // For uomOptions finding
            uom: item.uom || '',
            in_quantity: item.in_quantity || item.quantity || 0,
            conversion: item.conversion || 1,
            quantity: item.quantity || 0,
            additional: item.additional || 0,
            total_quantity: item.total_quantity || item.quantity || 0,
            po_id: item.po_id,
            tx_po_id: item.tx_po_id,
            is_active: item.is_active,
            status: item.status
          }
        })

        setItems(mappedItems)
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

  const handleChemicalChange = val => {
    setChemical(val)
    if (val && val.uom) {
      // Find matching UOM object or create one
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

    if (supplier && !initLoading) {
      fetchPOs()
    }
  }, [supplier, initLoading])

  const handleEditItem = row => {
    setEditId(row.id)
    setChemical({ label: row.item_name, id: row.item_id })
    setUom({ label: row.uom, id: row.uom_id })
    setInQuantity(row.in_quantity || '')
    setConversion(row.conversion || '')
    setAdditional(row.additional || '')
  }

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

    setChemical(null)
    setUom(null)
    setInQuantity('')
    setConversion('')
    setAdditional('')
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
        inward_items_input: items.map(item => ({
          id: String(item.id).length > 10 ? null : item.id,
          company_id: origin?.id || details.company_id,
          supplier_id: supplier?.id || details.supplier_id,
          pi_id: decodedId || details.id,
          po_id: purchaseOrder?.id || item.po_id || null,
          tx_po_id: item.tx_po_id,
          item_id: item.item_id,
          item_name: item.item_name,
          uom_id: item.uom_id,
          uom: item.uom,
          in_quantity: Number(item.in_quantity),
          conversion: Number(item.conversion),
          quantity: Number(item.quantity),
          additional: Number(item.additional) || 0,
          total_quantity: Number(item.total_quantity),
          is_active: item.is_active || 1,
          status: item.status || 1
        })),
        inward_items: items.map(item => ({
          id: String(item.id).length > 10 ? null : item.id,
          company_id: origin?.id || details.company_id,
          supplier_id: supplier?.id || details.supplier_id,
          pi_id: decodedId || details.id,
          po_id: purchaseOrder?.id || item.po_id || null,
          tx_po_id: item.tx_po_id,
          item_id: item.item_id,
          item_name: item.item_name,
          uom_id: item.uom_id,
          uom: item.uom,
          in_quantity: Number(item.in_quantity),
          conversion: Number(item.conversion),
          quantity: Number(item.quantity),
          additional: Number(item.additional) || 0,
          total_quantity: Number(item.total_quantity),
          is_active: item.is_active || 1,
          status: item.status || 1
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
          <Grid container spacing={3}>
            {/* Row 1 */}
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

            <Grid item xs={12} md={2}>
              <GlobalTextField
                label='In Qty'
                type='number'
                value={in_quantity || ''}
                onChange={e => setInQuantity(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <GlobalTextField
                label='Conversion'
                type='number'
                value={conversion || ''}
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
                value={additional || ''}
                onChange={e => setAdditional(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <GlobalTextField label='Total Qty' type='number' value={total_quantity} disabled />
            </Grid>

            <Grid
              item
              xs={12}
              md={3}
              sx={{
                display: 'flex',
                alignItems: 'flex-end' // 🔥 perfect vertical alignment
              }}
            >
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
                  <th style={{ width: '50px', minWidth: '50px' }}>S.No</th>
                  <th align='center' style={{ width: '80px' }}>
                    ACTION
                  </th>
                  <th style={{ width: '20%' }}>CHEMICAL</th>
                  <th style={{ width: '10%' }}>UOM</th>
                  <th align='left' style={{ width: '10%', textAlign: 'left' }}>
                    IN QTY
                  </th>
                  <th align='left' style={{ width: '10%', textAlign: 'left' }}>
                    CONV.
                  </th>
                  <th align='left' style={{ width: '10%', textAlign: 'left' }}>
                    QTY
                  </th>
                  <th align='left' style={{ width: '12%', textAlign: 'left' }}>
                    ADDITIONAL
                  </th>
                  <th align='left' style={{ width: '15%', textAlign: 'left' }}>
                    TOTAL QTY
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
                      <td align='left' style={{ textAlign: 'left' }}>
                        {row.in_quantity}
                      </td>
                      <td align='left' style={{ textAlign: 'left' }}>
                        {row.conversion}
                      </td>
                      <td align='left' style={{ textAlign: 'left' }}>
                        {row.quantity}
                      </td>
                      <td align='left' style={{ textAlign: 'left' }}>
                        {row.additional}
                      </td>
                      <td align='left' style={{ textAlign: 'left' }}>
                        {isNaN(row.total_quantity) ? '-' : row.total_quantity}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: 24 }}>
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
