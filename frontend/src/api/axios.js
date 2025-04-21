import axios from "axios";
import { refreshToken } from "../util/refreshToken";
import { getbaseURL } from "../util/getBaseUrl";

export default axios.create({
  baseURL: getbaseURL(),
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

export const axiosPrivate = axios.create({
  baseURL: getbaseURL(),
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Axios interceptors to handle token refresh
axiosPrivate.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    config.headers["Authorization"] = `Bearer ${token}`;

    return config;
  },
  (error) => Promise.reject(error)
);

axiosPrivate.interceptors.response.use(
  (response) => response,
  async (error) => {
    const prevRequest = error?.config;
    if (error?.response?.status === 403 && !prevRequest?.sent) {
      prevRequest.sent = true;
      const newAccessToken = await refreshToken();
      prevRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
      return axiosPrivate(prevRequest);
    }
    return Promise.reject(error);
  }
);
