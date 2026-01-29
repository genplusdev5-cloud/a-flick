import { useState } from 'react'
import { Grid, Typography, Divider, Button, Box, IconButton } from '@mui/material'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import CustomTextField from '@core/components/mui/TextField'
import { useRouter, useParams } from 'next/navigation'
import { encodeId } from '@/utils/urlEncoder'
import AddCustomerDialog from './AddCustomerDialog'

const Step1DealType = ({
  formData,
  handleChange,
  handleAutocompleteChange,
  handleKeyDown,
  dropdowns, // Ensure dropdowns are passed
  refs
}) => {
  const router = useRouter()
  const { lang } = useParams()

  const [openCustomerDialog, setOpenCustomerDialog] = useState(false)
  const [addedCustomers, setAddedCustomers] = useState([])

  const handleCustomerAdded = newCustomer => {
    // Add to local list to ensure it appears in dropdown immediately
    setAddedCustomers(prev => [...prev, newCustomer])

    // Select the new customer
    // GlobalAutocomplete expects { label, value } or similar object
    // newCustomer should be { label: 'Name', value: 'ID', ... }
    handleAutocompleteChange('customer', newCustomer, refs.customerRef)
  }

  // Merge parent dropdowns with locally added customers
  const customerOptions = [...(dropdowns?.customers || []), ...addedCustomers]

  const requiredFieldSx = {
    '& .MuiFormLabel-asterisk': {
      display: 'none'
    }
  }

  const renderLabel = (label, required = false, showAddIcon = false) => (
    <Box component='span' sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {label}
      {required && (
        <Typography component='span' sx={{ color: '#e91e63', fontWeight: 700, fontSize: '0.75rem', mt: -0.5 }}>
          *
        </Typography>
      )}
      {showAddIcon && !formData.id && (
        <i
          className='tabler-user-plus'
          style={{ cursor: 'pointer', fontSize: '1.2rem', color: '#7367f0', marginLeft: '4px' }}
          onClick={e => {
            e.stopPropagation()
            e.preventDefault()
            setOpenCustomerDialog(true)
          }}
        />
      )}
    </Box>
  )

  return (
    <Grid container spacing={4}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant='h6'>Contract Information</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {formData.id && (
              <Button
                variant='contained'
                color='success'
                size='small'
                startIcon={<i className='tabler-file-export' />}
                onClick={() => {
                  const encodedId = encodeId(formData.id)
                  router.push(`/${lang}/admin/contracts/add?from_proposal=${encodedId}`)
                }}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Convert to Contract
              </Button>
            )}
          </Box>
        </Box>
        <Divider />
      </Grid>

      {/* Origin */}
      <Grid item xs={12} md={3}>
        <GlobalAutocomplete
          label={renderLabel('Origin')}
          options={dropdowns?.origins || []}
          value={formData.originId}
          onChange={v => handleAutocompleteChange('origin', v, refs.originRef)}
          inputRef={refs.originRef}
        />
      </Grid>

      {/* Customer (Moved from Step 2) */}
      <Grid item xs={12} md={3}>
        <GlobalAutocomplete
          label={renderLabel('Customer', true, true)}
          placeholder='Customer'
          options={customerOptions}
          value={formData.customerId}
          onChange={v => handleAutocompleteChange('customer', v, refs.customerRef)}
          inputRef={refs.customerRef}
          required
          sx={requiredFieldSx}
        />
      </Grid>

      {/* Contract Type */}
      <Grid item xs={12} md={3}>
        <GlobalAutocomplete
          label={renderLabel('Contract Type', true)}
          options={['Continuous Contract', 'Limited Contract', 'Continuous Job', 'Job', 'Warranty']}
          value={formData.contractType}
          onChange={v => handleAutocompleteChange('contractType', v, refs.contractTypeRef)}
          inputRef={refs.contractTypeRef}
          required
          sx={requiredFieldSx}
        />
      </Grid>

      <Grid item xs={12} md={3}>
        <CustomTextField
          fullWidth
          label={renderLabel('Business Name', true)}
          name='name'
          placeholder='Business Name'
          value={formData.name || ''}
          onChange={handleChange}
          inputRef={refs.nameRef}
          onKeyDown={e => handleKeyDown(e, refs.nameRef)}
          required
          sx={{ ...requiredFieldSx, '& .MuiInputBase-root': { bgcolor: '#fffde7' } }}
        />
      </Grid>

      {/* --- ROW 3: Billing Info --- */}
      <Grid item xs={12}>
        <Divider sx={{ my: 1 }}> Billing Details </Divider>
      </Grid>

      <Grid item xs={12} md={4}>
        <CustomTextField
          fullWidth
          label={renderLabel('Billing Name')}
          name='billingName'
          value={formData.billingName || ''}
          onChange={handleChange}
          inputRef={refs.billingNameRef}
          onKeyDown={e => handleKeyDown(e, refs.billingNameRef)}
        />
      </Grid>
      <Grid item xs={12} md={8}>
        <CustomTextField
          fullWidth
          label={renderLabel('Billing Address')}
          name='billingAddress'
          value={formData.billingAddress || ''}
          onChange={handleChange}
          inputRef={refs.billingAddressRef}
          onKeyDown={e => handleKeyDown(e, refs.billingAddressRef)}
        />
      </Grid>

      <Grid item xs={12} md={3}>
        <CustomTextField
          fullWidth
          label={renderLabel('Billing Postal Code')}
          name='billingPostalCode'
          value={formData.billingPostalCode || ''}
          onChange={handleChange}
          inputRef={refs.billingPostalCodeRef}
          onKeyDown={e => handleKeyDown(e, refs.billingPostalCodeRef)}
        />
      </Grid>

      <Grid item xs={12} md={3}>
        <CustomTextField
          fullWidth
          label={renderLabel('Cust. Code')}
          name='customerCode'
          value={formData.customerCode || ''}
          onChange={handleChange}
          inputRef={refs.customerCodeRef}
          onKeyDown={e => handleKeyDown(e, refs.customerCodeRef)}
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <CustomTextField
          fullWidth
          label={renderLabel('Group Code')}
          name='groupCode'
          value={formData.groupCode || ''}
          onChange={handleChange}
          inputRef={refs.groupCodeRef}
          onKeyDown={e => handleKeyDown(e, refs.groupCodeRef)}
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <CustomTextField
          fullWidth
          label={renderLabel('Acc. Code')}
          name='accCode'
          value={formData.accCode || ''}
          onChange={handleChange}
          inputRef={refs.accCodeRef}
          onKeyDown={e => handleKeyDown(e, refs.accCodeRef)}
        />
      </Grid>

      {/* PIC Info */}
      <Grid item xs={12}>
        <Divider sx={{ my: 1 }}> PIC Contact Details </Divider>
      </Grid>
      <Grid item xs={12} md={4}>
        <CustomTextField
          fullWidth
          label={renderLabel('PIC Contact Name')}
          name='picContactName'
          value={formData.picContactName || ''}
          onChange={handleChange}
          inputRef={refs.picContactNameRef}
          onKeyDown={e => handleKeyDown(e, refs.picContactNameRef)}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <CustomTextField
          fullWidth
          label={renderLabel('PIC Email')}
          name='picEmail'
          value={formData.picEmail || ''}
          onChange={handleChange}
          inputRef={refs.picEmailRef}
          onKeyDown={e => handleKeyDown(e, refs.picEmailRef)}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <CustomTextField
          fullWidth
          label={renderLabel('PIC Phone')}
          name='picPhone'
          value={formData.picPhone || ''}
          onChange={handleChange}
          inputRef={refs.picPhoneRef}
          onKeyDown={e => handleKeyDown(e, refs.picPhoneRef)}
        />
      </Grid>

      {/* Billing Info */}
      <Grid item xs={12}>
        <Divider sx={{ my: 1 }}> Billing Contact Details </Divider>
      </Grid>
      <Grid item xs={12} md={4}>
        <CustomTextField
          fullWidth
          label={renderLabel('Billing Contact Name')}
          name='billingContactName'
          value={formData.billingContactName || ''}
          onChange={handleChange}
          inputRef={refs.billingContactNameRef}
          onKeyDown={e => handleKeyDown(e, refs.billingContactNameRef)}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <CustomTextField
          fullWidth
          label={renderLabel('Billing Email')}
          name='billingEmail'
          value={formData.billingEmail || ''}
          onChange={handleChange}
          inputRef={refs.billingEmailRef}
          onKeyDown={e => handleKeyDown(e, refs.billingEmailRef)}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <CustomTextField
          fullWidth
          label={renderLabel('Billing Phone')}
          name='billingPhone'
          value={formData.billingPhone || ''}
          onChange={handleChange}
          inputRef={refs.billingPhoneRef}
          onKeyDown={e => handleKeyDown(e, refs.billingPhoneRef)}
        />
      </Grid>

      <AddCustomerDialog
        open={openCustomerDialog}
        onClose={() => setOpenCustomerDialog(false)}
        onCustomerAdded={handleCustomerAdded}
      />
    </Grid>
  )
}

export default Step1DealType
