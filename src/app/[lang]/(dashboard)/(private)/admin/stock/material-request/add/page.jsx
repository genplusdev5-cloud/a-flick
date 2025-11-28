'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  IconButton,
  Autocomplete
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { format } from 'date-fns'

import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

import { addMaterialRequest } from '@/api/materialRequest/add'
import { getMaterialRequestDropdowns } from '@/api/materialRequest/dropdown'

export default function AddMaterialRequestPage() {
  const router = useRouter()

  const [date, setDate] = useState(new Date())
  const [formData, setFormData] = useState({
    requestType: '',
    requestedBy: '',
    requestedById: null,
    fromLocation: '',
    fromLocationId: null,
    toLocation: '',
    remarks: '',
    chemical: '',
    chemicalId: null,
    unit: '',
    unitId: null,
    quantity: ''
  })

  const [items, setItems] = useState([])
  const [itemToEditIndex, setItemToEditIndex] = useState(null)

  const [employeeList, setEmployeeList] = useState([])
  const [chemicalList, setChemicalList] = useState([])
  const [uomList, setUomList] = useState([])
  const [supplierList, setSupplierList] = useState([])

  const [requestTypeOpen, setRequestTypeOpen] = useState(false)
  const [requestedByOpen, setRequestedByOpen] = useState(false)
  const [fromLocationOpen, setFromLocationOpen] = useState(false)
  const [toLocationOpen, setToLocationOpen] = useState(false)
  const [chemicalOpen, setChemicalOpen] = useState(false)
  const [unitOpen, setUnitOpen] = useState(false)

  const requestTypeRef = useRef(null)
  const requestedByRef = useRef(null)
  const fromLocationRef = useRef(null)
  const toLocationRef = useRef(null)
  const remarksRef = useRef(null)
  const chemicalRef = useRef(null)
  const unitRef = useRef(null)
  const quantityInputRef = useRef(null)

  const focusElement = (ref, openSetter) => {
    setTimeout(() => {
      const input = ref.current?.querySelector('input') || ref.current
      if (input) {
        input.focus()
        if (openSetter) openSetter(true)
      }
    }, 0)
  }

  useEffect(() => {
    ;(async () => {
      try {
        const response = await getMaterialRequestDropdowns()
        const data = response.data || response

        setEmployeeList(data?.employee?.name || [])
        setChemicalList(data?.chemicals?.name || [])
        setUomList(data?.uom?.name || [])
        setSupplierList(data?.supplier?.name || [])
      } catch (err) {
        console.error('Dropdown load failed:', err)
      }
    })()
  }, [])

  const handleKeyDown = (e, currentRef) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const map = {
        [requestTypeRef.current]: () => focusElement(requestedByRef, setRequestedByOpen),
        [requestedByRef.current]: () => focusElement(fromLocationRef, setFromLocationOpen),
        [fromLocationRef.current]: () => focusElement(toLocationRef, setToLocationOpen),
        [toLocationRef.current]: () => focusElement(remarksRef),
        [remarksRef.current]: () => focusElement(chemicalRef, setChemicalOpen),
        [chemicalRef.current]: () => focusElement(unitRef, setUnitOpen),
        [unitRef.current]: () => focusElement(quantityInputRef),
        [quantityInputRef.current]: handleAddOrUpdateItem
      }
      const action = map[currentRef?.current || currentRef]
      if (action) action()
    }
  }

  const handleAddOrUpdateItem = () => {
    const { chemical, chemicalId, unit, unitId, quantity } = formData
    if (!chemical || !unit || !quantity) return

    const newItem = {
      id: Date.now() + Math.random(),
      requestDate: date.toISOString().split('T')[0],
      requestType: formData.requestType,
      requestedBy: formData.requestedBy,
      fromLocation: formData.fromLocation,
      toLocation: formData.toLocation,
      remarks: formData.remarks,
      chemical,
      chemicalId,
      unit,
      unitId,
      quantity
    }

    if (itemToEditIndex !== null) {
      setItems(prev => prev.map((it, i) => (i === itemToEditIndex ? { ...newItem, id: it.id } : it)))
      setItemToEditIndex(null)
    } else {
      setItems(prev => [newItem, ...prev])
    }

    setFormData(prev => ({ ...prev, chemical: '', chemicalId: null, unit: '', unitId: null, quantity: '' }))
    focusElement(chemicalRef, setChemicalOpen)
  }

  const handleEditItem = index => {
    const item = items[index]
    setFormData(prev => ({
      ...prev,
      chemical: item.chemical,
      chemicalId: item.chemicalId,
      unit: item.unit,
      unitId: item.unitId,
      quantity: item.quantity
    }))
    setItemToEditIndex(index)
    focusElement(chemicalRef, setChemicalOpen)
  }

  const handleDeleteItem = index => {
    setItems(prev => prev.filter((_, i) => i !== index))
    if (itemToEditIndex === index) setItemToEditIndex(null)
  }

  const handleSaveAll = async () => {
    if (items.length === 0) return

    const payload = {
      supervisor_id: 1,
      request_date: date.toISOString().split('T')[0],
      remarks: formData.remarks,
      items: items.map(i => ({
        item_name: i.chemical,
        uom: i.unit,
        quantity: Number(i.quantity)
      }))
    }

    try {
      await addMaterialRequest(payload)
      router.push('/admin/stock/material-request')
    } catch (err) {
      console.error('Save failed:', err)
    }
  }

  const requiredLabel = label => (
    <>
      {label} <span style={{ color: 'red' }}>*</span>
    </>
  )

  return (
    <ContentLayout
      title='Add Material Request'
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Material Request', href: '/admin/stock/material-request' },
        { label: 'Add Request' }
      ]}
    >
      <Card elevation={0} sx={{ boxShadow: 'none' }}>
        <Typography variant='h6' align='center' sx={{ py: 3 }}>
          Add Material Request
        </Typography>
        <CardContent>
          {/* Header Row */}
          <Grid container spacing={6} mb={3}>
            <Grid item xs={12} md={4}>
              <AppReactDatepicker
                selected={date}
                onChange={setDate}
                customInput={
                  <CustomTextField
                    fullWidth
                    label={requiredLabel('Request Date')}
                    value={format(date, 'dd/MM/yyyy')}
                    onKeyDown={e => handleKeyDown(e, requestTypeRef)}
                  />
                }
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Autocomplete
                options={['Material Request', 'Material Return', 'Opening Stock']}
                value={formData.requestType}
                onChange={(_, v) => {
                  setFormData(prev => ({ ...prev, requestType: v || '' }))
                  if (v) focusElement(requestedByRef, setRequestedByOpen)
                }}
                open={requestTypeOpen}
                onOpen={() => setRequestTypeOpen(true)}
                onClose={() => setRequestTypeOpen(false)}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    fullWidth
                    label={requiredLabel('Request Type')}
                    onKeyDown={e => handleKeyDown(e, requestTypeRef)}
                  />
                )}
                ref={requestTypeRef}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Autocomplete
                options={employeeList}
                value={employeeList.find(e => e.id === formData.requestedById) || null}
                onChange={(_, v) => {
                  setFormData(prev => ({
                    ...prev,
                    requestedBy: v?.name || '',
                    requestedById: v?.id || null
                  }))
                  if (v) focusElement(fromLocationRef, setFromLocationOpen)
                }}
                getOptionLabel={option => option.name || ''}
                getOptionKey={option => option.id}
                isOptionEqualToValue={(o, v) => o.id === v?.id}
                open={requestedByOpen}
                onOpen={() => setRequestedByOpen(true)}
                onClose={() => setRequestedByOpen(false)}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    fullWidth
                    label={requiredLabel('Requested By')}
                    onKeyDown={e => handleKeyDown(e, requestedByRef)}
                  />
                )}
                ref={requestedByRef}
              />
            </Grid>
          </Grid>

          {/* Second Row */}
          <Grid container spacing={6} mb={3}>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={supplierList}
                value={supplierList.find(s => s.id === formData.fromLocationId) || null}
                onChange={(_, v) => {
                  setFormData(prev => ({
                    ...prev,
                    fromLocation: v?.name || '',
                    fromLocationId: v?.id || null
                  }))
                  if (v) focusElement(toLocationRef, setToLocationOpen)
                }}
                getOptionLabel={option => option.name || ''}
                getOptionKey={option => option.id}
                isOptionEqualToValue={(o, v) => o.id === v?.id}
                open={fromLocationOpen}
                onOpen={() => setFromLocationOpen(true)}
                onClose={() => setFromLocationOpen(false)}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    fullWidth
                    label={requiredLabel('From Location/Supplier')}
                    onKeyDown={e => handleKeyDown(e, fromLocationRef)}
                  />
                )}
                ref={fromLocationRef}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Autocomplete
                options={supplierList}
                value={supplierList.find(s => s.id === formData.toLocationId) || null}
                onChange={(_, v) => {
                  setFormData(prev => ({ ...prev, toLocation: v?.name || '', toLocationId: v?.id || null }))
                  if (v) focusElement(remarksRef)
                }}
                getOptionLabel={option => option.name || ''}
                isOptionEqualToValue={(o, v) => o.id === v?.id}
                open={toLocationOpen}
                onOpen={() => setToLocationOpen(true)}
                onClose={() => setToLocationOpen(false)}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    fullWidth
                    label={requiredLabel('To Location/Supplier')}
                    onKeyDown={e => handleKeyDown(e, toLocationRef)}
                  />
                )}
                ref={toLocationRef}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <CustomTextField
                fullWidth
                multiline
                rows={2}
                label='Remarks'
                value={formData.remarks}
                onChange={e => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                onKeyDown={e => handleKeyDown(e, remarksRef)}
                ref={remarksRef}
              />
            </Grid>
          </Grid>

          <Box my={8} sx={{ borderTop: '1px solid #ddd', width: '100%' }} />

          {/* Items Input Row */}
          <Grid container spacing={6} mb={3}>
            <Grid item xs={12} md={3}>
              <Autocomplete
                options={chemicalList}
                value={chemicalList.find(c => c.id === formData.chemicalId) || null}
                onChange={(_, v) => {
                  setFormData(prev => ({
                    ...prev,
                    chemical: v?.name || '',
                    chemicalId: v?.id || null
                  }))
                  if (v) focusElement(unitRef, setUnitOpen)
                }}
                getOptionLabel={option => option.name || ''}
                getOptionKey={option => option.id}
                isOptionEqualToValue={(o, v) => o.id === v?.id}
                open={chemicalOpen}
                onOpen={() => setChemicalOpen(true)}
                onClose={() => setChemicalOpen(false)}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    fullWidth
                    label={requiredLabel('Chemicals')}
                    onKeyDown={e => handleKeyDown(e, chemicalRef)}
                  />
                )}
                ref={chemicalRef}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <Autocomplete
                options={uomList}
                value={uomList.find(u => u.id === formData.unitId) || null}
                onChange={(_, v) => {
                  setFormData(prev => ({
                    ...prev,
                    unit: v?.name || '',
                    unitId: v?.id || null
                  }))
                  if (v) focusElement(quantityInputRef)
                }}
                getOptionLabel={option => option.name || ''}
                getOptionKey={option => option.id}
                isOptionEqualToValue={(o, v) => o.id === v?.id}
                open={unitOpen}
                onOpen={() => setUnitOpen(true)}
                onClose={() => setUnitOpen(false)}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    fullWidth
                    label={requiredLabel('Unit')}
                    onKeyDown={e => handleKeyDown(e, unitRef)}
                  />
                )}
                ref={unitRef}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <CustomTextField
                fullWidth
                label={requiredLabel('Quantity')}
                value={formData.quantity}
                onChange={e => setFormData(prev => ({ ...prev, quantity: e.target.value.replace(/[^0-9]/g, '') }))}
                inputRef={quantityInputRef}
                onKeyDown={e => e.key === 'Enter' && handleAddOrUpdateItem()}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <Button variant='contained' fullWidth onClick={handleAddOrUpdateItem} sx={{ height: 56 }}>
                {itemToEditIndex !== null ? 'Update Item' : '+ Add Item'}
              </Button>
            </Grid>
          </Grid>

          {/* Items Table */}
          <Box sx={{ overflowX: 'auto', mt: 6 }}>
            <Table sx={{ minWidth: 1200 }}>
              <TableHead>
                <TableRow>
                  <TableCell>S.No</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Chemical</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Quantity</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align='center'>
                      No items added
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, i) => (
                    <TableRow key={item.id} sx={{ bgcolor: itemToEditIndex === i ? '#f0f8ff' : 'inherit' }}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>
                        <IconButton size='small' onClick={() => handleEditItem(i)}>
                          <i className='tabler-edit text-blue-600 text-lg' />
                        </IconButton>
                        <IconButton size='small' onClick={() => handleDeleteItem(i)}>
                          <i className='tabler-trash text-red-600 text-lg' />
                        </IconButton>
                      </TableCell>
                      <TableCell>{item.chemical}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>

          <Box mt={6} display='flex' justifyContent='flex-end' gap={2}>
            <Button variant='outlined' onClick={() => router.push('/admin/stock/material-request')}>
              Close
            </Button>
            <Button variant='contained' onClick={handleSaveAll} disabled={items.length === 0}>
              Save Request
            </Button>
          </Box>
        </CardContent>
      </Card>
    </ContentLayout>
  )
}
