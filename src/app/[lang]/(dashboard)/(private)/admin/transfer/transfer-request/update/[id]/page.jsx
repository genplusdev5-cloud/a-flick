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
import { getPurchaseFilters } from '@/api/purchase_order'
import { getMaterialRequestDropdowns } from '@/api/materialRequest/dropdown'
import {
  getTransferRequestDetailsTM,
  getTransferRequestDetailsTX,
  updateTransferRequest
} from '@/api/transfer_request'
import { showToast } from '@/components/common/Toasts'

/* ───────────────────────────── */
const EditTransferRequestPage = () => {
  const router = useRouter()
  const { lang, id } = useParams()
  const searchParams = useSearchParams()
  const type = searchParams.get('type') || 'tm'
  const decodedId = id ? atob(id) : null

  // Dropdowns
  const [originOptions, setOriginOptions] = useState([])
  const [supplierOptions, setSupplierOptions] = useState([])
  const [chemicalOptions, setChemicalOptions] = useState([])
  const [uomOptions, setUomOptions] = useState([])

  // Header
  const [fromCompany, setFromCompany] = useState(null)
  const [toCompany, setToCompany] = useState(null)
  const [transferDate, setTransferDate] = useState(null)
  const [remarks, setRemarks] = useState('')

  // Item entry
  const [chemical, setChemical] = useState(null)
  const [uom, setUom] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [rate, setRate] = useState('')
  const [items, setItems] = useState([])

  const [initLoading, setInitLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  const DateInput = forwardRef(function DateInput(props, ref) {
    return <CustomTextField fullWidth inputRef={ref} {...props} />
  })

  /* ───────── FETCH DATA ───────── */
  useEffect(() => {
    if (!decodedId) return

    const fetchData = async () => {
      try {
        setInitLoading(true)

        const [filterRes, materialRes, detailsRes] = await Promise.all([
          getPurchaseFilters(),
          getMaterialRequestDropdowns(),
          type === 'tm'
            ? getTransferRequestDetailsTM(decodedId)
            : getTransferRequestDetailsTX(decodedId)
        ])

        // Dropdowns
        const f = filterRes?.data?.data || {}
        const origins =
          f?.company?.name?.map(o => ({ label: o.name, value: o.name, id: o.id })) || []
        const suppliers =
          f?.supplier?.name?.map(s => ({ label: s.name, value: s.name, id: s.id })) || []

        const m = materialRes?.data || materialRes
        const chemicals =
          m?.chemicals?.name?.map(c => ({ label: c.name, value: c.name, id: c.id })) || []
        const uoms =
          m?.uom?.name?.map(u => ({ label: u.name, value: u.name, id: u.id })) || []

        setOriginOptions(origins)
        setSupplierOptions(suppliers)
        setChemicalOptions(chemicals)
        setUomOptions(uoms)

        // Details
        const d = detailsRes?.data || detailsRes
        setTransferDate(d.transfer_date ? parseISO(d.transfer_date) : null)
        setRemarks(d.remarks || '')

        setFromCompany(origins.find(o => o.id === d.from_company_id) || null)
        setToCompany(suppliers.find(s => s.id === d.to_company_id) || null)

        const mappedItems = (d.items || []).map(it => ({
          id: it.id,
          chemical: it.chemical_name,
          chemicalId: it.chemical_id,
          uom: it.uom_name,
          uomId: it.uom_id,
          quantity: it.quantity,
          rate: it.unit_rate,
          amount: it.quantity * it.unit_rate
        }))

        setItems(mappedItems)
      } catch (e) {
        console.error(e)
        showToast('error', 'Failed to load transfer request')
      } finally {
        setInitLoading(false)
      }
    }

    fetchData()
  }, [decodedId, type])

  const amount = useMemo(() => {
    const q = Number(quantity)
    const r = Number(rate)
    return q && r ? q * r : ''
  }, [quantity, rate])

  const handleAddItem = () => {
    if (!chemical || !uom || !quantity || !rate) {
      showToast('error', 'Fill all item fields')
      return
    }

    setItems(p => [
      ...p,
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
    setItems(p => p.filter(i => i.id !== id))
  }

  const handleUpdate = async () => {
    if (!fromCompany || !toCompany || !transferDate || !items.length) {
      showToast('warning', 'Fill all required fields')
      return
    }

    try {
      setSaveLoading(true)

      const payload = {
        from_company_id: fromCompany.id,
        to_company_id: toCompany.id,
        transfer_date: format(transferDate, 'yyyy-MM-dd'),
        remarks,
        items: items.map(i => ({
          chemical_id: i.chemicalId,
          uom_id: i.uomId,
          quantity: Number(i.quantity),
          unit_rate: Number(i.rate)
        }))
      }

      await updateTransferRequest(decodedId, payload)

      showToast('success', 'Transfer Request updated')
      router.push(`/${lang}/admin/transfer/transfer-request`)
    } catch (e) {
      showToast('error', 'Failed to update transfer request')
    } finally {
      setSaveLoading(false)
    }
  }

  /* ───────── UI ───────── */
  return (
    <StickyListLayout
      header={
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link href={`/${lang}`}>Dashboard</Link>
          <Link href={`/${lang}/admin/transfer/transfer-request`}>Transfer Request</Link>
          <Typography>Edit</Typography>
        </Breadcrumbs>
      }
    >
      <Card>
        <CardHeader title={<Typography variant='h5'>Update Transfer Request</Typography>} />
        <Divider />

        <Box px={4} py={3} position='relative'>
          {initLoading && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                bgcolor: 'rgba(255,255,255,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CircularProgress />
            </Box>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <GlobalAutocomplete label='From Company' options={originOptions} value={fromCompany} onChange={setFromCompany} />
            </Grid>

            <Grid item xs={12} md={4}>
              <AppReactDatepicker
                selected={transferDate}
                onChange={setTransferDate}
                customInput={<DateInput label='Transfer Date' />}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete label='To Company' options={supplierOptions} value={toCompany} onChange={setToCompany} />
            </Grid>

            <Grid item xs={12}>
              <GlobalTextField label='Remarks' multiline value={remarks} onChange={e => setRemarks(e.target.value)} />
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {/* ITEM ENTRY */}
        <Box px={4} py={3}>
          <Grid container spacing={2} alignItems='flex-end'>
            <Grid item md={3}>
              <GlobalAutocomplete label='Chemical' options={chemicalOptions} value={chemical} onChange={setChemical} />
            </Grid>
            <Grid item md={2}>
              <GlobalAutocomplete label='UOM' options={uomOptions} value={uom} onChange={setUom} />
            </Grid>
            <Grid item md={2}>
              <GlobalTextField label='Qty' value={quantity} onChange={e => setQuantity(e.target.value)} />
            </Grid>
            <Grid item md={2}>
              <GlobalTextField label='Rate' value={rate} onChange={e => setRate(e.target.value)} />
            </Grid>
            <Grid item md={2}>
              <GlobalTextField label='Amount' value={amount} disabled />
            </Grid>
            <Grid item md={1}>
              <GlobalButton startIcon={<AddIcon />} onClick={handleAddItem}>
                Add
              </GlobalButton>
            </Grid>
          </Grid>
        </Box>

        {/* TABLE */}
        <Box px={4} pb={3}>
          <StickyTableWrapper rowCount={items.length}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Chemical</th>
                  <th>UOM</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Amount</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((r, i) => (
                  <tr key={r.id}>
                    <td>{i + 1}</td>
                    <td>{r.chemical}</td>
                    <td>{r.uom}</td>
                    <td>{r.quantity}</td>
                    <td>{r.rate}</td>
                    <td>{r.amount}</td>
                    <td>
                      <IconButton color='error' onClick={() => handleRemoveItem(r.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </StickyTableWrapper>
        </Box>

        <Divider />

        <Box px={4} py={3} display='flex' justifyContent='flex-end' gap={2}>
          <GlobalButton color='secondary' onClick={() => router.back()}>
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

/* ───────── WRAPPER ───────── */
export default function EditTransferRequestWrapper() {
  return (
    <PermissionGuard permission='Transfer Request'>
      <EditTransferRequestPage />
    </PermissionGuard>
  )
}
