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
import EditIcon from '@mui/icons-material/Edit'

import StickyListLayout from '@/components/common/StickyListLayout'
import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import PermissionGuard from '@/components/auth/PermissionGuard'
import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import styles from '@core/styles/table.module.css'

import { getPurchaseFilters } from '@/api/purchase_order'
import { getMaterialRequestDropdowns } from '@/api/materialRequest/dropdown'
import { addTransferIn } from '@/api/transfer_in'
import { showToast } from '@/components/common/Toasts'

import { format } from 'date-fns'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import CustomTextField from '@core/components/mui/TextField'

const AddTransferInPage = () => {
  const router = useRouter()
  const { lang } = useParams()

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
  const [transferDate, setTransferDate] = useState(new Date())
  const [remarks, setRemarks] = useState('')

  // Item fields
  const [chemical, setChemical] = useState(null)
  const [uom, setUom] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [rate, setRate] = useState('')
  const [editId, setEditId] = useState(null)

  const [items, setItems] = useState([])

  // 🔹 Fetch dropdowns
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setInitLoading(true)

        const [purchaseRes, materialRes] = await Promise.all([
          getPurchaseFilters(),
          getMaterialRequestDropdowns()
        ])

        const purchaseData = purchaseRes?.data?.data || {}

        const companies =
          purchaseData?.company?.name?.map(c => ({
            label: c.name,
            value: c.id,
            id: c.id
          })) || []

        const materialData = materialRes?.data || materialRes

        const chemicals =
          materialData?.chemicals?.name?.map(c => ({
            label: c.name,
            value: c.id,
            id: c.id
          })) || []

        const uoms =
          materialData?.uom?.name?.map(u => ({
            label: u.name,
            value: u.id,
            id: u.id
          })) || []

        setFromCompanyOptions(companies)
        setToCompanyOptions(companies)
        setChemicalOptions(chemicals)
        setUomOptions(uoms)

        if (companies.length) setFromCompany(companies[0])
      } catch (err) {
        console.error(err)
        showToast('error', 'Failed to load dropdowns')
      } finally {
        setInitLoading(false)
      }
    }

    fetchOptions()
    fetchOptions()
  }, [])

  const handleEditItem = row => {
    setEditId(row.id)
    setChemical({ label: row.chemical, id: row.chemicalId })
    setUom({ label: row.uom, id: row.uomId })
    setQuantity(row.quantity)
    setRate(row.rate)
  }

  // Date input
  const DateInput = forwardRef(function DateInput(props, ref) {
    return <CustomTextField fullWidth inputRef={ref} {...props} />
  })

  const amount = useMemo(() => {
    const q = Number(quantity)
    const r = Number(rate)
    return q && r ? q * r : ''
  }, [quantity, rate])

  // Add item
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

  // Save
  const handleSave = async () => {
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
          chemical_id: i.chemicalId,
          uom_id: i.uomId,
          quantity: Number(i.quantity),
          unit_rate: Number(i.rate)
        }))
      }

      await addTransferIn(payload)

      showToast('success', 'Transfer In added successfully')
      router.push(`/${lang}/admin/transfer/transfer-in`)
    } catch (err) {
      console.error(err)
      showToast('error', err?.response?.data?.message || 'Failed to save Transfer In')
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
          <Typography>Add</Typography>
        </Breadcrumbs>
      }
    >
      <Card>
        <CardHeader title='Add Transfer In' />
        <Divider />

        {/* HEADER */}
        <Box px={4} py={3} position='relative'>
          {initLoading && (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <CircularProgress />
            </Box>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <GlobalAutocomplete label='From Company' options={fromCompanyOptions} value={fromCompany} onChange={setFromCompany} />
            </Grid>

            <Grid item xs={12} md={4}>
              <AppReactDatepicker
                selected={transferDate}
                onChange={setTransferDate}
                customInput={<DateInput label='Transfer In Date' />}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete label='To Company' options={toCompanyOptions} value={toCompany} onChange={setToCompany} />
            </Grid>

            <Grid item xs={12}>
              <GlobalTextField label='Remarks' multiline minRows={3} value={remarks} onChange={e => setRemarks(e.target.value)} />
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
              <GlobalTextField label='Quantity' type='number' value={quantity} onChange={e => setQuantity(e.target.value)} />
            </Grid>
            <Grid item xs={12} md={2}>
              <GlobalTextField label='Unit Rate' type='number' value={rate} onChange={e => setRate(e.target.value)} />
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
                {items.length ? items.map((i, idx) => (
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
                )) : (
                  <tr><td colSpan={7} align='center'>No items</td></tr>
                )}
              </tbody>
            </table>
          </StickyTableWrapper>
        </Box>

        <Divider />

        {/* ACTIONS */}
        <Box px={4} py={3} display='flex' justifyContent='flex-end' gap={2}>
          <GlobalButton color='secondary' onClick={() => router.push(`/${lang}/admin/transfer/transfer-in`)}>
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

export default function AddTransferInWrapper() {
  return (
    <PermissionGuard permission='Transfer In'>
      <AddTransferInPage />
    </PermissionGuard>
  )
}
