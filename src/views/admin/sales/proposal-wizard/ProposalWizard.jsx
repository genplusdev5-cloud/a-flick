'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Chip,
  Select,
  MenuItem,
  FormControl,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio
} from '@mui/material'
import { styled } from '@mui/material/styles'
import classnames from 'classnames'
import CustomAvatar from '@core/components/mui/Avatar'
import StepperWrapper from '@core/styles/stepper'
import { showToast } from '@/components/common/Toasts'

// Components
import CustomTextField from '@core/components/mui/TextField'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

// Icons
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'

import styles from '@core/styles/table.module.css'

// API
import { addProposal, updateProposal, getProposalDetails, getProposalList } from '@/api/sales/proposal'
import { getContractDates, getInvoiceCount, getPestCount, getInvoiceRemark } from '@/api/contract_group/contract'
import { getAllDropdowns } from '@/api/contract_group/contract/dropdowns'
import { getCustomerDetails } from '@/api/customer_group/customer'
import { listCallLogs } from '@/api/contract_group/contract/details/call_log'
import { decodeId } from '@/utils/urlEncoder'
import addContractFile from '@/api/contract_group/contract/details/contract_file/add'

// Steps
import Step1DealType from './steps/Step1DealType'
import Step2CustomerInfo from './steps/Step2CustomerInfo'
import Step3ServiceDetails from './steps/Step3ServiceDetails'
import Step4PestItems, { TableSection, DebouncedInput } from './steps/Step4PestItems'
import Step5Review from './steps/Step5Review'

// Steps Definition
const steps = [
  { icon: 'tabler-file-description', title: 'Sales Type', subtitle: 'Basic contract info' },
  { icon: 'tabler-user', title: 'Customer Info', subtitle: 'Address & Contact' },
  { icon: 'tabler-calendar-time', title: 'Billing Details', subtitle: 'Dates & Staff' },
  { icon: 'tabler-bug', title: 'Service Details', subtitle: 'Pest information' },
  { icon: 'tabler-check', title: 'Review', subtitle: 'Remarks & Finish' }
]

const StyledStep = styled(Step)({
  '&.Mui-completed .step-title , &.Mui-completed .step-subtitle': {
    color: 'var(--mui-palette-text-disabled)'
  }
})

// 💡 UPDATED: Helper to format date for API (DD/MM/YYYY)
const formatDate = date => {
  if (!date) return ''
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

// 💡 NEW: Helper to format date locally (YYYY-MM-DD) for MUI pickers if needed
const formatDateToLocal = date => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatPhoneNumber = value => {
  if (!value) return ''
  const cleaned = value.replace(/\D/g, '').slice(0, 10)
  if (cleaned.length > 5) {
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
  }
  return cleaned
}

// 💡 NEW: Helper to convert file to base64
const fileToBase64 = file => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = error => reject(error)
  })
}

