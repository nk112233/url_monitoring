import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const getTeamMembers = createAsyncThunk(
  'team/getTeamMembers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/v1/member');
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 
        error.response?.data || 
        'Failed to fetch team members'
      );
    }
  }
);

export const inviteTeamMember = createAsyncThunk(
  'team/inviteTeamMember',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/v1/member', data);
      return response.data;
    } catch (error) {
      // More detailed error handling
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data || 
        error.message || 
        'Failed to send invitation';
      return rejectWithValue(errorMessage);
    }
  }
);

export const removeMember = createAsyncThunk(
  'team/removeMember',
  async (memberId, { rejectWithValue }) => {
    try {
      await api.delete(`/api/v1/member/${memberId}`);
      return memberId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 
        error.response?.data || 
        'Failed to remove team member'
      );
    }
  }
);

const initialState = {
  members: [],
  isLoading: false,
  error: null,
};

const teamSlice = createSlice({
  name: 'team',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get team members
      .addCase(getTeamMembers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getTeamMembers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.members = action.payload;
      })
      .addCase(getTeamMembers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Invite team member
      .addCase(inviteTeamMember.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(inviteTeamMember.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(inviteTeamMember.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Remove team member
      .addCase(removeMember.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeMember.fulfilled, (state, action) => {
        state.isLoading = false;
        state.members = state.members.filter(member => member.id !== action.payload);
      })
      .addCase(removeMember.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = teamSlice.actions;
export default teamSlice.reducer; 