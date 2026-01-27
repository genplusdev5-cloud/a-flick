'use client'

import { addCustomer } from '@/api/customer_group/customer'
import { getCustomerOrigin } from '@/api/customer_group/customer/origin'
import { useState, useEffect, useRef } from 'react'
import { Box, Button, Grid, Typography, Card, Autocomplete, IconButton, Divider } from '@mui/material'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'

import { getAllDropdowns } from '@/api/contract_group/contract/dropdowns'
import { getAllEmployees } from '@/api/employee'
import { showToast } from '@/components/common/Toasts'

// 🔥 Global UI Components (use everywhere)
import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import GlobalTextarea from '@/components/common/GlobalTextarea'
import GlobalSelect from '@/components/common/GlobalSelect'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'

import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextFieldWrapper from '@/components/common/CustomTextField'
import CustomTextarea from '@/components/common/CustomTextarea'
import CustomSelectField from '@/components/common/CustomSelectField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

// Table cell style (from Page A)
const tableCellStyle = {
  padding: '12px',
  wordWrap: 'break-word',
  whiteSpace: 'normal',
  wordBreak: 'break-word',
  overflowWrap: 'break-word'
}

// Initial form data
const initialFormData = {
  origin: '',
  commenceDate: new Date(),
  companyPrefix: '',
  customerName: '',
  cardId: '',
  abssCustomerName: '',
  picName: '',
  picEmail: '',
  picPhone: '',
  billingName: '',
  billingEmail: '',
  billingPhone: '',
  city: '',
  postalCode: '',
  paymentTerms: '',
  salesperson: '',
  billingAddress: '',
  password: '',
  loginEmail: '',
  remarks1: '',
  remarks2: ''
}

