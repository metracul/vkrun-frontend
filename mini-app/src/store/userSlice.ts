import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import bridge, { UserInfo } from '@vkontakte/vk-bridge';

type UserState = {
  data?: UserInfo;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error?: string;
};

const initialState: UserState = {
  status: 'idle',
};

export const fetchUser = createAsyncThunk<UserInfo>(
  'user/fetchUser',
  async () => {
    const user = await bridge.send('VKWebAppGetUserInfo');
    return user;
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    resetUser(state) {
      state.data = undefined;
      state.status = 'idle';
      state.error = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.status = 'loading';
        state.error = undefined;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error?.message || 'VKWebAppGetUserInfo failed';
      });
  },
});

export const { resetUser } = userSlice.actions;
export default userSlice.reducer;
