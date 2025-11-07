import api from '@/utils/axiosInstance'

// ✅ Add Billing Frequency (final working version)
export const addBillingFrequency = async payload => {
  // ✅ Use payload.name directly (handleSubmit already builds it correctly)
  const body = {
    name: payload.name || '', // ✅ correct key
    frequency: payload.frequency || null,
    times: payload.times || null,
    frequency_code: payload.frequency_code || '',
    frequency_count: payload.frequency_count || '0',
    backlog_age: payload.backlog_age || '0',
    sort_order: payload.sort_order || '0',
    description: payload.description || '',
    is_active: payload.is_active || 1,
    is_billing: 1, // ✅ important flag
    status: 1
  }

  console.log('📤 FINAL BILLING FREQUENCY BODY:', body)

  const { data } = await api.post('billingfrequency-add/', body)
  console.log('📥 ADD BILLING FREQUENCY RESPONSE:', data)

  return data
}
