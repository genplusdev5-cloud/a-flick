import api from '@/utils/axiosInstance'

export const deleteAction = async id => {
  const res = await api.patch(`action-delete/?id=${id}`)
  return res.data
}
