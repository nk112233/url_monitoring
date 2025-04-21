import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import memberService from "./membersService";

const initialState = {
  members: [],
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: ''
};

export const inviteMember = createAsyncThunk(
  "member/invite",
  async (memberDetails, thunkAPI) => {
    try {
      const response = await memberService.inviteMember(memberDetails);
      return response;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to send invitation';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const removeMember = createAsyncThunk(
  "member/remove",
  async (memberDetails, thunkAPI) => {
    try {
      const response = await memberService.removeMember(memberDetails);
      return response;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to remove member';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const getAllMembers = createAsyncThunk(
  "member/getAll",
  async (teamId, thunkAPI) => {
    try {
      const response = await memberService.getAllMembers(teamId);
      return response;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch members';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const membersSlice = createSlice({
  name: "members",
  initialState,
  reducers: {
    reset: (state) => initialState,
    clearMessage: (state) => {
      state.message = '';
      state.isError = false;
      state.isSuccess = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Remove member cases
      .addCase(removeMember.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(removeMember.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = action.payload.message;
        state.members = state.members.filter((member) => member._id !== action.payload.memberId);
      })
      .addCase(removeMember.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Invite member cases
      .addCase(inviteMember.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(inviteMember.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = action.payload.message;
      })
      .addCase(inviteMember.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Get all members cases
      .addCase(getAllMembers.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(getAllMembers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.members = action.payload[0]?.members || [];
      })
      .addCase(getAllMembers.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, clearMessage } = membersSlice.actions;
export default membersSlice.reducer;
