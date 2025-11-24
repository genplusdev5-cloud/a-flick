'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

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
  Dialog,
  DialogContent
} from '@mui/material'

import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import VisibilityIcon from '@mui/icons-material/Visibility'

import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import { Autocomplete } from '@mui/material'

import { getAllDropdowns } from '@/api/contract/dropdowns'
import { updateContract } from '@/api/contract/update'
import { getContractView } from '@/api/contract/viewStatus'

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------

const formatDateToAPIDate = date => {
  if (!date) return null
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return null
    return d.toISOString().split('T')[0] // yyyy-mm-dd
  } catch {
    return null
  }
}

const getOptionLabelDefault = option => {
  if (!option) return ''
  if (typeof option === 'string') return option
  if (typeof option === 'number') return String(option)
  if (typeof option === 'object') {
    return option.name || option.label || String(option.value ?? '')
  }
  return String(option)
}

const isOptionEqualToValueDefault = (option, value) => {
  if (!option || !value) return false
  if (typeof option === 'string' || typeof value === 'string') return option === value
  if (typeof option === 'number' || typeof value === 'number') return option === value
  if (option.id && value.id) return option.id === value.id
  if (option.value && value.value) return option.value === value.value
  return option === value
}

// ----------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------

export default function EditContractPage() {
  const router = useRouter()
  const { uuid } = useParams() // ← CHANGE THIS LINE ONLY

  // ----------------------------------------------------------------------
  // Static dropdowns (UI only)
  // ----------------------------------------------------------------------

  const salesModeOptions = [
    { label: 'Confirmed Sales', value: 'confirmed_sales' },
    { label: 'Quotation', value: 'quotation' }
  ]

  const contractTypeOptions = [
    { label: 'Continuous Contract', value: 'Continuous Contract' },
    { label: 'Limited Contract', value: 'Limited Contract' },
    { label: 'Continuous Job', value: 'Continuous Job' },
    { label: 'Job', value: 'Job' },
    { label: 'Warranty', value: 'Warranty' },
    { label: 'AMC update', value: 'AMC update' }
  ]

  const accountItemCodeOptions = ['1001 Insect Monitoring Traps', 'A-CA/FL', 'A-CA/MQ', 'A-ST/CR/RD/CA']

  const industryOptions = ['Commercial', 'Food And Beverages', 'Residential']

  const paymentTermOptions = ['0 days', '30 days']

  const timeOptions = ['0:05', '0:10', '0:15', '0:20', '0:30']

  // ----------------------------------------------------------------------
  // State
  // ----------------------------------------------------------------------

  const [dropdowns, setDropdowns] = useState({
    customers: [],
    callTypes: [],
    billingFreq: [],
    serviceFreq: [],
    pests: [],
    chemicals: [],
    employees: []
  })

  const [formData, setFormData] = useState({
    salesMode: null, // object from salesModeOptions
    customer: null, // object from dropdowns.customers
    contractType: null, // object from contractTypeOptions
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
    callType: null, // from dropdowns.callTypes
    groupCode: '',
    startDate: new Date(),
    endDate: new Date(),
    reminderDate: new Date(),
    industry: '',
    contractValue: '',
    technician: null, // employee object
    paymentTerm: '',
    salesPerson: null, // employee object
    supervisor: null, // employee object
    billingFrequency: null, // from dropdowns.billingFreq
    invoiceCount: '',
    invoiceRemarks: '',
    latitude: '',
    longitude: '',
    file: null,
    uploadedFileName: '',
    uploadedFileURL: '',
    billingRemarks: '',
    agreement1: '',
    agreement2: '',
    technicianRemarks: '',
    appointmentRemarks: '',
    // keep some original backend ids for safety if needed
    industryId: null,
    serviceFrequencyId: null
  })

  // Single pest item input
  const [currentPestItem, setCurrentPestItem] = useState({
    id: null,
    pest: '',
    pestId: null,
    frequency: '',
    frequencyId: null,
    pestCount: '',
    pestValue: '',
    total: '',
    time: '',
    chemicals: '',
    chemicalId: null,
    noOfItems: ''
  })

  // List of pest items
  const [pestItems, setPestItems] = useState([])

  const [editingItemId, setEditingItemId] = useState(null)

  const [reportEmailError, setReportEmailError] = useState(false)
  const [selectedFile, setSelectedFile] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)

  const [loading, setLoading] = useState(false)

  // ----------------------------------------------------------------------
  // Autocomplete refs (for keyboard navigation)
  // ----------------------------------------------------------------------

  const autocompleteFieldNames = [
    'salesMode',
    'customer',
    'contractType',
    'accountItemCode',
    'callType',
    'industry',
    'technician',
    'paymentTerm',
    'salesPerson',
    'supervisor',
    'billingFrequency',
    'pest',
    'frequency',
    'time'
  ]

  // ⬇️ MOVE THESE RIGHT HERE (Before forEach)
  const refs = {}
  const openStates = {}
  const setOpenStates = {}

  // Then this block runs safely
  autocompleteFieldNames.forEach(name => {
    refs[name + 'Ref'] = useRef(null)
    refs[name + 'InputRef'] = useRef(null)

    const [isOpen, setIsOpen] = useState(false)

    openStates[name + 'Open'] = isOpen
    setOpenStates[name + 'SetOpen'] = setIsOpen
  })

  // Explicit refs
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

  const currentPestCountRef = useRef(null)
  const currentPestValueRef = useRef(null)
  const currentTotalRef = useRef(null)
  const currentChemicalsRef = useRef(null)
  const currentNoOfItemsRef = useRef(null)
  const addPestButtonRef = useRef(null)

  const billingRemarksRef = useRef(null)
  const agreement1Ref = useRef(null)
  const agreement2Ref = useRef(null)
  const technicianRemarksRef = useRef(null)
  const appointmentRemarksRef = useRef(null)
  const closeButtonRef = useRef(null)
  const saveButtonRef = useRef(null)

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
    // Pest block
    refs.pestInputRef,
    refs.frequencyInputRef,
    currentPestCountRef,
    currentPestValueRef,
    currentTotalRef,
    refs.timeInputRef,
    currentChemicalsRef,
    currentNoOfItemsRef,
    addPestButtonRef,
    // Multiline / actions
    billingRemarksRef,
    agreement1Ref,
    agreement2Ref,
    technicianRemarksRef,
    appointmentRemarksRef,
    closeButtonRef,
    saveButtonRef
  ].filter(Boolean)

  // ----------------------------------------------------------------------
  // Focus helpers
  // ----------------------------------------------------------------------

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
            const nextAutocompleteField = autocompleteFieldNames.find(name => refs[name + 'InputRef'] === nextRef)
            if (nextAutocompleteField) {
              nextElement.focus()
              const setStateFunc = setOpenStates[nextAutocompleteField + 'SetOpen']
              if (setStateFunc) setStateFunc(true)
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

  const handleKeyDown = (e, currentRef, isMultiline = false) => {
    if (e.key === 'Enter') {
      if (isMultiline && e.shiftKey) return
      e.preventDefault()
      focusNextElement(currentRef)
    }
  }

  const loadContract = async () => {
    const res = await getContractView(uuid)
    const data = res?.data?.data || res?.data || {}

    console.log('Contract Data:', data)

    // --- Map main form ---
    setFormData(prev => ({
      ...prev,
      salesMode: salesModeOptions.find(o => o.value === data.sales_mode) || null,
      customer: dropdowns.customers.find(c => c.id === data.customer_id) || null,
      contractType: contractTypeOptions.find(c => c.value === data.contract_type) || null,
      coveredLocation: data.covered_location || '',
      contractCode: data.contract_code || '',
      serviceAddress: data.service_address || '',
      postalCode: data.postal_address || '',
      accountItemCode: data.account_item_id || '',
      poNumber: data.po_number || '',
      poExpiry: data.po_expiry_date ? new Date(data.po_expiry_date) : new Date(),
      preferredTime: data.preferred_time || '',
      reportEmail: data.report_email || '',
      contactPerson: data.contact_person_name || '',
      sitePhone: data.phone || '',
      mobile: data.mobile || '',
      callType: dropdowns.callTypes.find(ct => ct.id === data.call_type_id) || null,
      groupCode: data.group_code || '',
      startDate: data.start_date ? new Date(data.start_date) : new Date(),
      endDate: data.end_date ? new Date(data.end_date) : new Date(),
      reminderDate: data.reminder_date ? new Date(data.reminder_date) : new Date(),
      industry: data.category || '',
      industryId: data.industry_id || null,
      contractValue: data.contract_value || '',
      technician: dropdowns.employees.find(e => e.id === data.technician_id) || null,
      paymentTerm: data.billing_term || '',
      salesPerson: dropdowns.employees.find(e => e.id === data.sales_person_id) || null,
      supervisor: dropdowns.employees.find(e => e.id === data.supervisor_id) || null,
      billingFrequency: dropdowns.billingFreq.find(b => b.id === data.billing_frequency_id) || null,
      invoiceCount: data.invoice_count || '',
      invoiceRemarks: data.invoice_remarks || '',
      latitude: data.latitude || '',
      longitude: data.longitude || '',
      billingRemarks: data.billing_remarks || '',
      agreement1: data.agreement_add_1 || '',
      agreement2: data.agreement_add_2 || '',
      technicianRemarks: data.technician_remarks || '',
      appointmentRemarks: data.appointment_remarks || '',
      uploadedFileName: data.file_name_display || '',
      uploadedFileURL: data.floor_plan || ''
    }))

    // --- Pest items ---
    const items = data.pest_items || []
    setPestItems(
      items.map(item => ({
        id: item.id,
        pest: item.pest,
        pestId: item.pest_id,
        frequency: item.frequency,
        frequencyId: item.frequency_id,
        pestValue: item.pest_value,
        totalValue: item.total_value,
        workTime: item.work_time,
        chemicals: item.chemical || '',
        chemicalId: item.chemical_id || '',
        noOfItems: item.no_of_items || item.pest_service_count || '0'
      }))
    )
  }

  const loadDropdowns = async () => {
    try {
      const res = await getAllDropdowns()

      const data = res?.data?.data || res?.data || {}

      setDropdowns({
        customers: data.customers || [],
        callTypes: data.callTypes || [],
        billingFreq: data.billingFreq || [],
        serviceFreq: data.serviceFreq || [],
        pests: data.pests || [],
        chemicals: data.chemicals || [],
        employees: data.employees || []
      })

      console.log('Dropdowns Loaded:', data)
    } catch (error) {
      console.error('Failed to load dropdowns:', error)
    }
  }

  // ----------------------------------------------------------------------
  // Data load (dropdowns + contract)
  // ----------------------------------------------------------------------

// ----------------------------------------------------------------------
// Data load (dropdowns + contract)
// ----------------------------------------------------------------------

useEffect(() => {
  if (!uuid) return
  loadDropdowns()
}, [uuid])

useEffect(() => {
  if (dropdowns.customers.length === 0) return
  if (dropdowns.callTypes.length === 0) return
  loadContract()
}, [dropdowns, uuid]) // uuid add panniruken extra safety-ku

  // ----------------------------------------------------------------------
  // Form handlers
  // ----------------------------------------------------------------------

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAutocompleteChange = (name, newValue, currentInputRef) => {
    setFormData(prev => ({ ...prev, [name]: newValue }))
    const setStateFunc = setOpenStates[name + 'SetOpen']
    if (setStateFunc) setStateFunc(false)
    focusNextElement(currentInputRef)
  }

  const handleCurrentPestItemAutocompleteChange = (name, newValue, currentInputRef) => {
    setCurrentPestItem(prev => ({
      ...prev,
      [name]: typeof newValue === 'string' ? newValue : newValue?.name || ''
    }))

    // also track IDs if possible
    if (name === 'pest') {
      const opt = dropdowns.pests.find(p => p === newValue || p?.id === newValue?.id || p?.name === newValue?.name)
      setCurrentPestItem(prev => ({
        ...prev,
        pest: typeof newValue === 'string' ? newValue : newValue?.name || '',
        pestId: opt?.id || null
      }))
    }

    if (name === 'frequency') {
      const opt = dropdowns.serviceFreq.find(
        f => f === newValue || f?.id === newValue?.id || f?.name === newValue?.name
      )
      setCurrentPestItem(prev => ({
        ...prev,
        frequency: typeof newValue === 'string' ? newValue : newValue?.name || '',
        frequencyId: opt?.id || null
      }))
    }

    const setStateFunc = setOpenStates[name + 'SetOpen']
    if (setStateFunc) setStateFunc(false)
    focusNextElement(currentInputRef)
  }

  const handleAutocompleteInputChange = (name, _options, newValue, _reason) => {
    if (['pest', 'frequency', 'time'].includes(name)) {
      setCurrentPestItem(prev => ({ ...prev, [name]: newValue }))
    } else {
      setFormData(prev => ({ ...prev, [name]: newValue }))
    }
  }

  const handleDateChange = (name, date, currentInputRef) => {
    setFormData(prev => ({ ...prev, [name]: date }))
    focusNextElement(currentInputRef)
  }

  // ----------------------------------------------------------------------
  // File handlers
  // ----------------------------------------------------------------------

  const handleNativeFileChange = e => {
    const file = e.target.files?.[0] || null
    if (file) {
      setSelectedFile(file.name)
      const fileURL = URL.createObjectURL(file)
      setFormData(prev => ({
        ...prev,
        file,
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
    e.target.value = null
    focusNextElement(fileUploadButtonRef)
  }

  const handleFileDrop = e => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0] || null
    if (file) {
      setSelectedFile(file.name)
      const fileURL = URL.createObjectURL(file)
      setFormData(prev => ({
        ...prev,
        file,
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

  const handleViewFile = () => {
    if (formData.uploadedFileURL) setOpenDialog(true)
    else alert('No file available to view.')
  }

  const handleCloseDialog = () => setOpenDialog(false)

  // ----------------------------------------------------------------------
  // Pest item handlers
  // ----------------------------------------------------------------------

  const handleCurrentPestItemChange = e => {
    const { name, value } = e.target

    if (name === 'pestCount' || name === 'pestValue') {
      const newCount = name === 'pestCount' ? value : currentPestItem.pestCount
      const newVal = name === 'pestValue' ? value : currentPestItem.pestValue
      const countNum = Number(newCount || 0)
      const valNum = Number(newVal || 0)
      setCurrentPestItem(prev => ({
        ...prev,
        [name]: value,
        total: String(countNum * valNum)
      }))
      return
    }

    setCurrentPestItem(prev => ({ ...prev, [name]: value }))
  }

  const handleEditPestItem = item => {
    setCurrentPestItem({
      id: item.id,
      pest: item.pest,
      pestId: item.pestId || null,
      frequency: item.frequency,
      frequencyId: item.frequencyId || null,
      pestCount: item.noOfItems || '',
      pestValue: item.pestValue || '',
      total: item.totalValue || '',
      time: item.workTime || '',
      chemicals: item.chemicals || '',
      chemicalId: item.chemicalId || null,
      noOfItems: item.noOfItems || ''
    })
    setEditingItemId(item.id)
    refs.pestInputRef.current?.focus()
  }

  const handleSavePestItem = () => {
    if (!currentPestItem.pest || !currentPestItem.frequency) {
      alert('Pest and Frequency are required to add/update an item.')
      return
    }

    const itemPayload = {
      id: currentPestItem.id || null,
      pest: currentPestItem.pest,
      pestId: currentPestItem.pestId || null,
      frequency: currentPestItem.frequency,
      frequencyId: currentPestItem.frequencyId || null,
      chemicals: currentPestItem.chemicals || '',
      chemicalId: currentPestItem.chemicalId || null,
      pestValue: currentPestItem.pestValue || '0',
      totalValue: currentPestItem.total || '0',
      workTime: currentPestItem.time || '0',
      noOfItems: currentPestItem.noOfItems || currentPestItem.pestCount || '0'
    }

    if (editingItemId) {
      setPestItems(prev => prev.map(item => (item.id === editingItemId ? { ...item, ...itemPayload } : item)))
      setEditingItemId(null)
    } else {
      setPestItems(prev => [...prev, { ...itemPayload, id: itemPayload.id || Date.now().toString() }])
    }

    setCurrentPestItem({
      id: null,
      pest: '',
      pestId: null,
      frequency: '',
      frequencyId: null,
      pestCount: '',
      pestValue: '',
      total: '',
      time: '',
      chemicals: '',
      chemicalId: null,
      noOfItems: ''
    })
    refs.pestInputRef.current?.focus()
  }

  const handleDeletePestItem = idToDelete => {
    if (editingItemId === idToDelete) {
      setEditingItemId(null)
      setCurrentPestItem({
        id: null,
        pest: '',
        pestId: null,
        frequency: '',
        frequencyId: null,
        pestCount: '',
        pestValue: '',
        total: '',
        time: '',
        chemicals: '',
        chemicalId: null,
        noOfItems: ''
      })
    }
    setPestItems(prev => prev.filter(item => item.id !== idToDelete))
  }

  // ----------------------------------------------------------------------
  // Submit / Update
  // ----------------------------------------------------------------------

  const handleSubmit = async () => {
    try {
      setLoading(true)

      if (formData.uploadedFileURL && formData.file) {
        // if object URL created by this session, clean afterwards
        URL.revokeObjectURL(formData.uploadedFileURL)
      }

      const payload = {
        po_number: formData.poNumber || '',
        po_expiry_date: formatDateToAPIDate(formData.poExpiry),
        report_email: formData.reportEmail || '',
        sales_mode: formData.salesMode?.value || null,
        contract_code: formData.contractCode || '',
        contract_type: formData.contractType?.value || '',
        billing_term: formData.paymentTerm || '',
        customer_id: formData.customer?.id || null,
        covered_location: formData.coveredLocation || '',
        service_address: formData.serviceAddress || '',
        postal_address: formData.postalCode || '',
        account_item_id: formData.accountItemCode || null,
        contact_person_name: formData.contactPerson || '',
        phone: formData.sitePhone || '',
        mobile: formData.mobile || '',
        call_type_id: formData.callType?.id || null,
        preferred_time: formData.preferredTime || '',
        industry_id: formData.industryId || null,
        supervisor_id: formData.supervisor?.id || null,
        sales_person_id: formData.salesPerson?.id || null,
        technician_id: formData.technician?.id || null,
        contract_value: formData.contractValue ? Number(formData.contractValue) : 0,
        billing_frequency_id: formData.billingFrequency?.id || null,
        service_frequency_id: formData.serviceFrequencyId || null,
        invoice_count: formData.invoiceCount || '',
        invoice_remarks: formData.invoiceRemarks || '',
        latitude: formData.latitude || 0,
        longitude: formData.longitude || 0,
        agreement_add_1: formData.agreement1 || '',
        agreement_add_2: formData.agreement2 || '',
        billing_remarks: formData.billingRemarks || '',
        appointment_remarks: formData.appointmentRemarks || '',
        technician_remarks: formData.technicianRemarks || '',
        group_code: formData.groupCode || '',
        start_date: formatDateToAPIDate(formData.startDate),
        end_date: formatDateToAPIDate(formData.endDate),
        reminder_date: formatDateToAPIDate(formData.reminderDate),
        file_name_display: formData.uploadedFileName || null,
        floor_plan: formData.uploadedFileURL || null,
        // map pest items
        pest_items: pestItems.map(item => ({
          id: item.id || null,
          pest_id: item.pestId || null,
          frequency_id: item.frequencyId || null,
          chemical_id: item.chemicalId || null,
          pest_value: item.pestValue || '0',
          pest_service_count: item.noOfItems || '0',
          total_value: item.totalValue || '0',
          work_time: item.workTime || 0
        }))
      }

      await updateContract(uuid, payload)
      router.push('/admin/contracts')
    } catch (error) {
      console.error('Update contract error:', error)
      alert('Failed to update contract. Please check console for details.')
    } finally {
      setLoading(false)
    }
  }

  // ----------------------------------------------------------------------
  // Render helpers
  // ----------------------------------------------------------------------

  const renderAutocomplete = ({ name, label, options, gridProps = { xs: 12, md: 3 }, freeSolo = false }) => {
    const ref = refs[name + 'Ref']
    const inputRef = refs[name + 'InputRef']
    const isOpen = openStates[name + 'Open']
    const setIsOpen = setOpenStates[name + 'SetOpen']

    return (
      <Grid item {...gridProps} key={name}>
        <Autocomplete
          ref={ref}
          freeSolo={freeSolo}
          options={options || []}
          value={formData[name] || null}
          open={isOpen}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          onOpen={() => setIsOpen(true)}
          onClose={() => setIsOpen(false)}
          getOptionLabel={getOptionLabelDefault}
          isOptionEqualToValue={isOptionEqualToValueDefault}
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
  // UI
  // ----------------------------------------------------------------------

  return (
    <ContentLayout
      title={<Box sx={{ m: 2 }}>{'Edit Contract'}</Box>}
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Contracts', href: '/admin/contracts' },
        { label: 'Edit Contract' }
      ]}
    >
      <Card sx={{ p: 4, boxShadow: 'none' }} elevation={0}>
        <Grid container spacing={6}>
          {/* Row 1 */}
          {renderAutocomplete({
            name: 'salesMode',
            label: 'Sales Mode',
            options: salesModeOptions
          })}
          {renderAutocomplete({
            name: 'customer',
            label: 'Customer',
            options: dropdowns.customers
          })}
          {renderAutocomplete({
            name: 'contractType',
            label: 'Contract Type',
            options: contractTypeOptions,
            freeSolo: true
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
            options: accountItemCodeOptions
          })}

          {/* Row 3 */}
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
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                setReportEmailError(Boolean(value && !emailRegex.test(value)))
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
            options: dropdowns.callTypes
          })}

          {/* Row 5 */}
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

          {/* Row 6 */}
          {renderAutocomplete({
            name: 'industry',
            label: 'Industry',
            options: industryOptions,
            freeSolo: true
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
            label: 'Technicians',
            options: dropdowns.employees.filter(e => e.designation === 'Technician')
          })}
          {renderAutocomplete({
            name: 'paymentTerm',
            label: 'Payment Term',
            options: paymentTermOptions
          })}
          {renderAutocomplete({
            name: 'salesPerson',
            label: 'Sales Person',
            options: dropdowns.employees.filter(e => e.designation === 'Sales'),
            gridProps: { xs: 12, md: 6 }
          })}
          {renderAutocomplete({
            name: 'supervisor',
            label: 'Supervisor',
            options: dropdowns.employees.filter(e => e.designation === 'Supervisor'),
            gridProps: { xs: 12, md: 6 }
          })}
          {renderAutocomplete({
            name: 'billingFrequency',
            label: 'Billing Frequency',
            options: dropdowns.billingFreq
          })}

          {/* Row 7 */}
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

          {/* File upload */}
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
              </Button>

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

          {/* Pest items block title */}
          <Grid item xs={12}>
            <Typography variant='h6' sx={{ mb: 4, mt: 4 }}>
              Pest Item Details ({editingItemId ? 'Editing Mode' : 'Add Mode'})
            </Typography>
          </Grid>

          {/* Pest row 1 */}
          <Grid item xs={12} md={2.4}>
            <Autocomplete
              ref={refs.pestRef}
              freeSolo={false}
              options={dropdowns.pests}
              value={
                dropdowns.pests.find(p => p.name === currentPestItem.pest || p.id === currentPestItem.pestId) || null
              }
              open={openStates.pestOpen}
              onFocus={() => setOpenStates.pestSetOpen(true)}
              onBlur={() => setOpenStates.pestSetOpen(false)}
              onOpen={() => setOpenStates.pestSetOpen(true)}
              onClose={() => setOpenStates.pestSetOpen(false)}
              getOptionLabel={getOptionLabelDefault}
              isOptionEqualToValue={isOptionEqualToValueDefault}
              onInputChange={(e, newValue, reason) =>
                handleAutocompleteInputChange('pest', dropdowns.pests, newValue, reason)
              }
              onChange={(e, newValue) => handleCurrentPestItemAutocompleteChange('pest', newValue, refs.pestInputRef)}
              onKeyDown={e => handleKeyDown(e, refs.pestInputRef)}
              noOptionsText='No options'
              renderInput={params => <CustomTextField {...params} label='Pest' inputRef={refs.pestInputRef} />}
            />
          </Grid>

          <Grid item xs={12} md={2.4}>
            <Autocomplete
              ref={refs.frequencyRef}
              freeSolo={false}
              options={dropdowns.serviceFreq}
              value={
                dropdowns.serviceFreq.find(
                  f => f.name === currentPestItem.frequency || f.id === currentPestItem.frequencyId
                ) || null
              }
              open={openStates.frequencyOpen}
              onFocus={() => setOpenStates.frequencySetOpen(true)}
              onBlur={() => setOpenStates.frequencySetOpen(false)}
              onOpen={() => setOpenStates.frequencySetOpen(true)}
              onClose={() => setOpenStates.frequencySetOpen(false)}
              getOptionLabel={getOptionLabelDefault}
              isOptionEqualToValue={isOptionEqualToValueDefault}
              onInputChange={(e, newValue, reason) =>
                handleAutocompleteInputChange('frequency', dropdowns.serviceFreq, newValue, reason)
              }
              onChange={(e, newValue) =>
                handleCurrentPestItemAutocompleteChange('frequency', newValue, refs.frequencyInputRef)
              }
              onKeyDown={e => handleKeyDown(e, refs.frequencyInputRef)}
              noOptionsText='No options'
              renderInput={params => (
                <CustomTextField {...params} label='Frequency' inputRef={refs.frequencyInputRef} />
              )}
            />
          </Grid>

          <Grid item xs={12} md={2.4}>
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

          {/* Pest row 2 */}
          <Grid item xs={12} md={3}>
            <Autocomplete
              ref={refs.timeRef}
              freeSolo={false}
              options={timeOptions}
              value={currentPestItem.time || ''}
              open={openStates.timeOpen}
              onFocus={() => setOpenStates.timeSetOpen(true)}
              onBlur={() => setOpenStates.timeSetOpen(false)}
              onOpen={() => setOpenStates.timeSetOpen(true)}
              onClose={() => setOpenStates.timeSetOpen(false)}
              getOptionLabel={getOptionLabelDefault}
              isOptionEqualToValue={isOptionEqualToValueDefault}
              onInputChange={(e, newValue, reason) =>
                handleAutocompleteInputChange('time', timeOptions, newValue, reason)
              }
              onChange={(e, newValue) => handleCurrentPestItemAutocompleteChange('time', newValue, refs.timeInputRef)}
              onKeyDown={e => handleKeyDown(e, refs.timeInputRef)}
              noOptionsText='No options'
              renderInput={params => <CustomTextField {...params} label='Time' inputRef={refs.timeInputRef} />}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Chemicals'
              name='chemicals'
              value={currentPestItem.chemicals}
              onChange={handleCurrentPestItemChange}
              inputRef={currentChemicalsRef}
              onKeyDown={e => handleKeyDown(e, currentChemicalsRef)}
            />
          </Grid>

          <Grid item xs={12} md={3}>
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
            <Button
              variant='contained'
              fullWidth
              onClick={handleSavePestItem}
              ref={addPestButtonRef}
              onKeyDown={e => handleKeyDown(e, addPestButtonRef)}
              color={editingItemId ? 'success' : 'primary'}
            >
              {editingItemId ? 'UPDATE PEST' : 'ADD PEST'}
            </Button>
          </Grid>

          {/* Pest items table */}
          <Grid item xs={12} sx={{ mt: 4 }}>
            <Box sx={{ overflowX: 'auto', border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Table sx={{ minWidth: 950 }}>
                <TableHead>
                  <TableRow>
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
                      <TableCell colSpan={9} align='center' sx={{ color: 'text.secondary' }}>
                        No pest added
                      </TableCell>
                    </TableRow>
                  ) : (
                    pestItems.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell align='center'>
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

          {/* Multiline rows */}
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
            <Button variant='outlined' onClick={() => router.push('/admin/contracts')} ref={closeButtonRef}>
              Close
            </Button>
            <Button variant='contained' onClick={handleSubmit} ref={saveButtonRef} disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </Grid>
        </Grid>
      </Card>

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
