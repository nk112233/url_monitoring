import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import incidentService from "./incidentsService";

const initialState = {
  incidents: [],
  isError: false,
  isLoading: false,
  isSuccess: false,
  message: "",
  analytics: null,
};

//Get Incidents
export const getIncidents = createAsyncThunk(
  "incidents/getAll",
  async (_, thunkAPI) => {
    try {
      const { userId } = thunkAPI.getState().auth.user;
      return await incidentService.getAllIncidents(userId);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();

      return thunkAPI.rejectWithValue(message);
    }
  }
);

//Resolve Incident
export const resolveIncident = createAsyncThunk(
  "incident/resolve",
  async (incidentId, thunkAPI) => {
    try {
      return await incidentService.resolveIncident(incidentId);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();

      return thunkAPI.rejectWithValue(message);
    }
  }
);

//Acknowledge Incident
export const acknowledgeIncident = createAsyncThunk(
  "incident/acknowledge",
  async (incidentId, thunkAPI) => {
    try {
      console.log('acknowledgeIncident called')
      return await incidentService.acknowledgeIncident(incidentId);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();

      return thunkAPI.rejectWithValue(message);
    }
  }
);

//Remove Incident
export const deleteIncident = createAsyncThunk(
  "incident/delete",
  async (incidentId, thunkAPI) => {
    try {
      console.log('acknowledgeIncident called')
      return await incidentService.deleteIncident(incidentId);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();

      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get analytics
export const getIncidentAnalytics = createAsyncThunk(
  "incident/getAnalytics",
  async (params, thunkAPI) => {
    try {
      const { userId, startDate, endDate, url } = params;
      const token = thunkAPI.getState().auth.user.token;
      
      // Build query params
      let queryParams = '';
      if (startDate) queryParams += `startDate=${startDate}&`;
      if (endDate) queryParams += `endDate=${endDate}&`;
      if (url) queryParams += `url=${encodeURIComponent(url)}&`;
      
      // Remove trailing ampersand if exists
      if (queryParams.endsWith('&')) {
        queryParams = queryParams.slice(0, -1);
      }
      
      const queryString = queryParams ? `?${queryParams}` : '';
      
      return await incidentService.getIncidentAnalytics(userId, token, queryString);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const incidentSlice = createSlice({
  name: "incident",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      //Get all incidents
      .addCase(getIncidents.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getIncidents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.incidents = action.payload;
      })
      .addCase(getIncidents.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      //resolve an incident      
      .addCase(resolveIncident.fulfilled, (state, action) => {
        state.isSuccess = true;
        const resolvedIncident =  state.incidents.find(incident => incident._id === action.payload._id);
        resolvedIncident.resolved = true;
      })
      .addCase(resolveIncident.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload.message;
      })

      //Acknowledge an incident      
      .addCase(acknowledgeIncident.fulfilled, (state, action) => {
        state.isSuccess = true;
        const resolvedIncident =  state.incidents.find(incident => incident._id === action.payload._id);
        resolvedIncident.acknowledged = true;
      })
      .addCase(acknowledgeIncident.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload.message;
      })

      //Delete an incident      
      .addCase(deleteIncident.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.incidents =  state.incidents.filter(incident => incident._id !== action.payload._id);
      })
      .addCase(deleteIncident.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload.message;
      })

      .addCase(getIncidentAnalytics.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getIncidentAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.analytics = action.payload;
        // Make sure responseTimes is always an array, even if not returned from API
        if (!state.analytics.responseTimes) {
          state.analytics.responseTimes = [];
        }
      })
      .addCase(getIncidentAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = incidentSlice.actions;
export default incidentSlice.reducer;
