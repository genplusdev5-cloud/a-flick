// File Path: /admin/customers/add/page.jsx (Page B/C - Add/Edit Form)

'use client'

import { useState, useEffect } from 'react'
import { Box, Button, Grid, Typography, Card, Autocomplete, IconButton, Divider } from '@mui/material'
import { useRouter, useSearchParams } from 'next/navigation'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
// Removed: import { DataGrid } from '@mui/x-data-grid'
import { openDB } from 'idb'

import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

// Consistent cell style for text wrapping (Copied from Page A)
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
  picName: '', // Page A uses 'spocName'
  picEmail: '', // Page A uses 'spocEmail'
  picPhone: '', // Page A uses 'spocPhone'
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

// ✅ FIX: The component now accepts `params` from the dynamic route segment
export default function AddCustomerPage({ params }) {
  const router = useRouter()

  // For dynamic route: ID comes from params (e.g., /123/edit -> params.id is '123')
  const customerIdFromPath = params?.id

  // For query parameter fallback (e.g., /add?id=123)
  const searchParams = useSearchParams()
  const customerIdFromQuery = searchParams.get('id')

  // Determine the final ID. Prioritize path ID for the requested edit flow.
  const customerId = customerIdFromPath || customerIdFromQuery

  const [formData, setFormData] = useState(initialFormData)
  const [picEmailError, setPicEmailError] = useState(false)
  const [billingEmailError, setBillingEmailError] = useState(false)

  const [editCustomerId, setEditCustomerId] = useState(null)
  const isEditMode = editCustomerId !== null

  const [contacts, setContacts] = useState([])
  const [contactForm, setContactForm] = useState({ miniName: '', miniEmail: '', miniPhone: '' })
  const [editingContact, setEditingContact] = useState(null)
  const [miniEmailError, setMiniEmailError] = useState(false)

  // Core Logic: Load data and setup contacts for Edit Mode
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

            // Set main form data (retaining field names from Page B)
            setFormData({
              ...initialFormData, // Use initialFormData to ensure all fields are present
              ...customerData,
              commenceDate: customerData.commenceDate ? new Date(customerData.commenceDate) : new Date(),
              customerName: customerData.customerName || customerData.name || '',
              loginEmail: customerData.loginEmail || customerData.email || '',
              password: customerData.password || '',
              // Ensure PIC/SPOC fields are loaded correctly
              picName: customerData.picName || customerData.spocName || '',
              picEmail: customerData.picEmail || customerData.spocEmail || '',
              picPhone: customerData.picPhone || customerData.spocPhone || ''
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
  }, [customerId]) // Dependency changed to the resolved ID

  // Sync temporary contacts DB with local contacts state
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
    // Removed the second slice(0, 5) which was inconsistent in Page A's implementation
    if (value.length > 5) value = value.slice(0, 5) + ' ' + value.slice(5)
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Not strictly needed for Page A's layout, but keeping the function.
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

  // Final Save/Update Logic: Saves to main IndexedDB
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

  // Manual Table Columns (Copied from Page A)
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
      {/* LEFT SIDE - Customer Details (md=8) */}
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
            {/* Using spacing={4} like Page A */}
            <Grid container spacing={4}>
              {/* Row 1 */}
              <Grid item xs={12} md={4}>
                <Autocomplete
                  freeSolo={false}
                  options={['India', 'USA']}
                  value={formData.origin || ''}
                  onChange={(e, val) => setFormData(prev => ({ ...prev, origin: val }))}
                  renderInput={params => <CustomTextField {...params} label='Origin' name='origin' />}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <AppReactDatepicker
                  selected={formData.commenceDate}
                  onChange={date => setFormData(prev => ({ ...prev, commenceDate: date }))}
                  dateFormat='dd/MM/yyyy'
                  customInput={<CustomTextField fullWidth label='Commence Date' />}
                />
              </Grid>

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
              {/* Row 2 */}
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
              {/* Row 3 - PIC Details (Note: Page B uses PIC, Page A uses SPOC) */}
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
                  onChange={e => handlePhoneChange(e, 'picPhone')}
                  onKeyDown={e => handleEnterFocus(e, 'billingName')}
                />
              </Grid>

              {/* Row 4 - Billing Details */}
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

              {/* Row 5 - Location/Terms */}
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
                  renderInput={params => <CustomTextField {...params} label='Payment Terms' name='paymentTerms' />}
                />
              </Grid>

              {/* Row 6 - Sales/Login */}
              <Grid item xs={12} md={4}>
                <Autocomplete
                  freeSolo={false}
                  options={['Employee 1', 'Employee 2']}
                  value={formData.salesperson || ''}
                  onChange={(e, newValue) => {
                    setFormData(prev => ({ ...prev, salesperson: newValue }))
                    document.querySelector('[name="loginEmail"]')?.focus()
                  }}
                  renderInput={params => <CustomTextField {...params} label='Sales Person' name='salesperson' />}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <CustomTextField
                  fullWidth
                  label='Login Email'
                  name='loginEmail'
                  value={formData.loginEmail}
                  onChange={handleChange}
                  onKeyDown={e => handleEnterFocus(e, 'password')}
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
              {/* Row 7 - Billing Address */}
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
              {/* Remarks 1 */}
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
              {/* Remarks 2 */}
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

      {/* RIGHT SIDE - Customer Team (md=4) */}
      <Grid item xs={12} md={4} sx={{ mt: { md: 5, xs: 0 } }}> {/* Added margin-top for alignment on desktop */}
        <ContentLayout title={<Box sx={{ m: 2 }}>Customer Contacts</Box>}>
          <Grid container spacing={1}>
            <Grid item xs={12} md={12}>
              {/* Contact Add/Edit Form */}
              <Card sx={{ p: 2, boxShadow: 'none' }} elevation={0}>
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
                    const val = e.target.value
                    setContactForm(prev => ({ ...prev, miniEmail: val }))
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                    setMiniEmailError(val ? !emailRegex.test(val) : false)
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
                <Box mt={3} display='flex' gap={2}>
                  {editingContact && (
                    <Button variant='outlined' color='secondary' fullWidth onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  )}
                  <Button variant='contained' fullWidth color={editingContact ? 'success' : 'primary'} onClick={handleAddOrUpdateContact}>
                    {editingContact ? 'Update Member' : 'Add Member'}
                  </Button>
                </Box>
              </Card>

              {/* Contact List Table (Manual table from Page A) */}
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
                            style={{
                              padding: '12px',
                              width: col.width || 'auto',
                              minWidth: col.minWidth || '100px',
                              userSelect: 'none',
                              textAlign: col.align || 'left'
                            }}
                          >
                            <Box display='flex' alignItems='center'>{col.header}</Box>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.map(r => (
                        <tr key={r.id}>
                          {contactManualColumns.map(col => (
                            <td key={col.key} style={{ ...tableCellStyle, textAlign: col.align || 'left' }}>
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
                  <Button variant='outlined' onClick={handleFinalCancel}>Cancel</Button>
                  <Button variant='contained' onClick={handleFinalSave}>{isEditMode ? 'Update Customer' : 'Save'}</Button>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </ContentLayout>
      </Grid>
    </Grid>
  )
}
