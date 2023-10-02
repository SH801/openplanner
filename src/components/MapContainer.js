import React, { Component } from 'react';
import { Map, NavigationControl, GeolocateControl, Source, Layer }  from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'

import { 
    DEFAULT_LAT, 
    DEFAULT_LNG, 
    DEFAULT_ZOOM,
    DEFAULT_PITCH,
    DEFAULT_BEARING,
} from "../constants";
import queryString from "query-string";
  
const isDev = () =>  !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

export class MapContainer extends Component  {

    state = {
      lat: null,
      lng: null,
      zoom: null,
      pitch: null,
      bearing: null,
      scrollWheelZoom: true,	
      selectedfeature: null,
      selectedlayer: null,
    }
    
    constructor(props) {
      super(props);
      this.mapRef = React.createRef();
      this.popupRef = React.createRef();
  
      this.state.lat = props.lat;
      this.state.lng = props.lng;
      this.state.zoom = props.zoom;  
      this.state.pitch = props.pitch;
      this.state.bearing = props.bearing;
  
    //   let params = queryString.parse(this.props.location.search);
    //   if (params.lat !== undefined) this.state.lat = params.lat;
    //   if (params.lng !== undefined) this.state.lng = params.lng;
    //   if (params.zoom !== undefined) this.state.zoom = params.zoom;  
    //   if (params.pitch !== undefined) this.state.pitch = params.pitch;  
    //   if (params.bearing !== undefined) this.state.bearing = params.bearing;  
    }
    
    onRender = (event) => {
    }
  
    onLoad = (event) => {

        var map = this.mapRef.current.getMap();

        this.props.onSetMap(map);

        map.addControl(this.props.mapdraw, 'top-left');  

        map.on('draw.render', (data) => {
        //    this.props.onDataChange(data);
        });
    
        map.on('draw.selectionchange', (data) => {
            this.props.onSelectionChange(data);
        });
    
        // Restyle to deal with using maplibre-gl and not mapbox-gl
        document.getElementsByClassName('mapboxgl-ctrl-group')[0].classList.add('maplibregl-ctrl');                      
        document.getElementsByClassName('mapboxgl-ctrl-group')[0].classList.add('maplibregl-ctrl-group');                      
    }
  
    amendStyleForInteraction = (visible, index, style) => {
        let newstyle = {...style};
        newstyle.id = index.toString() + "_" + newstyle.id;
        if (!visible) {
            if (newstyle['type'] === 'line') {
                newstyle['paint'] = {
                    "line-color": "grey",
                    "line-width": 1,
                    "line-dasharray": [0.2, 2],
                    "line-opacity": 0.7
                  }
            }
            if (newstyle['type'] === 'fill') {
                newstyle['paint'] = {
                    "fill-color": "white",
                    "fill-opacity": 0.1
                  }
            }
        }
        if (newstyle['paint']['line-opacity'] !== undefined) {
            newstyle['paint']['line-opacity'] = [
                "case",
                ["boolean", ["feature-state", "active"], false],
                0,
                newstyle['paint']['line-opacity']    
            ]
        }
        if (newstyle['paint']['fill-opacity'] !== undefined) {
            newstyle['paint']['fill-opacity'] = [
                "case",
                ["boolean", ["feature-state", "active"], false],
                0,
                newstyle['paint']['fill-opacity']    
            ]
        }

        return newstyle;
    }

    onMouseEnter = (event) => {
    }
  
    onMouseMove = (event) => {
    }
  
    onMouseLeave = (event) => {
    }
  
    onClick = (event) => {
    }
  
    onResize = (event) => {
    }
  
    onZoomEnd = (event) => {
    }
  
    onRotateEnd = (event) => {
    }
  
    onMoveEnd = (event) => {  
    }
    
    render () {
      return (
        <Map ref={this.mapRef}
            onLoad={this.onLoad}
            onRender={this.onRender}
            onMouseEnter={this.onMouseEnter}
            onMouseMove={this.onMouseMove}
            onMouseLeave={this.onMouseLeave}
            onMoveEnd={this.onMoveEnd}
            onRotateEnd={this.onRotateEnd}
            onResize={this.onResize}
            onClick={this.onClick}
            onZoomEnd={this.onZoomEnd}
            minZoom={4}
            maxZoom={19}
            maxPitch={85}
            preserveDrawingBuffer={true} 
            initialViewState={{
              longitude: this.state.lng,
              latitude: this.state.lat,
              zoom: this.state.zoom,
              pitch: this.state.pitch,
              bearing: this.state.bearing
            }}    
            mapStyle={require(isDev() ? '../constants/mapstyletest.json' : '../constants/mapstyle.json')}
          >
  
            <GeolocateControl position="top-left" />  
            <NavigationControl visualizePitch={true} position="top-left" />     

            {this.props.layers.toReversed().map((layer, index) => {
                var absoluteindex = this.props.layers.length - index - 1;
                return (
                    <div key={absoluteindex.toString() + this.props.refreshIndex}>
                        <Source key={absoluteindex} id={absoluteindex.toString()} type="geojson" data={layer.featurecollection}>
                            {layer.styles.map((style, styleindex) => {
                                var localstyle = this.amendStyleForInteraction(layer.visible, absoluteindex, style);
                                if (layer.visible || (this.props.selected === absoluteindex)) {
                                    return (<Layer key={style.id} {...localstyle} />)
                                }
                            })}
                        </Source>

                    </div>
                )
            })}


        </Map>
      )
    }
  }

  MapContainer.defaultProps = {
    lat: DEFAULT_LAT,
    lng: DEFAULT_LNG,
    zoom: DEFAULT_ZOOM,
    pitch: DEFAULT_PITCH,
    bearing: DEFAULT_BEARING
  };
  
  export default MapContainer;