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
    IonList,
    IonFooter,
    IonText,
    IonGrid,
    IonRow,
    IonCol,
} from '@ionic/react'
import { area, length } from '@turf/turf';


class Funding extends Component {

    closeModal = () => {
        this.props.close();
    }

    onWillDismiss = (ev) => {
        this.closeModal();
    }

    submitForm = (event) => {
        this.closeModal();
    }

    convertForDisplay = (value) => {
        var retvalue = parseFloat(value).toLocaleString('en', {minimumFractionDigits: 2,maximumFractionDigits: 2});
        return retvalue;
    }
       
    getLayerCalculations = (fundingline, layer) => {
        var calculations = [];

        if (fundingline['peragreement'] !== 0) {
            calculations.push({
                'units': "agreement",
                'unitcost': this.convertForDisplay(fundingline['peragreement']),
                'amount': 1,
                'subtotal': fundingline['peragreement'],
                'extra': fundingline['extra']
            });
        }

        if (fundingline['peryear'] !== 0) {
            calculations.push({
                'units': "year",
                'unitcost': this.convertForDisplay(fundingline['peryear']),
                'amount': 1,
                'subtotal': fundingline['peryear'],
                'extra': fundingline['extra']
            });
        }

        if (fundingline['peritem'] !== 0) {
            calculations.push({
                'units': "item",
                'unitcost': this.convertForDisplay(fundingline['peritem']),
                'amount': layer['items'],
                'subtotal': (layer['items'] * fundingline['peritem']),
                'extra': fundingline['extra']
            });
        }
        if (fundingline['perplot'] !== 0) {
            calculations.push({
                'units': "plot",
                'unitcost': this.convertForDisplay(fundingline['perplot']),
                'amount': layer['plots'],
                'subtotal': (layer['plots'] * fundingline['perplot']),
                'extra': fundingline['extra']
            });
        }
        if (fundingline['perhectare'] !== 0) {
            calculations.push({
                'units': "hectare",
                'unitcost': this.convertForDisplay(fundingline['perhectare']),
                'amount': this.convertForDisplay(layer['area']),
                'subtotal': (layer['area'] * fundingline['perhectare']),
                'extra': fundingline['extra']
            });
        }
        if (fundingline['permetre'] !== 0) {
            calculations.push({
                'units': "metre",
                'unitcost': this.convertForDisplay(fundingline['permetre']),
                'amount': this.convertForDisplay(layer['length']),
                'subtotal': (layer['length'] * fundingline['permetre']),
                'extra': fundingline['extra']
            });
        }
        
        return calculations;
    }

    getCalculations = (funding, origlayers) => {

        // Deep clone layers so we don't compromise original layers
        var layers = JSON.parse(JSON.stringify(origlayers));

        // Create dictionary of funding using code

        if (funding === null) return null;

        var fundingdict = {};
        for(let i = 0; i < funding.length; i++) {
            let code = funding[i].code;
            fundingdict[code] = funding[i];
        }

        var totalvalue = 0;
        var totalvisiblevalue = 0;
        var newlayers = [];        
        for(let i = 0; i < layers.length; i++) {
            if ((layers[i].funding !== undefined) && (layers[i].funding !== null)) {
                var totalitems = 0;
                var totalarea = 0;
                var totallength = 0;
                var totalplots = 0;
                var features = layers[i].featurecollection.features;
                for (let j = 0; j < features.length; j++) {
                    if (features[j]['geometry']['type'] === 'Point') {
                        if (features[j]['properties']['type'] !== 'label') totalitems++;
                    }
                    if ((features[j]['geometry']['type'] === 'Polygon') ||
                        (features[j]['geometry']['type'] === 'MultiPolygon')) {
                        totalarea += parseFloat(area(features[j]) / 10000);
                        totalplots += 1;
                    }
                    if ((features[j]['geometry']['type'] === 'LineString') ||
                        (features[j]['geometry']['type'] === 'MultiLineString')) {
                        totallength += parseFloat(length(features[j], {units: 'kilometers'}) * 1000);
                    }
                }
                layers[i].items = totalitems;
                layers[i].plots = totalplots;
                layers[i].area = totalarea;
                layers[i].length = totallength;
                let calculations = this.getLayerCalculations(fundingdict[layers[i].funding], layers[i]);
                for(let j = 0; j < calculations.length; j++) {
                    layers[i].calculation = calculations[j];
                    totalvalue += calculations[j].subtotal;
                    if (layers[i].visible) totalvisiblevalue += calculations[j].subtotal;
                    if (calculations[j].subtotal !== undefined) {
                        layers[i].calculation.subtotal = this.convertForDisplay(layers[i].calculation.subtotal);
                    }
                    newlayers.push(JSON.parse(JSON.stringify(layers[i])));
                }
            }
        }

        return {layers: newlayers, total: this.convertForDisplay(totalvalue), totalvisible: this.convertForDisplay(totalvisiblevalue)};
    }

