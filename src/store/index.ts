import { configureStore } from '@reduxjs/toolkit';
import optionsReducer from './optionsSlice';
import { createDefaultAutoSaveMiddleware } from './middleware/autoSaveMiddleware';
import { createOptionsService } from '../services';

// Create options service instance
const optionsService = createOptionsService();

// Create auto-save middleware
const autoSaveMiddleware = createDefaultAutoSaveMiddleware(optionsService);

export const store = configureStore({
  reducer: {
    options: optionsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: {
        extraArgument: { optionsService },
      },
    }).concat(autoSaveMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;