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
import { getPurchaseFilters } from '@/api/purchase/purchase_inward'
import { addPurchaseReturn } from '@/api/purchase/purchase_return'

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

const AddPurchaseReturnPage = () => {
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
  const [returnDate, setReturnDate] = useState(new Date())

  const [supplier, setSupplier] = useState(null)
  const [remarks, setRemarks] = useState('')

  // Item fields
  const [chemical, setChemical] = useState(null)
  const [uom, setUom] = useState(null)
  const [quantity, setQuantity] = useState('')
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
            label: String(item.name || item.po_number || item.num_series || 'Unknown'),
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

  const handleEditItem = row => {
    setEditId(row.id)
    setChemical({ label: row.chemical, id: row.chemicalId })
    setUom({ label: row.uom, id: row.uomId })
    setQuantity(row.quantity)
  }

  const PoDateInput = forwardRef(function PoDateInput(props, ref) {
    const { label, value, ...rest } = props

    return <CustomTextField fullWidth inputRef={ref} label={label} value={value} {...rest} />
  })

// Rate/Amount calculation removed

  const handleAddItem = () => {
    if (!chemical || !uom || !quantity) {
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

    // Reset item fields
    setChemical(null)
    setUom(null)
    setQuantity('')
  }

  const handleRemoveItem = id => {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const handleSave = async () => {
    if (!origin || !returnDate || !supplier || items.length === 0) {
      showToast('warning', 'Please fill all required fields and add at least one chemical')
      return
    }

    try {
      setSaveLoading(true)

      const payload = {
        company_id: origin.id,
        return_date: format(returnDate, 'yyyy-MM-dd'),
        inward_date: format(returnDate, 'yyyy-MM-dd'), // Fallback
        supplier_id: supplier.id,
        po_id: purchaseOrder?.id || null,
        purchase_order_id: purchaseOrder?.id || null, // Key variant
        remarks,
        // Send as return_items_input with robust field mapping
        return_items_input: items.map(item => ({
          chemical_id: item.chemicalId,
          item_id: item.chemicalId,
          item_name: item.chemical,
          uom_id: item.uomId,
          uom: item.uom,
          po_id: purchaseOrder?.id || null, // Added po_id
          return_quantity: Number(item.quantity),
          quantity: Number(item.quantity),
          status: 1,
          is_active: 1
        })),
        // Keep fallbacks just in case backend expects them
        inward_items: items.map(item => ({
          chemical_id: item.chemicalId,
          item_id: item.chemicalId,
          uom_id: item.uomId,
          return_quantity: Number(item.quantity),
          quantity: Number(item.quantity)
        })),
        items: items.map(item => ({
          chemical_id: item.chemicalId,
          item_id: item.chemicalId,
          uom_id: item.uomId,
          return_quantity: Number(item.quantity),
          quantity: Number(item.quantity),
          rate: Number(item.rate)
        }))
      }

      await addPurchaseReturn(payload)

      showToast('success', 'Purchase Return added successfully')
      router.push(`/${lang}/admin/purchase/purchase-return`)
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
          <Link href={`/${lang}/admin/purchase/purchase-return`}>Purchase Return</Link>
          <Typography color='text.primary'>Add</Typography>
        </Breadcrumbs>
      }
    >
      <Card>
        <CardHeader
          title={
            <Typography variant='h5' fontWeight={600}>
              Add Purchase Return
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
                selected={returnDate}
                onChange={date => setReturnDate(date)}
                dateFormat='dd/MM/yyyy'
                customInput={
                  <PoDateInput label='Return Date' value={returnDate ? format(returnDate, 'dd/MM/yyyy') : ''} />
                }
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
          <Grid container spacing={2} alignItems='flex-end'>
            <Grid item xs={12} md={3}>
              <GlobalAutocomplete label='Chemicals' options={chemicalOptions} value={chemical} onChange={setChemical} />
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
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>
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
          <GlobalButton color='secondary' onClick={() => router.push(`/${lang}/admin/purchase/purchase-return`)}>
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

export default function AddPurchaseReturnWrapper() {
  return (
    <PermissionGuard permission='Purchase Return'>
      <AddPurchaseReturnPage />
    </PermissionGuard>
  )
}
