import api from '@/utils/axiosInstance'

export const deleteFinding = async id => {
  const res = await api.patch(`findings-delete/?id=${id}`)
  return res.data
}
