import api from '@/utils/axiosInstance'

export const renewContract = async payload => {
  const res = await api.post('contract-renew/', payload)
  return res.data
}
