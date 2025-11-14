import api from '@/utils/axiosInstance'

export const deleteServiceFrequency = async id => {
  const { data } = await api.patch(`servicefrequency-delete/?id=${id}`, {
    id
  })
  return data
}

