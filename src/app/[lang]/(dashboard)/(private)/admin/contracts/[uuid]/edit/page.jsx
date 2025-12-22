// contracts/[uuid]/view/contract/page.jsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Box,
  Card,
  Typography,
  Divider,
  Grid,
  Tabs,
  Tab,
  IconButton
} from '@mui/material'

import { getContractDetails } from '@/api/contract/details'
import { getAllDropdowns } from '@/api/contract/dropdowns'
import { updateContract } from '@/api/contract/update'
import { showToast } from '@/components/common/Toasts'

// Components
import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import GlobalTextarea from '@/components/common/GlobalTextarea'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import ContractValueDrawer from '@/components/service-pages/contract-actions/ContractValueDrawer'

export default function ContractEditPage() {
  const router = useRouter()
  const { uuid } = useParams()

  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [openValueDrawer, setOpenValueDrawer] = useState(false)

  const [dropdowns, setDropdowns] = useState({
    customers: [],
    callTypes: [],
    billingFreq: [],
    serviceFreq: [],
    pests: [],
    chemicals: [],
    employees: []
  })

  // -----------------------------
  // Helpers
  // -----------------------------
  const setVal = (name, value) => setForm(prev => ({ ...prev, [name]: value }))
  const handleTabChange = (event, newValue) => setActiveTab(newValue)
  const toggleValueDrawer = () => setOpenValueDrawer(prev => !prev)

  const handleAutoChange = name => (...args) => {
    const value = args[args.length - 1]
    setVal(name, value)
  }

  const mapContractType = type => {
    if (!type) return ''
    const val = typeof type === 'string' ? type : type.name || type.label || type.contract_type || ''
    if (!val || typeof val !== 'string') return ''
    const lower = val.toLowerCase()
    if (lower === 'limited contract') return 'limited_contract'
    if (lower === 'continuous contract') return 'continuous_contract'
    if (lower === 'warranty') return 'warranty'
    return val
  }

  const formatDateToYMD = date => {
    if (!date || date === '') return null
    const str = String(date).trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
    if (str.includes('T')) return str.split('T')[0]
    if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
      const [dd, mm, yyyy] = str.split('-')
      return `${yyyy}-${mm}-${dd}`
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
      const [dd, mm, yyyy] = str.split('/')
      return `${yyyy}-${mm}-${dd}`
    }
    return null
  }

  // -----------------------------
  // Load Contract
  // -----------------------------
  useEffect(() => {
    const loadContract = async () => {
      if (!uuid) return
      try {
        const data = await getContractDetails(uuid)
        if (data) {
          setForm({
            id: data.id,
            salesModel: data.sales_mode || '',
            client: { id: data.customer_id, name: data.customer },
            contractType: data.contract_type || '',
            contractCode: data.contract_code || '',
            status: data.contract_status || '',
            serviceAddress: data.service_address || '',
            postal: data.postal_address || '',
            coverage: data.covered_location || '',
            poNumber: data.po_number || '',
            poDueDate: data.po_expiry_date || '',
            preferredTime: data.preferred_time || '',
            reportEmail: data.report_email || '',
            contactName: data.contact_person_name || '',
            contactPhone: data.phone || '',
            callType: data.call_type_id || '',
            cellPhone: data.mobile || '',
            grouping: data.grouping_code || '',
            startDate: data.start_date || '',
            endDate: data.end_date || '',
            reminderDate: data.reminder_date || '',
            industry: data.service_frequency_id || '',
            serviceStartDate: data.commencement_date || '',
            technicians: data.technician_id ? [data.technician_id] : [],
            paymentTerms: data.billing_term || '',
            accountCode: data.account_item_id || '',
            salesPerson: data.sales_person_id || '',
            director: data.supervisor_id || '',
            latitude: data.latitude || '',
            longitude: data.longitude || '',
            invoiceRemarks: data.invoice_remarks || '',
            invoiceFrequency: data.billing_frequency_id || '',
            billingRemarks: data.billing_remarks || '',
            techNotes: data.technician_remarks || '',
            appointmentNotes: data.appointment_remarks || '',
            agree1: data.agreement_add_1 || '',
            agree2: data.agreement_add_2 || '',
            amount: data.contract_value || '',
            floorPlanName: data.floor_plan || ''
          })
        }
      } catch (err) {
        console.error(err)
        showToast('error', 'Failed to load contract details')
      }
    }
    loadContract()
  }, [uuid])

  // -----------------------------
  // Load Dropdowns
  // -----------------------------
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const data = (await getAllDropdowns()) || {}
        setDropdowns({
          customers: data.customers || [],
          callTypes: data.callTypes || data.call_types || [],
          billingFreq: data.billingFreq || data.billing_freq || [],
          serviceFreq: data.serviceFreq || data.service_freq || [],
          pests: data.pests || [],
          chemicals: data.chemicals || [],
          employees: data.employees || []
        })
      } catch (err) {
        console.error('Failed to load dropdowns', err)
      }
    }
    loadDropdowns()
  }, [])

  const employees = dropdowns.employees || []
  const technicianOptions = employees.filter(e => e.designation === 'Technician')
  const salesOptions = employees.filter(e => e.designation === 'Sales')
  const directorOptions = employees.filter(e => e.designation === 'Supervisor' || e.designation === 'Manager')

  const handleSave = async () => {
    try {
      setLoading(true)
      const contractId = form.id
      if (!contractId) {
        showToast('error', 'Contract ID missing')
        return
      }

      const payload = {
        sales_mode: form.salesModel,
        customer_id: form.client?.id || form.client,
        contract_type: mapContractType(form.contractType),
        contract_code: form.contractCode,
        contract_status: form.status,
        service_address: form.serviceAddress,
        postal_address: form.postal,
        covered_location: form.coverage,
        po_number: form.poNumber,
        po_expiry_date: formatDateToYMD(form.poDueDate),
        preferred_time: form.preferredTime,
        report_email: form.reportEmail,
        contact_person_name: form.contactName,
        phone: form.contactPhone,
        call_type_id: form.callType?.id || form.callType,
        mobile: form.cellPhone,
        grouping_code: form.grouping,
        start_date: formatDateToYMD(form.startDate),
        end_date: formatDateToYMD(form.endDate),
        reminder_date: formatDateToYMD(form.reminderDate),
        service_frequency_id: form.industry?.id || form.industry,
        commencement_date: formatDateToYMD(form.serviceStartDate),
        technician_id: form.technicians?.[0]?.id || form.technicians?.[0] || null,
        billing_term: form.paymentTerms,
        account_item_id: parseInt(form.accountCode) || null,
        sales_person_id: parseInt(form.salesPerson) || null,
        supervisor_id: parseInt(form.director) || null,
        latitude: form.latitude ? Number(form.latitude) : 0,
        longitude: form.longitude ? Number(form.longitude) : 0,
        invoice_remarks: form.invoiceRemarks,
        billing_frequency_id: form.invoiceFrequency?.id || form.invoiceFrequency,
        billing_remarks: form.billingRemarks,
        technician_remarks: form.techNotes,
        appointment_remarks: form.appointmentNotes,
        agreement_add_1: form.agree1,
        agreement_add_2: form.agree2,
        contract_value: Number(form.amount)
      }

      const result = await updateContract(contractId, payload)
      if (result?.status === 'success') {
        showToast('success', 'Contract updated successfully!')
        router.back()
      } else {
        showToast('error', result?.message || 'Update failed!')
      }
    } catch (err) {
      console.error('Update error:', err)
      showToast('error', 'Update Failed')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = e => {
    const file = e.target.files?.[0]
    if (!file) return
    setVal('floorPlanName', file.name)
  }

  return (
    <Box className='mt-2'>
      <Card sx={{ p: 3, height: '85vh', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant='h5' fontWeight={600}>
            Edit Contract
          </Typography>
        </Box>

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label='Location & Date' />
          <Tab label='Amount & Remarks' />
        </Tabs>

        <Box sx={{ overflowY: 'auto', flexGrow: 1, pr: 2 }}>
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <GlobalAutocomplete
                  label='Sales mode'
                  options={['Confirmed Sales', 'Quotation']}
                  value={form.salesModel || ''}
                  onChange={handleAutoChange('salesModel')}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <GlobalAutocomplete
                  label='Customer'
                  options={dropdowns.customers}
                  getOptionLabel={opt => opt.name || opt.label || (typeof opt === 'string' ? opt : '')}
                  value={form.client || null}
                  onChange={handleAutoChange('client')}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <GlobalAutocomplete
                  label='Contract Type'
                  options={['Limited Contract', 'Continuous Contract', 'Warranty']}
                  value={form.contractType || ''}
                  onChange={handleAutoChange('contractType')}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <GlobalTextField label='Contract Code' value={form.contractCode || ''} onChange={e => setVal('contractCode', e.target.value)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <GlobalAutocomplete label='Contract Status' options={['Current', 'Pending', 'Expired', 'Closed']} value={form.status || ''} onChange={handleAutoChange('status')} />
              </Grid>
              <Grid item xs={12} md={8}>
                <GlobalTextField label='Service Address' value={form.serviceAddress || ''} onChange={e => setVal('serviceAddress', e.target.value)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <GlobalTextField label='Postal Code' value={form.postal || ''} onChange={e => setVal('postal', e.target.value)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <GlobalTextField label='Covered Location' value={form.coverage || ''} onChange={e => setVal('coverage', e.target.value)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <GlobalTextField label='PO Number' value={form.poNumber || ''} onChange={e => setVal('poNumber', e.target.value)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <GlobalTextField label='PO Expiry Date' placeholder='dd-mm-yyyy' value={form.poDueDate || ''} onChange={e => setVal('poDueDate', e.target.value)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <GlobalTextField label='Preferred Time' value={form.preferredTime || ''} onChange={e => setVal('preferredTime', e.target.value)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <GlobalTextField label='Report Email' value={form.reportEmail || ''} onChange={e => setVal('reportEmail', e.target.value)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <GlobalTextField label='Site Contact Name' value={form.contactName || ''} onChange={e => setVal('contactName', e.target.value)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <GlobalTextField label='Site Contact Phone' value={form.contactPhone || ''} onChange={e => setVal('contactPhone', e.target.value)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <GlobalAutocomplete label='Call Type' options={dropdowns.callTypes} getOptionLabel={opt => opt.name || opt.label || ''} value={form.callType || ''} onChange={handleAutoChange('callType')} />
              </Grid>
              <Grid item xs={12} md={4}>
                <GlobalTextField label='Start Date' placeholder='dd-mm-yyyy' value={form.startDate || ''} onChange={e => setVal('startDate', e.target.value)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <GlobalTextField label='End Date' placeholder='dd-mm-yyyy' value={form.endDate || ''} onChange={e => setVal('endDate', e.target.value)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <GlobalTextField label='Commencement Date' placeholder='dd-mm-yyyy' value={form.serviceStartDate || ''} onChange={e => setVal('serviceStartDate', e.target.value)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <GlobalAutocomplete label='Technicians' multiple options={technicianOptions} getOptionLabel={opt => opt.name || ''} value={form.technicians || []} onChange={handleAutoChange('technicians')} />
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <GlobalAutocomplete label='Payment Term' options={['0 days', '15 days', '30 days', '45 days', '60 days']} value={form.paymentTerms || ''} onChange={handleAutoChange('paymentTerms')} />
              </Grid>
              <Grid item xs={12} md={4}>
                <GlobalTextField label='Account Code' value={form.accountCode || ''} onChange={e => setVal('accountCode', e.target.value)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <GlobalAutocomplete label='Sales Person' options={salesOptions} getOptionLabel={opt => opt.name || ''} value={form.salesPerson || null} onChange={handleAutoChange('salesPerson')} />
              </Grid>
              <Grid item xs={12} md={4}>
                <GlobalAutocomplete label='Supervisor' options={directorOptions} getOptionLabel={opt => opt.name || ''} value={form.director || null} onChange={handleAutoChange('director')} />
              </Grid>
              <Grid item xs={12} md={9}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <GlobalTextarea label='Invoice Remarks' value={form.invoiceRemarks || ''} onChange={e => setVal('invoiceRemarks', e.target.value)} fullWidth />
                  <GlobalButton variant='contained' onClick={() => showToast('info', 'Refreshed')}>REFRESH</GlobalButton>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <GlobalAutocomplete label='Invoice Frequency' options={dropdowns.billingFreq} getOptionLabel={opt => opt.name || opt.label || ''} value={form.invoiceFrequency || ''} onChange={handleAutoChange('invoiceFrequency')} />
              </Grid>
              <Grid item xs={12} md={12}>
                <GlobalTextarea label='Billing Remarks' value={form.billingRemarks || ''} onChange={e => setVal('billingRemarks', e.target.value)} fullWidth />
              </Grid>
              <Grid item xs={12} md={12}>
                <Typography variant='subtitle1' fontWeight={600} sx={{ mb: 1 }}>Contract Value ($)</Typography>
                <GlobalTextField
                  fullWidth
                  value={form.amount ? `$${Number(form.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00'}
                  InputProps={{ readOnly: true }}
                  onClick={toggleValueDrawer}
                  sx={{ cursor: 'pointer' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <GlobalTextarea label='Agreement Add On 1' value={form.agree1 || ''} onChange={e => setVal('agree1', e.target.value)} fullWidth />
              </Grid>
              <Grid item xs={12} md={6}>
                <GlobalTextarea label='Agreement Add On 2' value={form.agree2 || ''} onChange={e => setVal('agree2', e.target.value)} fullWidth />
              </Grid>
              <Grid item xs={12} md={6}>
                <GlobalTextarea label='Technician Remarks' value={form.techNotes || ''} onChange={e => setVal('techNotes', e.target.value)} fullWidth />
              </Grid>
              <Grid item xs={12} md={6}>
                <GlobalTextarea label='Appointment Remarks' value={form.appointmentNotes || ''} onChange={e => setVal('appointmentNotes', e.target.value)} fullWidth />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant='body2' sx={{ mb: 1 }}>Floor Plan</Typography>
                <input type='file' onChange={handleFileChange} />
                <Typography variant='caption'>{form.floorPlanName || 'No file chosen'}</Typography>
              </Grid>
            </Grid>
          )}

          <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <GlobalButton color='secondary' onClick={() => router.back()}>Close</GlobalButton>
            <GlobalButton variant='contained' onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save'}</GlobalButton>
          </Box>
        </Box>

        <ContractValueDrawer
          open={openValueDrawer}
          onClose={toggleValueDrawer}
          contractId={form.id}
          initialValue={form.amount || ''}
          onValueUpdate={val => setVal('amount', val)}
        />
      </Card>
    </Box>
  )
}
