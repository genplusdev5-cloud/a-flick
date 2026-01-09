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
import { getTransferFilters } from '@/api/transfer_request'
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
  
  const decodedId = useMemo(() => {
    if (!id) return null
    
    try {
      return Number(atob(id))
    } catch (e) {
      try {
        // Try fixing common base64 url anomalies
        const fixed = id.replace(/-/g, '+').replace(/_/g, '/')
        return Number(atob(fixed))
      } catch {
        return Number(id)
      }
    }
  }, [id])

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
  const [editId, setEditId] = useState(null)

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
          getTransferFilters(),
          getMaterialRequestDropdowns(),
          type === 'tm'
            ? getTransferRequestDetailsTM(decodedId)
            : getTransferRequestDetailsTX(decodedId)
        ])

        // Dropdown Data Hunter
        const hunt = (obj, key) => {
          if (!obj || typeof obj !== 'object') return null
          if (obj[key]) return obj[key]
          for (const k in obj) {
            const found = hunt(obj[k], key)
            if (found) return found
          }
          return null
        }

        const compData = hunt(filterRes, 'company')
        const suppData = hunt(filterRes, 'supplier')
        const chemData = hunt(materialRes, 'chemicals')
        const uomData = hunt(materialRes, 'uom')

        const origins = compData?.name?.map(o => ({ label: o.name, value: o.name, id: o.id })) || []
        const suppliers = suppData?.name?.map(s => ({ label: s.name, value: s.name, id: s.id })) || []
        const chemicals = chemData?.name?.map(c => ({ label: c.name, value: c.name, id: c.id })) || []
        const uoms = uomData?.name?.map(u => ({ label: u.name, value: u.name, id: u.id })) || []

        setOriginOptions(origins)
        setSupplierOptions(suppliers)
        setChemicalOptions(chemicals)
        setUomOptions(uoms)

        // Details Data Hunter
        const d = detailsRes?.data?.data || detailsRes?.data || detailsRes
        setTransferDate(d.transfer_date ? (typeof d.transfer_date === 'string' ? parseISO(d.transfer_date) : new Date(d.transfer_date)) : null)
        setRemarks(d.remarks || '')

        setFromCompany(origins.find(o => o.id === (d.company_id || d.from_company_id)) || null)
        setToCompany(suppliers.find(s => s.id === (d.to_company_id || d.supplier_id)) || null)

        const rawItems = d.items || d.transfer_items || d.transfer_request_items || d.order_items || []
        const mappedItems = rawItems.map(it => ({
          id: it.id,
          chemical: it.chemical_name || it.item_name || it.chemical?.name || '',
          chemicalId: it.chemical_id || it.item_id || it.chemical?.id,
          uom: it.uom_name || it.uom?.name || it.uom_details?.name || it.uom,
          uomId: it.uom_id || it.uom?.id || it.uom_details?.id,
          quantity: Number(it.quantity || it.transfer_quantity || 0),
          rate: Number(it.unit_rate || it.rate || 0),
          amount: Number(it.quantity || it.transfer_quantity || 0) * Number(it.unit_rate || it.rate || 0)
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
      showToast('error', 'Fill all item fields')
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
    }

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
        company_id: fromCompany.id,
        to_company_id: toCompany.id,
        transfer_date: format(transferDate, 'yyyy-MM-dd'),
        remarks,
        items: items.map(i => ({
          id: String(i.id).length > 10 ? null : i.id,
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
            <Grid item xs={12} md={3}>
              <GlobalAutocomplete label='Chemicals' options={chemicalOptions} value={chemical} onChange={setChemical} />
            </Grid>
            <Grid item xs={12} md={2}>
              <GlobalAutocomplete label='UOM' options={uomOptions} value={uom} onChange={setUom} />
            </Grid>
            <Grid item xs={12} md={2}>
              <GlobalTextField label='Quantity' type='number' value={quantity} onChange={e => setQuantity(e.target.value)} />
            </Grid>
            <Grid item xs={12} md={2}>
              <GlobalTextField label='Rate [₹]' type='number' value={rate} onChange={e => setRate(e.target.value)} />
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

        {/* TABLE */}
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
                    Unit Rate
                  </th>
                  <th align='right' style={{ width: '15%' }}>
                    Amount
                  </th>
                  <th align='center'>Action</th>
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
                    <td align='center'>
                      <IconButton size='small' color='primary' onClick={() => handleEditItem(r)}>
                        <EditIcon fontSize='small' />
                      </IconButton>
                      <IconButton size='small' color='error' onClick={() => handleRemoveItem(r.id)}>
                        <DeleteIcon fontSize='small' />
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
