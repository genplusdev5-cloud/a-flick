import api from '@/utils/axiosInstance'

export const deleteSlot = async id => {
  return await api.patch(`slot-delete/?id=${id}`)
}
