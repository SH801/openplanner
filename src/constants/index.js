/**
 * constants/index.js 
 * 
 * Values for key constants
 */ 

export const isDev = () =>  !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
console.log("Development machine", isDev());

// URL of backend system
export const API_URL = isDev() ? "http://localhost:80" : "";

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
export const FITBOUNDS_PADDING = 10;


