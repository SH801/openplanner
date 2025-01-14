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
    IonSelect,
    IonSelectOption,
    IonToggle,
    IonAlert,
    IonText,
} from '@ionic/react'
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";


class SiteProperties extends Component {

    state = {
        showentityalert: false
    }

    closeEntityAlert = () => {
        this.setState({showentityalert: false});
    }

    closeModal = () => {
        this.props.close();
    }

    onWillDismiss = (ev) => {
        this.closeModal();
    }

    submitForm = (event) => {
        console.log(event);
        event.preventDefault();
        if (this.props.state.entityid === null) {
            this.setState({showentityalert: true});
        }
        else {
            var retrieveEntity = false;
            if (this.props.global.entity === null) retrieveEntity = true;
            else if (this.props.global.entity.id !== this.props.state.entityid) retrieveEntity = true;
            if (retrieveEntity) this.props.fetchEntity(this.props.state.entityid);
            this.props.setGlobalState({
                name: this.props.state.name,
                public: this.props.state.public
            });
            this.closeModal();
        }
    }

    onChangeValue = (event) => {
        this.props.set(event);
    }
         
    render() {
        return (
        <IonModal 
            id="siteproperties-modal"
            isOpen={this.props.isOpen} 
            onWillDismiss={(ev) => this.onWillDismiss(ev)} 
            backdropDismiss={false}
            onClick={(event) => event.stopPropagation()}
        >
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Plan settings</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <form onSubmit={this.submitForm}>
                    <IonList className="ion-no-padding" lines="none">
    
                        <IonItem>
                            <IonInput 
                                type="text" 
                                label="Name" 
                                labelPlacement="floating" 
                                name="name" 
                                placeholder="Name"
                                value={this.props.state.name} 
                                onIonChange={this.onChangeValue} />
                        </IonItem>

                        <IonItem>
                            <IonSelect 
                                label="Base site" 
                                labelPlacement="stacked" 
                                placeholder="Choose base site" 
                                name="entityid" 
                                value={this.props.state.entityid} 
                                onIonChange={this.onChangeValue} >
                            {this.props.global.entities.map((entity, index) => {
                                return (<IonSelectOption key={index} value={entity.id}>{entity.name}</IonSelectOption>)
                            })}
                            </IonSelect>

                            <IonAlert
                                isOpen={this.state.showentityalert}
                                header="Please select base site"
                                buttons={[
                                    {
                                    text: 'OK',
                                    role: 'confirm',
                                    handler: () => {this.closeEntityAlert()},
                                    },
                                ]}
                                onDidDismiss={null} />

                        </IonItem>

                        <IonItem>
                            <IonText className="formfield-info">Your base plan determines the particular area you will be making plans for</IonText>
                        </IonItem>


                        <IonItem>
                            <IonToggle 
                                name="public"
                                checked={this.props.state.public} 
                                onIonChange={this.onChangeValue} >
                            Publicly viewable</IonToggle>
                        </IonItem>

                        <IonItem>
                            <IonText className="formfield-info">By making your plans public, you promote your regenerative activities to the public and help other regenerative farmers build better plans</IonText>
                        </IonItem>

                    </IonList>
                </form>
            </IonContent>
            <IonFooter>
                <IonToolbar>
                    {this.props.allowCancel ? (
                    <IonButtons slot="start">
                        <IonButton onClick={() => this.onWillDismiss()}>Cancel</IonButton>
                    </IonButtons>
                    ) : null}
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
        fetchEntity: (id) => {
            return dispatch(global.fetchEntity(id));
        },          
    }
}  
  
export default withRouter(connect(mapStateToProps, mapDispatchToProps)(SiteProperties));

