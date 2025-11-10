import api from '@/utils/axiosInstance'

export const addChecklist = async payload => {
  const res = await api.post('checklist-add/', payload)
  return res.data
}
