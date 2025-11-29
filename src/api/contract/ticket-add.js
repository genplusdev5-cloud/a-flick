import api from "@/utils/axiosInstance";

export const addTicketsApi = async (payload) => {
  const res = await api.post("ticket-add/", payload);
  return res.data;
};
