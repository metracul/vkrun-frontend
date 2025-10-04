import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import bridge from '@vkontakte/vk-bridge';

type PurchaseState = {
  inProgress: boolean;
  lastOrderId?: string;
  error?: string;
  lastItemId?: string;
};

const initialState: PurchaseState = {
  inProgress: false,
};

interface VKWebAppShowOrderBoxResponseFixed {
  success?: boolean;
  order_id?: string;
}

// Возможная форма ошибки от vk-bridge
type BridgeError = {
  error_data?: { error_reason?: string };
  error?: { error_msg?: string };
  message?: string;
};

export const spendVotes = createAsyncThunk<
  { success: boolean; order_id?: string; itemId: string }, // return type
  { itemId: string }                                       // arg type
>('purchase/spendVotes', async ({ itemId }, { rejectWithValue }) => {
  try {
    const res = (await bridge.send(
      'VKWebAppShowOrderBox',
      { type: 'item', item: itemId }
    )) as unknown as VKWebAppShowOrderBoxResponseFixed;

    return { success: Boolean(res?.success), order_id: res?.order_id, itemId };
  } catch (e) {
    const err = e as BridgeError;
    return rejectWithValue(
      err?.error_data?.error_reason ||
        err?.error?.error_msg ||
        err?.message ||
        'Unknown error'
    );
  }
});

const purchaseSlice = createSlice({
  name: 'purchase',
  initialState,
  reducers: {
    purchaseSucceeded(
      state,
      action: PayloadAction<{ order_id?: string; itemId?: string }>
    ) {
      state.inProgress = false;
      state.error = undefined;
      state.lastOrderId = action.payload.order_id;
      if (action.payload.itemId) state.lastItemId = action.payload.itemId;
    },
    purchaseFailed(state, action: PayloadAction<string>) {
      state.inProgress = false;
      state.error = action.payload || 'Purchase failed';
    },
    resetPurchase(state) {
      state.inProgress = false;
      state.error = undefined;
      state.lastOrderId = undefined;
      state.lastItemId = undefined;
    },
  },
  extraReducers: (b) => {
    b.addCase(spendVotes.pending, (state, action) => {
      state.inProgress = true;
      state.error = undefined;
      state.lastItemId = action.meta.arg.itemId;
    });
    b.addCase(spendVotes.fulfilled, (state, action) => {
      state.inProgress = false;
      state.error = undefined;
      if (action.payload.success) {
        state.lastOrderId = action.payload.order_id;
      } else {
        state.error = 'Payment not successful';
      }
    });
    b.addCase(spendVotes.rejected, (state, action) => {
      state.inProgress = false;
      state.error =
        (action.payload as string) || action.error.message || 'Purchase error';
    });
  },
});

export const { purchaseSucceeded, purchaseFailed, resetPurchase } =
  purchaseSlice.actions;
export default purchaseSlice.reducer;
