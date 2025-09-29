import { combineReducers } from '@reduxjs/toolkit';
import interviewReducer from '../features/interview/interviewSlice.js';

const rootReducer = combineReducers({
  interview: interviewReducer,
});

export default rootReducer;


