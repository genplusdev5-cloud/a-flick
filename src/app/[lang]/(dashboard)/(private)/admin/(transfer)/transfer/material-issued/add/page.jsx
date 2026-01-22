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

import { getPurchaseFilters } from '@/api/purchase/purchase_inward'
import { getMaterialRequestDropdowns } from '@/api/transfer/materialRequest/dropdown'
import { addMaterialIssue } from '@/api/transfer/material_issue'

import { showToast } from '@/components/common/Toasts'
import styles from '@core/styles/table.module.css'

import { format } from 'date-fns'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import CustomTextField from '@core/components/mui/TextField'

const AddMaterialRequestIssuedPage = () => {
  const router = useRouter()
  const { lang } = useParams()

  /* ───── STATES ───── */
  const [employeeOptions, setEmployeeOptions] = useState([])
  const [chemicalOptions, setChemicalOptions] = useState([])
  const [uomOptions, setUomOptions] = useState([])

  const [requestNo, setRequestNo] = useState('')
  const [issueDate, setIssueDate] = useState(new Date())
  const [fromEmployee, setFromEmployee] = useState(null)
  const [toEmployee, setToEmployee] = useState(null)
  const [remarks, setRemarks] = useState('')

  const [chemical, setChemical] = useState(null)
  const [uom, setUom] = useState(null)
  const [quantity, setQuantity] = useState('')

  const [editId, setEditId] = useState(null)

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

        const purchaseData = purchaseRes?.data?.data || purchaseRes?.data || {}
        const materialData = materialRes?.data?.data || materialRes?.data || materialRes || {}

        // Employees
        const employees = (materialData?.employee?.name || []).map(e => ({
          label: e.name,
          value: e.id,
          id: e.id
        }))
        setEmployeeOptions(employees)

        // Chemicals
        let chemRaw = []
        if (Array.isArray(purchaseData?.chemicals)) {
          chemRaw = purchaseData.chemicals
        } else if (Array.isArray(purchaseData?.chemicals?.name)) {
          chemRaw = purchaseData.chemicals.name
        } else if (Array.isArray(materialData?.chemicals?.name)) {
          chemRaw = materialData.chemicals.name
        }

        const chemicals = chemRaw.map(c => ({
          label: c.name,
          value: c.id,
          id: c.id,
          uom: c.uom || c.uom_name || c.unit
        }))
        setChemicalOptions(chemicals)

        // UOM
        const uomRaw = materialData?.uom?.name || materialData?.uom || []
        const uoms = uomRaw.map(u => ({
          label: u.name,
          value: u.id,
          id: u.id
        }))
        setUomOptions(uoms)

      } catch (e) {
        showToast('error', 'Failed to load dropdowns')
      } finally {
        setInitLoading(false)
      }
    }

    fetchDropdowns()
  }, [])

  const handleChemicalChange = val => {
    setChemical(val)
    if (val && val.uom) {
      const uomStr = typeof val.uom === 'object' ? val.uom.label || val.uom.name : val.uom
      const foundUom = uomOptions.find(u => u.label.toLowerCase() === uomStr.toLowerCase())
      if (foundUom) {
        setUom(foundUom)
      } else {
        setUom({ label: uomStr, value: uomStr, id: null })
      }
    } else {
      setUom(null)
    }
  }

  const handleEditItem = row => {
    setEditId(row.id)
    setChemical({ label: row.chemical, id: row.chemicalId, uom: row.uom })
    setUom({ label: row.uom, id: row.uomId })
    setQuantity(row.quantity)
  }

  /* ───── DATE INPUT ───── */
  const DateInput = forwardRef(function DateInput(props, ref) {
    return <CustomTextField fullWidth inputRef={ref} {...props} />
  })

  /* ───── ADD ITEM ───── */
  const handleAddItem = () => {
    if (!chemical || !uom || !quantity) {
      showToast('warning', 'Fill all chemical fields')
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

  /* ───── SAVE ───── */
  const handleSave = async () => {
    if (!requestNo || !fromEmployee || !toEmployee || !issueDate || !items.length) {
      showToast('warning', 'Fill all required fields')
      return
    }

    try {
      setSaveLoading(true)

      const payload = {
        request_no: requestNo,
        from_employee_id: fromEmployee.id,
        to_employee_id: toEmployee.id,
        issue_date: format(issueDate, 'yyyy-MM-dd'),
        remarks,
        items: items.map(i => ({
          item_id: i.chemicalId,
          uom_id: i.uomId,
          quantity: Number(i.quantity)
        }))
      }

      await addMaterialIssue(payload)

      showToast('success', 'Material Issued added successfully')
      router.push(`/${lang}/admin/transfer/material-issued`)
    } catch (err) {
      showToast('error', err?.response?.data?.message || 'Save failed')
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
          <Typography color='text.primary'>Add</Typography>
        </Breadcrumbs>
      }
    >
      <Card>
        <CardHeader title='Add Material Issued' />
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


            <Grid item md={4} xs={12}>
              <AppReactDatepicker
                selected={issueDate}
                onChange={setIssueDate}
                customInput={<DateInput label='Issue Date' />}
              />
            </Grid>

            <Grid item md={4} xs={12}>
              <GlobalAutocomplete
                label='From Employee'
                options={employeeOptions}
                value={fromEmployee}
                onChange={setFromEmployee}
              />
            </Grid>

            <Grid item md={4} xs={12}>
              <GlobalAutocomplete
                label='To Employee'
                options={employeeOptions}
                value={toEmployee}
                onChange={setToEmployee}
              />
            </Grid>

               <Grid item md={4} xs={12}>
              <GlobalTextField
                label='Request No'
                value={requestNo}
                onChange={e => setRequestNo(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
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
            <Grid item md={4} xs={12}>
              <GlobalAutocomplete
                label='Chemical'
                options={chemicalOptions}
                value={chemical}
                onChange={handleChemicalChange}
              />
            </Grid>

            <Grid item md={3} xs={12}>
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

            <Grid item md={3} xs={12}>
              <GlobalTextField label='Quantity' type='number' value={quantity} onChange={e => setQuantity(e.target.value)} />
            </Grid>

            <Grid item md={2} xs={12}>
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


export default function AddMaterialRequestIssuedWrapper() {
  return (
    <PermissionGuard permission='Material Request Issued'>
      <AddMaterialRequestIssuedPage />
    </PermissionGuard>
  )
}
