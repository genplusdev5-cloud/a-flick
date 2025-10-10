'use client'

import { useState, useRef, useCallback } from 'react'
import { Box, Button, Grid, Card, Typography } from '@mui/material'
import { useRouter } from 'next/navigation'
import CloseIcon from '@mui/icons-material/Close'
import SaveIcon from '@mui/icons-material/Save'

// Layout + Inputs (Assuming these paths are correct)
import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import { Autocomplete } from '@mui/material'

// Function to safely get contracts from Local Storage
const getContracts = () => {
  try {
    const savedContracts = localStorage.getItem('contracts')
    return JSON.parse(savedContracts || '[]')
  } catch (error) {
    console.error('Error reading contracts from localStorage:', error)
    return []
  }
}

// Function to safely save contracts to Local Storage
const saveContracts = contracts => {
  try {
    localStorage.setItem('contracts', JSON.stringify(contracts))
  } catch (error) {
    console.error('Error writing contracts to localStorage:', error)
  }
}

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
    customer: '',
    contractType: '',
    coveredLocation: '',
    contractCode: '',
    serviceAddress: '',
    postalCode: '',
    accountItemCode: '',
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
    file: '',
    pest: '',
    frequency: '',
    pestCount: '',
    pestValue: '',
    total: '',
    time: '',
    chemicals: '',
    noOfItems: '',
    billingRemarks: '',
    agreement1: '',
    agreement2: '',
    technicianRemarks: '',
    appointmentRemarks: ''
  })
  const [reportEmailError, setReportEmailError] = useState(false)
  const [selectedFile, setSelectedFile] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)

  // Autocomplete Fields Definition (Unchanged)
  const autocompleteFields = [
    { name: 'salesMode', options: ['Confirmed Sales', 'Quotation'] },
    { name: 'customer', options: ['GP Industries Pvt Ltd'] },
    { name: 'contractType', options: ['Continuous Contract', 'Limited Contract', 'Continuous Job', 'Job', 'Warranty'] },
    { name: 'accountItemCode', options: ['1001 Insect Monitoring Traps', 'A-CA/FL', 'A-CA/MQ', 'A-ST/CR/RD/CA'] },
    { name: 'callType', options: ['Call & Fix', 'Schedule', 'SMS', 'E-mail'] },
    { name: 'industry', options: ['Commercial', 'Food And Beverages', 'Residential'] },
    { name: 'technician', options: ['Admin', 'Tech'] },
    { name: 'paymentTerm', options: ['0 days', '30 days'] },
    { name: 'salesPerson', options: ['Admin'] },
    { name: 'supervisor', options: ['Admin'] },
    { name: 'billingFrequency', options: ['Monthly-X12', 'Yearly-X1'] },
    { name: 'pest', options: ['Bats', '1ILT'] },
    { name: 'frequency', options: ['Monthly', 'Weekly'] },
    { name: 'time', options: ['0:05', '0:10', '0:15'] }
  ]

  // Dynamic Refs and Open States for Autocomplete (Unchanged)
  const refs = {}
  const openStates = {}
  const setOpenStates = {}

  autocompleteFields.forEach(({ name }) => {
    // Refs for Autocomplete component and its input
    refs[name + 'Ref'] = useRef(null)
    refs[name + 'InputRef'] = useRef(null)

    // State for controlling Autocomplete dropdown open/close
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [isOpen, setIsOpen] = useState(false)
    openStates[name + 'Open'] = isOpen
    setOpenStates[name + 'SetOpen'] = setIsOpen
  })

  // Explicit Refs for CustomTextFields and Datepickers (Unchanged)
  const coveredLocationRef = useRef(null)
  const contractCodeRef = useRef(null)
  const serviceAddressRef = useRef(null)
  const postalCodeRef = useRef(null)
  const poNumberRef = useRef(null)
  const poExpiryRef = useRef(null)
  const preferredTimeRef = useRef(null)
  const reportEmailRef = useRef(null)
  const contactPersonRef = useRef(null)
  const sitePhoneRef = useRef(null)
  const mobileRef = useRef(null)
  const groupCodeRef = useRef(null)
  const startDateRef = useRef(null)
  const endDateRef = useRef(null)
  const reminderDateRef = useRef(null)
  const contractValueRef = useRef(null)
  const invoiceCountRef = useRef(null)
  const invoiceRemarksRef = useRef(null)
  const latitudeRef = useRef(null)
  const longitudeRef = useRef(null)
  const fileInputRef = useRef(null)
  const fileUploadButtonRef = useRef(null)
  const pestCountRef = useRef(null)
  const pestValueRef = useRef(null)
  const totalRef = useRef(null)
  const chemicalsRef = useRef(null)
  const noOfItemsRef = useRef(null)
  const billingRemarksRef = useRef(null)
  const agreement1Ref = useRef(null)
  const agreement2Ref = useRef(null)
  const technicianRemarksRef = useRef(null)
  const appointmentRemarksRef = useRef(null)
  const closeButtonRef = useRef(null)
  const saveButtonRef = useRef(null)

  // Group all focusable element refs for keyboard navigation sequence (Unchanged)
  const focusableElementRefs = [
    refs.salesModeInputRef,
    refs.customerInputRef,
    refs.contractTypeInputRef,
    coveredLocationRef,
    contractCodeRef,
    serviceAddressRef,
    postalCodeRef,
    refs.accountItemCodeInputRef,
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
    refs.pestInputRef,
    refs.frequencyInputRef,
    pestCountRef,
    pestValueRef,
    totalRef,
    refs.timeInputRef,
    chemicalsRef,
    noOfItemsRef,
    billingRemarksRef,
    agreement1Ref,
    agreement2Ref,
    technicianRemarksRef,
    appointmentRemarksRef,
    closeButtonRef,
    saveButtonRef
  ].filter(ref => ref)

  // ----------------------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------------------

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
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
    [...Object.values(refs), ...Object.values(setOpenStates), ...focusableElementRefs, saveButtonRef]
  )

  // Universal onKeyDown handler for all inputs and autocompletes (Unchanged)
  const handleKeyDown = (e, currentRef, isMultiline = false) => {
    if (e.key === 'Enter') {
      if (isMultiline && e.shiftKey) {
        return
      }

      e.preventDefault()
      focusNextElement(currentRef)
    }
  }

  // Autocomplete change handler that also moves focus (Unchanged)
  const handleAutocompleteChange = (name, newValue, currentInputRef) => {
    setFormData(prev => ({ ...prev, [name]: newValue }))
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
    setFormData(prev => ({ ...prev, [name]: newValue }))
  }

  // Datepicker change handler that also moves focus (Unchanged)
  const handleDateChange = (name, date, currentInputRef) => {
    setFormData(prev => ({ ...prev, [name]: date }))
    focusNextElement(currentInputRef)
  }

  // File handler functions (Unchanged)
  const handleFileChange = file => {
    if (file) {
      setSelectedFile(file.name)
      setFormData(prev => ({ ...prev, file: file }))
    } else {
      setSelectedFile('')
      setFormData(prev => ({ ...prev, file: '' }))
    }
  }

  const handleNativeFileChange = e => {
    const file = e.target.files?.[0] || null
    handleFileChange(file)
    focusNextElement(fileUploadButtonRef)
  }

  const handleFileDrop = e => {
    e.preventDefault()
    setIsDragOver(false)
    const droppedFiles = e.dataTransfer.files
    const file = droppedFiles?.[0] || null
    handleFileChange(file)
  }

  const handleDragOver = e => {
    e.preventDefault()
    setIsDragOver(true)
  }
  const handleDragLeave = e => {
    e.preventDefault()
    setIsDragOver(false)
  }

  // 🔴 IMPORTANT: Logic to Save to Local Storage and Redirect
  const handleSubmit = () => {
    const newContract = {
      ...formData,
      id: generateUniqueId(), // Generate unique ID for DataGrid key
      // Convert Date objects to strings for storage (optional, but safer)
      poExpiry: formData.poExpiry.toISOString(),
      startDate: formData.startDate.toISOString(),
      endDate: formData.endDate.toISOString(),
      reminderDate: formData.reminderDate.toISOString()
    }

    // 1. Get existing contracts
    const existingContracts = getContracts()

    // 2. Add new contract
    const updatedContracts = [newContract, ...existingContracts]

    // 3. Save updated list back to local storage
    saveContracts(updatedContracts)

    // 4. Redirect to list page
    router.push('/admin/contracts')
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
          value={formData[name]}
          open={isOpen}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          onOpen={() => setIsOpen(true)}
          onClose={() => setIsOpen(false)}
          onInputChange={(e, newValue, reason) => handleAutocompleteInputChange(name, options, newValue, reason)}
          onChange={(e, newValue) => handleAutocompleteChange(name, newValue, inputRef)}
          onKeyDown={e => handleKeyDown(e, inputRef)}
          noOptionsText='No options'
          renderInput={params => <CustomTextField {...params} label={label} inputRef={inputRef} />}
        />
      </Grid>
    )
  }

  // ----------------------------------------------------------------------
  // Form Structure (Unchanged)
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
          {/* Row 1 */}
          {renderAutocomplete({
            name: 'salesMode',
            label: 'Sales Mode',
            options: autocompleteFields.find(f => f.name === 'salesMode').options
          })}
          {renderAutocomplete({
            name: 'customer',
            label: 'Customer',
            options: autocompleteFields.find(f => f.name === 'customer').options
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

          {/* Row 2 */}
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
          {renderAutocomplete({
            name: 'accountItemCode',
            label: 'Account Item Code',
            options: autocompleteFields.find(f => f.name === 'accountItemCode').options
          })}

          {/* Row 3 */}
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='PO Number'
              name='poNumber'
              value={formData.poNumber || ''}
              onChange={e => {
                const numericValue = e.target.value.replace(/\D/g, '')
                setFormData(prev => ({ ...prev, poNumber: numericValue }))
              }}
              inputRef={poNumberRef}
              onKeyDown={e => handleKeyDown(e, poNumberRef)}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
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
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                setReportEmailError(value && !emailRegex.test(value))
              }}
              error={reportEmailError}
              helperText={reportEmailError ? 'Please enter a valid email address' : ''}
              inputRef={reportEmailRef}
              onKeyDown={e => handleKeyDown(e, reportEmailRef)}
            />
          </Grid>

          {/* Row 4 */}
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Site Contact Person Name'
              name='contactPerson'
              value={formData.contactPerson || ''}
              onChange={e => {
                const onlyLetters = e.target.value.replace(/[^A-Za-z\s]/g, '')
                setFormData(prev => ({ ...prev, contactPerson: onlyLetters }))
              }}
              inputRef={contactPersonRef}
              onKeyDown={e => handleKeyDown(e, contactPersonRef)}
              inputProps={{ inputMode: 'text', pattern: '[A-Za-z ]*' }}
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
            options: autocompleteFields.find(f => f.name === 'callType').options
          })}

          {/* Row 5 (Dates) */}
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

          {/* Row 6 - Reordered as requested */}
          {renderAutocomplete({
            name: 'industry',
            label: 'Industry',
            options: autocompleteFields.find(f => f.name === 'industry').options
          })}
          <Grid item xs={12} md={3}>
            <CustomTextField
              type='text'
              fullWidth
              label='Contract Value'
              name='contractValue'
              value={formData.contractValue}
              onChange={e => {
                const value = e.target.value.replace(/\D/g, '')
                setFormData(prev => ({ ...prev, contractValue: value }))
              }}
              inputRef={contractValueRef}
              onKeyDown={e => handleKeyDown(e, contractValueRef)}
            />
          </Grid>
          {renderAutocomplete({
            name: 'technician',
            label: 'Technicians',
            options: autocompleteFields.find(f => f.name === 'technician').options
          })}
          {renderAutocomplete({
            name: 'paymentTerm',
            label: 'Payment Term',
            options: autocompleteFields.find(f => f.name === 'paymentTerm').options
          })}

          {/* Row 7 - Reordered as requested */}
          {renderAutocomplete({
            name: 'salesPerson',
            label: 'Sales Person',
            options: autocompleteFields.find(f => f.name === 'salesPerson').options,
            gridProps: { xs: 12, md: 6 }
          })}
          {renderAutocomplete({
            name: 'supervisor',
            label: 'Supervisor',
            options: autocompleteFields.find(f => f.name === 'supervisor').options,
            gridProps: { xs: 12, md: 6 }
          })}

          {/* Row 8 - Reordered as requested */}
          {renderAutocomplete({
            name: 'billingFrequency',
            label: 'Billing Frequency',
            options: autocompleteFields.find(f => f.name === 'billingFrequency').options
          })}
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='No. of Invoice'
              name='invoiceCount'
              value={formData.invoiceCount || ''}
              onChange={e => {
                const numericValue = e.target.value.replace(/\D/g, '')
                setFormData(prev => ({ ...prev, invoiceCount: numericValue }))
              }}
              inputRef={invoiceCountRef}
              onKeyDown={e => handleKeyDown(e, invoiceCountRef)}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
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

          {/* Row 9 - Reordered as requested */}
          <Grid item xs={12} md={6}>
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

          <Grid item xs={12} md={6}>
            <Typography variant='body2' sx={{ mb: 1, fontWeight: 500 }}>
              Upload File
            </Typography>
            {/* Hidden native file input */}
            <input
              type='file'
              ref={fileInputRef}
              style={{ display: 'none' }}
              name='file'
              onChange={handleNativeFileChange}
            />
            {/* Button that acts as the drop zone */}
            <Button
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
                '&:hover': { borderColor: 'black' }
              }}
            >
              <Typography sx={{ color: selectedFile ? 'text.primary' : 'text.disabled' }}>
                {selectedFile || 'Choose File or Drag & Drop Here'}
              </Typography>
            </Button>
          </Grid>

          {/* Row 10 - Reordered as requested */}
          {renderAutocomplete({
            name: 'pest',
            label: 'Pest',
            options: autocompleteFields.find(f => f.name === 'pest').options
          })}
          {renderAutocomplete({
            name: 'frequency',
            label: 'Frequency',
            options: autocompleteFields.find(f => f.name === 'frequency').options
          })}
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Pest Count'
              name='pestCount'
              value={formData.pestCount || ''}
              onChange={e => {
                const numericValue = e.target.value.replace(/\D/g, '')
                setFormData(prev => ({ ...prev, pestCount: numericValue }))
              }}
              inputRef={pestCountRef}
              onKeyDown={e => handleKeyDown(e, pestCountRef)}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <CustomTextField
              type='number'
              fullWidth
              label='Pest Value'
              name='pestValue'
              value={formData.pestValue || ''}
              onChange={handleChange}
              inputRef={pestValueRef}
              onKeyDown={e => handleKeyDown(e, pestValueRef)}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
              sx={{
                '& input[type=number]': {
                  MozAppearance: 'textfield'
                },
                '& input[type=number]::-webkit-outer-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0
                },
                '& input[type=number]::-webkit-inner-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0
                }
              }}
            />
          </Grid>

          {/* Row 11 - Reordered as requested */}
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Total'
              name='total'
              value={formData.total || ''}
              onChange={e => {
                const numericValue = e.target.value.replace(/\D/g, '')
                setFormData(prev => ({ ...prev, total: numericValue }))
              }}
              inputRef={totalRef}
              onKeyDown={e => handleKeyDown(e, totalRef)}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            />
          </Grid>
          {renderAutocomplete({
            name: 'time',
            label: 'Time',
            options: autocompleteFields.find(f => f.name === 'time').options
          })}
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Chemicals'
              name='chemicals'
              value={formData.chemicals}
              onChange={handleChange}
              inputRef={chemicalsRef}
              onKeyDown={e => handleKeyDown(e, chemicalsRef)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <CustomTextField
              type='number'
              fullWidth
              label='No of Items'
              name='noOfItems'
              value={formData.noOfItems || ''}
              onChange={e => {
                const numericValue = e.target.value.replace(/\D/g, '')
                setFormData(prev => ({ ...prev, noOfItems: numericValue }))
              }}
              inputRef={noOfItemsRef}
              onKeyDown={e => handleKeyDown(e, noOfItemsRef)}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
              sx={{
                '& input[type=number]': {
                  MozAppearance: 'textfield'
                },
                '& input[type=number]::-webkit-outer-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0
                },
                '& input[type=number]::-webkit-inner-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0
                }
              }}
            />
          </Grid>

          {/* Row 12 - Multiline Text Fields */}
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
              onKeyDown={e => handleKeyDown(e, billingRemarksRef, true)} // 👈 Multiline keydown
            />
          </Grid>
          <Grid item xs={4}>
            <CustomTextField
              multiline
              rows={2}
              fullWidth
              label='
Agreement Add On 1'
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
              label='
Agreement Add On 2'
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
              label='
Appointment Remarks (For Office View only)'
              name='appointmentRemarks'
              value={formData.appointmentRemarks}
              onChange={handleChange}
              inputRef={appointmentRemarksRef}
              onKeyDown={e => handleKeyDown(e, appointmentRemarksRef, true)}
            />
          </Grid>

          {/* Actions */}
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 4, pt: 8 }}>
            <Button variant='outlined' onClick={() => router.push('/admin/contracts')} ref={closeButtonRef}>
              Close
            </Button>
            <Button variant='contained' onClick={handleSubmit} ref={saveButtonRef}>
              Save
            </Button>
          </Grid>
        </Grid>
      </Card>
    </ContentLayout>
  )
}
