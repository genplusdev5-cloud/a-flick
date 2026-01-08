import api from '@/utils/axiosInstance'

export const getTransferRequestList = async params => {
  const res = await api.get('transfer_request-list/', { params })
  return res.data
}
