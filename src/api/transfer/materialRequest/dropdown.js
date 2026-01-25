import api from '@/utils/axiosInstance'

export const getMaterialRequestDropdowns = async () => {
  const res = await api.post('dropdown-filter/', {
    models: 'employee(label=name),chemicals(label=name,uom),uom(label=name),supplier(label=name)'
  })

  return res.data
}
