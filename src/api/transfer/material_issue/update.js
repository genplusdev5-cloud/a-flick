import api from '@/utils/axiosInstance'

export const updateMaterialIssue = (id, data) => {
  return api.put(`tm_material_issue-update/?id=${id}`, data)
}
