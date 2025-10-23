// File Path: /admin/customers/add/page.jsx (Revised Page B with Page A Design)

'use client'

import { useState, useEffect } from 'react'
import { Box, Button, Grid, Typography, Card, Autocomplete, IconButton, Divider } from '@mui/material' // Added Divider
import { useRouter, useSearchParams } from 'next/navigation'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
// import { DataGrid } from '@mui/x-data-grid' // REMOVED: Using manual table from Page A
import { openDB } from 'idb'

import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

// Consistent cell style for text wrapping (From Page A)
const tableCellStyle = {
  padding: '12px',
  wordWrap: 'break-word',
  whiteSpace: 'normal',
  wordBreak: 'break-word',
  overflowWrap: 'break-word'
}

// 🟢 Initial form data (Retained from Page B - includes 'origin', 'cardId', 'abssCustomerName', 'loginEmail', 'password', 'remarks1', 'remarks2')
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

// IndexedDB helper for Customer Contacts (Temporary Store)
async function getDB() {
  return openDB('customerDB', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('contacts')) {
        db.createObjectStore('contacts', { keyPath: 'id' })
      }
    }
  })
}

// IndexedDB helper for Main Customer List (Permanent Storage)
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
  // Renamed from picEmailError to spocEmailError in Page A, but keeping the state name from Page B for logic consistency
  const [picEmailError, setPicEmailError] = useState(false)
  const [billingEmailError, setBillingEmailError] = useState(false)

  const [editCustomerId, setEditCustomerId] = useState(null)
  const isEditMode = editCustomerId !== null

  const [contacts, setContacts] = useState([])
  const [contactForm, setContactForm] = useState({ miniName: '', miniEmail: '', miniPhone: '' })
  const [editingContact, setEditingContact] = useState(null)
  const [miniEmailError, setMiniEmailError] = useState(false)
  const [loginEmailError, setLoginEmailError] = useState('') // Retained from Page B

  // ✅ Core Logic: Load data and setup contacts for Edit Mode (Retained from Page B)
  useEffect(() => {
    ;(async () => {
      // 1. Clear temporary contacts storage on page load
      const contactsDb = await getDB()
      await contactsDb.clear('contacts')
      setContacts([])

      if (customerId) {
        const idAsNumber = Number(customerId)
        if (isNaN(idAsNumber)) return

        try {
          const mainDb = await getCustomerDB()
          // 2. Load existing customer data
          const customerData = await mainDb.get('customers', idAsNumber)

          if (customerData) {
            setEditCustomerId(idAsNumber)

            // Set main form data (Retained from Page B)
            setFormData({
              ...customerData,
              commenceDate: customerData.commenceDate ? new Date(customerData.commenceDate) : new Date(),
              customerName: customerData.customerName || customerData.name || '',
              loginEmail: customerData.loginEmail || customerData.email || '',
              password: customerData.password || ''
            })

            // Set contacts for the mini-table and save them temporarily
            const loadedContacts = customerData.contacts || []
            setContacts(loadedContacts)

            // Save contacts to temporary DB (customerDB)
            const tx = contactsDb.transaction('contacts', 'readwrite')
            loadedContacts.forEach(c => tx.objectStore('contacts').put(c))
            await tx.done
          } else {
            console.warn(`Customer with ID ${customerId} not found. Starting in Add mode.`)
            setEditCustomerId(null)
          }
        } catch (error) {
          console.error('Failed to load customer data for edit:', error)
          setEditCustomerId(null)
        }
      } else {
        // Add Mode
        setEditCustomerId(null)
        setFormData(initialFormData)
      }
    })()
  }, [customerId])

  // Sync temporary contacts DB with local contacts state (rest of the logic - Retained from Page B)
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

  // Phone Change Logic (Retained from Page B)
  const handlePhoneChange = (e, name) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 10) value = value.slice(0, 10)
    if (value.length > 5) value = value.slice(0, 5) + ' ' + value.slice(5)
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Generic Change Handler (Retained from Page B)
  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Custom: Handler for fields with special logic (Retained from Page B)
  const handleTypedChange = (e, regex, name) => {
    const { value } = e.target
    if (regex.test(value)) {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  // Handle Enter Focus (Retained from Page B)
  const handleEnterFocus = (e, nextFieldName) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      document.querySelector(`[name="${nextFieldName}"]`)?.focus()
    }
  }

  // Contact CRUD Logic (Retained from Page B)
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
    if (editingContact && editingContact.id === id) {
      setEditingContact(null)
      setContactForm({ miniName: '', miniEmail: '', miniPhone: '' })
      setMiniEmailError(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingContact(null)
    setContactForm({ miniName: '', miniEmail: '', miniPhone: '' })
    setMiniEmailError(false)
  }

  const handleFinalCancel = () => router.push('/admin/customers')

  // Final Save/Update Logic (Retained from Page B)
  const handleFinalSave = async () => {
    const customerRecord = {
      ...formData,
      commenceDate: formData.commenceDate?.toISOString() || new Date().toISOString(),
      contracts: formData.companyPrefix, // Page B included 'contracts: formData.companyPrefix'
      status: 'Active',
      contacts: contacts
    }

    if (isEditMode && editCustomerId) {
      customerRecord.id = editCustomerId
    }

    try {
      const db = await getCustomerDB()
      await db.put('customers', customerRecord)

      console.log(`✅ Customer ${isEditMode ? 'Updated' : 'Saved'} successfully.`)

      const contactsDb = await getDB()
      await contactsDb.clear('contacts')

      router.push('/admin/customers')
    } catch (error) {
      console.error('Failed to save/update customer:', error)
      alert('Error saving customer data. Check console for details.')
    }
  }

  // Columns adapted for manual table (From Page A, but using data fields from Page B's contact logic)
  const contactManualColumns = [
    { key: 'actions', header: 'Actions', align: 'center', width: '100px', render: r => (
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
    // 🟢 Start Layout from Page A
    <Grid container spacing={4}>
      {/* LEFT SIDE - Customer Details (8 columns) */}
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
            {/* 🟢 Spacing and Fields Retained from Page B, with Page A's spacing={4} */}
            <Grid container spacing={4}>
              {/* Origin (Retained from Page B) */}
              <Grid item xs={12} md={4}>
                <Autocomplete
                  freeSolo={false}
                  options={['India', 'USA']}
                  value={formData.origin || ''}
                  onChange={(e, val) => setFormData(prev => ({ ...prev, origin: val }))}
                  renderInput={params => <CustomTextField {...params} label='Origin' name='origin' />}
                />
              </Grid>

              {/* Commence Date */}
              <Grid item xs={12} md={4}>
                <AppReactDatepicker
                  selected={formData.commenceDate}
                  onChange={date => setFormData(prev => ({ ...prev, commenceDate: date }))}
                  dateFormat='dd/MM/yyyy'
                  customInput={<CustomTextField fullWidth label='Commence Date' />}
                />
              </Grid>

              {/* Company Prefix */}
              <Grid item xs={12} md={4}>
                <CustomTextField
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
                <CustomTextField
                  fullWidth
                  label='Customer Name'
                  name='customerName'
                  value={formData.customerName}
                  onChange={e => handleTypedChange(e, /^[a-zA-Z\s]*$/, 'customerName')}
                  onKeyDown={e => handleEnterFocus(e, 'abssCustomerName')}
                />
              </Grid>

              {/* ABSS Customer Name (Retained from Page B) */}
              <Grid item xs={12} md={4}>
                <CustomTextField
                  fullWidth
                  label='ABSS Customer Name'
                  name='abssCustomerName'
                  value={formData.abssCustomerName}
                  onChange={e => handleTypedChange(e, /^[a-zA-Z\s]*$/, 'abssCustomerName')}
                  onKeyDown={e => handleEnterFocus(e, 'cardId')}
                />
              </Grid>

              {/* Card ID (Retained from Page B) */}
              <Grid item xs={12} md={4}>
                <CustomTextField
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
                <CustomTextField
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
                <CustomTextField
                  fullWidth
                  label='PIC Email'
                  name='picEmail'
                  value={formData.picEmail}
                  onChange={e => {
                    const value = e.target.value
                    setFormData(prev => ({ ...prev, picEmail: value }))
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                    setPicEmailError(value && !emailRegex.test(value))
                  }}
                  error={picEmailError}
                  helperText={picEmailError ? 'Please enter a valid email address' : ''}
                  onKeyDown={e => handleEnterFocus(e, 'picPhone')}
                />
              </Grid>

              {/* PIC Phone */}
              <Grid item xs={12} md={4}>
                <CustomTextField
                  fullWidth
                  label='PIC Phone'
                  name='picPhone'
                  value={formData.picPhone}
                  onChange={e => {
                    let value = e.target.value.replace(/\D/g, '')
                    if (value.length > 10) value = value.slice(0, 10)
                    if (value.length > 5) value = value.slice(0, 5) + ' ' + value.slice(5)
                    setFormData(prev => ({ ...prev, picPhone: value }))
                  }}
                  onKeyDown={e => handleEnterFocus(e, 'billingName')}
                />
              </Grid>

              {/* Billing Contact Name (Page B uses 'billingName') */}
              <Grid item xs={12} md={4}>
                <CustomTextField
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
                <CustomTextField
                  fullWidth
                  label='Billing Email'
                  name='billingEmail'
                  value={formData.billingEmail}
                  onChange={e => {
                    const value = e.target.value
                    setFormData(prev => ({ ...prev, billingEmail: value }))
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                    setBillingEmailError(value && !emailRegex.test(value))
                  }}
                  error={billingEmailError}
                  helperText={billingEmailError ? 'Please enter a valid email address' : ''}
                  onKeyDown={e => handleEnterFocus(e, 'billingPhone')}
                />
              </Grid>

              {/* Billing Phone */}
              <Grid item xs={12} md={4}>
                <CustomTextField
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
                <CustomTextField
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
                <CustomTextField
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
                <Autocomplete
                  freeSolo={false}
                  options={['Monthly', 'Yearly']}
                  value={formData.paymentTerms || ''}
                  onChange={(e, newValue) => {
                    setFormData(prev => ({ ...prev, paymentTerms: newValue }))
                    document.querySelector('[name="salesperson"]')?.focus()
                  }}
                  openOnFocus
                  renderInput={params => <CustomTextField {...params} label='Payment Terms' name='paymentTerms' />}
                />
              </Grid>

              {/* Sales Person */}
              <Grid item xs={12} md={4}>
                <Autocomplete
                  freeSolo={false}
                  options={['Employee 1', 'Employee 2']}
                  value={formData.salesperson || ''}
                  onChange={(e, newValue) => {
                    setFormData(prev => ({ ...prev, salesperson: newValue }))
                    document.querySelector('[name="loginEmail"]')?.focus()
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      document.querySelector('[name="loginEmail"]')?.focus()
                    }
                  }}
                  openOnFocus
                  renderInput={params => <CustomTextField {...params} label='Sales Person' name='salesperson' />}
                />
              </Grid>

              {/* Login Email (Retained from Page B) */}
              <Grid item xs={12} md={4}>
                <CustomTextField
                  fullWidth
                  label='Login Email'
                  name='loginEmail'
                  value={formData.loginEmail}
                  onChange={e => {
                    const value = e.target.value
                    setFormData(prev => ({ ...prev, loginEmail: value }))
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                    setLoginEmailError(value && !emailRegex.test(value) ? 'Invalid email address' : '')
                  }}
                  onKeyDown={e => handleEnterFocus(e, 'password')}
                  error={!!loginEmailError}
                  helperText={loginEmailError}
                />
              </Grid>

              {/* Password (Retained from Page B) */}
              <Grid item xs={12} md={4}>
                <CustomTextField
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
                <CustomTextField
                  fullWidth
                  multiline
                  rows={2}
                  label='Billing Address'
                  name='billingAddress'
                  value={formData.billingAddress}
                  onChange={handleChange}
                  onKeyDown={e => handleEnterFocus(e, 'remarks1')}
                />
              </Grid>

              {/* Remarks 1 (Retained from Page B) */}
              <Grid item xs={12} md={4}>
                <CustomTextField
                  fullWidth
                  multiline
                  rows={2}
                  label='Remarks 1'
                  name='remarks1'
                  value={formData.remarks1}
                  onChange={handleChange}
                  onKeyDown={e => handleEnterFocus(e, 'remarks2')}
                />
              </Grid>

              {/* Remarks 2 (Retained from Page B) */}
              <Grid item xs={12} md={4}>
                <CustomTextField
                  fullWidth
                  multiline
                  rows={2}
                  label='Remarks 2'
                  name='remarks2'
                  value={formData.remarks2}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </Card>
        </ContentLayout>
      </Grid>

      {/* -------------------- RIGHT SIDE - Customer Team (4 columns, ContentLayout from Page A) -------------------- */}
      <Grid item xs={12} md={4} sx={{ mt: 5 }}> {/* Added mt: 5 from Page A */}
        <ContentLayout
          title={<Box sx={{ m: 2 }}>Customer Contact</Box>}
        >
          <Grid container spacing={1}>
            <Grid item xs={12} md={12}>
              <Box sx={{ p: 4 }}> {/* Inner padding for contact form/list */}

                {/* Contact Form Fields (Retained from Page B) */}
                <CustomTextField
                  fullWidth
                  label={<span>Name <span style={{ color: 'red' }}>*</span></span>}
                  name='miniName'
                  value={contactForm.miniName}
                  onChange={e => setContactForm(prev => ({ ...prev, miniName: e.target.value }))}
                />
                <Box mt={3} />
                <CustomTextField
                  fullWidth
                  label='Email'
                  name='miniEmail'
                  value={contactForm.miniEmail}
                  onChange={e => {
                    const value = e.target.value
                    setContactForm(prev => ({ ...prev, miniEmail: value }))
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                    setMiniEmailError(value ? !emailRegex.test(value) : false)
                  }}
                  error={miniEmailError}
                  helperText={miniEmailError ? 'Invalid email' : ''}
                />
                <Box mt={3} />
                <CustomTextField
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

                {/* Contact Buttons */}
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

                {/* Team List Header (From Page A) */}
                <Typography variant='h6' sx={{ mt: 5, p: 2 }}>
                  Customer Contact List
                </Typography>

                {/* 🔴 MANUAL HTML TABLE FROM PAGE A DESIGN (Replacing DataGrid from Page B) */}
                <Box sx={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      tableLayout: 'auto'
                    }}
                  >
                    <thead>
                      <tr style={{ textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>
                        {contactManualColumns.map(col => (
                          <th
                            key={col.key}
                            style={{
                              padding: '12px',
                              width: col.width || 'auto',
                              minWidth: col.minWidth || '100px',
                              userSelect: 'none',
                              textAlign: col.align || 'left'
                            }}
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
                            <td key={col.key} style={{ ...tableCellStyle, textAlign: col.align || 'left' }}>
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
                {/* END MANUAL HTML TABLE */}

                <Divider sx={{ mt: 4 }} />

                {/* Final Buttons (Moved to follow the table, like in Page A) */}
                <Box mt={2} p={2} display='flex' gap={2} justifyContent='flex-end'>
                  <Button variant='outlined' onClick={handleFinalCancel}>Cancel</Button>
                  <Button variant='contained' onClick={handleFinalSave}>{isEditMode ? 'Update Customer' : 'Save'}</Button>
                </Box>

              </Box> {/* End of Box with inner padding */}
            </Grid>
          </Grid>
        </ContentLayout>
      </Grid>
    </Grid>
  )
}
