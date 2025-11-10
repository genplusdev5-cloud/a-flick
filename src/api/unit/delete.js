import api from '@/utils/axiosInstance'

export const deleteUnit = async id => {
  const res = await api.patch(`unit-delete/?id=${id}`)
  return res.data
}
