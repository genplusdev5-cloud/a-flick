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
import { getPurchaseFilters } from '@/api/purchase_order'
import { getMaterialRequestDropdowns } from '@/api/materialRequest/dropdown'
import { getTransferInDetailsTM, updateTransferIn } from '@/api/transfer_in'
import { showToast } from '@/components/common/Toasts'

const EditTransferInPage = () => {
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

  // Dropdowns
  const [fromCompanyOptions, setFromCompanyOptions] = useState([])
  const [toCompanyOptions, setToCompanyOptions] = useState([])
  const [chemicalOptions, setChemicalOptions] = useState([])
  const [uomOptions, setUomOptions] = useState([])

  // Loading
  const [initLoading, setInitLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  // Header fields
  const [fromCompany, setFromCompany] = useState(null)
  const [toCompany, setToCompany] = useState(null)
  const [transferDate, setTransferDate] = useState(null)
  const [remarks, setRemarks] = useState('')

  // Item fields
  const [chemical, setChemical] = useState(null)
  const [uom, setUom] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [rate, setRate] = useState('')
  const [editId, setEditId] = useState(null)

  const [items, setItems] = useState([])

  const DateInput = forwardRef(function DateInput(props, ref) {
    return <CustomTextField fullWidth inputRef={ref} {...props} />
  })

  // 🔥 FETCH DETAILS
  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitLoading(true)

        const [purchaseRes, materialRes, detailsRes] = await Promise.all([
          getPurchaseFilters(),
          getMaterialRequestDropdowns(),
          getTransferInDetailsTM(decodedId)
        ])

        // Companies
        const companies =
          purchaseRes?.data?.data?.company?.name?.map(c => ({
            label: c.name,
            value: c.id,
            id: c.id
          })) || []

        setFromCompanyOptions(companies)
        setToCompanyOptions(companies)

        // Materials
        const materialData = materialRes?.data || materialRes

        setChemicalOptions(
          materialData?.chemicals?.name?.map(c => ({
            label: c.name,
            value: c.id,
            id: c.id
          })) || []
        )

        setUomOptions(
          materialData?.uom?.name?.map(u => ({
            label: u.name,
            value: u.id,
            id: u.id
          })) || []
        )

        // Details
        const details = detailsRes || {}

        setTransferDate(details.transfer_in_date ? parseISO(details.transfer_in_date) : null)
        setRemarks(details.remarks || '')

        if (details.from_company_id) {
          const f = companies.find(c => c.id === details.from_company_id)
          if (f) setFromCompany(f)
        }

        if (details.to_company_id) {
          const t = companies.find(c => c.id === details.to_company_id)
          if (t) setToCompany(t)
        }

        setItems(
          (details.transfer_in_items || details.items || []).map(item => ({
            id: item.id,
            chemical: item.chemical_name || item.item_name || item.chemical?.name || '',
            chemicalId: item.chemical_id || item.item_id || item.chemical?.id,
            uom: item.uom_name || item.uom?.name || item.uom_details?.name || item.uom,
            uomId: item.uom_id || item.uom?.id || item.uom_details?.id,
            quantity: item.quantity,
            rate: item.unit_rate || item.rate,
            amount: item.quantity * (item.unit_rate || item.rate)
          }))
        )
      } catch (err) {
        console.error(err)
        showToast('error', 'Failed to load Transfer In details')
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

  const handleUpdate = async () => {
    if (!fromCompany || !toCompany || !transferDate || items.length === 0) {
      showToast('warning', 'Fill all required fields')
      return
    }

    try {
      setSaveLoading(true)

      const payload = {
        from_company_id: fromCompany.id,
        to_company_id: toCompany.id,
        transfer_in_date: format(transferDate, 'yyyy-MM-dd'),
        remarks,
        transfer_in_items: items.map(i => ({
          id: String(i.id).length > 10 ? null : i.id,
          chemical_id: i.chemicalId,
          uom_id: i.uomId,
          quantity: Number(i.quantity),
          unit_rate: Number(i.rate)
        }))
      }

      await updateTransferIn(decodedId, payload)

      showToast('success', 'Transfer In updated successfully')
      router.push(`/${lang}/admin/transfer/transfer-in`)
    } catch (err) {
      console.error(err)
      showToast('error', err?.response?.data?.message || 'Update failed')
    } finally {
      setSaveLoading(false)
    }
  }

  return (
    <StickyListLayout
      header={
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link href={`/${lang}`}>Dashboard</Link>
          <Link href={`/${lang}/admin/transfer/transfer-in`}>Transfer In</Link>
          <Typography>Edit</Typography>
        </Breadcrumbs>
      }
    >
      <Card>
        <CardHeader title='Update Transfer In' />
        <Divider />

        {/* HEADER */}
        <Box px={4} py={3} position='relative'>
          {initLoading && (
            <Box
              sx={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
              <CircularProgress />
            </Box>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='From Company'
                options={fromCompanyOptions}
                value={fromCompany}
                onChange={setFromCompany}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <AppReactDatepicker
                selected={transferDate}
                onChange={setTransferDate}
                customInput={<DateInput label='Transfer In Date' />}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='To Company'
                options={toCompanyOptions}
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

        {/* ITEMS */}
        <Box px={4} py={3}>
          <Grid container spacing={2} alignItems='flex-end'>
            <Grid item xs={12} md={3}>
              <GlobalAutocomplete label='Chemical' options={chemicalOptions} value={chemical} onChange={setChemical} />
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
              <GlobalTextField label='Rate' type='number' value={rate} onChange={e => setRate(e.target.value)} />
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
                  items.map((i, idx) => (
                    <tr key={i.id}>
                      <td>{idx + 1}</td>
                      <td>{i.chemical}</td>
                      <td>{i.uom}</td>
                      <td>{i.quantity}</td>
                      <td>{i.rate}</td>
                      <td>{i.amount}</td>
                      <td align='center'>
                        <IconButton size='small' color='primary' onClick={() => handleEditItem(i)}>
                          <EditIcon fontSize='small' />
                        </IconButton>
                        <IconButton size='small' color='error' onClick={() => handleRemoveItem(i.id)}>
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
          <GlobalButton color='secondary' onClick={() => router.push(`/${lang}/admin/transfer/transfer-in`)}>
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

export default function EditTransferInWrapper() {
  return (
    <PermissionGuard permission='Transfer In'>
      <EditTransferInPage />
    </PermissionGuard>
  )
}
