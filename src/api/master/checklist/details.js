import api from '@/utils/axiosInstance'

export const getChecklistDetails = async id => {
  const res = await api.get(`checklist-details/?id=${id}`)
  return res.data
}
