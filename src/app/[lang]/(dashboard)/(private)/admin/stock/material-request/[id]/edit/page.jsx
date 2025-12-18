'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Autocomplete,
  IconButton
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { getMaterialRequestById, updateMaterialRequest } from '@/api/materialRequest/edit'
import { getMaterialRequestDropdowns } from '@/api/materialRequest/dropdown'
import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import { showToast } from '@/components/common/Toasts' // Toast imported

// Helper: Required label with red *
const requiredLabel = label => (
  <>
    {label} <span style={{ color: 'red' }}>*</span>
  </>
)

// Format date for API (YYYY-MM-DD)
const formatApiDate = date => (date ? date.toLocaleDateString('en-CA') : '')

export default function EditMaterialRequestPage() {
  const router = useRouter()
  const params = useParams()
  const [date, setDate] = useState(new Date())

  // Form header state
  const [formData, setFormData] = useState({
    requestType: '',
    requestedById: null,
    requestedBy: '',
    fromLocation: '',
    toLocation: '',
    remarks: '',
    chemical: '',
    unit: '',
    quantity: '',
    approvedStatus: 'Pending',
    issuedStatus: 'Not Issued',
    completedStatus: 'No',
    status: 'Waiting'
  })

  const [items, setItems] = useState([])
  const [itemToEditIndex, setItemToEditIndex] = useState(null)

  // Dropdown data
  const [dropdowns, setDropdowns] = useState({
    employees: [],
    chemicals: [],
    uoms: [],
    suppliers: []
  })

  // Refs for auto-focus jump
  const requestTypeRef = useRef(null)
  const requestedByRef = useRef(null)
  const fromLocationRef = useRef(null)
  const toLocationRef = useRef(null)
  const chemicalRef = useRef(null)
  const unitRef = useRef(null)
  const quantityRef = useRef(null)

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const decodedId = atob(params.id)

        // Load dropdowns
        const ddRes = await getMaterialRequestDropdowns()
        const dd = ddRes?.data || ddRes || {}

        const employees = Array.isArray(dd.employee?.name) ? dd.employee.name : []
        const chemicals = Array.isArray(dd.chemicals?.name) ? dd.chemicals.name : []
        const uoms = Array.isArray(dd.uom?.name) ? dd.uom.name : []
        const suppliers = Array.isArray(dd.supplier?.name) ? dd.supplier.name : []

        setDropdowns({ employees, chemicals, uoms, suppliers })

        // Load material request
        const res = await getMaterialRequestById(decodedId)
        const data = res?.data

        if (!data) {
          showToast('Request not found!', 'error')
          router.push('/admin/stock/material-request')
          return
        }

        // Set date
        if (data.request_date) setDate(new Date(data.request_date))

        // Find employee name
        const employee = employees.find(e => e.id === data.employee_id)

        // Set header
        setFormData(prev => ({
          ...prev,
          requestType: data.request_type || '',
          requestedBy: employee?.name || '',
          requestedById: data.employee_id || null,
          fromLocation: data.from_location || '',
          toLocation: data.to_location || '',
          approvedStatus: data.request_status || 'Pending',
          issuedStatus: data.is_approved ? 'Issued' : 'Not Issued',
          completedStatus: data.is_completed ? 'Yes' : 'No',
          status: data.request_status || 'Waiting'
        }))

        // Map items
        const loadedItems = (data.items || []).map(item => ({
          id: item.id,
          requestDate: data.request_date,
          requestType: data.request_type,
          requestedBy: employee?.name || '',
          fromLocation: data.from_location,
          toLocation: data.to_location,
          remarks: item.remarks || '',
          chemical: item.item_name,
          unit: item.uom,
          quantity: item.quantity,
          approvedStatus: data.request_status || 'Pending',
          issuedStatus: data.is_approved ? 'Issued' : 'Not Issued',
          completedStatus: data.is_completed ? 'Yes' : 'No',
          status: data.request_status || 'Waiting'
        }))

        setItems(loadedItems)
      } catch (err) {
        console.error(err)
        showToast('Failed to load request data', 'error')
      }
    }

    if (params.id) loadData()
  }, [params.id, router])

  // Handle input change
  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Add or Update Item
  const handleAddOrUpdateItem = () => {
    const { requestType, requestedBy, fromLocation, toLocation, chemical, unit, quantity, remarks } = formData

    if (!requestType || !requestedBy || !fromLocation || !toLocation || !chemical || !unit || !quantity) {
      showToast('Please fill all required fields', 'warning')
      return
    }

    const newItem = {
      id: itemToEditIndex !== null ? items[itemToEditIndex].id : `temp-${Date.now()}`,
      requestDate: formatApiDate(date),
      requestType,
      requestedBy,
      fromLocation,
      toLocation,
      remarks,
      chemical,
      unit,
      quantity: Number(quantity),
      approvedStatus: formData.approvedStatus,
      issuedStatus: formData.issuedStatus,
      completedStatus: formData.completedStatus,
      status: formData.status
    }

    if (itemToEditIndex !== null) {
      setItems(prev => prev.map((it, i) => (i === itemToEditIndex ? newItem : it)))
      setItemToEditIndex(null)
      showToast('Item updated successfully', 'success')
    } else {
      setItems(prev => [...prev, newItem])
      showToast('Item added successfully', 'success')
    }

    // Reset item fields only
    setFormData(prev => ({
      ...prev,
      remarks: '',
      chemical: '',
      unit: '',
      quantity: ''
    }))
  }

  // Edit item
  const handleEditItem = index => {
    const item = items[index]
    setFormData({
      ...formData,
      remarks: item.remarks,
      chemical: item.chemical,
      unit: item.unit,
      quantity: String(item.quantity),
      approvedStatus: item.approvedStatus,
      issuedStatus: item.issuedStatus,
      completedStatus: item.completedStatus,
      status: item.status
    })
    setItemToEditIndex(index)
    chemicalRef.current?.focus()
  }

  // Delete item
  const handleDeleteItem = index => {
    setItems(prev => prev.filter((_, i) => i !== index))
    if (itemToEditIndex === index) {
      setItemToEditIndex(null)
      setFormData(prev => ({ ...prev, remarks: '', chemical: '', unit: '', quantity: '' }))
    }
    showToast('Item deleted', 'success')
  }

  // Final Update
  const handleUpdate = async () => {
    if (items.length === 0) {
      showToast('Add at least one item', 'warning')
      return
    }

    try {
      const decodedId = atob(params.id)
      const payload = {
        id: Number(decodedId),
        request_date: formatApiDate(date),
        request_type: formData.requestType,
        requested_by: formData.requestedById,
        from_location: formData.fromLocation,
        to_location: formData.toLocation,
        items: items.map(i => ({
          id: String(i.id).startsWith('temp') ? null : i.id,
          item_name: i.chemical,
          uom: i.unit,
          quantity: i.quantity,
          remarks: i.remarks
        }))
      }

      await updateMaterialRequest(payload)
      showToast('Material Request updated successfully!', 'success')
      router.push('/admin/stock/material-request')
    } catch (err) {
      console.error(err)
      showToast('Update failed', 'error')
    }
  }

  return (
    <ContentLayout
      title='Edit Material Request'
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Material Request', href: '/admin/stock/material-request' },
        { label: 'Edit Request' }
      ]}
    >
      <Card elevation={0}>
        <Typography variant='h6' align='center' sx={{ py: 3 }}>
          Edit Material Request
        </Typography>
        <CardContent>
          {/* Header Fields */}
          <Grid container spacing={4} mb={4}>
            <Grid item xs={12} md={4}>
              <AppReactDatepicker
                selected={date}
                onChange={setDate}
                customInput={<CustomTextField fullWidth label={requiredLabel('Request Date')} />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={['Material Request', 'Material Return', 'Opening Stock']}
                value={formData.requestType}
                onChange={(e, v) => handleChange('requestType', v || '')}
                renderInput={params => (
                  <CustomTextField {...params} label={requiredLabel('Request Type')} inputRef={requestTypeRef} />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={dropdowns.employees}
                getOptionLabel={opt => opt?.name || ''}
                value={dropdowns.employees.find(e => e.id === formData.requestedById) || null}
                onChange={(e, v) => {
                  handleChange('requestedBy', v?.name || '')
                  handleChange('requestedById', v?.id || null)
                }}
                renderInput={params => (
                  <CustomTextField {...params} label={requiredLabel('Requested By')} inputRef={requestedByRef} />
                )}
              />
            </Grid>
          </Grid>

          <Grid container spacing={4} mb={4}>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={dropdowns.suppliers.map(s => s.name)}
                value={formData.fromLocation}
                onChange={(e, v) => handleChange('fromLocation', v || '')}
                renderInput={params => (
                  <CustomTextField {...params} label={requiredLabel('From Location')} inputRef={fromLocationRef} />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={dropdowns.suppliers.map(s => s.name)}
                value={formData.toLocation}
                onChange={(e, v) => handleChange('toLocation', v || '')}
                renderInput={params => (
                  <CustomTextField {...params} label={requiredLabel('To Location')} inputRef={toLocationRef} />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <CustomTextField
                fullWidth
                multiline
                rows={2}
                label='Remarks (Item Level)'
                value={formData.remarks}
                onChange={e => handleChange('remarks', e.target.value)}
              />
            </Grid>
          </Grid>

          <Box my={4} sx={{ borderTop: '1px solid #ddd' }} />

          {/* Item Entry */}
          <Typography variant='subtitle1' gutterBottom>
            Item Details
          </Typography>
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} md={3}>
              <Autocomplete
                options={dropdowns.chemicals}
                getOptionLabel={o => o?.name || ''}
                value={dropdowns.chemicals.find(c => c.name === formData.chemical) || null}
                onChange={(e, v) => handleChange('chemical', v?.name || '')}
                renderInput={params => (
                  <CustomTextField {...params} label={requiredLabel('Chemical')} inputRef={chemicalRef} />
                )}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Autocomplete
                options={dropdowns.uoms}
                getOptionLabel={o => o?.name || ''}
                value={dropdowns.uoms.find(u => u.name === formData.unit) || null}
                onChange={(e, v) => handleChange('unit', v?.name || '')}
                renderInput={params => <CustomTextField {...params} label={requiredLabel('Unit')} inputRef={unitRef} />}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <CustomTextField
                label={requiredLabel('Quantity')}
                value={formData.quantity}
                onChange={e => handleChange('quantity', e.target.value.replace(/[^0-9]/g, ''))}
                inputRef={quantityRef}
              />
            </Grid>
            <Grid item xs={12} md={5} display='flex' alignItems='end'>
              <Button variant='contained' fullWidth onClick={handleAddOrUpdateItem}>
                {itemToEditIndex !== null ? 'Update Item' : '+ Addisko Item'}
              </Button>
            </Grid>
          </Grid>

          {/* Items Table */}
          <Box sx={{ overflowX: 'auto', mt: 4 }}>
            <Table sx={{ minWidth: 1600 }}>
              <TableHead>
                <TableRow>
                  <TableCell>S.No</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Chemical</TableCell>
                  <TableCell>Qty</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align='center'>
                      No items added
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        <IconButton size='small' color='primary' onClick={() => handleEditItem(idx)}>
                          <i className='tabler-edit' />
                        </IconButton>
                        <IconButton size='small' onClick={() => handleDeleteItem(idx)}>
                          <i className='tabler-trash text-red-600 text-lg' />
                        </IconButton>
                      </TableCell>
                      <TableCell>{item.chemical}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{item.remarks || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>

          {/* Footer */}
          <Box mt={6} display='flex' justifyContent='flex-end' gap={2}>
            <Button variant='outlined' onClick={() => router.push('/admin/stock/material-request')}>
              Cancel
            </Button>
            <Button variant='contained' onClick={handleUpdate}>
              Update Request
            </Button>
          </Box>
        </CardContent>
      </Card>
    </ContentLayout>
  )
}
