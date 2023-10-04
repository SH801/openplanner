import React, { Component } from 'react';
import { eye, eyeOffOutline, settingsOutline } from 'ionicons/icons';
import { 
    IonItem,
    IonLabel,
    IonIcon,
    IonReorder
  } from '@ionic/react';
  

class Layer extends Component {

    render() {
        return (
            <IonItem color={this.props.selected ? "primary" : null} onClick={(e) => this.props.onClick(e, this.props.index)}>
                <IonLabel>{this.props.layer.name}</IonLabel>
                <IonIcon className="layer-icon" onClick={() => this.props.layerEdit(this.props.index)} size="small" icon={settingsOutline} />
                <IonIcon className="layer-icon" onClick={() => this.props.toggleVisibility(this.props.index)} size="small" icon={this.props.layer.visible ? eye : eyeOffOutline} />
                <IonReorder></IonReorder>
            </IonItem>
        )
    }
}

export default Layer;