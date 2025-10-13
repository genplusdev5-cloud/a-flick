'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  Autocomplete,
  IconButton
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'

import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

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

const getRequestById = async id => {
  const db = await initDB()
  const numericId = Number(id)
  return db.get(STORE_NAME, numericId)
}

const loadAllRequestsFromDB = async () => {
  const db = await initDB()
  if (db.objectStoreNames.contains(STORE_NAME)) {
    return db.getAll(STORE_NAME)
  }
  return []
}

const loadRelatedRequests = async initialItem => {
  const allRequests = await loadAllRequestsFromDB()
  const relatedItems = allRequests.filter(item => {
    return (
      item.requestDate === initialItem.requestDate &&
      item.requestType === initialItem.requestType &&
      item.requestedBy === initialItem.requestedBy &&
      item.fromLocation === initialItem.fromLocation &&
      item.toLocation === initialItem.toLocation
    )
  })
  // Keep the state data sorted by ID (oldest to newest) to maintain stable indexing for CRUD operations
  return relatedItems.sort((a, b) => a.id - b.id)
}

const updateRequestInDB = async requestData => {
  const db = await initDB()
  return db.put(STORE_NAME, requestData)
}

const deleteRequestFromDB = async id => {
  const db = await initDB()
  const numericId = Number(id)
  await db.delete(STORE_NAME, numericId)
}

// Define an array of field names in their desired focus order
const FIELD_ORDER = [
  'requestType',
  'requestedBy',
  'fromLocation',
  'toLocation',
  'remarks',
  'chemical',
  'unit',
  'quantity',
  'approvedStatus',
  'issuedStatus',
  'completedStatus',
  'status',
  'addItemButton'
]

