import api from '@/utils/axiosInstance'

export const updateChecklist = async payload => {
  const res = await api.put(`checklist-update/?id=${payload.id}`, payload)
  return res.data
}

