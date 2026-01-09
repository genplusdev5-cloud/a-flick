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

import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'

import styles from '@core/styles/table.module.css'

import { getPurchaseFilters } from '@/api/purchase_inward'
import { getMaterialRequestDropdowns } from '@/api/materialRequest/dropdown'
import { getTmTransferOutDetails, getTxTransferOutDetails, updateTransferOut } from '@/api/transfer_out'

import { showToast } from '@/components/common/Toasts'

/* ───────────────────────────── */

const EditTransferOutPage = () => {
  const router = useRouter()
  const { lang, id } = useParams()
  const searchParams = useSearchParams()
  const type = searchParams.get('type') || 'tm'

  const decodedId = useMemo(() => {
    try {
      return Number(atob(id))
    } catch {
      return Number(id)
    }
  }, [id])

  /* ───── STATES ───── */

  const [originOptions, setOriginOptions] = useState([])
  const [supplierOptions, setSupplierOptions] = useState([])
  const [chemicalOptions, setChemicalOptions] = useState([])
  const [uomOptions, setUomOptions] = useState([])

  const [origin, setOrigin] = useState(null)
  const [supplier, setSupplier] = useState(null)
  const [transferDate, setTransferDate] = useState(null)
  const [remarks, setRemarks] = useState('')

  const [chemical, setChemical] = useState(null)
  const [uom, setUom] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [rate, setRate] = useState('')
  const [editId, setEditId] = useState(null)

  const [items, setItems] = useState([])

  const [initLoading, setInitLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  /* ───── DATE INPUT ───── */

  const DateInput = forwardRef(function DateInput(props, ref) {
    const { label, value, ...rest } = props
    return <CustomTextField fullWidth inputRef={ref} label={label} value={value} {...rest} />
  })

  /* ───── FETCH DATA ───── */

  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitLoading(true)

        const [purchaseRes, materialRes, detailsRes] = await Promise.all([
          getPurchaseFilters(),
          getMaterialRequestDropdowns(),
          type === 'tm'
            ? getTmTransferOutDetails(decodedId)
            : getTxTransferOutDetails(decodedId)
        ])

        /* DROPDOWNS */
        const purchaseData = purchaseRes?.data || {}

        const origins =
          purchaseData?.company?.name?.map(i => ({
            label: i.name,
            value: i.name,
            id: i.id
          })) || []

        const suppliers =
          purchaseData?.supplier?.name?.map(i => ({
            label: i.name,
            value: i.name,
            id: i.id
          })) || []

        setOriginOptions(origins)
        setSupplierOptions(suppliers)

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

        /* DETAILS */
        const d = detailsRes?.data || {}

        setTransferDate(d.transfer_date ? parseISO(d.transfer_date) : null)
        setRemarks(d.remarks || '')

        setOrigin(origins.find(o => o.id === d.company_id) || null)
        setSupplier(suppliers.find(s => s.id === d.supplier_id) || null)

        setItems(
          (d.transfer_items || d.items || []).map(item => ({
            id: item.id,
            chemical: item.chemical_name || item.item_name || item.chemical?.name || '',
            chemicalId: item.chemical_id || item.item_id || item.chemical?.id,
            uom: item.uom_name || item.uom?.name || item.uom_details?.name || item.uom,
            uomId: item.uom_id || item.uom?.id || item.uom_details?.id,
            quantity: item.transfer_quantity || item.quantity,
            rate: item.unit_rate || item.rate,
            amount: (item.transfer_quantity || item.quantity) * (item.unit_rate || item.rate)
          }))
        )
      } catch (err) {
        showToast('error', 'Failed to load Transfer Out details')
      } finally {
        setInitLoading(false)
      }
    }

    if (decodedId) fetchData()
  }, [decodedId, type])

  const handleEditItem = row => {
    setEditId(row.id)
    setChemical({ label: row.chemical, id: row.chemicalId })
    setUom({ label: row.uom, id: row.uomId })
    setQuantity(row.quantity)
    setRate(row.rate)
  }

  /* ───── AMOUNT ───── */

  const amount = useMemo(() => {
    const q = Number(quantity)
    const r = Number(rate)
    return q && r ? q * r : ''
  }, [quantity, rate])

  /* ───── ITEM HANDLERS ───── */

  const handleAddItem = () => {
    if (!chemical || !uom || !quantity || !rate) {
      showToast('warning', 'Fill all item fields')
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

  /* ───── UPDATE ───── */

  const handleUpdate = async () => {
    if (!origin || !supplier || !transferDate || !items.length) {
      showToast('warning', 'Fill all required fields')
      return
    }

    try {
      setSaveLoading(true)

      const payload = {
        company_id: origin.id,
        supplier_id: supplier.id,
        transfer_date: format(transferDate, 'yyyy-MM-dd'),
        remarks,
        transfer_items: items.map(i => ({
          id: String(i.id).length > 10 ? null : i.id,
          chemical_id: i.chemicalId,
          uom_id: i.uomId,
          transfer_quantity: Number(i.quantity),
          unit_rate: Number(i.rate)
        }))
      }

      await updateTransferOut(decodedId, payload)

      showToast('success', 'Transfer Out updated successfully')
      router.push(`/${lang}/admin/transfer/transfer-out`)
    } catch {
      showToast('error', 'Update failed')
    } finally {
      setSaveLoading(false)
    }
  }

  /* ───── UI ───── */

  return (
    <StickyListLayout
      header={
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link href={`/${lang}`}>Dashboard</Link>
          <Link href={`/${lang}/admin/transfer/transfer-out`}>Transfer Out</Link>
          <Typography color='text.primary'>Edit</Typography>
        </Breadcrumbs>
      }
    >
      <Card>
        <CardHeader title='Update Transfer Out' />
        <Divider />

        {/* HEADER */}
        <Box px={4} py={3} position='relative'>
          {initLoading && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                bgcolor: 'rgba(255,255,255,0.7)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <CircularProgress />
            </Box>
          )}

          <Grid container spacing={3}>
            <Grid item md={4}>
              <GlobalAutocomplete label='Origin' options={originOptions} value={origin} onChange={setOrigin} />
            </Grid>

            <Grid item md={4}>
              <AppReactDatepicker
                selected={transferDate}
                onChange={setTransferDate}
                customInput={
                  <DateInput
                    label='Transfer Date'
                    value={transferDate ? format(transferDate, 'dd/MM/yyyy') : ''}
                  />
                }
              />
            </Grid>

            <Grid item md={4}>
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
            <Grid item md={3}>
              <GlobalAutocomplete label='Chemical' options={chemicalOptions} value={chemical} onChange={setChemical} />
            </Grid>

            <Grid item md={2}>
              <GlobalAutocomplete label='UOM' options={uomOptions} value={uom} onChange={setUom} />
            </Grid>

            <Grid item md={2}>
              <GlobalTextField label='Quantity' type='number' value={quantity} onChange={e => setQuantity(e.target.value)} />
            </Grid>

            <Grid item md={2}>
              <GlobalTextField label='Rate' type='number' value={rate} onChange={e => setRate(e.target.value)} />
            </Grid>

            <Grid item md={1}>
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
                    Qty
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
                  items.map((r, i) => (
                    <tr key={r.id}>
                      <td>{i + 1}</td>
                      <td>{r.chemical}</td>
                      <td>{r.uom}</td>
                      <td align='right'>{r.quantity}</td>
                      <td align='right'>{r.rate}</td>
                      <td align='right'>{r.amount}</td>
                      <td align='center'>
                        <IconButton size='small' color='primary' onClick={() => handleEditItem(r)}>
                          <EditIcon fontSize='small' />
                        </IconButton>
                        <IconButton size='small' color='error' onClick={() => handleRemoveItem(r.id)}>
                          <DeleteIcon fontSize='small' />
                        </IconButton>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} align='center'>
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
          <GlobalButton
            color='secondary'
            onClick={() => router.push(`/${lang}/admin/transfer/transfer-out`)}
          >
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

export default function EditTransferOutWrapper() {
  return (
    <PermissionGuard permission='Transfer Out'>
      <EditTransferOutPage />
    </PermissionGuard>
  )
}
