import React, { Component } from 'react';
import { eyeOutline, eyeOffOutline, settingsOutline } from 'ionicons/icons';
import { 
    IonItem,
    IonLabel,
    IonIcon,
    IonReorder
  } from '@ionic/react';
  

class Layer extends Component {

    render() {
        return (
            <IonItem color={this.props.selected ? "primary" : null} onClick={() => this.props.onClick(this.props.index)}>
                <IonLabel>{this.props.layer.name}</IonLabel>
                <IonIcon className="layer-icon" onClick={() => this.props.layerEdit(this.props.index)} icon={settingsOutline} />
                <IonIcon className="layer-icon" onClick={() => this.props.toggleVisibility(this.props.index)} icon={this.props.layer.visible ? eyeOutline : eyeOffOutline} />
                <IonReorder></IonReorder>
            </IonItem>
        )
    }
}

export default Layer;