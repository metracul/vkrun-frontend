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
    console.log('[userSlice] VKWebAppGetUserInfo call');
    const user = await bridge.send('VKWebAppGetUserInfo');
    console.log('[userSlice] VKWebAppGetUserInfo result', user);
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
      console.log('[userSlice] resetUser');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        console.log('[userSlice] fetchUser.pending');
        state.status = 'loading';
        state.error = undefined;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        console.log('[userSlice] fetchUser.fulfilled');
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        console.warn('[userSlice] fetchUser.rejected', action.error);
        state.status = 'failed';
        state.error = action.error?.message || 'VKWebAppGetUserInfo failed';
      });
  },
});

export const { resetUser } = userSlice.actions;
export default userSlice.reducer;
