import api from '@/utils/axiosInstance'

export const addEmployee = async payload => {
  try {
    // ✅ Build backend-ready payload (matching DB structure)
    const finalPayload = {
      company_name: payload.company_name || '-', // 🔹 Added
      user_role: payload.userRole || '-',       // 🔹 Correct key name
      department: payload.department || '-',
      designation: payload.designation || '-',
      scheduler: payload.scheduler || '-',
      supervisor: payload.supervisor || '-',
      name: payload.name,
      email: payload.email,
      password: payload.password,
      is_scheduler: payload.isScheduler ? 1 : 0,
      is_sales: payload.isSales ? 1 : 0,
      is_technician: payload.isTechnician ? 1 : 0,
      is_active: 1,
      created_by: 1, // 🔹 Add if backend expects numeric user ID
      updated_by: 1, // 🔹 Add if required
      description: payload.description || ''
    }

    console.log('📤 Sending Payload:', finalPayload)
    const response = await api.post('employee-add/', finalPayload)

    console.log('✅ Employee Added:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ Employee Add API Error:', error.response?.data || error.message)
    throw error
  }
}
