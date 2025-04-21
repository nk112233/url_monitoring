import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import monitorService from "./monitorService";

const initialState = {
  monitors: [],
  currentMonitor: null,
  isError: false,
  isLoading: false,
  isSuccess: false,
  message: "",
};

//Create new monitor
export const createMonitor = createAsyncThunk(
  "monitors/create",
  async (monitorData, thunkAPI) => {
    try {
      return await monitorService.createMonitor(monitorData);
    } catch (error) {
      console.log('error', error);
      const message =
        error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

//Get monitors
export const getMonitors = createAsyncThunk(
  "monitors/getAll",
  async (_, thunkAPI) => {
    try {
      return await monitorService.getAllMonitors();
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

//Get single monitor
export const getMonitor = createAsyncThunk(
  "monitors/getOne",
  async (monitorId, thunkAPI) => {
    try {
      return await monitorService.getMonitor(monitorId);
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

//Delete monitor
export const deleteMonitor = createAsyncThunk(
  "monitors/delete",
  async (monitorId, thunkAPI) => {
    try {
      return await monitorService.deleteMonitor(monitorId);
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

//Monitor Slice
export const monitorSlice = createSlice({
  name: "monitor",
  initialState,
  reducers: {
    reset: (state) => initialState,
  },
  extraReducers: (builder) => {
    builder
      //Get all Monitors
      .addCase(getMonitors.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(getMonitors.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;
        state.monitors = action.payload;
      })
      .addCase(getMonitors.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      //Get single monitor
      .addCase(getMonitor.pending, (state) => {
        state.isError = false;
        state.message = "";
      })
      .addCase(getMonitor.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;
        state.currentMonitor = action.payload;
      })
      .addCase(getMonitor.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      //Create Monitor
      .addCase(createMonitor.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(createMonitor.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.monitors.push(action.payload);
      })
      .addCase(createMonitor.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      //Delete Monitor
      .addCase(deleteMonitor.fulfilled, (state, action) => {
        state.monitors = state.monitors.filter((monitor) => {
          return monitor._id !== action.payload.id;
        });
      })
      .addCase(deleteMonitor.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload.message;
      });
  },
});

export const { reset } = monitorSlice.actions;
export default monitorSlice.reducer;
