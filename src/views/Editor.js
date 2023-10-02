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
  IonMenu, 
  IonMenuButton, 
  IonList,
  IonLabel,
  IonItem,
  IonReorder, 
  IonReorderGroup, 
  ItemReorderEventDetail, 
  IonPage, 
  IonTitle, 
  IonToolbar 
} from '@ionic/react';
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import Layer from '../components/Layer';
import MapContainer from '../components/MapContainer';

class Editor extends Component {

  state = {
    layers: null,
    selected: null,
    map: null,
    mapdraw: null,
    featureselected: null,
    layerselected: null,
  }

  constructor(props) {
    super(props);

    this.state.layers = require("../constants/testbundle.json");

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

  onSetMap = (map) => {
    this.setState({map: map});
  }

  onSelectionChange = (data) => {
    if (this.state.featureselected !== null) this.clearSelectedFeature();
    if (data.features.length > 0) {
        this.state.map.setFeatureState(
            { source: this.state.selected.toString(), id: data.features[0]['id'] },
            { active: true }
        );
        this.setState({layerselected: this.state.selected.toString(), featureselected: data.features[0]['id']});
    }  
    this.onDataChange(data);    
  }

  clearSelectedFeature = () => {
    if (this.state.layerselected !== null) {
      this.state.map.setFeatureState(
        { source: this.state.layerselected, id: this.state.featureselected },
        { active: false }
      );
      this.setState({layerselected: null, featureselected: null});
    }
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

    console.log(this.mapdrawStyles);
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

  onClick = (key) => {

    this.clearSelectedFeature();
    if (this.state.selected !== null) {
      var featurecollection = this.mapdraw.getAll();
      var layers = [...this.state.layers];
      layers[this.state.selected]['featurecollection'] = featurecollection;
      this.setState({layers: layers});
    }
    this.mapdraw.set(this.state.layers[key]['featurecollection']);
    this.setState({selected: key});
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
                      onDataChange={this.onDataChange}
                      onSelectionChange={this.onSelectionChange}
                      onSetMap={this.onSetMap}
                      mapdraw={this.mapdraw} 
                      selected={this.state.selected} 
                      layers={this.state.layers} 
                      />
                </div>
            </div>

            <IonMenu side="end" contentId="mainpane">
              <IonContent className="ion-padding">

              <IonList>
                <IonReorderGroup disabled={false} onIonItemReorder={this.handleReorder}>

                  {this.state.layers.map((layer, index) => {
                      return (
                      <Layer 
                        key={index} 
                        selected={(this.state.selected === index)}
                        toggleVisibility={this.toggleVisibility} 
                        onClick={this.onClick}
                        index={index} 
                        layer={layer} 
                        />)
                  })}

                </IonReorderGroup>
              </IonList>


              </IonContent>
            </IonMenu>

          </IonSplitPane>
          
        </IonContent>
      </IonPage>

      </>

    )
  }
}

export default Editor;
