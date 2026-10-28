import { configureStore, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { searchParts } from './api';

export const fetchBrands = createAsyncThunk('parts/fetchBrands', async (number, { signal, rejectWithValue }) => {
  try { return await searchParts({ number }, signal); }
  catch (error) { return rejectWithValue(error.message); }
});

export const fetchOffers = createAsyncThunk('parts/fetchOffers', async ({ number, brand }, { signal, rejectWithValue }) => {
  try { return await searchParts({ number, brand }, signal); }
  catch (error) { return rejectWithValue(error.message); }
});

const partsSlice = createSlice({
  name: 'parts',
  initialState: { brands: null, brandsStatus: 'idle', brandsError: null, offers: null, offersStatus: 'idle', offersError: null },
  reducers: {
    resetSearch(state) {
      state.brands = null;
      state.brandsStatus = 'idle';
      state.brandsError = null;
      state.offers = null;
      state.offersStatus = 'idle';
      state.offersError = null;
    },
    resetOffers(state) {
      state.offers = null;
      state.offersStatus = 'idle';
      state.offersError = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchBrands.pending, (state) => { state.brandsStatus = 'loading'; state.brandsError = null; })
      .addCase(fetchBrands.fulfilled, (state, action) => { state.brandsStatus = 'succeeded'; state.brands = action.payload; })
      .addCase(fetchBrands.rejected, (state, action) => {
        if (action.meta.aborted) return;
        state.brandsStatus = 'failed'; state.brandsError = action.payload || 'Ошибка поиска производителей';
      })
      .addCase(fetchOffers.pending, (state) => { state.offersStatus = 'loading'; state.offersError = null; })
      .addCase(fetchOffers.fulfilled, (state, action) => { state.offersStatus = 'succeeded'; state.offers = action.payload; })
      .addCase(fetchOffers.rejected, (state, action) => {
        if (action.meta.aborted) return;
        state.offersStatus = 'failed'; state.offersError = action.payload || 'Ошибка поиска предложений';
      });
  },
});

export const { resetSearch, resetOffers } = partsSlice.actions;
export const store = configureStore({ reducer: { parts: partsSlice.reducer } });
