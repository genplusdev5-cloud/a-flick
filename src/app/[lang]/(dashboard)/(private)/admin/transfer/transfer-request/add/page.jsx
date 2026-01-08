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

import StickyListLayout from '@/components/common/StickyListLayout'
import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import PermissionGuard from '@/components/auth/PermissionGuard'

import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import styles from '@core/styles/table.module.css'
import { addTransferRequest } from '@/api/transfer_request'
import { getPurchaseFilters } from '@/api/purchase_order'
import { getMaterialRequestDropdowns } from '@/api/materialRequest/dropdown'
import { showToast } from '@/components/common/Toasts'

import { format } from 'date-fns'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import CustomTextField from '@core/components/mui/TextField'

const AddTransferRequestPage = () => {
  const router = useRouter()
  const { lang } = useParams()

  // Dropdown options
  const [originOptions, setOriginOptions] = useState([])
  const [supplierOptions, setSupplierOptions] = useState([])
  const [chemicalOptions, setChemicalOptions] = useState([])
  const [uomOptions, setUomOptions] = useState([])

  // Loading states
  const [initLoading, setInitLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  // Header fields
  const [fromCompany, setFromCompany] = useState(null)
  const [transferDate, setTransferDate] = useState(new Date())
  const [toCompany, setToCompany] = useState(null)

  const [remarks, setRemarks] = useState('')

  // Item fields
  const [chemical, setChemical] = useState(null)
  const [uom, setUom] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [rate, setRate] = useState('')

  // Items list
  const [items, setItems] = useState([])

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setInitLoading(true)
        const [purchaseRes, materialRes] = await Promise.all([getPurchaseFilters(), getMaterialRequestDropdowns()])

        // Parse Purchase Filters (Company/Origin, Supplier)
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

        // Parse Material Dropdowns (Chemicals, UOM)
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

        // Set default origin if available
        if (origins.length > 0) {
          setFromCompany(origins[0])
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

  const PoDateInput = forwardRef(function PoDateInput(props, ref) {
    const { label, value, ...rest } = props

    return <CustomTextField fullWidth inputRef={ref} label={label} value={value} {...rest} />
  })

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

    // Reset item fields
    setChemical(null)
    setUom(null)
    setQuantity('')
    setRate('')
  }

  const handleRemoveItem = id => {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const handleSave = async () => {
    if (!fromCompany || !transferDate || !toCompany || items.length === 0) {
      showToast('warning', 'Please fill all required fields and add at least one item')
      return
    }

    try {
      setSaveLoading(true)

      const payload = {
        from_company_id: fromCompany.id,
        to_company_id: toCompany.id,
        transfer_date: format(transferDate, 'yyyy-MM-dd'),
        remarks,
        items: items.map(item => ({
          chemical_id: item.chemicalId,
          uom_id: item.uomId,
          quantity: Number(item.quantity),
          unit_rate: Number(item.rate)
        }))
      }

      await addTransferRequest(payload)

      showToast('success', 'Transfer Request added successfully')
      router.push(`/${lang}/admin/transfer/transfer-request`)
    } catch (err) {
      console.error(err)
      showToast('error', err?.response?.data?.message || 'Failed to save Transfer Request')
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
          <Link href={`/${lang}/admin/transfer/transfer-request`}>Transfer Request</Link>
          <Typography color='text.primary'>Add</Typography>
        </Breadcrumbs>
      }
    >
      <Card>
        <CardHeader
          title={
            <Typography variant='h5' fontWeight={600}>
              Add Transfer Request
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
              <GlobalAutocomplete
                label='From Company'
                options={originOptions}
                value={fromCompany}
                onChange={setFromCompany}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <AppReactDatepicker
                selected={transferDate}
                onChange={date => setTransferDate(date)}
                dateFormat='dd/MM/yyyy'
                customInput={
                  <PoDateInput label='Transfer Date' value={transferDate ? format(transferDate, 'dd/MM/yyyy') : ''} />
                }
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='To Company'
                options={supplierOptions}
                value={toCompany}
                onChange={setToCompany}
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
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <GlobalTextField label='Rate [₹]' type='number' value={rate} onChange={e => setRate(e.target.value)} />
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
                  <th align='right'>Unit Rate</th>
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
          <GlobalButton color='secondary' onClick={() => router.push(`/${lang}/admin/transfer/transfer-request`)}>
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

export default function AddTransferRequestWrapper() {
  return (
    <PermissionGuard permission='Transfer Request'>
      <AddTransferRequestPage />
    </PermissionGuard>
  )
}
