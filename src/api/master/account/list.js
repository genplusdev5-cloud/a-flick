import api from '@/utils/axiosInstance'

export const getAccountList = async () => {
  const { data } = await api.get('account-list/')
  return data
}
