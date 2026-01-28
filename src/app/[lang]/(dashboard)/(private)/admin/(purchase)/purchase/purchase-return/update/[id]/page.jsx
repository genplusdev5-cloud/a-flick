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
  FormControlLabel,
  Checkbox
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
import { getPurchaseReturnDetails, updatePurchaseReturn } from '@/api/purchase/purchase_return'
import { getPurchaseFilters } from '@/api/purchase/purchase_order/filter'
import { getChemicalsList } from '@/api/master/chemicals/list'

import { getMaterialRequestDropdowns } from '@/api/transfer/materialRequest/dropdown'
import { getVehicleDropdown } from '@/api/purchase/vehicle/dropdown'
import { showToast } from '@/components/common/Toasts'

const EditPurchaseReturnPage = () => {
  const router = useRouter()
  const params = useParams()
  const { lang, id } = params
  const searchParams = useSearchParams()
  const type = searchParams.get('type') || 'tm'
  const decodedId = useMemo(() => {
    if (!id) return null

    try {
      const urlDecoded = decodeURIComponent(id)
      return Number(atob(urlDecoded))
    } catch (e) {
      try {
        const fixed = id.replace(/-/g, '+').replace(/_/g, '/')
        return Number(atob(fixed))
      } catch {
        return Number(id)
      }
    }
  }, [id])

  // Dropdown options
  const [originOptions, setOriginOptions] = useState([])
  const [supplierOptions, setSupplierOptions] = useState([])
  const [purchaseInwardOptions, setPurchaseInwardOptions] = useState([])
  const [chemicalOptions, setChemicalOptions] = useState([])
  const [uomOptions, setUomOptions] = useState([])
  const [vehicleOptions, setVehicleOptions] = useState([])

  // Loading states
  const [initLoading, setInitLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  // Header fields
  const [origin, setOrigin] = useState(null)
  const [returnDate, setReturnDate] = useState(new Date())

  const [supplier, setSupplier] = useState(null)
  const [purchaseInward, setPurchaseInward] = useState(null)
  const [vehicle, setVehicle] = useState(null)
  const [remarks, setRemarks] = useState('')
  const [details, setDetails] = useState({})

  // Item entry fields
  const [chemical, setChemical] = useState(null)
  const [uom, setUom] = useState(null)
  const [quantity, setQuantity] = useState('')
  // ✅ Rate & FOC
  const [rate, setRate] = useState('')
  const [amount, setAmount] = useState('0')
  const [isFoc, setIsFoc] = useState(false)
  const [prevRate, setPrevRate] = useState('')

  const [editId, setEditId] = useState(null)

  const [items, setItems] = useState([])

  const PoDateInput = forwardRef(function PoDateInput(props, ref) {
    const { label, value, ...rest } = props

    return <CustomTextField fullWidth inputRef={ref} label={label} value={value} {...rest} />
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitLoading(true)

        const [purchaseRes, materialRes, detailsRes, vehicleRes] = await Promise.all([
          getPurchaseFilters(),
          getMaterialRequestDropdowns(),
          getPurchaseReturnDetails({ id: decodedId, type }),
          getVehicleDropdown()
        ])

        // Dropdowns
        const purchaseData = purchaseRes?.data?.data || {}

        const origins =
          purchaseData?.company?.name?.map(item => ({
            label: item.name,
            value: item.name,
            id: item.id
          })) || []

        const suppliers =
          purchaseData?.supplier?.name?.map(item => ({
            label: item.name,
            value: item.name,
            id: item.id
          })) || []

        setOriginOptions(origins)
        setSupplierOptions(suppliers)

        const materialData = materialRes?.data || materialRes

        // Chemicals (Fetching from Master to get Rates)
        let chemRaw = []
        try {
          const chemRes = await getChemicalsList({ page_size: 1000 })
          if (chemRes?.success && Array.isArray(chemRes?.data?.results)) {
            chemRaw = chemRes.data.results
          }
        } catch (e) {
          console.error('Failed to fetch master chemicals', e)
          if (Array.isArray(purchaseData?.chemicals)) {
            chemRaw = purchaseData.chemicals
          }
        }

        setChemicalOptions(
          chemRaw.map(c => ({
            label: c.name,
            value: c.name,
            id: c.id,
            uom: c.store_uom || c.uom || c.uom_name || c.unit,
            rate: c.unit_rate || c.rate || c.price || 0,
            isFoc: c.is_foc || Number(c.unit_rate || c.rate || 0) === 0
          })) || []
        )

        setUomOptions(
          materialData?.uom?.name?.map(u => ({
            label: u.name,
            value: u.name,
            id: u.id
          })) || []
        )

        const vehicles =
          vehicleRes?.vehicle?.map(v => ({
            label: v.vehicle_name || v.name,
            value: v.id,
            id: v.id
          })) || []

        setVehicleOptions(vehicles)

        // 🔥 Purchase Inward Details
        let details = {}
        if (detailsRes?.return_items || detailsRes?.items) {
          details = detailsRes
        } else if (detailsRes?.data?.return_items || detailsRes?.data?.items) {
          details = detailsRes.data
        } else {
          details = detailsRes?.data?.data || detailsRes?.data || detailsRes || {}
        }
        setDetails(details)

        setReturnDate(
          details.pr_date || details.return_date ? parseISO(details.pr_date || details.return_date) : new Date()
        )

        setRemarks(details.remarks || '')

        if (details.company_id) {
          const o = origins.find(x => x.id == details.company_id)
          if (o) setOrigin(o)
        }

        if (details.supplier_id) {
          const s = suppliers.find(x => x.id == details.supplier_id)
          if (s) setSupplier(s)
        }

        if (details.pi_id || details.po_id) {
          setPurchaseInward({
            label: String(details.num_series || details.pi_number || details.po_number || 'Loading...'),
            id: details.pi_id || details.po_id
          })
        }

        if (details.vehicle_id) {
          setVehicle(
            vehicles.find(x => x.id == details.vehicle_id) || {
              label: details.vehicle_name || 'Vehicle',
              id: details.vehicle_id
            }
          )
        }

        // 🔥 Inward items
        const returnItems = details.return_items || details.items || []

        setItems(
          returnItems.map(item => ({
            id: item.id,
            chemical: item.chemical_name || item.item_name || item.chemical?.name || '',
            chemicalId: item.chemical_id || item.item_id || item.chemical?.id,
            uom: item.uom_name || item.uom?.name || item.uom_details?.name || item.uom,
            uomId: item.uom_id || item.uom?.id || item.uom_details?.id,
            quantity: item.return_quantity || item.quantity,
            poId: item.po_id // Preserve existing PO ID
          }))
        )
      } catch (err) {
        console.error(err)
        showToast('error', 'Failed to load purchase return data')
      } finally {
        setInitLoading(false)
      }
    }

    if (decodedId && !isNaN(decodedId)) {
      fetchData()
    }
  }, [decodedId])

  // ✅ AMOUNT CALCULATION
  useEffect(() => {
    const qty = Number(quantity) || 0
    const r = Number(rate) || 0
    setAmount((qty * r).toFixed(2))
  }, [quantity, rate])

  useEffect(() => {
    const fetchPIs = async () => {
      if (supplier?.id) {
        try {
          const res = await getPurchaseFilters({ supplier_id: supplier.id })
          const purchaseData = res?.data?.data || res?.data || {}

          // Update: Map pi_number for options
          const rawPIs = purchaseData?.pi_number?.pi_number || []

          const pis = rawPIs.map(item => ({
            label: String(item.pi_number || item.name || 'Unknown'),
            value: item.id,
            id: item.id
          }))

          setPurchaseInwardOptions(pis)

          // Sync the selected PI label if we had a skeleton
          if (purchaseInward?.id) {
            const matchingPI = pis.find(p => p.id === purchaseInward.id)
            if (matchingPI) setPurchaseInward(matchingPI)
          }
        } catch (err) {
          console.error('Failed to fetch PIs', err)
          setPurchaseInwardOptions([])
        }
      } else {
        setPurchaseInwardOptions([])
        if (!initLoading) setPurchaseInward(null)
      }
    }

    if (supplier && !initLoading) {
      fetchPIs()
    }
  }, [supplier, initLoading])

  const handleEditItem = row => {
    setEditId(row.id)
    setChemical({ label: row.chemical, id: row.chemicalId })
    setUom({ label: row.uom, id: row.uomId })
    setQuantity(row.quantity)
    setRate(row.rate || '0')
    setPrevRate(row.prevRate || row.rate)
    setIsFoc(row.isFoc)
  }

  const handleFocChange = checked => {
    setIsFoc(checked)
    if (checked) {
      setPrevRate(rate)
      setRate('0')
    } else {
      setRate(prevRate || '0')
    }
  }

  // Rate/Amount calculation removed

  const handleAddItem = () => {
    if (!chemical || !uom || !quantity) {
      showToast('error', 'Please fill all chemical fields')
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
                amount,
                isFoc,
                prevRate
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
          amount,
          isFoc,
          prevRate
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
    if (!origin || !returnDate || !supplier || items.length === 0) {
      showToast('warning', 'Please fill all required fields and add at least one chemical')
      return
    }

    try {
      setSaveLoading(true)
      const payload = {
        company_id: origin.id,
        return_date: format(returnDate, 'yyyy-MM-dd'),
        supplier_id: supplier.id,
        po_id: purchaseInward?.id || null, // Keeping po_id for compatibility or update
        purchase_order_id: items[0]?.poId || purchaseInward?.id || null,
        pi_id: purchaseInward?.id || null, // Explicit PI ID
        vehicle_id: vehicle?.id || null,
        remarks,
        return_items_input: items.map(item => ({
          id: String(item.id).length > 10 ? null : item.id,
          chemical_id: item.chemicalId,
          item_id: item.chemicalId,
          item_name: item.chemical,
          uom_id: item.uomId,
          uom: item.uom,
          po_id: item.poId || purchaseInward?.id || null, // Use preserved Item PO ID or fallback
          return_quantity: Number(item.quantity),
          quantity: Number(item.quantity),
          unit_rate: Number(item.rate) || 0,
          is_foc: item.isFoc ? 1 : 0,
          status: 1,
          is_active: 1
        }))
      }

      await updatePurchaseReturn({ id: decodedId, payload })

      showToast('success', 'Purchase Return updated successfully')

      router.push(`/${lang}/admin/purchase/purchase-return`)
    } catch (err) {
      console.error('Failed to update Purchase Return', err)
      showToast('error', 'Failed to update Purchase Return')
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
          <Link href={`/${lang}/admin/purchase/purchase-return`}>Purchase Return</Link>

          <Typography color='text.primary'>Edit</Typography>
        </Breadcrumbs>
      }
    >
      <Card>
        <CardHeader title={<Typography variant='h5'>Update Purchase Return</Typography>} />

        <Divider />

        {/* HEADER FORM */}
        <Box px={4} py={3} position='relative'>
          <Grid container spacing={3}>
            {/* 🔹 ROW 1 – Return Date + Origin */}
            <Grid item xs={12} md={4}>
              <AppReactDatepicker
                selected={returnDate}
                onChange={date => setReturnDate(date)}
                customInput={
                  <PoDateInput label='Return Date' value={returnDate ? format(returnDate, 'dd/MM/yyyy') : ''} />
                }
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete label='Origin' options={originOptions} value={origin} onChange={setOrigin} />
            </Grid>

            {/* spacer to maintain grid */}
            <Grid item xs={12} md={4} />

            {/* 🔹 ROW 2 – Supplier + PI + Vehicle */}
            <Grid item xs={12} md={4}>
              <GlobalTextField
                label='Supplier'
                value={supplier?.label || ''}
                fullWidth
                InputProps={{ readOnly: true }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='Purchase Inward No'
                options={purchaseInwardOptions}
                value={purchaseInward}
                onChange={setPurchaseInward}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='Vehicle/Warehouse'
                options={vehicleOptions}
                value={vehicle}
                onChange={setVehicle}
              />
            </Grid>

            {/* 🔹 Remarks – full width */}
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
          <Grid container spacing={3} alignItems='flex-end'>
            {/* First Row: Chemical + UOM + Quantity */}
            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='Chemical'
                options={chemicalOptions}
                value={chemical}
                onChange={val => {
                  setChemical(val)
                  if (val) {
                    const matchingUom = uomOptions.find(u => u.label === val.uom || u.value === val.uom)
                    if (matchingUom) {
                      setUom(matchingUom)
                    } else if (val.uom) {
                      setUom({ label: val.uom, value: val.uom, id: val.uom_id })
                    }
                  } else {
                    setUom(null)
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='Store UOM'
                options={uomOptions}
                value={uom}
                onChange={setUom}
                readOnly
                disabled
                sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#f5f5f5' } }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalTextField
                label='Quantity'
                type='number'
                value={quantity || ''}
                onChange={e => setQuantity(e.target.value)}
              />
            </Grid>

            {/* Second Row: Rate & FOC + Amount + Add Button */}
            <Grid item xs={12} md={4}>
              <Box display='flex' flexDirection='column'>
                <FormControlLabel
                  control={<Checkbox checked={isFoc} onChange={e => handleFocChange(e.target.checked)} size='small' />}
                  label='Rate [ FOC ]'
                  sx={{ mb: -0.5, '& .MuiTypography-root': { fontSize: '0.75rem' } }}
                />
                <GlobalTextField
                  placeholder='0.00'
                  type='number'
                  value={rate}
                  onChange={e => setRate(e.target.value)}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalTextField
                label='Amount'
                value={amount}
                InputProps={{ readOnly: true }}
                disabled
                sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#f5f5f5' } }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalButton
                fullWidth
                variant='contained'
                color={editId ? 'info' : 'primary'}
                startIcon={editId ? <EditIcon /> : <AddIcon />}
                onClick={handleAddItem}
                sx={{ height: 40 }}
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
                  <th style={{ width: '50px', minWidth: '50px' }}>S.NO</th>
                  <th align='center' style={{ width: '80px' }}>
                    Action
                  </th>
                  <th style={{ width: '50%' }}>Chemical</th>
                  <th align='left' style={{ width: '15%', textAlign: 'left' }}>
                    STORE UOM
                  </th>
                  <th align='left' style={{ width: '15%', textAlign: 'left' }}>
                    Quantity
                  </th>
                  <th align='right' style={{ width: '10%', textAlign: 'right' }}>
                    Rate
                  </th>
                  <th align='right' style={{ width: '12%', textAlign: 'right' }}>
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody>
                {items.length ? (
                  items.map((row, i) => (
                    <tr key={row.id}>
                      <td>{i + 1}</td>
                      <td align='center'>
                        <IconButton size='small' color='primary' onClick={() => handleEditItem(row)}>
                          <EditIcon fontSize='small' />
                        </IconButton>
                        <IconButton size='small' color='error' onClick={() => handleRemoveItem(row.id)}>
                          <DeleteIcon fontSize='small' />
                        </IconButton>
                      </td>
                      <td>{row.chemical}</td>
                      <td align='left' style={{ textAlign: 'left' }}>
                        {row.uom}
                      </td>
                      <td align='left' style={{ textAlign: 'left' }}>
                        {row.quantity}
                      </td>
                      <td align='right' style={{ textAlign: 'right' }}>
                        {row.rate || '0.00'}
                      </td>
                      <td align='right' style={{ textAlign: 'right' }}>
                        {row.amount || '0.00'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 24 }}>
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
          <GlobalButton color='secondary' onClick={() => router.push(`/${lang}/admin/purchase/purchase-return`)}>
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

export default function EditPurchaseReturnWrapper() {
  return (
    <PermissionGuard permission='Purchase Return'>
      <EditPurchaseReturnPage />
    </PermissionGuard>
  )
}
