import api from '@/utils/axiosInstance'

// PATCH – Update Contract TODO
export const updateContractTodo = async ({ contract_id, todo_list }) => {
  try {
    const res = await api.patch(`contract-todo/?id=${contract_id}`, {
      todo_list
    })

    return {
      status: res.data?.status,
      message: res.data?.message,
      data: res.data?.data
    }
  } catch (error) {
    console.error('Contract Todo API Error:', error)
    return {
      status: 'failed',
      message: error.response?.data?.message || 'Unable to update contract todo'
    }
  }
}
