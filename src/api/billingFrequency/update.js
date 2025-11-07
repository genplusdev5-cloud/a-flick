import api from '@/utils/axiosInstance'

// ✅ Fully working update Billing Frequency API
export const updateBillingFrequency = async payload => {
  if (!payload.id) throw new Error('BillingFrequency ID is required')

  const body = {
    name: payload.name || payload.billingFrequency || '',
    frequency: payload.frequency || payload.incrementType || '',
    times: payload.times || payload.noOfIncrements?.toString() || '0',
    frequency_code: payload.frequency_code || payload.frequencyCode || '',
    frequency_count: payload.frequency_count || payload.noOfIncrements?.toString() || '0',
    backlog_age: payload.backlog_age || payload.backlogAge?.toString() || '0',
    sort_order: payload.sort_order || payload.sortOrder?.toString() || '0',
    description: payload.description || '',
    is_active: payload.is_active ?? (payload.status === 'Active' ? 1 : 0),
    is_billing: 1,
    status: 1
  }

  console.log('📤 UPDATE BILLING FREQUENCY BODY:', body)

  // ✅ Send ID in query param (important)
  const { data } = await api.put(`billingfrequency-update/?id=${payload.id}`, body)

  console.log('📥 UPDATE BILLING FREQUENCY RESPONSE:', data)
  return data
}
