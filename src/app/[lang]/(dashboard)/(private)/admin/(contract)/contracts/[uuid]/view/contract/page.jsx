// contracts/[uuid]/view/contract/page.jsx

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { getContractDetails } from '@/api/contract_group/contract/details'
import { updateContractValueApi } from '@/api/contract_group/contract/icons/contractValueUpdate'
import ContractValueDrawer from '@/components/service-pages/contract-actions/ContractValueDrawer'
import ContractValueDrawerContent from '@/components/service-pages/contract-actions/ContractValueDrawerContent'
import EditIcon from '@mui/icons-material/Edit'
import IconButton from '@mui/material/IconButton' // <--- IDHU MISSING!

import { Box, Card, Typography, Divider, Grid, InputAdornment } from '@mui/material'
import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import GlobalTextarea from '@/components/common/GlobalTextarea'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import { showToast } from '@/components/common/Toasts'
import { getAllDropdowns } from '@/api/contract_group/contract/dropdowns'
import { updateContract } from '@/api/contract_group/contract/update'
import FileUploaderSingle from '@/components/common/FileUploaderSingle'

export default function ContractViewPage() {
  const [form, setForm] = useState({})
  const router = useRouter() // 👈 ADD THIS
  const [dropdowns, setDropdowns] = useState({
    customers: [],
    callTypes: [],
    billingFreq: [],
    serviceFreq: [],
    pests: [],
    chemicals: [],
    employees: [],
    industries: []
  })

  const { uuid } = useParams()

  // -----------------------------
  // Helpers
  // -----------------------------
  const setVal = (name, value) => setForm(prev => ({ ...prev, [name]: value }))
  const [openValueDrawer, setOpenValueDrawer] = useState(false)
  const toggleValueDrawer = () => setOpenValueDrawer(prev => !prev)

  // works whether GlobalAutocomplete gives (value) or (event, value)
  const handleAutoChange =
    name =>
    (...args) => {
      const value = args[args.length - 1]
      setVal(name, value)
    }

  const mapContractType = type => {
    if (!type) return ''

    // If Autocomplete returns object → extract label/name
    const val = typeof type === 'string' ? type : type.name || type.label || type.contract_type || ''

    if (!val || typeof val !== 'string') return ''

    const lower = val.toLowerCase()

    if (lower === 'limited contract') return 'limited_contract'
    if (lower === 'continuous contract') return 'continuous_contract'
    if (lower === 'warranty') return 'warranty'

    return val
  }

  const handleClose = () => {
    router.push('/en/admin/contracts') // 👈 adjust path if needed
  }

  const formatDateToYMD = date => {
    if (!date || date === '' || date === null || date === undefined) {
      return null // Let backend accept null for optional dates
    }

    const str = String(date).trim()

    // Already perfect YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str
    }

    // Handle ISO with time: 2025-12-31T00:00:00 or 2025-12-31T00:00:00Z
    if (str.includes('T')) {
      return str.split('T')[0]
    }

    // DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
      const [dd, mm, yyyy] = str.split('-')
      return `${yyyy}-${mm}-${dd}`
    }

    // DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
      const [dd, mm, yyyy] = str.split('/')
      return `${yyyy}-${mm}-${dd}`
    }

    // MM/DD/YYYY (American format - be careful, but common in some systems)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str) && !str.includes('-')) {
      const parts = str.split('/')
      const mm = parts[0].padStart(2, '0')
      const dd = parts[1].padStart(2, '0')
      const yyyy = parts[2]
      return `${yyyy}-${mm}-${dd}`
    }

    // If all else fails, return null instead of invalid garbage
    console.warn('Unrecognized date format:', date)
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
            reminderDate: data.reminder_date ? format(new Date(data.reminder_date), 'dd/MM/yyyy') : '',
            industry: data.industry_id || data.industry || '',
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

        const rawCustomers = data.customers || []
        const seen = new Set()
        const uniqueCustomers = rawCustomers.filter(item => {
          const key = typeof item === 'string' ? item : item.id || item.name || item.label
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })

        setDropdowns({
          customers: uniqueCustomers,
          callTypes: data.callTypes || [],
          billingFreq: data.billingFreq || [],
          serviceFreq: data.serviceFreq || [],
          pests: data.pests || [],
          chemicals: data.chemicals || [],
          employees: data.employees || [],

          // Use the mapped fields from the API helper
          industries: data.industries || [],
          salesPeople: data.salesPeople || [],
          supervisors: data.supervisors || [],
          technicians: data.technicians || []
        })
      } catch (err) {
        console.error('Failed to load dropdowns', err)
        showToast('error', 'Failed to load contract dropdowns')
      }
    }

    loadDropdowns()
  }, [])

  // -----------------------------
  // Employee-based dropdowns
  // -----------------------------
  // const employees = dropdowns.employees || []
  const technicianOptions = (dropdowns.technicians || []).map(e => ({
    ...e,
    uniqueKey: `tech-${e.id || e.name}`
  }))

  // -----------------------------
  // File upload
  // -----------------------------
  // -----------------------------
  // File upload
  // -----------------------------
  const handleFileChange = fileOrEvent => {
    // Handle both direct file object (from Dropzone) and Event (fallback)
    const file = fileOrEvent?.target?.files?.[0] || fileOrEvent

    if (!file) return
    setVal('floorPlanFile', file)
    setVal('floorPlanName', file.name)
  }

  const handleSave = async () => {
    try {
      // Make sure UUID exists
      if (!uuid) {
        showToast('error', 'Invalid contract ID')
        return
      }

      // Convert UUID → ID (your API expects ?id=NUMBER)
      const contractId = form.id || form.contractId || form.db_id || null

      if (!contractId) {
        showToast('error', 'Contract numeric ID missing in API data')
        return
      }

      // Build payload exactly like API needs
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

        // IMPORTANT FIX
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

        industry_id: form.industry?.id || form.industry,
        // Removed service_frequency_id mapping from form.industry
        commencement_date: formatDateToYMD(form.serviceStartDate),

        technician_id: form.technicians?.[0]?.id
          ? String(form.technicians[0].id)
          : form.technicians?.[0]
            ? String(form.technicians[0])
            : null,

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

      console.log('Sending Payload:', payload)

      const result = await updateContract(contractId, payload)

      if (result?.status === 'success') {
        showToast('success', 'Contract updated successfully!')
      } else {
        showToast('error', result?.message || 'Update failed!')
      }
    } catch (err) {
      console.error('Update error:', err)
      showToast('error', 'Something went wrong while updating the contract')
    }
  }

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <Box className='mt-2'>
      <Card
        sx={{
          p: 2, // reduce outer padding
          height: '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* TOP BAR – like screenshot */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant='h5' fontWeight={600}>
            Contract Details
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* SCROLL AREA */}
        <Box
          sx={{
            overflowY: 'auto',
            flexGrow: 1,
            px: 3, // 👈 left & right padding
            pb: 2 // 👈 bottom spacing
          }}
        >
          <Grid container spacing={3}>
            {/* ========== SECTION 1: BASIC INFO ========== */}
            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='Sales mode'
                options={['Confirmed Sales', 'Quotation']}
                value={form.salesModel || ''} // ← correct
                onChange={handleAutoChange('salesModel')}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='Customer'
                options={dropdowns.customers}
                getOptionLabel={opt =>
                  typeof opt === 'string' ? opt : opt.name || opt.label || opt.customer_name || ''
                }
                isOptionEqualToValue={(opt, val) => {
                  const a = typeof opt === 'string' ? opt : opt.id || opt.name
                  const b = typeof val === 'string' ? val : val?.id || val?.name || val
                  return a === b
                }}
                value={form.client || null}
                onChange={handleAutoChange('client')}
                renderOption={(props, option) => {
                  const key = typeof option === 'string' ? option : option.id || option.name
                  return (
                    <li {...props} key={key}>
                      {typeof option === 'string' ? option : option.name || option.label || option.customer_name}
                    </li>
                  )
                }}
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
              <GlobalTextField
                label='Contract Code'
                value={form.contractCode || ''}
                onChange={e => setVal('contractCode', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='Contract Status'
                options={['Current', 'Pending', 'Expired', 'Closed']}
                value={form.status || ''}
                onChange={handleAutoChange('status')}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='New/Renewed Sales Status'
                options={['New', 'Renewal']}
                value={form.salesStatus || ''}
                onChange={handleAutoChange('salesStatus')}
              />
            </Grid>

            <Grid item xs={12} md={8}>
              <GlobalTextField
                label='Service Address'
                value={form.serviceAddress || ''}
                onChange={e => setVal('serviceAddress', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalTextField
                label='Postal Code'
                value={form.postal || ''}
                onChange={e => setVal('postal', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalTextField
                label='Covered Location'
                value={form.coverage || ''}
                onChange={e => setVal('coverage', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalTextField
                label='PO Number'
                value={form.poNumber || ''}
                onChange={e => setVal('poNumber', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalTextField
                label='PO Expiry Date'
                placeholder='dd-mm-yyyy'
                value={form.poDueDate || ''}
                onChange={e => setVal('poDueDate', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalTextField
                label='Preferred Time'
                value={form.preferredTime || ''}
                onChange={e => setVal('preferredTime', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalTextField
                label='Report Email'
                value={form.reportEmail || ''}
                onChange={e => setVal('reportEmail', e.target.value)}
              />
            </Grid>

            {/* Divider between main blocks */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>

            {/* ========== SECTION 2: CONTACT DETAILS ========== */}
            <Grid item xs={12} md={4}>
              <GlobalTextField
                label='Site Contact Person Name'
                value={form.contactName || ''}
                onChange={e => setVal('contactName', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalTextField
                label='Site Incharge Phone Number'
                value={form.contactPhone || ''}
                onChange={e => setVal('contactPhone', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='Call Type'
                options={dropdowns.callTypes}
                getOptionLabel={opt => (typeof opt === 'string' ? opt : opt.name || opt.label || opt.call_type || '')}
                value={form.callType || ''}
                onChange={handleAutoChange('callType')}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalTextField
                label='Mobile'
                value={form.cellPhone || ''}
                onChange={e => setVal('cellPhone', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalTextField
                label='Group code'
                value={form.grouping || ''}
                onChange={e => setVal('grouping', e.target.value)}
              />
            </Grid>

            {/* Divider */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>

            {/* ========== SECTION 3: DATES & SALES INFO ========== */}
            <Grid item xs={12} md={4}>
              <GlobalTextField
                label='Start Date'
                placeholder='dd-mm-yyyy'
                value={form.startDate || ''}
                onChange={e => setVal('startDate', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalTextField
                label='End Date'
                placeholder='dd-mm-yyyy'
                value={form.endDate || ''}
                onChange={e => setVal('endDate', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalTextField
                label='Reminder Date'
                placeholder='dd-mm-yyyy'
                value={form.reminderDate || ''}
                onChange={e => setVal('reminderDate', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='Industry'
                options={dropdowns.industries}
                getOptionLabel={opt => (typeof opt === 'string' ? opt : opt.name || opt.label || '')}
                value={form.industry || ''}
                onChange={handleAutoChange('industry')}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalTextField
                label='Commencement Date'
                placeholder='dd-mm-yyyy'
                value={form.serviceStartDate || ''}
                onChange={e => setVal('serviceStartDate', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='Technicians'
                multiple
                options={technicianOptions}
                getOptionLabel={opt => opt.name || opt.label || ''}
                isOptionEqualToValue={(o, v) => o.id === v.id || o.name === v.name}
                value={technicianOptions.filter(opt =>
                  (form.technicians || []).some(v => v === opt.id || v.id === opt.id || v === opt.uniqueKey)
                )}
                onChange={handleAutoChange('technicians')}
                renderOption={(props, option) => (
                  <li {...props} key={option.uniqueKey || option.id || option.name}>
                    {option.name || option.label}
                  </li>
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='Payment Term'
                options={['0 days', '15 days', '30 days', '45 days', '60 days']}
                value={form.paymentTerms || ''}
                onChange={handleAutoChange('paymentTerms')}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='Invoice Frequency'
                options={dropdowns.billingFreq}
                getOptionLabel={opt => (typeof opt === 'string' ? opt : opt.name || opt.label || opt.frequency || '')}
                value={form.invoiceFrequency || ''}
                onChange={handleAutoChange('invoiceFrequency')}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='Sales Person'
                options={dropdowns.salesPeople || []}
                getOptionLabel={opt => opt.name || ''}
                isOptionEqualToValue={(o, v) => o.id === (v?.id || v)}
                value={form.salesPerson || null}
                onChange={handleAutoChange('salesPerson')}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    {option.name}
                  </li>
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalAutocomplete
                label='Supervisor'
                options={dropdowns.supervisors || []}
                getOptionLabel={opt => opt.name || ''}
                isOptionEqualToValue={(o, v) => o.id === (v?.id || v)}
                value={form.director || null}
                onChange={handleAutoChange('director')}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    {option.name}
                  </li>
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalTextField
                label='Latitude'
                value={form.latitude || ''}
                onChange={e => setVal('latitude', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <GlobalTextField
                label='Longitude'
                value={form.longitude || ''}
                onChange={e => setVal('longitude', e.target.value)}
              />
            </Grid>

            {/* Divider */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>

            {/* ========== SECTION 4: REMARKS & FLOOR PLAN ========== */}
            <Grid item xs={12} md={9}>
              {/* Invoice Remarks + REFRESH button like screenshot */}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  <GlobalTextarea
                    label='Invoice Remarks'
                    value={form.invoiceRemarks || ''}
                    onChange={e => setVal('invoiceRemarks', e.target.value)}
                  />
                </Box>
                <GlobalButton
                  variant='contained'
                  size='small'
                  // Align with input field (approx height of standard input or top aligned with margin)
                  sx={{ mt: 1, height: 40 }}
                  onClick={() => showToast('info', 'Invoice remark refreshed')}
                >
                  REFRESH
                </GlobalButton>
              </Box>
            </Grid>

            {/* Moved Invoice Frequency to upper section */}

            <Grid item xs={12} md={7}>
              <GlobalTextarea
                label='Billing Remarks'
                value={form.billingRemarks || ''}
                onChange={e => setVal('billingRemarks', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={5}>
              <Typography variant='body2' sx={{ mb: 1, fontWeight: 500 }}>
                Upload Floor Plan
              </Typography>
              <FileUploaderSingle onFileSelect={handleFileChange} />
              {form.floorPlanName && !form.floorPlanFile && (
                <Typography variant='caption' color='text.secondary' sx={{ mt: 1, display: 'block' }}>
                  Current file: {form.floorPlanName}
                </Typography>
              )}
            </Grid>

            <Grid item xs={12} md={7}>
              <GlobalTextarea
                label='Technician Remarks'
                value={form.techNotes || ''}
                onChange={e => setVal('techNotes', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={5}>
              <GlobalTextarea
                label='Appointment Remarks'
                value={form.appointmentNotes || ''}
                onChange={e => setVal('appointmentNotes', e.target.value)}
              />
            </Grid>

            {/* ========== SECTION 5: AGREEMENTS & VALUE ========== */}
            <Grid item xs={12} md={6}>
              <GlobalTextarea
                label='Agreement Add On 1'
                value={form.agree1 || ''}
                onChange={e => setVal('agree1', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <GlobalTextarea
                label='Agreement Add On 2'
                value={form.agree2 || ''}
                onChange={e => setVal('agree2', e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <Box
                sx={{
                  mt: 3,
                  pt: 2,
                  gap: 2,
                  borderTop: '1px solid #eee',
                  display: 'flex',
                  justifyContent: 'flex-end', // 👈 ALWAYS RIGHT SIDE
                  width: '100%', // 👈 FULL WIDTH
                  pr: 1 // 👈 LITTLE RIGHT PADDING (OPTIONAL)
                }}
              >
                <GlobalButton color='secondary' onClick={handleClose}>
                  Close
                </GlobalButton>

                <GlobalButton variant='contained' onClick={handleSave}>
                  Save
                </GlobalButton>
              </Box>
            </Grid>

            {/* ========== CONTRACT VALUE SECTION WITH INLINE EDIT ICON ========== */}
            <Grid item xs={12} sx={{ mt: 3 }}>
              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant='subtitle1' fontWeight={600}>
                  Contract Value ($)
                </Typography>
                {/* Icon removed from header */}
              </Box>

              {/* Readonly + Clickable Field with proper money format */}
              <GlobalTextField
                value={
                  form.amount
                    ? `$${Number(form.amount).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}`
                    : '$0.00'
                }
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        onClick={e => {
                          e.stopPropagation()
                          toggleValueDrawer()
                        }}
                        edge='end'
                        size='small'
                      >
                        <EditIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                onClick={toggleValueDrawer}
                sx={{
                  width: 300,
                  cursor: 'pointer',
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'grey.50',
                    fontWeight: 600,
                    '&:hover': { bgcolor: 'grey.100' }
                  }
                }}
              />
            </Grid>

            {/* ==================== CONTRACT VALUE DRAWER (MUST BE HERE!) ==================== */}
            <ContractValueDrawer
              open={openValueDrawer}
              onClose={toggleValueDrawer}
              contractId={form.id}
              initialValue={form.amount || ''}
              onValueUpdate={newValue => {
                setVal('amount', newValue)
              }}
            />
          </Grid>
        </Box>
      </Card>
    </Box>
  )
}
