'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'

import {
  Box,
  Button,
  Grid,
  Card,
  Typography,
  Table,
  TableHead,
  TableRow,
  Divider,
  TableCell,
  TableBody,
  Checkbox,
  IconButton,
  FormControlLabel,
  Dialog,
  DialogContent
} from '@mui/material'

import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'

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
import { addProposal } from '@/api/proposal'

// Layout + Inputs (Assuming these paths are correct)
import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import { Autocomplete } from '@mui/material'
import {
  getContractDropdowns,
  createContract,
  getContractDates,
  getInvoiceCount,
  getPestCount,
  getInvoiceRemark
} from '@/api/contract'
import { getCustomerDetails } from '@/api/customer'

// Autocomplete Fields Definition (Unchanged)

const autocompleteFields = [
  { name: 'salesMode', options: ['Confirmed Sales', 'Quotation'] },
  { name: 'contractType', options: ['Continuous Contract', 'Limited Contract', 'Continuous Job', 'Job', 'Warranty'] },
  { name: 'paymentTerm', options: ['0 days', '30 days'] },
  { name: 'salesPerson', options: [] }, // Changed to dynamic
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

export default function AddProposalPage() {
  const router = useRouter()

  // Helper function to generate a simple unique ID
  const generateUniqueId = () => Date.now().toString(36) + Math.random().toString(36).substring(2)

  // Dynamic Autocomplete Fields (Safe copy)
  const [dynamicAutocompleteFields, setDynamicAutocompleteFields] = useState(autocompleteFields)

  // ----------------------------------------------------------------------
  // State and Options
  // ----------------------------------------------------------------------
  const [formData, setFormData] = useState({
    // Initializing all fields to sensible defaults
    salesMode: '',
    salesModeId: '',
    contractName: '', // ⭐ ADD THIS
    contractType: '',
    contractTypeId: '',
    coveredLocation: '',
    contractCode: '',
    serviceAddress: '',
    postalCode: '',
    poNumber: '',
    poExpiry: new Date(),
    preferredTime: null,
    reportEmail: '',
    contactPerson: '',
    sitePhone: '',
    mobile: '',
    callType: '',
    callTypeId: '',
    groupCode: '',
    startDate: null,
    endDate: null,
    reminderDate: null,
    customer: '',
    customerId: '',
    industry: '',
    industryId: '',
    contractValue: '',
    technician: '',
    technicianId: '',
    paymentTerm: '',
    paymentTermId: '',
    salesPerson: '',
    salesPersonId: '',
    supervisor: '',
    supervisorId: '',
    billingFrequency: '',
    billingFrequencyId: '',
    invoiceCount: '',
    invoiceRemarks: [],
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
    pestId: '',
    frequency: '',
    frequencyId: '',
    pestCount: '',
    pestValue: '',
    total: '',
    time: '',
    chemicals: '',
    chemicalId: '',
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
  const [copyCustomerAddress, setCopyCustomerAddress] = useState(false)

  const pathname = usePathname()
  const lang = pathname.split('/')[1]

  const cleanOptions = arr => [...new Set(arr.filter(v => v !== null && v !== undefined && v !== ''))]

  const [dropdowns, setDropdowns] = useState({
    customers: [],
    callTypes: [],
    industries: [],
    technicians: [],
    supervisors: [],
    salesPersons: [],
    billingFrequencies: [],
    serviceFrequencies: [],
    pests: [],
    chemicals: []
  })

  // Dynamic Refs and Open States for Autocomplete (Unchanged)

  const refs = autocompleteFields.reduce((acc, f) => {
    acc[f.name + 'Ref'] = useRef(null)
    acc[f.name + 'InputRef'] = useRef(null)
    return acc
  }, {})

  const getDefaultTime = () => {
    const d = new Date()
    d.setHours(9, 0, 0, 0) // 09:00 AM
    return d
  }

  const [autoOpen, setAutoOpen] = useState(() => Object.fromEntries(autocompleteFields.map(f => [f.name, false])))

  const openStates = useMemo(() => {
    return Object.fromEntries(autocompleteFields.map(f => [f.name + 'Open', autoOpen[f.name]]))
  }, [autoOpen])

  const setOpenStates = useMemo(() => {
    return Object.fromEntries(
      autocompleteFields.map(f => [
        f.name + 'SetOpen',
        value =>
          setAutoOpen(prev => ({
            ...prev,
            [f.name]: value
          }))
      ])
    )
  }, [])

  // Explicit Refs (Unchanged)
  const contractNameRef = useRef(null)
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
    contractNameRef,
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

  const copyFromCustomer = async customerId => {
    if (!customerId) return

    try {
      const res = await getCustomerDetails(customerId)

      if (res?.status === 'success') {
        const c = res.data

        setFormData(prev => ({
          ...prev,

          // ✅ SERVICE DETAILS
          serviceAddress: c.billing_address || '',
          postalCode: c.postal_code || '',

          // ✅ CONTACT DETAILS
          contactPerson: c.pic_contact_name || '',
          sitePhone: c.pic_phone || '',
          mobile: c.mobile_no || '',
          reportEmail: (c.billing_email || c.pic_email || '').trim()
        }))
      }
    } catch (err) {
      console.error('❌ Customer copy failed', err)
      showToast('error', 'Failed to copy customer details')
    }
  }

  useEffect(() => {
    if (dropdowns.callTypes?.length && !formData.callTypeId) {
      const defaultCallType = dropdowns.callTypes.find(
        ct => ct.name?.toLowerCase().replace(/\s+/g, ' ').trim() === 'call & fix'
      )

      if (defaultCallType) {
        setFormData(prev => ({
          ...prev,
          callType: defaultCallType.name,
          callTypeId: defaultCallType.id
        }))
      }
    }
  }, [dropdowns.callTypes])

  useEffect(() => {
    if (!formData.preferredTime) {
      setFormData(prev => ({
        ...prev,
        preferredTime: getDefaultTime()
      }))
    }
  }, [])

  useEffect(() => {
    // Customer change pannina checkbox OFF aaganum
    setCopyCustomerAddress(false)

    setFormData(prev => ({
      ...prev,
      serviceAddress: '',
      postalCode: '',
      contactPerson: '',
      sitePhone: '',
      mobile: '',
      reportEmail: ''
    }))
  }, [formData.customerId])

  useEffect(() => {
    // Update dynamic fields with static options
    const updatedFields = autocompleteFields.map(f => {
      if (f.name === 'customer') return { ...f, options: dropdowns.customers || [] }
      if (f.name === 'callType') return { ...f, options: dropdowns.callTypes || [] }
      if (f.name === 'billingFrequency') return { ...f, options: dropdowns.billingFrequencies || [] }
      if (f.name === 'frequency') return { ...f, options: dropdowns.serviceFrequencies || [] }
      if (f.name === 'pest') return { ...f, options: dropdowns.pests || [] }
      return f
    })

    setDynamicAutocompleteFields(updatedFields)
  }, [dropdowns])

  // ----------------------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------------------

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  useEffect(() => {
    loadDropdowns()
  }, [])

  const loadDropdowns = async () => {
    try {
      const res = await getContractDropdowns()

      // Backend nested response extraction
      const data = res?.data?.data?.data || {}

      setDropdowns({
        customers: data.customer?.name || [],
        callTypes: data.calltype?.name || [],
        industries: data.industry?.name || [],
        technicians: data.technician?.name || [],
        supervisors: data.supervisor?.name || [],
        salesPersons: data.sales?.name || [],
        billingFrequencies: data.billing_frequency?.name || [],
        serviceFrequencies: data.service_frequency?.name || [],
        pests: data.pest?.name || [],
        chemicals: data.chemicals?.name || []
      })

      console.log('✔ Dropdowns loaded:', data)
    } catch (err) {
      console.error('❌ Dropdown fetch error:', err)
      showToast('error', 'Failed to load dropdowns ⚠️')
    }
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
    const isObject = typeof newValue === 'object' && newValue !== null
    setFormData(prev => ({
      ...prev,
      [name]: isObject ? newValue.name || '' : newValue,
      [`${name}Id`]: isObject ? newValue.id || '' : ''
    }))

    const setStateFunc = setOpenStates[name + 'SetOpen']
    if (setStateFunc) setStateFunc(false)

    focusNextElement(currentInputRef)
  }

  // NEW: Autocomplete change handler for CURRENT PEST ITEM
  const handleCurrentPestItemAutocompleteChange = (name, newValue, currentInputRef) => {
    const isObject = typeof newValue === 'object' && newValue !== null
    setCurrentPestItem(prev => ({
      ...prev,
      [name]: isObject ? newValue.name || '' : newValue,
      [`${name}Id`]: isObject ? newValue.id || '' : ''
    }))
    const setStateFunc = setOpenStates[name + 'SetOpen']
    if (setStateFunc) {
      setStateFunc(false)
    }
    focusNextElement(currentInputRef)
  }

  const convertTimeToMinutes = str => {
    if (!str) return 0
    const [h, m] = str.split(':').map(Number)
    return h * 60 + m
  }

  // Autocomplete input change handler (Unchanged)
  const handleAutocompleteInputChange = (name, options, newValue, reason) => {
    if (reason === 'input' && !options.includes(newValue) && !autocompleteFields.find(f => f.name === name).freeSolo) {
      return
    }
    // This handler must work for both formData and currentPestItem
    if (['pest', 'frequency', 'time'].includes(name)) {
      setCurrentPestItem(prev => ({
        ...prev,
        [name]: newValue?.name || newValue,
        [`${name}Id`]: newValue?.id || 0
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: newValue }))
    }
  }

  // // Datepicker change handler (Unchanged)

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

  const handleDateChange = async (name, date, currentInputRef) => {
    setFormData(prev => ({ ...prev, [name]: date }))
    if (name === 'startDate' || name === 'endDate') {
      setTimeout(updateInvoiceCount, 0)
    }

    // Only when START DATE changes → call API to auto-fill endDate & reminderDate
    if (name === 'startDate' && date) {
      try {
        const payload = {
          start_date: date?.toISOString().split('T')[0],
          contract_type: formData.contractType || '',
          frequency: formData.billingFrequency || ''
        }

        const res = await getContractDates(payload)

        if (res?.data?.status === 'success') {
          const apiData = res.data.data

          setFormData(prev => ({
            ...prev,
            endDate: new Date(apiData.end_date),
            reminderDate: new Date(apiData.reminder_date)
          }))
        }
      } catch (e) {
        console.error('Date Calculation API failed', e)
        // Optionally show toast here if desired
      }
    }

    // Always focus next field after date selection
    focusNextElement(currentInputRef)
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
      pestId: item.pestId,
      frequency: item.frequency,
      frequencyId: item.frequencyId,
      pestCount: item.pestCount, // Fixed: Include pestCount
      pestValue: item.pestValue,
      total: item.totalValue,
      time: item.workTime,
      chemicals: item.chemicals,
      chemicalId: item.chemicalId,
      noOfItems: item.noOfItems
    })

    // Set the editing ID
    setEditingItemId(item.id)

    // Focus on the first input field
    refs.pestInputRef.current?.focus()
  }

  // Function to save (Add or Update) the current item to the list
  const handleSavePestItem = () => {
    // ❗ DATE VALIDATION FIRST
    if (!formData.startDate || !formData.endDate) {
      showToast('warning', 'Please select Start Date and End Date before adding Pest!')
      return
    }

    // ❗ BASIC PEST VALIDATION
    if (!currentPestItem.pest || !currentPestItem.frequency) {
      showToast('warning', 'Pest and Frequency are required!')
      return
    }

    const itemPayload = {
      pest: currentPestItem.pest,
      pestId: currentPestItem.pestId || 0,

      frequency: currentPestItem.frequency,
      frequencyId: currentPestItem.frequencyId || 0,

      chemicals: currentPestItem.chemicals,
      chemicalId: currentPestItem.chemicalId || 0,

      pestCount: currentPestItem.pestCount || '0',
      pestValue: currentPestItem.pestValue || '0',
      totalValue: currentPestItem.total || '0',
      workTime: currentPestItem.time || '0:00',
      noOfItems: currentPestItem.noOfItems || '0'
    }

    if (editingItemId) {
      // UPDATE
      setPestItems(prev =>
        prev.map(item => (item.id === editingItemId ? { ...item, ...itemPayload, id: editingItemId } : item))
      )
      setEditingItemId(null)
    } else {
      // ADD
      setPestItems(prev => [...prev, { ...itemPayload, id: generateUniqueId() }])
    }

    // RESET
    setCurrentPestItem({
      pest: '',
      pestId: '',
      frequency: '',
      frequencyId: '',
      pestCount: '',
      pestValue: '',
      total: '',
      time: '',
      chemicals: '',
      chemicalId: '',
      noOfItems: ''
    })

    refs.pestInputRef.current?.focus()
  }

  // Function to delete an item from the list
  const handleDeletePestItem = id => {
    if (editingItemId === id) {
      setEditingItemId(null)
      setCurrentPestItem({
        pest: '',
        pestId: '',
        frequency: '',
        frequencyId: '',
        pestCount: '',
        pestValue: '',
        total: '',
        time: '',
        chemicals: '',
        chemicalId: '',
        noOfItems: ''
      })
    }
    setPestItems(prev => prev.filter(item => item.id !== id))
  }

  // 🔹 FETCH INVOICE REMARKS BASED ON PEST ITEMS
  const fetchInvoiceRemarks = async items => {
    if (items.length === 0) {
      setFormData(prev => ({ ...prev, invoiceRemarks: [] }))
      return
    }

    try {
      const payload = {
        pest_items: items.map(item => ({
          pest_id: Number(item.pestId),
          frequency_id: Number(item.frequencyId)
        }))
      }

      const res = await getInvoiceRemark(payload)

      if (res?.status === 'success' && Array.isArray(res?.data)) {
        setFormData(prev => ({
          ...prev,
          invoiceRemarks: res.data // Store as array
        }))
      }
    } catch (err) {
      console.error('❌ Invoice Remark API failed', err)
    }
  }

  // Auto-fetch invoice remarks when pestItems changes
  useEffect(() => {
    fetchInvoiceRemarks(pestItems)
  }, [pestItems])

  // Logic to Save to IndexedDB and Redirect
  // =======================================
  // 🚀 FINAL WORKING HANDLE SUBMIT FUNCTION
  // =======================================
  const handleSubmit = async () => {
    // ------------------------------
    // 1️⃣ BASIC VALIDATIONS
    // ------------------------------
    if (!formData.contractName) {
      showToast('error', 'Contract Name is required!')
      return
    }
    if (!formData.customer) {
      showToast('error', 'Customer is required!')
      return
    }
    if (!formData.startDate || !formData.endDate) {
      showToast('error', 'Start Date and End Date are required!')
      return
    }
    if (reportEmailError) {
      showToast('error', 'Invalid Report Email!')
      return
    }

    try {
      // ------------------------------
      // 2️⃣ BUILD PAYLOAD
      // ------------------------------
      const payload = {
        parent_id: 0,
        level: 1,
        customer_id: Number(formData.customerId) || null,

        name: formData.contractName || '',
        report_email: formData.reportEmail || '',
        sales_mode: formData.salesMode?.toLowerCase().replace(/\s+/g, '_') || '',
        contract_code: formData.contractCode || '',
        covered_location: formData.coveredLocation || '',
        service_address: formData.serviceAddress || '',
        postal_code: formData.postalCode || '',
        po_number: formData.poNumber || '',
        po_expiry_date: formData.poExpiry?.toISOString().split('T')[0] || '',
        contact_person_name: formData.contactPerson || '',
        phone: formData.sitePhone?.replace(/\s+/g, '') || '',
        mobile: formData.mobile?.replace(/\s+/g, '') || '',
        call_type_id: Number(formData.callTypeId) || null,
        preferred_time: formData.preferredTime ? formData.preferredTime.toTimeString().slice(0, 5) + ':00' : '09:00:00',

        industry_id: Number(formData.industryId) || null,
        contract_type: formData.contractType?.toLowerCase() || '',
        commencement_date: formData.startDate?.toISOString().split('T')[0],
        start_date: formData.startDate?.toISOString().split('T')[0],
        end_date: formData.endDate?.toISOString().split('T')[0],
        reminder_date: formData.reminderDate?.toISOString().split('T')[0],

        sales_person_id: Number(formData.salesPersonId) || null,
        technician_id: Number(formData.technicianId) || null,
        supervisor_id: Number(formData.supervisorId) || null,

        contract_value: Number(formData.contractValue || 0),
        billing_frequency_id: Number(formData.billingFrequencyId) || null,
        invoice_count: Number(formData.invoiceCount || 0),
        invoice_remarks: Array.isArray(formData.invoiceRemarks)
          ? formData.invoiceRemarks.join(', ')
          : formData.invoiceRemarks || '',

        latitude: Number(formData.latitude || 0),
        longitude: Number(formData.longitude || 0),

        billing_term: Number(formData.paymentTerm?.replace(/\s*days?$/, '')) || 0,

        agreement_add_1: formData.agreement1 || '',
        agreement_add_2: formData.agreement2 || '',
        billing_remarks: formData.billingRemarks || '',
        appointment_remarks: formData.appointmentRemarks || '',
        technician_remarks: formData.technicianRemarks || '',

        pest_items: pestItems.map(item => ({
          customer_id: Number(formData.customerId) || null,
          pest_id: Number(item.pestId) || null,
          frequency_id: Number(item.frequencyId) || null,
          chemical_id: Number(item.chemicalId) || null,
          pest: item.pest || '',
          frequency: item.frequency || '',
          chemical_name: item.chemicals || '',
          no_location: Number(item.pestCount || 0),
          pest_value: Number(item.pestValue || 0),
          pest_service_count: Number(item.noOfItems || 1),
          total_value: Number(item.totalValue || item.total || 0),
          work_time: convertTimeToMinutes(item.workTime || '0:00'),
          remarks: null
        }))
      }

      console.log('📌 FINAL PAYLOAD:', payload)

      // ------------------------------
      // 3️⃣ SEND TO BACKEND (SALES QUOTATION)
      // ------------------------------
      const response = await addProposal(payload)

      // ------------------------------
      // 4️⃣ SUCCESS → REDIRECT
      // ------------------------------
      if (response?.status === 'success' || response?.data?.status === 'success') {
        showToast('success', 'Sales Quotation Added Successfully!')

        const lang = window.location.pathname.split('/')[1]

        setTimeout(() => {
          router.push(`/${lang}/admin/sales-quotation`)
        }, 500)

        return
      }

      // ------------------------------
      // 5️⃣ FAILED BACKEND RESPONSE
      // ------------------------------
      console.error('❌ Backend Error:', response)
      showToast('error', response?.data?.message || 'Error while saving sales quotation!')
    } catch (error) {
      console.error('❌ Submit Error:', error)
      showToast('error', 'Error while saving sales quotation!')
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

    const isObjectOptions = options.length > 0 && typeof options[0] === 'object'
    const value = isObjectOptions ? options.find(o => o.id === formData[`${name}Id`]) || null : formData[name] || null

    return (
      <Grid item {...gridProps} key={`field-${name}`}>
        <Autocomplete
          ref={ref}
          freeSolo={name === 'chemicals'}
          options={options}
          value={value}
          getOptionLabel={option => (typeof option === 'string' ? option : option?.name || '')}
          open={isOpen}
          onOpen={() => setIsOpen(true)}
          onClose={() => setIsOpen(false)}
          onFocus={() => setIsOpen(true)}
          // ⭐⭐⭐ THIS IS THE FIX ⭐⭐⭐
          renderOption={(props, option) => (
            <li {...props} key={option.id ? `opt-${option.id}` : `opt-${option}`}>
              {typeof option === 'string' ? option : option?.name || ''}
            </li>
          )}
          // ⭐⭐⭐ END FIX ⭐⭐⭐

          onChange={(e, newValue) => handleAutocompleteChange(name, newValue || '', inputRef)}
          onInputChange={(e, newValue, reason) => {
            // 🚫 Do NOT update state when value is set programmatically
            if (reason === 'reset') return

            if (['pest', 'frequency', 'chemicals'].includes(name)) {
              setCurrentPestItem(prev => ({ ...prev, [name]: newValue }))
            } else {
              setFormData(prev => ({ ...prev, [name]: newValue }))
            }
          }}
          onKeyDown={e => handleKeyDown(e, inputRef)}
          renderInput={params => <CustomTextField {...params} label={label} inputRef={inputRef} />}
        />
      </Grid>
    )
  }

  const updateInvoiceCount = async () => {
    try {
      if (!formData.startDate || !formData.endDate || !formData.billingFrequencyId) return

      const payload = {
        start_date: formData.startDate?.toISOString().split('T')[0],
        end_date: formData.endDate?.toISOString().split('T')[0],
        billing_frequency_id: Number(formData.billingFrequencyId)
      }

      const res = await getInvoiceCount(payload)

      if (res?.status === 'success') {
        setFormData(prev => ({
          ...prev,
          invoiceCount: res.data?.invoice_count || 0
        }))
      }
    } catch (error) {
      console.error('❌ Invoice Count API Error:', error)
    }
  }

  const fetchPestCount = async (pestId, frequencyId) => {
    // ❗ DATE VALIDATION FIRST
    if (!formData.startDate || !formData.endDate) {
      showToast('warning', 'Please select Start Date and End Date first!')
      return
    }

    if (!pestId || !frequencyId) return

    try {
      const payload = {
        pest_id: Number(pestId),
        service_frequency_id: Number(frequencyId), // 🔥 FIX HERE
        start_date: formData.startDate.toISOString().split('T')[0],
        end_date: formData.endDate.toISOString().split('T')[0]
      }

      console.log('🐛 Pest Count Payload:', payload)

      const res = await getPestCount(payload)

      if (res?.status === 'success') {
        setCurrentPestItem(prev => ({
          ...prev,
          pestCount: String(res.data?.pest_count || '')
        }))
      }
    } catch (err) {
      console.error('❌ Pest Count API failed', err)
      showToast('error', 'Failed to fetch pest count')
    }
  }

  // ---------------------------------------------------------------------- 
  // Form Structure (Updated File Upload Section)
  // ----------------------------------------------------------------------

  return (
    <ContentLayout
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Sales Quotation', href: '/admin/sales-quotation' },
        { label: 'Add Sales Quotation' }
      ]}
    >
      <Card sx={{ p: 4, boxShadow: 'none' }} elevation={0}>
        <Grid container spacing={6}>
          {/* ... (Existing form fields, rows 1-9) ... */}
          {renderAutocomplete({
            name: 'salesMode',
            label: 'Sales Mode',
            options: dynamicAutocompleteFields.find(f => f.name === 'salesMode')?.options || []
          })}
          {renderAutocomplete({
            name: 'customer',
            label: 'Customer',
            options: dropdowns.customers // pass full object {name,id}
          })}

          {renderAutocomplete({
            name: 'contractType',
            label: 'Contract Type',
            options: dynamicAutocompleteFields.find(f => f.name === 'contractType')?.options || []
          })}
          <Grid item xs={12} md={3} key='contract-name-field'>
            <CustomTextField
              fullWidth
              label='Contract Name'
              name='contractName'
              value={formData.contractName}
              onChange={handleChange}
              inputRef={contractNameRef}
              onKeyDown={e => handleKeyDown(e, contractNameRef)}
            />
          </Grid>
          <Grid item xs={12} md={3} key='covered-location-field'>
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
          <Grid item xs={12} md={3} key='contract-code-field'>
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

          <Grid item xs={12} key='service-section-header'>
            <Typography variant='h6' sx={{ mb: 4, mt: 4 }}>
              Service
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', mb: -1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={copyCustomerAddress}
                  onChange={async e => {
                    const checked = e.target.checked
                    setCopyCustomerAddress(checked)

                    if (checked && formData.customerId) {
                      await copyFromCustomer(formData.customerId)
                    }

                    // ❗ If unchecked → clear fields
                    if (!checked) {
                      setFormData(prev => ({
                        ...prev,
                        serviceAddress: '',
                        postalCode: '',
                        contactPerson: '',
                        sitePhone: '',
                        mobile: '',
                        reportEmail: ''
                      }))
                    }
                  }}
                />
              }
              label='Copy from Customer'
            />
          </Grid>

          <Grid item xs={12} md={3} key='service-address-field'>
            <CustomTextField
              fullWidth
              label='Service Address '
              name='serviceAddress'
              value={formData.serviceAddress}
              onChange={handleChange}
              inputRef={serviceAddressRef}
              onKeyDown={e => handleKeyDown(e, serviceAddressRef)}
            />
          </Grid>
          <Grid item xs={12} md={3} key='postal-code-field'>
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

          <Grid item xs={12} md={3} key='po-number-field'>
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
          <Grid item xs={12} md={3} key='po-expiry-field'>
            <AppReactDatepicker
              selected={formData.poExpiry}
              id='po-expiry-date'
              onChange={date => handleDateChange('poExpiry', date, poExpiryRef)}
              placeholderText='Select PO Expiry Date'
              dateFormat='dd/MM/yyyy'
              customInput={<CustomTextField label='PO Expiry Date' fullWidth inputRef={poExpiryRef} />}
            />
          </Grid>
          <Grid item xs={12} md={3} key='preferred-time-field'>
            <AppReactDatepicker
              selected={formData.preferredTime}
              onChange={date => {
                setFormData(prev => ({
                  ...prev,
                  preferredTime: date
                }))
                focusNextElement(preferredTimeRef)
              }}
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={15}
              timeCaption='Time'
              dateFormat='h:mm aa'
              placeholderText='Select Preferred Time'
              customInput={<CustomTextField label='Preferred Time' fullWidth inputRef={preferredTimeRef} />}
            />
          </Grid>

          <Grid item xs={12} md={3} key='report-email-field'>
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
          <Grid item xs={12} md={3} key='contact-person-field'>
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
          <Grid item xs={12} md={3} key='site-phone-field'>
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
          <Grid item xs={12} md={3} key='mobile-field'>
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

          <Grid item xs={12} key='group-section-header'>
            <Typography variant='h6' sx={{ mb: 4, mt: 4 }}>
              Group
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={3} key='group-code-field'>
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
            options: dropdowns.industries
          })}

          <Grid item xs={12} md={3} key='contract-value-field'>
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
            options: dropdowns.technicians
          })}

          {renderAutocomplete({
            name: 'paymentTerm',
            label: 'Payment Term',
            options: autocompleteFields.find(f => f.name === 'paymentTerm').options
          })}
          {renderAutocomplete({
            name: 'salesPerson',
            label: 'Sales Person',
            options: dropdowns.salesPersons,
            gridProps: { xs: 12, md: 3 }
          })}

          {renderAutocomplete({
            name: 'supervisor',
            label: 'Supervisor',
            options: dropdowns.supervisors
          })}

          {/* --- FREQUENCY  ITEM INPUTS (Updated) --- */}
          <Grid item xs={12} key='billing-section-header'>
            <Typography variant='h6' sx={{ mb: 4, mt: 4 }}>
              Billing
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={3}>
            <Autocomplete
              options={dropdowns.billingFrequencies}
              getOptionLabel={option => option?.name || ''}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
              value={dropdowns.billingFrequencies.find(o => o.id === formData.billingFrequencyId) || null}
              onChange={async (e, newValue) => {
                // ❗ First validate dates
                if (!formData.startDate || !formData.endDate) {
                  showToast('warning', 'Please select Start Date and End Date first!')
                  return
                }

                const selectedId = newValue?.id ?? null

                if (!selectedId) return

                // ✅ Now safely set state
                setFormData(prev => ({
                  ...prev,
                  billingFrequency: newValue?.name || '',
                  billingFrequencyId: selectedId
                }))

                const payload = {
                  start_date: formData.startDate.toISOString().split('T')[0],
                  end_date: formData.endDate.toISOString().split('T')[0],
                  billing_frequency_id: Number(selectedId)
                }

                const res = await getInvoiceCount(payload)

                if (res?.status === 'success') {
                  setFormData(prev => ({
                    ...prev,
                    invoiceCount: res.data?.invoice_count || 0
                  }))
                }
              }}
              renderInput={params => (
                <CustomTextField {...params} label='Billing Frequency' inputRef={refs.billingFrequencyInputRef} />
              )}
              onKeyDown={e => handleKeyDown(e, refs.billingFrequencyInputRef)}
            />
          </Grid>

          <Grid item xs={12} md={3} key='invoice-count-field'>
            <CustomTextField
              fullWidth
              label='No. of Invoice'
              name='invoiceCount'
              value={formData.invoiceCount !== '' ? String(formData.invoiceCount) : ''}
              onChange={() => {}} // prevent warning
              inputRef={invoiceCountRef}
              InputProps={{
                readOnly: true
              }}
            />
          </Grid>
          <Grid item xs={12} md={6} key='invoice-remarks-field'>
            <Autocomplete
              multiple
              freeSolo
              options={[]} // No predefined options, just tags
              value={Array.isArray(formData.invoiceRemarks) ? formData.invoiceRemarks : []}
              onChange={(e, newValue) => {
                setFormData(prev => ({ ...prev, invoiceRemarks: newValue }))
              }}
              renderInput={params => (
                <CustomTextField {...params} label='Invoice Remarks' inputRef={invoiceRemarksRef} />
              )}
              onKeyDown={e => handleKeyDown(e, invoiceRemarksRef)}
            />
          </Grid>
          <Grid item xs={12} md={3} key='latitude-field'>
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
          <Grid item xs={12} md={3} key='longitude-field'>
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
          <Grid item xs={12} md={6} key='file-upload-section'>
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

          <Grid item xs={12} key='pest-section-header'>
            <Typography variant='h6' sx={{ mb: 4, mt: 4 }}>
              Pest
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          {/* Pest */}
          <Grid item xs={12} md={2.4} key='pest-input-pest'>
            <Autocomplete
              options={dropdowns.pests}
              getOptionLabel={option => option?.name || ''}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
              renderOption={(props, option) => (
                <li {...props} key={`pest-${option.id}`}>
                  {option.name}
                </li>
              )}
              value={dropdowns.pests.find(o => o.id === currentPestItem.pestId) || null}
              onChange={(e, newValue) => {
                const pestId = newValue?.id || ''

                setCurrentPestItem(prev => ({
                  ...prev,
                  pest: newValue?.name || '',
                  pestId
                }))

                // 🔥 CALL API IF FREQUENCY EXISTS
                if (pestId && currentPestItem.frequencyId) {
                  fetchPestCount(pestId, currentPestItem.frequencyId)
                }
              }}
              renderInput={params => <CustomTextField {...params} label='Pest' inputRef={refs.pestInputRef} />}
              onKeyDown={e => handleKeyDown(e, refs.pestInputRef)}
            />
          </Grid>

          {/* Frequency */}
          <Grid item xs={12} md={2.4} key='pest-input-frequency'>
            <Autocomplete
              options={dropdowns.serviceFrequencies}
              getOptionLabel={option => option?.name || ''}
              value={dropdowns.serviceFrequencies.find(o => o.id === currentPestItem.frequencyId) || null}
              onChange={(e, newValue) => {
                const frequencyId = newValue?.id || ''

                setCurrentPestItem(prev => ({
                  ...prev,
                  frequency: newValue?.name || '',
                  frequencyId
                }))

                // 🔥 CALL API IF PEST EXISTS
                if (currentPestItem.pestId && frequencyId) {
                  fetchPestCount(currentPestItem.pestId, frequencyId)
                }
              }}
              renderInput={params => (
                <CustomTextField {...params} label='Frequency' inputRef={refs.frequencyInputRef} />
              )}
              onKeyDown={e => handleKeyDown(e, refs.frequencyInputRef)}
            />
          </Grid>

          {/* Pest Count */}
          <Grid item xs={12} md={2.4} key='pest-input-count'>
            <CustomTextField
              fullWidth
              label='Pest Count'
              name='pestCount'
              value={currentPestItem.pestCount || ''}
              InputProps={{ readOnly: true }}
              inputRef={currentPestCountRef}
              onKeyDown={e => handleKeyDown(e, currentPestCountRef)}
            />
          </Grid>

          {/* Pest Value */}
          <Grid item xs={12} md={2.4} key='pest-input-value'>
            <CustomTextField
              fullWidth
              label='Pest Value'
              name='pestValue'
              value={currentPestItem.pestValue || ''}
              onChange={handleCurrentPestItemChange}
              inputRef={currentPestValueRef}
              onKeyDown={e => handleKeyDown(e, currentPestValueRef)}
            />
          </Grid>

          {/* Total */}
          <Grid item xs={12} md={2.4} key='pest-input-total'>
            <CustomTextField
              fullWidth
              label='Total'
              value={currentPestItem.total || ''}
              disabled
              inputRef={currentTotalRef}
              onKeyDown={e => handleKeyDown(e, currentTotalRef)}
            />
          </Grid>

          {/* Time */}
          <Grid item xs={12} md={3} key='pest-input-time'>
            <Autocomplete
              freeSolo
              options={autocompleteFields.find(f => f.name === 'time')?.options || []}
              value={currentPestItem.time || ''}
              onChange={(e, newValue) => setCurrentPestItem(prev => ({ ...prev, time: newValue || '' }))}
              renderInput={params => <CustomTextField {...params} label='Time' inputRef={refs.timeInputRef} />}
              onKeyDown={e => handleKeyDown(e, refs.timeInputRef)}
            />
          </Grid>

          {/* Chemicals */}
          <Grid item xs={12} md={3} key='pest-input-chemicals'>
            <Autocomplete
              options={dropdowns.chemicals}
              getOptionLabel={option => option?.name || ''}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
              renderOption={(props, option) => (
                <li {...props} key={`chem-${option.id}`}>
                  {option.name}
                </li>
              )}
              value={dropdowns.chemicals.find(o => o.id === currentPestItem.chemicalId) || null}
              onChange={(e, newValue) => {
                setCurrentPestItem(prev => ({
                  ...prev,
                  chemicals: newValue?.name || '',
                  chemicalId: newValue?.id || ''
                }))
              }}
              renderInput={params => <CustomTextField {...params} label='Chemicals' inputRef={currentChemicalsRef} />}
              onKeyDown={e => handleKeyDown(e, currentChemicalsRef)}
            />
          </Grid>

          {/* No of Items */}
          <Grid item xs={12} md={3} key='pest-input-noitems'>
            <CustomTextField
              fullWidth
              label='No of Items'
              name='noOfItems'
              value={currentPestItem.noOfItems || ''}
              onChange={handleCurrentPestItemChange}
              inputRef={currentNoOfItemsRef}
              onKeyDown={e => handleKeyDown(e, currentNoOfItemsRef)}
            />
          </Grid>

          {/* Add/Update Button */}
          <Grid item xs={12} md={3} key='pest-input-addbtn' sx={{ display: 'flex', alignItems: 'flex-end' }}>
            <GlobalButton
              variant='contained'
              color={editingItemId ? 'success' : 'primary'}
              fullWidth
              onClick={handleSavePestItem}
              ref={addPestButtonRef}
              onKeyDown={e => handleKeyDown(e, addPestButtonRef)}
            >
              {editingItemId ? 'UPDATE PEST' : 'ADD PEST'}
            </GlobalButton>
          </Grid>
          {/* ---------------------------------------------------- */}
          {/* --- PEST ITEMS TABLE (MUI DESIGN - Left Aligned) --- */}
          {/* ---------------------------------------------------- */}
          <Grid item xs={12} sx={{ mt: 3 }}>
            <Box sx={{ overflowX: 'auto', border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Table sx={{ minWidth: 1000 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Pest</TableCell>
                    <TableCell>Frequency</TableCell>
                    <TableCell>Pest Count</TableCell>
                    <TableCell>Pest Value</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Chemicals</TableCell>
                    <TableCell>No of Items</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pestItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align='center'>
                        No pest items added
                      </TableCell>
                    </TableRow>
                  ) : (
                    pestItems.map((item, idx) => (
                      <TableRow
                        key={item.id}
                        sx={{ backgroundColor: editingItemId === item.id ? '#e3f2fd' : 'inherit' }}
                      >
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>
                          <IconButton size='small' color='error' onClick={() => handleDeletePestItem(item.id)}>
                            <DeleteIcon fontSize='small' />
                          </IconButton>
                          <IconButton
                            size='small'
                            color='primary'
                            onClick={() => handleEditPestItem(item)}
                            disabled={editingItemId === item.id}
                          >
                            <EditIcon fontSize='small' />
                          </IconButton>
                        </TableCell>
                        <TableCell>{item.pest}</TableCell>
                        <TableCell>{item.frequency}</TableCell>
                        <TableCell>{item.pestCount}</TableCell>
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
          <Grid item xs={4} key='billing-remarks-field'>
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
          <Grid item xs={4} key='agreement-add-on-1-field'>
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
          <Grid item xs={4} key='agreement-add-on-2-field'>
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
          <Grid item xs={6} key='technician-remarks-field'>
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
          <Grid item xs={6} key='appointment-remarks-field'>
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
          <Grid
            item
            xs={12}
            sx={{ display: 'flex', justifyContent: 'flex-end', gap: 4, pt: 8 }}
            key='form-action-buttons'
          >
            <GlobalButton
              color='secondary'
              onClick={() => router.push(`/${lang}/admin/sales-quotation`)}
              ref={closeButtonRef}
            >
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
