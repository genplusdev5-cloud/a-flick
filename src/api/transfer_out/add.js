import api from '@/utils/axiosInstance'

export const addTransferOut = async payload => {
  const res = await api.post('transfer_out-add/', payload)
  return res.data
}
