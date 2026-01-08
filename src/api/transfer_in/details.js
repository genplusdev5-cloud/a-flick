import api from '@/utils/axiosInstance'

export const getTransferInDetailsTM = async id => {
  const res = await api.get(`tm-transfer_in-details?id=${id}`)
  return res.data
}

export const getTransferInDetailsTX = async id => {
  const res = await api.get(`tx-transfer_in-details?id=${id}`)
  return res.data
}