    render() {
        var calculations = this.getCalculations(this.props.funding, this.props.layers);

        return (
        <IonModal 
            id="funding-modal"
            isOpen={this.props.isOpen} 
            onWillDismiss={(ev) => this.onWillDismiss(ev)} 
            backdropDismiss={false}
            onClick={(event) => event.stopPropagation()}
        >
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Funding calculator</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <IonList lines="none">

                    <IonGrid style={{padding: "10px"}}>

                        <IonRow>
                            <IonCol>
                                <IonText><h2>Funding for visible layers</h2></IonText>
                            </IonCol>
                        </IonRow>

                        <IonRow className="header-row" style={{fontWeight: "800", borderBottom: "1px solid grey"}}>
                            <IonCol size="5"><IonText>Name</IonText></IonCol>
                            <IonCol size="1"><IonText>Code</IonText></IonCol>
                            <IonCol size="3" style={{textAlign: "right"}}><IonText>Unit cost</IonText></IonCol>
                            <IonCol size="1" style={{textAlign: "right"}}><IonText>Quantity</IonText></IonCol>
                            <IonCol size="2" style={{textAlign: "right"}}><IonText>Subtotal</IonText></IonCol>
                        </IonRow>

                        {(calculations !== null) ? (
                            <>
                                {calculations.layers.map((layer, index) => {
                                    if (layer.visible) {
                                        return (
                                            <IonRow key={index}>
                                                <IonCol size="5"><IonText>{layer.name}</IonText></IonCol>
                                                <IonCol size="1"><IonText>{layer.funding}</IonText></IonCol>
                                                <IonCol size="3" style={{textAlign: "right"}}><IonText>&pound;{layer.calculation.unitcost} / {layer.calculation.units} 
                                                    {layer.calculation.extra ? (
                                                        <>
                                                        <br/>
                                                        <span style={{fontSize: "90%"}}>
                                                        {layer.calculation.extra}
                                                        </span>
                                                        </>
                                                    ) : null}</IonText></IonCol>
                                                <IonCol size="1" style={{textAlign: "right"}}><IonText>{layer.calculation.amount}</IonText></IonCol>
                                                <IonCol size="2" style={{textAlign: "right"}}><IonText>&pound;{layer.calculation.subtotal}</IonText></IonCol>
                                            </IonRow>        
                                        )
                                    }
                                    return null;
                                })}

                                <IonRow style={{borderTop: "2px solid black"}}>
                                    <IonCol size="5"><IonText><strong>Total</strong></IonText></IonCol>
                                    <IonCol size="1"></IonCol>
                                    <IonCol size="3"></IonCol>
                                    <IonCol size="1"></IonCol>
                                    <IonCol size="2" style={{textAlign: "right"}}><IonText><strong>&pound;{calculations.totalvisible}</strong></IonText></IonCol>
                                </IonRow>        

                            </>
                        ) : null}

                    </IonGrid>

                </IonList>
            </IonContent>
            <IonFooter>
                <IonToolbar>
                    <IonButtons slot="end">
                        <IonButton onClick={() => this.onWillDismiss()}>OK</IonButton>
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
  
export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Funding));

