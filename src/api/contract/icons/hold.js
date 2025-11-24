import api from '@/utils/axiosInstance'

export const holdContract = async payload => {
  const res = await api.post('contract-hold/', payload)
  return res.data
}
