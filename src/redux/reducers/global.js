/** 
 * Copyright (c) Open Carbon, 2020
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * reducers/global.js 
 * 
 * Reducer for global redux object
 * 
 * GLOBAL_SET_STATE: Updates global variable(s) using names/values in object
 * SET_TIME_RANGE: Updates time-specific variables
 * SET_AREA_SCALE: Updates areascale property
 */ 

import { initialStateGlobal } from "./initializers"

export default function selector(state=initialStateGlobal, action) {

    let newState = {...state};

    switch (action.type) {
  
        case 'GLOBAL_SET_STATE':
            Object.keys(action.object).forEach((key) => newState[key] = action.object[key]);                
            return newState;
                
        case 'FETCH_ENTITY':
            newState = {...newState, entityid: action.entity.id, entity: action.entity};
            return newState;

        case 'FETCH_ENTITIES':
            newState = {...newState, entities: action.entities};
            return newState;

        case 'FETCH_FUNDING':
            newState = {...newState, funding: action.funding};
            return newState;
                
        case 'FETCH_PLAN':
            newState = {...newState, 
                id: action.plan.id, 
                name: action.plan.name, 
                public: action.plan.public, 
                entityid: action.plan.entityid,
                data: action.plan.data };
            return newState;
                
        case 'SAVE_PLAN':
            newState = {...newState, id: action.id};
            return newState;

        default:
            return state;
    }
}
