import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducer.js';

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: []
      }
    })
});

// Removed persistor since we're using backend storage instead of local storage


