import api from '@/utils/axiosInstance'

// TM Delete
export const deleteTransferRequestTM = async id => {
  const res = await api.patch(`tm-transfer_request-delete/?id=${id}`)
  return res.data
}

// TX Delete
export const deleteTransferRequestTX = async id => {
  const res = await api.patch(`tx-transfer_request-delete/?id=${id}`)
  return res.data
}
