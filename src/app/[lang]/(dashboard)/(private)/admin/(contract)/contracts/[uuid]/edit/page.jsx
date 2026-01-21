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
  DialogContent,
  Stepper,
  StepLabel,
  Step as MuiStep,
  CardContent
} from '@mui/material'

import { styled } from '@mui/material/styles'
import classnames from 'classnames'

import { useRouter, useParams } from 'next/navigation'

import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import VisibilityIcon from '@mui/icons-material/Visibility'

// 🔥 Global UI Components
import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import GlobalTextarea from '@/components/common/GlobalTextarea'
import GlobalSelect from '@/components/common/GlobalSelect'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import { showToast } from '@/components/common/Toasts'

// Layout + Inputs
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
  getContractDetails,
  updateContract
} from '@/api/contract_group/contract'
import { getCustomerList, getCustomerDetails } from '@/api/customer_group/customer'

const autocompleteFields = [
  { name: 'salesMode', options: ['Confirmed Sales', 'Quotation'] },
  { name: 'contractType', options: ['Continuous Contract', 'Limited Contract', 'Continuous Job', 'Job', 'Warranty'] },
  { name: 'paymentTerm', options: ['0 days', '30 days'] },
  { name: 'salesPerson', options: [] },
  { name: 'time', options: ['0:05', '0:10', '0:15'] },
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

export default function EditContractPage() {
  const router = useRouter()
  const { uuid } = useParams()

  const generateUniqueId = () => Date.now().toString(36) + Math.random().toString(36).substring(2)

  const [dynamicAutocompleteFields, setDynamicAutocompleteFields] = useState(autocompleteFields)
  const [loading, setLoading] = useState(true)
  const [activeStep, setActiveStep] = useState(0)

  const [formData, setFormData] = useState({
    id: '',
    salesMode: '',
    salesModeId: '',
    contractType: '',
    contractTypeId: '',
    coveredLocation: '',
    contractCode: '',
    serviceAddress: '',
    postalCode: '',
    poNumber: '',
    poExpiry: null,
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
    file: null,
    uploadedFileName: '',
    uploadedFileURL: '',
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

  const [pestItems, setPestItems] = useState([])
  const [editingItemId, setEditingItemId] = useState(null)
  const [reportEmailError, setReportEmailError] = useState(false)
  const [selectedFile, setSelectedFile] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [copyCustomerAddress, setCopyCustomerAddress] = useState(false)

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

  // Refs
  const refs = autocompleteFields.reduce((acc, f) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    acc[f.name + 'Ref'] = useRef(null)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    acc[f.name + 'InputRef'] = useRef(null)
    return acc
  }, {})

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

  // Explicit Refs
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

  const focusableElementRefs = [
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
    refs.pestInputRef,
    refs.frequencyInputRef,
    currentPestCountRef,
    currentPestValueRef,
    currentTotalRef,
    refs.timeInputRef,
    currentChemicalsRef,
    currentNoOfItemsRef,
    addPestButtonRef,
    billingRemarksRef,
    agreement1Ref,
    agreement2Ref,
    technicianRemarksRef,
    appointmentRemarksRef,
    closeButtonRef,
    saveButtonRef
  ].filter(ref => ref)

  useEffect(() => {
    const init = async () => {
      await loadDropdowns()
      if (uuid) {
        await loadDetails()
      }
      setLoading(false)
    }
    init()
  }, [uuid])

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
  }, [dropdowns.callTypes, formData.callTypeId])

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

  // Helper to deduplicate arrays
  const cleanOptions = arr => [...new Set(arr.filter(v => v !== null && v !== undefined && v !== ''))]

  const loadDropdowns = async () => {
    try {
      const res = await getContractDropdowns()
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
    } catch (err) {
      console.error('❌ Dropdown fetch error:', err)
      showToast('error', 'Failed to load dropdowns')
    }
  }

  const convertTimeToMinutes = str => {
    if (!str) return 0
    const [h, m] = str.split(':').map(Number)
    return h * 60 + m
  }

  const convertMinutesToTime = mins => {
    if (!mins) return '0:00'
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `${h}:${m < 10 ? '0' : ''}${m}`
  }

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

  const loadDetails = async () => {
    try {
      const data = await getContractDetails(uuid)
      if (data) {
        setFormData(prev => ({
          ...prev,
          id: data.id,
          salesMode: data.sales_mode?.replace(/_/g, ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || '',
          customerId: data.customer_id,
          customer: data.customer,
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
      }
    } catch (err) {
      console.error('❌ Load details error:', err)
      showToast('error', 'Failed to load contract details')
    }
  }

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleCurrentPestItemChange = e => {
    const { name, value } = e.target
    if (name === 'pestCount' || name === 'pestValue') {
      const count = name === 'pestCount' ? Number(value || 0) : Number(currentPestItem.pestCount || 0)
      const val = name === 'pestValue' ? Number(value || 0) : Number(currentPestItem.pestValue || 0)
      setCurrentPestItem(prev => ({ ...prev, [name]: value, total: (count * val).toString() }))
      return
    }
    setCurrentPestItem(prev => ({ ...prev, [name]: value }))
  }

  const focusNextElement = useCallback(
    currentRef => {
      const currentIndex = focusableElementRefs.findIndex(ref => ref === currentRef)
      if (currentIndex !== -1) {
        for (let i = currentIndex + 1; i < focusableElementRefs.length; i++) {
          const nextRef = focusableElementRefs[i]
          const nextElement = nextRef.current
          if (nextElement) {
            const nextAuto = autocompleteFields.find(field => refs[field.name + 'InputRef'] === nextRef)
            if (nextAuto) {
              nextElement.focus()
              const setStateFunc = setOpenStates[nextAuto.name + 'SetOpen']
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
    [focusableElementRefs, setOpenStates, refs]
  )

  const handleKeyDown = (e, currentRef, isMultiline = false) => {
    if (e.key === 'Enter') {
      if (isMultiline && e.shiftKey) return
      e.preventDefault()
      focusNextElement(currentRef)
    }
  }

  const handleAutocompleteChange = (name, newValue, currentInputRef) => {
    const isObj = typeof newValue === 'object' && newValue !== null
    setFormData(prev => ({
      ...prev,
      [name]: isObj ? newValue.name || '' : newValue,
      [`${name}Id`]: isObj ? newValue.id || '' : ''
    }))
    const setStateFunc = setOpenStates[name + 'SetOpen']
    if (setStateFunc) setStateFunc(false)
    focusNextElement(currentInputRef)
  }

  const handleCurrentPestItemAutocompleteChange = (name, newValue, currentInputRef) => {
    const isObject = typeof newValue === 'object' && newValue !== null
    setCurrentPestItem(prev => ({
      ...prev,
      [name]: isObject ? newValue.name || '' : newValue,
      [`${name}Id`]: isObject ? newValue.id || '' : ''
    }))
    const setStateFunc = setOpenStates[name + 'SetOpen']
    if (setStateFunc) setStateFunc(false)
    focusNextElement(currentInputRef)
  }

  const fileToBase64 = file => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = error => reject(error)
    })
  }

  const handleNativeFileChange = e => {
    const file = e.target.files?.[0] || null
    if (file) {
      setSelectedFile(file.name)
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

  const handleViewFile = () => {
    if (formData.uploadedFileURL) setOpenDialog(true)
    else showToast('info', 'No new file uploaded to view.')
  }
  const handleCloseDialog = () => setOpenDialog(false)
  
  const handleDateChange = async (name, date, currentInputRef) => {
    setFormData(prev => ({ ...prev, [name]: date }))
    if (name === 'startDate' || name === 'endDate') setTimeout(updateInvoiceCount, 0)
    if (name === 'startDate' && date) {
      try {
        const res = await getContractDates({
          start_date: date.toISOString().split('T')[0],
          contract_type: formData.contractType || '',
          frequency: formData.billingFrequency || ''
        })
        if (res?.data?.status === 'success') {
          setFormData(prev => ({
            ...prev,
            endDate: new Date(res.data.data.end_date),
            reminderDate: new Date(res.data.data.reminder_date)
          }))
        }
      } catch (e) {
        console.error(e)
      }
    }
    focusNextElement(currentInputRef)
  }

  const updateInvoiceCount = async () => {
    if (!formData.startDate || !formData.endDate || !formData.billingFrequencyId) return
    try {
      const res = await getInvoiceCount({
        start_date: formData.startDate.toISOString().split('T')[0],
        end_date: formData.endDate.toISOString().split('T')[0],
        billing_frequency_id: Number(formData.billingFrequencyId)
      })
      if (res?.status === 'success') setFormData(prev => ({ ...prev, invoiceCount: res.data?.invoice_count || 0 }))
    } catch (e) {
      console.error(e)
    }
  }

  const fetchPestCount = async (pestId, frequencyId) => {
    if (!formData.startDate || !formData.endDate || !pestId || !frequencyId) return
    try {
      const res = await getPestCount({
        pest_id: Number(pestId),
        service_frequency_id: Number(frequencyId),
        start_date: formData.startDate.toISOString().split('T')[0],
        end_date: formData.endDate.toISOString().split('T')[0]
      })
      if (res?.status === 'success')
        setCurrentPestItem(prev => ({ ...prev, pestCount: String(res.data?.pest_count || '') }))
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (formData.billingFrequencyId) {
      updateInvoiceCount()
    }
  }, [formData.billingFrequencyId])

  useEffect(() => {
    if (currentPestItem.pestId && currentPestItem.frequencyId) {
      fetchPestCount(currentPestItem.pestId, currentPestItem.frequencyId)
    }
  }, [currentPestItem.pestId, currentPestItem.frequencyId])

  const handleEditPestItem = item => {
    setCurrentPestItem({
      pest: item.pest,
      pestId: item.pestId,
      frequency: item.frequency,
      frequencyId: item.frequencyId,
      pestCount: item.pestCount,
      pestValue: item.pestValue,
      total: item.totalValue,
      time: item.workTime,
      chemicals: item.chemicals,
      chemicalId: item.chemicalId,
      noOfItems: item.noOfItems
    })
    setEditingItemId(item.id)
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
        time: '',
        chemicals: '',
        chemicalId: '',
        noOfItems: ''
      })
    }
    setPestItems(prev => prev.filter(item => item.id !== id))
  }

  const handleSavePestItem = () => {
    if (!formData.startDate || !formData.endDate || !currentPestItem.pest || !currentPestItem.frequency) {
      showToast('warning', 'Valid dates, Pest and Frequency are required!')
      return
    }
    const item = {
      ...currentPestItem,
      totalValue: currentPestItem.total || '0',
      workTime: currentPestItem.time || '0:00'
    }
    if (editingItemId) {
      setPestItems(prev => prev.map(i => (i.id === editingItemId ? { ...i, ...item, id: editingItemId } : i)))
      setEditingItemId(null)
    } else {
      setPestItems(prev => [...prev, { ...item, id: generateUniqueId() }])
    }
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
      console.error('❌ Customer copy failed', err)
      showToast('error', 'Failed to copy customer details')
    }
  }

  const handleSubmit = async () => {
    if (!formData.customerId || !formData.startDate || !formData.endDate) {
      showToast('error', 'Required fields are missing!')
      return
    }
    try {
      const payload = {
        id: formData.id,
        name: '',
        customer_id: Number(formData.customerId),
        sales_mode: formData.salesMode?.toLowerCase().replace(/\s+/g, '_'),
        contract_code: formData.contractCode,
        contract_type: formData.contractType?.toLowerCase().replace(/\s+/g, '_'),
        service_address: formData.serviceAddress,
        postal_code: formData.postalCode,
        covered_location: formData.coveredLocation,
        po_number: formData.poNumber,
        po_expiry_date: formData.poExpiry?.toISOString().split('T')[0],
        preferred_time: formData.preferredTime?.toTimeString().slice(0, 8),
        report_email: formData.reportEmail,
        contact_person_name: formData.contactPerson,
        phone: formData.sitePhone,
        mobile: formData.mobile,
        call_type_id: Number(formData.callTypeId),
        grouping_code: formData.groupCode,
        start_date: formData.startDate?.toISOString().split('T')[0],
        end_date: formData.endDate?.toISOString().split('T')[0],
        reminder_date: formData.reminderDate?.toISOString().split('T')[0],
        industry_id: Number(formData.industryId),
        contract_value: Number(formData.contractValue),
        technician_id: Number(formData.technicianId),
        billing_term: Number(formData.paymentTerm?.replace(/\D/g, '')),
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
          work_time: convertTimeToMinutes(i.workTime)
        }))
      }
      const res = await updateContract(formData.id, payload)
      if (res?.status === 'success') {
        showToast('success', 'Contract Updated Successfully!')
        router.back()
      } else {
        showToast('error', res?.message || 'Update failed')
      }
    } catch (e) {
      showToast('error', 'Error while saving')
    }
  }

  const renderAuto = ({ name, label, options, md = 3 }) => {
    const isObj = options.length > 0 && typeof options[0] === 'object'
    const val = isObj ? options.find(o => o.id === formData[`${name}Id`]) || null : formData[name] || null
    return (
      <Grid item xs={12} md={md} key={name}>
        <Autocomplete
          options={options}
          value={val}
          getOptionLabel={o => (typeof o === 'string' ? o : o?.name || '')}
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
      case 0:
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
            {renderAuto({ name: 'paymentTerm', label: 'Payment Term', options: ['0 days', '30 days'] })}
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
            {renderAuto({
              name: 'billingFrequency',
              label: 'Billing Frequency',
              options: dropdowns.billingFrequencies
            })}

            <Grid item xs={12} md={3}>
              <CustomTextField
                fullWidth
                label='Invoice Count'
                name='invoiceCount'
                value={formData.invoiceCount}
                onChange={handleChange}
                inputRef={invoiceCountRef}
                onKeyDown={e => handleKeyDown(e, invoiceCountRef)}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <Autocomplete
                multiple
                freeSolo
                options={['Monthly Service', 'Quarterly Service']}
                value={formData.invoiceRemarks}
                onChange={(e, v) => setFormData(prev => ({ ...prev, invoiceRemarks: v }))}
                renderInput={p => (
                  <CustomTextField {...p} label='Invoice Remarks' inputRef={invoiceRemarksRef} />
                )}
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

            <Grid item xs={12} md={6}>
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
                />
                <label htmlFor='file-upload'>
                  <Typography variant='body1'>Drag & Drop Floor Plan or Click to Upload</Typography>
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
                      options={dropdowns.pests || []}
                      getOptionLabel={o => (typeof o === 'string' ? o : o.name || '')}
                      value={currentPestItem.pest}
                      onChange={(e, v) => handleCurrentPestItemAutocompleteChange('pest', v, refs.pestInputRef)}
                      renderInput={params => <CustomTextField {...params} label='Pest' inputRef={refs.pestInputRef} />}
                      onKeyDown={e => handleKeyDown(e, refs.pestInputRef)}
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <Autocomplete
                      options={dropdowns.serviceFrequencies || []}
                      getOptionLabel={o => (typeof o === 'string' ? o : o.name || '')}
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
                    <Autocomplete
                      options={['0:05', '0:10', '0:15', '0:20', '0:30', '1:00']}
                      freeSolo
                      value={currentPestItem.time}
                      onChange={(e, v) => handleCurrentPestItemAutocompleteChange('time', v, refs.timeInputRef)}
                      renderInput={params => (
                        <CustomTextField {...params} label='Time (hh:mm)' inputRef={refs.timeInputRef} />
                      )}
                      onKeyDown={e => handleKeyDown(e, refs.timeInputRef)}
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <Autocomplete
                      options={dropdowns.chemicals || []}
                      value={currentPestItem.chemicals}
                      getOptionLabel={o => (typeof o === 'string' ? o : o.name || '')}
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
                        <TableCell>{item.workTime}</TableCell>
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
          {activeStep === steps.length - 1 ? 'Save Changes' : 'Next'}
        </Button>
      </Grid>
    )
  }

  if (loading) return <Box p={4}>Loading...</Box>

  return (
    <ContentLayout
      title='Edit Contract'
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Contracts', href: '/admin/contracts' },
        { label: 'Edit' }
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
          {formData.file?.type?.startsWith('image/') || (formData.uploadedFileURL && formData.uploadedFileURL.match(/\.(jpeg|jpg|gif|png)$/i)) ? (
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