export default function EditMaterialRequestPage() {
  const router = useRouter()
  const params = useParams()
  const currentRequestId = params.id

  const [date, setDate] = useState(new Date())
  const [formData, setFormData] = useState({
    requestType: '',
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
  const [isLoading, setIsLoading] = useState(true)
  const [items, setItems] = useState([])
  const [originalItemIds, setOriginalItemIds] = useState(new Set())
  const [itemToEditIndex, setItemToEditIndex] = useState(null)

  // Refactored: Specific state for Autocomplete open/close
  const [requestTypeOpen, setRequestTypeOpen] = useState(false)
  const [requestedByOpen, setRequestedByOpen] = useState(false)
  const [fromLocationOpen, setFromLocationOpen] = useState(false)
  const [toLocationOpen, setToLocationOpen] = useState(false)
  const [chemicalOpen, setChemicalOpen] = useState(false)
  const [unitOpen, setUnitOpen] = useState(false)
  const [approvedStatusOpen, setApprovedStatusOpen] = useState(false)
  const [issuedStatusOpen, setIssuedStatusOpen] = useState(false)
  const [completedStatusOpen, setCompletedStatusOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  // End Refactored state

  // Create refs for each navigable input field
  const inputRefs = useRef(
    FIELD_ORDER.reduce((acc, name) => {
      acc[name] = useRef(null)
      return acc
    }, {})
  )

  useEffect(() => {
    if (!currentRequestId) {
      alert('Error: Request ID not found.')
      router.push('/admin/stock/material-request')
      return
    }

    const loadRequest = async () => {
      const initialItem = await getRequestById(currentRequestId)

      if (initialItem) {
        const requestDate = new Date(initialItem.requestDate)
        setDate(requestDate instanceof Date && !isNaN(requestDate) ? requestDate : new Date())

        const relatedItems = await loadRelatedRequests(initialItem)
        const ids = relatedItems.map(item => item.id)
        setOriginalItemIds(new Set(ids))
        setItems(relatedItems)

        setFormData(prev => ({
          ...prev,
          requestType: initialItem.requestType || '',
          requestedBy: initialItem.requestedBy || '',
          fromLocation: initialItem.fromLocation || '',
          toLocation: initialItem.toLocation || '',
          remarks: '',
          chemical: '',
          unit: '',
          quantity: ''
        }))
      } else {
        router.push('/admin/stock/material-request')
      }
    }
    loadRequest()
  }, [currentRequestId, router])

  const handleItemFieldChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // NEW: Handler to open dropdown on focus (for Autocomplete fields)
  const setOpenState = (name, value) => {
    switch (name) {
      case 'requestType':
        setRequestTypeOpen(value)
        break
      case 'requestedBy':
        setRequestedByOpen(value)
        break
      case 'fromLocation':
        setFromLocationOpen(value)
        break
      case 'toLocation':
        setToLocationOpen(value)
        break
      case 'chemical':
        setChemicalOpen(value)
        break
      case 'unit':
        setUnitOpen(value)
        break
      case 'approvedStatus':
        setApprovedStatusOpen(value)
        break
      case 'issuedStatus':
        setIssuedStatusOpen(value)
        break
      case 'completedStatus':
        setCompletedStatusOpen(value)
        break
      case 'status':
        setStatusOpen(value)
        break
    }
  }

  // Function to focus the next field
  const focusNextField = currentName => {
    const currentIndex = FIELD_ORDER.indexOf(currentName)
    const nextIndex = currentIndex + 1
    if (nextIndex < FIELD_ORDER.length) {
      const nextFieldName = FIELD_ORDER[nextIndex]
      const nextRef = inputRefs.current[nextFieldName]
      if (nextRef && nextRef.current) {
        if (nextFieldName === 'remarks') {
          nextRef.current.querySelector('textarea').focus()
        } else if (nextFieldName === 'quantity') {
          nextRef.current.querySelector('input').focus()
        } else if (nextFieldName === 'addItemButton') {
          nextRef.current.focus()
        } else {
          // For Autocomplete, focus on the input element AND open dropdown
          const inputElement = nextRef.current.querySelector('input')
          if (inputElement) {
            inputElement.focus()
            // If it's an Autocomplete, call setOpenState(true) to open the dropdown
            if (nextFieldName !== 'quantity' && nextFieldName !== 'remarks') {
              setOpenState(nextFieldName, true)
            }
          }
        }
      }
    }
  }

  // Modified Autocomplete change handler to use focusNextField
  const handleAutocompleteChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value || '' }))
    // Automatically move focus to the next field after selection
    focusNextField(name)
  }

  // Custom TextField handler for Enter key to advance focus
  const handleEnterKeyFocus = (e, currentFieldName) => {
    // Check if an option is selected (or value is entered) and Enter is pressed
    if (e.key === 'Enter') {
      e.preventDefault()
      focusNextField(currentFieldName)
    }
  }

  const handleAddOrUpdateItem = () => {
    const { requestType, requestedBy, fromLocation, toLocation, chemical, unit, quantity } = formData

    if (!requestType || !requestedBy || !fromLocation || !toLocation || !chemical || !unit || !quantity) {
      alert('Please fill all required Header and Item fields!')
      return
    }

    const newItem = {
      // If editing an existing item from DB, keep its original number ID, otherwise assign a temp ID
      id: itemToEditIndex !== null ? items[itemToEditIndex].id : `temp-${Date.now()}`,
      requestDate: date.toLocaleDateString('en-CA'),
      requestType: formData.requestType,
      requestedBy: formData.requestedBy,
      fromLocation: formData.fromLocation,
      toLocation: formData.toLocation,
      remarks: formData.remarks,
      chemical: formData.chemical,
      unit: formData.unit,
      quantity: Number(formData.quantity),
      approvedStatus: formData.approvedStatus,
      issuedStatus: formData.issuedStatus,
      completedStatus: formData.completedStatus,
      status: formData.status
    }

    if (itemToEditIndex !== null) {
      // Update existing item
      setItems(prev => prev.map((item, i) => (i === itemToEditIndex ? { ...item, ...newItem, id: prev[i].id } : item)))
      setItemToEditIndex(null)
    } else {
      // Add new item to the end of the array (it will appear at the top of the reversed table)
      setItems(prev => [...prev, newItem])
    }

    // Clear item-specific fields
    setFormData(prev => ({
      ...prev,
      remarks: '',
      chemical: '',
      unit: '',
      quantity: ''
    }))

    // After adding/updating, return focus to the first item-level field (chemical) and open its dropdown
    setTimeout(() => {
      focusNextField('remarks') // 'remarks' field is before 'chemical' in FIELD_ORDER
    }, 0)
  }

  const handleDeleteItem = index => {
    setItems(prev => prev.filter((_, i) => i !== index))
    if (itemToEditIndex === index) setItemToEditIndex(null)
  }

  const handleEditItem = index => {
    const item = items[index]
    setDate(
      new Date(item.requestDate) instanceof Date && !isNaN(new Date(item.requestDate))
        ? new Date(item.requestDate)
        : new Date()
    )
    setFormData({
      requestType: item.requestType,
      requestedBy: item.requestedBy,
      fromLocation: item.fromLocation,
      toLocation: item.toLocation,
      remarks: item.remarks,
      chemical: item.chemical,
      unit: item.unit,
      quantity: String(item.quantity),
      approvedStatus: item.approvedStatus || 'Pending',
      issuedStatus: item.issuedStatus || 'Not Issued',
      completedStatus: item.completedStatus || 'No',
      status: item.status || 'Waiting'
    })
    setItemToEditIndex(index)
  }

  const handleUpdate = async () => {
    if (items.length === 0) {
      alert('Please add at least one item before updating.')
      return
    }

    const header = {
      requestDate: date.toLocaleDateString('en-CA'),
      requestType: formData.requestType,
      requestedBy: formData.requestedBy,
      fromLocation: formData.fromLocation,
      toLocation: formData.toLocation
    }

    // 1. Determine which original items need to be deleted
    const currentItemIds = new Set(items.filter(item => typeof item.id === 'number').map(item => item.id))
    const itemsToDelete = Array.from(originalItemIds).filter(id => !currentItemIds.has(id))
    for (const id of itemsToDelete) {
      await deleteRequestFromDB(id)
    }

    // 2. Save/Update remaining items
    const db = await initDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    for (const item of items) {
      const itemToSave = {
        ...header,
        remarks: item.remarks,
        chemical: item.chemical,
        unit: item.unit,
        quantity: item.quantity,
        approvedStatus: item.approvedStatus,
        issuedStatus: item.issuedStatus,
        completedStatus: item.completedStatus,
        status: item.status
      }

      if (typeof item.id === 'number') {
        // Update existing item (has a number ID)
        await store.put({ ...itemToSave, id: item.id })
      } else {
        // Add new item (has a temp string ID)
        await store.add(itemToSave)
      }
    }
    await tx.done

    router.push('/admin/stock/material-request')
  }

  const requiredLabel = label => (
    <>
      {label} <span style={{ color: 'red' }}>*</span>
    </>
  )

  return (
    <ContentLayout
      title={`Edit Material Request`}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Material Request', href: '/admin/stock/material-request' },
        { label: 'Edit Request' }
      ]}
    >
      <Card elevation={0} sx={{ boxShadow: 'none' }}>
        <Typography variant='h6' align='center' sx={{ py: 3 }}>
          Edit Material Request
        </Typography>
        <CardContent>
          {/* Row 1 */}
          <Grid container spacing={6} mb={3}>
            <Grid item xs={12} md={4}>
              <AppReactDatepicker
                selected={date}
                onChange={setDate}
                placeholderText='Select Date'
                customInput={<CustomTextField fullWidth label={requiredLabel('Request Date')} />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={['Material Request', 'Material Return', 'Opening Stock']}
                value={formData.requestType}
                onChange={(e, val) => handleAutocompleteChange('requestType', val)}
                open={requestTypeOpen}
                onOpen={() => setRequestTypeOpen(true)}
                onClose={() => setRequestTypeOpen(false)}
                onFocus={() => setRequestTypeOpen(true)}
                ref={inputRefs.current.requestType}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    fullWidth
                    label={requiredLabel('Request Type')}
                    inputProps={{
                      ...params.inputProps,
                      onKeyDown: e => handleEnterKeyFocus(e, 'requestType')
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={['Admin', 'Tech']}
                value={formData.requestedBy}
                onChange={(e, val) => handleAutocompleteChange('requestedBy', val)}
                open={requestedByOpen}
                onOpen={() => setRequestedByOpen(true)}
                onClose={() => setRequestedByOpen(false)}
                onFocus={() => setRequestedByOpen(true)}
                ref={inputRefs.current.requestedBy}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    fullWidth
                    label={requiredLabel('Requested By')}
                    inputProps={{
                      ...params.inputProps,
                      onKeyDown: e => handleEnterKeyFocus(e, 'requestedBy')
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>

          {/* Row 2 */}
          <Grid container spacing={6} mb={3}>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={['Stock-TECH STOCK 1', 'Supplier-ABC']}
                value={formData.fromLocation}
                onChange={(e, val) => handleAutocompleteChange('fromLocation', val)}
                open={fromLocationOpen}
                onOpen={() => setFromLocationOpen(true)}
                onClose={() => setFromLocationOpen(false)}
                onFocus={() => setFromLocationOpen(true)}
                ref={inputRefs.current.fromLocation}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    fullWidth
                    label={requiredLabel('From Location/Supplier')}
                    inputProps={{
                      ...params.inputProps,
                      onKeyDown: e => handleEnterKeyFocus(e, 'fromLocation')
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={['Stock-TECH STOCK 2', 'Supplier-XYZ']}
                value={formData.toLocation}
                onChange={(e, val) => handleAutocompleteChange('toLocation', val)}
                open={toLocationOpen}
                onOpen={() => setToLocationOpen(true)}
                onClose={() => setToLocationOpen(false)}
                onFocus={() => setToLocationOpen(true)}
                ref={inputRefs.current.toLocation}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    fullWidth
                    label={requiredLabel('To Location/Supplier')}
                    inputProps={{
                      ...params.inputProps,
                      onKeyDown: e => handleEnterKeyFocus(e, 'toLocation')
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <CustomTextField
                fullWidth
                multiline
                rows={2}
                label='Remarks (For Item)'
                name='remarks'
                value={formData.remarks}
                onChange={handleItemFieldChange}
                inputRef={inputRefs.current.remarks}
                onKeyDown={e => handleEnterKeyFocus(e, 'remarks')}
              />
            </Grid>
          </Grid>

          {/* Separator */}
          <Box my={5} sx={{ borderTop: '1px solid #ccc', width: '100%' }} />
          <Typography variant='subtitle1' sx={{ mb: 3 }}>
            Item Details & Status
          </Typography>

          {/* Row 3 */}
          <Grid container spacing={6} mb={3}>
            <Grid item xs={12} md={3}>
              <Autocomplete
                options={['Abate', 'Able Max', 'Advion Ant Gel', 'Aquabac', 'Arilon Insecticide']}
                value={formData.chemical}
                onChange={(e, val) => handleAutocompleteChange('chemical', val)}
                open={chemicalOpen}
                onOpen={() => setChemicalOpen(true)}
                onClose={() => setChemicalOpen(false)}
                onFocus={() => setChemicalOpen(true)}
                ref={inputRefs.current.chemical}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    fullWidth
                    label={requiredLabel('Chemicals')}
                    inputProps={{
                      ...params.inputProps,
                      onKeyDown: e => handleEnterKeyFocus(e, 'chemical')
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Autocomplete
                options={['Bottle', 'Box', 'Kg', 'Litre', 'Pkt']}
                value={formData.unit}
                onChange={(e, val) => handleAutocompleteChange('unit', val)}
                open={unitOpen}
                onOpen={() => setUnitOpen(true)}
                onClose={() => setUnitOpen(false)}
                onFocus={() => setUnitOpen(true)}
                ref={inputRefs.current.unit}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    fullWidth
                    label={requiredLabel('Unit')}
                    inputProps={{
                      ...params.inputProps,
                      onKeyDown: e => handleEnterKeyFocus(e, 'unit')
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <CustomTextField
                type='text'
                fullWidth
                label={requiredLabel('Quantity')}
                name='quantity'
                value={formData.quantity}
                onChange={e => {
                  const numericValue = e.target.value.replace(/[^0-9]/g, '')
                  handleItemFieldChange({ target: { name: e.target.name, value: numericValue } })
                }}
                inputRef={inputRefs.current.quantity}
                onKeyDown={e => handleEnterKeyFocus(e, 'quantity')}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Autocomplete
                options={['Approved', 'Rejected', 'Pending']}
                value={formData.approvedStatus}
                onChange={(e, val) => handleAutocompleteChange('approvedStatus', val)}
                open={approvedStatusOpen}
                onOpen={() => setApprovedStatusOpen(true)}
                onClose={() => setApprovedStatusOpen(false)}
                onFocus={() => setApprovedStatusOpen(true)}
                ref={inputRefs.current.approvedStatus}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    fullWidth
                    label={requiredLabel('Approved Status')}
                    inputProps={{
                      ...params.inputProps,
                      onKeyDown: e => handleEnterKeyFocus(e, 'approvedStatus')
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>

          {/* Row 4 */}
          <Grid container spacing={6} mb={3}>
            <Grid item xs={12} md={3}>
              <Autocomplete
                options={['Issued', 'Pending', 'Not Issued']}
                value={formData.issuedStatus}
                onChange={(e, val) => handleAutocompleteChange('issuedStatus', val)}
                open={issuedStatusOpen}
                onOpen={() => setIssuedStatusOpen(true)}
                onClose={() => setIssuedStatusOpen(false)}
                onFocus={() => setIssuedStatusOpen(true)}
                ref={inputRefs.current.issuedStatus}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    fullWidth
                    label={requiredLabel('Issued Status')}
                    inputProps={{
                      ...params.inputProps,
                      onKeyDown: e => handleEnterKeyFocus(e, 'issuedStatus')
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Autocomplete
                options={['Yes', 'No']}
                value={formData.completedStatus}
                onChange={(e, val) => handleAutocompleteChange('completedStatus', val)}
                open={completedStatusOpen}
                onOpen={() => setCompletedStatusOpen(true)}
                onClose={() => setCompletedStatusOpen(false)}
                onFocus={() => setCompletedStatusOpen(true)}
                ref={inputRefs.current.completedStatus}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    fullWidth
                    label={requiredLabel('Completed')}
                    inputProps={{
                      ...params.inputProps,
                      onKeyDown: e => handleEnterKeyFocus(e, 'completedStatus')
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Autocomplete
                options={['Waiting', 'Rejected', 'Pending', 'Issued', 'Completed', 'Approved', 'Declined']}
                value={formData.status}
                onChange={(e, val) => handleAutocompleteChange('status', val)}
                open={statusOpen}
                onOpen={() => setStatusOpen(true)}
                onClose={() => setStatusOpen(false)}
                onFocus={() => setStatusOpen(true)}
                ref={inputRefs.current.status}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    fullWidth
                    label={requiredLabel('Request Status')}
                    inputProps={{
                      ...params.inputProps,
                      onKeyDown: e => handleEnterKeyFocus(e, 'status')
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={3} display='flex' alignItems='flex-end'>
              <Button
                variant='contained'
                fullWidth
                onClick={handleAddOrUpdateItem}
                ref={inputRefs.current.addItemButton}
              >
                {itemToEditIndex !== null ? 'Update Item' : '+ Add Item'}
              </Button>
            </Grid>
          </Grid>

          {/* Table */}
          <Box mt={10} sx={{ overflowX: 'auto' }}>
            <Table sx={{ borderTop: '1px solid #ccc', minWidth: 2200 }}>
              <TableHead>
                <TableRow>
                  <TableCell>S.No</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Req Date</TableCell>
                  <TableCell>Req Type</TableCell>
                  <TableCell>Requested By</TableCell>
                  <TableCell>From Location</TableCell>
                  <TableCell>To Location</TableCell>
                  <TableCell>Chemical</TableCell>
                  <TableCell>Qty</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Remarks</TableCell>
                  <TableCell>Approved Status</TableCell>
                  <TableCell>Issued Status</TableCell>
                  <TableCell>Completed</TableCell>
                  <TableCell>Request Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={16} align='center' sx={{ py: 3 }}>
                      No Data
                    </TableCell>
                  </TableRow>
                ) : (
                  items
                    .slice() // Create a shallow copy
                    .reverse() // Reverse the copy to show newest first
                    .map((item, index) => {
                      // Calculate the original index in the non-reversed 'items' array
                      const originalIndex = items.length - 1 - index

                      // Use 'index + 1' for the Serial Number, as it's the current position in the reversed list
                      const serialNumber = index + 1

                      return (
                        <TableRow
                          key={item.id}
                          sx={itemToEditIndex === originalIndex ? { backgroundColor: '#f0f8ff' } : {}}
                        >
                          <TableCell sx={{ whiteSpace: 'normal', verticalAlign: 'top' }}>{serialNumber}</TableCell>
                          <TableCell sx={{ whiteSpace: 'normal', verticalAlign: 'top' }}>
                            {/* Use originalIndex for action functions */}
                            <IconButton size='small' onClick={() => handleDeleteItem(originalIndex)} title='Delete'>
                              <DeleteIcon style={{ color: 'red' }} />
                            </IconButton>
                            <IconButton size='small' onClick={() => handleEditItem(originalIndex)} title='Edit'>
                              <EditIcon />
                            </IconButton>
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'normal', verticalAlign: 'top' }}>{item.requestDate}</TableCell>
                          <TableCell sx={{ whiteSpace: 'normal', verticalAlign: 'top' }}>{item.requestType}</TableCell>
                          <TableCell sx={{ whiteSpace: 'normal', verticalAlign: 'top' }}>{item.requestedBy}</TableCell>
                          <TableCell sx={{ whiteSpace: 'normal', verticalAlign: 'top' }}>{item.fromLocation}</TableCell>
                          <TableCell sx={{ whiteSpace: 'normal', verticalAlign: 'top' }}>{item.toLocation}</TableCell>
                          <TableCell sx={{ whiteSpace: 'normal', verticalAlign: 'top' }}>{item.chemical}</TableCell>
                          <TableCell sx={{ whiteSpace: 'normal', verticalAlign: 'top' }}>{item.quantity}</TableCell>
                          <TableCell sx={{ whiteSpace: 'normal', verticalAlign: 'top' }}>{item.unit}</TableCell>
                          <TableCell sx={{ whiteSpace: 'normal', verticalAlign: 'top' }}>{item.remarks}</TableCell>
                          <TableCell sx={{ whiteSpace: 'normal', verticalAlign: 'top' }}>
                            {item.approvedStatus || 'Pending'}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'normal', verticalAlign: 'top' }}>
                            {item.issuedStatus || 'Not Issued'}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'normal', verticalAlign: 'top' }}>
                            {item.completedStatus || 'No'}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'normal', verticalAlign: 'top' }}>
                            {item.status || 'Waiting'}
                          </TableCell>
                        </TableRow>
                      )
                    })
                )}
              </TableBody>
            </Table>
          </Box>

          {/* Buttons */}
          <Box mt={4} display='flex' justifyContent='flex-end' gap={2}>
            <Button variant='outlined' onClick={() => router.push('/admin/stock/material-request')}>
              Cancel
            </Button>
            <Button variant='contained' onClick={handleUpdate}>
              Update
            </Button>
          </Box>
        </CardContent>
      </Card>
    </ContentLayout>
  )
}