export default function ProposalWizard({ id }) {
  const router = useRouter()
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(!!id)
  const [editingItemId, setEditingItemId] = useState(null)

  // File Dialog
  const [openDialog, setOpenDialog] = useState(false)

  // ----------------------------------------------------------------------
  // FORM STATE
  // ----------------------------------------------------------------------
  const [formData, setFormData] = useState({
    // Step 1
    company: '',
    companyId: '', // ✅ Add companyId
    salesMode: '', // Keeping for safe removal or backward compat if needed
    contractType: '',
    proposalStatus: 'Draft',
    name: '', // Renamed from contractName
    contractCode: '',
    // Additional Step 1 Fields
    customer: '',
    customerId: '', // Moved from Step 2 conceptually for data binding
    businessName: '',
    bgTesting: 'No',
    billingName: '',
    billingAddress: '',
    billingPostalCode: '',
    customerCode: '',
    groupCode: '',
    accCode: '',
    picContactName: '',
    picEmail: '',
    picPhone: '',
    billingContactName: '',
    billingEmail: '',
    billingPhone: '',

    // Step 2
    // customer: '', // Moved to Step 1
    serviceAddress: '',
    postalCode: '',
    coveredLocation: '',
    poNumber: '',
    poExpiry: null,
    preferredTime: null,
    reportEmail: '',
    contactPerson: '', // Site Contact Person
    sitePhone: '',
    mobile: '',
    callType: '',
    callTypeId: '',
    startDate: null,
    endDate: null,
    reminderDate: null,
    industry: '',
    industryId: '',
    paymentTerm: '',
    salesPerson: '',
    salesPersonId: '',
    latitude: '',
    longitude: '',

    // Step 3
    technician: '',
    technicianId: '',
    supervisor: '',
    supervisorId: '',
    billingFrequencyId: '',
    invoiceCount: 0,
    invoiceRemarks: [], // Selected remarks (strings)
    invoiceRemarksOptions: [], // Suggested remarks from API
    riskAssessment: '',
    copyCustomerAddress: false,
    reportBlock: '', // New
    contractValue: '',
    billingFrequency: '',
    // Files
    file: null,
    uploadedFileName: '',
    uploadedFileURL: '',

    // Step 5 (Remarks)
    billingRemarks: '',
    technicianRemarks: '',
    appointmentRemarks: '',
    agreement1: '',
    agreement2: '',

    // Hidden / Calculations
    invoiceRemarks: [],
    latitude: '',
    longitude: ''
  })

  // Table Data State
  const [callLogs, setCallLogs] = useState([])
  const [proposals, setProposals] = useState([])

  const [callLogSearch, setCallLogSearch] = useState('')
  const [propSearch, setPropSearch] = useState('')

  const [callLogPagination, setCallLogPagination] = useState({ pageIndex: 0, pageSize: 5 })
  const [propPagination, setPropPagination] = useState({ pageIndex: 0, pageSize: 5 })

  const [callLogDialogOpen, setCallLogDialogOpen] = useState(false)

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
    chemical: '',
    chemicalId: '',
    noOfItems: ''
  })

  const [pestItems, setPestItems] = useState([])

  const [currentCallLog, setCurrentCallLog] = useState({
    reminder: true,
    reminderDate: null,
    reminderTime: null,
    assignTo: '',
    remarks: '',
    remarksType: 'All'
  })

  const [dropdowns, setDropdowns] = useState({
    customers: [],
    companies: [], // ✅ Add companies dropdown
    callTypes: [],
    industries: [],
    technicians: [],
    supervisors: [],
    salesPersons: [],
    billingFrequencies: [],
    serviceFrequencies: [],
    pests: [],
    chemicals: [],
    // Added for safety
    frequencies: []
  })

  // Refs for focusing (simplified for Wizard, can expand if needed)
  const refs = {
    salesModeInputRef: useRef(null),
    contractTypeInputRef: useRef(null),
    nameRef: useRef(null), // Renamed from contractNameRef
    // ... add more as needed for critical focus points

    // Pest Item Refs
    pestInputRef: useRef(null),
    frequencyInputRef: useRef(null),
    currentPestCountRef: useRef(null),
    currentPestValueRef: useRef(null),
    currentTotalRef: useRef(null),
    timeInputRef: useRef(null),
    currentChemicalsRef: useRef(null),
    currentNoOfItemsRef: useRef(null),
    addPestButtonRef: useRef(null),
    fileUploadButtonRef: useRef(null),

    // Step 1
    companyRef: useRef(null),
    customerRef: useRef(null),
    contractTypeRef: useRef(null),
    billingNameRef: useRef(null),
    billingAddressRef: useRef(null),
    billingPostalCodeRef: useRef(null),
    customerCodeRef: useRef(null),
    groupCodeRef: useRef(null),
    accCodeRef: useRef(null),
    picContactNameRef: useRef(null),
    picEmailRef: useRef(null),
    picPhoneRef: useRef(null),
    billingContactNameRef: useRef(null),
    billingEmailRef: useRef(null),
    billingPhoneRef: useRef(null),

    // Step 2
    serviceAddressRef: useRef(null),
    postalCodeRef: useRef(null),
    coveredLocationRef: useRef(null),
    poNumberRef: useRef(null),
    poExpiryRef: useRef(null),
    preferredTimeRef: useRef(null),
    reportEmailRef: useRef(null),
    contactPersonRef: useRef(null),
    sitePhoneRef: useRef(null),
    mobileRef: useRef(null),
    callTypeRef: useRef(null),
    startDateRef: useRef(null),
    endDateRef: useRef(null),
    reminderDateRef: useRef(null),
    industryRef: useRef(null),
    paymentTermRef: useRef(null),
    salesPersonRef: useRef(null),
    latitudeRef: useRef(null),
    longitudeRef: useRef(null),

    // Step 3
    billingFrequencyRef: useRef(null),
    reportBlockRef: useRef(null),
    technicianRef: useRef(null),
    supervisorRef: useRef(null)
  }

  const focusableElementRefs = useMemo(
    () => [
      // Step 0
      refs.companyRef,
      refs.customerRef,
      refs.contractTypeRef,
      refs.nameRef,
      refs.billingNameRef,
      refs.billingAddressRef,
      refs.billingPostalCodeRef,
      refs.customerCodeRef,
      refs.groupCodeRef,
      refs.accCodeRef,
      refs.picContactNameRef,
      refs.picEmailRef,
      refs.picPhoneRef,
      refs.billingContactNameRef,
      refs.billingEmailRef,
      refs.billingPhoneRef,

      // Step 1
      refs.serviceAddressRef,
      refs.postalCodeRef,
      refs.coveredLocationRef,
      refs.poNumberRef,
      refs.poExpiryRef,
      refs.preferredTimeRef,
      refs.reportEmailRef,
      refs.contactPersonRef,
      refs.sitePhoneRef,
      refs.mobileRef,
      refs.callTypeRef,
      refs.startDateRef,
      refs.endDateRef,
      refs.reminderDateRef,
      refs.industryRef,
      refs.paymentTermRef,
      refs.salesPersonRef,
      refs.latitudeRef,
      refs.longitudeRef,

      // Step 2
      refs.billingFrequencyRef,
      refs.reportBlockRef,
      refs.technicianRef,
      refs.supervisorRef,

      // Pest Item
      refs.pestInputRef,
      refs.frequencyInputRef,
      refs.currentPestValueRef,
      refs.timeInputRef,
      refs.currentChemicalsRef,
      refs.currentNoOfItemsRef,
      refs.addPestButtonRef
    ],
    [refs]
  )

  const focusNextElement = useCallback(
    currentRef => {
      const currentIndex = focusableElementRefs.findIndex(ref => ref === currentRef)
      if (currentIndex !== -1 && currentIndex < focusableElementRefs.length - 1) {
        const nextRef = focusableElementRefs[currentIndex + 1]
        nextRef.current?.focus()
      }
    },
    [focusableElementRefs]
  )

  const handleKeyDown = (e, currentRef) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      focusNextElement(currentRef)
    }
  }

  // ----------------------------------------------------------------------
  // LOAD DATA
  // ----------------------------------------------------------------------
  useEffect(() => {
    const init = async () => {
      await loadDropdowns()
      if (id) {
        await loadDetails(id)
      } else {
        // Set default time for new entries
        const d = new Date()
        d.setHours(9, 0, 0, 0)
        setFormData(prev => ({ ...prev, preferredTime: d }))
      }
      setLoading(false)
    }
    init()
  }, [id])

  // Load Call Logs and Proposals when customer is available
  useEffect(() => {
    if (formData.customerId) {
      if (callLogs.length === 0) {
        listCallLogs({ customer_id: formData.customerId })
          .then(res => {
            if (res?.data?.status === 'success') {
              setCallLogs(Array.isArray(res.data.data) ? res.data.data : [])
            }
          })
          .catch(err => console.error('Fetch Logs Error:', err))
      }

      if (proposals.length === 0) {
        getProposalList({ customer_id: formData.customerId })
          .then(res => {
            if (res?.status === 'success') {
              setProposals(Array.isArray(res.data) ? res.data : [])
            }
          })
          .catch(err => console.error('Fetch Proposals Error:', err))
      }
    } else {
      // Clear logs/proposals if no customer is selected
      if (callLogs.length > 0) setCallLogs([])
      if (proposals.length > 0) setProposals([])
    }
  }, [formData.customerId, callLogs.length, proposals.length])

  // --- External Tables Logic (Call Logs) ---
  const filteredCallLogs = useMemo(() => {
    if (!Array.isArray(callLogs)) return []
    if (!callLogSearch) return callLogs
    const lower = callLogSearch.toLowerCase()
    return callLogs.filter(i => Object.values(i).some(v => String(v).toLowerCase().includes(lower)))
  }, [callLogs, callLogSearch])

  const paginatedCallLogs = useMemo(() => {
    const start = callLogPagination.pageIndex * callLogPagination.pageSize
    return filteredCallLogs.slice(start, start + callLogPagination.pageSize)
  }, [filteredCallLogs, callLogPagination])

  // --- External Tables Logic (Proposals) ---
  const filteredProposals = useMemo(() => {
    if (!Array.isArray(proposals)) return []
    if (!propSearch) return proposals
    const lower = propSearch.toLowerCase()
    return proposals.filter(i => Object.values(i).some(v => String(v).toLowerCase().includes(lower)))
  }, [proposals, propSearch])

  const paginatedProposals = useMemo(() => {
    const start = propPagination.pageIndex * propPagination.pageSize
    return filteredProposals.slice(start, start + propPagination.pageSize)
  }, [filteredProposals, propPagination])

  const onSaveCallLog = () => {
    handleSaveCallLog()
    setCallLogDialogOpen(false)
  }

  const loadDropdowns = async () => {
    try {
      const data = await getAllDropdowns()

      setDropdowns({
        ...data,
        billingFrequencies: data.billingFreq,
        serviceFrequencies: data.serviceFreq,
        frequencies: data.billingFreq, // Updated to use Billing Frequency as per user request
        salesPersons: data.salesPeople
      })

      // ✅ Default Origin to A-Flick if New Entry
      if (!id) {
        const aflick = data.companies?.find(
          c => c.label?.toLowerCase().includes('a-flick') || c.name?.toLowerCase().includes('a-flick')
        )
        if (aflick) {
          setFormData(prev => ({ ...prev, company: aflick.label || aflick.name, companyId: aflick.id || aflick.value }))
        }
      }
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to load dropdowns')
    }
  }

  const loadDetails = async proposalId => {
    try {
      const decodedId = decodeId(proposalId) || proposalId
      const res = await getProposalDetails(decodedId)
      const data = res?.status === 'success' || res ? res.data || res : null

      if (data) {
        setFormData(prev => ({
          ...prev,
          id: data.id,
          companyId: data.company_id,
          salesMode: data.sales_mode?.replace(/_/g, ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || '',
          customerId: data.customer_id,
          customer: data.customer,
          name: data.name || '',
          contractType: data.contract_type?.replace(/_/g, ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || '',
          contractCode: data.contract_code || '',
          serviceAddress: data.service_address || '',
          postalCode: data.postal_code || '',
          coveredLocation: data.covered_location || '',
          poNumber: data.po_number || '',
          poExpiry: parseSafeDate(data.po_expiry_date),
          preferredTime: parseSafeTime(data.preferred_time),
          reportEmail: data.report_email || '',
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
              id: Date.now().toString(36) + Math.random().toString(36).substring(2),
              item_id: item.id,
              pest: item.pest,
              pestId: item.pest_id,
              frequency: item.frequency,
              frequencyId: item.frequency_id,
              pestCount: item.no_location,
              pestValue: item.pest_value,
              totalValue: item.total_value,
              workTime: convertMinutesToTime(item.work_time),
              chemical: item.chemical_name || item.chemical || '',
              chemicals: item.chemical_name || item.chemical || '',
              chemicalId: item.chemical_id,
              noOfItems: item.pest_service_count
            }))
          )
        }
      }
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to load details')
    }
  }

  // ----------------------------------------------------------------------
  // HELPERS
  // ----------------------------------------------------------------------
  const parseSafeDate = dStr => {
    if (!dStr || dStr === '0000-00-00' || dStr === '00-00-0000') return null
    const d = new Date(dStr)
    return isNaN(d.getTime()) ? null : d
  }
  const parseSafeTime = tStr => {
    if (!tStr || tStr === '00:00:00' || tStr === '00:00') return null
    const d = new Date(`1970-01-01T${tStr}`)
    return isNaN(d.getTime()) ? null : d
  }
  const convertMinutesToTime = mins => {
    if (!mins) return '0:00'
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `${h}:${m.toString().padStart(2, '0')}`
  }
  const convertTimeToMinutes = str => {
    if (!str) return 0
    const [h, m] = str.split(':').map(Number)
    return h * 60 + m
  }
  const formatDate = date => {
    if (!date) return ''
    return new Date(date).toISOString().split('T')[0]
  }

  useEffect(() => {
    const fetchInvoiceCount = async () => {
      if (!formData.billingFrequencyId || !formData.startDate || !formData.endDate) {
        setFormData(prev => ({ ...prev, invoiceCount: '' }))
        return
      }

      try {
        const payload = {
          billing_frequency_id: Number(formData.billingFrequencyId),
          start_date: formatDate(formData.startDate),
          end_date: formatDate(formData.endDate)
        }

        const res = await getInvoiceCount(payload)

        if (res?.status === 'success') {
          setFormData(prev => ({
            ...prev,
            invoiceCount: res.invoice_count ?? res.data?.invoice_count ?? 0
          }))
        }
      } catch (err) {
        console.error('Invoice Count Fetch Error', err)
      }
    }

    fetchInvoiceCount()
  }, [formData.billingFrequencyId, formData.startDate, formData.endDate])

  // ----------------------------------------------------------------------
  // ACTION HANDLERS
  // ----------------------------------------------------------------------

  const validateStep = step => {
    if (step === 0) {
      if (!formData.name) {
        showToast('error', 'Contract Name is required!')
        return false
      }
      if (!formData.customerId) {
        showToast('error', 'Customer is required!')
        return false
      }
    }

    if (step === 1) {
      if (!formData.startDate || !formData.endDate) {
        showToast('warning', 'Please enter Start Date and End Date!')
        return false
      }
    }
    return true
  }

  const handleNext = () => {
    if (!validateStep(activeStep)) return

    if (activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrev = () => {
    if (activeStep > 0) setActiveStep(prev => prev - 1)
  }

  const handleChange = e => {
    const { name, value } = e.target
    if (['picPhone', 'billingPhone', 'sitePhone', 'mobile'].includes(name)) {
      setFormData({ ...formData, [name]: formatPhoneNumber(value) })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleAutocompleteChange = (name, newValue, ref) => {
    const isObject = typeof newValue === 'object' && newValue !== null
    setFormData(prev => ({
      ...prev,
      [name]: isObject ? newValue.label || newValue.name || '' : newValue,
      [`${name}Id`]: isObject ? newValue.value || newValue.id || '' : ''
    }))
    if (ref) focusNextElement(ref)
  }

  const handleDateChange = async (name, date) => {
    setFormData(prev => ({ ...prev, [name]: date }))
    // Auto-calculate End Date / Reminder Date
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
        console.error(e)
      }
    }
  }

  // --- Pest Item Handlers ---
  const handleCurrentPestItemChange = e => {
    const { name, value } = e.target
    setCurrentPestItem(prev => {
      const nextState = { ...prev, [name]: value }

      // Auto-calculate Total if pestCount or pestValue changes
      if (name === 'pestCount' || name === 'pestValue') {
        const count = Number(nextState.pestCount || 0)
        const val = Number(nextState.pestValue || 0)
        const totalNum = count * val
        nextState.total = isNaN(totalNum) ? '0' : totalNum.toString()
      }

      return nextState
    })
  }

  const handleCurrentPestItemAutocompleteChange = (name, newValue, ref) => {
    const isObject = typeof newValue === 'object' && newValue !== null
    setCurrentPestItem(prev => ({
      ...prev,
      [name]: isObject ? newValue.label || newValue.name || '' : newValue,
      [`${name}Id`]: isObject ? newValue.value || newValue.id || '' : ''
    }))
    if (ref) focusNextElement(ref)
  }

  // --- Auto-calculate Pest Count ---
  useEffect(() => {
    const { pestId, frequencyId } = currentPestItem
    const { startDate, endDate } = formData

    if (pestId && frequencyId && startDate && endDate) {
      console.log('Fetching Pest Count with:', {
        pest_id: pestId,
        service_frequency_id: frequencyId,
        start_date: formatDateToLocal(startDate),
        end_date: formatDateToLocal(endDate)
      })

      getPestCount({
        pest_id: Number(pestId),
        service_frequency_id: Number(frequencyId),
        billing_frequency_id: Number(frequencyId), // Added this as we are using Billing Frequencies now
        start_date: formatDateToLocal(startDate),
        end_date: formatDateToLocal(endDate)
      })
        .then(res => {
          console.log('Pest Count API Response:', res)
          if (res?.status === 'success') {
            const count = res.data?.pest_count ?? '0'
            setCurrentPestItem(prev => {
              const totalNum = Number(count) * Number(prev.pestValue || 0)
              return {
                ...prev,
                pestCount: String(count),
                total: isNaN(totalNum) ? '0' : totalNum.toString()
              }
            })
          }
        })
        .catch(err => console.error('Pest Count Error:', err))
    }
  }, [currentPestItem.pestId, currentPestItem.frequencyId, formData.startDate, formData.endDate])

  const handleSavePestItem = () => {
    if (!formData.startDate || !formData.endDate || !currentPestItem.pest || !currentPestItem.frequency) {
      showToast('warning', 'Dates, Pest, and Frequency are required.')
      return
    }
    const itemPayload = {
      ...currentPestItem,
      totalValue: currentPestItem.total || '0',
      workTime: currentPestItem.time || '0:00'
    }

    if (editingItemId) {
      setPestItems(prev =>
        prev.map(item => (item.id === editingItemId ? { ...item, ...itemPayload, id: editingItemId } : item))
      )
      setEditingItemId(null)
    } else {
      setPestItems(prev => [...prev, { ...itemPayload, id: Date.now().toString(36) }])
    }

    // Reset selective fields
    setCurrentPestItem(prev => ({
      pest: '',
      pestId: '',
      frequency: prev.frequency,
      frequencyId: prev.frequencyId,
      pestCount: prev.pestCount,
      pestValue: '',
      total: '',
      time: '',
      chemicals: '',
      chemical: '',
      chemicalId: '',
      noOfItems: ''
    }))
    // Focus back to pest field
    setTimeout(() => refs.pestInputRef.current?.focus(), 100)
  }

  const handleEditPestItem = item => {
    setCurrentPestItem({
      pest: item.pest,
      pestId: item.pestId,
      frequency: item.frequency,
      frequencyId: item.frequencyId,
      pestCount: item.pestCount,
      pestValue: item.pestValue,
      total: item.totalValue,
      time: item.workTime || '0:00',
      chemical: item.chemical || item.chemicals,
      chemicals: item.chemicals,
      chemicalId: item.chemicalId,
      noOfItems: item.noOfItems
    })
    setEditingItemId(item.id)
  }

  const handleDeletePestItem = id => {
    if (editingItemId === id) setEditingItemId(null)
    setPestItems(prev => prev.filter(i => i.id !== id))
  }

  const handleCurrentCallLogChange = (field, value) => {
    setCurrentCallLog(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveCallLog = () => {
    const newLog = {
      ...currentCallLog,
      id: Date.now(),
      entry_date: new Date().toLocaleDateString('en-GB'),
      reminder_date: currentCallLog.reminderDate ? currentCallLog.reminderDate.toLocaleDateString('en-GB') : '-',
      reminder_time: currentCallLog.reminderTime
        ? currentCallLog.reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '-'
    }
    setCallLogs(prev => [...prev, newLog])
    setCurrentCallLog({
      reminder: true,
      reminderDate: null,
      reminderTime: null,
      assignTo: '',
      remarks: '',
      remarksType: 'All'
    })
  }

  // 🔹 FETCH INVOICE REMARKS BASED ON PEST ITEMS
  const fetchInvoiceRemarks = async items => {
    // If specific conditions met, fetch remarks.
    // Assuming backend logic.
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
          invoiceRemarksOptions: res.data // Use as options
        }))
      }
    } catch (err) {
      console.error('❌ Invoice Remark API failed', err)
    }
  }

  // Auto-fetch invoice remarks when pestItems changes
  useEffect(() => {
    // Only if user hasn't manually edited?
    // Usually this overwrites, or appends.
    // Mimicking original behavior: it overwrites.
    // But we should be careful if editing.
    // Let's enable it as per original file behavior.
    fetchInvoiceRemarks(pestItems)
  }, [pestItems])

  // --- Customer Copy ---
  const copyFromCustomer = async customerId => {
    if (!customerId) return
    try {
      const res = await getCustomerDetails(customerId)
      if (res?.status === 'success') {
        const c = res.data
        setFormData(prev => ({
          ...prev,
          serviceAddress: c.billing_address || '',
          postalCode: c.postal_code || '',
          contactPerson: c.pic_contact_name || '',
          sitePhone: c.pic_phone || '',
          mobile: c.mobile_no || '',
          reportEmail: (c.billing_email || c.pic_email || '').trim()
        }))
      }
    } catch (err) {
      showToast('error', 'Failed to copy customer details')
    }
  }

  // --- Files ---
  const handleNativeFileChange = e => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, file, uploadedFileName: file.name, uploadedFileURL: URL.createObjectURL(file) }))
    }
  }

  // --- SUBMIT ---
  const handleSubmit = async () => {
    if (!formData.name) {
      showToast('error', `Contract Name is required!`)
      return
    }
    if (!formData.customerId) {
      showToast('error', `Customer is required!`)
      return
    }
    if (pestItems.length === 0) {
      showToast('error', 'Please add at least one Pest Item!')
      return
    }

    const totalValueSum = pestItems.reduce((acc, curr) => acc + (Number(curr.totalValue) || 0), 0)

    const payload = {
      id: id ? decodeId(id) || id : null, // Add numeric ID to root
      name: formData.name || '',
      company_id: String(formData.companyId || ''),
      customer_id: Number(formData.customerId),
      sales_mode: formData.salesMode?.toLowerCase().replace(/\s+/g, '_') || null,
      contract_code: formData.contractCode || null,
      contract_type: formData.contractType?.toLowerCase().replace(/\s+/g, '_') || null,
      service_address: formData.serviceAddress || null,
      postal_address: formData.postalCode || null,
      postal_code: formData.postalCode || null,
      covered_location: formData.coveredLocation || null,
      po_number: formData.poNumber || null,
      po_expiry_date: formatDate(formData.poExpiry) || null,
      proposal_date: formatDate(new Date()),
      preferred_time: formData.preferredTime ? formData.preferredTime.toTimeString().slice(0, 8) : '09:00:00',
      report_email: formData.reportEmail || null,
      contact_person_name: formData.contactPerson || null,
      phone: formData.sitePhone || null,
      mobile: formData.mobile || null,
      call_type_id: formData.callTypeId ? Number(formData.callTypeId) : null,
      grouping_code: formData.groupCode || null,
      start_date: formatDate(formData.startDate) || null,
      end_date: formatDate(formData.endDate) || null,
      reminder_date: formatDate(formData.reminderDate) || null,
      industry_id: formData.industryId ? Number(formData.industryId) : null,
      contract_value: Number(totalValueSum),
      technician_id: formData.technicianId ? Number(formData.technicianId) : null,
      billing_term: formData.paymentTerm ? Number(formData.paymentTerm.replace(/\D/g, '')) : null,
      sales_person_id: formData.salesPersonId ? Number(formData.salesPersonId) : null,
      supervisor_id: formData.supervisorId ? Number(formData.supervisorId) : null,
      billing_frequency_id: formData.billingFrequencyId ? Number(formData.billingFrequencyId) : null,
      invoice_count: formData.invoiceCount ? Number(formData.invoiceCount) : 0,
      invoice_remarks: formData.invoiceRemarks?.join?.(', ') || null,
      latitude: formData.latitude ? Number(formData.latitude) : null,
      longitude: formData.longitude ? Number(formData.longitude) : null,
      billing_remarks: formData.billingRemarks || null,
      agreement_add_1: formData.agreement1 || null,
      agreement_add_2: formData.agreement2 || null,
      technician_remarks: formData.technicianRemarks || null,
      appointment_remarks: formData.appointmentRemarks || null,

      // Flags
      is_new: id ? 0 : 1, // 0 for update, 1 for new
      is_active: true,
      status: 1,

      // Step 1 Additional Fields
      billing_name: formData.billingName || null,
      billing_address: formData.billingAddress || null,
      billing_postal_address: formData.billingPostalCode || null,
      cust_code: formData.customerCode || null,
      acc_code: formData.accCode || null,
      pic_contact_name: formData.picContactName || null,
      pic_email: formData.picEmail || null,
      pic_phone: formData.picPhone || null,
      billing_contact_name: formData.billingContactName || null,
      billing_email: formData.billingEmail || null,
      billing_phone: formData.billingPhone || null,

      floor_plan_file: formData.file ? await fileToBase64(formData.file) : null,

      pest_items: pestItems.map(i => ({
        customer_id: Number(formData.customerId),
        pest_id: Number(i.pestId),
        frequency_id: Number(i.frequencyId),
        chemical_id: i.chemicalId ? Number(i.chemicalId) : null,
        pest: i.pest,
        frequency: i.frequency,
        chemical_name: i.chemicals || i.chemical || null,
        no_location: Number(i.pestCount),
        pest_value: Number(i.pestValue),
        pest_service_count: Number(i.noOfItems),
        total_value: Number(i.totalValue),
        work_time: convertTimeToMinutes(i.workTime),
        remarks: '',
        is_active: 1,
        status: 1
      }))
    }

    console.log('🚀 SUBMITTING PROPOSAL (JSON):', JSON.stringify(payload, null, 2))

    try {
      let res
      if (id) {
        const decodedId = decodeId(id) || id
        res = await updateProposal(decodedId, payload)
      } else {
        res = await addProposal(payload)
      }

      console.log('✅ API RESPONSE:', res)

      const proposalId = res?.data?.id || res?.id
      if (res?.status === 'success' || res?.status === 200 || proposalId) {
        showToast('success', `Proposal ${id ? 'Updated' : 'Added'} Successfully!`)
        router.push('/admin/sales-quotation')
      } else {
        console.error('❌ API FAILURE (Logic):', res)
        showToast('error', res?.message || 'Operation failed')
      }
    } catch (e) {
      console.error('❌ API ERROR (Exception):', e)
      console.error('❌ RESPONSE DATA:', e.response?.data)
      showToast('error', e.response?.data?.message || e.message || 'API Request Failed')
    }
  }

  // ----------------------------------------------------------------------
  // RENDER STEP CONTENT
  // ----------------------------------------------------------------------
  const getStepContent = step => {
    switch (step) {
      case 0:
        return (
          <Step1DealType
            formData={formData}
            handleChange={handleChange}
            handleAutocompleteChange={handleAutocompleteChange}
            handleKeyDown={handleKeyDown}
            refs={refs}
            dropdowns={dropdowns}
          />
        )
      case 1:
        return (
          <Step2CustomerInfo
            formData={formData}
            handleChange={handleChange}
            handleAutocompleteChange={handleAutocompleteChange}
            handleDateChange={handleDateChange}
            dropdowns={dropdowns}
            copyFromCustomer={copyFromCustomer}
            copyCustomerAddress={formData.copyCustomerAddress}
            setCopyCustomerAddress={val => setFormData(p => ({ ...p, copyCustomerAddress: val }))}
            handleKeyDown={handleKeyDown}
            refs={refs}
          />
        )
      case 2:
        return (
          <Step3ServiceDetails
            formData={formData}
            handleChange={handleChange}
            handleAutocompleteChange={handleAutocompleteChange}
            handleNativeFileChange={handleNativeFileChange}
            handleViewFile={() => setOpenDialog(true)}
            dropdowns={dropdowns}
            handleKeyDown={handleKeyDown}
            refs={refs}
          />
        )
      case 3:
        return (
          <Step4PestItems
            id={id}
            currentPestItem={currentPestItem}
            handleCurrentPestItemChange={handleCurrentPestItemChange}
            handleCurrentPestItemAutocompleteChange={handleCurrentPestItemAutocompleteChange}
            dropdowns={dropdowns}
            handleSavePestItem={handleSavePestItem}
            pestItems={pestItems}
            handleEditPestItem={handleEditPestItem}
            handleDeletePestItem={handleDeletePestItem}
            editingItemId={editingItemId}
            handleKeyDown={handleKeyDown}
            refs={refs}
          />
        )
      case 4:
        return <Step5Review formData={formData} handleChange={handleChange} />
      default:
        return 'Unknown Step'
    }
  }

  if (loading) return <Box p={4}>Loading...</Box>

  return (
    <Box>
      <Card className='flex flex-col md:flex-row'>
        <CardContent className='max-md:border-be md:border-ie md:min-is-[300px]'>
          <Typography variant='h5' className='m-4 mb-6 font-bold'>
            {id ? 'Update Proposal' : 'Add Proposal'} <span style={{ fontSize: '12px', color: '#999' }}>`</span>
          </Typography>
          <StepperWrapper>
            <Stepper activeStep={activeStep} orientation='vertical' className='flex flex-col gap-4 min-is-[220px]'>
              {steps.map((label, index) => (
                <StyledStep
                  key={index}
                  onClick={() => {
                    // Prevent jumping ahead if current step isn't valid
                    if (index > activeStep) {
                      if (!validateStep(activeStep)) return
                      // If jumping multiple, we might want to check all in between,
                      // but for now, validate at least current.
                    }
                    setActiveStep(index)
                  }}
                >
                  <StepLabel icon={<></>} className='p-1 cursor-pointer'>
                    <div className='step-label'>
                      <CustomAvatar
                        variant='rounded'
                        skin={activeStep === index ? 'filled' : 'light'}
                        {...(activeStep >= index && { color: 'primary' })}
                        {...(activeStep === index && { className: 'shadow-primarySm' })}
                        size={38}
                      >
                        <i className={classnames(label.icon, '!text-[22px]')} />
                      </CustomAvatar>
                      <div className='flex flex-col'>
                        <Typography color='text.primary' className='step-title'>
                          {label.title}
                        </Typography>
                        <Typography className='step-subtitle'>{label.subtitle}</Typography>
                      </div>
                    </div>
                  </StepLabel>
                </StyledStep>
              ))}
            </Stepper>
          </StepperWrapper>
        </CardContent>

        <CardContent className='flex-1 pbs-6 flex flex-col'>
          <Box sx={{ flexGrow: 1, p: 2 }}>{getStepContent(activeStep)}</Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, p: 2 }}>
            <Button variant='outlined' color='secondary' disabled={activeStep === 0} onClick={handlePrev}>
              Previous
            </Button>
            <Button variant='contained' color='primary' onClick={handleNext}>
              {activeStep === steps.length - 1 ? (id ? 'Update Proposal' : 'Submit Proposal') : 'Next'}
            </Button>
          </Box>
        </CardContent>

        {/* File View Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth='md' fullWidth>
          <DialogTitle>View File</DialogTitle>
          <DialogContent>
            {formData.file?.type?.startsWith('image/') || formData.uploadedFileName?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
              <img src={formData.uploadedFileURL} alt='Preview' style={{ width: '100%' }} />
            ) : (
              <iframe src={formData.uploadedFileURL} style={{ width: '100%', height: '500px' }} title='File Preview' />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Card>

      {/* --- EXTRA CARDS BELOW WIZARD --- */}
      {id && (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {/* CALL LOG CARD */}
          <Grid item xs={12} md={6}>
            <TableSection
              title='CALL LOGS'
              addButton={
                <Button variant='contained' size='small' onClick={() => setCallLogDialogOpen(true)}>
                  Add Log
                </Button>
              }
              searchText={callLogSearch}
              setSearchText={setCallLogSearch}
              pagination={callLogPagination}
              setPagination={setCallLogPagination}
              filteredCount={filteredCallLogs.length}
            >
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Reminder</th>
                    <th>Entry Date</th>
                    <th>Reminder Date</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCallLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} align='center'>
                        No call logs found
                      </td>
                    </tr>
                  ) : (
                    paginatedCallLogs.map((log, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1 + callLogPagination.pageIndex * callLogPagination.pageSize}</td>
                        <td>
                          {log.reminder ? <Chip label='Active' color='error' size='small' variant='outlined' /> : 'No'}
                        </td>
                        <td>{log.entry_date || '-'}</td>
                        <td>{log.reminder_date || '-'}</td>
                        <td>{log.remarks || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </TableSection>
          </Grid>

          {/* PROPOSALS CARD */}
          <Grid item xs={12} md={6}>
            <TableSection
              title='SALES PROPOSAL'
              addButton={
                <Button
                  variant='contained'
                  size='small'
                  onClick={() => {
                    const realId = decodeId(id) || id
                    router.push(`/admin/proposal-editor?proposal_id=${realId}`)
                  }}
                >
                  Add Proposal
                </Button>
              }
              searchText={propSearch}
              setSearchText={setPropSearch}
              pagination={propPagination}
              setPagination={setPropPagination}
              filteredCount={filteredProposals.length}
            >
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Date</th>
                    <th>Title</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProposals.length === 0 ? (
                    <tr>
                      <td colSpan={4} align='center'>
                        No proposals found
                      </td>
                    </tr>
                  ) : (
                    paginatedProposals.map((prop, idx) => (
                      <tr
                        key={prop.id || idx}
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          const realId = decodeId(id) || id
                          router.push(`/admin/proposal-editor?proposal_id=${realId}`)
                        }}
                      >
                        <td>{prop.proposal_code || prop.id}</td>
                        <td>{prop.proposal_date || '-'}</td>
                        <td>{prop.title || '-'}</td>
                        <td>
                          <Chip
                            label={prop.status || 'Active'}
                            size='small'
                            sx={{ bgcolor: '#dff7e9', color: '#28c76f', fontWeight: 600 }}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </TableSection>
          </Grid>
        </Grid>
      )}

      {/* --- CALL LOG DIALOG --- */}
      <Dialog
        open={callLogDialogOpen}
        onClose={() => setCallLogDialogOpen(false)}
        maxWidth='sm'
        fullWidth
        PaperProps={{ sx: { overflow: 'visible' } }}
      >
        <DialogTitle>
          <Typography variant='h5' component='span'>
            Call Log
          </Typography>
          <DialogCloseButton onClick={() => setCallLogDialogOpen(false)} disableRipple>
            <i className='tabler-x' />
          </DialogCloseButton>
        </DialogTitle>
        <DialogContent sx={{ p: 6 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <AppReactDatepicker
                selected={currentCallLog.reminderDate}
                onChange={date => handleCurrentCallLogChange('reminderDate', date)}
                customInput={<CustomTextField fullWidth label='Reminder Date' placeholder='dd-mm-yyyy' />}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <AppReactDatepicker
                selected={currentCallLog.reminderTime}
                onChange={time => handleCurrentCallLogChange('reminderTime', time)}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                dateFormat='h:mm aa'
                customInput={<CustomTextField fullWidth label='Reminder Time' placeholder='--:--' />}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={currentCallLog.reminder}
                    onChange={e => handleCurrentCallLogChange('reminder', e.target.checked)}
                  />
                }
                label='[ Set reminder ]'
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <GlobalAutocomplete
                label='Assign To'
                options={dropdowns.supervisors || []}
                value={currentCallLog.assignTo}
                onChange={(e, v) => handleCurrentCallLogChange('assignTo', v)}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant='body2' sx={{ mb: 1 }}>
                Remarks [
              </Typography>
              <RadioGroup
                row
                value={currentCallLog.remarksType}
                onChange={e => handleCurrentCallLogChange('remarksType', e.target.value)}
              >
                <FormControlLabel value='All' control={<Radio size='small' />} label='All' />
                <FormControlLabel value='Own' control={<Radio size='small' />} label='Own' />
                <FormControlLabel value='Person' control={<Radio size='small' />} label='Person' />
                <FormControlLabel value='Dept' control={<Radio size='small' />} label='Dept' />
              </RadioGroup>
              <Typography variant='body2' sx={{ mt: -1 }}>
                ]
              </Typography>
              <CustomTextField
                fullWidth
                multiline
                rows={3}
                placeholder=''
                sx={{ mt: 1 }}
                value={currentCallLog.remarks}
                onChange={e => handleCurrentCallLogChange('remarks', e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 6, justifyContent: 'flex-end' }}>
          <Button
            onClick={() => setCallLogDialogOpen(false)}
            variant='tonal'
            sx={{ bgcolor: '#aaa', color: '#fff', '&:hover': { bgcolor: '#888' } }}
          >
            Close
          </Button>
          <Button
            onClick={handleSaveCallLog}
            variant='contained'
            sx={{ bgcolor: '#00adef', '&:hover': { bgcolor: '#008dc4' } }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
