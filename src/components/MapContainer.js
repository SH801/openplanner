import React, { Component } from 'react';
import { Map, NavigationControl, GeolocateControl, Source, Layer }  from 'react-map-gl/maplibre';
import { connect } from 'react-redux';
import { withRouter } from '../redux/functions/withRouter';
import { global } from "../redux/actions";
import { initShaders, initVertexBuffers, renderImage } from './webgl';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'

import { 
    DEFAULT_LAT, 
    DEFAULT_LNG, 
    DEFAULT_ZOOM,
    DEFAULT_PITCH,
    DEFAULT_BEARING,
} from "../constants";
  
const isDev = () =>  !process.env.NODE_ENV || process.env.NODE_ENV === 'development';


export class PitchToggle extends Component{
    
    constructor(props) {
      super(props);
      this._pitch = props.pitch;
      this._mapcontainer = props.mapcontainer;
    }
  
    onAdd(map) {
      this._map = map;
      let _this = this; 
      this._btn = document.createElement('button');
      if (this._mapcontainer.props.global.satellite) {
        this._btn.className = 'maplibregl-ctrl-pitchtoggle-2d';
      }   
      else {
        this._btn.className = 'maplibregl-ctrl-pitchtoggle-3d';
      }
      this._btn.type = 'button';
      this._btn.id = "pitchtoggle"
      this._btn.setAttribute('data-tooltip-id', 'ctrlpanel-tooltip');
      this._btn.setAttribute('data-tooltip-content', 'Toggle between 2D and 3D view');
      this._btn.onclick = function() { 
        var currsatellite = _this._mapcontainer.props.global.satellite;
        var newsatellite = !currsatellite;
        _this._mapcontainer.props.setGlobalState({satellite: newsatellite});
        if (newsatellite) {
            map.easeTo({pitch: _this._pitch});
            _this._btn.className = 'maplibregl-ctrl-pitchtoggle-2d';
        } else {
            map.easeTo({pitch: 0, bearing: 0});
            _this._btn.className = 'maplibregl-ctrl-pitchtoggle-3d';
        } 
      };
      
      this._container = document.createElement('div');
      this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
      this._container.appendChild(this._btn);
  
      return this._container;
    }
  
