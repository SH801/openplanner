import React, { Component }  from 'react';
import { connect } from 'react-redux';
import { withRouter } from '../redux/functions/withRouter';
import { global } from "../redux/actions";
import { 
    IonModal, 
    IonHeader, 
    IonTitle,
    IonToolbar, 
    IonButtons, 
    IonButton, 
    IonContent, 
    IonItem,
    IonInput,
    IonList,
    IonFooter,
    IonText
} from '@ionic/react'
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";


class CameraProperties extends Component {

    closeModal = () => {
        this.props.close();
    }

    onWillDismiss = (ev) => {
        this.closeModal();
    }

    submitForm = (event) => {
        event.preventDefault();
        this.props.cameraPropertiesSubmit();
        this.closeModal();
    }

    onChangeValue = (event) => {
        this.props.set(event);
    }
         
    render() {
        return (
        <IonModal 
            id="cameraproperties-modal"
            isOpen={this.props.isOpen} 
            onWillDismiss={(ev) => this.onWillDismiss(ev)} 
            backdropDismiss={false}
            onClick={(event) => event.stopPropagation()}
        >
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Camera position</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <form onSubmit={this.submitForm}>
                    <IonList className="ion-no-padding" lines="none">

                        {(this.props.state.effectId !== null) ? (
                        <IonItem>
                            <IonButtons>
                                    <IonButton fill="solid" shape="round" color="primary" onClick={() => this.props.cameraPropertiesUseCurrent()}>
                                        <IonText>Use current camera</IonText>
                                    </IonButton>
                                    <IonButton fill="solid" shape="round" color="primary" onClick={() => this.props.cameraPropertiesDelete()}>
                                        <IonText>Delete camera edit</IonText>
                                    </IonButton>
                            </IonButtons>
                        </IonItem>
                        ) : null }

                        <IonItem>
                            <IonInput 
                                type="text" 
                                label="Latitude" 
                                labelPlacement="floating" 
                                name="lat" 
                                placeholder="Latitude"
                                value={this.props.state.lat} 
                                onIonChange={this.onChangeValue} />
                        </IonItem>

                        <IonItem>
                            <IonInput 
                                type="text" 
                                label="Longitude" 
                                labelPlacement="floating" 
                                name="lng" 
                                placeholder="Longitude"
                                value={this.props.state.lng} 
                                onIonChange={this.onChangeValue} />
                        </IonItem>

                        <IonItem>
                            <IonInput 
                                type="text" 
                                label="Zoom" 
                                labelPlacement="floating" 
                                name="zoom" 
                                placeholder="Zoom"
                                value={this.props.state.zoom} 
                                onIonChange={this.onChangeValue} />
                        </IonItem>

                        <IonItem>
                            <IonInput 
                                type="text" 
                                label="Pitch" 
                                labelPlacement="floating" 
                                name="pitch" 
                                placeholder="Pitch"
                                value={this.props.state.pitch} 
                                onIonChange={this.onChangeValue} />
                        </IonItem>

                        <IonItem>
                            <IonInput 
                                type="text" 
                                label="Bearing" 
                                labelPlacement="floating" 
                                name="bearing" 
                                placeholder="Bearing"
                                value={this.props.state.bearing} 
                                onIonChange={this.onChangeValue} />
                        </IonItem>

                    </IonList>
                </form>
            </IonContent>
            <IonFooter>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonButton onClick={() => this.onWillDismiss()}>Cancel</IonButton>
                    </IonButtons>
                    <IonButtons slot="end">
                    <IonButton strong={true} type="submit" onClick={(event) => this.submitForm(event)}>
                        OK
                    </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonFooter>

        </IonModal>
        );
    };
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
    }
}  
  
export default withRouter(connect(mapStateToProps, mapDispatchToProps)(CameraProperties));

