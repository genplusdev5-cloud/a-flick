import api from '@/utils/axiosInstance'

export const deleteSlot = async id => {
  const res = await api.patch('slot-delete/', { id })
  return res.data
}
