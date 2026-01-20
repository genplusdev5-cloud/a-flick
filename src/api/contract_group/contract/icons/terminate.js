import api from '@/utils/axiosInstance'

export const terminateContract = async payload => {
  const res = await api.post('contract-terminate/', payload)
  return res.data
}
