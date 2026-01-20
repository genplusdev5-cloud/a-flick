import api from '@/utils/axiosInstance'

export const deleteMaterialReceive = (id, type = 'tm') => {
  const url = type === 'tx' ? `tx_material_receive-delete/?id=${id}` : `tm_material_receive-delete/?id=${id}`

  return api.patch(url)
}
