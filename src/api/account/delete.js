import api from '@/utils/axiosInstance'

export const deleteAccount = async id => {
  const { data } = await api.patch(`account-delete/?id=${id}`)
  return data
}
