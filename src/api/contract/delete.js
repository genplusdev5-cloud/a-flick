import api from '@/utils/axiosInstance'

export const deleteContractApi = async id => {
  const res = await api.patch('contract-delete/', { id })
  return res.data
}
