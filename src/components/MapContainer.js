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
// import queryString from "query-string";
  
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
      idstart: null,
      interactiveLayerIds: [],
      mode: null,
    }
    
    constructor(props) {
      super(props);
      this.mapRef = React.createRef();
      this.popupRef = React.createRef();
  
      this.state.idstart = props.idstart;
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
    
    getInteractiveLayerIds = () => {
        var interactiveLayerIds = [];
        this.props.layers.map((layer, index) => {
            layer.styles.map((style, styleindex) => {
                if (layer.visible) {
                    var localstyle = this.amendStyleForInteraction(layer.visible, index, style);
                    interactiveLayerIds.push(localstyle.style.id);    
                }
                return interactiveLayerIds;
            })
            return interactiveLayerIds;
        })
        return interactiveLayerIds;
    }

    getLayerFromFeatureId = (featureId) => {
        var layerId = null
        this.props.layers.map((layer, index) => {
            layer.featurecollection.features.map((feature, featureindex) => {
                if (feature.id === featureId) layerId = index;
                return layerId;
            })
            return layerId;
        })
        return layerId;
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

        map.on('draw.modechange', (mode) => {
            this.setState({mode: mode.mode});
        });
    
        map.on('draw.create', (data) => {
            // Replace string id with numerical id so we can setFeatureState on it
            var feature = data.features[0];
            this.props.mapdraw.delete(feature.id);
            var newId = this.state.idstart + 1;
            feature.id = newId;
            this.props.mapdraw.add(feature);
            this.setState({idstart: newId});
            this.props.onDataChange(data);
        });

        map.on('draw.selectionchange', (data) => {
            this.props.onSelectionChange(data);
        });
    
        // Restyle to deal with using maplibre-gl and not mapbox-gl
        document.getElementsByClassName('mapboxgl-ctrl-group')[0].classList.add('maplibregl-ctrl');                      
        document.getElementsByClassName('mapboxgl-ctrl-group')[0].classList.add('maplibregl-ctrl-group');                      
    }
  
    amendStyleForInteraction = (visible, index, style) => {
        let JSONstyle = JSON.stringify(style);
        let newstyle = JSON.parse(JSONstyle);
        let prevlayer = null;
        if (index > 0) prevlayer = (index - 1).toString() + "_line";
        newstyle.id = index.toString() + "_" + newstyle.id;
        if (!visible) {
            if (index === this.props.selected) {
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
            } else {
                if (newstyle['type'] === 'line') {
                    newstyle['paint'] = {
                        "line-color": "white",
                        "line-width": 0,
                        "line-opacity": 0
                    }
                }
                if (newstyle['type'] === 'fill') {
                    newstyle['paint'] = {
                        "fill-color": "white",
                        "fill-opacity": 0
                    }
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

        return {prevlayer: prevlayer, style: newstyle};
    }

    onMouseEnter = (event) => {
    }
  
    onMouseMove = (event) => {
    }
  
    onMouseLeave = (event) => {
    }
  
    onClick = (event) => {
        if (this.state.mode !== 'draw_polygon') {
            if (event.features.length > 0) {
                var featureId = event.features[0].id;
                var layerId = this.getLayerFromFeatureId(featureId);
                if (layerId !== null) {
                    this.props.onSetSelected(layerId, featureId);
                }
            }      
        }
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
            interactiveLayerIds={this.getInteractiveLayerIds()}
            mapStyle={require(isDev() ? '../constants/mapstyletest.json' : '../constants/mapstyle.json')}
          >
  
            <GeolocateControl position="top-left" />  
            <NavigationControl visualizePitch={true} position="top-left" />     

            {this.props.layers.map((layer, index) => {
                return (
                    <div key={index.toString()}>
                        <Source key={index} id={index.toString()} type="geojson" data={layer.featurecollection}>
                            {layer.styles.map((style, styleindex) => {
                                var localstyle = this.amendStyleForInteraction(layer.visible, index, style);
                                return (<Layer key={localstyle.style.id} {...localstyle.style} beforeId={localstyle.prevlayer} />);
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