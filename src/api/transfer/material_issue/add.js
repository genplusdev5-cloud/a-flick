import api from '@/utils/axiosInstance'

export const addMaterialIssue = (data) => {
  return api.post('tm_material_issue-add/', data)
}
