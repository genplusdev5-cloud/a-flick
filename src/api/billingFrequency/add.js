import api from '@/utils/axiosInstance'

// ✅ Add Billing Frequency (final working version)
export const addBillingFrequency = async payload => {
  // ✅ Use payload.name directly (handleSubmit already builds it correctly)
  const body = {
    name: payload.name || payload.billingFrequency || '',
    billing_frequency: payload.name || payload.billingFrequency || '', // Fallback for backend error messages
    frequency: payload.frequency || payload.incrementType || null,
    times: payload.times?.toString() || payload.noOfIncrements?.toString() || null,
    frequency_code: payload.frequency_code || payload.frequencyCode || '',
    frequency_count: payload.frequency_count || payload.noOfIncrements?.toString() || '0',
    backlog_age: payload.backlog_age || payload.backlogAge?.toString() || '0',
    sort_order: payload.sort_order || payload.sortOrder?.toString() || '0',
    description: payload.description || '',
    is_active: payload.is_active === 1 || payload.is_active === 'Active' || payload.status === 1 ? 1 : 0,
    is_billing: 1,
    status: 1
  }

  console.log('📤 FINAL BILLING FREQUENCY BODY:', body)

  const { data } = await api.post('billingfrequency-add/', body)
  console.log('📥 ADD BILLING FREQUENCY RESPONSE:', data)

  return data
}
