/**
 * constants/index.js 
 * 
 * Values for key constants
 */ 

export const isDev = () =>  !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
console.log("Development machine", isDev());

// URL of backend system
export const API_URL = isDev() ? "http://localhost:80" : "";

// Homepage to exit to 
export const EXTERNAL_HOMEPAGE  = isDev() ? "http://localhost:80/account/" : "/account/";

// URL of icons
export const ICON_URL = isDev() ? "http://localhost:80/static/assets/icon/actionIcons/coloured/" : "/static/assets/icon/actionIcons/coloured/";

// Default latitude
export const DEFAULT_LAT = 53.9908; 

// Default longitude
export const DEFAULT_LNG = -3.8231; 

// Default zoom scale
export const DEFAULT_ZOOM = 5; 

// Default pitch
export const DEFAULT_PITCH = 26;

// Default bearing
export const DEFAULT_BEARING = 0;

// Default animation pitch
export const DEFAULT_ANIMATION_PITCH = 70;

// Animation initial hold delay before moving camera
export const ANIMATION_INITIAL_HOLD = 0.1;

// Animation initial delay before showing first layer
export const ANIMATION_INITIAL_DELAY = 4;

// Animation delay after reaching camera and before showing layer
// Also time spent to stay on layer and before moving camera
export const ANIMATION_LAYER_DELAY = 1;

// Animation time to linger on layer
export const ANIMATION_LAYER_LINGER = 3;

// Animation time to transition to next layer
export const ANIMATION_CAMERA_TRANSITION = 2;

// Default maxbounds 

export const DEFAULT_MAXBOUNDS = [
    [
        -22.4,
        49.5
    ],
    [
        13.3, 
        61.2 
    ]
]

// General padding for fitting bounds
export const FITBOUNDS_PADDING = 60;


