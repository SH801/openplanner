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
    IonRange,
    IonSelect,
    IonSelectOption,
} from '@ionic/react'
import { ICON_URL } from "../constants";
import { Editor } from "react-draft-wysiwyg";
import { analytics, colorFill } from 'ionicons/icons';
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";


class LayerProperties extends Component {

    constructor(props) {
        super(props);
        this.icons = require("../constants/icons.json");
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
         
    onChangeValue = (name, event) => {
        this.props.set(name, event.target.value);
    }

    render() {
        return (
        <IonModal 
            id="layerproperties-modal"
            isOpen={this.props.isOpen} 
            onWillDismiss={(ev) => this.onWillDismiss(ev)} 
            backdropDismiss={false}
            onClick={(event) => event.stopPropagation()}
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
                            Line<IonIcon className="coloricons" title="Line color" icon={analytics} />
                            <div style={{width: "60px", height: this.props.state.widthline ? this.props.state.widthline.toString() + "px" : "0px", backgroundColor:"black"}} ></div>
                            <div style={{width: "40px", textAlign: "right", marginLeft:"10px"}} >
                            {this.props.state.widthline ? this.props.state.widthline.toString() + " px" : "0 px"}
                            </div>
                            <IonRange title="Change line width" aria-label="Line width" color="medium" value={this.props.state.widthline} onIonChange={(e) => this.onChangeValue('widthline', e)} ticks={false} snaps={true} min={0} max={32} step={1}></IonRange>


                            <input title="Change colour" style={{opacity: this.props.state.opacityline}} onChange={(e) => this.onChangeValue('colorline', e)} type="color" value={this.props.state.colorline} />
                            <IonRange title="Change line opacity" aria-label="Line opacity" color="medium" value={this.props.state.opacityline} onIonChange={(e) => this.onChangeValue('opacityline', e)} ticks={false} snaps={true} min={0} max={1} step={0.01}></IonRange>

                            <span style={{width: "80px"}}></span>
                            Fill<IonIcon className="coloricons" title="Fill color" icon={colorFill} />
                            <input title="Change colour" style={{opacity: this.props.state.opacityfill}} onChange={(e) => this.onChangeValue('colorfill', e)} type="color" value={this.props.state.colorfill} />
                            <IonRange title="Change fill opacity" aria-label="Fill opacity" color="medium" value={this.props.state.opacityfill} onIonChange={(e) => this.onChangeValue('opacityfill', e)} ticks={false} snaps={true} min={0} max={1} step={0.01}></IonRange>

                        </IonItem>

                        <IonItem>

                            <div style={{width: "100px"}}>
                                Point
                            </div>
                            <img width={this.props.state.iconsize ? this.props.state.iconsize.toString() + "%" : "100%"} style={{marginRight: "20px"}} alt={this.props.state.iconinternal} src={ICON_URL + ((this.props.state.iconinternal === "") ? 'default': this.props.state.iconinternal) + ".png"} />

                            <IonSelect style={{width: "200px"}} placeholder="Choose icon" value={this.props.state.iconinternal} onIonChange={(e) => this.onChangeValue('iconinternal', e)}>
                            <IonSelectOption value="">Default icon</IonSelectOption>
                            {this.icons.map((element, index) => {
                                return (<IonSelectOption key={index} value={element}>Icon: {element}</IonSelectOption>)
                            })}
                            </IonSelect>

                            <div style={{width: "300px", marginRight:"60px"}}>
                                <IonRange title="Change icon size" aria-label="Icon size" color="medium" value={this.props.state.iconsize} onIonChange={(e) => this.onChangeValue('iconsize', e)} ticks={false} snaps={true} min={0} max={100} step={1}></IonRange>
                            </div>

                            <IonInput value={this.props.state.iconurl} label="External icon URL" labelPlacement="floating" name="iconurl" onIonBlur={this.onBlur} onIonChange={this.onInputChange} type="text" placeholder="Enter internet address of external icon to use" />

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

