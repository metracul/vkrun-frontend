import { createSlice } from '@reduxjs/toolkit';
import { getFrozenLaunchQueryString } from '../shared/vkParams';

interface VkParamsState { queryString: string | null }
const initialState: VkParamsState = { queryString: getFrozenLaunchQueryString() };

const vkParamsSlice = createSlice({
  name: 'vkParams',
  initialState,
  reducers: {
    setQueryString(state, { payload }: { payload: string | null }) {
      state.queryString = payload;
    },
  },
});

export const { setQueryString } = vkParamsSlice.actions;
export default vkParamsSlice.reducer;
