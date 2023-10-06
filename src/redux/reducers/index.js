
/**
 * reducers/index.js 
 * 
 * React redux reducers index
 */ 

import { combineReducers } from 'redux';
import global from "./global";

const OpenPlannerApp = combineReducers({
  global
})

export default OpenPlannerApp;