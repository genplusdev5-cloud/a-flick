import api from '@/utils/axiosInstance'

export const deleteMaterialIssue = (id, type = 'tm') => {
  const url = type === 'tx' ? `tx_material_issue-delete/?id=${id}` : `tm_material_issue-delete/?id=${id}`

  return api.patch(url)
}
