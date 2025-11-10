import api from '@/utils/axiosInstance'

export const deleteChecklist = async id => {
  const res = await api.patch(`checklist-delete/?id=${id}`)
  return res.data
}

