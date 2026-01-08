import api from '@/utils/axiosInstance'

export const updateTransferRequest = async (id, data) => {
  const res = await api.put(`transfer_request-update/?id=${id}`, data)
  return res.data
}
