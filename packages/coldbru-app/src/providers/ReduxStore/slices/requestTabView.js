import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  mode: 'home',
  collectionUid: null
};

export const requestTabViewSlice = createSlice({
  name: 'requestTabView',
  initialState,
  reducers: {
    setRequestTabView: (state, action) => {
      state.mode = action.payload?.mode || 'home';
      state.collectionUid = action.payload?.collectionUid || null;
    }
  }
});

export const {
  setRequestTabView
} = requestTabViewSlice.actions;

export default requestTabViewSlice.reducer;
