'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'

import { Card, CardContent, Stepper, Step, StepLabel, Typography, Button, Box, CircularProgress } from '@mui/material'
import { styled } from '@mui/material/styles'
import classnames from 'classnames'

import CustomAvatar from '@core/components/mui/Avatar'
import StepperWrapper from '@core/styles/stepper'
import { showToast } from '@/components/common/Toasts'
import DirectionalIcon from '@components/DirectionalIcon'

// Steps
import Step1Details from './steps/Step1Details'
import Step2ContractInfo from './steps/Step2ContractInfo'
import Step3BillingDetails from './steps/Step3BillingDetails'
import Step4PestItems from './steps/Step4PestItems'
import Step5Review from './steps/Step5Review'

// API
import {
  getContractDropdowns,
  getContractDates,
  getInvoiceCount,
  getPestCount,
  createContract
} from '@/api/contract_group/contract'
import { getCustomerDetails } from '@/api/customer_group/customer'
import { getProposalDetails } from '@/api/sales/proposal'
import { decodeId } from '@/utils/urlEncoder'

const steps = [
  { icon: 'tabler-file-description', title: 'Contract Basics', subtitle: 'Type & Customer' },
  { icon: 'tabler-calendar-time', title: 'Details & Schedule', subtitle: 'Dates & Address' },
  { icon: 'tabler-file-invoice', title: 'Billing & Staff', subtitle: 'Payment & Team' },
  { icon: 'tabler-bug', title: 'Service Items', subtitle: 'Pests & Frequency' },
  { icon: 'tabler-check', title: 'Review', subtitle: 'Remarks & Finish' }
]

const StyledStep = styled(Step)(({ theme }) => ({
  '&.Mui-completed .step-title , &.Mui-completed .step-subtitle': {
    color: 'var(--mui-palette-text-disabled)'
  }
}))

