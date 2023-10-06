import React, { Component } from 'react';
import { eye, eyeOffOutline, settingsOutline } from 'ionicons/icons';
import { 
    IonItem,
    IonLabel,
    IonIcon,
    IonReorder
  } from '@ionic/react';
  

class AnimationLayer extends Component {

    render() {
        return (
            <IonItem >
                <IonLabel><h3>{this.props.layer.name}</h3></IonLabel>
            </IonItem>
        )
    }
}

export default AnimationLayer;