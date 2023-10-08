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
  IonInput,
  IonRange
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
  play,
  pause,
  stop,
  stopCircleOutline,
  textOutline
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
import { Timeline } from '@xzdarcy/react-timeline-editor';
import white from '../images/white.png';

import { EXTERNAL_HOMEPAGE } from "../constants";
import CameraProperties from './CameraProperties';
import SiteProperties from './SiteProperties';
import Layer from './Layer';
import LayerProperties from './LayerProperties';
import MapContainer from './MapContainer';

export const isDev = () =>  !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

export const scaleWidth = 160;
export const scale = 1;
export const startLeft = 20;

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
    animationshow: false,
    animationdata: [],
    animationeffects: {},
    animationzoom: 1,
    camerapositions: {},
    cameraproperties: {},
    camerapropertiesshow: false,
    cameratime: null,
    recording: false,
    mediarecorder: null,
  }

  constructor(props) {
    super(props);
    this.timelineRef = React.createRef();
    this.tracksRef = React.createRef();
    this.onDoubleClick = false;
    this.workingWidth = 300;
    this.startingWidth = 300;
    this.state.editorState = EditorState.createEmpty();
    this.state.layers = [JSON.parse(JSON.stringify(require("../constants/defaultlayer.json")))];
    this.camerasource = {
      start: ({ action, engine, isPlaying, time }) => {this.animationCameraEffectStart(action, engine, isPlaying, time)},
      enter: ({ action, engine, isPlaying, time }) => {this.animationCameraEffectEnter(action, engine, isPlaying, time)},
      leave: ({ action, engine }) => {this.animationCameraEffectLeave(action, engine)},
      stop: ({ action, engine }) => {this.animationCameraEffectStop(action, engine)}
    }  
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

  recordingStart = () => {
    if (!this.state.recording) {
      // Use MediaRecorder to record video as it's most efficient
      // Tried using MP4 conversion but too CPU intensive when main app is already working hard
      if (this.state.map !== null) {
        this.timelineRef.current.setTime(0);
        const canvas = this.state.map.getCanvas();
        const data = []; 
        const stream = canvas.captureStream(25); 
        const mediaRecorder = new MediaRecorder(stream);        
        mediaRecorder.ondataavailable = (e) => data.push(e.data);
        mediaRecorder.onstop = (e) => {
          const anchor = document.createElement("a");
          anchor.href =  URL.createObjectURL(new Blob(data, {type: "video/webm;codecs=h264"}));
          const now = new Date();
          const timesuffix = now.toISOString().substring(0,19).replaceAll('T', ' ').replaceAll(':', '-');
          anchor.download = "positivefarms - " + timesuffix;
          anchor.click();
          toast.success('Recording finished - saved to downloads');
        }
        this.animationStart();
        mediaRecorder.start();
        toast.success('Recording started');
        this.setState({recording: true, mediarecorder: mediaRecorder});
      }     
    }
  }

  recordingStop = () => {
    if (this.state.recording) {
      if (this.state.mediarecorder !== null) {
        this.state.mediarecorder.stop();
      }
      this.setState({recording: false, mediarecorder: null});  
    }
  }

  recordingToggle = () => {

    if (!this.state.recording) {
      this.recordingStart();
    } 
    else {
      this.recordingStop();
    }
  }

  animationStart = () => {
    var endTime = this.getAnimationEnd();
    const engine = this.timelineRef.current;
    engine.listener.on('setTimeByTick', ({ time }) => {
      const autoScrollFrom = 500;
      const left = time * (scaleWidth / this.state.animationzoom) + startLeft - autoScrollFrom;
      this.timelineRef.current.setScrollLeft(left);
      if (time >= endTime) this.recordingStop();
    });
    this.animationNextCameraPosition();                        
    if (endTime !== 0) this.timelineRef.current.play({toTime: endTime});
  }

  animationPause = () => {
    this.recordingStop();
    this.timelineRef.current.pause();
  }
  
  animationStop = () => {
    this.recordingStop();
    this.timelineRef.current.setScrollLeft(0);
    this.timelineRef.current.pause(0);
    this.timelineRef.current.setTime(0);
    this.timelineRef.current.reRender();
    this.animationCameraInitial();
    
  }
  
  updateAnimationData = (layers) => {
    var animationdata = [];    
    var actions = {};
    for(let i = 0; i < this.state.animationdata.length; i++) {
      actions[this.state.animationdata[i].id] = this.state.animationdata[i];
    }
    if ('camera' in actions) animationdata.push(actions['camera']);
    else animationdata.push({id: 'camera', actions: []});

    for(let i = 0; i < layers.length; i++) {
      var layerid = layers[i].id;
      if (layerid in actions) animationdata.push(actions[layerid]);
      else animationdata.push({id: layerid, actions: []});
    }
    this.setState({animationdata: animationdata});
  }

  setAnimationData = (animationdata) => {
    this.setState({animationdata: animationdata});
  }

  getLayerLookup = () => {
    let layers = this.state.layers;
    let lookup = {}
    for(let i = 0; i < layers.length; i++) {
      lookup[layers[i].id] = i;
    }
    return lookup;
  }

  animationCameraInitial = () => {
    var useinitialsettings = true;
    var checkfields = ['zoom', 'pitch', 'bearing', 'lat', 'lng'];
    for(let i = 0; i < checkfields.length; i++) {
      if (!(checkfields[i] in this.props.global.data)) useinitialsettings = false;
    }

    if (useinitialsettings) {
      var cameraposition = {
        lat: this.props.global.data['lat'],
        lng: this.props.global.data['lng'],
        zoom: this.props.global.data['zoom'],
        pitch: this.props.global.data['pitch'],
        bearing: this.props.global.data['bearing']
      }
      this.cameraPropertiesSetLive(cameraposition);
    }
  }

  animationGetNextCameraAction = (time) => {
    var cameraactions = this.state.animationdata[0].actions;
    var nextcameraaction = null;
    for(let i = 0; i < cameraactions.length; i++) {
      if (nextcameraaction === null) {
        if (cameraactions[i].start >= time) nextcameraaction = cameraactions[i];
      }
      else {
        if ((cameraactions[i].start >= time) && (cameraactions[i].start < nextcameraaction.start)) {
          nextcameraaction = cameraactions[i];
        }
      }
    }

    return nextcameraaction;
  }

  animationGetTime = () => {
    return this.timelineRef.current.getTime();
  }

  animationNextCameraPosition = () => {
    var animationtime = this.animationGetTime();
    var nextcameraaction = this.animationGetNextCameraAction(animationtime);
    if (animationtime === 0) this.animationCameraInitial();
    if (nextcameraaction !== null) {
      var timetillnextaction = nextcameraaction.start - animationtime;
      var nextcameraposition = this.state.camerapositions[nextcameraaction.id]
      if (this.state.map) {
        var center = {lat: nextcameraposition.lat, lng: nextcameraposition.lng};
        console.log("animationNextCameraPosition");
        this.state.map.flyTo({
          center: center,
          bearing: nextcameraposition.bearing, 
          pitch: nextcameraposition.pitch, 
          zoom: nextcameraposition.zoom,
          essential: true,
          duration: (timetillnextaction * 1000),
          animate: true,
        })
      }
    }
  }

  animationCameraEffectStart = (action, engine, isPlaying, time) => {
    console.log("animationCameraEffectStart");
  }

  animationCameraEffectEnter = (action, engine, isPlaying, time) => {
    console.log("animationCameraEffectEnter", this.onDoubleClick);
    // We only change camera position on enter when not playing as we assume prior transition will have got us here
    if ((!isPlaying) && (!this.onDoubleClick)) {
      var id = action.id;
      var cameraposition = this.state.camerapositions[id];
      this.cameraPropertiesSetLive(cameraposition);
    }
    this.onDoubleClick = false;
  }

  animationCameraEffectLeave = (action, engine) => {
    console.log("animationCameraEffectLeave");
    if (!this.onDoubleClick) {
      this.animationNextCameraPosition();
    }
  }

  animationCameraEffectStop = (action, engine) => {
    console.log("animationCameraEffectStop");
  }

  refreshAnimationEffects = () => {
    var animationeffects = {...this.state.animationeffects};
    delete animationeffects['effect0'];
    animationeffects['effect0'] = {
      id: "effect0", 
      name: "Layer shown",
      source: {
        start: ({ action, engine, isPlaying, time }) => {
          console.log("animationLayerEffectStart", action, engine, time);
        },
        enter: ({ action, engine, isPlaying, time }) => {
          console.log("animationLayerEffectEnter");
          var lookup = this.getLayerLookup();   
          if (this.state.map !== null) {
            var layerindex = lookup[action.layerid];
            var sourcestyles = this.state.layers[layerindex].styles;
            for (let i = 0; i < sourcestyles.length; i++) {
              var layerid = layerindex.toString() + "_" + sourcestyles[i].id;
              var paintopacityproperty = sourcestyles[i].id + '-opacity';
              if (paintopacityproperty === 'symbol-opacity') paintopacityproperty = 'icon-opacity';
              this.state.map.setPaintProperty(layerid, paintopacityproperty, sourcestyles[i]['paint'][paintopacityproperty]);
            }
          }
        },
        leave: ({ action, engine }) => {
          console.log("animationLayerEffectLeave");
          var lookup = this.getLayerLookup();   
          if (this.state.map !== null) {
            var layerindex = lookup[action.layerid];
            var sourcestyles = this.state.layers[layerindex].styles;
            for (let i = 0; i < sourcestyles.length; i++) {
              var layerid = layerindex.toString() + "_" + sourcestyles[i].id;
              var paintopacityproperty = sourcestyles[i].id + '-opacity';
              if (paintopacityproperty === 'symbol-opacity') paintopacityproperty = 'icon-opacity';
              this.state.map.setPaintProperty(layerid, paintopacityproperty, 0);
            }
          }
        },
        stop: ({ action, engine }) => {
          console.log("animationLayerEffectStop");
        },
      },      
    }

    for (const [key] of Object.entries(animationeffects)) {
      // Reassign source to all camera effects, ie. those not 'effect0'
      if (key !== 'effect0') animationeffects[key]['source'] = this.camerasource;
    }

    this.setState({animationeffects: animationeffects});
  }

  addAnimationData = (e, row, time) => {
    var animationdata = [...this.state.animationdata];
    this.refreshAnimationEffects();
    if (row.id === 'camera') {
      // Camera actions are always in first row
      var cameraactions = animationdata[0].actions;
      var effectId = null;
      for(let i = 0; i < cameraactions.length; i++) {
        if ((time > cameraactions[i].start) && 
            (time < cameraactions[i].end)) effectId = cameraactions[i].effectId;
      }
      this.setState({cameratime: time});
      this.cameraPropertiesShow(effectId);
    } else {
      var newAction = {
        id: this.getUniqueID(),
        layerid: row.id,
        start: time,
        end: time + 0.5,
        effectId: "effect0"
      }   
      for(let i = 0; i < animationdata.length; i++) {
        // If time is within existing action then remove it
        if (animationdata[i].id === row.id) {
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
    return end + 0.5;
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
    // Save camera position if going into animation
    // and return to it on leaving animation
    var cameraproperties = this.cameraPropertiesSaved();
    if (this.state.animationshow) {
      this.cameraPropertiesSetLive(cameraproperties);
    }
    else {
      cameraproperties = this.cameraPropertiesNow();
      var data = this.props.global.data;
      data['lat'] = cameraproperties.lat;
      data['lng'] = cameraproperties.lng;
      data['zoom'] = cameraproperties.zoom;
      data['pitch'] = cameraproperties.pitch;
      data['bearing'] = cameraproperties.bearing;
      this.props.setGlobalState({data: data});
    }
    this.setState({animationshow: !this.state.animationshow});
  }

  cameraPropertiesNow = () => {
    var center = this.state.map.getCenter();
    return {
      lat: center.lat,
      lng: center.lng,
      zoom: this.state.map.getZoom(),
      pitch: this.state.map.getPitch(),
      bearing: this.state.map.getBearing()
    };
  }

  cameraPropertiesSaved = () => {
    var data = this.props.global.data;
    var cameraproperties = {
      'lat': data['lat'],
      'lng': data['lng'],
      'zoom': data['zoom'],
      'pitch': data['pitch'],
      'bearing': data['bearing']
    }
    return cameraproperties;
  }

  cameraPropertiesSetLive = (cameraposition) => {
    var center = {lat: cameraposition.lat, lng: cameraposition.lng};
    console.log("cameraPropertiesSetLive");
    this.state.map.flyTo({
      center: center,
      bearing: cameraposition.bearing, 
      pitch: cameraposition.pitch, 
      zoom: cameraposition.zoom,
      essential: true,
      duration: 0,
      animate: false,
    })
  }

  cameraPropertiesShow = (effectId) => {
    var cameraproperties = {};
    if (effectId === null) {
      cameraproperties = this.cameraPropertiesNow();
      cameraproperties['effectId'] = null;
    }
    else {
      cameraproperties = this.state.camerapositions[effectId];
    }
    this.setState({cameraproperties: cameraproperties, camerapropertiesshow: true});
  }

  cameraPropertiesUseCurrent = () => {
    var cameraproperties = this.cameraPropertiesNow();
    cameraproperties.effectId = this.state.cameraproperties.effectId;
    this.setState({cameraproperties: cameraproperties});
  }

  cameraPropertiesSet = (event) => {
    var name = event.target.name;
    var value = event.target.value;
    if (event.target.nodeName === 'ION-TOGGLE') value = !this.state.cameraproperties[name];
    var cameraproperties = {...this.state.cameraproperties};
    cameraproperties[name] = value;
    this.setState({cameraproperties: cameraproperties});
  }

  cameraPropertiesSubmit = () => {
    var animationdata = this.state.animationdata;
    var cameraactions = animationdata[0].actions;
    var animationeffects = this.state.animationeffects;
    var camerapositions = this.state.camerapositions;
    var cameraproperties = this.state.cameraproperties;
    var currentaction = null;
    if (this.state.cameraproperties['effectId'] === null) {
      var cameraanimationid = this.getUniqueID();
      cameraproperties.effectId = cameraanimationid;
      animationeffects[cameraanimationid] = {id: cameraanimationid, name: "Camera animation", source: this.camerasource };
      camerapositions[cameraanimationid] = cameraproperties;
      currentaction = {
        id: cameraanimationid,
        start: this.state.cameratime,
        end: this.state.cameratime + 0.5,
        effectId: cameraanimationid,
      } 
      cameraactions.push(currentaction);
      animationdata[0].actions = cameraactions;
      this.setState({animationdata: animationdata, animationeffects: animationeffects, camerapositions: camerapositions});
    }
    else {
      // Action already exists so just need to modify camera position
      camerapositions[this.state.cameraproperties['effectId']] = cameraproperties;
      for(let i = 0; i < cameraactions.length; i++) {
        if (cameraactions[i].id === this.state.cameraproperties['effectId']) currentaction = cameraactions[i];
      }
      this.setState({camerapositions: camerapositions});
    }
    var animationtime = this.animationGetTime();
    if (currentaction !== null) {
      if ((currentaction.start <= animationtime) && (currentaction.end >= animationtime)) {
        this.cameraPropertiesSetLive(cameraproperties);
      }
    }
  }

  cameraPropertiesDelete = () => {
    var effectId = this.state.cameraproperties.effectId;
    if (effectId !== null) {
      var animationdata = this.state.animationdata;
      var cameraactions = animationdata[0].actions;
      var animationeffects = this.state.animationeffects;
      var camerapositions = this.state.camerapositions;
      delete animationeffects[effectId];
      delete camerapositions[effectId];
      var newcameraactions = []
      for(let i = 0; i < cameraactions.length; i++) {
        if (cameraactions[i].id !== effectId) newcameraactions.push(cameraactions[i]);
      }
      animationdata[0].actions = newcameraactions;
      this.setState({animationdata: animationdata, animationeffects: animationeffects, camerapositions: camerapositions});
    }
    this.cameraPropertiesClose();
  }

  cameraPropertiesClose = () => {
    this.setState({camerapropertiesshow: false});
  }

  planSave = (redirect) => {
    // Only save current camera if not in animation mode
    var data = this.cameraPropertiesNow();
    if (this.state.animationshow) data = this.cameraPropertiesSaved();
    data.satellite = this.props.global.satellite;
    data.layers = this.state.layers;
    data.animationdata = this.state.animationdata;
    data.animationeffects = this.state.animationeffects;
    data.camerapositions = this.state.camerapositions;
    data.animationzoom = this.state.animationzoom;
    var plan = {
      id: this.props.global.id,
      name: this.props.global.name,
      entityid: this.props.global.entityid,
      public: this.props.global.public,
      data: data
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
    console.log("animationeffects", this.state.animationeffects);
    console.log("camerapositions", this.state.camerapositions);
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
          var animationdata = [];
          var animationeffects = {};
          var camerapositions = {};
          var animationzoom = 1;

          if ('layers' in this.props.global.data) layers = this.props.global.data.layers;
          if ('animationdata' in this.props.global.data) animationdata = this.props.global.data.animationdata;
          if ('animationeffects' in this.props.global.data) animationeffects = this.props.global.data.animationeffects;
          if ('camerapositions' in this.props.global.data) camerapositions = this.props.global.data.camerapositions;
          if ('animationzoom' in this.props.global.data) animationzoom = this.props.global.data.animationzoom;

          this.setState({
            layers: layers, 
            animationdata: animationdata, 
            animationeffects: animationeffects, 
            camerapositions: camerapositions,
            animationzoom: animationzoom 
          });
          if (!('animationdata' in this.props.global.data)) this.updateAnimationData(layers);
          this.refreshAnimationEffects();

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
      if ((layer.styles[i]['type'] === 'symbol') && (layer.styles[i].id === 'symbol-default')) {
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
      var currlayer = JSON.parse(JSON.stringify(this.state.layers[this.state.selected]));
      currlayer.name = this.state.layerproperties.name;
      currlayer.title = this.state.layerproperties.title;
      // currlayer.content = draftToHtml(convertToRaw(this.state.editorState.getCurrentContent()));
      currlayer.content = this.state.editorState.getCurrentContent().getPlainText('\n');
      currlayer.iconurl = this.state.layerproperties.iconurl;
      currlayer.iconinternal = this.state.layerproperties.iconinternal;
      if (currlayer.iconinternal === "") currlayer.iconinternal = "default";

      for (let i = 0; i < currlayer.styles.length; i++) {
        console.log(currlayer.styles[i]);
        if (currlayer.styles[i]['type'] === 'line') {
          currlayer.styles[i]['paint']['line-color'] = this.state.layerproperties.colorline;
          currlayer.styles[i]['paint']['line-width'] = parseInt(this.state.layerproperties.widthline);
          currlayer.styles[i]['paint']['line-opacity'] = parseFloat(this.state.layerproperties.opacityline);
        }
        if (currlayer.styles[i]['type'] === 'fill') {
          currlayer.styles[i]['paint']['fill-color'] = this.state.layerproperties.colorfill;
          currlayer.styles[i]['paint']['fill-opacity'] = parseFloat(this.state.layerproperties.opacityfill);
        }
        if ((currlayer.styles[i]['type'] === 'symbol') && (currlayer.styles[i].id === 'symbol-default')) {
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

      // Delete or update label point as appropriate
      var removelabel = true;
      if ((currlayer.title !== '') || (currlayer.content !== '')) removelabel = false;
      if (removelabel) {
        var newfeatures = [];
        currlayer.featurecollection.features.forEach((feature) => {
          if (feature.properties['type'] !== 'label') newfeatures.push(feature);
        });
        currlayer.featurecollection.features = newfeatures;
      }
      else {
        var foundfeature = false;
        var features = currlayer.featurecollection.features;
        for(let i = 0; i < features.length; i++) {
          if (features[i].properties['type'] === 'label') {
            currlayer.featurecollection.features[i]['properties'].title = currlayer.title;
            currlayer.featurecollection.features[i]['properties'].content = currlayer.content;
            foundfeature = true;
          }
        }
        if (!foundfeature) {
          var centre = this.state.map.getCenter();
          var newfeatureid = this.getUniqueID();
          var newfeature = {
            "id": newfeatureid,
            "type": "Feature",
            "properties": {
              "id": newfeatureid,
              "type": "label",
              "title": currlayer.title,
              "content": currlayer.content
            },
            "geometry": {
              "coordinates": [
                centre.lng,
                centre.lat
              ],
              "type": "Point"
            }
          }
          currlayer.featurecollection.features.push(newfeature);   
        }
        this.mapdraw.set(currlayer.featurecollection);
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

  onChangeAnimationZoom = (animationzoom) => {
    this.setState({animationzoom: animationzoom});
    if (this.timelineRef.current !== null) {
      // const autoScrollFrom = 500;
      const left = this.animationGetTime() * (scaleWidth / animationzoom) + startLeft - 50;
      this.timelineRef.current.setScrollLeft(left);
    }
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


          <CameraProperties 
                isOpen={this.state.camerapropertiesshow} 
                close={this.cameraPropertiesClose} 
                state={this.state.cameraproperties} 
                set={this.cameraPropertiesSet} 
                cameraPropertiesSubmit={this.cameraPropertiesSubmit} 
                cameraPropertiesUseCurrent={this.cameraPropertiesUseCurrent} 
                cameraPropertiesDelete={this.cameraPropertiesDelete} />

          <IonSplitPane when={true} contentId="mainpane">

            <div id="mainpane" style={{ height: "100vh", position: "relative" }}>
                <div style={{ height: "100%" }}>
                    <MapContainer 
                      onDataChange={this.onDataChange}
                      onSelectionChange={this.onSelectionChange}
                      onSetSelected={this.onSetSelected}
                      onSetMap={this.onSetMap}
                      mapdraw={this.mapdraw} 
                      recording={this.state.recording}
                      selectDefaultLayer={this.selectDefaultLayer}
                      selected={this.state.selected} 
                      layers={this.state.layers} 
                      animationshow={this.state.animationshow} />
                </div>

                {this.state.animationshow ? (
                  <div className={"animation-editor"} onLoad={() => {
                    console.log("animation-editor loaded");
                  }}>
                    
                    <div className={"animation-tracks-header"}>
                      <IonIcon color={this.state.recording ? "danger" : "light"} title="Record" onClick={this.recordingToggle} icon={stopCircleOutline} />
                      <IonIcon color="medium" title="Play" onClick={this.animationStart} icon={play} />
                      <IonIcon color="medium" title="Pause" onClick={this.animationPause} icon={pause} />
                      <IonIcon color="medium" title="Stop" onClick={this.animationStop} icon={stop} />
                    </div>

                    <div className={"animation-tracks"} ref={this.tracksRef} 
                      onScroll={(e) => {this.timelineRef.current.setScrollTop(e.target.scrollTop);}} >
                        <div className={"animation-track-row"} >
                          <div className={"animation-track-text"}>Camera</div>
                        </div>

                      {this.state.layers.map((layer, index) => {
                        return (
                          <div key={index} className={"animation-track-row"} >
                            <div className={"animation-track-text"}>{layer.name}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div className={"animation-track-header-zoom"} >
                      <IonRange 
                        title="Change timeline zoom" 
                        aria-label="Zoom" 
                        color="medium" 
                        value={this.state.animationzoom} 
                        onIonChange={(e) => this.onChangeAnimationZoom(e.target.value)} 
                        ticks={false} snaps={true} min={1} max={60} step={-1} />
                    </div>

                    <Timeline
                      ref={this.timelineRef}
                      scale={this.state.animationzoom}
                      scaleWidth={scaleWidth}
                      startLeft={startLeft}                      
                      onChange={this.setAnimationData} 
                      style = {{height: "100%", flex: "1 1 auto"}}
                      editorData={this.state.animationdata}
                      effects={this.state.animationeffects}
                      autoScroll={true}
                      onScroll={({ scrollTop }) => {this.tracksRef.current.scrollTop = scrollTop;}}
                      onDoubleClickRow={(e, {row, time}) => {
                        console.log(e);
                        this.onDoubleClick = true;
                        e.nativeEvent.preventDefault();
                        this.addAnimationData(e, row, time);
                        return true;
                      }}
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