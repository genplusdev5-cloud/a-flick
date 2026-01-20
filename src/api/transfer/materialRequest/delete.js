import api from '@/utils/axiosInstance'

// TM DELETE
export const deleteTmMaterialRequest = async id => {
  const res = await api.patch(`tm_material_request-delete/?id=${id}`)
  return res.data
}

// TX DELETE
export const deleteTxMaterialRequest = async id => {
  const res = await api.patch(`tx_material_request-delete/?id=${id}`)
  return res.data
}
