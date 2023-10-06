/**
 * BasicPage.js
 * 
 * Default page
 */ 

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from '../redux/functions/withRouter';
import { global } from "../redux/actions";
import { 
  IonButtons, 
  IonContent, 
  IonSplitPane, 
  IonHeader, 
  IonFooter,
  IonIcon,
  IonButton,
  IonMenu, 
  IonList,
  IonItem,
  IonReorderGroup, 
  IonPage, 
  IonToolbar,
  IonAlert,
  IonInput
} from '@ionic/react';
import { 
  people,
  trashOutline, 
  duplicateOutline, 
  addOutline, 
  pushOutline, 
  downloadOutline,
  videocamOutline, 
  settingsOutline,
  exitOutline,
  bugOutline,
  playOutline,
  pauseOutline,
  stopOutline,
  play,
  pause,
  stop
} from 'ionicons/icons';
import { createGesture } from '@ionic/react';
import { ContentState, convertToRaw } from 'draft-js';
import { EditorState } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import queryString from "query-string";
import { v4 as uuidv4 } from 'uuid';
import { Timeline, TimelineState } from '@xzdarcy/react-timeline-editor';

import { EXTERNAL_HOMEPAGE } from "../constants";
import SiteProperties from './SiteProperties';
import Layer from './Layer';
import AnimationLayer from './AnimationLayer';
import LayerProperties from './LayerProperties';
import MapContainer from './MapContainer';

export const isDev = () =>  !process.env.NODE_ENV || process.env.NODE_ENV === 'development';


const mockEffect = {
effect0: {
  id: "effect0",
  name: "效果0",
},
effect1: {
  id: "effect1",
  name: "效果1",
},
};


class Editor extends Component {

  state = {
    name: "Untitled plan",
    layers: [],
    selected: null,
    map: null,
    mapdraw: null,
    featuresselected: [],
    layerselected: null,
    layerproperties: {},
    layerpropertiesshow: false,
    siteproperties: {},
    sitepropertiesshow: false,
    sitepropertiescancel: true,
    editorState: null,
    siteanimateshow: false,
    animationdata: [],
  }

