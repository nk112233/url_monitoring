import axios from "@/api/axios";
import {getbaseURL} from '../../util/getBaseUrl';

//Register user
const register = async (userData) => {
  const response = await axios.post(getbaseURL()+'/register', userData);

  if (response.data) {
    localStorage.setItem("user", JSON.stringify(response.data));
  }
  return response.data;
};

//Login user
const login = async (userData) => {
  const response = await axios.post(getbaseURL()+"/login", userData, {
    withCredentials: true,
  });

  if (response.data) {
    localStorage.setItem("user", JSON.stringify(response.data));
    localStorage.setItem("token", JSON.stringify(response.data.token));
  }

  return response.data;
};

//Logout user
const logout = async () => {
  localStorage.removeItem("user");
  await axios.post(getbaseURL()+"/logout");
};

//Refresh 
const refresh = async () => {
  await axios.get(getbaseURL()+"/refresh");
};

const authService = {
  login,
  register,
  logout,
  refresh
};

export default authService;
