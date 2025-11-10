import api from '@/utils/axiosInstance'

export const getContractDetails = async id => {
  const res = await api.get(`contract-details/?id=${id}`)
  return res.data
}
