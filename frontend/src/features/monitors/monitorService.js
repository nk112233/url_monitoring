import { toast } from "react-toastify";
import { axiosPrivate } from "../../api/axios";
import { trimInputValues } from "../../util/helper";


//Create new monitor
const createMonitor = async (monitorData) => {
  monitorData = trimInputValues(monitorData);
  console.log('monitorData',monitorData);
  const response = await axiosPrivate.post("/monitor", monitorData)
  return response.data;
};

//Get all monitors
const getAllMonitors = async () => {
  const response = await axiosPrivate.get("/monitor");
  return response.data;
};

//Get single monitor
const getMonitor = async (monitorId) => {
  const response = await axiosPrivate.get(`/monitor/${monitorId}`);
  return response.data;
};

//Delete monitor
const deleteMonitor = async (monitorId) => {
  const response = await axiosPrivate.delete(`/monitor/${monitorId}`);
  toast.success(response.data.message || "Monitor deleted successfully");
  return response.data;
};

const monitorService = {
  deleteMonitor,
  createMonitor,
  getAllMonitors,
  getMonitor,
};

export default monitorService;
