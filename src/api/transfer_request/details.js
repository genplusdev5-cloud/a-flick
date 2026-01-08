import api from '@/utils/axiosInstance'

// TM Details
export const getTransferRequestDetailsTM = async id => {
  const res = await api.get(`tm-transfer_request-details?id=${id}`)
  return res.data
}

// TX Details
export const getTransferRequestDetailsTX = async id => {
  const res = await api.get(`tx-transfer_request-details?id=${id}`)
  return res.data
}
