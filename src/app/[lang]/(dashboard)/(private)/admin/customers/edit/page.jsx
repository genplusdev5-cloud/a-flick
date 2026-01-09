'use client'

import { getCustomerDetails, updateCustomer, deleteCustomerContact } from '@/api/customer'
import { getCustomerOrigin } from '@/api/customer/origin'
import { getAllDropdowns } from '@/api/contract/dropdowns'
import { getAllEmployees } from '@/api/employee'

import { useState, useEffect, useRef } from 'react'
import { Box, Button, Grid, Typography, Card, IconButton, Divider } from '@mui/material'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { showToast } from '@/components/common/Toasts'

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

const tableCellStyle = {
  padding: '12px',
  wordWrap: 'break-word',
  whiteSpace: 'normal',
  wordBreak: 'break-word',
  overflowWrap: 'break-word'
}

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

export default function EditCustomerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // decode base64 ID

  let customerId = null
  const encodedId = searchParams.get('id')

  if (encodedId) {
    try {
      customerId = Number(atob(encodedId)) // IMPORTANT → convert to number
    } catch (err) {
      console.error('Invalid encoded ID')
    }
  }

  const [formData, setFormData] = useState(initialFormData)
  const [picEmailError, setPicEmailError] = useState(false)
  const [billingEmailError, setBillingEmailError] = useState(false)
  const [editCustomerId, setEditCustomerId] = useState(null)
  const [contacts, setContacts] = useState([])
  const [contactForm, setContactForm] = useState({ miniName: '', miniEmail: '', miniPhone: '' })
  const [editingContact, setEditingContact] = useState(null)
  const [miniEmailError, setMiniEmailError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [originMap, setOriginMap] = useState({})
  const [originOptions, setOriginOptions] = useState([])

  const [dropdowns, setDropdowns] = useState({
    employees: [],
    industries: []
  })

  // REFS FOR FOCUS
  const originRef = useRef(null)
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

  useEffect(() => {
    const loadOrigins = async () => {
      try {
        const [originRes, dropData, empData] = await Promise.all([
          getCustomerOrigin(),
          getAllDropdowns(),
          getAllEmployees()
        ])

        const list = originRes?.data || []
        const map = {}
        const options = list.map(o => {
          map[o.id] = o.name
          return { value: o.id, label: o.name }
        })

        setOriginMap(map)
        setOriginOptions(options)

        setDropdowns({
          employees: empData.map(e => ({ label: e.name, value: e.id })),
          industries: dropData.industries || []
        })
      } catch (err) {
        console.error('Dropdown load failed', err)
      }
    }

    loadOrigins()
  }, [])

  // Load Customer Data (ONLY EDIT MODE)
  useEffect(() => {
    if (!customerId) {
      setNotFound(true)
      setLoading(false)
      return
    }

    const loadCustomer = async () => {
      try {
        setLoading(true)

        const res = await getCustomerDetails(customerId)
        const data = res?.data || res?.data?.data || res || {}

        if (!data.id) {
          setNotFound(true)
          return
        }

        setEditCustomerId(data.id)

        setFormData({
          origin: data.company_id || '',
          commenceDate: data.commence_date ? new Date(data.commence_date) : new Date(),
          companyPrefix: data.prefix || '',
          customerName: data.name || '',
          cardId: data.customer_code || '',
          abssCustomerName: data.business_name || '',
          picName: data.pic_contact_name || '',
          picEmail: data.pic_email || '',
          picPhone: data.pic_phone || '',
          billingName: data.billing_contact_name || '',
          billingEmail: data.billing_email || '',
          billingPhone: data.billing_phone || '',
          city: data.city || '',
          postalCode: data.postal_code || '',
          paymentTerms: data.payment_term || '',
          salesperson: data.sales_person_id || '',
          billingAddress: data.billing_address || '',
          loginEmail: data.email || '',
          password: data.password || '',
          remarks1: data.short_description || '',
          remarks2: data.description || ''
        })

        setContacts(
          (data.contact || []).map(c => ({
            id: c.id,
            miniName: c.name || '',
            miniEmail: c.email || '',
            miniPhone: c.phone || ''
          }))
        )
        setTimeout(() => originRef.current?.focus(), 200)
      } catch (err) {
        console.error(err)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    loadCustomer()
  }, [customerId])

  const pageTitle = 'Edit Customer'

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

  const handleEnterFocus = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      nextRef.current?.focus()
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

  const handleDeleteContact = async id => {
    try {
      const res = await deleteCustomerContact(id)

      if (res.status === 'success') {
        showToast('delete', 'Contact deleted successfully')
        setContacts(prev => prev.filter(c => c.id !== id))
      } else {
        showToast('error', res.message || 'Failed to delete contact')
      }
    } catch (err) {
      console.error(err)
      showToast('error', 'Delete failed')
    }
  }

  const handleCancelEdit = () => {
    setEditingContact(null)
    setContactForm({ miniName: '', miniEmail: '', miniPhone: '' })
    setMiniEmailError(false)
  }

  const handleFinalCancel = () => router.push('/admin/customers')

  const handleFinalSave = async () => {
    if (saving) return
    setSaving(true)
    const formatDate = d => (d ? new Date(d).toISOString().split('T')[0] : null)

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
      postal_code: formData.postalCode,
      payment_term: formData.paymentTerms || null,
      sales_person_id: formData.salesperson ? Number(formData.salesperson) : null,
      billing_address: formData.billingAddress,
      email: formData.loginEmail,
      password: formData.password,
      short_description: formData.remarks1,
      description: formData.remarks2,
      contact_update: contacts.map(c => {
        const contactObj = {
          customer_id: editCustomerId,
          name: c.miniName,
          email: c.miniEmail,
          phone: c.miniPhone ? c.miniPhone.replace(/\D/g, '') : ''
        }
        // Include ID if it's a valid DB ID and not a timestamp (Max Int32)
        if (c.id && c.id < 2147483647) {
          contactObj.id = c.id
        }
        return contactObj
      })
    }

    try {
      const res = await updateCustomer({ id: editCustomerId, ...payload })

      if (res.status === 'success') {
        showToast('success', 'Customer updated successfully')
        setTimeout(() => router.push('/admin/customers'), 600)
      } else {
        showToast('error', res.message || 'Update failed')
      }
    } catch (err) {
      console.error(err)
      showToast('error', 'Error saving customer')
    } finally {
      setSaving(false)
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

  if (loading) {
    return (
      <ContentLayout title='Loading...'>
        <Box display='flex' justifyContent='center' p={4}>
          <Typography>Loading customer data...</Typography>
        </Box>
      </ContentLayout>
    )
  }

  if (notFound) {
    return (
      <ContentLayout title='Customer Not Found'>
        <Box display='flex' justifyContent='center' p={4}>
          <Typography color='error'>Customer with ID {customerId} not found.</Typography>
        </Box>
      </ContentLayout>
    )
  }

  return (
    <Grid container spacing={4}>
      {/* LEFT: Customer Details */}
      <Grid item xs={12} md={8}>
        <ContentLayout
          title={<Box sx={{ m: 2 }}>Update Customer Details</Box>}
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Customer', href: '/admin/customers' },
            { label: 'Update Customer' }
          ]}
        >
          <Card sx={{ p: 4, boxShadow: 'none' }}>
            <Grid container spacing={4}>
              {/* Origin */}
              <Grid item xs={12} md={4}>
                <GlobalAutocomplete
                  ref={originRef}
                  fullWidth
                  label='Origin'
                  value={originOptions.find(o => o.value === formData.origin) || null}
                  onChange={option => setFormData(prev => ({ ...prev, origin: option?.value || '' }))}
                  options={originOptions}
                />
              </Grid>

              {/* Commence Date */}
              <Grid item xs={12} md={4}>
                <AppReactDatepicker
                  selected={formData.commenceDate}
                  onChange={date => setFormData(prev => ({ ...prev, commenceDate: date }))}
                  dateFormat='dd/MM/yyyy'
                  customInput={<GlobalTextField fullWidth label='Commence Date' />}
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
                  onKeyDown={e => handleEnterFocus(e, customerNameRef)}
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
                  onKeyDown={e => handleEnterFocus(e, abssCustomerNameRef)}
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
                  onKeyDown={e => handleEnterFocus(e, cardIdRef)}
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
                  onKeyDown={e => handleEnterFocus(e, picNameRef)}
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
                  onKeyDown={e => handleEnterFocus(e, picEmailRef)}
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
                    const val = e.target.value
                    setFormData(prev => ({ ...prev, picEmail: val }))
                    setPicEmailError(val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
                  }}
                  error={picEmailError}
                  helperText={picEmailError ? 'Invalid email' : ''}
                  onKeyDown={e => handleEnterFocus(e, picPhoneRef)}
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
                  onKeyDown={e => handleEnterFocus(e, billingNameRef)}
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
                  onKeyDown={e => handleEnterFocus(e, billingEmailRef)}
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
                    const val = e.target.value
                    setFormData(prev => ({ ...prev, billingEmail: val }))
                    setBillingEmailError(val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
                  }}
                  error={billingEmailError}
                  helperText={billingEmailError ? 'Invalid email' : ''}
                  onKeyDown={e => handleEnterFocus(e, billingPhoneRef)}
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
                  onKeyDown={e => handleEnterFocus(e, cityRef)}
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
                  onKeyDown={e => handleEnterFocus(e, postalCodeRef)}
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
                  onKeyDown={e => handleEnterFocus(e, paymentTermsRef)}
                />
              </Grid>

              {/* Payment Terms */}
              <Grid item xs={12} md={4}>
                <GlobalAutocomplete
                  ref={paymentTermsRef}
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
                  onChange={opt => setFormData(prev => ({ ...prev, paymentTerms: opt?.value || '' }))}
                />
              </Grid>

              {/* Sales Person */}
              <Grid item xs={12} md={4}>
                <GlobalAutocomplete
                  ref={salespersonRef}
                  fullWidth
                  label='Sales Person'
                  value={dropdowns.employees.find(e => e.value === formData.salesperson) || null}
                  options={dropdowns.employees}
                  onChange={opt => {
                    setFormData(prev => ({ ...prev, salesperson: opt?.value || '' }))
                    loginEmailRef.current?.querySelector('input')?.focus()
                  }}
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
                  onChange={handleChange}
                  onKeyDown={e => handleEnterFocus(e, passwordRef)}
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
                  onKeyDown={e => handleEnterFocus(e, billingAddressRef)}
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
                  rows={3}
                  onKeyDown={e => handleEnterFocus(e, remarks1Ref)}
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
                  rows={3}
                  onKeyDown={e => handleEnterFocus(e, remarks2Ref)}
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
                  rows={3}
                />
              </Grid>
            </Grid>
          </Card>
        </ContentLayout>
      </Grid>

      {/* RIGHT: Customer Contacts */}
      <Grid item xs={12} md={4} sx={{ mt: { md: 5, xs: 0 } }}>
        <ContentLayout title={<Box sx={{ m: 2 }}>Customer Contacts</Box>}>
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Card sx={{ p: 2, boxShadow: 'none' }} elevation={0}>
                <GlobalTextField
                  fullWidth
                  label={
                    <span>
                      Name <span style={{ color: 'red' }}>*</span>
                    </span>
                  }
                  name='miniName'
                  value={contactForm.miniName}
                  onChange={e => setContactForm(prev => ({ ...prev, miniName: e.target.value }))}
                />
                <Box mt={3} />
                <GlobalTextField
                  fullWidth
                  label='Email'
                  name='miniEmail'
                  value={contactForm.miniEmail}
                  onChange={e => {
                    const val = e.target.value
                    setContactForm(prev => ({ ...prev, miniEmail: val }))
                    setMiniEmailError(val ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) : false)
                  }}
                  error={miniEmailError}
                  helperText={miniEmailError ? 'Invalid email' : ''}
                />
                <Box mt={3} />
                <GlobalTextField
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
                />

                <Box mt={3} display='flex' gap={2}>
                  {editingContact && (
                    <GlobalButton color='secondary' fullWidth onClick={handleCancelEdit}>
                      Cancel
                    </GlobalButton>
                  )}
                  <GlobalButton
                    variant='contained'
                    fullWidth
                    color={editingContact ? 'success' : 'primary'}
                    onClick={handleAddOrUpdateContact}
                    disabled={contactForm.miniEmail && miniEmailError}
                  >
                    {editingContact ? 'Update Member' : 'Add Member'}
                  </GlobalButton>
                </Box>
              </Card>

              <Card sx={{ mt: 4, p: 2, boxShadow: 'none' }} elevation={0}>
                <Typography variant='h6' sx={{ mt: 1, mb: 2 }}>
                  Team List
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
                      {contacts.map(r => (
                        <tr key={r.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                          {contactManualColumns.map(col => (
                            <td key={col.key} style={{ ...tableCellStyle, textAlign: col.align }}>
                              {col.render(r)}
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
                  <GlobalButton color='secondary' onClick={handleFinalCancel} disabled={saving}>
                    Cancel
                  </GlobalButton>
                  <GlobalButton variant='contained' onClick={handleFinalSave} disabled={saving}>
                    {saving ? 'Updating...' : 'Update Customer'}
                  </GlobalButton>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </ContentLayout>
      </Grid>
    </Grid>
  )
}
