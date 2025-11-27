import api from '@/utils/axiosInstance'

export const getSlotDetails = async id => {
  const res = await api.get('slot-details/', {
    params: { id }
  })
  return res.data
}
