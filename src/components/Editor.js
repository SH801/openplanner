/**
 * BasicPage.js
 * 
 * Default page
 */ 

import React, { Component } from 'react';
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
  IonTitle, 
  IonToolbar 
} from '@ionic/react';

import { trashOutline, duplicateOutline, addOutline } from 'ionicons/icons';
import { createGesture } from '@ionic/react';
import { ContentState, convertToRaw } from 'draft-js';
import { EditorState } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';

import MapboxDraw from "@mapbox/mapbox-gl-draw";
import Layer from './Layer';
import LayerProperties from './LayerProperties';
import MapContainer from './MapContainer';

class Editor extends Component {

  state = {
    layers: null,
    selected: null,
    map: null,
    mapdraw: null,
    featuresselected: [],
    layerselected: null,
    idstart: 0,
    layerproperties: {},
    showlayerproperties: false,
    editorState: null,
    contentState: null,
  }

  constructor(props) {
    super(props);

    this.workingWidth = 300;
    this.startingWidth = 300;
  
    this.state.editorState = EditorState.createEmpty();

    this.state.layers = require("../constants/testbundle.json");
    this.state.idstart = this.getIdStart(this.state.layers);
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

  
  onVerticalMove = (ev) => {
    requestAnimationFrame(() => {
      this.workingWidth = this.startingWidth - ev.deltaX;
      this.splitPane.style.setProperty('--side-width', `${this.workingWidth}px`);
    });
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
      onEnd: this.onVerticalEnd,
      onMove: this.onVerticalMove,
    });    
    gesture.enable(true);
  }

  getIdStart = (layers) => {
    var maxId = 0;
    for(let i = 0; i < layers.length; i++) {
      var features = layers[i]['featurecollection']['features'];
      for(let j = 0; j < features.length; j++) {
        if (features[j]['id'] > maxId) maxId = features[j]['id'];
      }
    }
    return (maxId + 1);
  }

  onSetMap = (map) => {
    this.setState({map: map});
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
    this.onDataChange(data);    
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

  layerAdd = (event) => {
    var layers = [...this.state.layers];
    var defaultlayer = require("../constants/defaultlayer.json");
    layers.push({...defaultlayer});
    this.setState({layers: layers});
  }

  layerDuplicate = (event) => {
    var layers = [...this.state.layers];
    if (this.state.selected !== null) {
      var layer = {...layers[this.state.selected]};
      layer.name = "Copy of " + layer.name;
      var maxId = this.getIdStart(layers);
      for(let i = 0; i < layer.featurecollection.features.length; i++) {
        maxId += 1;
        layer.featurecollection.features[i]['id'] = maxId;
      }

      layers.push(layer);
      this.setState({layers: layers, idstart: maxId});
      // this.setSelected(layers.length - 1);
    }
  }

  layerDelete = (event) => {
    var layers = [...this.state.layers];
    if (this.state.selected !== null) {
      layers.splice(this.state.selected, 1);
      if (this.state.layerselected === this.state.selected) this.clearSelectedFeatures();
      this.setState({layers: layers, selected: null});  
    }
  }

  convertColorAndOpacity = (color, opacity) => {
    return color;
  }

  convertAlphaColor = (color) => {
    return color;
  }

  layerEdit = (key) => {
    var layer = {...this.state.layers[key]}
    var layerproperties = {};
    let colorline = '';
    let colorfill = '';
    let opacityline = 1;
    let opacityfill = 1;
    let widthline = 0;

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
    }

    layerproperties.colorline = colorline;
    layerproperties.colorfill = colorfill;
    layerproperties.opacityline = opacityline;
    layerproperties.opacityfill = opacityfill;
    layerproperties.widthline = widthline;

    this.setState({showlayerproperties: true, layerproperties: layerproperties});
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
    this.setState({showlayerproperties: false});
  }

  layerEditSubmit = () => {
    if (this.state.selected !== null) {
      var currlayer = this.state.layers[this.state.selected];
      currlayer.name = this.state.layerproperties.name;
      currlayer.title = this.state.layerproperties.title;
      currlayer.content = draftToHtml(convertToRaw(this.state.editorState.getCurrentContent()));
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
      }  

      var layers = this.state.layers;
      layers[this.state.selected] = currlayer;
      this.setState({layers: layers});
    }
    this.setState({showlayerproperties: false});
  }

  handleReorder = (event) => {
    this.setState({layers: event.detail.complete(this.state.layers)});
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

  onDataChange = (data) => {
    if (this.state.selected !== null) {
      var featurecollection = this.mapdraw.getAll();
      var layers = [...this.state.layers];
      layers[this.state.selected]['featurecollection'] = featurecollection;
      this.setState({layers: layers});
    }
  }

  onFeatureSelected = (data) => {
    console.log(data);
  }

  onSetSelected = (layerId, featureId) => {
    this.setSelected(layerId);
    this.mapdraw.changeMode('direct_select', {featureId: featureId});
  }

  setSelected = (index) => {
    this.clearSelectedFeatures();
    if (this.state.selected !== null) {
      var featurecollection = this.mapdraw.getAll();
      var layers = [...this.state.layers];
      layers[this.state.selected]['featurecollection'] = featurecollection;
      this.setState({layers: layers});
    }
    this.mapdraw.set(this.state.layers[index]['featurecollection']);
    this.setState({selected: index});
  }
  onClick = (key) => {
    this.setSelected(key);
  }

  render() {

    return (
      <>

      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Site Planning Tool</IonTitle>
            <IonButtons slot="end">
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonSplitPane when={true} contentId="mainpane">

            <div id="mainpane" style={{ height: "100vh", position: "relative" }}>
                <div style={{ height: "100%" }}>
                    <MapContainer 
                      idstart={this.state.idstart}
                      onDataChange={this.onDataChange}
                      onSelectionChange={this.onSelectionChange}
                      onSetSelected={this.onSetSelected}
                      onSetMap={this.onSetMap}
                      mapdraw={this.mapdraw} 
                      selected={this.state.selected} 
                      layers={this.state.layers} 
                      />
                </div>

                <div className="vertical-divider"></div>                
            </div>

            <IonMenu side="end" contentId="mainpane">
              <IonContent className="ion-padding">

              <LayerProperties 
                isOpen={this.state.showlayerproperties} 
                editorState={this.state.editorState}
                onEditorStateChange={this.onEditorStateChange}
                contentState={this.state.contentState}
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
                    <IonButton onClick={() => this.layerAdd()}>
                      <IonIcon slot="icon-only" title="Add layer" icon={addOutline} />
                    </IonButton>
                    <IonButton onClick={() => this.layerDuplicate()}>
                      <IonIcon slot="icon-only" title="Duplicate layer" icon={duplicateOutline} />
                    </IonButton>
                  </IonButtons>
                  <IonButtons slot="end">
                    <IonButton onClick={() => this.layerDelete()}>
                      <IonIcon slot="icon-only" title="Delete layer" icon={trashOutline} />
                    </IonButton>
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

export default Editor;
