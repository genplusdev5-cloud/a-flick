'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  Radio,
  CircularProgress
} from '@mui/material'
import { styled } from '@mui/material/styles'
import classnames from 'classnames'
import CustomAvatar from '@core/components/mui/Avatar'
import StepperWrapper from '@core/styles/stepper'
import { showToast } from '@/components/common/Toasts'

// Components
import CustomTextField from '@core/components/mui/TextField'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import GlobalButton from '@/components/common/GlobalButton'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

// Icons
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'

import styles from '@core/styles/table.module.css'

// API
import {
  addProposal,
  updateProposal,
  getProposalDetails,
  getProposalList,
  duplicateProposal
} from '@/api/sales/proposal'
import { listSalesAgreement, deleteSalesAgreement } from '@/api/sales/proposal/agreement'
import { getContractDates, getInvoiceCount, getPestCount, getInvoiceRemark } from '@/api/contract_group/contract'
import { getAllDropdowns } from '@/api/contract_group/contract/dropdowns'
import { getCustomerDetails } from '@/api/customer_group/customer'
import { listCallLogs, addCallLog, updateCallLog, deleteCallLog } from '@/api/contract_group/contract/details/call_log'
import { addProposalPest, updateProposalPest, deleteProposalPest } from '@/api/sales/proposal/pest'
import { decodeId, encodeId } from '@/utils/urlEncoder'
import addContractFile from '@/api/contract_group/contract/details/contract_file/add'
import callLogReminder from '@/api/contract_group/contract/details/call_log/reminder'

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

// 💡 NEW: Generate time options from 0:05 to 23:55 in 5-minute increments
const generateTimeOptions = () => {
  const options = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 5) {
      if (h === 0 && m === 0) continue // Start from 0:05
      const hh = String(h).padStart(1, '0')
      const mm = String(m).padStart(2, '0')
      options.push(`${hh}:${mm}`)
    }
  }
  return options
}

const timeOptions = generateTimeOptions()

