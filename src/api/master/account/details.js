import api from '@/utils/axiosInstance'

export const getAccountDetails = async id => {
  const { data } = await api.get(`account-details/?id=${id}`)
  return data
}
