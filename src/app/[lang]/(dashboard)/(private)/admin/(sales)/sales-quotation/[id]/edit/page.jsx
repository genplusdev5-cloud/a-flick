'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  MenuItem // ✅ ADD THIS
} from '@mui/material'

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

import { getCustomerList } from '@/api/customer_group/customer'
import { getContractDropdowns, getContractDates, getInvoiceCount, getPestCount, getInvoiceRemark } from '@/api/contract_group/contract'
import { updateProposal, getProposalDetails } from '@/api/sales/proposal'
import { decodeId } from '@/utils/urlEncoder'

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

const sectionOptions = ['Pests', 'Call Log', 'Proposals']

export default function EditProposalPage() {
  const router = useRouter()
  const { lang, id } = useParams()

  const generateUniqueId = () => Date.now().toString(36) + Math.random().toString(36).substring(2)

  const [dynamicAutocompleteFields, setDynamicAutocompleteFields] = useState(autocompleteFields)
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    id: '',
    salesMode: '',
    salesModeId: '',
    contractName: '',
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

  const refs = autocompleteFields.reduce((acc, f) => {
    acc[f.name + 'Ref'] = useRef(null)
    acc[f.name + 'InputRef'] = useRef(null)
    return acc
  }, {})

  const [autoOpen, setAutoOpen] = useState(() => Object.fromEntries(autocompleteFields.map(f => [f.name, false])))
  const openStates = useMemo(
    () => Object.fromEntries(autocompleteFields.map(f => [f.name + 'Open', autoOpen[f.name]])),
    [autoOpen]
  )

  const setOpenStates = useMemo(() => {
    return Object.fromEntries(
      autocompleteFields.map(f => [f.name + 'SetOpen', value => setAutoOpen(prev => ({ ...prev, [f.name]: value }))])
    )
  }, [])

  const contractNameRef = useRef(null),
    coveredLocationRef = useRef(null),
    contractCodeRef = useRef(null),
    serviceAddressRef = useRef(null)
  const postalCodeRef = useRef(null),
    poNumberRef = useRef(null),
    poExpiryRef = useRef(null),
    preferredTimeRef = useRef(null)
  const reportEmailRef = useRef(null),
    contactPersonRef = useRef(null),
    sitePhoneRef = useRef(null),
    mobileRef = useRef(null)
  const groupCodeRef = useRef(null),
    startDateRef = useRef(null),
    endDateRef = useRef(null),
    reminderDateRef = useRef(null)
  const contractValueRef = useRef(null),
    invoiceCountRef = useRef(null),
    invoiceRemarksRef = useRef(null),
    latitudeRef = useRef(null)
  const longitudeRef = useRef(null),
    fileInputRef = useRef(null),
    fileUploadButtonRef = useRef(null)
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
    closeButtonRef = useRef(null),
    saveButtonRef = useRef(null)

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
      await loadDetails()
      setLoading(false)
    }
    init()
  }, [id])

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
    return `${h}:${m.toString().padStart(2, '0')}`
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
      const decodedId = decodeId(id) || id
      console.log('🔍 Load Details - ID:', id, 'Decoded:', decodedId)
      const res = await getProposalDetails(decodedId)
      console.log('🔍 Load Details - Response:', res)
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
          console.log('🦗 Loaded Pest Items:', data.pest_items)
          setPestItems(
            data.pest_items.map(item => ({
              id: generateUniqueId(),
              item_id: item.id, // 🔥 Preserve DB ID
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
              setOpenStates[nextAuto.name + 'SetOpen']?.(true)
            } else {
              nextElement.focus()
            }
            return
          }
        }
        saveButtonRef.current?.focus()
      }
    },
    [focusableElementRefs, setOpenStates]
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
    setOpenStates[name + 'SetOpen']?.(false)
    focusNextElement(currentInputRef)
  }

  const handleDateChange = async (name, date, currentInputRef) => {
    setFormData(prev => ({ ...prev, [name]: date }))
    if (name === 'startDate' || name === 'endDate') setTimeout(updateInvoiceCount, 0)
    if (name === 'startDate' && date) {
      try {
        const res = await getContractDates({
          start_date: formatDate(date),
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
        start_date: formatDate(formData.startDate),
        end_date: formatDate(formData.endDate),
        billing_frequency_id: Number(formData.billingFrequencyId)
      })
      if (res?.status === 'success') setFormData(prev => ({ ...prev, invoiceCount: res.data?.invoice_count || 0 }))
    } catch (e) {
      console.error(e)
    }
  }

  const formatDate = date => (date ? date.toLocaleDateString('en-CA') : '')

  const fetchPestCount = async (pestId, frequencyId) => {
    if (!formData.startDate || !formData.endDate || !pestId || !frequencyId) return
    try {
      const res = await getPestCount({
        pest_id: Number(pestId),
        service_frequency_id: Number(frequencyId),
        start_date: formatDate(formData.startDate),
        end_date: formatDate(formData.endDate)
      })
      if (res?.status === 'success')
        setCurrentPestItem(prev => ({ ...prev, pestCount: String(res.data?.pest_count || '') }))
    } catch (e) {
      console.error(e)
    }
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

  const handleDeletePestItem = id => {
    if (editingItemId === id) setEditingItemId(null)
    setPestItems(prev => prev.filter(i => i.id !== id))
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
    if (!formData.contractName || !formData.customerId) {
      showToast('error', 'Required fields are missing!')
      return
    }

    try {
      // 🔥 SAME PAYLOAD – UI & autocomplete untouched
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
        invoice_remarks: formData.invoiceRemarks.join(', '),
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        billing_remarks: formData.billingRemarks,
        agreement_add_1: formData.agreement1,
        agreement_add_2: formData.agreement2,
        technician_remarks: formData.technicianRemarks,
        appointment_remarks: formData.appointmentRemarks,

        // 🔥 pest items SAME – backend will map for proposal
        pest_items: pestItems.map(i => ({
          id: i.item_id ? Number(i.item_id) : null, // 🔥 Send DB ID if exists
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

      // ✅ ONLY CHANGE IS HERE
      const res = await updateProposal(formData.id, payload)

      if (res?.status === 'success') {
        showToast('success', 'Sales Quotation Updated Successfully!')
        router.back()
      } else {
        showToast('error', res?.message || 'Update failed')
      }
    } catch (err) {
      console.error(err)
      showToast('error', 'Error while saving Sales Quotation')
    }
  }

  const renderAuto = ({ name, label, options, md = 3 }) => {
    // 💡 Fix: Deduplicate options if they are strings to avoid key collisions
    const uniqueOptions = Array.from(new Set(options.map(o => JSON.stringify(o)))).map(o => JSON.parse(o))
    const isObj = uniqueOptions.length > 0 && typeof uniqueOptions[0] === 'object'
    const val = isObj ? uniqueOptions.find(o => o.id === formData[`${name}Id`]) || null : formData[name] || null
    return (
      <Grid item xs={12} md={md} key={name}>
        <Autocomplete
          options={uniqueOptions}
          value={val}
          getOptionLabel={o => (typeof o === 'string' ? o : o?.name || '')}
          renderOption={(props, option) => (
            <li {...props} key={typeof option === 'string' ? option : option.id || option.name}>
              {typeof option === 'string' ? option : option.name}
            </li>
          )}
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

  if (loading) return <Box p={4}>Loading...</Box>

  return (
    <ContentLayout
      title=''
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Sales Quotation', href: '/admin/sales-quotation' },
        { label: 'Edit' }
      ]}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography variant='h5' fontWeight={600}>
          Edit Sales Quotation
        </Typography>

        <GlobalButton
          variant='contained'
          color='primary'
          onClick={() => {
            // Always pass the encoded ID 'id' from useParams to avoid ambiguity
            router.push(`/${lang}/admin/contracts/add?from_proposal=${id}`)
          }}
        >
          Convert to Contract
        </GlobalButton>
      </Box>

      <Grid container spacing={4} sx={{ px: 3, py: 3 }}>
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

        <Grid item xs={12}>
          <Typography variant='h6' mt={2}>
            Service
          </Typography>
          <Divider />
        </Grid>
        <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', mb: -1 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={copyCustomerAddress}
                onChange={async e => {
                  const checked = e.target.checked
                  setCopyCustomerAddress(checked)
                  if (checked && formData.customerId) await copyFromCustomer(formData.customerId)
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

        <Grid item xs={12}>
          <Typography variant='h6' mt={2}>
            Group & Dates
          </Typography>
          <Divider />
        </Grid>
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
            minDate={formData.startDate}
            customInput={<CustomTextField label='End Date' fullWidth inputRef={endDateRef} />}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <AppReactDatepicker
            selected={formData.reminderDate}
            onChange={d => handleDateChange('reminderDate', d, reminderDateRef)}
            minDate={formData.startDate}
            maxDate={formData.endDate}
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

        <Grid item xs={12}>
          <Typography variant='h6' mt={2}>
            Billing
          </Typography>
          <Divider />
        </Grid>
        <Grid item xs={12} md={3}>
          <Autocomplete
            options={dropdowns.billingFrequencies}
            getOptionLabel={o => o?.name || ''}
            value={dropdowns.billingFrequencies.find(o => o.id === formData.billingFrequencyId) || null}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.name}
              </li>
            )}
            onChange={async (e, v) => {
              setFormData(p => ({ ...p, billingFrequency: v?.name || '', billingFrequencyId: v?.id || '' }))
              if (v?.id && formData.startDate && formData.endDate) {
                const res = await getInvoiceCount({
                  start_date: formatDate(formData.startDate),
                  end_date: formatDate(formData.endDate),
                  billing_frequency_id: Number(v.id)
                })
                if (res?.status === 'success') setFormData(p => ({ ...p, invoiceCount: res.data?.invoice_count || 0 }))
              }
            }}
            renderInput={p => (
              <CustomTextField {...p} label='Billing Frequency' inputRef={refs.billingFrequencyInputRef} />
            )}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <CustomTextField fullWidth label='No. of Invoice' value={String(formData.invoiceCount)} readOnly />
        </Grid>
        <Grid item xs={12} md={6}>
          <Autocomplete
            multiple
            freeSolo
            options={[]}
            value={formData.invoiceRemarks}
            onChange={(e, v) => setFormData(p => ({ ...p, invoiceRemarks: v }))}
            renderInput={p => <CustomTextField {...p} label='Invoice Remarks' />}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <CustomTextField
            fullWidth
            label='Latitude'
            name='latitude'
            value={formData.latitude}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <CustomTextField
            fullWidth
            label='Longitude'
            name='longitude'
            value={formData.longitude}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant='h6' mt={2}>
            Remarks
          </Typography>
          <Divider />
        </Grid>
        <Grid item xs={12} md={4}>
          <CustomTextField
            multiline
            rows={2}
            fullWidth
            label='Billing Remarks'
            name='billingRemarks'
            value={formData.billingRemarks}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <CustomTextField
            multiline
            rows={2}
            fullWidth
            label='Agreement 1'
            name='agreement1'
            value={formData.agreement1}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <CustomTextField
            multiline
            rows={2}
            fullWidth
            label='Agreement 2'
            name='agreement2'
            value={formData.agreement2}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <CustomTextField
            multiline
            rows={2}
            fullWidth
            label='Technician Remarks'
            name='technicianRemarks'
            value={formData.technicianRemarks}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <CustomTextField
            multiline
            rows={2}
            fullWidth
            label='Appointment Remarks'
            name='appointmentRemarks'
            value={formData.appointmentRemarks}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
          <GlobalButton color='secondary' onClick={() => router.back()}>
            Close
          </GlobalButton>
          <GlobalButton variant='contained' onClick={handleSubmit}>
            Save Changes
          </GlobalButton>
        </Grid>

        <Grid item xs={12} sx={{ mt: 6, mb: 18 }}>
          <Typography variant='h6'>Contract Value ($)</Typography>

          {/* Edit icon BELOW title */}
          <IconButton
            size='small'
            sx={{ mt: 0.5 }}
            onClick={() => {
              // optional: add edit logic later
              console.log('Edit Contract Value')
            }}
          >
            <EditIcon fontSize='small' />
          </IconButton>

          <Divider sx={{ mt: 1.5 }} />
        </Grid>

        {/* ================= PEST DETAILS ================= */}
        {/* ================= PEST ITEM INPUTS ================= */}
        <Grid item xs={12} key='pest-section-header'>
          <Typography variant='h6' sx={{ mb: 2, mt: 2 }}>
            Pest Details
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

        {/* SINGLE DIVIDER (only here) */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
        </Grid>

        {/* Page entries + Search */}
        <Grid item xs={12}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2
            }}
          >
            {/* LEFT: Page entries */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant='body2'>Show</Typography>
              <CustomTextField select size='small' value={10} sx={{ width: 80 }}>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </CustomTextField>
              <Typography variant='body2'>entries</Typography>
            </Box>

            {/* RIGHT: Search */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant='body2'>Search:</Typography>
              <CustomTextField size='small' />
            </Box>
          </Box>
        </Grid>

        {/* Table */}
        <Grid item xs={12}>
          <Box sx={{ overflowX: 'auto', border: '1px solid #ddd', borderRadius: 1 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Pest</TableCell>
                  <TableCell>Frequency</TableCell>
                  <TableCell>Count</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Chemicals</TableCell>
                  <TableCell>Items</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {pestItems.map((item, idx) => (
                  <TableRow key={item.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>
                      <IconButton size='small' color='error' onClick={() => handleDeletePestItem(item.id)}>
                        <DeleteIcon fontSize='small' />
                      </IconButton>
                      <IconButton
                        size='small'
                        color='primary'
                        onClick={() => {
                          setEditingItemId(item.id)
                          setCurrentPestItem({ ...item, total: item.totalValue, time: item.workTime })
                        }}
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
                ))}
              </TableBody>
            </Table>
          </Box>
        </Grid>
      </Grid>
    </ContentLayout>
  )
}
