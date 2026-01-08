import api from '@/utils/axiosInstance'

export const getTransferInList = async params => {
  const res = await api.get('transfer_in-list/', { params })
  return res.data
}
