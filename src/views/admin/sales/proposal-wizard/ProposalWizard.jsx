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
import { addProposal, updateProposal, getProposalDetails, getProposalList } from '@/api/sales/proposal' // Added getProposalList
import {
  getContractDropdowns,
  getContractDates,
  getInvoiceCount,
  getPestCount,
  getInvoiceRemark
} from '@/api/contract_group/contract'
import { getCustomerDetails } from '@/api/customer_group/customer'
import { listCallLogs } from '@/api/contract_group/contract/details/call_log' // Added listCallLogs
import { decodeId } from '@/utils/urlEncoder'

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
    origin: '',
    salesMode: '', // Keeping for safe removal or backward compat if needed
    contractType: '',
    proposalStatus: 'Draft',
    contractName: '',
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
    category: '', // New
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
    billingFrequency: '',
    invoiceCount: '',
    invoiceRemarks: [],
    uploadedFile: null,
    uploadedFileName: '',
    copyCustomerAddress: false,
    reportBlock: '', // New
    contractValue: '',
    technician: '',
    technicianId: '',
    paymentTerm: '',
    salesPerson: '',
    salesPersonId: '',
    supervisor: '',
    supervisorId: '',
    billingFrequency: '',
    billingFrequencyId: '',
    invoiceCount: '',
    poNumber: '',
    poExpiry: null,
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

  // Refs for focusing (simplified for Wizard, can expand if needed)
  const refs = {
    salesModeInputRef: useRef(null),
    contractTypeInputRef: useRef(null),
    contractNameRef: useRef(null),
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
    fileUploadButtonRef: useRef(null)
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
      const res = await getContractDropdowns()
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
          salesMode: data.sales_mode?.replace(/_/g, ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || '',
          customerId: data.customer_id,
          customer: data.customer,
          contractName: data.name || '',
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
  const formatDate = date => (date ? date.toLocaleDateString('en-CA') : '')

  // ----------------------------------------------------------------------
  // ACTION HANDLERS
  // ----------------------------------------------------------------------

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrev = () => {
    if (activeStep > 0) setActiveStep(prev => prev - 1)
  }

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleAutocompleteChange = (name, newValue, inputRef) => {
    const isObj = typeof newValue === 'object' && newValue !== null
    setFormData(prev => ({
      ...prev,
      [name]: isObj ? newValue.name || '' : newValue,
      [`${name}Id`]: isObj ? newValue.id || '' : ''
    }))
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

  const handleCurrentPestItemAutocompleteChange = (name, newValue) => {
    const isObject = typeof newValue === 'object' && newValue !== null
    setCurrentPestItem(prev => ({
      ...prev,
      [name]: isObject ? newValue.name || '' : newValue,
      [`${name}Id`]: isObject ? newValue.id || '' : ''
    }))
  }

  // --- Auto-calculate Pest Count ---
  useEffect(() => {
    if (currentPestItem.noOfItems && currentPestItem.frequencyId) {
      getPestCount({
        no_of_units: currentPestItem.noOfItems,
        frequency: currentPestItem.frequencyId
      })
        .then(res => {
          if (res?.status === 'success') {
            const count = res.data || '0'
            setCurrentPestItem(prev => {
              const totalNum = Number(count) * Number(prev.pestValue || 0)
              return {
                ...prev,
                pestCount: count,
                total: isNaN(totalNum) ? '0' : totalNum.toString()
              }
            })
          }
        })
        .catch(err => console.error('Pest Count Error:', err))
    }
  }, [currentPestItem.noOfItems, currentPestItem.frequencyId])

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

    // Reset
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
          invoiceRemarks: res.data
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
    if (!formData.contractName || !formData.customerId) {
      showToast('error', 'Contract Name and Customer are required!')
      return
    }

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
      po_expiry_date: formatDate(formData.poExpiry),
      preferred_time: formData.preferredTime?.toTimeString().slice(0, 8),
      report_email: formData.reportEmail,
      contact_person_name: formData.contactPerson,
      phone: formData.sitePhone,
      mobile: formData.mobile,
      call_type_id: Number(formData.callTypeId),
      grouping_code: formData.groupCode,
      start_date: formatDate(formData.startDate),
      end_date: formatDate(formData.endDate),
      reminder_date: formatDate(formData.reminderDate),
      industry_id: Number(formData.industryId),
      contract_value: Number(formData.contractValue),
      technician_id: Number(formData.technicianId),
      billing_term: Number(formData.paymentTerm?.replace(/\D/g, '')),
      sales_person_id: Number(formData.salesPersonId),
      supervisor_id: Number(formData.supervisorId),
      billing_frequency_id: Number(formData.billingFrequencyId),
      invoice_count: Number(formData.invoiceCount),
      invoice_remarks: formData.invoiceRemarks?.join?.(', ') || '',
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
      billing_remarks: formData.billingRemarks,
      agreement_add_1: formData.agreement1,
      agreement_add_2: formData.agreement2,
      technician_remarks: formData.technicianRemarks,
      appointment_remarks: formData.appointmentRemarks,
      pest_items: pestItems.map(i => ({
        id: i.item_id ? Number(i.item_id) : null,
        pest_id: Number(i.pestId),
        frequency_id: Number(i.frequencyId),
        chemical_id: Number(i.chemicalId),
        no_location: Number(i.pestCount),
        pest_value: Number(i.pestValue),
        pest_service_count: Number(i.noOfItems),
        total_value: Number(i.totalValue),
        work_time: convertTimeToMinutes(i.workTime)
      }))
    }

    try {
      let res
      if (id) {
        res = await updateProposal(id, payload)
      } else {
        res = await addProposal(payload)
      }

      if (res?.status === 'success') {
        showToast('success', `Proposal ${id ? 'Updated' : 'Added'} Successfully!`)
        router.push('/admin/sales-quotation')
      } else {
        showToast('error', res?.message || 'Operation failed')
      }
    } catch (e) {
      console.error(e)
      showToast('error', 'API Request Failed')
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
            handleKeyDown={() => {}} // simplified
            refs={refs}
          />
        )
      case 1:
        return (
          <Step2CustomerInfo
            formData={formData}
            handleChange={handleChange}
            handleAutocompleteChange={handleAutocompleteChange}
            dropdowns={dropdowns}
            copyFromCustomer={copyFromCustomer}
            copyCustomerAddress={formData.copyCustomerAddress} // Using formData to track this is better if you want persistence, or local state in step
            setCopyCustomerAddress={val => setFormData(p => ({ ...p, copyCustomerAddress: val }))}
          />
        )
      case 2:
        return (
          <Step3ServiceDetails
            formData={formData}
            setFormData={setFormData} // ✅ Pass setFormData
            handleChange={handleChange}
            handleDateChange={handleDateChange}
            handleAutocompleteChange={handleAutocompleteChange}
            handleNativeFileChange={handleNativeFileChange}
            handleViewFile={() => setOpenDialog(true)}
            dropdowns={dropdowns}
            refs={refs}
          />
        )

      case 3:
        return (
          <Step4PestItems
            currentPestItem={currentPestItem}
            handleCurrentPestItemChange={handleCurrentPestItemChange}
            handleCurrentPestItemAutocompleteChange={handleCurrentPestItemAutocompleteChange}
            dropdowns={dropdowns}
            handleSavePestItem={handleSavePestItem}
            pestItems={pestItems}
            handleEditPestItem={handleEditPestItem}
            handleDeletePestItem={handleDeletePestItem}
            editingItemId={editingItemId}
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
            {id ? 'Update Proposal' : 'Add Proposal'}
          </Typography>
          <StepperWrapper>
            <Stepper activeStep={activeStep} orientation='vertical' className='flex flex-col gap-4 min-is-[220px]'>
              {steps.map((label, index) => (
                <StyledStep key={index} onClick={() => setActiveStep(index)}>
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
              <Button variant='contained' size='small' onClick={() => router.push('/admin/proposal-editor')}>
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
                    <tr key={prop.id || idx}>
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
            onClick={onSaveCallLog}
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
