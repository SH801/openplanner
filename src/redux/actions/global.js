
/**
 * action/global.js 
 * 
 * Actions for global redux object
 */ 

import Cookies from 'js-cookie';
import { API_URL, FITBOUNDS_PADDING } from "../../constants";
import { bbox } from '@turf/turf';
export const isDev = () =>  !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

/**
 * setGlobalState
 * 
 * Sets global state using a list of names/values represented by object
 * 
 * @param {*} object 
 */
export const setGlobalState = (object) => {
    return (dispatch, getState) => {
      dispatch({type: 'GLOBAL_SET_STATE', object: object});
      return Promise.resolve(true);
    }
}

// Code for authenticated connections

// const csrftoken = Cookies.get('csrftoken');

// console.log(csrftoken);

// let headers = {'X-CSRFToken': csrftoken};
// let body = '';

// return fetch(API_URL + "/test/", {headers, method: "GET", credentials: 'include'})
//   .then(res => {
//     if (res.status < 500) {
//       return res.json().then(data => {
//         return {status: res.status, data};
//       })
//     } else {
//       console.log("Server Error!");
//       throw res;
//     }
//   })
//   .then(res => {
//     if (res.status === 200) {

//     }         
//   })


/**
 * fetchEntity
 * 
 * Fetches entity from backend server using id
 * 
 * @param {*} id
 */
export const fetchEntity = (id) => {
  return (dispatch, getState) => {
    const { map } = getState().global;
    const csrftoken = Cookies.get('csrftoken');
    let headers = {
      "Content-Type": "application/json",
      'X-CSRFToken': csrftoken      
    };
    let apiparams = isDev() ? {headers, method: "POST"} : {headers, method: "POST", credentials: 'include'};
    return fetch(API_URL + "/account/entity/" + id.toString(), apiparams)
      .then(res => {
        if (res.status < 500) {
          return res.json().then(data => {
            return {status: res.status, data};
          })
        } else {
          console.log("Server Error!");
          throw res;
        }
      })
      .then(res => {
        if (res.status === 200) {
          var boundingbox = bbox(res.data.geojson);
          map.setMaxBounds(null);
          map.setMinZoom(null);
          let pitch = map.getPitch();
          map.setPitch(0);
          map.fitBounds(boundingbox, {padding: FITBOUNDS_PADDING, animate: false});  
          map.setMaxBounds(map.getBounds(), {padding: 0, animate: false});  
          map.setMinZoom(map.getZoom());
          map.setPitch(pitch);
          return dispatch({type: 'FETCH_ENTITY', entity: res.data});
        }         
      })
  }
}

/**
 * fetchEntities
 * 
 * Fetches all entities from backend server that user has access to
 * 
 * @param {*} id
 */
export const fetchEntities = () => {
  return (dispatch, getState) => {
    const csrftoken = Cookies.get('csrftoken');
    let headers = {
      "Content-Type": "application/json",
      'X-CSRFToken': csrftoken      
    };
    let apiparams = isDev() ? {headers, method: "POST"} : {headers, method: "POST", credentials: 'include'};
    return fetch(API_URL + "/account/entities/", apiparams)
      .then(res => {
        if (res.status < 500) {
          return res.json().then(data => {
            return {status: res.status, data};
          })
        } else {
          console.log("Server Error!");
          throw res;
        }
      })
      .then(res => {
        if (res.status === 200) {
          return dispatch({type: 'FETCH_ENTITIES', entities: res.data});
        }         
      })
  }
}

/**
 * fetchPlan
 * 
 * Fetches plan from backend server using id
 * 
 * @param {*} id
 */
export const fetchPlan = (id) => {
  return (dispatch, getState) => {
    const csrftoken = Cookies.get('csrftoken');
    let headers = {
      "Content-Type": "application/json",
      'X-CSRFToken': csrftoken      
    };
    let apiparams = isDev() ? {headers, method: "POST"} : {headers, method: "POST", credentials: 'include'};
    return fetch(API_URL + "/account/plan/" + id.toString(), apiparams)
      .then(res => {
        if (res.status < 500) {
          return res.json().then(data => {
            return {status: res.status, data};
          })
        } else {
          console.log("Server Error!");
          throw res;
        }
      })
      .then(res => {
        if (res.status === 200) {
          return dispatch({type: 'FETCH_PLAN', plan: res.data});
        }         
      })
  }
}

/**
 * savePlan
 * 
 * Saves plan to backend server 
 * 
 * @param {*} id
 */
export const savePlan = (plan) => {
  return (dispatch, getState) => {
    const csrftoken = Cookies.get('csrftoken');
    let headers = {
      "Content-Type": "application/json",
      'X-CSRFToken': csrftoken      
    };
    let body = JSON.stringify(plan);
    let apiparams = isDev() ? {headers, method: "POST", body} : {headers, method: "POST", credentials: 'include', body};
    return fetch(API_URL + "/account/plan/save/", apiparams)
      .then(res => {
        if (res.status < 500) {
          return res.json().then(data => {
            return {status: res.status, data};
          })
        } else {
          console.log("Server Error!");
          throw res;
        }
      })
      .then(res => {
        if (res.status === 200) {
          return dispatch({type: 'SAVE_PLAN', id: res.data.id});
        }         
      })
  }
}

