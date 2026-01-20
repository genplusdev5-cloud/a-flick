'use client'

import { useState, useRef, useCallback, useEffect, useMemo, Fragment } from 'react'

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
  DialogContent,
  Stepper,
  StepLabel,
  Step as MuiStep,
  CardContent
} from '@mui/material'

import { styled } from '@mui/material/styles'
import classnames from 'classnames'

import { useRouter, useSearchParams, useParams } from 'next/navigation'

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
import CustomAvatar from '@core/components/mui/Avatar'
import StepperWrapper from '@core/styles/stepper'
import DirectionalIcon from '@components/DirectionalIcon'

import {
  getContractDropdowns,
  getContractDates,
  getInvoiceCount,
  getPestCount,
  getInvoiceRemark,
  createContract
} from '@/api/contract_group/contract'
import { getCustomerList } from '@/api/customer_group/customer'
import { getProposalDetails } from '@/api/sales/proposal'
import { decodeId } from '@/utils/urlEncoder'

// Autocomplete Fields Definition (Unchanged)

const autocompleteFields = [
  { name: 'salesMode', options: ['Confirmed Sales', 'Quotation'] },
  { name: 'contractType', options: ['Continuous Contract', 'Limited Contract', 'Continuous Job', 'Job', 'Warranty'] },
  { name: 'paymentTerm', options: ['0 days', '15 days', '30 days', '45 days', '60 days'] },
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

// Stepper Styles
const StepperHeaderContainer = styled(CardContent)(({ theme }) => ({
  borderRight: `1px solid ${theme.palette.divider}`,
  [theme.breakpoints.down('md')]: {
    borderRight: 0,
    borderBottom: `1px solid ${theme.palette.divider}`
  }
}))

const Step = styled(MuiStep)(({ theme }) => ({
  '& .MuiStepLabel-root': {
    paddingTop: 0
  },
  '&:first-of-type .MuiStepLabel-root': {
    paddingTop: theme.spacing(1)
  },
  '&:not(:last-of-type) .MuiStepLabel-root': {
    paddingBottom: theme.spacing(6)
  },
  '&:last-of-type .MuiStepLabel-root': {
    paddingBottom: theme.spacing(1)
  },
  '& .MuiStepLabel-iconContainer': {
    display: 'none'
  },
  '&.Mui-completed .step-title , &.Mui-completed .step-subtitle': {
    color: theme.palette.text.disabled
  }
}))

const steps = [
  {
    icon: 'tabler-file-analytics',
    title: 'Contract',
    subtitle: 'Enter Contract Details'
  },
  {
    icon: 'tabler-list-details',
    title: 'Contract Details',
    subtitle: 'Enter Specific Details'
  },
  {
    icon: 'tabler-file-invoice',
    title: 'Billing Frequency & Pest',
    subtitle: 'Billing & Service Management'
  }
]

export default function AddContractPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromProposalId = searchParams.get('from_proposal')
  const params = useParams()
  const lang = params.lang

  // Helper function to generate a simple unique ID
  const generateUniqueId = () => Date.now().toString(36) + Math.random().toString(36).substring(2)

  // Dynamic Autocomplete Fields (Safe copy)
  const [dynamicAutocompleteFields, setDynamicAutocompleteFields] = useState(autocompleteFields)

  // Stepper State
  const [activeStep, setActiveStep] = useState(0)

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
    start_time: '',
    from_ampm: '',
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

  // Helper to clean and deduplicate options (Handles Strings & Objects)
  const cleanOptions = arr => {
    if (!Array.isArray(arr)) return []
    
    const seen = new Set()
    return arr.filter(item => {
      // Filter out null/undefined/empty
      if (item === null || item === undefined || item === '') return false

      // Generate a unique key for deduplication
      const key = typeof item === 'object' 
        ? item.id || item.name || JSON.stringify(item) 
        : item

      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

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
  // 💡 Added robust date/time parsing helpers
  const parseSafeDate = dStr => {
    if (!dStr || dStr === '0000-00-00' || dStr === '' || dStr === '0000-00-00 00:00:00') return null
    const d = new Date(dStr)
    return isNaN(d.getTime()) ? null : d
  }

  const parseSafeTime = tStr => {
    if (!tStr || tStr === '00:00:00' || tStr === '') return null
    const d = new Date(`1970-01-01T${tStr}`)
    return isNaN(d.getTime()) ? null : d
  }

  const convertMinutesToTime = mins => {
    if (!mins) return '0:00'
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `${h}:${m < 10 ? '0' : ''}${m}`
  }

  // Dynamic Refs and Open States for Autocomplete (Unchanged)

  const refs = autocompleteFields.reduce((acc, f) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    acc[f.name + 'Ref'] = useRef(null)
    // eslint-disable-next-line react-hooks/rules-of-hooks
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

  useEffect(() => {
    const fetchAndMapProposal = async () => {
      if (!fromProposalId) return

      try {
        const decodedId = decodeId(fromProposalId) || fromProposalId
        const res = await getProposalDetails(decodedId)

        if (res?.status === 'success' || res) {
          const data = res?.data || res

          setFormData(prev => ({
            ...prev,
            salesMode: 'Quotation',
            salesModeId: '2',
            contractName: data.name || '',
            contractType: data.contract_type?.replace(/_/g, ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || '',
            customerId: data.customer_id,
            customer: data.customer,
            contractCode: data.contract_code || '',
            serviceAddress: data.service_address || '',
            postalCode: data.postal_code || '',
            coveredLocation: data.covered_location || '',
            poNumber: data.po_number || '',
            poExpiry: parseSafeDate(data.po_expiry_date),
            preferredTime: parseSafeTime(data.preferred_time),
            reportEmail: (data.report_email || '').trim(),
            contactPerson: data.contact_person_name || '',
            sitePhone: data.phone || '',
            mobile: data.mobile || '',
            callTypeId: data.call_type_id,
            callType: data.call_type || '',
            groupCode: data.grouping_code || '',
            startDate: parseSafeDate(data.start_date),
            endDate: parseSafeDate(data.end_date),
            reminderDate: parseSafeDate(data.reminder_date),
            industryId: data.industry_id,
            industry: data.industry || '',
            contractValue: data.contract_value || '',
            technicianId: data.technician_id,
            technician: data.technician || '',
            paymentTerm: data.billing_term ? `${data.billing_term} days` : '',
            salesPersonId: data.sales_person_id,
            salesPerson: data.sales_person || '',
            supervisorId: data.supervisor_id,
            supervisor: data.supervisor || '',
            billingFrequencyId: data.billing_frequency_id,
            billingFrequency: data.billing_frequency || '',
            invoiceCount: data.invoice_count || '',
            invoiceRemarks: data.invoice_remarks ? data.invoice_remarks.split(',').map(s => s.trim()) : [],
            latitude: data.latitude || '',
            longitude: data.longitude || '',
            billingRemarks: data.billing_remarks || '',
            agreement1: data.agreement_add_1 || '',
            agreement2: data.agreement_add_2 || '',
            technicianRemarks: data.technician_remarks || '',
            appointmentRemarks: data.appointment_remarks || '',
            uploadedFileName: data.floor_plan || ''
          }))

          if (data.pest_items && Array.isArray(data.pest_items)) {
            setPestItems(
              data.pest_items.map(item => ({
                id: generateUniqueId(),
                pest: item.pest,
                pestId: item.pest_id,
                frequency: item.frequency,
                frequencyId: item.frequency_id,
                pestCount: item.no_location,
                pestValue: item.pest_value,
                totalValue: item.total_value,
                workTime: convertMinutesToTime(item.work_time),
                chemicals: item.chemical_name,
                chemicalId: item.chemical_id,
                noOfItems: item.pest_service_count
              }))
            )
          }

          showToast('success', 'Proposal details imported successfully! 🎉')
        }
      } catch (err) {
        console.error('❌ Proposal import failed', err)
        showToast('error', 'Failed to import proposal details')
      }
    }

    if (fromProposalId) {
      fetchAndMapProposal()
    }
  }, [fromProposalId])



  const loadDropdowns = async () => {
    try {
      const res = await getContractDropdowns()

      // Backend nested response extraction
      const data = res?.data?.data?.data || {}

      setDropdowns({
        customers: cleanOptions(data.customer?.name || []),
        callTypes: cleanOptions(data.calltype?.name || []),
        industries: cleanOptions(data.industry?.name || []),
        technicians: cleanOptions(data.technician?.name || []),
        supervisors: cleanOptions(data.supervisor?.name || []),
        salesPersons: cleanOptions(data.sales?.name || []),
        billingFrequencies: cleanOptions(data.billing_frequency?.name || []),
        serviceFrequencies: cleanOptions(data.service_frequency?.name || []),
        pests: cleanOptions(data.pest?.name || []),
        chemicals: cleanOptions(data.chemicals?.name || [])
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
    // Support "HH:mm AM" or "HH:mm"
    const timePart = str.split(' ')[0]
    const [h, m] = timePart.split(':').map(Number)
    return (h || 0) * 60 + (m || 0)
  }

  // Helper to convert file to Base64
  const fileToBase64 = file => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = error => reject(error)
    })
  }

  // 💡 NEW: Helper to format date locally (YYYY-MM-DD) preventing timezone shifts
  const formatDateToLocal = date => {
    if (!date) return ''
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
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
          start_date: formatDateToLocal(date),
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
      start_time: item.workTime,
      from_ampm: item.fromAmpm,
      chemicals: item.chemicals,
      chemicalId: item.chemicalId,
      noOfItems: item.noOfItems
    })

    // Set the editing ID
    setEditingItemId(item.id)

    // Focus on the first input field
    refs.pestInputRef.current?.focus()
  }

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
        start_time: '',
        from_ampm: '',
        chemicals: '',
        chemicalId: '',
        noOfItems: ''
      })
    }
    setPestItems(prev => prev.filter(item => item.id !== id))
  }

  const updateInvoiceCount = async () => {
    // This needs BOTH dates and the Billing Frequency to be set
    if (!formData.startDate || !formData.endDate || !formData.billingFrequencyId) return

    try {
      const payload = {
        start_date: formatDateToLocal(formData.startDate),
        end_date: formatDateToLocal(formData.endDate),
        billing_frequency_id: Number(formData.billingFrequencyId)
      }
      const res = await getInvoiceCount(payload)

      if (res?.status === 'success') {
        const count = res.data?.invoice_count || 0
        setFormData(prev => ({ ...prev, invoiceCount: count }))
      }
    } catch (e) {
      console.error('Invoice count error', e)
    }
  }

  const fetchPestCount = async (pestId, frequencyId) => {
    if (!formData.startDate || !formData.endDate || !pestId || !frequencyId) {
      return
    }

    try {
      const payload = {
        pest_id: Number(pestId),
        service_frequency_id: Number(frequencyId),
        start_date: formatDateToLocal(formData.startDate),
        end_date: formatDateToLocal(formData.endDate)
      }

      const res = await getPestCount(payload)
      if (res?.status === 'success') {
        const count = res.data?.pest_count || ''
        setCurrentPestItem(prev => ({ ...prev, pestCount: String(count) }))
      }
    } catch (e) {
      console.error('Pest count error', e)
    }
  }

  // Listener to auto-fetch invoice count when frequency changes
  useEffect(() => {
    if (formData.billingFrequencyId) {
      updateInvoiceCount()
    }
  }, [formData.billingFrequencyId])

  // Listener to auto-fetch PEST count when pest or frequency changes (in the item being added)
  useEffect(() => {
    if (currentPestItem.pestId && currentPestItem.frequencyId) {
      fetchPestCount(currentPestItem.pestId, currentPestItem.frequencyId)
    }
  }, [currentPestItem.pestId, currentPestItem.frequencyId])

  const handleSavePestItem = () => {
    // Validation: make sure enough data is present
    if (!formData.startDate || !formData.endDate || !currentPestItem.pest || !currentPestItem.frequency) {
      showToast('warning', 'Valid dates, Pest and Frequency are required!')
      return
    }

    // Prepare proper objects for the list
    const item = {
      ...currentPestItem,
      totalValue: currentPestItem.total || '0',
      workTime: currentPestItem.start_time || '00:00',
      fromAmpm: currentPestItem.from_ampm || 'AM'
    }

    if (editingItemId) {
      // UPDATE EXISTING
      setPestItems(prev => prev.map(i => (i.id === editingItemId ? { ...i, ...item, id: editingItemId } : i)))
      setEditingItemId(null)
    } else {
      // ADD NEW
      setPestItems(prev => [
        ...prev,
        {
          ...item,
          id: generateUniqueId() // simple frontend ID
        }
      ])
    }

    // Reset current item inputs
    setCurrentPestItem({
      pest: '',
      pestId: '',
      frequency: '',
      frequencyId: '',
      pestCount: '',
      pestValue: '',
      total: '',
      start_time: '',
      from_ampm: '',
      chemicals: '',
      chemicalId: '',
      noOfItems: ''
    })

    // Focus back to first input
    refs.pestInputRef.current?.focus()
  }

  const handleSubmit = async () => {
    if (!formData.contractName || !formData.customerId || !formData.startDate || !formData.endDate) {
      showToast('error', 'Required fields are missing!')
      return
    }

    console.log('Final Payload constructing...')

    try {
      // Prepare payload exactly as per Updated Requirement
      const payload = {
        name: formData.contractName,
        customer_id: Number(formData.customerId),
        sales_mode: formData.salesMode?.toLowerCase().replace(/\s+/g, '_'),
        contract_code: formData.contractCode,
        contract_type: formData.contractType?.toLowerCase().replace(/\s+/g, '_'),
        service_address: formData.serviceAddress,
        postal_code: formData.postalCode,
        covered_location: formData.coveredLocation,
        po_number: formData.poNumber,
        po_expiry_date: formatDateToLocal(formData.poExpiry),
        preferred_time: formData.preferredTime?.toTimeString().slice(0, 8),
        report_email: formData.reportEmail,
        contact_person_name: formData.contactPerson,
        phone: formData.sitePhone,
        mobile: formData.mobile,
        call_type_id: Number(formData.callTypeId),
        grouping_code: formData.groupCode,
        start_date: formatDateToLocal(formData.startDate),
        end_date: formatDateToLocal(formData.endDate),
        reminder_date: formatDateToLocal(formData.reminderDate),
        industry_id: Number(formData.industryId),
        contract_value: Number(formData.contractValue),
        technician_id: Number(formData.technicianId),
        billing_term: Number(formData.paymentTerm?.replace(/\D/g, '')), // "30 days" -> 30
        sales_person_id: Number(formData.salesPersonId),
        supervisor_id: Number(formData.supervisorId),
        billing_frequency_id: Number(formData.billingFrequencyId),
        invoice_count: Number(formData.invoiceCount),
        invoice_remarks: formData.invoiceRemarks.join(', '),
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        billing_remarks: formData.billingRemarks,
        agreement_add_1: formData.agreement1,
        agreement_add_2: formData.agreement2,
        technician_remarks: formData.technicianRemarks,
        appointment_remarks: formData.appointmentRemarks,
        floor_plan_file: formData.file ? await fileToBase64(formData.file) : null,

        // MAPPING PEST ITEMS
        pest_items: pestItems.map(i => ({
          customer_id: Number(formData.customerId),
          pest_id: Number(i.pestId),
          frequency_id: Number(i.frequencyId),
          chemical_id: Number(i.chemicalId),
          pest: i.pest,
          frequency: i.frequency,
          chemical_name: i.chemicals,
          no_location: Number(i.pestCount),
          pest_value: Number(i.pestValue),
          pest_service_count: Number(i.noOfItems),
          total_value: Number(i.totalValue),
          work_time: convertTimeToMinutes(i.workTime),
          from_ampm: i.fromAmpm
        }))
      }

      console.log('📤 Submitting Payload:', payload)

      const res = await createContract(payload)
      const data = res?.data || {}

      if (data.status === 'success') {
        const contractData = data.data || {}
        const newContractParam = btoa(
          JSON.stringify({
            id: contractData.id,
            uuid: contractData.uuid,
            contractCode: contractData.contract_code
          })
        )

        showToast('success', data.message || 'Contract Created Successfully!')
        router.push(`/${lang}/admin/contracts?newContract=${newContractParam}`)
      } else {
        showToast('error', data.message || 'Creation failed')
      }
    } catch (e) {
      console.error('Submit Error', e)
      showToast('error', 'Error while saving')
    }
  }

  const renderAuto = ({ name, label, options = [], md = 3 }) => {
    // Helper to find the object from options if we only have ID
    const isObj = options && options.length > 0 && typeof options[0] === 'object'
    const val = isObj ? options.find(o => o.id === formData[`${name}Id`]) || null : formData[name] || null

    return (
      <Grid item xs={12} md={md} key={name}>
        <Autocomplete
          options={options}
          value={val}
          getOptionLabel={o => (typeof o === 'string' ? o : o?.name || '')}
          isOptionEqualToValue={(option, value) => {
             if (!value) return false
             const opId = typeof option === 'object' ? option.id : option
             const valId = typeof value === 'object' ? value.id : value
             return opId === valId
          }}
          renderOption={(props, option) => {
            const { key, ...restProps } = props
            const uniqueKey = (typeof option === 'object' ? option.id : option) || key
            return (
              <li key={uniqueKey} {...restProps}>
                {typeof option === 'string' ? option : option.name}
              </li>
            )
          }}
          open={openStates[name + 'Open']}
          onOpen={() => setOpenStates[name + 'SetOpen'](true)}
          onClose={() => setOpenStates[name + 'SetOpen'](false)}
          onChange={(e, v) => handleAutocompleteChange(name, v || '', refs[name + 'InputRef'])}
          renderInput={p => <CustomTextField {...p} label={label} inputRef={refs[name + 'InputRef']} />}
          onKeyDown={e => handleKeyDown(e, refs[name + 'InputRef'])}
        />
      </Grid>
    )
  }

  // Stepper Handlers
  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1)
  }

  const handleNext = () => {
    setActiveStep(prevActiveStep => prevActiveStep + 1)
  }

  const getStepContent = step => {
    switch (step) {
      case 0: // CONTRACT
        return (
          <Grid container spacing={4}>
            {renderAuto({ name: 'salesMode', label: 'Sales Mode', options: ['Confirmed Sales', 'Quotation'] })}
            {renderAuto({ name: 'customer', label: 'Customer', options: dropdowns.customers })}
            {renderAuto({
              name: 'contractType',
              label: 'Contract Type',
              options: ['Limited Contract', 'Continuous Contract', 'Warranty']
            })}

            <Grid item xs={12} md={3}>
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

            {/* Service Address Section */}
            <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', mb: -2 }}>
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
                    }}
                  />
                }
                label='Copy from Customer'
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <CustomTextField
                fullWidth
                label='Service Address'
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
                value={formData.poNumber}
                onChange={handleChange}
                inputRef={poNumberRef}
                onKeyDown={e => handleKeyDown(e, poNumberRef)}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <AppReactDatepicker
                selected={formData.poExpiry}
                onChange={d => handleDateChange('poExpiry', d, poExpiryRef)}
                customInput={<CustomTextField label='PO Expiry' fullWidth inputRef={poExpiryRef} />}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <AppReactDatepicker
                selected={formData.preferredTime}
                onChange={d => {
                  setFormData(p => ({ ...p, preferredTime: d }))
                  focusNextElement(preferredTimeRef)
                }}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                dateFormat='h:mm aa'
                customInput={<CustomTextField label='Preferred Time' fullWidth inputRef={preferredTimeRef} />}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <CustomTextField
                fullWidth
                label='Report Email'
                name='reportEmail'
                value={formData.reportEmail}
                onChange={handleChange}
                error={reportEmailError}
                onBlur={() => {
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                  setReportEmailError(formData.reportEmail && !emailRegex.test(formData.reportEmail))
                }}
                helperText={reportEmailError ? 'Invalid email format' : ''}
                inputRef={reportEmailRef}
                onKeyDown={e => handleKeyDown(e, reportEmailRef)}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <CustomTextField
                fullWidth
                label='Contact Person'
                name='contactPerson'
                value={formData.contactPerson}
                onChange={handleChange}
                inputRef={contactPersonRef}
                onKeyDown={e => handleKeyDown(e, contactPersonRef)}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <CustomTextField
                fullWidth
                label='Site Phone'
                name='sitePhone'
                value={formData.sitePhone}
                onChange={handleChange}
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
                onChange={handleChange}
                inputRef={mobileRef}
                onKeyDown={e => handleKeyDown(e, mobileRef)}
              />
            </Grid>

            {renderAuto({ name: 'callType', label: 'Call Type', options: dropdowns.callTypes })}
          </Grid>
        )
      case 1: // CONTRACT DETAILS
        return (
          <Grid container spacing={4}>
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
                onChange={d => handleDateChange('startDate', d, startDateRef)}
                customInput={<CustomTextField label='Start Date' fullWidth inputRef={startDateRef} />}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <AppReactDatepicker
                selected={formData.endDate}
                onChange={d => handleDateChange('endDate', d, endDateRef)}
                customInput={<CustomTextField label='End Date' fullWidth inputRef={endDateRef} />}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <AppReactDatepicker
                selected={formData.reminderDate}
                onChange={d => handleDateChange('reminderDate', d, reminderDateRef)}
                customInput={<CustomTextField label='Reminder Date' fullWidth inputRef={reminderDateRef} />}
              />
            </Grid>

            {renderAuto({ name: 'industry', label: 'Industry', options: dropdowns.industries })}
            
            <Grid item xs={12} md={3}>
              <CustomTextField
                fullWidth
                label='Contract Value'
                name='contractValue'
                value={formData.contractValue}
                onChange={handleChange}
                inputRef={contractValueRef}
                onKeyDown={e => handleKeyDown(e, contractValueRef)}
              />
            </Grid>

            {renderAuto({ name: 'technician', label: 'Technician', options: dropdowns.technicians })}
            {renderAuto({ name: 'paymentTerm', label: 'Payment Term', options: ['0 days', '15 days', '30 days', '45 days', '60 days'] })}
            {renderAuto({ name: 'salesPerson', label: 'Sales Person', options: dropdowns.salesPersons })}
            {renderAuto({ name: 'supervisor', label: 'Supervisor', options: dropdowns.supervisors })}

            <Grid item xs={12} md={12}>
              <GlobalTextarea
                name='billingRemarks'
                label='Billing Remarks'
                value={formData.billingRemarks}
                onChange={handleChange}
                ref={billingRemarksRef}
                onKeyDown={e => handleKeyDown(e, billingRemarksRef, true)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <GlobalTextarea
                name='agreement1'
                label='Agreement 1'
                value={formData.agreement1}
                onChange={handleChange}
                ref={agreement1Ref}
                onKeyDown={e => handleKeyDown(e, agreement1Ref, true)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <GlobalTextarea
                name='agreement2'
                label='Agreement 2'
                value={formData.agreement2}
                onChange={handleChange}
                ref={agreement2Ref}
                onKeyDown={e => handleKeyDown(e, agreement2Ref, true)}
              />
            </Grid>
             <Grid item xs={12} md={12}>
              <GlobalTextarea
                name='technicianRemarks'
                label='Technician Remarks'
                value={formData.technicianRemarks}
                onChange={handleChange}
                ref={technicianRemarksRef}
                onKeyDown={e => handleKeyDown(e, technicianRemarksRef, true)}
              />
            </Grid>
            <Grid item xs={12} md={12}>
              <GlobalTextarea
                name='appointmentRemarks'
                label='Appointment Remarks'
                value={formData.appointmentRemarks}
                onChange={handleChange}
                ref={appointmentRemarksRef}
                onKeyDown={e => handleKeyDown(e, appointmentRemarksRef, true)}
              />
            </Grid>
          </Grid>
        )
      case 2:
        return (
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <Typography variant='h6' sx={{ mb: 2 }}>
                Billing
              </Typography>
            </Grid>

            {/* Row 1: Frequency, Invoice Count, Remarks */}
            {renderAuto({
              name: 'billingFrequency',
              label: 'Billing Frequency',
              options: dropdowns.billingFrequencies,
              md: 4
            })}

            <Grid item xs={12} md={4}>
              <CustomTextField
                fullWidth
                label='No. of Invoice'
                name='invoiceCount'
                value={formData.invoiceCount}
                onChange={handleChange}
                inputRef={invoiceCountRef}
                onKeyDown={e => handleKeyDown(e, invoiceCountRef)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={formData.invoiceRemarks}
                onChange={(e, newValue) => {
                  setFormData(prev => ({ ...prev, invoiceRemarks: newValue }))
                }}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    label='Invoice Remarks'
                    placeholder='Type & Enter'
                    inputRef={invoiceRemarksRef}
                  />
                )}
                onKeyDown={e => handleKeyDown(e, invoiceRemarksRef)}
              />
            </Grid>

            {/* Row 2: Lat, Long */}
            <Grid item xs={12} md={6}>
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

            {/* Row 3: File Upload */}
            <Grid item xs={12}>
              <Typography variant='body2' sx={{ mb: 1 }}>
                Upload File
              </Typography>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleFileDrop}
                style={{
                  border: isDragOver ? '2px dashed #007bff' : '2px dashed #ccc',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  backgroundColor: isDragOver ? '#f0f8ff' : '#fafafa'
                }}
              >
                <input
                  type='file'
                  accept='image/*,application/pdf'
                  id='file-upload'
                  style={{ display: 'none' }}
                  onChange={handleNativeFileChange}
                  ref={fileInputRef}
                />
                <label htmlFor='file-upload'>
                  <Typography variant='body1'>Choose File or Drag & Drop Here</Typography>
                </label>
                {formData.uploadedFileName && (
                  <Box mt={2} display='flex' alignItems='center' justifyContent='center'>
                    <Typography variant='body2' sx={{ mr: 1 }}>
                      {formData.uploadedFileName}
                    </Typography>
                    <IconButton size='small' onClick={handleViewFile} color='primary'>
                      <VisibilityIcon />
                    </IconButton>
                  </Box>
                )}
              </div>
            </Grid>

            {/* PEST ITEMS SECTION */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>Pest Items</Divider>
              <Card variant='outlined' sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  {/* Row 1: Pest, Frequency, Count, Value */}
                  <Grid item xs={12} md={3}>
                    <Autocomplete
                      options={cleanOptions(dropdowns.pests || [])}
                      getOptionLabel={o => (typeof o === 'string' ? o : o.name || '')}
                      isOptionEqualToValue={(option, value) => {
                        if (!value) return false
                        const opId = typeof option === 'object' ? option.id : option
                        const valId = typeof value === 'object' ? value.id : value
                        return opId === valId
                      }}
                      renderOption={(props, option) => {
                        const { key, ...restProps } = props
                        const uniqueKey = (typeof option === 'object' ? option.id : option) || key
                        return (
                          <li key={uniqueKey} {...restProps}>
                            {typeof option === 'string' ? option : option.name}
                          </li>
                        )
                      }}
                      value={currentPestItem.pest}
                      onChange={(e, v) => handleCurrentPestItemAutocompleteChange('pest', v, refs.pestInputRef)}
                      renderInput={params => <CustomTextField {...params} label='Pest' inputRef={refs.pestInputRef} />}
                      onKeyDown={e => handleKeyDown(e, refs.pestInputRef)}
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <Autocomplete
                      options={cleanOptions(dropdowns.serviceFrequencies || [])}
                      getOptionLabel={o => (typeof o === 'string' ? o : o.name || '')}
                      isOptionEqualToValue={(option, value) => {
                        if (!value) return false
                        const opId = typeof option === 'object' ? option.id : option
                        const valId = typeof value === 'object' ? value.id : value
                        return opId === valId
                      }}
                      renderOption={(props, option) => {
                        const { key, ...restProps } = props
                        const uniqueKey = (typeof option === 'object' ? option.id : option) || key
                        return (
                          <li key={uniqueKey} {...restProps}>
                            {typeof option === 'string' ? option : option.name}
                          </li>
                        )
                      }}
                      value={currentPestItem.frequency}
                      onChange={(e, v) =>
                        handleCurrentPestItemAutocompleteChange('frequency', v, refs.frequencyInputRef)
                      }
                      renderInput={params => (
                        <CustomTextField {...params} label='Frequency' inputRef={refs.frequencyInputRef} />
                      )}
                      onKeyDown={e => handleKeyDown(e, refs.frequencyInputRef)}
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <CustomTextField
                      fullWidth
                      label='Pest Count'
                      name='pestCount'
                      value={currentPestItem.pestCount}
                      onChange={handleCurrentPestItemChange}
                      inputRef={currentPestCountRef}
                      onKeyDown={e => handleKeyDown(e, currentPestCountRef)}
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <CustomTextField
                      fullWidth
                      label='Pest Value'
                      name='pestValue'
                      value={currentPestItem.pestValue}
                      onChange={handleCurrentPestItemChange}
                      inputRef={currentPestValueRef}
                      onKeyDown={e => handleKeyDown(e, currentPestValueRef)}
                    />
                  </Grid>

                  {/* Row 2: Total, Time, Chemicals, No of Items */}
                  <Grid item xs={12} md={3}>
                    <CustomTextField
                      fullWidth
                      label='Total'
                      name='total'
                      value={currentPestItem.total}
                      InputProps={{ readOnly: true }}
                      aria-readonly
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <AppReactDatepicker
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={15}
                      selected={currentPestItem.start_time ? new Date(`1970-01-01T${currentPestItem.start_time}`) : null}
                      onChange={time => {
                        if (!time) {
                          setCurrentPestItem(prev => ({ ...prev, start_time: '', from_ampm: '' }))
                          return
                        }
                        const date = new Date(time)
                        const formattedTime = date.toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                        const ampm = date.getHours() >= 12 ? 'PM' : 'AM'
                        setCurrentPestItem(prev => ({
                          ...prev,
                          start_time: formattedTime,
                          from_ampm: ampm
                        }))
                      }}
                      dateFormat='h:mm aa'
                      customInput={<GlobalTextField fullWidth label='Time' />}
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <Autocomplete
                      options={cleanOptions(dropdowns.chemicals || [])}
                      getOptionLabel={o => (typeof o === 'string' ? o : o.name || '')}
                      isOptionEqualToValue={(option, value) => {
                        if (!value) return false
                        const opId = typeof option === 'object' ? option.id : option
                        const valId = typeof value === 'object' ? value.id : value
                        return opId === valId
                      }}
                      renderOption={(props, option) => {
                        const { key, ...restProps } = props
                        const uniqueKey = (typeof option === 'object' ? option.id : option) || key
                        return (
                          <li key={uniqueKey} {...restProps}>
                            {typeof option === 'string' ? option : option.name}
                          </li>
                        )
                      }}
                      value={currentPestItem.chemicals}
                      onChange={(e, v) =>
                        handleCurrentPestItemAutocompleteChange('chemicals', v, currentChemicalsRef)
                      }
                      renderInput={params => (
                        <CustomTextField {...params} label='Chemicals' inputRef={currentChemicalsRef} />
                      )}
                      onKeyDown={e => handleKeyDown(e, currentChemicalsRef)}
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <CustomTextField
                      fullWidth
                      label='No of Items'
                      name='noOfItems'
                      value={currentPestItem.noOfItems}
                      onChange={handleCurrentPestItemChange}
                      inputRef={currentNoOfItemsRef}
                      onKeyDown={e => handleKeyDown(e, currentNoOfItemsRef)}
                    />
                  </Grid>

                  <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <Button variant='contained' color='primary' onClick={handleSavePestItem} ref={addPestButtonRef}>
                      {editingItemId ? 'Update Pest' : 'Add Pest'}
                    </Button>
                  </Grid>
                </Grid>
              </Card>

              {/* PEST ITEMS TABLE */}
              <Table sx={{ mt: 3, border: '1px solid #ddd' }}>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell>Pest Name</TableCell>
                    <TableCell>Frequency</TableCell>
                    <TableCell>Count</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Chemicals</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pestItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align='center'>
                        No items added
                      </TableCell>
                    </TableRow>
                  ) : (
                    pestItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{item.pest}</TableCell>
                        <TableCell>{item.frequency}</TableCell>
                        <TableCell>{item.pestCount}</TableCell>
                        <TableCell>{item.pestValue}</TableCell>
                        <TableCell>{item.totalValue}</TableCell>
                        <TableCell>{item.workTime} {item.fromAmpm}</TableCell>
                        <TableCell>{item.chemicals}</TableCell>
                        <TableCell>
                          <IconButton size='small' onClick={() => handleEditPestItem(item)} color='primary'>
                            <EditIcon />
                          </IconButton>
                          <IconButton size='small' onClick={() => handleDeletePestItem(item.id)} color='error'>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Grid>
          </Grid>
        )
      default:
        return 'Unknown Step'
    }
  }

  const renderButtons = () => {
    return (
      <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant='tonal'
          color='secondary'
          disabled={activeStep === 0}
          onClick={handleBack}
          startIcon={<DirectionalIcon ltrIconClass='tabler-arrow-left' rtlIconClass='tabler-arrow-right' />}
        >
          Back
        </Button>
        <Button
          variant='contained'
          onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
          ref={activeStep === steps.length - 1 ? saveButtonRef : null}
          endIcon={
            activeStep === steps.length - 1 ? (
              <i className='tabler-check' />
            ) : (
              <DirectionalIcon ltrIconClass='tabler-arrow-right' rtlIconClass='tabler-arrow-left' />
            )
          }
        >
          {activeStep === steps.length - 1 ? 'Submit' : 'Next'}
        </Button>
      </Grid>
    )
  }

  return (
    <ContentLayout
      title='Add Contract'
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Contracts', href: '/admin/contracts' },
        { label: 'Add' }
      ]}
    >
      <Card sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
        <StepperHeaderContainer>
          <StepperWrapper sx={{ height: '100%' }}>
            <Stepper
              activeStep={activeStep}
              orientation='vertical'
              connector={<></>}
              sx={{ height: '100%', minWidth: '15rem' }}
            >
              {steps.map((step, index) => {
                return (
                  <Step key={index} completed={false}>
                    <StepLabel>
                      <div className='step-label'>
                        <CustomAvatar
                          variant='rounded'
                          skin={activeStep === index ? 'filled' : 'light'}
                          {...(activeStep >= index && { color: 'primary' })}
                          {...(activeStep === index && { className: 'shadow-primarySm' })}
                          size={38}
                        >
                          <i className={classnames(step.icon)} />
                        </CustomAvatar>
                        <div>
                          <Typography className='step-title'>{step.title}</Typography>
                          <Typography className='step-subtitle'>{step.subtitle}</Typography>
                        </div>
                      </div>
                    </StepLabel>
                  </Step>
                )
              })}
            </Stepper>
          </StepperWrapper>
        </StepperHeaderContainer>
        <Divider sx={{ m: '0 !important' }} />
        <CardContent sx={{ width: '100%' }}>
          <form onSubmit={e => e.preventDefault()}>
            <Grid container spacing={5}>
              <Grid item xs={12}>
                <Typography variant='body2' sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {steps[activeStep].title}
                </Typography>
                <Typography variant='caption' component='p'>
                  {steps[activeStep].subtitle}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                {getStepContent(activeStep)}
              </Grid>
              {renderButtons()}
            </Grid>
          </form>
        </CardContent>
      </Card>

      {/* File View Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth='md' fullWidth>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
          {formData.file?.type?.startsWith('image/') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={formData.uploadedFileURL}
              alt='Floor Plan'
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
            />
          ) : (
            <iframe
              src={formData.uploadedFileURL}
              title='Floor Plan PDF'
              width='100%'
              height='600px'
              style={{ border: 'none' }}
            />
          )}
        </DialogContent>
      </Dialog>
    </ContentLayout>
  )
}
