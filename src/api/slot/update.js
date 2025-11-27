import api from '@/utils/axiosInstance'

export const updateSlot = async (id, payload) => {
  const res = await api.put('slot-update/', payload, {
    params: { id }
  })
  return res.data
}
