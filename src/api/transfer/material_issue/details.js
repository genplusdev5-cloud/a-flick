import api from '@/utils/axiosInstance'

export const getMaterialIssueDetails = (id, type = 'tm') => {
  const url =
    type === 'tx'
      ? `tx_material_issue-details/?id=${id}`
      : `tm_material_issue-details/?id=${id}`

  return api.get(url)
}
