'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { openDB } from 'idb'
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
// Custom Components
import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

// ----------------------------------------------------
// 💾 IndexedDB Functions
// ----------------------------------------------------
const DB_NAME = 'material_request_db'
const STORE_NAME = 'requests'

const initDB = async () => {
  const db = await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
  return db
}

const saveNewRequestToDB = async requestData => {
  const db = await initDB()
  return db.add(STORE_NAME, requestData)
}
// ----------------------------------------------------

export default function AddMaterialRequestPage() {
  const router = useRouter()

  const [date, setDate] = useState(new Date())
  const [formData, setFormData] = useState({
    requestType: '',
    requestedBy: '',
    fromLocation: '',
    toLocation: '',
    remarks: '',
    chemical: '',
    unit: '',
    quantity: ''
  })
  const [items, setItems] = useState([])
  const [itemToEditIndex, setItemToEditIndex] = useState(null)

  // --- Focus/Autocomplete Logic Refs ---
  const requestTypeRef = useRef(null)
  const requestedByRef = useRef(null)
  const fromLocationRef = useRef(null)
  const toLocationRef = useRef(null)
  const remarksRef = useRef(null)
  const chemicalRef = useRef(null)
  const unitRef = useRef(null)
  const quantityInputRef = useRef(null)

  // Autocomplete Open/Close state
  const [requestTypeOpen, setRequestTypeOpen] = useState(false)
  const [requestedByOpen, setRequestedByOpen] = useState(false)
  const [fromLocationOpen, setFromLocationOpen] = useState(false)
  const [toLocationOpen, setToLocationOpen] = useState(false)
  const [chemicalOpen, setChemicalOpen] = useState(false)
  const [unitOpen, setUnitOpen] = useState(false)

  // Helper function to focus an element and optionally open the dropdown
  const focusElement = (ref, openSetter = null) => {
    let element = null;

    if (ref === remarksRef) {
      // For multiline/textarea
      element = ref.current?.querySelector('textarea');
    } else if (ref === quantityInputRef) {
      // For simple CustomTextField input
      element = ref.current;
    } else if (ref.current?.querySelector('input')) {
      // For Autocomplete input
      element = ref.current.querySelector('input');
    }

    if (element) {
      element.focus();
      // ✅ FIX: Call the open setter if provided (for Autocomplete fields)
      if (openSetter) {
        openSetter(true);
      }
    }
  };

  // --- Focus Management Functions for Enter Key ---
  const focusNext = (currentRef) => {
    let nextRef;
    let nextOpenSetter = null;

    switch (currentRef) {
      case requestTypeRef:
        nextRef = requestedByRef;
        nextOpenSetter = setRequestedByOpen;
        break;
      case requestedByRef:
        nextRef = fromLocationRef;
        nextOpenSetter = setFromLocationOpen;
        break;
      case fromLocationRef:
        nextRef = toLocationRef;
        nextOpenSetter = setToLocationOpen;
        break;
      case toLocationRef:
        nextRef = remarksRef;
        break; // Remarks is a CustomTextField, no dropdown setter
      case remarksRef:
        nextRef = chemicalRef;
        nextOpenSetter = setChemicalOpen;
        break;
      case chemicalRef:
        nextRef = unitRef;
        nextOpenSetter = setUnitOpen;
        break;
      case unitRef:
        nextRef = quantityInputRef;
        break; // Quantity is a CustomTextField, no dropdown setter
      default:
        return
    }

    if (nextRef) {
      focusElement(nextRef, nextOpenSetter);
    }
  }

  const handleKeyDown = (e, currentRef) => {
    if (e.key === 'Enter') {
      // Prevent default form submission or newline in textareas
      e.preventDefault();
      focusNext(currentRef);
    }
  }

  // --- Form Handlers ---
  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleAddOrUpdateItem = () => {
    const { requestType, requestedBy, fromLocation, toLocation, remarks, chemical, unit, quantity } = formData

    if (!requestType || !requestedBy || !fromLocation || !toLocation || !chemical || !unit || !quantity) {
     
      return
    }

    const newItem = {
      id: Date.now(),
      requestDate: date.toISOString().split('T')[0], // YYYY-MM-DD for DB
      requestType,
      requestedBy,
      fromLocation,
      toLocation,
      remarks,
      chemical,
      unit,
      quantity,
      status: 'Pending',
      approvedStatus: 'Pending',
      issuedStatus: 'Not Issued',
      completedStatus: 'No'
    }

    if (itemToEditIndex !== null) {
      const existingItem = items[itemToEditIndex]
      const updatedItem = {
        ...newItem,
        // Preserve existing status fields on update
        status: existingItem.status || 'Pending',
        approvedStatus: existingItem.approvedStatus || 'Pending',
        issuedStatus: existingItem.issuedStatus || 'Not Issued',
        completedStatus: existingItem.completedStatus || 'No'
      }
      setItems(prev =>
        prev.map((item, i) => (i === itemToEditIndex ? { ...updatedItem, id: prev[i].id } : item))
      )
      setItemToEditIndex(null)
    } else {
      setItems(prev => [newItem, ...prev])
    }

    // Reset Item-specific fields, keep header fields
    setFormData(prev => ({
      requestType: prev.requestType,
      requestedBy: prev.requestedBy,
      fromLocation: prev.fromLocation,
      toLocation: prev.toLocation,
      remarks: prev.remarks,
      chemical: '',
      unit: '',
      quantity: ''
    }))

    // Focus back to the chemical field after adding/updating AND open its dropdown
    setTimeout(() => {
      focusElement(chemicalRef, setChemicalOpen);
    }, 0);
  }

  const handleDeleteItem = index => {
    setItems(prev => prev.filter((_, i) => i !== index))
    if (itemToEditIndex === index) setItemToEditIndex(null)
  }

  const handleEditItem = index => {
    const item = items[index]
    setDate(new Date(item.requestDate))
    setFormData({
      requestType: item.requestType,
      requestedBy: item.requestedBy,
      fromLocation: item.fromLocation,
      toLocation: item.toLocation,
      remarks: item.remarks,
      chemical: item.chemical,
      unit: item.unit,
      quantity: item.quantity
    })
    setItemToEditIndex(index)
  }

  const handleSaveAll = async () => {


    try {
      const db = await initDB()
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)

      for (const item of items) {
        const itemToSave = { ...item }
        // Remove the temporary client-side 'id' before saving to get a new DB generated one
        delete itemToSave.id
        await store.add(itemToSave)
      }

      await tx.done


      router.push('/admin/stock/material-request')
    } catch (error) {

    }
  }

  // Helper for required label
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
          {/* Row 1 */}
          <Grid container spacing={6} mb={3}>
            {/* Request Date */}
            <Grid item xs={12} md={4}>
              <AppReactDatepicker
                selected={date}
                onChange={d => setDate(d)}
                placeholderText='Select Date'
                dateFormat='dd/MM/yyyy'
                customInput={
                  <CustomTextField
                    fullWidth
                    label={requiredLabel('Request Date')}
                    value={date ? format(date, 'dd/MM/yyyy') : ''}
                    // ✅ FIX: Use focusElement to focus and open the next Autocomplete field
                    inputProps={{
                        onKeyDown: (e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                focusElement(requestTypeRef, setRequestTypeOpen);
                            }
                        }
                    }}
                  />
                }
              />
            </Grid>

            {/* Request Type Autocomplete */}
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={['Material Request', 'Material Return', 'Opening Stock']}
                value={formData.requestType}
                onChange={(e, val) => {
                  setFormData(prev => ({ ...prev, requestType: val || '' }))
                  // Optionally move focus to the next field after selection
                  if (val) focusNext(requestTypeRef)
                }}
                open={requestTypeOpen}
                onOpen={() => setRequestTypeOpen(true)}
                onClose={() => setRequestTypeOpen(false)}
                // ✅ This opens the dropdown when clicked/tabbed to.
                onFocus={() => setRequestTypeOpen(true)}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    fullWidth
                    label={requiredLabel('Request Type')}
                    inputProps={{
                      ...params.inputProps,
                      // ✅ FIX: Use the generic keydown handler to move focus on Enter
                      onKeyDown: (e) => handleKeyDown(e, requestTypeRef),
                    }}
                  />
                )}
                ref={requestTypeRef}
              />
            </Grid>

            {/* Requested By Autocomplete */}
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={['Admin', 'Tech']}
                value={formData.requestedBy}
                onChange={(e, val) => {
                  setFormData(prev => ({ ...prev, requestedBy: val || '' }))
                  if (val) focusNext(requestedByRef)
                }}
                open={requestedByOpen}
                onOpen={() => setRequestedByOpen(true)}
                onClose={() => setRequestedByOpen(false)}
                onFocus={() => setRequestedByOpen(true)}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    fullWidth
                    label={requiredLabel('Requested By')}
                    inputProps={{
                      ...params.inputProps,
                      onKeyDown: (e) => handleKeyDown(e, requestedByRef),
                    }}
                  />
                )}
                ref={requestedByRef}
              />
            </Grid>
          </Grid>

          {/* Row 2 */}
          <Grid container spacing={6} mb={3}>
            {/* From Location/Supplier Autocomplete */}
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={['Stock-TECH STOCK 1', 'Supplier-ABC']}
                value={formData.fromLocation}
                onChange={(e, val) => {
                  setFormData(prev => ({ ...prev, fromLocation: val || '' }))
                  if (val) focusNext(fromLocationRef)
                }}
                open={fromLocationOpen}
                onOpen={() => setFromLocationOpen(true)}
                onClose={() => setFromLocationOpen(false)}
                onFocus={() => setFromLocationOpen(true)}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    fullWidth
                    label={requiredLabel('From Location/Supplier')}
                    inputProps={{
                      ...params.inputProps,
                      onKeyDown: (e) => handleKeyDown(e, fromLocationRef),
                    }}
                  />
                )}
                ref={fromLocationRef}
              />
            </Grid>

            {/* To Location/Supplier Autocomplete */}
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={['Stock-TECH STOCK 2', 'Supplier-XYZ']}
                value={formData.toLocation}
                onChange={(e, val) => {
                  setFormData(prev => ({ ...prev, toLocation: val || '' }))
                  if (val) focusNext(toLocationRef)
                }}
                open={toLocationOpen}
                onOpen={() => setToLocationOpen(true)}
                onClose={() => setToLocationOpen(false)}
                onFocus={() => setToLocationOpen(true)}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    fullWidth
                    label={requiredLabel('To Location/Supplier')}
                    inputProps={{
                      ...params.inputProps,
                      onKeyDown: (e) => handleKeyDown(e, toLocationRef),
                    }}
                  />
                )}
                ref={toLocationRef}
              />
            </Grid>

            {/* Remarks CustomTextField */}
            <Grid item xs={12} md={4}>
              <CustomTextField
                fullWidth
                multiline
                rows={2}
                label='Remarks'
                name='remarks'
                value={formData.remarks}
                onChange={handleChange}
                // ✅ FIX: Use handleKeyDown to move to the next Autocomplete field
                onKeyDown={(e) => handleKeyDown(e, remarksRef)}
                ref={remarksRef}
              />
            </Grid>
          </Grid>

          {/* Separator */}
          <Box my={10} sx={{ borderTop: '1px solid #ccc', width: '100%' }} />

          {/* Row 3 - Item Details */}
          <Grid container spacing={6} mb={3}>
            {/* Chemicals Autocomplete */}
            <Grid item xs={12} md={3}>
              <Autocomplete
                options={['Abate', 'Able Max', 'Advion Ant Gel', 'Aquabac', 'Arilon Insecticide']}
                value={formData.chemical}
                onChange={(e, val) => {
                  setFormData(prev => ({ ...prev, chemical: val || '' }))
                  if (val) focusNext(chemicalRef)
                }}
                open={chemicalOpen}
                onOpen={() => setChemicalOpen(true)}
                onClose={() => setChemicalOpen(false)}
                onFocus={() => setChemicalOpen(true)}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    fullWidth
                    label={requiredLabel('Chemicals')}
                    inputProps={{
                      ...params.inputProps,
                      onKeyDown: (e) => handleKeyDown(e, chemicalRef),
                    }}
                  />
                )}
                ref={chemicalRef}
              />
            </Grid>

            {/* Unit Autocomplete */}
            <Grid item xs={12} md={3}>
              <Autocomplete
                options={['Bottle', 'Box', 'Kg', 'Litre', 'Pkt']}
                value={formData.unit}
                onChange={(e, val) => {
                  setFormData(prev => ({ ...prev, unit: val || '' }))
                  if (val) focusNext(unitRef)
                }}
                open={unitOpen}
                onOpen={() => setUnitOpen(true)}
                onClose={() => setUnitOpen(false)}
                onFocus={() => setUnitOpen(true)}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    fullWidth
                    label={requiredLabel('Unit')}
                    inputProps={{
                      ...params.inputProps,
                      onKeyDown: (e) => handleKeyDown(e, unitRef),
                    }}
                  />
                )}
                ref={unitRef}
              />
            </Grid>

            {/* Quantity CustomTextField */}
            <Grid item xs={12} md={3}>
              <CustomTextField
                type='text'
                fullWidth
                label={requiredLabel('Quantity')}
                name='quantity'
                value={formData.quantity}
                onChange={e => {
                  // Allow only numeric input
                  const numericValue = e.target.value.replace(/[^0-9]/g, '')
                  handleChange({ target: { name: e.target.name, value: numericValue } })
                }}
                inputRef={quantityInputRef}
                // ✅ FIX: Enter key press triggers adding the item
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddOrUpdateItem();
                  }
                }}
              />
            </Grid>

            {/* Add Item Button */}
            <Grid item xs={12} md={3} display='flex' alignItems='flex-end'>
              <Button variant='contained' fullWidth onClick={handleAddOrUpdateItem}>
                {itemToEditIndex !== null ? 'Update Item' : '+ Add Item'}
              </Button>
            </Grid>
          </Grid>

          {/* Table */}
          <Box mt={10} sx={{ overflowX: 'auto' }}>
            <Table sx={{ borderTop: '1px solid #ccc', minWidth: 1000 }}>
              <TableHead>
                <TableRow>
                  <TableCell>S.No</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Request Type</TableCell>
                  <TableCell>Requested By</TableCell>
                  <TableCell>From Location</TableCell>
                  <TableCell>To Location</TableCell>
                  <TableCell>Remarks</TableCell>
                  <TableCell>Chemical</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Quantity</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} align='center' sx={{ py: 3 }}>
                      No Data
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, index) => (
                    <TableRow key={item.id} sx={itemToEditIndex === index ? { backgroundColor: '#f0f8ff' } : {}}>
                      <TableCell sx={{ whiteSpace: 'normal', verticalAlign: 'top' }}>{index + 1}</TableCell>
                      <TableCell sx={{ whiteSpace: 'normal', verticalAlign: 'top' }}>
                        <IconButton size='small' onClick={() => handleDeleteItem(index)} title='Delete'>
                          <DeleteIcon style={{ color: 'red' }} />
                        </IconButton>
                        <IconButton size='small' onClick={() => handleEditItem(index)} title='Edit'>
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'normal', verticalAlign: 'top' }}>
                        {format(new Date(item.requestDate), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'normal', verticalAlign: 'top' }}>{item.requestType}</TableCell>
                      <TableCell sx={{ whiteSpace: 'normal', verticalAlign: 'top' }}>{item.requestedBy}</TableCell>
                      <TableCell sx={{ whiteSpace: 'normal', verticalAlign: 'top' }}>{item.fromLocation}</TableCell>
                      <TableCell sx={{ whiteSpace: 'normal', verticalAlign: 'top' }}>{item.toLocation}</TableCell>
                      <TableCell sx={{ whiteSpace: 'normal', verticalAlign: 'top' }}>{item.remarks}</TableCell>
                      <TableCell sx={{ whiteSpace: 'normal', verticalAlign: 'top' }}>{item.chemical}</TableCell>
                      <TableCell sx={{ whiteSpace: 'normal', verticalAlign: 'top' }}>{item.unit}</TableCell>
                      <TableCell sx={{ whiteSpace: 'normal', verticalAlign: 'top' }}>{item.quantity}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>

          {/* Buttons */}
          <Box mt={4} display='flex' justifyContent='flex-end' gap={2}>
            <Button variant='outlined' onClick={() => router.push('/admin/stock/material-request')}>
              Close
            </Button>
            <Button variant='contained' onClick={handleSaveAll}>
              Save
            </Button>
          </Box>
        </CardContent>
      </Card>
    </ContentLayout>
  )
}
