// File Path: /admin/customers/add/page.jsx (Page B - Add/Edit Form)

'use client'

import { useState, useEffect } from 'react'
import { Box, Button, Grid, Typography, Card, Autocomplete, IconButton } from '@mui/material'
import { useRouter, useSearchParams } from 'next/navigation' // 👈 Using useSearchParams to read ?id=
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { DataGrid } from '@mui/x-data-grid'
import { openDB } from 'idb'

import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

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
  // 🔴 Reads ID from query parameters, e.g., /add?id=123
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

  // ✅ Core Logic: Load data and setup contacts for Edit Mode
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

            // Set main form data
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

  // Sync temporary contacts DB with local contacts state (rest of the logic)
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

  const handleEnterFocus = (e, nextFieldName) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      document.querySelector(`[name="${nextFieldName}"]`)?.focus()
    }
  }

  const handleAddOrUpdateContact = () => {
    // ✅ Only require Name
    if (!contactForm.miniName) return

    // Optional: Validate email only if filled
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

  // ✅ Final Save/Update Logic: Saves to main IndexedDB
  const handleFinalSave = async () => {
    // 1. Prepare the complete customer object
    const customerRecord = {
      ...formData,
      commenceDate: formData.commenceDate?.toISOString() || new Date().toISOString(),
      contracts: formData.companyPrefix,
      status: 'Active',
      contacts: contacts // Include the multiple contacts array
    }

    if (isEditMode && editCustomerId) {
      customerRecord.id = editCustomerId // Retain existing ID for update
    }

    try {
      const db = await getCustomerDB()

      // IndexedDB .put() handles both add (if no id or id is new) and update (if id exists)
      await db.put('customers', customerRecord)

      console.log(`✅ Customer ${isEditMode ? 'Updated' : 'Saved'} successfully.`)

      // Clear the temporary contacts list
      const contactsDb = await getDB()
      await contactsDb.clear('contacts')

      // Navigate back to the list page (Page A)
      router.push('/admin/customers')
    } catch (error) {
      console.error('Failed to save/update customer:', error)
      alert('Error saving customer data. Check console for details.')
    }
  }

  const contactColumns = [
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.4,
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, width: '100%', border: 'none' }}>
          <IconButton size='small' onClick={() => handleDeleteContact(params.row.id)}>
            <DeleteIcon sx={{ color: 'red', fontSize: 18 }} />
          </IconButton>
          <IconButton size='small' onClick={() => handleEditContact(params.row)}>
            <EditIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      )
    },
    {
      field: 'miniName',
      headerName: 'Name',
      flex: 1,
      renderCell: params => (
        <Box sx={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.5, border: 'none' }}>
          {params.value}
        </Box>
      )
    },
    {
      field: 'miniEmail',
      headerName: 'Email',
      flex: 1,
      renderCell: params => (
        <Box sx={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.5, border: 'none' }}>
          {params.value}
        </Box>
      )
    },
    {
      field: 'miniPhone',
      headerName: 'Phone',
      flex: 0.8,
      renderCell: params => (
        <Box sx={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.5, border: 'none' }}>
          {params.value}
        </Box>
      )
    }
  ]

  return (
    <ContentLayout
      title={<Box sx={{ m: 2 }}>{pageTitle}</Box>}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Customer', href: '/admin/customers' },
        { label: pageTitle }
      ]}
    >
      <Grid container spacing={2}>
        {/* LEFT BIG FORM */}
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 4, boxShadow: 'none' }} elevation={0}>
            <Grid container spacing={6}>
              {/* Origin */}
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
              <Grid item xs={12} md={4}>
                <CustomTextField
                  fullWidth
                  label='Customer Name'
                  name='customerName'
                  value={formData.customerName}
                  onChange={e => {
                    const value = e.target.value
                    if (/^[a-zA-Z\s]*$/.test(value)) setFormData(prev => ({ ...prev, customerName: value }))
                  }}
                  onKeyDown={e => handleEnterFocus(e, 'abssCustomerName')}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <CustomTextField
                  fullWidth
                  label='ABSS Customer Name'
                  name='abssCustomerName'
                  value={formData.abssCustomerName}
                  onChange={e => {
                    const value = e.target.value
                    if (/^[a-zA-Z\s]*$/.test(value)) setFormData(prev => ({ ...prev, abssCustomerName: value }))
                  }}
                  onKeyDown={e => handleEnterFocus(e, 'cardId')}
                />
              </Grid>
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
              <Grid item xs={12} md={4}>
                <CustomTextField
                  fullWidth
                  label='PIC Name'
                  name='picName'
                  value={formData.picName}
                  onChange={e => {
                    const value = e.target.value
                    if (/^[a-zA-Z\s]*$/.test(value)) setFormData(prev => ({ ...prev, picName: value }))
                  }}
                  onKeyDown={e => handleEnterFocus(e, 'picEmail')}
                />
              </Grid>

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

              <Grid item xs={12} md={4}>
                <CustomTextField
                  fullWidth
                  label='PIC Phone'
                  name='picPhone'
                  value={formData.picPhone}
                  onChange={e => {
                    let value = e.target.value
                    // Remove non-digits
                    value = value.replace(/\D/g, '')

                    // Limit to 10 digits
                    if (value.length > 10) value = value.slice(0, 10)

                    // Insert space after 5 digits
                    if (value.length > 5) {
                      value = value.slice(0, 5) + ' ' + value.slice(5)
                    }

                    setFormData(prev => ({ ...prev, picPhone: value }))
                  }}
                  onKeyDown={e => handleEnterFocus(e, 'billingName')}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <CustomTextField
                  fullWidth
                  label='Billing Contact Name'
                  name='billingName'
                  value={formData.billingName}
                  onChange={e => {
                    const value = e.target.value
                    if (/^[a-zA-Z\s]*$/.test(value)) setFormData(prev => ({ ...prev, billingName: value }))
                  }}
                  onKeyDown={e => handleEnterFocus(e, 'billingEmail')}
                />
              </Grid>

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
              <Grid item xs={12} md={4}>
                <CustomTextField
                  fullWidth
                  label='City'
                  name='city'
                  value={formData.city}
                  onChange={e => {
                    const value = e.target.value
                    if (/^[a-zA-Z\s]*$/.test(value)) setFormData(prev => ({ ...prev, city: value }))
                  }}
                  onKeyDown={e => handleEnterFocus(e, 'postalCode')}
                />
              </Grid>
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

              <Grid item xs={12} md={4}>
                <Autocomplete
                  freeSolo={false}
                  options={['Employee 1', 'Employee 2']}
                  value={formData.salesperson || ''}
                  onChange={(e, newValue) => {
                    setFormData(prev => ({ ...prev, salesperson: newValue }))
                    // Move focus to next field (Login Email)
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
        </Grid>

        {/* RIGHT SIDE CONTACT MANAGEMENT */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 4, boxShadow: 'none' }} elevation={0}>
            <Typography variant='h6' mb={4} align='center'>
              Customer Contacts
            </Typography>

            {/* Name Field (Required) */}
            <CustomTextField
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
            <Box mt={4} />

            {/* Email Field */}
            <CustomTextField
              fullWidth
              label='Email'
              name='miniEmail'
              value={contactForm.miniEmail}
              onChange={e => {
                const value = e.target.value
                setContactForm(prev => ({ ...prev, miniEmail: value }))

                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                // If email is not empty, validate it
                setMiniEmailError(value ? !emailRegex.test(value) : false)
              }}
              error={miniEmailError}
              helperText={miniEmailError ? 'Please enter a valid email address' : ''}
            />
            <Box mt={4} />

            {/* Phone Field */}
            <CustomTextField
              fullWidth
              label='Phone'
              name='miniPhone'
              value={contactForm.miniPhone}
              onChange={e => {
                let value = e.target.value.replace(/\D/g, '')
                if (value.length > 10) value = value.slice(0, 10)
                if (value.length > 5) value = value.slice(0, 5) + ' ' + value.slice(5)
                setContactForm(prev => ({ ...prev, miniPhone: value }))
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
                color={editingContact ? 'success' : 'primary'}
                fullWidth
                onClick={handleAddOrUpdateContact}
                // Only disable if email is entered and invalid
                disabled={contactForm.miniEmail && miniEmailError}
              >
                {editingContact ? 'Update Contact' : 'Add Contact'}
              </Button>
            </Box>
          </Card>

          <Card sx={{ mt: 4, p: 2, boxShadow: 'none' }} elevation={0}>
            <Typography variant='h6' sx={{ mb: 2 }}>
              Customer Contacts List
            </Typography>

            <DataGrid
              rows={contacts}
              columns={contactColumns}
              getRowId={row => row.id}
              autoHeight
              disableRowSelectionOnClick
              hideFooter
              getRowHeight={() => 'auto'}
              sx={{
                border: 'none', // Remove outer table border
                '& .MuiDataGrid-columnHeaders': {
                  borderBottom: 'none',
                  borderTop: 'none'
                },
                '& .MuiDataGrid-columnHeader, & .MuiDataGrid-cell': {
                  border: 'none',
                  outline: 'none',
                  '&:focus': { outline: 'none' }
                },
                '& .MuiDataGrid-row': {
                  borderBottom: 'none', // Remove default row bottom border
                  borderTop: '1px solid #ccc', // Add 1px top border
                  '&:hover': { backgroundColor: 'transparent' } // Optional: remove hover effect
                }
              }}
            />

            <Box mt={4} display='flex' gap={2} justifyContent='flex-end'>
              <Button variant='outlined' onClick={handleFinalCancel}>
                Cancel
              </Button>
              <Button variant='contained' onClick={handleFinalSave}>
                {isEditMode ? 'Update Customer' : 'Save'}
              </Button>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </ContentLayout>
  )
}
