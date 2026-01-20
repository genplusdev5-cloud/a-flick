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
import { getPurchaseFilters } from '@/api/purchase/purchase_order'
import { getMaterialRequestDropdowns } from '@/api/transfer/materialRequest/dropdown'
import { getMaterialReceiveDetails, updateMaterialReceive } from '@/api/transfer/material_receive'
import { showToast } from '@/components/common/Toasts'

const EditMaterialRequestReceivedPage = () => {
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
  const [originOptions, setOriginOptions] = useState([])
  const [technicianOptions, setTechnicianOptions] = useState([])
  const [chemicalOptions, setChemicalOptions] = useState([])
  const [uomOptions, setUomOptions] = useState([])

  // Loading
  const [initLoading, setInitLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  // Header fields
  const [origin, setOrigin] = useState(null)
  const [technician, setTechnician] = useState(null)
  const [receiveDate, setReceiveDate] = useState(null)
  const [remarks, setRemarks] = useState('')

  // Item fields
  const [chemical, setChemical] = useState(null)
  const [uom, setUom] = useState(null)
  const [quantity, setQuantity] = useState('')
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
          getMaterialReceiveDetails(decodedId, type)
        ])

        // Companies
        const purchaseData = purchaseRes?.data?.data || purchaseRes?.data || purchaseRes || {}

        const companies =
          purchaseData?.company?.name?.map(c => ({
            label: c.name,
            value: c.id,
            id: c.id
          })) || []

        setOriginOptions(companies)

        const materialData = materialRes?.data?.data || materialRes?.data || materialRes || {}

        // Materials
        const techs =
          materialData?.employee?.name?.map(e => ({
            label: e.name,
            value: e.id,
            id: e.id
          })) || []

        setTechnicianOptions(techs)

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
        const detailJson = detailsRes?.data || detailsRes || {}
        const details = detailJson?.data || detailJson

        setReceiveDate(details.receive_date ? parseISO(details.receive_date) : details.issue_date ? parseISO(details.issue_date) : null)
        setRemarks(details.remarks || '')

        setOrigin(companies.find(c => c.id === details.company_id) || null)
        setTechnician(techs.find(t => t.id === details.technician_id) || null)

        setItems(
          (details.items || details.transfer_items || details.transfer_in_items || []).map(item => ({
            id: item.id,
            chemical: item.item_name || item.chemical_name || item.chemical?.name || '',
            chemicalId: item.item_id || item.chemical_id || item.chemical?.id,
            uom: item.uom_name || item.uom?.name || item.uom_details?.name || item.uom,
            uomId: item.uom_id || item.uom?.id || item.uom_details?.id,
            quantity: item.quantity || item.transfer_quantity
          }))
        )
      } catch (err) {
        console.error(err)
        showToast('error', 'Failed to load details')
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
  }

  const handleAddItem = () => {
    if (!chemical || !uom || !quantity) {
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

    setChemical(null)
    setUom(null)
    setQuantity('')
  }

  const handleRemoveItem = id => {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const handleUpdate = async () => {
    if (!origin || !technician || !receiveDate || items.length === 0) {
      showToast('warning', 'Fill all required fields')
      return
    }

    try {
      setSaveLoading(true)

      const payload = {
        id: decodedId,
        company_id: origin.id,
        technician_id: technician.id,
        receive_date: format(receiveDate, 'yyyy-MM-dd'),
        remarks,
        items: items.map(i => ({
          id: typeof i.id === 'number' && i.id < 1000000000000 ? i.id : null,
          item_id: i.chemicalId,
          item_name: i.chemical,
          uom_id: i.uomId,
          uom: i.uom,
          quantity: Number(i.quantity)
        }))
      }

      await updateMaterialReceive(decodedId, payload)

      showToast('success', 'Material Received updated successfully')
      router.push(`/${lang}/admin/transfer/material-received`)
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
          <Link href={`/${lang}/admin/transfer/material-received`}>Material Received</Link>
          <Typography>Edit</Typography>
        </Breadcrumbs>
      }
    >
      <Card>
        <CardHeader title='Update Material Received' />
        <Divider />

        {/* HEADER */}
        <Box px={4} py={3} position='relative'>
          {initLoading && (
            <Box
              sx={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1, bgcolor: 'rgba(255,255,255,0.7)' }}
            >
              <CircularProgress />
            </Box>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='Origin'
                options={originOptions}
                value={origin}
                onChange={setOrigin}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <AppReactDatepicker
                selected={receiveDate}
                onChange={setReceiveDate}
                customInput={<DateInput label='Receive Date' />}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='Technician'
                options={technicianOptions}
                value={technician}
                onChange={setTechnician}
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
            <Grid item xs={12} md={4}>
              <GlobalAutocomplete label='Chemical' options={chemicalOptions} value={chemical} onChange={setChemical} />
            </Grid>
            <Grid item xs={12} md={3}>
              <GlobalAutocomplete label='UOM' options={uomOptions} value={uom} onChange={setUom} />
            </Grid>
            <Grid item xs={12} md={3}>
              <GlobalTextField
                label='Quantity'
                type='number'
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <GlobalButton
                variant='contained'
                color={editId ? 'info' : 'primary'}
                startIcon={editId ? <EditIcon /> : <AddIcon />}
                onClick={handleAddItem}
                fullWidth
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
                  <th style={{ width: '40%' }}>Chemical</th>
                  <th style={{ width: '25%' }}>UOM</th>
                  <th align='right' style={{ width: '20%' }}>
                    Quantity
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
                      <td align='right'>{i.quantity}</td>
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
                    <td colSpan={5} align='center'>
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
          <GlobalButton color='secondary' onClick={() => router.push(`/${lang}/admin/transfer/material-received`)}>
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

export default function EditMaterialRequestReceivedWrapper() {
  return (
    <PermissionGuard permission='Material Request Received'>
      <EditMaterialRequestReceivedPage />
    </PermissionGuard>
  )
}