export default function AddContractWizard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromProposalId = searchParams.get('from_proposal')
  const { lang = 'en' } = useParams()

  const [activeStep, setActiveStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ----------------------------------------------------------------------
  // State
  // ----------------------------------------------------------------------
  const [formData, setFormData] = useState({
    salesMode: 'Confirmed Sales',
    salesModeId: '1',
    contractType: '',
    contractTypeId: '',
    company: '', // Added
    companyId: '', // Added
    name: '', // Added (Contract Name)

    // Step 1 Extras
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

    coveredLocation: '',
    contractCode: '',

    // Step 2
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
    startDate: null,
    endDate: null,
    reminderDate: null,
    customer: '',
    customerId: '',
    industry: '',
    industryId: '',
    paymentTerm: '',
    paymentTermId: '',
    salesPerson: '',
    salesPersonId: '',
    latitude: '',
    longitude: '',

    // Step 3
    billingFrequency: '',
    billingFrequencyId: '',
    invoiceCount: '',
    invoiceRemarks: [],
    invoiceRemarksOptions: [], // Added
    technician: '',
    technicianId: '',
    supervisor: '',
    supervisorId: '',
    reportBlock: '', // Added

    contractValue: '', // Should be calculated or field?

    file: null,
    uploadedFileName: '',
    uploadedFileURL: '',

    // Step 5
    billingRemarks: '',
    agreement1: '',
    agreement2: '',
    technicianRemarks: '',
    appointmentRemarks: ''
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
    chemicals: [],
    contractTypes: ['Continuous Contract', 'Limited Contract', 'Continuous Job', 'Job', 'Warranty']
  })

  // Pest Item State
  const [currentPestItem, setCurrentPestItem] = useState({
    id: '',
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

  // ----------------------------------------------------------------------
  // Refs (Grouped by Step for Focus Management could be added but keeping simple for now)
  // ----------------------------------------------------------------------
  const refs = {
    contractTypeInputRef: useRef(null),
    customerInputRef: useRef(null),
    salesPersonInputRef: useRef(null),
    contractCodeRef: useRef(null),
    contactPersonRef: useRef(null),
    mobileRef: useRef(null),
    reportEmailRef: useRef(null),

    callTypeInputRef: useRef(null),
    serviceAddressRef: useRef(null),
    postalCodeRef: useRef(null),
    industryInputRef: useRef(null),
    poNumberRef: useRef(null),

    billingFrequencyInputRef: useRef(null),
    paymentTermInputRef: useRef(null),
    contractValueRef: useRef(null),
    technicianInputRef: useRef(null),
    supervisorInputRef: useRef(null),
    invoiceRemarksRef: useRef(null),

    pestInputRef: useRef(null),
    frequencyInputRef: useRef(null),
    currentPestCountRef: useRef(null),
    currentPestValueRef: useRef(null),
    timeInputRef: useRef(null),
    currentChemicalsRef: useRef(null),
    currentNoOfItemsRef: useRef(null),
    addPestButtonRef: useRef(null),

    technicianRemarksRef: useRef(null),
    appointmentRemarksRef: useRef(null),
    billingRemarksRef: useRef(null),
    agreement1Ref: useRef(null),
    agreement2Ref: useRef(null)
  }

  const fileInputRef = useRef(null)
  const fileUploadButtonRef = useRef(null)

  // ----------------------------------------------------------------------
  // Data Loading
  // ----------------------------------------------------------------------

  const cleanOptions = arr => {
    if (!Array.isArray(arr)) return []
    const seen = new Set()
    return arr.filter(item => {
      if (item === null || item === undefined || item === '') return false
      const key = typeof item === 'object' ? item.id || item.name || JSON.stringify(item) : item
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const res = await getContractDropdowns()
        const data = res?.data?.data?.data || {}
        setDropdowns(prev => ({
          ...prev,
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
        }))
      } catch (err) {
        console.error('Dropdown fetch error:', err)
        showToast('error', 'Failed to load dropdowns')
      }
    }
    loadDropdowns()
  }, [])

  // ----------------------------------------------------------------------
  // HELPERS (Copied from ProposalWizard for consistency)
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

  // Basic Proposal Import Logic
  useEffect(() => {
    if (fromProposalId) {
      const loadProposal = async () => {
        try {
          const decodedId = decodeId(fromProposalId) || fromProposalId
          const res = await getProposalDetails(decodedId)
          const data = res?.status === 'success' || res ? res.data || res : null

          if (data) {
            setFormData(prev => ({
              ...prev,
              // Step 1
              salesMode:
                data.sales_mode?.replace(/_/g, ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || 'Confirmed Sales',
              // salesModeId: '1', // Keep default or map if needed
              contractType: data.contract_type?.replace(/_/g, ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || '',
              companyId: data.company_id,
              customer: data.customer,
              customerId: data.customer_id,
              name: data.name || '',

              contractCode: data.contract_code || '',

              // Step 1 Extras (Billing & Contact) - Mapping from Proposal Extra Fields
              billingName: data.billing_name || '',
              billingAddress: data.billing_address || '',
              billingPostalCode: data.billing_postal_code || '',
              customerCode: data.customer_code || '',
              groupCode: data.grouping_code || '',
              accCode: data.acc_code || '',
              picContactName: data.contact_person_name || '', // Mapping proposal contact to PIC
              picEmail: data.report_email || '',
              picPhone: data.phone || '', // Mapping proposal phone to PIC
              picMobile: data.mobile || '',
              billingContactName: data.billing_contact_name || '',
              billingEmail: data.billing_email || '',
              billingPhone: data.billing_phone || '',

              coveredLocation: data.covered_location || '',

              // Step 2
              serviceAddress: data.service_address || '',
              postalCode: data.postal_code || '',
              poNumber: data.po_number || '',
              poExpiry: parseSafeDate(data.po_expiry_date),
              preferredTime: parseSafeTime(data.preferred_time),
              reportEmail: data.report_email || '',
              contactPerson: data.contact_person_name || '',
              sitePhone: data.phone || '',
              mobile: data.mobile || '',
              callTypeId: data.call_type_id,
              callType: data.call_type || '',
              startDate: parseSafeDate(data.start_date),
              endDate: parseSafeDate(data.end_date),
              reminderDate: parseSafeDate(data.reminder_date),

              industryId: data.industry_id,
              industry: data.industry || '',
              paymentTerm: data.billing_term ? `${data.billing_term} days` : '',
              salesPersonId: data.sales_person_id,
              salesPerson: data.sales_person || '',

              latitude: data.latitude || '',
              longitude: data.longitude || '',

              // Step 3
              billingFrequencyId: data.billing_frequency_id,
              billingFrequency: data.billing_frequency || '',
              invoiceCount: data.invoice_count || '',
              invoiceRemarks: data.invoice_remarks ? data.invoice_remarks.split(',').map(s => s.trim()) : [],
              technicianId: data.technician_id,
              technician: data.technician || '',
              supervisorId: data.supervisor_id,
              supervisor: data.supervisor || '',
              reportBlock: data.report_block || '',
              contractValue: data.contract_value || '',

              file: null, // Files generally not auto-imported unless URL handling
              uploadedFileName: data.floor_plan || '',

              // Step 5
              billingRemarks: data.billing_remarks || '',
              agreement1: data.agreement_add_1 || '',
              agreement2: data.agreement_add_2 || '',
              technicianRemarks: data.technician_remarks || '',
              appointmentRemarks: data.appointment_remarks || ''
            }))

            // Pest Items
            if (data.pest_items && Array.isArray(data.pest_items)) {
              setPestItems(
                data.pest_items.map(item => ({
                  id: Date.now().toString(36) + Math.random().toString(36).substring(2),
                  pest: item.pest,
                  pestId: item.pest_id,
                  frequency: item.frequency,
                  frequencyId: item.frequency_id,
                  pestCount: item.no_location,
                  pestValue: item.pest_value,
                  total: item.total_value, // Note: Proposal uses total_value
                  time: convertMinutesToTime(item.work_time),
                  chemical: item.chemical_name || item.chemical || '',
                  chemicals: item.chemical_name || item.chemical || '',
                  chemicalId: item.chemical_id,
                  noOfItems: item.pest_service_count
                }))
              )
            }

            showToast('success', 'Proposal details loaded!')
          }
        } catch (err) {
          console.error('Failed to load proposal details:', err)
          showToast('error', 'Failed to load proposal details')
        }
      }
      loadProposal()
    }
  }, [fromProposalId])

  // ----------------------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------------------

  const handleNext = () => {
    // Validation Logic per step
    if (activeStep === 0) {
      if (!formData.customer || !formData.contractType) {
        showToast('error', 'Please fill in required fields')
        return
      }
    }
    if (activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrev = () => {
    if (activeStep > 0) setActiveStep(prev => prev - 1)
  }

  const handleAutocompleteChange = (name, newValue, ref) => {
    const isObject = typeof newValue === 'object' && newValue !== null
    setFormData(prev => ({
      ...prev,
      [name]: isObject ? newValue.name || '' : newValue,
      [`${name}Id`]: isObject ? newValue.id || '' : ''
    }))

    // Side effects logic
    if (name === 'customer' && isObject && newValue.id) {
      fetchCustomerDetails(newValue.id)
    }

    if (ref && ref.current) {
      // Simple focus next (mock)
    }
  }

  const fetchCustomerDetails = async id => {
    try {
      const res = await getCustomerDetails(id)
      if (res?.status === 'success') {
        const c = res.data
        setFormData(prev => ({
          ...prev,
          customerId: id,
          serviceAddress: c.billing_address || '',
          postalCode: c.postal_code || '',
          contactPerson: c.pic_contact_name || '',
          sitePhone: c.pic_phone || '',
          mobile: c.mobile_no || '',
          reportEmail: (c.billing_email || c.pic_email || '').trim()
        }))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDateChange = async (name, date) => {
    setFormData(prev => ({ ...prev, [name]: date }))

    if (name === 'startDate' && date) {
      try {
        const payload = {
          start_date: date.toISOString().split('T')[0],
          contract_type: formData.contractType || '',
          frequency: formData.billingFrequency || ''
        }
        const res = await getContractDates(payload)
        if (res?.data?.status === 'success') {
          setFormData(prev => ({
            ...prev,
            endDate: new Date(res.data.data.end_date),
            reminderDate: new Date(res.data.data.reminder_date)
          }))
        }
      } catch (e) {}
    }

    // Trigger invoice count update
    if ((name === 'startDate' || name === 'endDate') && formData.billingFrequencyId) {
      // We need the other date too
      // Short delay or check if both exist to fetch invoice count
    }
  }

  // Invoice Count Effect
  useEffect(() => {
    if (formData.billingFrequencyId && formData.startDate && formData.endDate) {
      const fetchInvoiceCount = async () => {
        try {
          const payload = {
            billing_frequency_id: Number(formData.billingFrequencyId),
            start_date: formData.startDate.toISOString().split('T')[0],
            end_date: formData.endDate.toISOString().split('T')[0]
          }
          const res = await getInvoiceCount(payload)
          if (res?.status === 'success') {
            setFormData(prev => ({ ...prev, invoiceCount: res.invoice_count ?? res.data?.invoice_count ?? 0 }))
          }
        } catch (e) {}
      }
      fetchInvoiceCount()
    }
  }, [formData.billingFrequencyId, formData.startDate, formData.endDate])

  // Pest Item Handlers
  const handleCurrentPestItemAutocompleteChange = (name, newValue, ref) => {
    const isObject = typeof newValue === 'object' && newValue !== null
    setCurrentPestItem(prev => ({
      ...prev,
      [name]: isObject ? newValue.name || '' : newValue,
      [`${name}Id`]: isObject ? newValue.id || '' : ''
    }))
  }

  const handleCurrentPestItemChange = e => {
    const { name, value } = e.target
    setCurrentPestItem(prev => {
      const next = { ...prev, [name]: value }
      if (name === 'pestCount' || name === 'pestValue') {
        const count = Number(next.pestCount || 0)
        const val = Number(next.pestValue || 0)
        next.total = (count * val).toString()
      }
      return next
    })
  }

  const handleAddPestItem = () => {
    // Validate
    if (!currentPestItem.pest) {
      showToast('error', 'Select a pest')
      return
    }

    if (editingItemId) {
      setPestItems(prev =>
        prev.map(item => (item.id === editingItemId ? { ...currentPestItem, id: editingItemId } : item))
      )
      setEditingItemId(null)
    } else {
      setPestItems(prev => [...prev, { ...currentPestItem, id: Date.now().toString() }])
    }

    // Reset
    setCurrentPestItem({
      id: '',
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

  const handleEditPestItem = id => {
    const item = pestItems.find(i => i.id === id)
    if (item) {
      setCurrentPestItem(item)
      setEditingItemId(id)
    }
  }

  const handleDeletePestItem = id => {
    setPestItems(prev => prev.filter(i => i.id !== id))
  }

  // File Handlers
  const handleFileChange = e => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({
        ...prev,
        file: file,
        uploadedFileName: file.name,
        uploadedFileURL: URL.createObjectURL(file)
      }))
    } else {
      setFormData(prev => ({ ...prev, file: null, uploadedFileName: '', uploadedFileURL: '' }))
    }
  }

  const handleKeyDown = (e, ref, isMultiline) => {
    // Mock
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    // Construct payload similar to createContract in original file
    // ...

    // Mock Success for now to demonstrate UI
    setTimeout(() => {
      setIsSubmitting(false)
      showToast('success', 'Contract Created Successfully (Mock)!')
      router.push(`/${lang}/admin/contracts`)
    }, 1500)
  }

  // Render Step Content
  const getStepContent = step => {
    switch (step) {
      case 0:
        return (
          <Step1Details
            formData={formData}
            setFormData={setFormData}
            dropdowns={dropdowns}
            refs={refs}
            handleAutocompleteChange={handleAutocompleteChange}
            handleKeyDown={handleKeyDown}
          />
        )
      case 1:
        return (
          <Step2ContractInfo
            formData={formData}
            setFormData={setFormData}
            dropdowns={dropdowns}
            refs={refs}
            handleAutocompleteChange={handleAutocompleteChange}
            handleKeyDown={handleKeyDown}
            handleDateChange={handleDateChange}
          />
        )
      case 2:
        return (
          <Step3BillingDetails
            formData={formData}
            setFormData={setFormData}
            dropdowns={dropdowns}
            refs={refs}
            handleAutocompleteChange={handleAutocompleteChange}
            handleKeyDown={handleKeyDown}
          />
        )
      case 3:
        return (
          <Step4PestItems
            formData={formData}
            currentPestItem={currentPestItem}
            pestItems={pestItems}
            dropdowns={dropdowns}
            refs={refs}
            handleCurrentPestItemAutocompleteChange={handleCurrentPestItemAutocompleteChange}
            handleCurrentPestItemChange={handleCurrentPestItemChange}
            handleAddPestItem={handleAddPestItem}
            handleEditPestItem={handleEditPestItem}
            handleDeletePestItem={handleDeletePestItem}
            editingItemId={editingItemId}
            handleKeyDown={handleKeyDown}
          />
        )
      case 4:
        return (
          <Step5Review
            formData={formData}
            setFormData={setFormData}
            refs={refs}
            handleFileChange={handleFileChange}
            handleKeyDown={handleKeyDown}
            fileInputRef={fileInputRef}
            fileUploadButtonRef={fileUploadButtonRef}
          />
        )
      default:
        return 'Unknown Step'
    }
  }

  return (
    <Card className='flex flex-col md:flex-row'>
      <CardContent className='max-md:border-be md:border-ie md:min-is-[300px]'>
        <StepperWrapper>
          <Stepper
            activeStep={activeStep}
            orientation='vertical'
            connector={<></>}
            className='flex flex-col gap-4 min-is-[220px]'
          >
            {steps.map((label, index) => {
              return (
                <StyledStep key={index} completed={index < activeStep}>
                  <StepLabel icon={<></>} className='p-1 cursor-pointer' onClick={() => setActiveStep(index)}>
                    <div className='step-label'>
                      <CustomAvatar
                        variant='rounded'
                        skin={activeStep === index ? 'filled' : 'light'}
                        color={activeStep >= index ? 'primary' : 'secondary'}
                        className={classnames({ 'shadow-primarySm': activeStep === index })}
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
              )
            })}
          </Stepper>
        </StepperWrapper>
      </CardContent>

      <CardContent className='flex-1 p-6'>
        {getStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handlePrev}
            startIcon={<DirectionalIcon ltrIconClass='tabler-arrow-left' rtlIconClass='tabler-arrow-right' />}
          >
            Previous
          </Button>
          <Button
            variant='contained'
            onClick={handleNext}
            disabled={isSubmitting}
            endIcon={
              activeStep === steps.length - 1 ? (
                <i className='tabler-check' />
              ) : (
                <DirectionalIcon ltrIconClass='tabler-arrow-right' rtlIconClass='tabler-arrow-left' />
              )
            }
          >
            {activeStep === steps.length - 1 ? isSubmitting ? <CircularProgress size={20} /> : 'Submit' : 'Next'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}
