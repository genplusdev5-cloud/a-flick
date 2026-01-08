import api from '@/utils/axiosInstance'

export const addTransferRequest = async data => {
  const res = await api.post('transfer_request-add/', data)
  return res.data
}
