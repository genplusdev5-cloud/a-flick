import api from '@/utils/axiosInstance'

export const updateServiceFrequency = async payload => {
  const body = {
    id: payload.id,
    name: payload.serviceFrequency || payload.displayFrequency || '',
    frequency: payload.incrementType || null, // ✅ backend key
    times: payload.noOfIncrements?.toString() || null, // ✅ backend key
    frequency_code: payload.frequencyCode || '',
    frequency_count: payload.noOfIncrements?.toString() || '0',
    backlog_age: payload.backlogAge?.toString() || '0',
    sort_order: payload.sortOrder?.toString() || '0',
    description: payload.description || '',
    is_active: payload.status === 'Active' ? 1 : 0,
    status: 1
  }

  console.log('📤 UPDATE SERVICE FREQUENCY PAYLOAD:', body)

  const { data } = await api.put('servicefrequency-update/', body)
  console.log('📥 UPDATE SERVICE FREQUENCY RESPONSE:', data)

  return data
}
