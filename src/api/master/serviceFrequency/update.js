import api from '@/utils/axiosInstance'

export const updateServiceFrequency = async payload => {
  const body = {
    id: payload.id,
    name: payload.name || payload.serviceFrequency || '',
    service_frequency: payload.name || payload.serviceFrequency || '',
    frequency: payload.frequency || payload.incrementType || null,
    times: payload.times?.toString() || payload.noOfIncrements?.toString() || null,
    frequency_code: payload.frequency_code || payload.frequencyCode || '',
    frequency_count: payload.frequency_count || payload.noOfIncrements?.toString() || '0',
    backlog_age: payload.backlog_age || payload.backlogAge?.toString() || '0',
    sort_order: payload.sort_order || payload.sortOrder?.toString() || '0',
    description: payload.description || '',
    is_active: payload.status === 1 || payload.status === 'Active' ? 1 : 0,
    status: 1
  }

  console.log('📤 UPDATE SERVICE FREQUENCY PAYLOAD:', body)

  // ⭐ ID added in query params
  const { data } = await api.put(`servicefrequency-update/?id=${payload.id}`, body)

  console.log('📥 UPDATE SERVICE FREQUENCY RESPONSE:', data)
  return data
}
