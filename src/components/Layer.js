import React, { Component } from 'react';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';
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
                <IonIcon onClick={() => this.props.toggleVisibility(this.props.index)} icon={this.props.layer.visible ? eyeOutline : eyeOffOutline} className="entity-activate"/>
                <IonReorder slot="end"></IonReorder>
            </IonItem>
        )
    }
}

export default Layer;