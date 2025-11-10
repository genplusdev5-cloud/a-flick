import api from '@/utils/axiosInstance'

export const addContractApi = async payload => {
  const res = await api.post('contract-add/', payload)
  return res.data
}
