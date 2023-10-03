import React, { Component }  from 'react';
import { 
    IonModal, 
    IonHeader, 
    IonToolbar, 
    IonButtons, 
    IonButton, 
    IonContent, 
    IonItem,
    IonInput,
    IonList,
    IonIcon,
    IonFooter,
} from '@ionic/react'
import { Editor } from "react-draft-wysiwyg";
import { analytics, colorFill } from 'ionicons/icons';

import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

class LayerProperties extends Component {

    constructor(props) {
        super(props);
    }

    closeModal = () => {
        this.props.cancel();
    }

    onWillDismiss = (ev) => {
        this.closeModal();
    }

    submitForm = () => {
        this.props.submit();
    }

    onInputChange = (e) => {
        this.props.set(e.target.name, e.detail.value);   
    };
         
    onChangeColor = (name, event) => {
        this.props.set(name, event.target.value);
    }

    render() {
        return (
        <IonModal 
            id="layerproperties-modal"
            isOpen={this.props.isOpen} 
            onWillDismiss={(ev) => this.onWillDismiss(ev)} 
            backdropDismiss={false}
        >
            <IonHeader>
                <IonToolbar>
                    <IonItem>
                      <IonInput value={this.props.state.name} name="name" onIonBlur={this.onBlur} onIonChange={this.onInputChange} type="text" placeholder="Layer name" />
                    </IonItem>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">

                <form onSubmit={this.submitForm}>
                    <IonList className="ion-no-padding" lines="none">
 
                        <IonItem>
                            <IonIcon className="coloricons" title="Line color" icon={analytics} />
                            <input title="Change colour" style={{opacity: this.props.state.opacityline}} onChange={(e) => this.onChangeColor('colorline', e)} type="color" value={this.props.state.colorline} />
                            <input title="Change opacity" style={{accentColor: this.props.state.colorline}} onChange={(e) => this.onChangeColor('opacityline', e)} value={this.props.state.opacityline} type="range" min="0" max="1" step="0.01" />

                            <IonIcon className="coloricons" style={{paddingLeft: "20px"}} title="Fill color" icon={colorFill} />
                            <input title="Change colour" style={{opacity: this.props.state.opacityfill}} onChange={(e) => this.onChangeColor('colorfill', e)} type="color" value={this.props.state.colorfill} />
                            <input title="Change opacity" style={{accentColor: this.props.state.colorfill}} onChange={(e) => this.onChangeColor('opacityfill', e)} value={this.props.state.opacityfill} type="range" min="0" max="1" step="0.01" />
                        </IonItem>

                        <IonItem>
                            <IonInput value={this.props.state.title} label="Descriptive title" labelPlacement="floating" name="title" onIonBlur={this.onBlur} onIonChange={this.onInputChange} type="text" placeholder="Descriptive title" />
                        </IonItem>

                        <IonItem style={{height: "300px"}}>
                            <Editor
                                editorState={this.props.editorState}
                                toolbarClassName="toolbarClassName"
                                wrapperClassName="wrapperClassName"
                                editorClassName="editorClassName"
                                onEditorStateChange={this.props.onEditorStateChange}
                                />
                            
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
                    <IonButton strong={true} type="submit" onClick={() => this.submitForm()}>
                        Save changes
                    </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonFooter>


        </IonModal>
        );
    };
}

export default LayerProperties;

