import api from '@/utils/axiosInstance'

export const addSlot = async data => {
  return api.post('slot-add/', data)
}
