'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

import {
  Box,
  Button,
  Grid,
  Card,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Dialog, // 💡 NEW: Import Dialog and related components
  DialogContent
} from '@mui/material'

import { getAllDropdowns } from '@/api/contract/dropdowns'
import { addContractApi } from '@/api/contract/add'

import { useRouter } from 'next/navigation'

import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import VisibilityIcon from '@mui/icons-material/Visibility'

// 🔥 Global UI Components (use everywhere)
import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import GlobalTextarea from '@/components/common/GlobalTextarea'
import GlobalSelect from '@/components/common/GlobalSelect'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import { showToast } from '@/components/common/Toasts'

// Layout + Inputs (Assuming these paths are correct)
import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import { Autocomplete } from '@mui/material'

export default function AddContractPage() {
  const router = useRouter()

  // Helper function to generate a simple unique ID
  const generateUniqueId = () => Date.now().toString(36) + Math.random().toString(36).substring(2)

  // ----------------------------------------------------------------------
  // State and Options
  // ----------------------------------------------------------------------
  const [formData, setFormData] = useState({
    // Initializing all fields to sensible defaults
    salesMode: '',
    contractName: '', // ⭐ ADD THIS
    contractType: '',
    coveredLocation: '',
    contractCode: '',
    serviceAddress: '',
    postalCode: '',
    poNumber: '',
    poExpiry: new Date(),
    preferredTime: '',
    reportEmail: '',
    contactPerson: '',
    sitePhone: '',
    mobile: '',
    callType: '',
    groupCode: '',
    startDate: new Date(),
    endDate: new Date(),
    reminderDate: new Date(),
    industry: '',
    contractValue: '',
    technician: '',
    paymentTerm: '',
    salesPerson: '',
    supervisor: '',
    billingFrequency: '',
    invoiceCount: '',
    invoiceRemarks: '',
    latitude: '',
    longitude: '',
    file: null, // Keep file for actual File object/data if needed for backend
    uploadedFileName: '', // 💡 NEW: To display file name
    uploadedFileURL: '', // 💡 NEW: To hold temporary URL for preview
    billingRemarks: '',
    agreement1: '',
    agreement2: '',
    technicianRemarks: '',
    appointmentRemarks: ''
  })

  // NEW STATE for the input fields for a single pest item
  const [currentPestItem, setCurrentPestItem] = useState({
    pest: '',
    frequency: '',
    pestCount: '',
    pestValue: '',
    total: '',
    time: '',
    chemicals: '',
    noOfItems: ''
  })

  // NEW STATE for the list of pest items (The table/data grid)
  const [pestItems, setPestItems] = useState([])

  // NEW STATE: Tracks the ID of the item currently being edited
  const [editingItemId, setEditingItemId] = useState(null)

  const [reportEmailError, setReportEmailError] = useState(false)
  const [selectedFile, setSelectedFile] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [openDialog, setOpenDialog] = useState(false) // 💡 NEW: For file dialog
  const dropdownLoaded = useRef(false)

  const cleanOptions = arr => [...new Set(arr.filter(v => v !== null && v !== undefined && v !== ''))]

  const [dropdowns, setDropdowns] = useState({
    customers: [],
    callTypes: [],
    industries: [],
    employees: [],
    billingFrequencies: [],
    serviceFrequency: [],
    pests: [],
    chemicals: []
  })

  // Autocomplete Fields Definition (Unchanged)
  // ALL autocomplete fields (static + backend)
  const autocompleteFields = [
    { name: 'salesMode', options: ['Confirmed Sales', 'Quotation'] },
    { name: 'contractType', options: ['Continuous Contract', 'Limited Contract', 'Continuous Job', 'Job', 'Warranty'] },
    { name: 'paymentTerm', options: ['0 days', '30 days'] },
    { name: 'salesPerson', options: ['Admin'] },
    { name: 'time', options: ['0:05', '0:10', '0:15'] },

    // BACKEND-DRIVEN DROPDOWNS
    { name: 'customer', options: [] },
    { name: 'callType', options: [] },
    { name: 'industry', options: [] },
    { name: 'technician', options: [] },
    { name: 'supervisor', options: [] },
    { name: 'billingFrequency', options: [] },
    { name: 'pest', options: [] },
    { name: 'chemicals', options: [] },
    { name: 'frequency', options: [] }
  ]

  // Dynamic Refs and Open States for Autocomplete (Unchanged)
  const refs = {}
  const openStates = {}
  const setOpenStates = {}

  autocompleteFields.forEach(({ name }) => {
    refs[name + 'Ref'] = useRef(null)
    refs[name + 'InputRef'] = useRef(null)

    const [isOpen, setIsOpen] = useState(false)

    openStates[name + 'Open'] = isOpen
    setOpenStates[name + 'SetOpen'] = setIsOpen
  })

  // Explicit Refs (Unchanged)
  const coveredLocationRef = useRef(null),
    contractCodeRef = useRef(null),
    serviceAddressRef = useRef(null)
  const postalCodeRef = useRef(null),
    poNumberRef = useRef(null),
    poExpiryRef = useRef(null)
  const preferredTimeRef = useRef(null),
    reportEmailRef = useRef(null),
    contactPersonRef = useRef(null)
  const sitePhoneRef = useRef(null),
    mobileRef = useRef(null),
    groupCodeRef = useRef(null)
  const startDateRef = useRef(null),
    endDateRef = useRef(null),
    reminderDateRef = useRef(null)
  const contractValueRef = useRef(null),
    invoiceCountRef = useRef(null),
    invoiceRemarksRef = useRef(null)
  const latitudeRef = useRef(null),
    longitudeRef = useRef(null),
    fileInputRef = useRef(null)
  const fileUploadButtonRef = useRef(null)

  // NEW Refs for the Add Pest Item fields
  const currentPestCountRef = useRef(null),
    currentPestValueRef = useRef(null),
    currentTotalRef = useRef(null)
  const currentChemicalsRef = useRef(null),
    currentNoOfItemsRef = useRef(null),
    addPestButtonRef = useRef(null)

  const billingRemarksRef = useRef(null),
    agreement1Ref = useRef(null),
    agreement2Ref = useRef(null)
  const technicianRemarksRef = useRef(null),
    appointmentRemarksRef = useRef(null),
    closeButtonRef = useRef(null)
  const saveButtonRef = useRef(null)

  // Group all focusable element refs for keyboard navigation sequence (UPDATED)
  const focusableElementRefs = [
    refs.salesModeInputRef,
    refs.customerInputRef,
    refs.contractTypeInputRef,
    coveredLocationRef,
    contractCodeRef,
    serviceAddressRef,
    postalCodeRef,
    poNumberRef,
    poExpiryRef,
    preferredTimeRef,
    reportEmailRef,
    contactPersonRef,
    sitePhoneRef,
    mobileRef,
    refs.callTypeInputRef,
    groupCodeRef,
    startDateRef,
    endDateRef,
    reminderDateRef,
    refs.industryInputRef,
    contractValueRef,
    refs.technicianInputRef,
    refs.paymentTermInputRef,
    refs.salesPersonInputRef,
    refs.supervisorInputRef,
    refs.billingFrequencyInputRef,
    invoiceCountRef,
    invoiceRemarksRef,
    latitudeRef,
    longitudeRef,
    fileUploadButtonRef,

    // NEW Sequence for 'Add/Edit Pest' inputs
    refs.pestInputRef,
    refs.frequencyInputRef,
    currentPestCountRef,
    currentPestValueRef,
    currentTotalRef,
    refs.timeInputRef,
    currentChemicalsRef,
    currentNoOfItemsRef,
    addPestButtonRef,

    // Continue with the rest of the form
    billingRemarksRef,
    agreement1Ref,
    agreement2Ref,
    technicianRemarksRef,
    appointmentRemarksRef,
    closeButtonRef,
    saveButtonRef
  ].filter(ref => ref)

  useEffect(() => {
    if (!dropdownLoaded.current) {
      loadDropdowns()
      dropdownLoaded.current = true
    }
  }, [])

  const loadDropdowns = async () => {
    try {
      const data = await getAllDropdowns()

      console.log('✔ ALL DROPDOWNS:', data)

      setDropdowns({
        customers: data.customers,
        callTypes: data.callTypes,
        industries: data.industries,
        employees: data.employees,
        billingFrequencies: data.billingFreq,
        serviceFrequency: data.serviceFreq,
        pests: data.pests,
        chemicals: data.chemicals
      })

      // UPDATE AUTO COMPLETE OPTIONS

      autocompleteFields.find(f => f.name === 'customer').options = data.customers?.map(c => c.name) || []

      autocompleteFields.find(f => f.name === 'callType').options = data.callTypes?.map(c => c.name) || []

      autocompleteFields.find(f => f.name === 'industry').options = data.industries?.map(i => i.name) || []

      autocompleteFields.find(f => f.name === 'technician').options =
        data.employees?.filter(e => e.designation === 'Technician')?.map(e => e.nick_name || e.name) || []

      autocompleteFields.find(f => f.name === 'supervisor').options =
        data.employees?.filter(e => e.designation?.toLowerCase() === 'supervisor')?.map(e => e.nick_name || e.name) ||
        []

      autocompleteFields.find(f => f.name === 'billingFrequency').options = data.billingFreq?.map(b => b.name) || []

      autocompleteFields.find(f => f.name === 'pest').options = data.pests?.map(p => p.name) || []

      autocompleteFields.find(f => f.name === 'frequency').options = data.serviceFreq?.map(f => f.name) || []

      // ⭐⭐ NEW — CHEMICALS AUTOCOMPLETE ⭐⭐
      autocompleteFields.push({
        name: 'chemicals',
        options: data.chemicals?.map(c => c.name) || []
      })
    } catch (error) {
      console.error('Dropdown load error', error)
    }
  }

  // ----------------------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------------------

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Handler for the current pest item input fields
  const handleCurrentPestItemChange = e => {
    const { name, value } = e.target
    let updatedValue = value

    // Auto-calculate Total (Pest Count * Pest Value)
    if (name === 'pestCount' || name === 'pestValue') {
      // Use Number() conversion here but keep the string value for state
      const count = name === 'pestCount' ? Number(updatedValue || 0) : Number(currentPestItem.pestCount || 0)
      const val = name === 'pestValue' ? Number(updatedValue || 0) : Number(currentPestItem.pestValue || 0)

      setCurrentPestItem(prev => ({
        ...prev,
        [name]: updatedValue,
        total: (count * val).toString()
      }))
      return
    }

    setCurrentPestItem(prev => ({ ...prev, [name]: updatedValue }))
  }

  // Focus management helper function (Unchanged)
  const focusNextElement = useCallback(
    currentRef => {
      const currentElement = currentRef.current
      if (!currentElement) return

      const currentIndex = focusableElementRefs.findIndex(ref => ref === currentRef)

      if (currentIndex !== -1) {
        for (let i = currentIndex + 1; i < focusableElementRefs.length; i++) {
          const nextRef = focusableElementRefs[i]
          const nextElement = nextRef.current

          if (nextElement) {
            const nextAutocompleteField = autocompleteFields.find(field => refs[field.name + 'InputRef'] === nextRef)

            if (nextAutocompleteField) {
              nextElement.focus()
              const setStateFunc = setOpenStates[nextAutocompleteField.name + 'SetOpen']
              if (setStateFunc) {
                setStateFunc(true)
              }
            } else {
              nextElement.focus()
            }
            return
          }
        }
        saveButtonRef.current?.focus()
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...Object.values(refs), ...Object.values(setOpenStates), focusableElementRefs]
  )

  // Universal onKeyDown handler (Unchanged)
  const handleKeyDown = (e, currentRef, isMultiline = false) => {
    if (e.key === 'Enter') {
      if (isMultiline && e.shiftKey) {
        return
      }

      e.preventDefault()
      focusNextElement(currentRef)
    }
  }

  const handleAutocompleteChange = (name, newValue, currentInputRef) => {
    setFormData(prev => ({
      ...prev,
      [name]: typeof newValue === 'string' ? newValue : (newValue ?? '')
    }))

    const setStateFunc = setOpenStates[name + 'SetOpen']
    if (setStateFunc) setStateFunc(false)

    focusNextElement(currentInputRef)
  }

  // NEW: Autocomplete change handler for CURRENT PEST ITEM
  const handleCurrentPestItemAutocompleteChange = (name, newValue, currentInputRef) => {
    setCurrentPestItem(prev => ({ ...prev, [name]: newValue }))
    const setStateFunc = setOpenStates[name + 'SetOpen']
    if (setStateFunc) {
      setStateFunc(false)
    }
    focusNextElement(currentInputRef)
  }

  // Autocomplete input change handler (Unchanged)
  const handleAutocompleteInputChange = (name, options, newValue, reason) => {
    if (reason === 'input' && !options.includes(newValue) && !autocompleteFields.find(f => f.name === name).freeSolo) {
      return
    }
    // This handler must work for both formData and currentPestItem
    if (['pest', 'frequency', 'time'].includes(name)) {
      setCurrentPestItem(prev => ({ ...prev, [name]: newValue }))
    } else {
      setFormData(prev => ({ ...prev, [name]: newValue }))
    }
  }

  // Datepicker change handler (Unchanged)
  const handleDateChange = (name, date, currentInputRef) => {
    setFormData(prev => ({ ...prev, [name]: date }))
    focusNextElement(currentInputRef)
  }

  // 💡 FIXED/UPDATED File handler functions
  const handleNativeFileChange = e => {
    const file = e.target.files?.[0] || null
    if (file) {
      setSelectedFile(file.name)
      // Create a temporary URL for preview, like in page A
      const fileURL = URL.createObjectURL(file)
      setFormData(prev => ({
        ...prev,
        file: file,
        uploadedFileName: file.name,
        uploadedFileURL: fileURL
      }))
    } else {
      setSelectedFile('')
      setFormData(prev => ({
        ...prev,
        file: null,
        uploadedFileName: '',
        uploadedFileURL: ''
      }))
    }
    e.target.value = null // Reset file input
    focusNextElement(fileUploadButtonRef)
  }

  const handleFileDrop = e => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0] || null
    if (file) {
      // Use the logic from handleNativeFileChange
      setSelectedFile(file.name)
      const fileURL = URL.createObjectURL(file)
      setFormData(prev => ({
        ...prev,
        file: file,
        uploadedFileName: file.name,
        uploadedFileURL: fileURL
      }))
    }
  }

  const handleDragOver = e => {
    e.preventDefault()
    setIsDragOver(true)
  }
  const handleDragLeave = e => {
    e.preventDefault()
    setIsDragOver(false)
  }

  // 💡 NEW: Handler for viewing the uploaded file
  const handleViewFile = () => {
    if (formData.uploadedFileURL) setOpenDialog(true)
    else alert('No file available to view.')
  }

  // 💡 NEW: Handler to close the dialog
  const handleCloseDialog = () => setOpenDialog(false)

  // Function to load an item for editing
  const handleEditPestItem = item => {
    // Load item data into the current input state
    setCurrentPestItem({
      pest: item.pest,
      frequency: item.frequency,
      pestCount: item.noOfItems, // Map 'noOfItems' back to 'pestCount' input
      pestValue: item.pestValue,
      total: item.totalValue,
      time: item.workTime,
      chemicals: item.chemicals,
      noOfItems: item.noOfItems
    })

    // Set the editing ID
    setEditingItemId(item.id)

    // Focus on the first input field
    refs.pestInputRef.current?.focus()
  }

  // Function to save (Add or Update) the current item to the list
  const handleSavePestItem = () => {
    // Basic validation (Pest and Frequency are required)
    if (!currentPestItem.pest || !currentPestItem.frequency) {
      alert('Pest and Frequency are required to add/update an item.')
      return
    }

    const itemPayload = {
      pest: currentPestItem.pest,
      frequency: currentPestItem.frequency,
      pestValue: currentPestItem.pestValue || '0',
      totalValue: currentPestItem.total || '0',
      workTime: currentPestItem.time || '0:00',
      chemicals: currentPestItem.chemicals || '',
      noOfItems: currentPestItem.noOfItems || currentPestItem.pestCount || '0'
    }

    if (editingItemId) {
      // Logic for UPDATING an existing item
      setPestItems(prev => prev.map(item => (item.id === editingItemId ? { ...itemPayload, id: item.id } : item)))
      setEditingItemId(null) // Clear edit state
    } else {
      // Logic for ADDING a new item
      setPestItems(prev => [...prev, { ...itemPayload, id: generateUniqueId() }])
    }

    // Reset the current input fields
    setCurrentPestItem({
      pest: '',
      frequency: '',
      pestCount: '',
      pestValue: '',
      total: '',
      time: '',
      chemicals: '',
      noOfItems: ''
    })

    // Focus back to the first field of the pest block
    refs.pestInputRef.current?.focus()
  }

  // Function to delete an item from the list
  const handleDeletePestItem = id => {
    if (editingItemId === id) {
      setEditingItemId(null)
      setCurrentPestItem({
        pest: '',
        frequency: '',
        pestCount: '',
        pestValue: '',
        total: '',
        time: '',
        chemicals: '',
        noOfItems: ''
      })
    }
    setPestItems(prev => prev.filter(item => item.id !== id))
  }

  // Logic to Save to IndexedDB and Redirect
  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        pestItems: pestItems,
        poExpiry: formData.poExpiry?.toISOString(),
        startDate: formData.startDate?.toISOString(),
        endDate: formData.endDate?.toISOString(),
        reminderDate: formData.reminderDate?.toISOString()
      }

      const res = await addContractApi(payload)

      if (res?.status === 'success') {
        alert('Contract Added Successfully!')
        router.push('/admin/contracts')
      } else {
        alert('Failed to add contract')
      }
    } catch (error) {
      console.error(error)
      alert('Error while saving contract')
    }
  }

  // ----------------------------------------------------------------------
  // Render Helper for Autocomplete (Unchanged)
  // ----------------------------------------------------------------------

  const renderAutocomplete = ({ name, label, options, gridProps = { xs: 12, md: 3 } }) => {
    const ref = refs[name + 'Ref']
    const inputRef = refs[name + 'InputRef']
    const isOpen = openStates[name + 'Open']
    const setIsOpen = setOpenStates[name + 'SetOpen']

    return (
      <Grid item {...gridProps} key={name}>
        <Autocomplete
          ref={ref}
          freeSolo={false}
          options={options}
          value={formData[name] || ''}
          getOptionLabel={option => (typeof option === 'string' ? option : option?.label || '')}
          open={isOpen}
          onOpen={() => setIsOpen(true)}
          onClose={() => setIsOpen(false)}
          onFocus={() => setIsOpen(true)}
          onInputChange={(e, newValue, reason) => handleAutocompleteInputChange(name, options, newValue, reason)}
          onChange={(e, newValue) => handleAutocompleteChange(name, newValue || '', inputRef)}
          noOptionsText='No options'
          onKeyDown={e => handleKeyDown(e, inputRef)}
          renderInput={params => <CustomTextField {...params} label={label} inputRef={inputRef} />}
        />
      </Grid>
    )
  }

  // ----------------------------------------------------------------------
  // Form Structure (Updated File Upload Section)
  // ----------------------------------------------------------------------

  return (
    <ContentLayout
      title={<Box sx={{ m: 2 }}>{'Add Contract'}</Box>}
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Contracts', href: '/admin/contracts' },
        { label: 'Add Contract' }
      ]}
    >
      <Card sx={{ p: 4, boxShadow: 'none' }} elevation={0}>
        <Grid container spacing={6}>
          {/* ... (Existing form fields, rows 1-9) ... */}
          {renderAutocomplete({
            name: 'salesMode',
            label: 'Sales Mode',
            options: autocompleteFields.find(f => f.name === 'salesMode').options
          })}
          {renderAutocomplete({
            name: 'customer',
            label: 'Customer',
            options: cleanOptions(dropdowns.customers?.map(c => c.name))
          })}

          {renderAutocomplete({
            name: 'contractType',
            label: 'Contract Type',
            options: autocompleteFields.find(f => f.name === 'contractType').options
          })}
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Covered Location'
              name='coveredLocation'
              value={formData.coveredLocation}
              onChange={handleChange}
              inputRef={coveredLocationRef}
              onKeyDown={e => handleKeyDown(e, coveredLocationRef)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Contract Code'
              name='contractCode'
              value={formData.contractCode}
              onChange={handleChange}
              inputRef={contractCodeRef}
              onKeyDown={e => handleKeyDown(e, contractCodeRef)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Service Address (Copy from Customer)'
              name='serviceAddress'
              value={formData.serviceAddress}
              onChange={handleChange}
              inputRef={serviceAddressRef}
              onKeyDown={e => handleKeyDown(e, serviceAddressRef)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Postal Code'
              name='postalCode'
              value={formData.postalCode}
              onChange={handleChange}
              inputRef={postalCodeRef}
              onKeyDown={e => handleKeyDown(e, postalCodeRef)}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='PO Number'
              name='poNumber'
              value={formData.poNumber || ''}
              onChange={handleChange}
              inputRef={poNumberRef}
              onKeyDown={e => handleKeyDown(e, poNumberRef)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <AppReactDatepicker
              selected={formData.poExpiry}
              id='po-expiry-date'
              onChange={date => handleDateChange('poExpiry', date, poExpiryRef)}
              placeholderText='Select PO Expiry Date'
              dateFormat='dd/MM/yyyy'
              customInput={<CustomTextField label='PO Expiry Date' fullWidth inputRef={poExpiryRef} />}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <CustomTextField
              type='time'
              fullWidth
              label='Preferred Time'
              name='preferredTime'
              value={formData.preferredTime}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              inputRef={preferredTimeRef}
              onKeyDown={e => handleKeyDown(e, preferredTimeRef)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Service Report Email'
              name='reportEmail'
              value={formData.reportEmail}
              onChange={e => {
                const value = e.target.value
                setFormData(prev => ({ ...prev, reportEmail: value }))
                // Keep standard email validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                setReportEmailError(value && !emailRegex.test(value))
              }}
              error={reportEmailError}
              helperText={reportEmailError ? 'Please enter a valid email address' : ''}
              inputRef={reportEmailRef}
              onKeyDown={e => handleKeyDown(e, reportEmailRef)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Site Contact Person Name'
              name='contactPerson'
              value={formData.contactPerson || ''}
              onChange={handleChange}
              inputRef={contactPersonRef}
              onKeyDown={e => handleKeyDown(e, contactPersonRef)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Site Incharge Phone Number'
              name='sitePhone'
              value={formData.sitePhone}
              onChange={e => {
                let value = e.target.value.replace(/\D/g, '')
                if (value.length > 5) value = value.slice(0, 5) + ' ' + value.slice(5, 10)
                setFormData(prev => ({ ...prev, sitePhone: value }))
              }}
              inputRef={sitePhoneRef}
              onKeyDown={e => handleKeyDown(e, sitePhoneRef)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Mobile'
              name='mobile'
              value={formData.mobile}
              onChange={e => {
                let value = e.target.value.replace(/\D/g, '')
                if (value.length > 5) value = value.slice(0, 5) + ' ' + value.slice(5, 10)
                setFormData(prev => ({ ...prev, mobile: value }))
              }}
              inputRef={mobileRef}
              onKeyDown={e => handleKeyDown(e, mobileRef)}
            />
          </Grid>
          {renderAutocomplete({
            name: 'callType',
            label: 'Call Type',
            options: cleanOptions(dropdowns.callTypes?.map(c => c.name))
          })}

          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Group Code'
              name='groupCode'
              value={formData.groupCode}
              onChange={handleChange}
              inputRef={groupCodeRef}
              onKeyDown={e => handleKeyDown(e, groupCodeRef)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <AppReactDatepicker
              selected={formData.startDate}
              id='start-date'
              onChange={date => handleDateChange('startDate', date, startDateRef)}
              placeholderText='Select Start Date'
              dateFormat='dd/MM/yyyy'
              customInput={<CustomTextField label='Start Date' fullWidth inputRef={startDateRef} />}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <AppReactDatepicker
              selected={formData.endDate}
              id='end-date'
              onChange={date => handleDateChange('endDate', date, endDateRef)}
              placeholderText='Select End Date'
              dateFormat='dd/MM/yyyy'
              customInput={<CustomTextField label='End Date' fullWidth inputRef={endDateRef} />}
              minDate={formData.startDate}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <AppReactDatepicker
              selected={formData.reminderDate}
              id='reminder-date'
              onChange={date => handleDateChange('reminderDate', date, reminderDateRef)}
              placeholderText='Select Reminder Date'
              dateFormat='dd/MM/yyyy'
              customInput={<CustomTextField label='Reminder Date' fullWidth inputRef={reminderDateRef} />}
              minDate={formData.startDate}
              maxDate={formData.endDate}
            />
          </Grid>
          {renderAutocomplete({
            name: 'industry',
            label: 'Industry',
            options: cleanOptions(dropdowns.industries?.map(i => i.name))
          })}

          <Grid item xs={12} md={3}>
            <CustomTextField
              type='text'
              fullWidth
              label='Contract Value'
              name='contractValue'
              value={formData.contractValue}
              onChange={handleChange}
              inputRef={contractValueRef}
              onKeyDown={e => handleKeyDown(e, contractValueRef)}
            />
          </Grid>
          {renderAutocomplete({
            name: 'technician',
            label: 'Technician',
            options: cleanOptions(
              dropdowns.employees?.filter(e => e.designation === 'Technician')?.map(e => e.nick_name || e.name)
            )
          })}

          {renderAutocomplete({
            name: 'paymentTerm',
            label: 'Payment Term',
            options: autocompleteFields.find(f => f.name === 'paymentTerm').options
          })}
          {renderAutocomplete({
            name: 'salesPerson',
            label: 'Sales Person',
            options: autocompleteFields.find(f => f.name === 'salesPerson').options,
            gridProps: { xs: 12, md: 6 }
          })}
          {renderAutocomplete({
            name: 'supervisor',
            label: 'Supervisor',
            options: cleanOptions(
              dropdowns.employees
                ?.filter(e => e.designation?.toLowerCase() === 'supervisor')
                ?.map(e => e.nick_name || e.name)
            )
          })}

          {renderAutocomplete({
            name: 'billingFrequency',
            label: 'Billing Frequency',
            options: cleanOptions(dropdowns.billingFrequencies?.map(b => b.name))
          })}

          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='No. of Invoice'
              name='invoiceCount'
              value={formData.invoiceCount || ''}
              onChange={handleChange}
              inputRef={invoiceCountRef}
              onKeyDown={e => handleKeyDown(e, invoiceCountRef)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Invoice Remarks'
              name='invoiceRemarks'
              value={formData.invoiceRemarks}
              onChange={handleChange}
              inputRef={invoiceRemarksRef}
              onKeyDown={e => handleKeyDown(e, invoiceRemarksRef)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Latitude'
              name='latitude'
              value={formData.latitude}
              onChange={handleChange}
              inputRef={latitudeRef}
              onKeyDown={e => handleKeyDown(e, latitudeRef)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Longitude'
              name='longitude'
              value={formData.longitude}
              onChange={handleChange}
              inputRef={longitudeRef}
              onKeyDown={e => handleKeyDown(e, longitudeRef)}
            />
          </Grid>

          {/* 💡 UPDATED FILE UPLOAD SECTION - Includes View Button */}
          <Grid item xs={12} md={6}>
            <Typography variant='body2' sx={{ mb: 1, fontWeight: 500 }}>
              Upload File
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'stretch' }}>
              <input
                type='file'
                ref={fileInputRef}
                style={{ display: 'none' }}
                name='file'
                onChange={handleNativeFileChange}
              />
              <GlobalButton
                variant='outlined'
                fullWidth
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleFileDrop}
                ref={fileUploadButtonRef}
                onKeyDown={e => handleKeyDown(e, fileUploadButtonRef)}
                sx={{
                  justifyContent: 'space-between',
                  borderColor: 'black',
                  borderStyle: isDragOver ? 'dashed' : 'solid',
                  borderWidth: 1,
                  py: 1.5,
                  flexGrow: 1
                }}
              >
                <Typography
                  sx={{
                    color: formData.uploadedFileName ? 'text.primary' : 'text.disabled',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {formData.uploadedFileName || 'Choose File or Drag & Drop Here'}
                </Typography>
              </GlobalButton>

              {/* View Button, visible if a file URL exists */}
              {formData.uploadedFileURL && (
                <IconButton
                  color='primary'
                  onClick={handleViewFile}
                  sx={{ border: '1px solid currentColor', borderRadius: '8px', p: 1.5 }}
                  title='View Uploaded File'
                >
                  <VisibilityIcon />
                </IconButton>
              )}
            </Box>
          </Grid>
          {/* 💡 END UPDATED FILE UPLOAD SECTION */}

          {/* --- PEST ITEM INPUTS (Updated) --- */}
          <Grid item xs={12}>
            <Typography variant='h6' sx={{ mb: 4, mt: 4 }}>
              Pest Item Details ({editingItemId ? 'Editing Mode' : 'Add Mode'})
            </Typography>
          </Grid>

          {/* Row 10 - Pest, Frequency, Pest Count, Pest Value, Total */}
          <Grid item xs={12} md={2.4}>
            {/* Pest Autocomplete */}
            <Autocomplete
              ref={refs.pestRef}
              freeSolo={false}
              options={cleanOptions(dropdowns.pests?.map(p => p.name) || [])}
              getOptionLabel={option => (typeof option === 'string' ? option : option?.label || '')}
              value={currentPestItem.pest}
              open={openStates.pestOpen}
              onFocus={() => setOpenStates.pestSetOpen(true)}
              onBlur={() => setOpenStates.pestSetOpen(false)}
              onOpen={() => setOpenStates.pestSetOpen(true)}
              onClose={() => setOpenStates.pestSetOpen(false)}
              onChange={(e, newValue) => handleCurrentPestItemAutocompleteChange('pest', newValue, refs.pestInputRef)}
              onInputChange={(e, newValue) => setCurrentPestItem(prev => ({ ...prev, pest: newValue }))}
              onKeyDown={e => handleKeyDown(e, refs.pestInputRef)}
              noOptionsText='No options'
              renderInput={params => <CustomTextField {...params} label='Pest' inputRef={refs.pestInputRef} />}
            />
          </Grid>
          <Grid item xs={12} md={2.4}>
            <Autocomplete
              ref={refs.frequencyRef}
              freeSolo={false}
              options={cleanOptions(dropdowns.serviceFrequency?.map(f => f.name) || [])}
              getOptionLabel={option => (typeof option === 'string' ? option : option?.label || '')}
              value={currentPestItem.frequency}
              open={openStates.frequencyOpen}
              onFocus={() => setOpenStates.frequencySetOpen(true)}
              onBlur={() => setOpenStates.frequencySetOpen(false)}
              onOpen={() => setOpenStates.frequencySetOpen(true)}
              onClose={() => setOpenStates.frequencySetOpen(false)}
              onChange={(e, newValue) =>
                handleCurrentPestItemAutocompleteChange('frequency', newValue, refs.frequencyInputRef)
              }
              onInputChange={(e, newValue) => setCurrentPestItem(prev => ({ ...prev, frequency: newValue }))}
              onKeyDown={e => handleKeyDown(e, refs.frequencyInputRef)}
              noOptionsText='No options'
              renderInput={params => (
                <CustomTextField {...params} label='Frequency' inputRef={refs.frequencyInputRef} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={2.4}>
            {/* Pest Count */}
            <CustomTextField
              fullWidth
              label='Pest Count'
              name='pestCount'
              value={currentPestItem.pestCount || ''}
              onChange={handleCurrentPestItemChange}
              inputRef={currentPestCountRef}
              onKeyDown={e => handleKeyDown(e, currentPestCountRef)}
            />
          </Grid>
          <Grid item xs={12} md={2.4}>
            {/* Pest Value */}
            <CustomTextField
              type='text'
              fullWidth
              label='Pest Value'
              name='pestValue'
              value={currentPestItem.pestValue || ''}
              onChange={handleCurrentPestItemChange}
              inputRef={currentPestValueRef}
              onKeyDown={e => handleKeyDown(e, currentPestValueRef)}
            />
          </Grid>
          <Grid item xs={12} md={2.4}>
            {/* Total */}
            <CustomTextField
              fullWidth
              label='Total'
              name='total'
              value={currentPestItem.total || ''}
              onChange={handleCurrentPestItemChange}
              inputRef={currentTotalRef}
              onKeyDown={e => handleKeyDown(e, currentTotalRef)}
              disabled
            />
          </Grid>

          {/* Row 11 - Time, Chemicals, No of Items, +ADD/UPDATE PEST Button */}
          <Grid item xs={12} md={3}>
            {/* Time Autocomplete */}
            <Autocomplete
              ref={refs.timeRef}
              freeSolo={false}
              options={autocompleteFields.find(f => f.name === 'time').options}
              getOptionLabel={option => (typeof option === 'string' ? option : option?.label || '')}
              value={currentPestItem.time}
              open={openStates.timeOpen}
              onFocus={() => setOpenStates.timeSetOpen(true)}
              onBlur={() => setOpenStates.timeSetOpen(false)}
              onOpen={() => setOpenStates.timeSetOpen(true)}
              onClose={() => setOpenStates.timeSetOpen(false)}
              onInputChange={(e, newValue, reason) =>
                handleAutocompleteInputChange(
                  'time',
                  autocompleteFields.find(f => f.name === 'time').options,
                  newValue,
                  reason
                )
              }
              onChange={(e, newValue) => handleCurrentPestItemAutocompleteChange('time', newValue, refs.timeInputRef)}
              onKeyDown={e => handleKeyDown(e, refs.timeInputRef)}
              noOptionsText='No options'
              renderInput={params => <CustomTextField {...params} label='Time' inputRef={refs.timeInputRef} />}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            {/* Chemicals */}
            <Autocomplete
              ref={refs.chemicalsRef}
              freeSolo={false}
              options={cleanOptions(dropdowns.chemicals?.map(c => c.name) || [])}
              getOptionLabel={option => (typeof option === 'string' ? option : option?.label || '')}
              value={currentPestItem.chemicals}
              open={openStates.chemicalsOpen}
              onFocus={() => setOpenStates.chemicalsSetOpen(true)}
              onBlur={() => setOpenStates.chemicalsSetOpen(false)}
              onOpen={() => setOpenStates.chemicalsSetOpen(true)}
              onClose={() => setOpenStates.chemicalsSetOpen(false)}
              onChange={(e, newValue) =>
                handleCurrentPestItemAutocompleteChange('chemicals', newValue, currentChemicalsRef)
              }
              onInputChange={(e, newValue) => setCurrentPestItem(prev => ({ ...prev, chemicals: newValue }))}
              onKeyDown={e => handleKeyDown(e, currentChemicalsRef)}
              noOptionsText='No options'
              renderInput={params => <CustomTextField {...params} label='Chemicals' inputRef={currentChemicalsRef} />}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            {/* No of Items */}
            <CustomTextField
              type='text'
              fullWidth
              label='No of Items'
              name='noOfItems'
              value={currentPestItem.noOfItems || ''}
              onChange={handleCurrentPestItemChange}
              inputRef={currentNoOfItemsRef}
              onKeyDown={e => handleKeyDown(e, currentNoOfItemsRef)}
            />
          </Grid>
          <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'flex-end' }}>
            <GlobalButton
              variant='contained'
              fullWidth
              onClick={handleSavePestItem} // Use the new save handler
              // Change icon based on mode
              ref={addPestButtonRef}
              onKeyDown={e => handleKeyDown(e, addPestButtonRef)}
              // --- CHANGES MADE HERE ---
              color={editingItemId ? 'success' : 'primary'} // UPDATE PEST is now 'success' (green)
              // -------------------------
            >
              {editingItemId ? 'UPDATE PEST' : 'ADD PEST'} {/* Change text based on mode */}
            </GlobalButton>
          </Grid>

          {/* ---------------------------------------------------- */}
          {/* --- PEST ITEMS TABLE (MUI DESIGN - Left Aligned) --- */}
          {/* ---------------------------------------------------- */}
          <Grid item xs={12} sx={{ mt: 4 }}>
            <Box sx={{ overflowX: 'auto', border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Table sx={{ minWidth: 950 }}>
                <TableHead>
                  <TableRow>
                    {/* All headers are left-aligned or explicitly set */}
                    <TableCell sx={{ width: '5%' }}>#</TableCell>
                    <TableCell align='center' sx={{ width: '10%' }}>
                      Action
                    </TableCell>
                    <TableCell sx={{ width: '15%' }}>Pest</TableCell>
                    <TableCell sx={{ width: '12%' }}>Frequency</TableCell>
                    <TableCell sx={{ width: '10%' }}>Pest Value</TableCell>
                    <TableCell sx={{ width: '10%' }}>Total Value</TableCell>
                    <TableCell sx={{ width: '10%' }}>Work Time</TableCell>
                    <TableCell sx={{ width: '20%' }}>Chemicals</TableCell>
                    <TableCell sx={{ width: '8%' }}>No Of Items</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pestItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align='center' sx={{ fontStyle: '', color: 'text.secondary' }}>
                        No pest added
                      </TableCell>
                    </TableRow>
                  ) : (
                    pestItems.map((item, index) => (
                      <TableRow
                        key={item.id}
                        // --- CHANGES MADE HERE ---
                        // Removed orange highlight for editing row
                        sx={{ backgroundColor: editingItemId === item.id ? 'inherit' : 'inherit' }}
                        // -------------------------
                      >
                        {/* Data cells are now left-aligned */}
                        <TableCell>{index + 1}</TableCell>
                        <TableCell align='center'>
                          {/* Action Buttons remain centered */}

                          <IconButton
                            size='small'
                            color='error'
                            onClick={() => handleDeletePestItem(item.id)}
                            sx={{ p: 1 }}
                          >
                            <DeleteIcon fontSize='small' />
                          </IconButton>
                          <IconButton
                            size='small'
                            color=''
                            onClick={() => handleEditPestItem(item)}
                            disabled={editingItemId === item.id}
                            sx={{ p: 1 }}
                          >
                            <EditIcon fontSize='small' />
                          </IconButton>
                        </TableCell>
                        <TableCell>{item.pest}</TableCell>
                        <TableCell>{item.frequency}</TableCell>
                        <TableCell>{item.pestValue}</TableCell>
                        <TableCell>{item.totalValue}</TableCell>
                        <TableCell>{item.workTime}</TableCell>
                        <TableCell>{item.chemicals}</TableCell>
                        <TableCell>{item.noOfItems}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
          </Grid>
          {/* --- END PEST ITEMS TABLE --- */}

          {/* Row 12 - Multiline Text Fields (Unchanged) */}
          <Grid item xs={4}>
            <CustomTextField
              multiline
              rows={2}
              fullWidth
              label='Billing Remarks'
              name='billingRemarks'
              value={formData.billingRemarks}
              onChange={handleChange}
              inputRef={billingRemarksRef}
              onKeyDown={e => handleKeyDown(e, billingRemarksRef, true)}
            />
          </Grid>
          <Grid item xs={4}>
            <CustomTextField
              multiline
              rows={2}
              fullWidth
              label='Agreement Add On 1'
              name='agreement1'
              value={formData.agreement1}
              onChange={handleChange}
              inputRef={agreement1Ref}
              onKeyDown={e => handleKeyDown(e, agreement1Ref, true)}
            />
          </Grid>
          <Grid item xs={4}>
            <CustomTextField
              multiline
              rows={2}
              fullWidth
              label='Agreement Add On 2'
              name='agreement2'
              value={formData.agreement2}
              onChange={handleChange}
              inputRef={agreement2Ref}
              onKeyDown={e => handleKeyDown(e, agreement2Ref, true)}
            />
          </Grid>
          <Grid item xs={6}>
            <CustomTextField
              multiline
              rows={2}
              fullWidth
              label='Remarks for Technician (Repeat every service)'
              name='technicianRemarks'
              value={formData.technicianRemarks}
              onChange={handleChange}
              inputRef={technicianRemarksRef}
              onKeyDown={e => handleKeyDown(e, technicianRemarksRef, true)}
            />
          </Grid>
          <Grid item xs={6}>
            <CustomTextField
              multiline
              rows={2}
              fullWidth
              label='Appointment Remarks (For Office View only)'
              name='appointmentRemarks'
              value={formData.appointmentRemarks}
              onChange={handleChange}
              inputRef={appointmentRemarksRef}
              onKeyDown={e => handleKeyDown(e, appointmentRemarksRef, true)}
            />
          </Grid>

          {/* Actions */}
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 4, pt: 8 }}>
            <GlobalButton variant='outlined' onClick={() => router.push('/admin/contracts')} ref={closeButtonRef}>
              Close
            </GlobalButton>
            <GlobalButton variant='contained' onClick={handleSubmit} ref={saveButtonRef}>
              Save
            </GlobalButton>
          </Grid>
        </Grid>
      </Card>

      {/* 💡 NEW: Image Dialog for file preview */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth='md' fullWidth>
        <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {formData.uploadedFileURL && (
            <img
              src={formData.uploadedFileURL}
              alt='Uploaded File Preview'
              style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
            />
          )}
        </DialogContent>
      </Dialog>
    </ContentLayout>
  )
}
