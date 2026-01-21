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
import { getPurchaseFilters } from '@/api/purchase/purchase_order/filter'
import { addMaterialRequest } from '@/api/transfer/materialRequest/add'
import { getMaterialRequestDropdowns } from '@/api/transfer/materialRequest/dropdown'
import { showToast } from '@/components/common/Toasts'

import { format } from 'date-fns'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import CustomTextField from '@core/components/mui/TextField'

export default function AddMaterialRequestPage() {
  const router = useRouter()
  const { lang } = useParams()

  // Dropdown options
  const [originOptions, setOriginOptions] = useState([])
  const [employeeOptions, setEmployeeOptions] = useState([])
  const [chemicalOptions, setChemicalOptions] = useState([])
  const [uomOptions, setUomOptions] = useState([])
  const [supplierOptions, setSupplierOptions] = useState([])

  // Loading states
  const [initLoading, setInitLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  // Header fields
  const [requestDate, setRequestDate] = useState(new Date())
  const [origin, setOrigin] = useState(null)
  const [fromEmployee, setFromEmployee] = useState(null)
  const [toEmployee, setToEmployee] = useState(null)
  const [remarks, setRemarks] = useState('')

  // Item fields
  const [chemical, setChemical] = useState(null)
  const [uom, setUom] = useState(null)
  const [quantity, setQuantity] = useState('')

  const [editId, setEditId] = useState(null)

  // Items list
  const [items, setItems] = useState([])

  const PoDateInput = forwardRef(function PoDateInput(props, ref) {
    const { label, value, ...rest } = props

    return <CustomTextField fullWidth inputRef={ref} label={label} value={value} {...rest} />
  })

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setInitLoading(true)
        const [mrRes, filterRes] = await Promise.all([
          getMaterialRequestDropdowns(),
          getPurchaseFilters()
        ])
        const data = mrRes?.data || mrRes
        const filterData = filterRes?.data || filterRes
        const purchaseData = filterData?.data || filterData || {}
        const origins =
          purchaseData?.company?.name?.map(item => ({
            label: item.name,
            value: item.name,
            id: item.id
          })) || []

        setChemicalOptions((data?.chemicals?.name || []).map(c => ({
          label: c.name,
          id: c.id,
          value: c.id,
          uom: c.uom || c.uom_name || c.unit
        })))
        setUomOptions((data?.uom?.name || []).map(u => ({ label: u.name, id: u.id, value: u.id })))
        setSupplierOptions((data?.supplier?.name || []).map(s => ({ label: s.name, id: s.id, value: s.id })))
        setOriginOptions(origins)
        setEmployeeOptions((data?.employee?.name || []).map(e => ({ label: e.name, id: e.id, value: e.id })))

        // Set default origin if available
        const defaultOrigin = origins.find(o => o.label === 'A-Flick Pte Ltd') || origins[0]
        if (defaultOrigin) {
          setOrigin(defaultOrigin)
        }
      } catch (err) {
        console.error('Dropdown load failed:', err)
        showToast('error', 'Failed to load dropdown data')
      } finally {
        setInitLoading(false)
      }
    }
    fetchOptions()
  }, [])

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

  const handleAddItem = () => {
    if (!chemical || !uom || !quantity) {
      showToast('error', 'Please select a chemical, UOM, and enter quantity')
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

  const handleSaveAll = async () => {
    if (items.length === 0) {
      showToast('warning', 'Please add at least one chemical')
      return
    }

    try {
      setSaveLoading(true)
      const payload = {
        request_date: format(requestDate, 'yyyy-MM-dd'),
        remarks: remarks,
        origin_id: origin?.id || null,
        from_location: fromEmployee?.label || null,
        to_location: toEmployee?.label || null,
        items: items.map(i => ({
          item_id: i.chemicalId,
          item_name: i.chemical,
          uom: i.uom,
          uom_id: i.uomId,
          quantity: Number(i.quantity)
        }))
      }

      await addMaterialRequest(payload)
      showToast('success', 'Material Request added successfully')
      router.push(`/${lang}/admin/transfer/material-request`)
    } catch (err) {
      console.error('Save failed:', err)
      showToast('error', err?.response?.data?.message || 'Failed to save Material Request')
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
          <Link href={`/${lang}/admin/transfer/material-request`} style={{ textDecoration: 'none' }}>
            Material Request
          </Link>
          <Typography color='text.primary'>Add</Typography>
        </Breadcrumbs>
      }
    >
      <Card>
        <CardHeader
          title={
            <Typography variant='h5' fontWeight={600}>
              Add Material Request
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
              <AppReactDatepicker
                selected={requestDate}
                onChange={date => setRequestDate(date)}
                dateFormat='dd/MM/yyyy'
                customInput={<PoDateInput label='Request Date' value={requestDate ? format(requestDate, 'dd/MM/yyyy') : ''} />}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='Origin'
                options={originOptions}
                value={origin}
                onChange={setOrigin}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='From Employee'
                options={employeeOptions}
                value={fromEmployee}
                onChange={setFromEmployee}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='To Employee'
                options={employeeOptions}
                value={toEmployee}
                onChange={setToEmployee}
              />
            </Grid>

            <Grid item xs={12} md={8}>
              <GlobalTextField
                label='Remarks'
                multiline
                minRows={1}
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
          <GlobalButton color='secondary' onClick={() => router.push(`/${lang}/admin/transfer/material-request`)}>
            Close
          </GlobalButton>
          <GlobalButton variant='contained' onClick={handleSaveAll} disabled={saveLoading || items.length === 0}>
            {saveLoading ? 'Saving...' : 'Save Request'}
          </GlobalButton>
        </Box>
      </Card>
    </StickyListLayout>
  )
}