export default function AddCustomerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { lang } = useParams()
  const customerId = searchParams.get('id')

  const [formData, setFormData] = useState(initialFormData)
  const [picEmailError, setPicEmailError] = useState(false)
  const [billingEmailError, setBillingEmailError] = useState(false)
  const [editCustomerId, setEditCustomerId] = useState(null)
  const isEditMode = editCustomerId !== null

  const [contacts, setContacts] = useState([])
  const [contactForm, setContactForm] = useState({ miniName: '', miniEmail: '', miniPhone: '' })
  const [editingContact, setEditingContact] = useState(null)
  const [miniEmailError, setMiniEmailError] = useState(false)
  const [loginEmailError, setLoginEmailError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // REFS FOR FOCUS
  const companyPrefixRef = useRef(null)
  const customerNameRef = useRef(null)
  const abssCustomerNameRef = useRef(null)
  const cardIdRef = useRef(null)
  const picNameRef = useRef(null)
  const picEmailRef = useRef(null)
  const picPhoneRef = useRef(null)
  const billingNameRef = useRef(null)
  const billingEmailRef = useRef(null)
  const billingPhoneRef = useRef(null)
  const cityRef = useRef(null)
  const postalCodeRef = useRef(null)
  const paymentTermsRef = useRef(null)
  const salespersonRef = useRef(null)
  const loginEmailRef = useRef(null)
  const passwordRef = useRef(null)
  const billingAddressRef = useRef(null)
  const remarks1Ref = useRef(null)
  const remarks2Ref = useRef(null)

  const [originOptions, setOriginOptions] = useState([])

  // ===============================
  // 🔥 LOAD ALL DROPDOWNS IN ONE CALL
  // ===============================
  const [dropdowns, setDropdowns] = useState({
    employees: [],
    customers: [],
    industries: [],
    callTypes: [],
    billingFreq: [],
    serviceFreq: [],
    pests: [],
    chemicals: [],
    uom: [],
    supplier: []
  })

  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [dropData, empData] = await Promise.all([getAllDropdowns(), getAllEmployees()])

        setDropdowns(prev => ({
          ...prev,
          employees: empData.map(e => ({ label: e.name, value: e.id })),
          industries: dropData.industries || []
        }))
      } catch (error) {
        console.error('Dropdown load error:', error)
      }
    }

    loadDropdowns()
  }, [])

  useEffect(() => {
    const loadOrigins = async () => {
      try {
        const res = await getCustomerOrigin()
        const list = res?.data || []

        const formatted = list.map(item => ({
          value: item.id,
          label: item.name
        }))

        setOriginOptions(formatted)
      } catch (err) {
        console.error('Origin load failed', err)
        setOriginOptions([])
      }
    }

    loadOrigins()
  }, [])

  const pageTitle = isEditMode ? 'Edit Customer' : 'Add Customer'

  // ⭐ Pink Star Styling
  const requiredFieldSx = {
    '& .MuiFormLabel-asterisk': {
      color: '#e91e63 !important',
      fontWeight: 700
    },
    '& .MuiInputLabel-root.Mui-required': {
      color: 'inherit'
    }
  }

  // Handlers
  const handlePhoneChange = (e, name) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 10) value = value.slice(0, 10)
    if (value.length > 5) value = value.slice(0, 5) + ' ' + value.slice(5)
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleTypedChange = (e, regex, name) => {
    const { value } = e.target
    if (regex.test(value)) {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleEnterFocus = (e, nextId) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const nextEl = document.getElementsByName(nextId)[0] || document.getElementById(nextId)
      nextEl?.focus()
    }
  }

  const handleAddOrUpdateContact = () => {
    if (!contactForm.miniName) return

    if (contactForm.miniEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(contactForm.miniEmail)) {
        setMiniEmailError(true)
        return
      }
    }

    const newContact = {
      id: editingContact ? editingContact.id : Date.now(),
      miniName: contactForm.miniName,
      miniEmail: contactForm.miniEmail,
      miniPhone: contactForm.miniPhone
    }

    if (editingContact) {
      setContacts(prev => prev.map(c => (c.id === editingContact.id ? newContact : c)))
    } else {
      setContacts(prev => [...prev, newContact])
    }

    setContactForm({ miniName: '', miniEmail: '', miniPhone: '' })
    setEditingContact(null)
    setMiniEmailError(false)
  }

  const handleEditContact = contact => {
    setContactForm(contact)
    setEditingContact(contact)
    setMiniEmailError(false)
  }

  const handleDeleteContact = id => {
    setContacts(prev => prev.filter(c => c.id !== id))
    if (editingContact?.id === id) {
      setEditingContact(null)
      setContactForm({ miniName: '', miniEmail: '', miniPhone: '' })
    }
  }

  const handleCancelEdit = () => {
    setEditingContact(null)
    setContactForm({ miniName: '', miniEmail: '', miniPhone: '' })
    setMiniEmailError(false)
  }

  const handleFinalCancel = () => router.push(`/${lang}/admin/customers`)

  const handleFinalSave = async () => {
    // 🔍 Validate all fields
    const requiredFields = [
      'origin',
      'commenceDate',
      'companyPrefix',
      'customerName',
      'abssCustomerName',
      'cardId',
      'picName',
      'picEmail',
      'picPhone',
      'billingName',
      'billingEmail',
      'billingPhone',
      'city',
      'postalCode',
      'paymentTerms',
      'salesperson',
      'loginEmail',
      'password',
      'billingAddress'
    ]

    for (const f of requiredFields) {
      if (!formData[f]) {
        showToast('warning', `Please fill ${f.replace(/([A-Z])/g, ' $1').toLowerCase()}`)
        return
      }
    }

    if (picEmailError || billingEmailError || loginEmailError) {
      showToast('warning', 'Please fix email errors')
      return
    }

    if (isSaving) return
    setIsSaving(true)
    const formatDate = d => d.toISOString().split('T')[0]

    const payload = {
      name: formData.customerName,
      business_name: formData.abssCustomerName,
      customer_code: formData.cardId,
      company_id: Number(formData.origin),
      prefix: formData.companyPrefix,
      commence_date: formatDate(formData.commenceDate),
      pic_contact_name: formData.picName,
      pic_email: formData.picEmail,
      pic_phone: formData.picPhone ? formData.picPhone.replace(/\D/g, '') : '',
      billing_contact_name: formData.billingName,
      billing_email: formData.billingEmail,
      billing_phone: formData.billingPhone ? formData.billingPhone.replace(/\D/g, '') : '',
      city: formData.city,
      state: formData.state || '',
      postal_code: formData.postalCode,
      payment_term: formData.paymentTerms || null,
      sales_person_id: formData.salesperson ? Number(formData.salesperson) : null,
      billing_address: formData.billingAddress,
      email: formData.loginEmail,
      password: formData.password,
      short_description: formData.remarks1,
      description: formData.remarks2,
      contact: contacts.map(c => ({
        name: c.miniName,
        email: c.miniEmail,
        phone: c.miniPhone ? c.miniPhone.replace(/\D/g, '') : ''
      }))
    }

    try {
      const res = await addCustomer(payload)

      if (res.status === 'success') {
        showToast('success', 'Customer added successfully')
        setTimeout(() => router.push(`/${lang}/admin/customers`), 600)
      } else {
        showToast('error', res.message || 'Failed to create customer')
      }
    } catch (err) {
      console.error(err)
      showToast('error', 'Error creating customer')
    } finally {
      setIsSaving(false)
    }
  }
  const contactManualColumns = [
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      width: '100px',
      render: r => (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
          <IconButton size='small' onClick={() => handleDeleteContact(r.id)}>
            <DeleteIcon sx={{ color: 'red', fontSize: 18 }} />
          </IconButton>
          <IconButton size='small' onClick={() => handleEditContact(r)}>
            <EditIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      )
    },
    { key: 'miniName', header: 'Name', align: 'left', render: r => r.miniName || '-' },
    { key: 'miniEmail', header: 'Email', align: 'left', render: r => r.miniEmail || '-' },
    { key: 'miniPhone', header: 'Phone', align: 'left', render: r => r.miniPhone || '-' }
  ]

  return (
    <Grid container spacing={4}>
      {/* LEFT: Customer Details */}
      <Grid item xs={12} md={8}>
        <ContentLayout
          title={<Box sx={{ m: 2 }}>{pageTitle} Details</Box>}
          breadcrumbs={[
            { label: 'Home', href: `/${lang}` },
            { label: 'Customer', href: `/${lang}/admin/customers` },
            { label: pageTitle }
          ]}
        >
          <Card sx={{ p: 4, boxShadow: 'none' }}>
            <Grid container spacing={4}>
              {/* Origin */}

              <Grid item xs={12} md={4}>
                <GlobalAutocomplete
                  fullWidth
                  label='Origin'
                  value={originOptions.find(o => o.value === formData.origin) || null}
                  options={originOptions}
                  onChange={newValue =>
                    setFormData(prev => ({
                      ...prev,
                      origin: newValue?.value ?? ''
                    }))
                  }
                  required
                  sx={requiredFieldSx}
                />
              </Grid>

              {/* Commence Date */}
              <Grid item xs={12} md={4}>
                <AppReactDatepicker
                  selected={formData.commenceDate}
                  onChange={date => setFormData(prev => ({ ...prev, commenceDate: date }))}
                  dateFormat='dd/MM/yyyy'
                  customInput={<GlobalTextField fullWidth label='Commence Date' required sx={requiredFieldSx} />}
                />
              </Grid>

              {/* Company Prefix */}
              <Grid item xs={12} md={4}>
                <GlobalTextField
                  ref={companyPrefixRef}
                  fullWidth
                  label='Company Prefix'
                  name='companyPrefix'
                  value={formData.companyPrefix}
                  onChange={handleChange}
                  onKeyDown={e => handleEnterFocus(e, 'customerName')}
                  required
                  sx={requiredFieldSx}
                />
              </Grid>

              {/* Customer Name */}
              <Grid item xs={12} md={4}>
                <GlobalTextField
                  ref={customerNameRef}
                  fullWidth
                  label='Customer Name'
                  name='customerName'
                  value={formData.customerName}
                  onChange={e => handleTypedChange(e, /^[a-zA-Z\s]*$/, 'customerName')}
                  onKeyDown={e => handleEnterFocus(e, 'abssCustomerName')}
                  required
                  sx={requiredFieldSx}
                />
              </Grid>

              {/* ABSS Customer Name */}
              <Grid item xs={12} md={4}>
                <GlobalTextField
                  ref={abssCustomerNameRef}
                  fullWidth
                  label='ABSS Customer Name'
                  name='abssCustomerName'
                  value={formData.abssCustomerName}
                  onChange={e => handleTypedChange(e, /^[a-zA-Z\s]*$/, 'abssCustomerName')}
                  onKeyDown={e => handleEnterFocus(e, 'cardId')}
                  required
                  sx={requiredFieldSx}
                />
              </Grid>

              {/* Card ID */}
              <Grid item xs={12} md={4}>
                <GlobalTextField
                  ref={cardIdRef}
                  fullWidth
                  label='Card ID'
                  name='cardId'
                  value={formData.cardId}
                  onChange={handleChange}
                  onKeyDown={e => handleEnterFocus(e, 'picName')}
                  required
                  sx={requiredFieldSx}
                />
              </Grid>

              {/* PIC Name */}
              <Grid item xs={12} md={4}>
                <GlobalTextField
                  ref={picNameRef}
                  fullWidth
                  label='PIC Name'
                  name='picName'
                  value={formData.picName}
                  onChange={e => handleTypedChange(e, /^[a-zA-Z\s]*$/, 'picName')}
                  onKeyDown={e => handleEnterFocus(e, 'picEmail')}
                  required
                  sx={requiredFieldSx}
                />
              </Grid>

              {/* PIC Email */}
              <Grid item xs={12} md={4}>
                <GlobalTextField
                  ref={picEmailRef}
                  fullWidth
                  label='PIC Email'
                  name='picEmail'
                  value={formData.picEmail}
                  onChange={e => {
                    const value = e.target.value
                    setFormData(prev => ({ ...prev, picEmail: value }))
                    setPicEmailError(value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
                  }}
                  error={picEmailError}
                  helperText={picEmailError ? 'Invalid email' : ''}
                  onKeyDown={e => handleEnterFocus(e, 'picPhone')}
                  required
                  sx={requiredFieldSx}
                />
              </Grid>

              {/* PIC Phone */}
              <Grid item xs={12} md={4}>
                <GlobalTextField
                  ref={picPhoneRef}
                  fullWidth
                  label='PIC Phone'
                  name='picPhone'
                  value={formData.picPhone}
                  onChange={e => handlePhoneChange(e, 'picPhone')}
                  onKeyDown={e => handleEnterFocus(e, 'billingName')}
                  required
                  sx={requiredFieldSx}
                />
              </Grid>

              {/* Billing Name */}
              <Grid item xs={12} md={4}>
                <GlobalTextField
                  ref={billingNameRef}
                  fullWidth
                  label='Billing Contact Name'
                  name='billingName'
                  value={formData.billingName}
                  onChange={e => handleTypedChange(e, /^[a-zA-Z\s]*$/, 'billingName')}
                  onKeyDown={e => handleEnterFocus(e, 'billingEmail')}
                  required
                  sx={requiredFieldSx}
                />
              </Grid>

              {/* Billing Email */}
              <Grid item xs={12} md={4}>
                <GlobalTextField
                  ref={billingEmailRef}
                  fullWidth
                  label='Billing Email'
                  name='billingEmail'
                  value={formData.billingEmail}
                  onChange={e => {
                    const value = e.target.value
                    setFormData(prev => ({ ...prev, billingEmail: value }))
                    setBillingEmailError(value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
                  }}
                  error={billingEmailError}
                  helperText={billingEmailError ? 'Invalid email' : ''}
                  onKeyDown={e => handleEnterFocus(e, 'billingPhone')}
                  required
                  sx={requiredFieldSx}
                />
              </Grid>

              {/* Billing Phone */}
              <Grid item xs={12} md={4}>
                <GlobalTextField
                  ref={billingPhoneRef}
                  fullWidth
                  label='Billing Phone'
                  name='billingPhone'
                  value={formData.billingPhone}
                  onChange={e => handlePhoneChange(e, 'billingPhone')}
                  onKeyDown={e => handleEnterFocus(e, 'city')}
                  required
                  sx={requiredFieldSx}
                />
              </Grid>

              {/* City */}
              <Grid item xs={12} md={4}>
                <GlobalTextField
                  ref={cityRef}
                  fullWidth
                  label='City'
                  name='city'
                  value={formData.city}
                  onChange={e => handleTypedChange(e, /^[a-zA-Z\s]*$/, 'city')}
                  onKeyDown={e => handleEnterFocus(e, 'postalCode')}
                  required
                  sx={requiredFieldSx}
                />
              </Grid>

              {/* Postal Code */}
              <Grid item xs={12} md={4}>
                <GlobalTextField
                  ref={postalCodeRef}
                  fullWidth
                  label='Postal Code'
                  name='postalCode'
                  value={formData.postalCode}
                  onChange={handleChange}
                  onKeyDown={e => handleEnterFocus(e, 'paymentTerms')}
                  required
                  sx={requiredFieldSx}
                />
              </Grid>

              {/* Payment Terms */}
              <Grid item xs={12} md={4}>
                <GlobalAutocomplete
                  fullWidth
                  label='Payment Terms'
                  value={
                    [
                      { value: 'Monthly', label: 'Monthly' },
                      { value: 'Yearly', label: 'Yearly' }
                    ].find(o => o.value === formData.paymentTerms) || null
                  }
                  options={[
                    { value: 'Monthly', label: 'Monthly' },
                    { value: 'Yearly', label: 'Yearly' }
                  ]}
                  onChange={option => setFormData(prev => ({ ...prev, paymentTerms: option?.value || '' }))}
                  required
                  sx={requiredFieldSx}
                />
              </Grid>

              {/* Sales Person */}
              <Grid item xs={12} md={4}>
                <GlobalAutocomplete
                  fullWidth
                  label='Sales Person'
                  value={dropdowns.employees.find(e => e.value === formData.salesperson) || null}
                  options={dropdowns.employees}
                  onChange={option => setFormData(prev => ({ ...prev, salesperson: option?.value || '' }))}
                  required
                  sx={requiredFieldSx}
                />
              </Grid>

              {/* Login Email */}
              <Grid item xs={12} md={4}>
                <GlobalTextField
                  ref={loginEmailRef}
                  fullWidth
                  label='Login Email'
                  name='loginEmail'
                  value={formData.loginEmail}
                  onChange={e => {
                    const value = e.target.value
                    setFormData(prev => ({ ...prev, loginEmail: value }))
                    setLoginEmailError(value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Invalid email' : '')
                  }}
                  error={!!loginEmailError}
                  helperText={loginEmailError}
                  onKeyDown={e => handleEnterFocus(e, 'password')}
                  required
                  sx={requiredFieldSx}
                />
              </Grid>

              {/* Password */}
              <Grid item xs={12} md={4}>
                <GlobalTextField
                  ref={passwordRef}
                  fullWidth
                  type='password'
                  label='Password'
                  name='password'
                  value={formData.password}
                  onChange={handleChange}
                  onKeyDown={e => handleEnterFocus(e, 'billingAddress')}
                  required
                  sx={requiredFieldSx}
                />
              </Grid>

              {/* Billing Address */}
              <Grid item xs={12} md={4}>
                <GlobalTextarea
                  ref={billingAddressRef}
                  fullWidth
                  label='Billing Address'
                  name='billingAddress'
                  value={formData.billingAddress}
                  onChange={handleChange}
                  rows={2}
                  onKeyDown={e => handleEnterFocus(e, 'remarks1')}
                  required
                  sx={requiredFieldSx}
                />
              </Grid>

              {/* Remarks 1 */}
              <Grid item xs={12} md={4}>
                <GlobalTextarea
                  ref={remarks1Ref}
                  fullWidth
                  label='Remarks 1'
                  name='remarks1'
                  value={formData.remarks1}
                  onChange={handleChange}
                  rows={2}
                  onKeyDown={e => handleEnterFocus(e, 'remarks2')}
                  required
                  sx={requiredFieldSx}
                />
              </Grid>

              {/* Remarks 2 */}
              <Grid item xs={12} md={4}>
                <GlobalTextarea
                  ref={remarks2Ref}
                  fullWidth
                  label='Remarks 2'
                  name='remarks2'
                  value={formData.remarks2}
                  onChange={handleChange}
                  rows={2}
                  required
                  sx={requiredFieldSx}
                />
              </Grid>
            </Grid>
          </Card>
        </ContentLayout>
      </Grid>

      {/* RIGHT: Customer Contact */}
      <Grid item xs={12} md={4} sx={{ mt: 5 }}>
        <ContentLayout title={<Box sx={{ m: 2 }}>Customer Contact</Box>}>
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Box sx={{ p: 4 }}>
                {/* Contact Form */}
                <CustomTextFieldWrapper
                  fullWidth
                  label='Name'
                  name='miniName'
                  value={contactForm.miniName}
                  onChange={e => setContactForm(prev => ({ ...prev, miniName: e.target.value }))}
                  required
                  sx={requiredFieldSx}
                />
                <Box mt={3} />
                <CustomTextFieldWrapper
                  fullWidth
                  label='Email'
                  name='miniEmail'
                  value={contactForm.miniEmail}
                  onChange={e => {
                    const value = e.target.value
                    setContactForm(prev => ({ ...prev, miniEmail: value }))
                    setMiniEmailError(value ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) : false)
                  }}
                  error={miniEmailError}
                  helperText={miniEmailError ? 'Invalid email' : ''}
                  required
                  sx={requiredFieldSx}
                />
                <Box mt={3} />
                <CustomTextFieldWrapper
                  fullWidth
                  label='Phone'
                  name='miniPhone'
                  value={contactForm.miniPhone}
                  onChange={e => {
                    let v = e.target.value.replace(/\D/g, '')
                    if (v.length > 10) v = v.slice(0, 10)
                    if (v.length > 5) v = v.slice(0, 5) + ' ' + v.slice(5)
                    setContactForm(prev => ({ ...prev, miniPhone: v }))
                  }}
                  required
                  sx={requiredFieldSx}
                />

                <Box mt={3} display='flex' gap={2}>
                  {editingContact && (
                    <GlobalButton  color='secondary' fullWidth onClick={handleCancelEdit}>
                      Cancel
                    </GlobalButton>
                  )}
                  <GlobalButton
                    variant='contained'
                    fullWidth
                    color={editingContact ? 'success' : 'primary'}
                    onClick={handleAddOrUpdateContact}
                    disabled={(contactForm.miniEmail && miniEmailError) || !contactForm.miniName || !contactForm.miniEmail || !contactForm.miniPhone}
                  >
                    {editingContact ? 'Update Member' : 'Add Member'}
                  </GlobalButton>
                </Box>

                <Typography variant='h6' sx={{ mt: 5, p: 2 }}>
                  Customer Contact List
                </Typography>

                <Box sx={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>
                        {contactManualColumns.map(col => (
                          <th
                            key={col.key}
                            style={{ padding: '12px', width: col.width || 'auto', textAlign: col.align }}
                          >
                            <Box display='flex' alignItems='center'>
                              {col.header}
                            </Box>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.map((r, i) => (
                        <tr key={r.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                          {contactManualColumns.map(col => (
                            <td key={col.key} style={{ ...tableCellStyle, textAlign: col.align }}>
                              {col.render(r, i)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {contacts.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color='text.secondary'>No team members added</Typography>
                    </Box>
                  )}
                </Box>

                <Divider sx={{ mt: 4 }} />
                <Box mt={2} p={2} display='flex' gap={2} justifyContent='flex-end'>
                  <GlobalButton color='secondary' onClick={handleFinalCancel}>
                    Cancel
                  </GlobalButton>
                  <GlobalButton variant='contained' onClick={handleFinalSave} disabled={isSaving}>
                    {isEditMode ? 'Update Customer' : 'Save'}
                  </GlobalButton>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </ContentLayout>
      </Grid>
    </Grid>
  )
}