    onRemove() {
      this._container.parentNode.removeChild(this._container);
      this._map = undefined;
    }
  }

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
      interactiveLayerIds: [],
      mode: null,
      maploaded: false,
    }
    
    constructor(props) {
        super(props);
        this.mapRef = React.createRef();
        this.popupRef = React.createRef();

        this.icons = require("../constants/icons.json");
        this.baselayerLine = require("../constants/baselayer-line.json");
        this.baselayerFill = require("../constants/baselayer-fill.json");

        this.pitchtoggle = new PitchToggle({mapcontainer: this, pitch: 70});

        this.state.lat = props.lat;
        this.state.lng = props.lng;
        this.state.zoom = props.zoom;  
        this.state.pitch = props.pitch;
        this.state.bearing = props.bearing;

        var devicePixelRatio = parseInt(window.devicePixelRatio || 1);
        var logo = new Image();
        if (devicePixelRatio === 1) {
          logo.src = "/static/assets/media/positive-farms-glow.png";
        } else if (devicePixelRatio === 2) {
          logo.src = "/static/assets/media/positive-farms-glowx2.png";
        } else if (devicePixelRatio === 3) {
          logo.src = "/static/assets/media/positive-farms-glowx3.png";
        } else if (devicePixelRatio === 4) {
          logo.src = "/static/assets/media/positive-farms-glowx4.png";
        }
    
        this.state.logo = logo;
    
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

        var gl = event.target.painter.context.gl;
        var canvas = event.target.getCanvas();
    
        // Have to do some involved gl drawing to set background colour on transparency
        gl.viewport(0,0,canvas.width,canvas.height);
        gl.enable( gl.BLEND );
        gl.blendEquation( gl.FUNC_ADD );
        gl.blendFunc( gl.ONE_MINUS_DST_ALPHA, gl.DST_ALPHA );
        if (!initShaders(gl)) {
          console.log('Failed to intialize shaders.');
          return;
        }
    
        var n = initVertexBuffers(gl);
        if (n < 0) {
          console.log('Failed to set the positions of the vertices');
          return;
        }
    
        gl.drawArrays(gl.TRIANGLES, 0, n);
    
        if (this.props.recording) {
          if (this.state.logo) {
            renderImage(gl, this.state.logo);
          }  
        }
    }
      
    onLoad = (event) => {

        var map = this.mapRef.current.getMap();

        var loadicons = [...this.icons];
        loadicons.push('default');
        for(let i = 0; i < loadicons.length; i++) {
            let icon = loadicons[i];
            var url = process.env.PUBLIC_URL + '/icons/' + icon + ".png?cacheblock=true";
            map.loadImage(url, (error, image) => {
                if (error) throw error;
                map.addImage('internal-' + icon, image);
            });            
        }
        this.props.onSetMap(map);

        map.addControl(this.pitchtoggle, 'top-left'); 
        map.addControl(this.props.mapdraw, 'top-left');   

        // Restyle to deal with using maplibre-gl and not mapbox-gl
        document.getElementsByClassName('mapboxgl-ctrl-group')[0].classList.add('maplibregl-ctrl');                      
        document.getElementsByClassName('mapboxgl-ctrl-group')[0].classList.add('maplibregl-ctrl-group');                      

        map.on('draw.modechange', (mode) => {
            // console.log("modechange", mode);
            this.setState({mode: mode.mode})
        });
        map.on('draw.delete', (data) => {
            this.props.onDataChange(data, this.state.mode);
        });
        map.on('draw.selectionchange', (data) => {this.props.onSelectionChange(data)});    
        map.on('draw.create', (data) => {
            // Add string id to properties so we can use setFeatureState via promoteId
            var feature = data.features[0];
            feature.properties['id'] = feature.id;
            this.props.mapdraw.delete(feature.id);
            this.props.mapdraw.add(feature);
            this.props.onDataChange(data, this.state.mode);
        });

        this.setState({maploaded: true});
    }
  
    getPrevLayer = (index) => {
        let prevlayer = null;
        if (index === 0) prevlayer = 'highlight-active-points.cold';
        else prevlayer = (index - 1).toString();
        return prevlayer;
    }

    amendStyleForInteraction = (visible, index, style) => {
        let JSONstyle = JSON.stringify(style);
        let newstyle = JSON.parse(JSONstyle);
        let prevlayer = null;
        if (index === 0) prevlayer = 'highlight-active-points.cold';
        else prevlayer = (index - 1).toString() + "_line";
        if (style.id === 'symbol-label') prevlayer = 'highlight-active-points.cold';
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
                if (newstyle['type'] === 'symbol') {
                    newstyle['paint'] = {
                        "icon-opacity": 0.1,
                        "text-opacity": 0.1
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
                if (newstyle['type'] === 'symbol') {
                    newstyle['paint'] = {
                        "icon-opacity": 0,
                        "text-opacity": 0
                    }
                }
            }
        }
        if (newstyle['paint'] !== undefined) {
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
            if (newstyle['paint']['icon-opacity'] !== undefined) {
                newstyle['paint']['icon-opacity'] = [
                    "case",
                    ["boolean", ["feature-state", "active"], false],
                    0,
                    newstyle['paint']['icon-opacity']                        
                ]
            }
        }

        return {prevlayer: prevlayer, style: newstyle};
    }

    amendStyleForAnimation = (index, style) => {
        let JSONstyle = JSON.stringify(style);
        let newstyle = JSON.parse(JSONstyle);
        let prevlayer = null;
        if (index === 0) prevlayer = 'highlight-active-points.cold';
        else prevlayer = (index - 1).toString() + "_line";
        newstyle.id = index.toString() + "_" + newstyle.id;
        
        newstyle['transition'] = {duration: 1000, delay: 0}
        if (newstyle['type'] === 'line') newstyle['paint']['line-opacity'] = 0;
        if (newstyle['type'] === 'fill') newstyle['paint']['fill-opacity'] = 0;
        if (newstyle['type'] === 'symbol') {
            newstyle['paint']['text-opacity'] = 0;
            newstyle['paint']['icon-opacity'] = 0;
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
        // Don't select features while drawing new features
        if (["draw_point", "draw_line_string", "draw_polygon"].includes(this.state.mode)) {
            return true;
        } 
        else {
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
            // terrain={{source: "terrainSource", exaggeration: 1.1 }}
            mapStyle={this.props.global.satellite ? 
                (require(isDev() ? '../constants/terrainstyletest.json' : '../constants/terrainstyle.json')) : 
                (require(isDev() ? '../constants/mapstyletest.json' : '../constants/mapstyle.json'))
              }    
          >
  
            <GeolocateControl position="top-left" />  
            <NavigationControl visualizePitch={true} position="top-left" />     

            {((this.props.global.entity !== null) && (this.state.maploaded)) ? (
                <>
                {(this.props.animationshow) ? (
                    <>
                    {this.props.layers.map((layer, index) => {
                        return (
                            <div key={index.toString()}>
                                <Source key={index} id={index.toString()} promoteId="id" type="geojson" data={layer.featurecollection} >
                                    {layer.styles.map((style, styleindex) => {
                                        var localstyle = this.amendStyleForAnimation(index, style);
                                        return (<Layer key={localstyle.style.id} {...localstyle.style} beforeId={localstyle.prevlayer} />);
                                    })}
                                </Source>
                            </div>
                        )
                    })}
                    </>
                ) : (
                    <>
                    {this.props.layers.map((layer, index) => {
                        return (
                            <div key={index.toString()}>
                                <Source key={index} id={index.toString()} promoteId="id" type="geojson" data={layer.featurecollection}>
                                    {layer.styles.map((style, styleindex) => {
                                        var localstyle = this.amendStyleForInteraction(layer.visible, index, style);
                                        return (<Layer key={localstyle.style.id} {...localstyle.style} beforeId={localstyle.prevlayer} />);
                                    })}
                                </Source>
                            </div>
                        )
                    })}
                    </>
                ) }

                {(this.props.layers.length === 0) ? (
                    <Source id="base-layer" type="geojson" data={this.props.global.entity.geojson} >
                        <Layer {...this.baselayerFill} />
                        <Layer {...this.baselayerLine} />
                    </Source>
                ) : (
                    <Source id="base-layer" type="geojson" data={this.props.global.entity.geojson} >
                        <Layer {...this.baselayerFill} beforeId={(this.props.layers.length - 1).toString() + "_line"} />
                        <Layer {...this.baselayerLine} beforeId={(this.props.layers.length - 1).toString() + "_line"} />
                    </Source>
                )}
                </>
            ) : null }


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

export const mapStateToProps = state => {
    return {
        global: state.global,
    }
}
    
export const mapDispatchToProps = dispatch => {
    return {
        setGlobalState: (globalstate) => {
            return dispatch(global.setGlobalState(globalstate));
        },  
    }
}  
  
export default withRouter(connect(mapStateToProps, mapDispatchToProps)(MapContainer));
