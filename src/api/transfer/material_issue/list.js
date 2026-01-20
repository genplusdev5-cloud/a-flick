import api from '@/utils/axiosInstance'

export const getMaterialIssueList = params => {
  return api.get('tm_material_issue-list/', { params })
}