export default function ProposalWizard({ id }) {
  const router = useRouter()
  const { lang = 'en' } = useParams()
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(!!id)
  const [isSubmitting, setIsSubmitting] = useState(false)
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
  const [pestSearch, setPestSearch] = useState('')

  const [callLogPagination, setCallLogPagination] = useState({ pageIndex: 0, pageSize: 5 })
  const [propPagination, setPropPagination] = useState({ pageIndex: 0, pageSize: 5 })
  const [pestPagination, setPestPagination] = useState({ pageIndex: 0, pageSize: 5 })

  const [callLogDialogOpen, setCallLogDialogOpen] = useState(false)
  const [pestDialogOpen, setPestDialogOpen] = useState(false)
  const [isEditCallLog, setIsEditCallLog] = useState(false)
  const [deleteProposalDialog, setDeleteProposalDialog] = useState({ open: false, row: null })
  const [deleteCallLogDialog, setDeleteCallLogDialog] = useState({ open: false, row: null })
  const [deletePestDialog, setDeletePestDialog] = useState({ open: false, id: null, row: null })

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
    noOfItems: '',
    startDate: null,
    endDate: null,
    reminderDate: null
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

  // Load Call Logs when proposal ID is available
  useEffect(() => {
    if (id) {
      fetchCallLogs()
    } else {
      if (callLogs.length > 0) setCallLogs([])
    }
  }, [id])

  // --- Filtering Logic (Pests) ---
  const filteredPests = useMemo(() => {
    if (!Array.isArray(pestItems)) return []
    if (!pestSearch) return pestItems
    const lower = pestSearch.toLowerCase()
    return pestItems.filter(i => Object.values(i).some(v => String(v).toLowerCase().includes(lower)))
  }, [pestItems, pestSearch])

  const paginatedPests = useMemo(() => {
    const start = pestPagination.pageIndex * pestPagination.pageSize
    return filteredPests.slice(start, start + pestPagination.pageSize)
  }, [filteredPests, pestPagination])

  const fetchCallLogs = async () => {
    try {
      const decodedProposalId = decodeId(id) || id
      console.log('🔄 FETCHING CALL LOGS FOR:', decodedProposalId)
      const res = await listCallLogs({ contract_id: String(decodedProposalId) })

      const apiResponse = res?.data || res
      const apiData =
        apiResponse?.data?.results ||
        apiResponse?.results ||
        (Array.isArray(apiResponse?.data) ? apiResponse.data : Array.isArray(apiResponse) ? apiResponse : [])

      if (Array.isArray(apiData)) {
        setCallLogs(apiData)
      }
    } catch (err) {
      console.error('Fetch Logs Error:', err)
      // No notification for error here to avoid annoying popups if it's just an empty results case
    }
  }

  // ✅ Fetch Sales Agreements (Generated Proposals) for the CURRENT proposal independently
  useEffect(() => {
    if (id) {
      const decodedProposalId = decodeId(id) || id
      console.log('🔍 FETCHING PROPOSALS FOR:', decodedProposalId)
      listSalesAgreement({ proposal_id: Number(decodedProposalId) })
        .then(res => {
          // ✅ Highly robust mapping to handle multiple API response formats
          const apiResponse = res?.data || res
          const apiData =
            apiResponse?.data?.results ||
            apiResponse?.results ||
            (Array.isArray(apiResponse?.data) ? apiResponse.data : Array.isArray(apiResponse) ? apiResponse : [])

          if (Array.isArray(apiData)) {
            setProposals(apiData)
          }
        })
        .catch(err => console.error('Fetch Agreements Error:', err))
    } else {
      if (proposals.length > 0) setProposals([])
    }
  }, [id])

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

  const handleDeleteProposalClick = row => {
    setDeleteProposalDialog({ open: true, row })
  }

  const confirmDeleteSalesProposal = async () => {
    const propId = deleteProposalDialog.row?.id
    if (!propId) return

    try {
      await deleteSalesAgreement({ id: propId })
      showToast('delete', 'Proposal agreement deleted successfully')

      // Refresh list
      const decodedProposalId = decodeId(id) || id
      console.log('🔄 REFRESHING PROPOSALS FOR:', decodedProposalId)
      const res = await listSalesAgreement({ proposal_id: Number(decodedProposalId) })
      const apiResponse = res?.data || res
      const apiData =
        apiResponse?.data?.results ||
        apiResponse?.results ||
        (Array.isArray(apiResponse?.data) ? apiResponse.data : Array.isArray(apiResponse) ? apiResponse : [])

      if (Array.isArray(apiData)) setProposals(apiData)
    } catch (err) {
      console.error('Delete error:', err)
      showToast('error', 'Failed to delete proposal agreement')
    } finally {
      setDeleteProposalDialog({ open: false, row: null })
    }
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
            data.pest_items.map(item => {
              const pCount = Number(item.no_location || 0)
              const pValue = Number(item.pest_value || 0)
              const pTotal = Number(item.total_value || 0)
              const pItemsCount = Number(item.pest_service_count || 0)

              return {
                id: Date.now().toString(36) + Math.random().toString(36).substring(2),
                item_id: item.id,
                pest: item.pest,
                pestId: item.pest_id,
                frequency: item.frequency,
                frequencyId: item.frequency_id,
                pestCount: isNaN(pCount) ? '0' : String(pCount),
                pestValue: isNaN(pValue) ? '0' : String(pValue),
                totalValue: isNaN(pTotal) ? '0' : String(pTotal),
                workTime: convertMinutesToTime(item.work_time),
                chemical: item.chemical_name || item.chemical || '',
                chemicals: item.chemical_name || item.chemical || '',
                chemicalId: item.chemical_id,
                noOfItems: isNaN(pItemsCount) ? '0' : String(pItemsCount),
                startDate: parseSafeDate(item.start_date),
                endDate: parseSafeDate(item.end_date),
                reminderDate: parseSafeDate(item.reminder_date)
              }
            })
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
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${day}/${month}/${year}`
  }

  // 💡 NEW: Helper to parse DD/MM/YYYY to Date object
  const parseDateString = dateStr => {
    if (!dateStr) return null
    if (dateStr instanceof Date) return dateStr
    // Try IS0 (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
    const isoDate = new Date(dateStr)
    if (!isNaN(isoDate.getTime()) && dateStr.includes('-')) return isoDate

    // Parse DD/MM/YYYY
    const [day, month, year] = dateStr.split('/').map(Number)
    if (!day || !month || !year) return null
    return new Date(year, month - 1, day)
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
        const d = new Date(date)
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        const payload = {
          start_date: `${year}-${month}-${day}`,
          contract_type: formData.contractType || '',
          frequency: formData.billingFrequency || ''
        }
        const res = await getContractDates(payload)
        if (res?.data?.status === 'success') {
          const apiData = res.data.data
          setFormData(prev => ({
            ...prev,
            endDate: parseDateString(apiData.end_date),
            reminderDate: parseDateString(apiData.reminder_date)
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

  const handleCurrentPestItemDateChange = async (name, date) => {
    setCurrentPestItem(prev => ({ ...prev, [name]: date }))

    // Auto-calculate End Date / Reminder Date for Pest Item
    if (name === 'startDate' && date) {
      try {
        const d = new Date(date)
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        const payload = {
          start_date: `${year}-${month}-${day}`, // API expects YYYY-MM-DD
          contract_type: formData.contractType || '',
          frequency: currentPestItem.frequency || ''
        }
        const res = await getContractDates(payload)
        if (res?.data?.status === 'success') {
          const apiData = res.data.data
          setCurrentPestItem(prev => ({
            ...prev,
            endDate: parseDateString(apiData.end_date),
            reminderDate: parseDateString(apiData.reminder_date)
          }))
        }
      } catch (e) {
        console.error('Pest Date Calc Error:', e)
      }
    }
  }

  // --- Auto-calculate Pest Count ---

  const handleCurrentPestItemAutocompleteChange = (name, newValue, ref) => {
    const isObject = typeof newValue === 'object' && newValue !== null
    const newLabel = isObject ? newValue.label || newValue.name || '' : newValue
    const newId = isObject ? newValue.value || newValue.id || '' : ''

    setCurrentPestItem(prev => {
      const next = {
        ...prev,
        [name]: newLabel,
        [`${name}Id`]: newId
      }
      return next
    })

    // Determine the *effective* pestId and frequencyId for the API call
    let pestId = currentPestItem.pestId
    let frequencyId = currentPestItem.frequencyId

    if (name === 'pest') pestId = newId
    if (name === 'frequency') frequencyId = newId

    const startDate = currentPestItem.startDate || formData.startDate
    const endDate = currentPestItem.endDate || formData.endDate

    // Explicit debug message
    console.log('🐞 Attempting to fetch pest count with:', { pestId, frequencyId, startDate, endDate })

    if (!pestId) {
      // showToast('info', 'Select a pest to fetch count')
      return // Wait for pest
    }
    if (!frequencyId) {
      // showToast('info', 'Select a frequency to fetch count')
      return // Wait for frequency
    }
    if (!startDate) {
      showToast('warning', 'Start Date is missing. Please set contract dates first.')
      return
    }
    if (!endDate) {
      showToast('warning', 'End Date is missing. Please set contract dates first.')
      return
    }

    // Check for ID (contract_id/proposal_id) - user requested contract_id
    const contractId = id ? decodeId(id) || id : null

    // Updated Condition: We need pestId, frequencyId. Dates are good, but contractId might be key.
    // User says: "frequency id and contract id send panni pest count fetch pannnanum"
    // So if we have contractId, we might not need dates? But usually we do.
    // Let's send EVERYTHING available to be safe.

    if (pestId && frequencyId && (contractId || (startDate && endDate))) {
      console.log('✅ Fetching Pest Count with:', {
        pest_id: pestId,
        service_frequency_id: frequencyId,
        contract_id: contractId,
        start_date: startDate ? formatDateToLocal(startDate) : null,
        end_date: endDate ? formatDateToLocal(endDate) : null
      })

      showToast('info', 'Fetching pest count...')

      getPestCount({
        pest_id: Number(pestId),
        service_frequency_id: Number(frequencyId),
        billing_frequency_id: Number(frequencyId),
        contract_id: contractId, // Added as requested
        start_date: startDate ? formatDateToLocal(startDate) : null,
        end_date: endDate ? formatDateToLocal(endDate) : null
      })
        .then(res => {
          console.log('✅ Pest Count API Response:', res)
          if (res?.status === 'success' || (res && res.pest_count !== undefined)) {
            // Handle different responses
            const count = (res.data?.pest_count ?? res.pest_count ?? '0').toString()
            console.log('✅ Pest Count Found:', count)

            // Check if 0 came back but expected non-zero?
            if (count === '0') showToast('info', 'Pest count returned 0')

            setCurrentPestItem(prev => {
              const totalNum = Number(count) * Number(prev.pestValue || 0)
              return {
                ...prev,
                pestCount: count,
                total: isNaN(totalNum) ? '0' : totalNum.toString()
              }
            })
          } else {
            console.error('❌ Pest Count API Response unsuccessful:', res)
            showToast('error', 'Failed to fetch pest count')
          }
        })
        .catch(err => {
          console.error('❌ Pest Count Error:', err)
          showToast('error', 'Error fetching pest count')
        })
    }

    if (ref) focusNextElement(ref)
  }

  const handleSavePestItem = async () => {
    const startDate = currentPestItem.startDate || formData.startDate
    const endDate = currentPestItem.endDate || formData.endDate

    if (!startDate || !endDate || !currentPestItem.pest || !currentPestItem.frequency) {
      showToast('warning', 'Dates, Pest, and Frequency are required.')
      return
    }

    const totalValueSum = (Number(currentPestItem.total) || 0).toString()

    const itemPayload = {
      proposal_id: id ? decodeId(id) || id : null,
      contract_id: id ? decodeId(id) || id : null, // Added as requested by API error
      pest_id: Number(currentPestItem.pestId),
      frequency_id: Number(currentPestItem.frequencyId),
      chemical_id: currentPestItem.chemicalId ? Number(currentPestItem.chemicalId) : null,
      pest: currentPestItem.pest,
      frequency: currentPestItem.frequency,
      chemical_name: currentPestItem.chemicals || currentPestItem.chemical || '',
      no_location: String(currentPestItem.pestCount || '0'),
      pest_value: String(currentPestItem.pestValue || '0'),
      pest_service_count: String(currentPestItem.noOfItems || '0'),
      total_value: totalValueSum,
      work_time: convertTimeToMinutes(currentPestItem.time || '0:00'),
      remarks: '',
      is_active: 1,
      status: 1,
      start_date: formatDate(startDate) || null,
      end_date: formatDate(endDate) || null,
      reminder_date: formatDate(currentPestItem.reminderDate || startDate) || null
    }

    try {
      if (id) {
        let res
        if (editingItemId && currentPestItem.item_id) {
          // Update existing item
          res = await updateProposalPest(currentPestItem.item_id, itemPayload)
        } else {
          // Add new item to existing proposal
          res = await addProposalPest(itemPayload)
        }

        if (res?.status === 'success' || res) {
          showToast('success', `Pest item ${editingItemId ? 'updated' : 'added'} successfully`)
          await loadDetails(id) // Refresh all details to get the new list
        }
      } else {
        // Local mode for new proposal
        if (editingItemId) {
          setPestItems(prev =>
            prev.map(item =>
              item.id === editingItemId
                ? {
                    ...item,
                    ...currentPestItem,
                    id: editingItemId,
                    totalValue: totalValueSum,
                    workTime: currentPestItem.time || '0:00'
                  }
                : item
            )
          )
          setEditingItemId(null)
        } else {
          setPestItems(prev => [
            ...prev,
            {
              ...currentPestItem,
              id: Date.now().toString(36),
              totalValue: totalValueSum,
              workTime: currentPestItem.time || '0:00'
            }
          ])
        }
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
        noOfItems: '',
        startDate: null,
        endDate: null,
        reminderDate: null
      }))
      setEditingItemId(null)
      setPestDialogOpen(false)

      // Focus back to pest field
      setTimeout(() => refs.pestInputRef.current?.focus(), 100)
    } catch (err) {
      console.error('Save Pest Error:', err)
      showToast('error', 'Failed to save pest item')
    }
  }

  const handleEditPestItem = item => {
    setCurrentPestItem({
      item_id: item.item_id,
      pest: item.pest,
      pestId: item.pestId,
      frequency: item.frequency,
      frequencyId: item.frequencyId,
      pestCount: item.pestCount || '',
      pestValue: item.pestValue || '',
      total: item.totalValue || '',
      time: item.workTime || '0:00',
      chemical: item.chemical || item.chemicals || '',
      chemicals: item.chemicals || '',
      chemicalId: item.chemicalId || '',
      noOfItems: item.noOfItems || '',
      startDate: parseDateString(item.start_date || item.startDate),
      endDate: parseDateString(item.end_date || item.endDate),
      reminderDate: parseDateString(item.reminder_date || item.reminderDate)
    })
    setEditingItemId(item.id)
  }

  const handleDeletePestItem = itemId => {
    const itemToDelete = pestItems.find(i => i.id === itemId)
    setDeletePestDialog({ open: true, id: itemId, row: itemToDelete })
  }

  const confirmDeletePestItem = async () => {
    const { id: itemId, row: itemToDelete } = deletePestDialog
    if (!itemId) return

    if (id) {
      // Find the item to get its server-side ID if available
      if (itemToDelete?.item_id) {
        try {
          await deleteProposalPest({ id: itemToDelete.item_id })
          showToast('delete', 'Pest item deleted successfully')
          await loadDetails(id)
        } catch (err) {
          console.error('Delete Pest Error:', err)
          showToast('error', 'Failed to delete pest item')
        }
      }
    } else {
      // Local delete
      if (editingItemId === itemId) setEditingItemId(null)
      setPestItems(prev => prev.filter(i => i.id !== itemId))
      showToast('delete', 'Pest item removed')
    }

    setDeletePestDialog({ open: false, id: null, row: null })
  }

  const handleCurrentCallLogChange = (field, value) => {
    setCurrentCallLog(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveCallLog = async () => {
    const decodedProposalId = decodeId(id) || id
    if (!decodedProposalId) {
      showToast('error', 'Proposal ID missing')
      return
    }

    const payload = {
      contract_id: String(decodedProposalId),
      // reminder: currentCallLog.reminder ? 1 : 0, // Potentially wrong based on other views
      reminder: 'Call Log', // Standardized to what CallLogListPage uses
      entry_date: formatDateToLocal(new Date()),
      reminder_date:
        currentCallLog.reminder && currentCallLog.reminderDate ? formatDateToLocal(currentCallLog.reminderDate) : null,
      reminder_time:
        currentCallLog.reminder && currentCallLog.reminderTime
          ? currentCallLog.reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
          : null,
      remarks: currentCallLog.remarks || '',
      // Ensure IDs are sent as strings if they exist to avoid 'int' object has no attribute 'strip' error
      assign_to: currentCallLog.assignTo?.id
        ? String(currentCallLog.assignTo.id)
        : currentCallLog.assignTo
          ? String(currentCallLog.assignTo)
          : '',
      remarks_type: currentCallLog.remarksType || 'All'
    }

    console.log('🚀 SAVING CALL LOG PAYLOAD:', payload)

    try {
      let res
      if (isEditCallLog && currentCallLog.id) {
        res = await updateCallLog(currentCallLog.id, payload)
      } else {
        res = await addCallLog(payload)
      }

      console.log('✅ CALL LOG API RESPONSE:', res)

      if (res?.status === 'success' || res) {
        showToast('success', `Call log ${isEditCallLog ? 'updated' : 'added'} successfully`)
        fetchCallLogs()
        setCallLogDialogOpen(false)
        setIsEditCallLog(false)
        setCurrentCallLog({
          reminder: true,
          reminderDate: null,
          reminderTime: null,
          assignTo: '',
          remarks: '',
          remarksType: 'All'
        })
      }
    } catch (err) {
      console.error('❌ SAVE CALL LOG ERROR:', err)
      console.error('❌ ERROR RESPONSE DATA:', err.response?.data)
      showToast('error', err.response?.data?.message || 'Failed to save call log')
    }
  }

  const handleEditCallLog = log => {
    setIsEditCallLog(true)
    setCurrentCallLog({
      id: log.id,
      reminder: !!log.reminder,
      reminderDate: parseSafeDate(log.reminder_date),
      reminderTime: parseSafeTime(log.reminder_time),
      assignTo: log.assign_to_name || log.assign_to,
      remarks: log.remarks || '',
      remarksType: log.remarks_type || 'All'
    })
    setCallLogDialogOpen(true)
  }

  const handleDeleteCallLogClick = log => {
    setDeleteCallLogDialog({ open: true, row: log })
  }

  const confirmDeleteCallLog = async () => {
    const logId = deleteCallLogDialog.row?.id
    if (!logId) return

    try {
      await deleteCallLog(logId)
      showToast('delete', 'Call log deleted successfully')
      fetchCallLogs()
    } catch (err) {
      console.error('Delete Log Error:', err)
      showToast('error', 'Failed to delete call log')
    } finally {
      setDeleteCallLogDialog({ open: false, row: null })
    }
  }

  const handleToggleReminder = async log => {
    try {
      const id = log.id
      if (!id) return

      const res = await callLogReminder({ id: String(id) })

      if (res?.status === 'success' || res) {
        const message =
          log.is_reminder === 1 ? 'Reminder dismissed successfully' : res.message || 'Reminder updated successfully'
        showToast('success', message)
        fetchCallLogs()
      }
    } catch (err) {
      console.error('Toggle Reminder Error:', err)
      showToast('error', 'Failed to update reminder')
    }
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
        router.push(`/${lang}/admin/sales-quotation`)
      } else {
        console.error('❌ API FAILURE (Logic):', res)
        showToast('error', res?.message || 'Operation failed')
      }
    } catch (e) {
      console.error('❌ API ERROR (Exception):', e)
      console.error('❌ RESPONSE DATA:', e.response?.data)
      showToast('error', e.response?.data?.message || e.message || 'API Request Failed')
    } finally {
      setIsSubmitting(false)
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
            pestItems={pestItems}
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
            // Props for shared state
            pestSearch={pestSearch}
            setPestSearch={setPestSearch}
            pestPagination={pestPagination}
            setPestPagination={setPestPagination}
            pestDialogOpen={pestDialogOpen}
            setPestDialogOpen={setPestDialogOpen}
            handleCurrentPestItemDateChange={handleCurrentPestItemDateChange}
            timeOptions={timeOptions}
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
            <Button
              variant='outlined'
              color='secondary'
              disabled={activeStep === 0 || isSubmitting}
              onClick={handlePrev}
            >
              Previous
            </Button>
            <Button
              variant='contained'
              color='primary'
              onClick={handleNext}
              disabled={isSubmitting}
              startIcon={
                isSubmitting && activeStep === steps.length - 1 ? <CircularProgress size={20} color='inherit' /> : null
              }
            >
              {activeStep === steps.length - 1
                ? isSubmitting
                  ? 'Submitting...'
                  : id
                    ? 'Update Proposal'
                    : 'Submit Proposal'
                : 'Next'}
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
                <Button
                  variant='contained'
                  size='small'
                  onClick={() => {
                    setIsEditCallLog(false)
                    setCurrentCallLog({
                      reminder: true,
                      reminderDate: null,
                      reminderTime: null,
                      assignTo: '',
                      remarks: '',
                      remarksType: 'All'
                    })
                    setCallLogDialogOpen(true)
                  }}
                >
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
                    <th>S.No</th>
                    <th>Action</th>
                    <th>Reminder</th>
                    <th>Entry Date</th>
                    <th>Reminder Date</th>
                    <th>Reminder Time</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCallLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} align='center'>
                        No logs found
                      </td>
                    </tr>
                  ) : (
                    paginatedCallLogs.map((log, idx) => (
                      <tr key={log.id || idx}>
                        <td>{idx + 1 + callLogPagination.pageIndex * callLogPagination.pageSize}</td>
                        <td>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton size='small' color='primary' onClick={() => handleEditCallLog(log)}>
                              <i className='tabler-edit' />
                            </IconButton>
                            <IconButton size='small' color='error' onClick={() => handleDeleteCallLogClick(log)}>
                              <i className='tabler-trash' />
                            </IconButton>
                          </Box>
                        </td>
                        <td>
                          {log.is_reminder === 1 ? (
                            <Chip
                              label='Dismiss'
                              variant='outlined'
                              color='error'
                              size='small'
                              clickable
                              onClick={() => handleToggleReminder(log)}
                              icon={<i className='tabler-x' style={{ fontSize: '14px' }} />}
                              sx={{
                                borderRadius: '4px',
                                height: '24px',
                                borderColor: '#ea5455',
                                color: '#ea5455',
                                '& .MuiChip-label': { px: 1 },
                                '&:hover': { bgcolor: 'rgba(234, 84, 85, 0.08)' }
                              }}
                            />
                          ) : (
                            <Chip
                              label='Remind'
                              variant='outlined'
                              color='success'
                              size='small'
                              clickable
                              onClick={() => handleToggleReminder(log)}
                              icon={<i className='tabler-check' style={{ fontSize: '14px' }} />}
                              sx={{
                                borderRadius: '4px',
                                height: '24px',
                                borderColor: '#28c76f',
                                color: '#28c76f',
                                '& .MuiChip-label': { px: 1 },
                                '&:hover': { bgcolor: 'rgba(40, 199, 111, 0.08)' }
                              }}
                            />
                          )}
                        </td>

                        <td>
                          {log.entry_date
                            ? log.entry_date.includes('-')
                              ? formatDate(new Date(log.entry_date))
                              : log.entry_date
                            : log.created_on
                              ? log.created_on.split(' ')[0]
                              : '-'}
                        </td>
                        <td>
                          {log.reminder_date
                            ? log.reminder_date.includes('-')
                              ? formatDate(new Date(log.reminder_date))
                              : log.reminder_date
                            : '-'}
                        </td>
                        <td>{log.reminder_time || '-'}</td>
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
                    const encodedId = encodeId(realId)
                    router.push(`/${lang}/admin/proposal-editor?proposal_id=${encodedId}`)
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
                    <th>S.No</th>
                    <th>Action</th>
                    <th>Proposal Date</th>
                    <th>Title</th>
                    <th>Document</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProposals.length === 0 ? (
                    <tr>
                      <td colSpan={6} align='center'>
                        No proposals found
                      </td>
                    </tr>
                  ) : (
                    paginatedProposals.map((prop, idx) => (
                      <tr key={prop.id || idx}>
                        <td>{idx + 1 + propPagination.pageIndex * propPagination.pageSize}</td>
                        <td>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size='small'
                              color='primary'
                              onClick={() => {
                                const encodedId = encodeId(prop.id)
                                router.push(`/${lang}/admin/proposal-editor?proposal_id=${encodedId}`)
                              }}
                            >
                              <i className='tabler-edit' />
                            </IconButton>
                            <IconButton size='small' color='error' onClick={() => handleDeleteProposalClick(prop)}>
                              <i className='tabler-trash' />
                            </IconButton>
                            <IconButton
                              size='small'
                              color='info'
                              onClick={() => {
                                if (prop.file_name) {
                                  let finalUrl = prop.file_name
                                  if (!finalUrl.startsWith('http')) {
                                    const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api/', '') || ''
                                    finalUrl = `${apiBase}${finalUrl.startsWith('/') ? '' : '/'}${finalUrl}`
                                  }
                                  if (
                                    finalUrl.includes('/media/') &&
                                    !finalUrl.includes('/agreements/') &&
                                    !finalUrl.includes('/agreement/') &&
                                    finalUrl.toLowerCase().includes('proposal')
                                  ) {
                                    finalUrl = finalUrl.replace('/media/', '/media/agreements/')
                                  }
                                  window.open(finalUrl, '_blank')
                                } else {
                                  showToast('error', 'File not available on server')
                                }
                              }}
                            >
                              <i className='tabler-download' />
                            </IconButton>
                          </Box>
                        </td>
                        <td>{prop.proposal_date || prop.created_on?.split(' ')[0] || '-'}</td>
                        <td>{prop.name || prop.title || '-'}</td>
                        <td>{prop.file_name_display || (prop.file_name ? prop.file_name.split('/').pop() : '-')}</td>
                        <td>
                          <Chip
                            label={prop.status === 1 ? 'Approved' : 'Pending'}
                            size='small'
                            sx={{
                              bgcolor: prop.status === 1 ? '#dff7e9' : '#fff2e2',
                              color: prop.status === 1 ? '#28c76f' : '#ff9f43',
                              fontWeight: 600
                            }}
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
            {isEditCallLog ? 'Edit Call Log' : 'Add Call Log'}
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
            {isEditCallLog ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Proposal Confirmation Dialog */}
      <Dialog
        onClose={() => setDeleteProposalDialog({ open: false, row: null })}
        open={deleteProposalDialog.open}
        PaperProps={{
          sx: {
            overflow: 'visible',
            width: 420,
            borderRadius: 1,
            textAlign: 'center'
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            color: 'error.main',
            fontWeight: 700,
            pb: 1,
            position: 'relative'
          }}
        >
          <WarningAmberIcon color='error' sx={{ fontSize: 26 }} />
          Confirm Delete
          <DialogCloseButton
            onClick={() => setDeleteProposalDialog({ open: false, row: null })}
            disableRipple
            sx={{ position: 'absolute', right: 3, top: 2 }}
          >
            <i className='tabler-x' />
          </DialogCloseButton>
        </DialogTitle>

        <DialogContent sx={{ px: 5, pt: 1 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: 14, lineHeight: 1.6 }}>
            Are you sure you want to delete proposal{' '}
            <strong style={{ color: '#d32f2f' }}>
              {deleteProposalDialog.row?.name || deleteProposalDialog.row?.title}
            </strong>
            ?
            <br />
            This action cannot be undone.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3, pt: 2 }}>
          <GlobalButton
            onClick={() => setDeleteProposalDialog({ open: false, row: null })}
            color='secondary'
            sx={{ minWidth: 100, textTransform: 'none', fontWeight: 500 }}
          >
            Cancel
          </GlobalButton>

          <GlobalButton
            onClick={confirmDeleteSalesProposal}
            variant='contained'
            color='error'
            sx={{ minWidth: 100, textTransform: 'none', fontWeight: 600 }}
          >
            Delete
          </GlobalButton>
        </DialogActions>
      </Dialog>

      {/* Delete Call Log Confirmation Dialog */}
      <Dialog
        onClose={() => setDeleteCallLogDialog({ open: false, row: null })}
        open={deleteCallLogDialog.open}
        PaperProps={{
          sx: {
            overflow: 'visible',
            width: 420,
            borderRadius: 1,
            textAlign: 'center'
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            color: 'error.main',
            fontWeight: 700,
            pb: 1,
            position: 'relative'
          }}
        >
          <WarningAmberIcon color='error' sx={{ fontSize: 26 }} />
          Confirm Delete
          <DialogCloseButton
            onClick={() => setDeleteCallLogDialog({ open: false, row: null })}
            disableRipple
            sx={{ position: 'absolute', right: 3, top: 2 }}
          >
            <i className='tabler-x' />
          </DialogCloseButton>
        </DialogTitle>

        <DialogContent sx={{ px: 5, pt: 1 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: 14, lineHeight: 1.6 }}>
            Are you sure you want to delete this call log?
            <br />
            This action cannot be undone.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3, pt: 2 }}>
          <GlobalButton
            onClick={() => setDeleteCallLogDialog({ open: false, row: null })}
            color='secondary'
            sx={{ minWidth: 100, textTransform: 'none', fontWeight: 500 }}
          >
            Cancel
          </GlobalButton>

          <GlobalButton
            onClick={confirmDeleteCallLog}
            variant='contained'
            color='error'
            sx={{ minWidth: 100, textTransform: 'none', fontWeight: 600 }}
          >
            Delete
          </GlobalButton>
        </DialogActions>
      </Dialog>

      {/* Delete Pest Confirmation Dialog */}
      <Dialog
        onClose={() => setDeletePestDialog({ open: false, id: null, row: null })}
        open={deletePestDialog.open}
        PaperProps={{
          sx: {
            overflow: 'visible',
            width: 420,
            borderRadius: 1,
            textAlign: 'center'
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            color: 'error.main',
            fontWeight: 700,
            pb: 1,
            position: 'relative'
          }}
        >
          <WarningAmberIcon color='error' sx={{ fontSize: 26 }} />
          Confirm Delete
          <DialogCloseButton
            onClick={() => setDeletePestDialog({ open: false, id: null, row: null })}
            disableRipple
            sx={{ position: 'absolute', right: 3, top: 2 }}
          >
            <i className='tabler-x' />
          </DialogCloseButton>
        </DialogTitle>

        <DialogContent sx={{ px: 5, pt: 1 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: 14, lineHeight: 1.6 }}>
            Are you sure you want to delete pest{' '}
            <strong style={{ color: '#d32f2f' }}>{deletePestDialog.row?.pest}</strong>?
            <br />
            This action cannot be undone.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3, pt: 2 }}>
          <GlobalButton
            onClick={() => setDeletePestDialog({ open: false, id: null, row: null })}
            color='secondary'
            sx={{ minWidth: 100, textTransform: 'none', fontWeight: 500 }}
          >
            Cancel
          </GlobalButton>

          <GlobalButton
            onClick={confirmDeletePestItem}
            variant='contained'
            color='error'
            sx={{ minWidth: 100, textTransform: 'none', fontWeight: 600 }}
          >
            Delete
          </GlobalButton>
        </DialogActions>
      </Dialog>

      {/* --- ADD/EDIT PEST DIALOG (GLOBAL) --- */}
      <Dialog
        open={pestDialogOpen}
        onClose={() => setPestDialogOpen(false)}
        maxWidth='md'
        fullWidth
        PaperProps={{ sx: { overflow: 'visible' } }}
      >
        <DialogTitle>
          <Typography variant='h5' component='span'>
            {editingItemId ? 'Edit Pest' : 'Add Pest'}
          </Typography>
          <DialogCloseButton onClick={() => setPestDialogOpen(false)} disableRipple>
            <i className='tabler-x' />
          </DialogCloseButton>
        </DialogTitle>
        <DialogContent sx={{ p: 6 }}>
          <Grid container spacing={5}>
            {/* Row 1: Dates */}
            <Grid item xs={12} md={4}>
              <AppReactDatepicker
                selected={currentPestItem.startDate}
                onChange={date => handleCurrentPestItemDateChange('startDate', date)}
                dateFormat='dd/MM/yyyy'
                customInput={<CustomTextField fullWidth label='Start Date' placeholder='dd/mm/yyyy' />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <AppReactDatepicker
                selected={currentPestItem.endDate}
                onChange={date => handleCurrentPestItemDateChange('endDate', date)}
                dateFormat='dd/MM/yyyy'
                customInput={<CustomTextField fullWidth label='End Date' placeholder='dd/mm/yyyy' />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <AppReactDatepicker
                selected={currentPestItem.reminderDate}
                onChange={date => handleCurrentPestItemDateChange('reminderDate', date)}
                dateFormat='dd/MM/yyyy'
                customInput={<CustomTextField fullWidth label='Reminder Date' placeholder='dd/mm/yyyy' />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='Pest'
                options={dropdowns.pests || []}
                value={currentPestItem.pestId}
                onChange={v => handleCurrentPestItemAutocompleteChange('pest', v)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='Billing Frequency'
                options={dropdowns.frequencies || []}
                value={currentPestItem.frequencyId}
                onChange={v => handleCurrentPestItemAutocompleteChange('frequency', v)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <CustomTextField
                fullWidth
                label='No of Units'
                name='noOfItems'
                type='number'
                value={currentPestItem.noOfItems}
                onChange={handleCurrentPestItemChange}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <CustomTextField
                fullWidth
                label='Pest Count'
                name='pestCount'
                type='number'
                value={currentPestItem.pestCount || ''}
                onChange={handleCurrentPestItemChange}
                InputProps={{ readOnly: true }}
                sx={{ '& .MuiInputBase-root': { bgcolor: '#f0f0f0' } }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <CustomTextField
                fullWidth
                label='Pest Value'
                name='pestValue'
                type='number'
                value={currentPestItem.pestValue}
                onChange={handleCurrentPestItemChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <CustomTextField
                fullWidth
                label='Total'
                name='total'
                value={currentPestItem.total || ''}
                InputProps={{ readOnly: true }}
                sx={{ '& .MuiInputBase-root': { bgcolor: '#f0f0f0' } }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='Time'
                options={timeOptions}
                value={currentPestItem.time}
                onChange={v => handleCurrentPestItemAutocompleteChange('time', v)}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <GlobalAutocomplete
                label='Chemicals'
                options={dropdowns.chemicals || []}
                value={currentPestItem.chemicalId}
                onChange={v => handleCurrentPestItemAutocompleteChange('chemical', v)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 6, justifyContent: 'flex-end' }}>
          <Button
            onClick={() => setPestDialogOpen(false)}
            variant='tonal'
            color='secondary'
            sx={{ bgcolor: '#aaa', color: '#fff', '&:hover': { bgcolor: '#888' } }}
          >
            Close
          </Button>
          <Button
            onClick={() => {
              handleSavePestItem()
              setPestDialogOpen(false)
            }}
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
