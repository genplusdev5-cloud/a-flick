'use client'

import { useState, useEffect, useRef } from 'react'
import { Box, Button, Grid, Typography, Card, Autocomplete, IconButton, Divider } from '@mui/material'
import { useRouter, useSearchParams } from 'next/navigation'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { openDB } from 'idb'

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

// IndexedDB helpers
async function getDB() {
  return openDB('customerDB', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('contacts')) {
        db.createObjectStore('contacts', { keyPath: 'id' })
      }
    }
  })
}

async function getCustomerDB() {
  return openDB('mainCustomerDB', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('customers')) {
        db.createObjectStore('customers', { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

export default function AddCustomerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
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

  // Load data on mount
  useEffect(() => {
    ;(async () => {
      const contactsDb = await getDB()
      await contactsDb.clear('contacts')
      setContacts([])

      if (customerId) {
        const idAsNumber = Number(customerId)
        if (isNaN(idAsNumber)) return

        try {
          const mainDb = await getCustomerDB()
          const customerData = await mainDb.get('customers', idAsNumber)

          if (customerData) {
            setEditCustomerId(idAsNumber)
            setFormData({
              ...customerData,
              commenceDate: customerData.commenceDate ? new Date(customerData.commenceDate) : new Date(),
              customerName: customerData.customerName || customerData.name || '',
              loginEmail: customerData.loginEmail || customerData.email || '',
              password: customerData.password || ''
            })

            const loadedContacts = customerData.contacts || []
            setContacts(loadedContacts)
            const tx = contactsDb.transaction('contacts', 'readwrite')
            loadedContacts.forEach(c => tx.objectStore('contacts').put(c))
            await tx.done

            setTimeout(() => companyPrefixRef.current?.querySelector('input')?.focus(), 100)
          } else {
            setEditCustomerId(null)
            setTimeout(() => companyPrefixRef.current?.querySelector('input')?.focus(), 100)
          }
        } catch (error) {
          console.error('Failed to load customer:', error)
          setEditCustomerId(null)
          setTimeout(() => companyPrefixRef.current?.querySelector('input')?.focus(), 100)
        }
      } else {
        setEditCustomerId(null)
        setTimeout(() => companyPrefixRef.current?.querySelector('input')?.focus(), 100)
      }
    })()
  }, [customerId])

  // Sync contacts to temp DB
  useEffect(() => {
    ;(async () => {
      if (!isEditMode && contacts.length === 0) return
      const db = await getDB()
      const tx = db.transaction('contacts', 'readwrite')
      const store = tx.objectStore('contacts')
      await store.clear()
      contacts.forEach(c => store.put(c))
      await tx.done
    })()
  }, [contacts, isEditMode])

  const pageTitle = isEditMode ? 'Edit Customer' : 'Add Customer'

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

  const handleEnterFocus = (e, nextFieldName) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      document.querySelector(`[name="${nextFieldName}"]`)?.focus()
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

  const handleFinalCancel = () => router.push('/admin/customers')

  const handleFinalSave = async () => {
    const customerRecord = {
      ...formData,
      commenceDate: formData.commenceDate?.toISOString() || new Date().toISOString(),
      contracts: formData.companyPrefix,
      status: 'Active',
      contacts: contacts
    }

    if (isEditMode && editCustomerId) {
      customerRecord.id = editCustomerId
    }

    try {
      const db = await getCustomerDB()
      await db.put('customers', customerRecord)

      const contactsDb = await getDB()
      await contactsDb.clear('contacts')

      router.push('/admin/customers')
    } catch (error) {
      console.error('Save failed:', error)
      alert('Error saving customer.')
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
            { label: 'Home', href: '/' },
            { label: 'Customer', href: '/admin/customers' },
            { label: pageTitle }
          ]}
        >
          <Card sx={{ p: 4, boxShadow: 'none' }}>
            <Grid container spacing={4}>
              {/* Origin */}
              {/* Origin */}
              <Grid item xs={12} md={4}>
                <CustomSelectField
                  fullWidth
                  label='Origin'
                  value={formData.origin}
                  onChange={e => setFormData(prev => ({ ...prev, origin: e.target.value }))}
                  options={[
                    { value: 'India', label: 'India' },
                    { value: 'USA', label: 'USA' }
                  ]}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      document.querySelector('[name="companyPrefix"]')?.focus()
                    }
                  }}
                />
              </Grid>

              {/* Commence Date */}
              <Grid item xs={12} md={4}>
                <AppReactDatepicker
                  selected={formData.commenceDate}
                  onChange={date => setFormData(prev => ({ ...prev, commenceDate: date }))}
                  dateFormat='dd/MM/yyyy'
                  customInput={<CustomTextFieldWrapper fullWidth label='Commence Date' />}
                />
              </Grid>

              {/* Company Prefix */}
              <Grid item xs={12} md={4}>
                <CustomTextFieldWrapper
                  ref={companyPrefixRef}
                  fullWidth
                  label='Company Prefix'
                  name='companyPrefix'
                  value={formData.companyPrefix}
                  onChange={handleChange}
                  onKeyDown={e => handleEnterFocus(e, 'customerName')}
                />
              </Grid>

              {/* Customer Name */}
              <Grid item xs={12} md={4}>
                <CustomTextFieldWrapper
                  ref={customerNameRef}
                  fullWidth
                  label='Customer Name'
                  name='customerName'
                  value={formData.customerName}
                  onChange={e => handleTypedChange(e, /^[a-zA-Z\s]*$/, 'customerName')}
                  onKeyDown={e => handleEnterFocus(e, 'abssCustomerName')}
                />
              </Grid>

              {/* ABSS Customer Name */}
              <Grid item xs={12} md={4}>
                <CustomTextFieldWrapper
                  ref={abssCustomerNameRef}
                  fullWidth
                  label='ABSS Customer Name'
                  name='abssCustomerName'
                  value={formData.abssCustomerName}
                  onChange={e => handleTypedChange(e, /^[a-zA-Z\s]*$/, 'abssCustomerName')}
                  onKeyDown={e => handleEnterFocus(e, 'cardId')}
                />
              </Grid>

              {/* Card ID */}
              <Grid item xs={12} md={4}>
                <CustomTextFieldWrapper
                  ref={cardIdRef}
                  fullWidth
                  label='Card ID'
                  name='cardId'
                  value={formData.cardId}
                  onChange={handleChange}
                  onKeyDown={e => handleEnterFocus(e, 'picName')}
                />
              </Grid>

              {/* PIC Name */}
              <Grid item xs={12} md={4}>
                <CustomTextFieldWrapper
                  ref={picNameRef}
                  fullWidth
                  label='PIC Name'
                  name='picName'
                  value={formData.picName}
                  onChange={e => handleTypedChange(e, /^[a-zA-Z\s]*$/, 'picName')}
                  onKeyDown={e => handleEnterFocus(e, 'picEmail')}
                />
              </Grid>

              {/* PIC Email */}
              <Grid item xs={12} md={4}>
                <CustomTextFieldWrapper
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
                />
              </Grid>

              {/* PIC Phone */}
              <Grid item xs={12} md={4}>
                <CustomTextFieldWrapper
                  ref={picPhoneRef}
                  fullWidth
                  label='PIC Phone'
                  name='picPhone'
                  value={formData.picPhone}
                  onChange={e => handlePhoneChange(e, 'picPhone')}
                  onKeyDown={e => handleEnterFocus(e, 'billingName')}
                />
              </Grid>

              {/* Billing Name */}
              <Grid item xs={12} md={4}>
                <CustomTextFieldWrapper
                  ref={billingNameRef}
                  fullWidth
                  label='Billing Contact Name'
                  name='billingName'
                  value={formData.billingName}
                  onChange={e => handleTypedChange(e, /^[a-zA-Z\s]*$/, 'billingName')}
                  onKeyDown={e => handleEnterFocus(e, 'billingEmail')}
                />
              </Grid>

              {/* Billing Email */}
              <Grid item xs={12} md={4}>
                <CustomTextFieldWrapper
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
                />
              </Grid>

              {/* Billing Phone */}
              <Grid item xs={12} md={4}>
                <CustomTextFieldWrapper
                  ref={billingPhoneRef}
                  fullWidth
                  label='Billing Phone'
                  name='billingPhone'
                  value={formData.billingPhone}
                  onChange={e => handlePhoneChange(e, 'billingPhone')}
                  onKeyDown={e => handleEnterFocus(e, 'city')}
                />
              </Grid>

              {/* City */}
              <Grid item xs={12} md={4}>
                <CustomTextFieldWrapper
                  ref={cityRef}
                  fullWidth
                  label='City'
                  name='city'
                  value={formData.city}
                  onChange={e => handleTypedChange(e, /^[a-zA-Z\s]*$/, 'city')}
                  onKeyDown={e => handleEnterFocus(e, 'postalCode')}
                />
              </Grid>

              {/* Postal Code */}
              <Grid item xs={12} md={4}>
                <CustomTextFieldWrapper
                  ref={postalCodeRef}
                  fullWidth
                  label='Postal Code'
                  name='postalCode'
                  value={formData.postalCode}
                  onChange={handleChange}
                  onKeyDown={e => handleEnterFocus(e, 'paymentTerms')}
                />
              </Grid>

              {/* Payment Terms */}
              <Grid item xs={12} md={4}>
                <CustomSelectField
                  ref={paymentTermsRef}
                  fullWidth
                  label='Payment Terms'
                  value={formData.paymentTerms}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))
                    salespersonRef.current?.querySelector('input')?.focus()
                  }}
                  options={['Monthly', 'Yearly'].map(v => ({ value: v, label: v }))}
                />
              </Grid>

              {/* Sales Person */}
              <Grid item xs={12} md={4}>
                <CustomSelectField
                  ref={salespersonRef}
                  fullWidth
                  label='Sales Person'
                  value={formData.salesperson}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, salesperson: e.target.value }))
                    loginEmailRef.current?.querySelector('input')?.focus()
                  }}
                  options={['Employee 1', 'Employee 2'].map(v => ({ value: v, label: v }))}
                />
              </Grid>

              {/* Login Email */}
              <Grid item xs={12} md={4}>
                <CustomTextFieldWrapper
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
                />
              </Grid>

              {/* Password */}
              <Grid item xs={12} md={4}>
                <CustomTextFieldWrapper
                  ref={passwordRef}
                  fullWidth
                  type='password'
                  label='Password'
                  name='password'
                  value={formData.password}
                  onChange={handleChange}
                  onKeyDown={e => handleEnterFocus(e, 'billingAddress')}
                />
              </Grid>

              {/* Billing Address */}
              <Grid item xs={12} md={4}>
                <CustomTextarea
                  ref={billingAddressRef}
                  fullWidth
                  label='Billing Address'
                  name='billingAddress'
                  value={formData.billingAddress}
                  onChange={handleChange}
                  rows={2}
                  onKeyDown={e => handleEnterFocus(e, 'remarks1')}
                />
              </Grid>

              {/* Remarks 1 */}
              <Grid item xs={12} md={4}>
                <CustomTextarea
                  ref={remarks1Ref}
                  fullWidth
                  label='Remarks 1'
                  name='remarks1'
                  value={formData.remarks1}
                  onChange={handleChange}
                  rows={2}
                  onKeyDown={e => handleEnterFocus(e, 'remarks2')}
                />
              </Grid>

              {/* Remarks 2 */}
              <Grid item xs={12} md={4}>
                <CustomTextarea
                  ref={remarks2Ref}
                  fullWidth
                  label='Remarks 2'
                  name='remarks2'
                  value={formData.remarks2}
                  onChange={handleChange}
                  rows={2}
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
                />

                <Box mt={3} display='flex' gap={2}>
                  {editingContact && (
                    <Button variant='outlined' color='secondary' fullWidth onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  )}
                  <Button
                    variant='contained'
                    fullWidth
                    color={editingContact ? 'success' : 'primary'}
                    onClick={handleAddOrUpdateContact}
                    disabled={contactForm.miniEmail && miniEmailError}
                  >
                    {editingContact ? 'Update Member' : 'Add Member'}
                  </Button>
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
                  <Button variant='outlined' onClick={handleFinalCancel}>
                    Cancel
                  </Button>
                  <Button variant='contained' onClick={handleFinalSave}>
                    {isEditMode ? 'Update Customer' : 'Save'}
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </ContentLayout>
      </Grid>
    </Grid>
  )
}
