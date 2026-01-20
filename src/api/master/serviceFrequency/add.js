import api from '@/utils/axiosInstance'

export const addServiceFrequency = async payload => {
  const body = {
    name: payload.name || payload.serviceFrequency || '',
    service_frequency: payload.name || payload.serviceFrequency || '', // satisfying the "Please fill service_frequency name" error
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

  console.log('📤 ADD SERVICE FREQUENCY PAYLOAD:', body)

  const { data } = await api.post('servicefrequency-add/', body)
  console.log('📥 ADD SERVICE FREQUENCY RESPONSE:', data)

  return data
}
