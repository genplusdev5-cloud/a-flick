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
  MenuItem,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Breadcrumbs,
  CircularProgress,
  FormControlLabel,
  Checkbox
} from '@mui/material'

import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { getPurchaseFilters, getPurchaseInwardList, getPurchaseInwardDetails } from '@/api/purchase/purchase_inward'
import { addPurchaseReturn } from '@/api/purchase/purchase_return'
import { getChemicalsList } from '@/api/master/chemicals/list'

import StickyListLayout from '@/components/common/StickyListLayout'
import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import PermissionGuard from '@/components/auth/PermissionGuard'

import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import styles from '@core/styles/table.module.css'
import { getMaterialRequestDropdowns } from '@/api/transfer/materialRequest/dropdown'
import { showToast } from '@/components/common/Toasts'

import { format } from 'date-fns'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import CustomTextField from '@core/components/mui/TextField'

const AddPurchaseReturnPage = () => {
  const router = useRouter()
  const { lang } = useParams()

  // Dropdown options
  const [originOptions, setOriginOptions] = useState([])
  const [supplierOptions, setSupplierOptions] = useState([])
  const [chemicalOptions, setChemicalOptions] = useState([])
  const [uomOptions, setUomOptions] = useState([])
  const [vehicleOptions, setVehicleOptions] = useState([])

  const [purchaseInwardOptions, setPurchaseInwardOptions] = useState([])
  const [purchaseInward, setPurchaseInward] = useState(null)

  // Loading states
  const [initLoading, setInitLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  // Header fields
  const [origin, setOrigin] = useState(null)
  const [returnDate, setReturnDate] = useState(new Date())

  const [supplier, setSupplier] = useState(null)
  const [vehicle, setVehicle] = useState(null)
  const [remarks, setRemarks] = useState('')

  // Item fields
  const [chemical, setChemical] = useState(null)
  const [uom, setUom] = useState(null)

  // ✅ NEW FIELDS matching Purchase Inward
  const [in_quantity, setInQuantity] = useState('')
  const [conversion, setConversion] = useState('')
  const [quantity, setQuantity] = useState('') // Auto-calculated usually
  const [additional, setAdditional] = useState('')
  const [total_quantity, setTotalQuantity] = useState('') // Auto-calculated

  // ✅ Rate & FOC
  const [rate, setRate] = useState('')
  const [amount, setAmount] = useState('0')
  const [isFoc, setIsFoc] = useState(false)
  const [prevRate, setPrevRate] = useState('')

  const [editId, setEditId] = useState(null)

  // Items list
  const [items, setItems] = useState([])

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setInitLoading(true)

        const [purchaseRes, materialRes] = await Promise.all([getPurchaseFilters(), getMaterialRequestDropdowns()])

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

        const materialData = materialRes?.data || materialRes

        // 3. Chemicals (Fetching from Master to get Rates)
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

        const chemicals = chemRaw.map(c => ({
          label: c.name,
          value: c.name,
          id: c.id,
          uom: c.store_uom || c.uom || c.uom_name || c.unit,
          rate: c.unit_rate || c.rate || c.price || 0,
          isFoc: c.is_foc || Number(c.unit_rate || c.rate || 0) === 0
        }))

        const uoms =
          materialData?.uom?.name?.map(u => ({
            label: u.name,
            value: u.name,
            id: u.id
          })) || []

        setOriginOptions(origins)
        setSupplierOptions(suppliers)
        setChemicalOptions(chemicals)
        setUomOptions(uoms)

        const vehicles =
          materialData?.employee?.name?.map(e => ({
            label: e.name,
            value: e.id,
            id: e.id
          })) || []

        setVehicleOptions(vehicles)

        if (origins.length > 0) {
          setOrigin(origins[0])
        }
      } catch (err) {
        console.error('Failed to fetch dropdowns', err)
        showToast('error', 'Failed to load dropdown data')
      } finally {
        setInitLoading(false)
      }
    }

    fetchOptions()
  }, [])

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
        } catch (err) {
          console.error('Failed to fetch PIs', err)
          setPurchaseInwardOptions([])
        }
      } else {
        setPurchaseInwardOptions([])
        setPurchaseInward(null)
      }
    }

    if (!initLoading) {
      fetchPIs()
    }
  }, [supplier, initLoading])

  // ✅ CALCULATIONS similar to Inward
  useEffect(() => {
    const q = Number(in_quantity) || 0
    const c = Number(conversion) || 0
    const qty = q && c ? q * c : 0
    setQuantity(qty)

    const add = Number(additional) || 0
    setTotalQuantity(qty + add)
  }, [in_quantity, conversion, additional])

  // ✅ FETCH INWARD ITEMS WHEN PI IS SELECTED
  useEffect(() => {
    const fetchInwardItems = async () => {
      if (!purchaseInward?.id) return

      try {
        setInitLoading(true)

        // Directly fetch details for the selected Purchase Inward
        const detailRes = await getPurchaseInwardDetails({ id: purchaseInward.id })
        const inwardData = detailRes?.data || detailRes

        if (inwardData?.inward_items?.length) {
          const mappedItems = inwardData.inward_items.map((item, index) => ({
            id: Date.now() + index,
            chemical: item.item_name,
            chemicalId: item.item_id,
            uom: item.store_uom || item.uom,
            uomId: item.uom_id,

            // Map Inward Fields
            in_quantity: item.in_quantity || 0,
            conversion: item.conversion || 1,
            quantity: item.quantity,
            additional: item.additional || 0,
            total_quantity: item.total_quantity || item.quantity,

            // Reference
            inward_item_id: item.id,
            po_item_id: item.po_item_id,

            // Helpful ref if we need the global PO ID later
            po_id: item.po_id || inwardData.po_id
          }))

          setItems(mappedItems)
          showToast('success', 'Items populated from Purchase Inward')
        } else {
          showToast('warning', 'No items found in this Purchase Inward')
        }
      } catch (err) {
        console.error('Failed to fetch Inward details', err)
        showToast('error', 'Failed to fetch Purchase Inward details')
      } finally {
        setInitLoading(false)
      }
    }

    fetchInwardItems()
  }, [purchaseInward])

  const handleEditItem = row => {
    setEditId(row.id)
    setChemical({ label: row.chemical, id: row.chemicalId })
    setUom({ label: row.uom, id: row.uomId })
    setInQuantity(row.in_quantity || '')
    setConversion(row.conversion || '')
    setAdditional(row.additional || '')
    setRate(row.rate || '0')
    setPrevRate(row.prevRate || row.rate)
    setIsFoc(row.isFoc)
  }

  const PoDateInput = forwardRef(function PoDateInput(props, ref) {
    const { label, value, ...rest } = props

    return <CustomTextField fullWidth inputRef={ref} label={label} value={value} {...rest} />
  })

  const handleAddItem = () => {
    if (!chemical || !uom || !quantity) {
      showToast('error', 'Please fill Chemical, UOM and Quantity')
      return
    }

    const newItem = {
      chemical: chemical.label,
      chemicalId: chemical.id,
      uom: uom.label,
      uomId: uom.id,
      quantity: Number(quantity)
    }

    if (editId) {
      setItems(prev =>
        prev.map(item =>
          item.id === editId
            ? {
                ...item,
                ...newItem,
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
          ...newItem,
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

  const handleSave = async () => {
    if (!origin || !returnDate || !supplier || items.length === 0) {
      showToast('warning', 'Please fill all required fields and add at least one chemical')
      return
    }

    try {
      setSaveLoading(true)

      const payload = {
        company_id: origin.id,
        return_date: format(returnDate, 'yyyy-MM-dd'),
        inward_date: format(returnDate, 'yyyy-MM-dd'), // Fallback
        supplier_id: supplier.id,
        po_id: purchaseInward?.id || null, // Keeping po_id key but sending PI ID if backend treats it generically, or relying on item level po_id
        purchase_order_id: items[0]?.po_id || null, // Try to find linked PO ID from items
        pi_id: purchaseInward?.id || null, // Explicit PI ID
        vehicle_id: vehicle?.id || null,
        remarks,
        // Send as return_items_input with robust field mapping
        return_items_input: items.map(item => ({
          chemical_id: item.chemicalId,
          item_id: item.chemicalId,
          item_name: item.chemical,
          uom_id: item.uomId,
          uom: item.uom,
          po_id: item.po_id || null, // Use stored PO ID
          po_item_id: item.po_item_id || null,
          inward_item_id: item.inward_item_id || null, // Link to original Inward item

          return_quantity: Number(item.total_quantity), // Main qty is total
          quantity: Number(item.quantity),

          // New Fields
          in_quantity: Number(item.in_quantity),
          conversion: Number(item.conversion),
          additional: Number(item.additional),
          total_quantity: Number(item.total_quantity),

          status: 1,
          is_active: 1
        }))
      }

      await addPurchaseReturn(payload)

      showToast('success', 'Purchase Return added successfully')
      router.push(`/${lang}/admin/purchase/purchase-return`)
    } catch (err) {
      console.error('Failed to save Purchase Inward', err)
      showToast('error', err?.response?.data?.message || 'Failed to save Purchase Inward')
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
          <Typography color='text.primary'>Add</Typography>
        </Breadcrumbs>
      }
    >
      <Card>
        <CardHeader
          title={
            <Typography variant='h5' fontWeight={600}>
              Add Purchase Return
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
            {/* 🔹 ROW 1 – Return Date + Origin */}
            <Grid item xs={12} md={4}>
              <AppReactDatepicker
                selected={returnDate}
                onChange={date => setReturnDate(date)}
                dateFormat='dd/MM/yyyy'
                customInput={
                  <PoDateInput label='Return Date' value={returnDate ? format(returnDate, 'dd/MM/yyyy') : ''} />
                }
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete label='Origin' options={originOptions} value={origin} onChange={setOrigin} />
            </Grid>

            {/* spacer for clean 3-column grid */}
            <Grid item xs={12} md={4} />

            {/* 🔹 ROW 2 – Supplier + PI + Vehicle */}
            <Grid item xs={12} md={4}>
              <GlobalAutocomplete label='Suppliers' options={supplierOptions} value={supplier} onChange={setSupplier} />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='Purchase Inward No'
                options={purchaseInwardOptions}
                value={purchaseInward}
                onChange={setPurchaseInward}
                placeholder='Select PI No'
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='Vehicle/Warehouse'
                options={vehicleOptions}
                value={vehicle}
                onChange={setVehicle}
                placeholder='Select Vehicle/Warehouse'
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
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <GlobalAutocomplete label='Chemicals' options={chemicalOptions} value={chemical} onChange={setChemical} />
            </Grid>

            <Grid item xs={12} md={3}>
              <GlobalAutocomplete label='Store UOM' options={uomOptions} value={uom} onChange={setUom} />
            </Grid>

            <Grid item xs={12} md={3}>
              <GlobalTextField
                label='Quantity'
                type='number'
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
              />
            </Grid>

            {/* Row 2: Rate & FOC */}
            <Grid item xs={12} md={3}>
              <Box display='flex' flexDirection='column'>
                <FormControlLabel
                  control={<Checkbox checked={isFoc} onChange={e => handleFocChange(e.target.checked)} size='small' />}
                  label='Rate [ FOC ]'
                  sx={{ mb: -1, '& .MuiTypography-root': { fontSize: '0.75rem' } }}
                />
                <GlobalTextField
                  placeholder='0.00'
                  type='number'
                  value={rate}
                  onChange={e => setRate(e.target.value)}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={3}>
              <GlobalTextField
                label='Amount'
                value={amount}
                InputProps={{ readOnly: true }}
                disabled
                sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#f5f5f5' } }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <GlobalButton
                fullWidth
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
                  <th style={{ width: '50px', minWidth: '50px' }}>S.NO</th>
                  <th align='center' style={{ width: '80px' }}>
                    ACTION
                  </th>
                  <th style={{ width: '50%' }}>CHEMICAL</th>
                  <th align='left' style={{ width: '15%', textAlign: 'left' }}>
                    STORE UOM
                  </th>

                  <th align='left' style={{ width: '15%', textAlign: 'left' }}>
                    QTY
                  </th>
                  <th align='right' style={{ width: '10%', textAlign: 'right' }}>
                    RATE
                  </th>
                  <th align='right' style={{ width: '12%', textAlign: 'right' }}>
                    AMOUNT
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
          <GlobalButton color='secondary' onClick={() => router.push(`/${lang}/admin/purchase/purchase-return`)}>
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

export default function AddPurchaseReturnWrapper() {
  return (
    <PermissionGuard permission='Purchase Return'>
      <AddPurchaseReturnPage />
    </PermissionGuard>
  )
}
