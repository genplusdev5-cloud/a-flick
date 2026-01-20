import api from '@/utils/axiosInstance'

// Backend: employeelunch-update/?id=<id>
// - If id exists → UPDATE
// - If id = 0 or missing → CREATE
export const updateEmployeeLunch = async (id = 0, data) => {
  const form = new FormData()

  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      form.append(key, value)
    }
  })

  const res = await api.put(`employeelunch-update/?id=${id}`, form)

  return res.data
}
