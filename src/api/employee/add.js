import api from "@/utils/axiosInstance";

export const addEmployee = async (formData) => {
  try {
    const res = await api.post("employee-add/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  } catch (error) {
    console.log("❌ Add API Error:", error.response?.data);
    throw error;
  }
};
