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

import { getPurchaseFilters } from '@/api/purchase/purchase_inward'
import { getMaterialRequestDropdowns } from '@/api/transfer/materialRequest/dropdown'
import { getMaterialIssueDetails, updateMaterialIssue } from '@/api/transfer/material_issue'

import { showToast } from '@/components/common/Toasts'

const EditMaterialRequestIssuedPage = () => {
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
  const [technicianOptions, setTechnicianOptions] = useState([])
  const [chemicalOptions, setChemicalOptions] = useState([])
  const [uomOptions, setUomOptions] = useState([])

  const [origin, setOrigin] = useState(null)
  const [technician, setTechnician] = useState(null)
  const [issueDate, setIssueDate] = useState(null)
  const [remarks, setRemarks] = useState('')

  const [chemical, setChemical] = useState(null)
  const [uom, setUom] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [editId, setEditId] = useState(null)

  const [items, setItems] = useState([])

  const [initLoading, setInitLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  /* ───── DATE INPUT ───── */
  const DateInput = forwardRef(function DateInput(props, ref) {
    return <CustomTextField fullWidth inputRef={ref} {...props} />
  })

  /* ───── FETCH DATA ───── */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitLoading(true)

        const [purchaseRes, materialRes, detailsRes] = await Promise.all([
          getPurchaseFilters(),
          getMaterialRequestDropdowns(),
          getMaterialIssueDetails(decodedId, type)
        ])

        /* DROPDOWNS */
        const purchaseData = purchaseRes?.data?.data || purchaseRes?.data || purchaseRes || {}

        const origins =
          purchaseData?.company?.name?.map(i => ({
            label: i.name,
            value: i.id,
            id: i.id
          })) || []

        setOriginOptions(origins)

        const materialData = materialRes?.data?.data || materialRes?.data || materialRes || {}

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

        /* DETAILS */
        const detailJson = detailsRes?.data || detailsRes || {}
        const d = detailJson?.data || detailJson

        setIssueDate(d.issue_date ? parseISO(d.issue_date) : null)
        setRemarks(d.remarks || '')

        setOrigin(origins.find(o => o.id === d.company_id) || null)
        setTechnician(techs.find(t => t.id === d.technician_id) || null)

        setItems(
          (d.items || d.transfer_items || d.transfer_in_items || []).map(item => ({
            id: item.id,
            chemical: item.item_name || item.chemical_name || item.chemical?.name || '',
            chemicalId: item.item_id || item.chemical_id || item.chemical?.id,
            uom: item.uom_name || item.uom?.name || item.uom_details?.name || item.uom,
            uomId: item.uom_id || item.uom?.id || item.uom_details?.id,
            quantity: item.quantity || item.transfer_quantity
          }))
        )
      } catch (err) {
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

  /* ───── ITEM HANDLERS ───── */
  const handleAddItem = () => {
    if (!chemical || !uom || !quantity) {
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

  /* ───── UPDATE ───── */
  const handleUpdate = async () => {
    if (!origin || !technician || !issueDate || !items.length) {
      showToast('warning', 'Fill all required fields')
      return
    }

    try {
      setSaveLoading(true)

      const payload = {
        id: decodedId,
        company_id: origin.id,
        technician_id: technician.id,
        issue_date: format(issueDate, 'yyyy-MM-dd'),
        remarks,
        items: items.map(i => ({
          id: typeof i.id === 'number' && i.id < 1000000000000 ? i.id : null,
          item_id: i.chemicalId,
          technician_id: technician.id,
          uom_id: i.uomId,
          quantity: Number(i.quantity)
        }))
      }

      await updateMaterialIssue(decodedId, payload)

      showToast('success', 'Material Issued updated successfully')
      router.push(`/${lang}/admin/transfer/material-issued`)
    } catch {
      showToast('error', 'Update failed')
    } finally {
      setSaveLoading(false)
    }
  }

  return (
    <StickyListLayout
      header={
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link href={`/${lang}`}>Dashboard</Link>
          <Link href={`/${lang}/admin/transfer/material-issued`}>Material Issued</Link>
          <Typography color='text.primary'>Edit</Typography>
        </Breadcrumbs>
      }
    >
      <Card>
        <CardHeader title='Update Material Issued' />
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
                alignItems: 'center',
                zIndex: 1
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
                selected={issueDate}
                onChange={setIssueDate}
                customInput={<DateInput label='Issue Date' />}
              />
            </Grid>

            <Grid item md={4}>
              <GlobalAutocomplete label='Technician' options={technicianOptions} value={technician} onChange={setTechnician} />
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
            <Grid item md={4}>
              <GlobalAutocomplete label='Chemical' options={chemicalOptions} value={chemical} onChange={setChemical} />
            </Grid>

            <Grid item md={3}>
              <GlobalAutocomplete label='UOM' options={uomOptions} value={uom} onChange={setUom} />
            </Grid>

            <Grid item md={3}>
              <GlobalTextField label='Quantity' type='number' value={quantity} onChange={e => setQuantity(e.target.value)} />
            </Grid>

            <Grid item md={2}>
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

        {/* ITEMS TABLE */}
        <Box px={4} pb={3}>
          <StickyTableWrapper rowCount={items.length}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th style={{ width: '40%' }}>Chemical</th>
                  <th style={{ width: '25%' }}>UOM</th>
                  <th align='right' style={{ width: '20%' }}>
                    Qty
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
          <GlobalButton
            color='secondary'
            onClick={() => router.push(`/${lang}/admin/transfer/material-issued`)}
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


export default function EditMaterialRequestIssuedWrapper() {
  return (
    <PermissionGuard permission='Material Request Issued'>
      <EditMaterialRequestIssuedPage />
    </PermissionGuard>
  )
}
