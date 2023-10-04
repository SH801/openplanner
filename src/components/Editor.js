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
  IonToolbar,
  IonAlert,
} from '@ionic/react';

import { trashOutline, duplicateOutline, addOutline, pushOutline, downloadOutline } from 'ionicons/icons';
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
      var layer = JSON.parse(JSON.stringify(layers[this.state.selected]));
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
      this.mapdraw.deleteAll();
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

    this.setState({selected: key, showlayerproperties: true, layerproperties: layerproperties});
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
            this.state.map.loadImage(currlayer.iconurl, (error, image) => {
                if (error) throw error;
                this.state.map.addImage('external-' + this.state.selected.toString(), image);
            });            
            currlayer.styles[i]['layout']['icon-image'] = "external-" + this.state.selected.toString();
          }
          console.log(this.state.layerproperties.iconsize, currlayer);
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
    var feature = this.mapdraw.get(featureId);
    if (feature.geometry.type !== 'Point') this.mapdraw.changeMode('direct_select', {featureId: featureId});
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

  onClick = (event, key) => {
    this.setSelected(key);
    event.stopPropagation();
  }

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
        const GeoJSON = JSON.parse(GeoJSONContent);
        let maxid = this.state.idstart;
        let features = GeoJSON.features;
        let layers = this.state.layers;
  
        if (this.state.separatelayers) {
          // Create separate layer for each feature
          // This allows per-feature styling through layer-specific stylesheet
          for(let i = 0; i < features.length; i++) {
            let defaultlayer = JSON.parse(defaultlayerText);        
            if (features[i]['properties']['name'] !== undefined) defaultlayer.name = features[i]['properties']['name'];
            else defaultlayer.name = "Imported layer";
            if (features[i]['properties']['visible'] !== undefined) defaultlayer.visible = features[i]['properties']['visible'];
            if (features[i]['properties']['title'] !== undefined) defaultlayer.title = features[i]['properties']['title'];
            if (features[i]['properties']['content'] !== undefined) defaultlayer.content = features[i]['properties']['content'];
            // We assume line style is style[0] and feature style is style[1]
            if (features[i]['properties']['line-color'] !== undefined) defaultlayer.styles[0]['paint']['line-color'] = features[i]['properties']['line-color'];
            if (features[i]['properties']['line-width'] !== undefined) defaultlayer.styles[0]['paint']['line-width'] = features[i]['properties']['line-width'];
            if (features[i]['properties']['line-opacity'] !== undefined) defaultlayer.styles[0]['paint']['line-opacity'] = features[i]['properties']['line-opacity'];
            if (features[i]['properties']['fill-color'] !== undefined) defaultlayer.styles[1]['paint']['fill-color'] = features[i]['properties']['fill-color'];
            if (features[i]['properties']['fill-opacity'] !== undefined) defaultlayer.styles[1]['paint']['fill-opacity'] = features[i]['properties']['fill-opacity'];
            delete features[i]['properties']['name'];
            delete features[i]['properties']['visible'];
            delete features[i]['properties']['title'];
            delete features[i]['properties']['content'];
            delete features[i]['properties']['line-color'];
            delete features[i]['properties']['line-width'];
            delete features[i]['properties']['line-opacity'];
            delete features[i]['properties']['fill-color'];
            delete features[i]['properties']['fill-opacity'];
            features[i]['id'] = maxid;
            maxid++;        
            defaultlayer['featurecollection']['features'] = [features[i]];
            layers.push(defaultlayer);
          }
        } else {
          if (features.length === 0) return;

          // We take possible layer properties from first feature - though many properties may be blank
          let defaultlayer = JSON.parse(defaultlayerText);        
          if (features[0]['properties']['name'] !== undefined) defaultlayer.name = features[0]['properties']['name'];
          else defaultlayer.name = "Imported layer";

          if (features[0]['properties']['visible'] !== undefined) defaultlayer.visible = features[0]['properties']['visible'];
          if (features[0]['properties']['title'] !== undefined) defaultlayer.title = features[0]['properties']['title'];
          if (features[0]['properties']['content'] !== undefined) defaultlayer.content = features[0]['properties']['content'];
          // We assume line style is style[0] and feature style is style[1]
          if (features[0]['properties']['line-color'] !== undefined) defaultlayer.styles[0]['paint']['line-color'] = features[0]['properties']['line-color'];
          if (features[0]['properties']['line-width'] !== undefined) defaultlayer.styles[0]['paint']['line-width'] = features[0]['properties']['line-width'];
          if (features[0]['properties']['line-opacity'] !== undefined) defaultlayer.styles[0]['paint']['line-opacity'] = features[0]['properties']['line-opacity'];
          if (features[0]['properties']['fill-color'] !== undefined) defaultlayer.styles[1]['paint']['fill-color'] = features[0]['properties']['fill-color'];
          if (features[0]['properties']['fill-opacity'] !== undefined) defaultlayer.styles[1]['paint']['fill-opacity'] = features[0]['properties']['fill-opacity'];

          for(let i = 0; i < features.length; i++) {
            delete features[i]['properties']['name'];
            delete features[i]['properties']['visible'];
            delete features[i]['properties']['title'];
            delete features[i]['properties']['content'];
            delete features[i]['properties']['line-color'];
            delete features[i]['properties']['line-width'];
            delete features[i]['properties']['line-opacity'];
            delete features[i]['properties']['fill-color'];
            delete features[i]['properties']['fill-opacity'];  
            features[i]['id'] = maxid;
            maxid++;        
          }

          defaultlayer['featurecollection']['features'] = features;
          layers.push(defaultlayer);
        }
  
        this.setState({idstart: maxid, layers: layers});
        document.getElementById('GeoJSONUpload').value = "";  
      });
    }        
  }

  GeoJSONDownload = () => {
    console.log("this.GeoJSONDownload");
    var outputGeoJSON = {type: "FeatureCollection", features:[]};
    var layers = this.state.layers;

    // Push all layer properties into 'properties' field of each GeoJSON feature
    // in order to create GeoJSON-standardised file
    for(let i = 0; i < layers.length; i++) {
      var properties = {};
      var currlayer = layers[i];
      properties.name = currlayer.name;
      properties.visible = currlayer.visible;
      properties.title = currlayer.title;
      properties.content = currlayer.content;
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
      }
      var featurecollection = currlayer.featurecollection.features;
      for(let j = 0; j < featurecollection.length; j++) {
        featurecollection[j]['properties'] = properties;
        outputGeoJSON.features.push(featurecollection[j]);
      }
    }

    let GeoJSON = JSON.stringify(outputGeoJSON, null, 2);
    const anchor = document.createElement("a");
    anchor.href =  URL.createObjectURL(new Blob([GeoJSON], {type: "application/geo+json"}));
    const now = new Date();
    const timesuffix = now.toISOString().substring(0,19).replaceAll('T', ' ').replaceAll(':', '-');
    anchor.download = "positivefarms - " + timesuffix + ".geojson";
    anchor.click();
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
              <IonContent onClick={this.deselectLayers} className="ion-padding">

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
                      header="Create layer for each feature?"
                      trigger="confirm-separatelayer"
                      buttons={[
                        {
                          text: 'Merge into one layer',
                          role: 'merge',
                          handler: () => {this.GeoJSONUpload(false)},                          
                        },
                        {
                          text: 'Layer for each feature',
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

export default Editor;