  constructor(props) {
    super(props);
    this.timelineRef = React.createRef();
    this.tracksRef = React.createRef();
    this.workingWidth = 300;
    this.startingWidth = 300;
    this.state.layers = [JSON.parse(JSON.stringify(require("../constants/defaultlayer.json")))];
    this.animation = require("../constants/testanimation.json");
    this.state.editorState = EditorState.createEmpty();
    this.mapdrawStyles = require("../constants/mapdrawstyles.json");
    this.mapdraw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
          point: true, 
          line_string: true, 
          polygon: true, 
          trash: true
      },
      userProperties: true,
      styles: this.mapdrawStyles
    });

  }

  getUniqueID = () => {
    let id = uuidv4();
    return id.replaceAll('-', '');
  }

  updateAnimationData = (layers) => {
    var animationdata = [];
    var actions = {};
    for(let i = 0; i < this.state.animationdata.length; i++) {
      actions[this.state.animationdata[i].id] = this.state.animationdata[i];
    }
    for(let i = 0; i < layers.length; i++) {
      var layerid = layers[i].id;
      if (layerid in actions) animationdata.push(actions[layerid]);
      else animationdata.push({id: layerid, actions: []});
    }
    this.setState({animationdata: animationdata});
  }

  setAnimationData = (animationdata) => {
    console.log(animationdata);
    this.setState({animationdata: animationdata});
  }

  addAnimationData = (e, row, time) => {
    var animationdata = this.state.animationdata;
    var newAction = {
      id: this.getUniqueID(),
      start: time,
      end: time + 0.5,
      effectId: "effect0"
    } 
    for(let i = 0; i < animationdata.length; i++) {
      // If time is within existing action then remove it
      if (animationdata[i].id == row.id) {
        var existingsegment = false;
        var newactions = [];
        for(let j = 0; j < animationdata[i].actions.length; j++) {
          if ((time > animationdata[i].actions[j].start) && 
              (time < animationdata[i].actions[j].end)) existingsegment = true;
          else newactions.push(animationdata[i].actions[j]);
        }
        if (!existingsegment) newactions.push(newAction);
        animationdata[i].actions = newactions;
      }
      
    }
    this.setState({animationdata: animationdata});
  }

  getAnimationEnd = () => {
    var end = 0;
    var animationdata = this.state.animationdata;
    for(let i = 0; i < animationdata.length; i++) {
      for(let j = 0; j < animationdata[i].actions.length; j++)
        if (animationdata[i].actions[j].end > end) end = animationdata[i].actions[j].end;
    }
    return end;
  }

  initialSitePropertiesShow = () => {
    var siteproperties = {
      name: this.props.global.name,
      public: this.props.global.public,
      entityid: (this.props.global.entity === null) ? null : this.props.global.entity.id
    };
    this.setState({siteproperties: siteproperties, sitepropertiesshow: true, sitepropertiescancel: false});
  }

  sitePropertiesShow = () => {
    var siteproperties = {
      name: this.props.global.name,
      public: this.props.global.public,
      entityid: (this.props.global.entity === null) ? null : this.props.global.entity.id
    };
    this.setState({siteproperties: siteproperties, sitepropertiesshow: true, sitepropertiescancel: true});
  }

  sitePropertiesSet = (event) => {
    var name = event.target.name;
    var value = event.target.value;
    if (event.target.nodeName === 'ION-TOGGLE') value = !this.state.siteproperties[name];
    var siteproperties = {...this.state.siteproperties};
    siteproperties[name] = value;
    this.setState({siteproperties: siteproperties});
  }

  sitePropertiesClose = () => {
    this.setState({sitepropertiesshow: false});
  }

  siteAnimateToggle = () => {
    this.setState({siteanimateshow: !this.state.siteanimateshow});
  }

  planSave = (redirect) => {
    var center = this.state.map.getCenter();
    var plan = {
      id: this.props.global.id,
      name: this.props.global.name,
      entityid: this.props.global.entityid,
      public: this.props.global.public,
      data: {
        zoom: this.state.map.getZoom(),
        bearing: this.state.map.getBearing(),
        pitch: this.state.map.getPitch(),
        lat: center.lat,
        lng: center.lng,
        satellite: this.props.global.satellite,
        layers: this.state.layers
      }
    };
    this.props.savePlan(plan).then(() => {
      toast.success('Plan saved');
      if (redirect) {
        document.location = EXTERNAL_HOMEPAGE;
      }
    })
  }

  onVerticalStart = (ev) => {
    ev.event.stopPropagation();
  }

  onVerticalMove = (ev) => {
    requestAnimationFrame(() => {
      this.workingWidth = this.startingWidth - ev.deltaX;
      this.splitPane.style.setProperty('--side-width', `${this.workingWidth}px`);
    });
    ev.event.stopPropagation();
  }
  
  onVerticalEnd = (ev) => {
    this.startingWidth = this.workingWidth;
  }
  
  componentDidMount = () => {
    this.splitPane = document.querySelector('ion-split-pane');
    const divider = document.querySelector('.vertical-divider');
    const gesture = createGesture({
      name: 'resize-menu',
      el: divider,
      onStart: this.onVerticalStart,
      onEnd: this.onVerticalEnd,
      onMove: this.onVerticalMove,
    });    
    gesture.enable(true);
  }

  dumpData = () => {
    console.log("this.state.layers", this.state.layers);
    console.log("mapbox-gl-draw", this.mapdraw.getAll());
    console.log("featuresselected", this.state.featuresselected);
    console.log("animationdata", this.state.animationdata);
  }

  onSetMap = (map) => {
    let params = queryString.parse(this.props.router.location.search);
    this.setState({map: map});
    this.props.setGlobalState({map: map});
    this.props.fetchEntities().then(() => {

      // Check if planid included in url params
      if ('planid' in params) {
        toast.success('Loading plan...');

        this.props.fetchPlan(params['planid']).then(() => {
          let layers = [];
          if ('layers' in this.props.global.data) layers = this.props.global.data.layers;
          this.setState({layers: layers});
          this.updateAnimationData(layers);

          if (this.props.global.entityid === null) {
            this.initialSitePropertiesShow();
            if ('zoom' in this.props.global.data) map.jumpTo({zoom: this.props.global.data.zoom});
            if ('pitch' in this.props.global.data) map.jumpTo({pitch: this.props.global.data.pitch});
            if ('bearing' in this.props.global.data) map.jumpTo({bearing: this.props.global.data.bearing});
            if ('satellite' in this.props.global.data) {
              this.props.setGlobalState({satellite: this.props.global.data['satellite']});
              if (this.props.global.data['satellite']) {
                document.getElementById('pitchtoggle').classList.remove('maplibregl-ctrl-pitchtoggle-3d');
                document.getElementById('pitchtoggle').classList.add('maplibregl-ctrl-pitchtoggle-2d');  
              }
            }
            if (('lat' in this.props.global.data) && ('lng' in this.props.global.data)) {
              map.jumpTo({center: [this.props.global.data['lng'], this.props.global.data['lat']]});
            }  
          }
          else this.props.fetchEntity(this.props.global.entityid).then(() => {
            // Set zoom, pitch, bearing, satellite after initial entity load to ensure we have correct maxbounds
            if ('zoom' in this.props.global.data) map.jumpTo({zoom: this.props.global.data.zoom});
            if ('pitch' in this.props.global.data) map.jumpTo({pitch: this.props.global.data.pitch});
            if ('bearing' in this.props.global.data) map.jumpTo({bearing: this.props.global.data.bearing});
            if ('satellite' in this.props.global.data) {
              this.props.setGlobalState({satellite: this.props.global.data['satellite']});
              if (this.props.global.data['satellite']) {
                document.getElementById('pitchtoggle').classList.remove('maplibregl-ctrl-pitchtoggle-3d');
                document.getElementById('pitchtoggle').classList.add('maplibregl-ctrl-pitchtoggle-2d');
              }
            }
            if (('lat' in this.props.global.data) && ('lng' in this.props.global.data)) {
              map.jumpTo({center: [this.props.global.data['lng'], this.props.global.data['lat']]});
            }  
          });

        })
      } else {
        if ((this.props.global.entity === null) && (this.props.global.entities.length !== 0)) {
          this.initialSitePropertiesShow();
        }
        this.setState({layers: []});
      }
    });
  }

  onSelectionChange = (data) => {
    this.clearSelectedFeatures();
    if ((data.features.length > 0) && (this.state.selected !== null)) {
      var featuresselected = [];
      for(let i = 0; i < data.features.length; i++) {
        this.state.map.setFeatureState(
          { source: this.state.selected.toString(), id: data.features[i]['id'] },
          { active: true }
        );
        featuresselected.push(data.features[i]['id']);
      }
      this.setState({layerselected: this.state.selected.toString(), featuresselected: featuresselected});
    }  
    this.onDataChange(data, null);    
  }

  clearSelectedFeatures = () => {
    if (this.state.layerselected !== null) {
      for(let i = 0; i < this.state.featuresselected.length; i++) {
        this.state.map.setFeatureState(
          { source: this.state.layerselected, id: this.state.featuresselected[i] },
          { active: false }
        );
      }
      this.setState({layerselected: null, featuresselected: []});
    }
  }

  onDataChange = (data, mode) => {
    if (this.state.selected !== null) {
      var featurecollection = this.mapdraw.getAll();
      var layers = [...this.state.layers];
      layers[this.state.selected]['featurecollection'] = featurecollection;
      this.setState({layers: layers});
    } else {
      if (["draw_point", "draw_line_string", "draw_polygon"].includes(mode)) {
        this.selectDefaultLayer();
        this.mapdraw.add(data.features[0]);
      }
    }
  }

  onSetSelected = (layerId, featureId) => {
    this.setSelected(layerId);
    var feature = this.mapdraw.get(featureId);
    if (feature.geometry.type !== 'Point') this.mapdraw.changeMode('simple_select', {featureIds: [featureId]});
  }

  setSelected = (index) => {
   this.clearSelectedFeatures();
    if (this.state.selected !== null) {
      var featurecollection = this.mapdraw.getAll();
      var layers = [...this.state.layers];
      layers[this.state.selected]['featurecollection'] = featurecollection;
      this.setState({layers: layers});
    }
    if (index === null) {
      this.mapdraw.deleteAll();
    } else {
      this.mapdraw.set(this.state.layers[index]['featurecollection']);
    }
    this.setState({selected: index});
  }

  selectDefaultLayer = (mode) => {
    if (this.state.layers.length === 0) {
      var layers = this.state.layers;
      layers.push(JSON.parse(JSON.stringify(require("../constants/defaultlayer.json"))));
      this.setState({layers: layers});
    }
    if (this.state.selected === null) this.setSelected(0);
  }

  // Layer-specific UI

  mapdrawDeactivate = () => {
    this.mapdraw.changeMode('simple_select', {featureIds: []});
    this.setSelected(this.state.selected);
  }

  layerAdd = (event) => {
    this.mapdrawDeactivate();
    var layers = [...this.state.layers];
    var defaultlayer = require("../constants/defaultlayer.json");
    defaultlayer.id = this.getUniqueID();
    layers.push({...defaultlayer});
    this.setState({layers: layers});    
    this.updateAnimationData(layers);
  }

  layerDuplicate = (event) => {
    this.mapdrawDeactivate();
    var layers = [...this.state.layers];
    if (this.state.selected !== null) {
      var layer = JSON.parse(JSON.stringify(layers[this.state.selected]));
      layer.name = "Copy of " + layer.name;
      layer.id = this.getUniqueID();
      for(let i = 0; i < layer.featurecollection.features.length; i++) {
        var featureid = this.getUniqueID();
        layer.featurecollection.features[i]['id'] = featureid;
        layer.featurecollection.features[i]['properties']['id'] = featureid;
      }

      layers.push(layer);
      this.setState({layers: layers});
      this.updateAnimationData(layers);      
      // this.setSelected(layers.length - 1);
    }
  }

  layerDelete = (event) => {
    var layers = [...this.state.layers];
    if (this.state.selected !== null) {
      layers.splice(this.state.selected, 1);
      if (this.state.layerselected === this.state.selected) this.clearSelectedFeatures();
      this.setState({layers: layers, selected: null});  
      this.mapdraw.deleteAll();
    }
  }

  layerEdit = (key) => {
    var layer = {...this.state.layers[key]}
    var layerproperties = {};
    let colorline = '';
    let colorfill = '';
    let opacityline = 1;
    let opacityfill = 1;
    let widthline = 0;
    let iconsize = 100;

    layerproperties.name = layer.name;
    if (layer.title === undefined) layerproperties.title = '';
    else layerproperties.title = layer.title;
    if (layer.content === undefined) layerproperties.content = '';
    else layerproperties.content = layer.content;
    if (layer.iconurl === undefined) layerproperties.iconurl = '';
    else layerproperties.iconurl = layer.iconurl;
    if (layer.iconinternal === undefined) layerproperties.iconinternal = '';
    else layerproperties.iconinternal = layer.iconinternal;

    const contentBlock = htmlToDraft(layerproperties.content);
    if (contentBlock) {
      const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
      const editorState = EditorState.createWithContent(contentState);
      this.setState({editorState: editorState});
    }

    for(let i = 0; i < layer.styles.length; i++) {
      if (layer.styles[i]['type'] === 'line') {
        colorline = layer.styles[i]['paint']['line-color'];
        opacityline = layer.styles[i]['paint']['line-opacity'];
        widthline = layer.styles[i]['paint']['line-width'];
      }
      if (layer.styles[i]['type'] === 'fill') {
        colorfill = layer.styles[i]['paint']['fill-color'];
        opacityfill = layer.styles[i]['paint']['fill-opacity'];
      }
      if (layer.styles[i]['type'] === 'symbol') {
        iconsize = 100 * layer.styles[i]['layout']['icon-size'];
      }
    }

    layerproperties.colorline = colorline;
    layerproperties.colorfill = colorfill;
    layerproperties.opacityline = opacityline;
    layerproperties.opacityfill = opacityfill;
    layerproperties.widthline = widthline;
    layerproperties.iconsize = iconsize;

    this.setState({selected: key, layerpropertiesshow: true, layerproperties: layerproperties});
  }

  onEditorStateChange = (editorState) => {
    this.setState({editorState: editorState});
  }

  layerEditProperty = (property, value) => {
    var layerproperties = {...this.state.layerproperties};
    layerproperties[property] = value;
    this.setState({layerproperties: layerproperties});
  }

  layerEditCancel = () => {
    this.setState({layerpropertiesshow: false});
  }

  layerEditSubmit = () => {
    if (this.state.selected !== null) {
      var currlayer = this.state.layers[this.state.selected];
      currlayer.name = this.state.layerproperties.name;
      currlayer.title = this.state.layerproperties.title;
      currlayer.content = draftToHtml(convertToRaw(this.state.editorState.getCurrentContent()));
      currlayer.iconurl = this.state.layerproperties.iconurl;
      currlayer.iconinternal = this.state.layerproperties.iconinternal;
      if (currlayer.iconinternal === "") currlayer.iconinternal = "default";

      for (let i = 0; i < currlayer.styles.length; i++) {
        if (currlayer.styles[i]['type'] === 'line') {
          currlayer.styles[i]['paint']['line-color'] = this.state.layerproperties.colorline;
          currlayer.styles[i]['paint']['line-width'] = parseInt(this.state.layerproperties.widthline);
          currlayer.styles[i]['paint']['line-opacity'] = parseFloat(this.state.layerproperties.opacityline);
        }
        if (currlayer.styles[i]['type'] === 'fill') {
          currlayer.styles[i]['paint']['fill-color'] = this.state.layerproperties.colorfill;
          currlayer.styles[i]['paint']['fill-opacity'] = parseFloat(this.state.layerproperties.opacityfill);
        }
        if (currlayer.styles[i]['type'] === 'symbol') {
          currlayer.styles[i]['layout']['icon-size'] = parseFloat(this.state.layerproperties.iconsize / 100);
          if (currlayer.iconurl === "") {
            currlayer.styles[i]['layout']['icon-image'] = "internal-" + currlayer.iconinternal;
          } else {
            // ** This won't work when layers are reordered - need to use unique layer ID
            // this.state.map.loadImage(currlayer.iconurl, (error, image) => {
            //     if (error) throw error;
            //     this.state.map.addImage('external-' + this.state.selected.toString(), image);
            // });            
            // currlayer.styles[i]['layout']['icon-image'] = "external-" + this.state.selected.toString();
          }
        }
      }  

      var layers = this.state.layers;
      layers[this.state.selected] = currlayer;
      this.setState({layers: layers});
    }
    this.setState({layerpropertiesshow: false});
  }

  handleReorder = (event) => {
    var newlayers = event.detail.complete(this.state.layers);    
    this.setState({layers: newlayers});
    this.updateAnimationData(newlayers);
    if (this.state.selected !== null) {
      if (event.detail.from === this.state.selected) this.setState({selected: event.detail.to});
      else {
        if ((this.state.selected >= event.detail.to) && (event.detail.from > this.state.selected)) {
          this.setState({selected: this.state.selected + 1});
        } 
        if ((this.state.selected > event.detail.from) && (event.detail.to >= this.state.selected)) {
          this.setState({selected: this.state.selected - 1});
        }    
      }
    }
  }

  addLayerStylesToDraw = (layerstyles) => {

    var linestyle = null;
    var fillstyle = null;
    for(let i = 0; i < layerstyles.length; i++) {
      if (layerstyles[i]['type'] === 'line') linestyle = layerstyles[i]['paint']
      if (layerstyles[i]['type'] === 'fill') fillstyle = layerstyles[i]['paint']
    }

    for(let i = 0; i < this.mapdrawStyles.length; i++) {
      if (['gl-draw-line-static', 'gl-draw-polygon-stroke-static'].includes(this.mapdrawStyles[i]['id'])) {
        this.mapdrawStyles[i]['paint'] = linestyle;
      }
      if (['gl-draw-polygon-fill-static'].includes(this.mapdrawStyles[i]['id'])) {
        this.mapdrawStyles[i]['paint'] = fillstyle;
      }
    }

    return this.mapdrawStyles;
  }

  toggleVisibility = (key) => {
    var existinglayers = this.state.layers;
    existinglayers[key].visible = !existinglayers[key].visible;
    this.setState({layers: existinglayers});
  }

  onClick = (event, key) => {
    this.setSelected(key);
    event.stopPropagation();
  }

  onNameChange = (e) => {
    this.props.setGlobalState({name: e.detail.value});   
  };

  deselectLayers = () => {
    this.setSelected(null);
  }

  GeoJSONUpload = (separatelayers) => {
    this.setState({separatelayers: separatelayers});
    document.getElementById('GeoJSONUpload').click();
  }

  onGeoJSONUpload = (event) => {
    let defaultlayerText = JSON.stringify(require("../constants/defaultlayer.json"));

    for (let file of event.target.files){
      (new Blob([file])).text().then((GeoJSONContent) => {
        let featurecollections = JSON.parse(GeoJSONContent);
        // If single featurecollections, convert to array of featurecollections
        if (!Array.isArray(featurecollections)) featurecollections = [featurecollections];        
        let layers = this.state.layers;
  
        if (this.state.separatelayers) {
          // Create separate layer for each featurecollection
          // This allows per-featurecollection styling through layer-specific stylesheet
          for(let i = 0; i < featurecollections.length; i++) {
            let defaultlayer = JSON.parse(defaultlayerText);      
            if (featurecollections[i]['properties']['id'] !== undefined) defaultlayer.id = featurecollections[i]['properties']['id'];
            else defaultlayer.id = this.getUniqueID(); 
            if (featurecollections[i]['properties']['name'] !== undefined) defaultlayer.name = featurecollections[i]['properties']['name'];
            else defaultlayer.name = "Imported layer";
            if (featurecollections[i]['properties']['visible'] !== undefined) defaultlayer.visible = featurecollections[i]['properties']['visible'];
            if (featurecollections[i]['properties']['title'] !== undefined) defaultlayer.title = featurecollections[i]['properties']['title'];
            if (featurecollections[i]['properties']['content'] !== undefined) defaultlayer.content = featurecollections[i]['properties']['content'];
            // We assume line style is style[0], fill style is style[1] and symbol style is style[2]
            if (featurecollections[i]['properties']['line-color'] !== undefined) defaultlayer.styles[0]['paint']['line-color'] = featurecollections[i]['properties']['line-color'];
            if (featurecollections[i]['properties']['line-width'] !== undefined) defaultlayer.styles[0]['paint']['line-width'] = featurecollections[i]['properties']['line-width'];
            if (featurecollections[i]['properties']['line-opacity'] !== undefined) defaultlayer.styles[0]['paint']['line-opacity'] = featurecollections[i]['properties']['line-opacity'];
            if (featurecollections[i]['properties']['fill-color'] !== undefined) defaultlayer.styles[1]['paint']['fill-color'] = featurecollections[i]['properties']['fill-color'];
            if (featurecollections[i]['properties']['fill-opacity'] !== undefined) defaultlayer.styles[1]['paint']['fill-opacity'] = featurecollections[i]['properties']['fill-opacity'];
            if (featurecollections[i]['properties']['icon-size'] !== undefined) defaultlayer.styles[2]['layout']['icon-size'] = featurecollections[i]['properties']['icon-size'];
            if (featurecollections[i]['properties']['iconinternal'] !== undefined) {
              defaultlayer.iconinternal = featurecollections[i]['properties']['iconinternal'];
              defaultlayer.styles[2]['layout']['icon-image'] = "internal-" + featurecollections[i]['properties']['iconinternal'];
            }
            // Need to implement iconurl so it loads image on layer with correct layer id
            delete featurecollections[i]['properties']['id'];
            delete featurecollections[i]['properties']['name'];
            delete featurecollections[i]['properties']['visible'];
            delete featurecollections[i]['properties']['title'];
            delete featurecollections[i]['properties']['content'];
            delete featurecollections[i]['properties']['line-color'];
            delete featurecollections[i]['properties']['line-width'];
            delete featurecollections[i]['properties']['line-opacity'];
            delete featurecollections[i]['properties']['fill-color'];
            delete featurecollections[i]['properties']['fill-opacity'];
            delete featurecollections[i]['properties']['icon-size'];
            delete featurecollections[i]['properties']['iconinternal'];
            for(let j = 0; j < featurecollections[i].features.length; j++) {
              if (!('properties' in featurecollections[i].features[j])) featurecollections[i].features[j]['properties'] = {};
              let featureid = this.getUniqueID();
              featurecollections[i].features[j]['id'] = featureid;
              featurecollections[i].features[j]['properties']['id'] = featureid;                        
            }
            defaultlayer['featurecollection']['features'] = featurecollections[i].features;
            layers.push(defaultlayer);
          }
        } else {

          // We take possible layer properties from first feature - though many properties may be blank
          let defaultlayer = JSON.parse(defaultlayerText);  
          var allfeatures = [];      
          if (featurecollections[0]['properties']['name'] !== undefined) defaultlayer.name = featurecollections[0]['properties']['name'];
          else defaultlayer.name = "Imported layer";
          if (featurecollections[0]['properties']['id'] !== undefined) defaultlayer.id = featurecollections[0]['properties']['id'];
          else defaultlayer.id = this.getUniqueID(); 
          if (featurecollections[0]['properties']['visible'] !== undefined) defaultlayer.visible = featurecollections[0]['properties']['visible'];
          if (featurecollections[0]['properties']['title'] !== undefined) defaultlayer.title = featurecollections[0]['properties']['title'];
          if (featurecollections[0]['properties']['content'] !== undefined) defaultlayer.content = featurecollections[0]['properties']['content'];
          // We assume line style is style[0], fill style is style[1], and symbol style is style[2]
          if (featurecollections[0]['properties']['line-color'] !== undefined) defaultlayer.styles[0]['paint']['line-color'] = featurecollections[0]['properties']['line-color'];
          if (featurecollections[0]['properties']['line-width'] !== undefined) defaultlayer.styles[0]['paint']['line-width'] = featurecollections[0]['properties']['line-width'];
          if (featurecollections[0]['properties']['line-opacity'] !== undefined) defaultlayer.styles[0]['paint']['line-opacity'] = featurecollections[0]['properties']['line-opacity'];
          if (featurecollections[0]['properties']['fill-color'] !== undefined) defaultlayer.styles[1]['paint']['fill-color'] = featurecollections[0]['properties']['fill-color'];
          if (featurecollections[0]['properties']['fill-opacity'] !== undefined) defaultlayer.styles[1]['paint']['fill-opacity'] = featurecollections[0]['properties']['fill-opacity'];
          if (featurecollections[0]['properties']['icon-size'] !== undefined) defaultlayer.styles[2]['layout']['icon-size'] = featurecollections[0]['properties']['icon-size'];
          if (featurecollections[0]['properties']['iconinternal'] !== undefined) {
            defaultlayer.iconinternal = featurecollections[0]['properties']['iconinternal'];
            defaultlayer.styles[2]['layout']['icon-image'] = "internal-" + featurecollections[0]['properties']['iconinternal'];
          }

          for(let i = 0; i < featurecollections.length; i++) {
            delete featurecollections[i]['properties']['id'];
            delete featurecollections[i]['properties']['name'];
            delete featurecollections[i]['properties']['visible'];
            delete featurecollections[i]['properties']['title'];
            delete featurecollections[i]['properties']['content'];
            delete featurecollections[i]['properties']['line-color'];
            delete featurecollections[i]['properties']['line-width'];
            delete featurecollections[i]['properties']['line-opacity'];
            delete featurecollections[i]['properties']['fill-color'];
            delete featurecollections[i]['properties']['fill-opacity'];  
            delete featurecollections[i]['properties']['icon-size'];
            delete featurecollections[i]['properties']['iconinternal'];
            for(let j = 0; j < featurecollections[i].features.length; j++) {
              if (!('properties' in featurecollections[i].features[j])) featurecollections[i].features[j]['properties'] = {};
              let featureid = this.getUniqueID();
              featurecollections[i].features[j]['id'] = featureid;
              featurecollections[i].features[j]['properties']['id'] = featureid;                        
              allfeatures.push(featurecollections[i].features[j]);       
            }
          }

          defaultlayer['featurecollection']['features'] = allfeatures;
          layers.push(defaultlayer);
        }
  
        this.setState({layers: layers});
        document.getElementById('GeoJSONUpload').value = "";  
      });
    }        
  }

  GeoJSONDownload = () => {
    var layers = this.state.layers;
    var OutputJSONFeatureCollections = []

    // Push all layer properties into 'properties' field of each GeoJSON featurecollection
    // in order to create GeoJSON-standardised file
    for(let i = 0; i < layers.length; i++) {
      var properties = {};
      var currlayer = layers[i];
      var featurecollection = JSON.parse(JSON.stringify(currlayer.featurecollection));
      properties.name = currlayer.name;
      properties.visible = currlayer.visible;
      properties.title = currlayer.title;
      properties.content = currlayer.content;
      properties.iconinternal = currlayer.iconinternal;
      properties.iconurl = currlayer.iconurl;

      for(let j = 0; j < currlayer.styles.length; j++) {
        if (currlayer.styles[j]['type'] === 'line') {
          properties['line-color'] = currlayer.styles[j]['paint']['line-color'];
          properties['line-width'] = currlayer.styles[j]['paint']['line-width'];
          properties['line-opacity'] = currlayer.styles[j]['paint']['line-opacity']
        }
        if (currlayer.styles[j]['type'] === 'fill') {
          properties['fill-color'] = currlayer.styles[j]['paint']['fill-color'];
          properties['fill-opacity'] = currlayer.styles[j]['paint']['fill-opacity'];
        }
        if (currlayer.styles[j]['type'] === 'symbol') {
          properties['icon-size'] = currlayer.styles[j]['layout']['icon-size'];
        }
      }

      var features = featurecollection['features'];
      delete featurecollection['features'];
      featurecollection['properties'] = properties;
      featurecollection['features'] = features;
      OutputJSONFeatureCollections.push(featurecollection);
    }

    let GeoJSON = JSON.stringify(OutputJSONFeatureCollections, null, 2);
    const anchor = document.createElement("a");
    anchor.href =  URL.createObjectURL(new Blob([GeoJSON], {type: "application/geo+json"}));
    const now = new Date();
    const timesuffix = now.toISOString().substring(0,19).replaceAll('T', ' ').replaceAll(':', '-');
    anchor.download = "positivefarms - " + timesuffix + ".geojson";
    anchor.click();
  }

  setData = (event) => {
    console.log(event);
  }

  render() {
    return (
      <>

      <IonPage>

        <Toaster position="top-center"  containerStyle={{top: 20}}/>

        <IonHeader>
          <IonToolbar>
            <IonItem>                            
              <IonInput value={this.props.global.name} label="Plan name" name="name" onIonChange={this.onNameChange} type="text" placeholder="Enter plan name" /> 
              <span onClick={() => this.sitePropertiesShow()} style={{width: "50%", textAlign: "right"}}>
                {(this.props.global.entity === null) ? null : this.props.global.entity.name }
                </span>
            </IonItem>
            <IonButtons slot="end">

                {this.props.global.public ? (
                <IonButton title="Publicly viewable" onClick={() => this.sitePropertiesShow()}>
                  <IonIcon color="danger" icon={people} />
                </IonButton>
                ) : null }

              <IonButton title="Animate plan" onClick={() => this.siteAnimateToggle()}>
                <IonIcon size="large" icon={videocamOutline} />
              </IonButton>

              <IonButton title="Site settings" onClick={() => this.sitePropertiesShow()}>
                <IonIcon icon={settingsOutline} />
              </IonButton>

              <IonButton 
                fill="solid" 
                shape="round" 
                color="success" 
                title="Save plan to server" 
                onClick={() => this.planSave(false)}>
                  &nbsp;Save&nbsp;
              </IonButton>

              <IonButton title="Exit planner" onClick={() => this.planSave(true)}>
                <IonIcon size="large" color="medium" icon={exitOutline} />
              </IonButton>

              {isDev() ? (
                <IonButton title="Dump data" onClick={() => this.dumpData()}>
                  <IonIcon size="large" color="medium" icon={bugOutline} />
                </IonButton>              
              ) : null}

            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">

          <SiteProperties 
                isOpen={this.state.sitepropertiesshow} 
                allowCancel={this.state.sitepropertiescancel}
                close={this.sitePropertiesClose} 
                state={this.state.siteproperties} 
                set={this.sitePropertiesSet} />


          <IonSplitPane when={true} contentId="mainpane">

            <div id="mainpane" style={{ height: "100vh", position: "relative" }}>
                <div style={{ height: "100%" }}>
                    <MapContainer 
                      onDataChange={this.onDataChange}
                      onSelectionChange={this.onSelectionChange}
                      onSetSelected={this.onSetSelected}
                      onSetMap={this.onSetMap}
                      mapdraw={this.mapdraw} 
                      selectDefaultLayer={this.selectDefaultLayer}
                      selected={this.state.selected} 
                      layers={this.state.layers} 
                      />
                </div>

                {this.state.siteanimateshow ? (
                  <div style={{ 
                      position: "absolute", 
                      bottom: "0px", 
                      left: "0px", 
                      height: "25%", 
                      width: "100%", 
                      zIndex: "2",
                      display: "flex",
                      backgroundColor: "#191b1d" }}>
                    
                    <div
                      ref={this.tracksRef}
                      className={"animation-tracks"}
                      style={{ 
                        width: '150px',
                        margin: "0px",
                        height: "100%",
                        flex: "0 1  auto",
                        overflow: "overlay",
                        overflowX: "hidden",
                        padding: "0px"
                      }}
                      onScroll={(e) => {
                        const target = e.target;
                        this.timelineRef.current.setScrollTop(target.scrollTop);
                      }} >
                        <div style={{
                          height: "42px",
                          margin: "0px 0px 0px 30px",
                        }}>
                          <IonIcon color="medium" size="large" title="Play" onClick={() => {
                            var endTime = this.getAnimationEnd();
                            if (endTime !== 0) this.timelineRef.current.play({toTime: endTime});
                          }} icon={play} />
                          <IonIcon color="medium" size="large" title="Pause" onClick={() => this.timelineRef.current.pause()} icon={pause} />
                          <IonIcon color="medium" size="large" title="Stop" onClick={() => {
                            this.timelineRef.current.pause(0);
                            this.timelineRef.current.setTime(0);
                            this.timelineRef.current.reRender();
                          }} icon={stop} />

                        </div>

                      {this.state.layers.map((layer, index) => {
                        return (
                          <div style={{
                            height: "31px",
                            padding: "0px",
                            width: "100%",
                            display: "flex",
                            justifyContent: "left",
                            alignItems: "middle",
                            color: "white",
                            fontSize: "80%",
                            borderBottom: "1px solid #333"
                          }} 
                          key={index}>
                            <div className="text" style={{
                              display: "flex",
                              justifyContent: "center",
                              alignContent: "center",
                              flexDirection: "column",
                              paddingLeft: "10px"
                            }}>{layer.name}</div>
                          </div>
                        );
                      })}
                    </div>
                    <Timeline
                      ref={this.timelineRef}
                      onChange={this.setAnimationData}
                      style = {{
                        height: "100%",
                        flex: "1 1 auto"
                      }}
                      editorData={this.state.animationdata}
                      effects={mockEffect}
                      onScroll={({ scrollTop }) => {this.tracksRef.current.scrollTop = scrollTop;}}
                      onDoubleClickRow={(e, {row, time}) => {this.addAnimationData(e, row, time)}}
                    />
                  </div>
                ) : null}

                <div className="vertical-divider"></div>                
            </div>

            <IonMenu side="end" contentId="mainpane">
              <IonContent onClick={this.deselectLayers} className="ion-padding">

              <LayerProperties 
                isOpen={this.state.layerpropertiesshow} 
                editorState={this.state.editorState}
                onEditorStateChange={this.onEditorStateChange}
                state={this.state.layerproperties} 
                set={this.layerEditProperty}
                cancel={this.layerEditCancel} 
                submit={this.layerEditSubmit} />

              <IonList>
                <IonReorderGroup disabled={false} onIonItemReorder={this.handleReorder}>

                  {this.state.layers.map((layer, index) => {
                      return (
                      <Layer 
                        key={index} 
                        selected={(this.state.selected === index)}
                        toggleVisibility={this.toggleVisibility} 
                        layerEdit={this.layerEdit}
                        onClick={this.onClick}
                        index={index} 
                        layer={layer} 
                        />)
                  })}

                </IonReorderGroup>

              </IonList>

              </IonContent>
              <IonFooter>
                <IonToolbar>
                  <IonItem>
                  <IonButtons slot="start">
                    <IonButton title="Add layer" onClick={() => this.layerAdd()}>
                      <IonIcon icon={addOutline} />
                    </IonButton>
                    {(this.state.selected !== null) ? (
                    <IonButton title="Duplicate layer" onClick={() => this.layerDuplicate()}>
                      <IonIcon icon={duplicateOutline} />
                    </IonButton>
                    ) : null}
                    <IonButton title="Upload GeoJSON" id="confirm-separatelayer">
                      <input style={{display:"none"}} id="GeoJSONUpload" type="file" onChange={this.onGeoJSONUpload} />
                      <IonIcon icon={pushOutline} />
                    </IonButton>
                    <IonAlert
                      header="Create separate layers for each feature collection?"
                      trigger="confirm-separatelayer"
                      buttons={[
                        {
                          text: 'Merge',
                          role: 'merge',
                          handler: () => {this.GeoJSONUpload(false)},                          
                        },
                        {
                          text: 'Separate layers',
                          role: 'separate',
                          handler: () => {this.GeoJSONUpload(true)},
                        },
                      ]}
                      onDidDismiss={null}
                    ></IonAlert>


                    <IonButton title="Download all layers to GeoJSON" onClick={() => this.GeoJSONDownload()}>
                      <IonIcon icon={downloadOutline} />
                    </IonButton>
                  </IonButtons>
                  <IonButtons slot="end">

                  <IonButton id="confirm-delete">
                    {(this.state.selected !== null) ? (<IonIcon title="Delete layer" icon={trashOutline} />) : null}
                  </IonButton>
                    <IonAlert
                      header="Delete layer?"
                      trigger="confirm-delete"
                      buttons={[
                        {
                          text: 'Cancel',
                          role: 'cancel',
                          handler: null,                          
                        },
                        {
                          text: 'OK',
                          role: 'confirm',
                          handler: () => {this.layerDelete()},
                        },
                      ]}
                      onDidDismiss={null}
                    ></IonAlert>

                  </IonButtons>

                  </IonItem>

                </IonToolbar>
              </IonFooter>
            </IonMenu>

          </IonSplitPane>
          
        </IonContent>
      </IonPage>

      </>

    )
  }
}

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
      fetchEntity: (id) => {
        return dispatch(global.fetchEntity(id));
      },      
      fetchEntities: () => {
        return dispatch(global.fetchEntities());
      },  
      fetchPlan: (id) => {
        return dispatch(global.fetchPlan(id));
      },      
      savePlan: (plan) => {
        return dispatch(global.savePlan(plan));
      },  
  }
}  

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Editor));