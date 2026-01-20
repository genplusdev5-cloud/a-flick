import api from '@/utils/axiosInstance'

export const deletePest = async id => {

  const res = await api.patch(`pest-delete/?id=${id}`, {})
  return res.data
}
