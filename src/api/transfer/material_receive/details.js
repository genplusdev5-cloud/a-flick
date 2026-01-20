import api from '@/utils/axiosInstance'

export const getMaterialReceiveDetails = (id, type = 'tm') => {
  const url = type === 'tx' ? `tx_material_receive-details/?id=${id}` : `tm_material_receive-details/?id=${id}`

  return api.get(url)
}
