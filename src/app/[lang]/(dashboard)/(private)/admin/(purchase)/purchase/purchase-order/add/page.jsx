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

import StickyListLayout from '@/components/common/StickyListLayout'
import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import PermissionGuard from '@/components/auth/PermissionGuard'

import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import styles from '@core/styles/table.module.css'
import { getPurchaseFilters, addPurchaseOrder } from '@/api/purchase/purchase_order'
import { getMaterialRequestDropdowns } from '@/api/transfer/materialRequest/dropdown'
import { showToast } from '@/components/common/Toasts'

import { format } from 'date-fns'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import CustomTextField from '@core/components/mui/TextField'

const AddPurchaseOrderPage = () => {
  const router = useRouter()
  const { lang } = useParams()

  // Dropdown options
  const [originOptions, setOriginOptions] = useState([])
  const [supplierOptions, setSupplierOptions] = useState([])
  const [chemicalOptions, setChemicalOptions] = useState([])
  const [uomOptions, setUomOptions] = useState([])

  // Header fields
  const [origin, setOrigin] = useState(null)
  const [poDate, setPoDate] = useState(new Date())
  const [supplier, setSupplier] = useState(null)
  const [remarks, setRemarks] = useState('')

  // Item fields
  const [chemical, setChemical] = useState(null)
  const [uom, setUom] = useState(null)
  const [quantity, setQuantity] = useState('')

  const [editId, setEditId] = useState(null)

  // Items list
  const [items, setItems] = useState([])

  const [initLoading, setInitLoading] = useState(false)

  const fetchOptions = async (supplierId = null) => {
    try {
      if (!supplierId) setInitLoading(true)

      const params = { is_filter: 1 }
      if (supplierId) params.supplier_id = supplierId

      const [purchaseRes, materialRes] = await Promise.all([
        getPurchaseFilters(params),
        getMaterialRequestDropdowns()
      ])

      // Parse Purchase Filters (Company/Origin, Supplier)
      const purchaseData = purchaseRes?.data?.data || purchaseRes?.data || {}
      const materialData = materialRes?.data || materialRes

      // 1. Origin/Company
      const origins =
        purchaseData?.company?.name?.map(item => ({
          label: item.name,
          value: item.name,
          id: item.id
        })) || []
      setOriginOptions(origins)

      // 2. Suppliers
      const suppliers =
        purchaseData?.supplier?.name?.map(item => ({
          label: item.name,
          value: item.name,
          id: item.id
        })) || []
      setSupplierOptions(suppliers)

      // 3. Chemicals (PRIORITY: Specialized Purchase API)
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
      setChemicalOptions(chemicals)

      // 4. UOM
      const uomRaw = materialData?.uom?.name || materialData?.uom || []
      const uoms = uomRaw.map(u => ({
        label: u.name,
        value: u.name,
        id: u.id
      }))
      setUomOptions(uoms)

      // Set default origin ONLY on first load
      if (!supplierId) {
        const defaultOrigin = origins.find(o => o.label === 'A-Flick Pte Ltd') || origins[0]
        if (defaultOrigin) setOrigin(defaultOrigin)
      }
    } catch (err) {
      console.error('Failed to fetch dropdowns', err)
      showToast('error', 'Failed to load dropdown data')
    } finally {
      setInitLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchOptions()
  }, [])

  // Refetch chemicals when supplier changes
  useEffect(() => {
    if (supplier?.id) {
      fetchOptions(supplier.id)
    }
  }, [supplier])

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

  const PoDateInput = forwardRef(function PoDateInput(props, ref) {
    const { label, value, ...rest } = props

    return <CustomTextField fullWidth inputRef={ref} label={label} value={value} {...rest} />
  })



  const handleAddItem = () => {
    if (!chemical) {
      showToast('error', 'Please select a chemical')
      return
    }
    if (!uom) {
      showToast('error', 'Please select a UOM')
      return
    }
    if (!quantity) {
      showToast('error', 'Please enter a quantity')
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
                quantity
              }
            : item
        )
      )
      setEditId(null)
    } else {
      // Add new item
      setItems(prev => [
        ...prev,
        {
          id: Date.now(),
          chemical: chemical?.label || (typeof chemical === 'string' ? chemical : ''),
          chemicalId: chemical?.id || (typeof chemical === 'object' ? chemical?.value : chemical),
          uom: uom?.label || (typeof uom === 'string' ? uom : ''),
          uomId: uom?.id || (typeof uom === 'object' ? uom?.value : uom),
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
    if (!origin || !poDate || !supplier || items.length === 0) {
      showToast('warning', 'Please fill all required fields and add at least one chemical')
      return
    }

    try {
      const payload = {
        company_id: origin.id,
        po_date: format(poDate, 'yyyy-MM-dd'),
        supplier_id: supplier.id,
        remarks,
        order_items: items.map(item => ({
          chemical_id: item.chemicalId,
          item_id: item.chemicalId,
          item_name: item.chemical,
          uom_id: item.uomId,
          quantity: Number(item.quantity),
          unit_rate: 0
        }))
      }

      await addPurchaseOrder(payload)
      showToast('success', 'Purchase Order added successfully')
      router.push(`/${lang}/admin/purchase/purchase-order`)
    } catch (err) {
      console.error('Failed to save Purchase Order', err)
      showToast('error', err?.response?.data?.message || 'Failed to save Purchase Order')
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
          <Link href={`/${lang}/admin/purchase/purchase-order`} style={{ textDecoration: 'none' }}>
            Purchase Order
          </Link>
          <Typography color='text.primary'>Add</Typography>
        </Breadcrumbs>
      }
    >
      <Card>
        <CardHeader
          title={
            <Typography variant='h5' fontWeight={600}>
              Add Purchase Order
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
                customInput={<PoDateInput label='PO Date' value={poDate ? format(poDate, 'dd/MM/yyyy') : ''} />}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete label='Suppliers' options={supplierOptions} value={supplier} onChange={setSupplier} />
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
                label='Chemicals'
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
                    <td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>
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
          <GlobalButton color='secondary' onClick={() => router.push(`/${lang}/admin/purchase/purchase-order`)}>
            Close
          </GlobalButton>
          <GlobalButton variant='contained' onClick={handleSave}>
            Save
          </GlobalButton>
        </Box>
      </Card>
    </StickyListLayout>
  )
}

export default function AddPurchaseOrderWrapper() {
  return (
    <PermissionGuard permission='Purchase Order'>
      <AddPurchaseOrderPage />
    </PermissionGuard>
  )
}
