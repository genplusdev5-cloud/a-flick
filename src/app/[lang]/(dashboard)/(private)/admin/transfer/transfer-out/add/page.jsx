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
  IconButton,
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

import { getPurchaseFilters } from '@/api/purchase_inward'
import { getMaterialRequestDropdowns } from '@/api/materialRequest/dropdown'
import { addTransferOut } from '@/api/transfer_out'

import { showToast } from '@/components/common/Toasts'
import styles from '@core/styles/table.module.css'

import { format } from 'date-fns'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import CustomTextField from '@core/components/mui/TextField'

/* ───────────────────────────── */

const AddTransferOutPage = () => {
  const router = useRouter()
  const { lang } = useParams()

  /* ───── STATES ───── */

  const [originOptions, setOriginOptions] = useState([])
  const [supplierOptions, setSupplierOptions] = useState([])
  const [chemicalOptions, setChemicalOptions] = useState([])
  const [uomOptions, setUomOptions] = useState([])

  const [origin, setOrigin] = useState(null)
  const [supplier, setSupplier] = useState(null)
  const [transferDate, setTransferDate] = useState(new Date())
  const [remarks, setRemarks] = useState('')

  const [chemical, setChemical] = useState(null)
  const [uom, setUom] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [rate, setRate] = useState('')

  const [items, setItems] = useState([])

  const [initLoading, setInitLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  /* ───── FETCH DROPDOWNS ───── */

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        setInitLoading(true)

        const [purchaseRes, materialRes] = await Promise.all([
          getPurchaseFilters(),
          getMaterialRequestDropdowns()
        ])

        const purchaseData = purchaseRes?.data?.data || {}

        setOriginOptions(
          purchaseData?.company?.name?.map(i => ({
            label: i.name,
            value: i.name,
            id: i.id
          })) || []
        )

        setSupplierOptions(
          purchaseData?.supplier?.name?.map(i => ({
            label: i.name,
            value: i.name,
            id: i.id
          })) || []
        )

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
      } catch (e) {
        showToast('error', 'Failed to load dropdowns')
      } finally {
        setInitLoading(false)
      }
    }

    fetchDropdowns()
  }, [])

  /* ───── DATE INPUT ───── */

  const DateInput = forwardRef(function DateInput(props, ref) {
    const { label, value, ...rest } = props
    return <CustomTextField fullWidth inputRef={ref} label={label} value={value} {...rest} />
  })

  /* ───── CALCULATED AMOUNT ───── */

  const amount = useMemo(() => {
    const q = Number(quantity)
    const r = Number(rate)
    return q && r ? q * r : ''
  }, [quantity, rate])

  /* ───── ADD ITEM ───── */

  const handleAddItem = () => {
    if (!chemical || !uom || !quantity || !rate) {
      showToast('warning', 'Fill all chemical fields')
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

  /* ───── SAVE ───── */

  const handleSave = async () => {
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
          chemical_id: i.chemicalId,
          uom_id: i.uomId,
          transfer_quantity: Number(i.quantity),
          unit_rate: Number(i.rate)
        }))
      }

      await addTransferOut(payload)

      showToast('success', 'Transfer Out added successfully')
      router.push(`/${lang}/admin/transfer/transfer-out`)
    } catch (err) {
      showToast('error', err?.response?.data?.message || 'Save failed')
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
          <Typography color='text.primary'>Add</Typography>
        </Breadcrumbs>
      }
    >
      <Card>
        <CardHeader title='Add Transfer Out' />
        <Divider />

        {/* HEADER FORM */}
        <Box px={4} py={3} position='relative'>
          {initLoading && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                bgcolor: 'rgba(255,255,255,0.7)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1
              }}
            >
              <CircularProgress />
            </Box>
          )}

          <Grid container spacing={3}>
            <Grid item md={3}>
              <GlobalAutocomplete label='Origin' options={originOptions} value={origin} onChange={setOrigin} />
            </Grid>

            <Grid item md={3}>
              <AppReactDatepicker
                selected={transferDate}
                onChange={setTransferDate}
                dateFormat='dd/MM/yyyy'
                customInput={
                  <DateInput
                    label='Transfer Date'
                    value={format(transferDate, 'dd/MM/yyyy')}
                  />
                }
              />
            </Grid>

            <Grid item md={3}>
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
              <GlobalTextField label='Unit Rate' type='number' value={rate} onChange={e => setRate(e.target.value)} />
            </Grid>

            <Grid item md={1}>
              <GlobalButton startIcon={<AddIcon />} onClick={handleAddItem}>
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
                  <th>#</th>
                  <th>Chemical</th>
                  <th>UOM</th>
                  <th align='right'>Qty</th>
                  <th align='right'>Rate</th>
                  <th align='right'>Amount</th>
                  <th />
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
                        <IconButton color='error' onClick={() => handleRemoveItem(r.id)}>
                          <DeleteIcon fontSize='small' />
                        </IconButton>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} align='center'>
                      No items added
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

export default function AddTransferOutWrapper() {
  return (
    <PermissionGuard permission='Transfer Out'>
      <AddTransferOutPage />
    </PermissionGuard>
  )
}
