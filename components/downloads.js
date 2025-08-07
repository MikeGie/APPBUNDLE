/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Forge Design Automation team for Inventor
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////

import Button from '@hig/button';
import React, { Component } from 'react';
import BaseTable, { AutoResizer, Column } from 'react-base-table';
import 'react-base-table/styles.css';
import { connect } from 'react-redux';
import { getDownloadLink } from '../actions/downloadActions';
import { showDownloadFailed, showDownloadProgress } from '../actions/uiFlagsActions';
import { downloadDrawingFailedShowing, downloadFailedShowing, downloadProgressShowing, downloadProgressTitle, downloadUrl, errorData, getActiveProject } from '../reducers/mainReducer';
import repo from '../Repository';
import ModalDownloadProgress from './modalDownloadProgress';
import ModalFail from './modalFail';

const translations = {
    fileType: {
        pl: "Typ pliku",
        de: "Dateityp",
        en: "File type"
    },
    environment: {
        pl: "Środowisko",
        de: "Beschreibung",
        en: "Environment"
    },
    sendInquiry: {
        pl: "Wyślij zapytanie ofertowe",
        de: "Anfrage senden",
        en: "Send inquiry"
    },
    orderPlaced: {
        pl: "Dziękujemy, zamówienie zostało złożone!",
        de: "Danke! Ihre Bestellung wurde platziert!",
        en: "Thank you, your order has been placed!"
    },
    generateProject: {
        pl: "Spróbuj w pierwszej kolejności wygenerować projekt w zakładce Model.",
        de: "Versuchen Sie zuerst, das Projekt auf der Registerkarte Modell zu generieren.",
        en: "Try to generate the project in the Model tab first."
    },
    somethingWentWrong: {
        pl: "Coś poszło nie tak :(",
        de: "Etwas ist schief gelaufen :(",
        en: "Something went wrong :("
    },
    rfaPreparation: {
        pl: "Przygotowywanie pliku RFA",
        de: "Vorbereitung der RFA-Datei",
        en: "RFA file preparation"
    },
    drawingPreparation: {
        pl: "Przygotowywanie rysunków 2D",
        de: "Vorbereitung der DWG-Datei",
        en: "Preparation of 2D drawings"
    },
    stepPreparation: {
        pl: "Przygotowywanie pliku STEP",
        de: "Vorbereitung der STEP-Datei",
        en: "STEP file preparation"
    }
};

const Icon = ({ iconname }) => (
    <div>
      <img src={iconname} alt=''/>
    </div>
);

const iconRenderer = ({ cellData: iconname }) => <Icon iconname={iconname} />;

/** Hyperlink that leads nowhere. */
function deadEndLink(title) {
    return <a href='' onClick={(e) => { e.preventDefault(); }}>{ title }</a>;
}

export const downloadColumns = (language) => [
    {
        key: 'icon',
        title: '',
        dataKey: 'icon',
        cellRenderer: iconRenderer,
        align: Column.Alignment.RIGHT,
        width: 100,
    },
    {
        key: 'type',
        title: translations.fileType[language] || translations.fileType.en,
        dataKey: 'type',
        cellRenderer: ( { rowData } ) => rowData.link,
        align: Column.Alignment.LEFT,
        width: 150,
    },
    {
        key: 'env',
        title: translations.environment[language] || translations.environment.en,
        dataKey: 'env',
        align: Column.Alignment.CENTER,
        width: 200,
    }
];

// add token to download URLs if necessary
function getDownloadUrls(project) {

    const { modelDownloadUrl, bomDownloadUrl } = project;

    const token = repo.getAccessToken();
    const suffix = token ? "/" + token : "";

    return {
        modelDownloadUrl: modelDownloadUrl ? modelDownloadUrl + suffix : modelDownloadUrl,
        bomDownloadUrl: bomDownloadUrl ? bomDownloadUrl + suffix : bomDownloadUrl
    };
}


export class Downloads extends Component {

    buyClicked(project) {
        const { language = 'en' } = this.props; // Pobierz język z props 
        fetch(`https://prod-253.westeurope.logic.azure.com:443/workflows/cd1e89ee462b42219dfae5dcae919394/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=VYbb23T9KRqrWjHZJ5jSMhfApZHkEipkP1X5oNmLuzc`, {
            'method': 'POST',
            'body': JSON.stringify(project.hash),
          'headers': {
            'Content-Type': 'application/json',
            
          },
        })
        .then((response) => {
            console.log(response);
            if (response.status == 202) {
                alert(translations.orderPlaced[language] || translations.orderPlaced.en);
            } else if (response.status == 404) {
                alert(translations.generateProject[language] || translations.generateProject.en);
            } else {
                alert(translations.somethingWentWrong[language] || translations.somethingWentWrong.en);
            }
        });
    }

    render() {
        const { language = 'en' } = this.props;
        // array with rows data
        const data = [];

        const project = this.props.activeProject;
        if (project?.id) {

            const { modelDownloadUrl, bomDownloadUrl } = getDownloadUrls(project);
            if (modelDownloadUrl) {

                let downloadHyperlink;
                const modelJsx = <a href={modelDownloadUrl} onClick={(e) => { e.stopPropagation(); }} ref = {(h) => {
                    downloadHyperlink = h;
                }}>IAM/IPT</a>;

                // register the row
                data.push({
                    id: 'updatedIam',
                    icon: 'products-and-services-24.svg',
                    type: 'IAM',
                    env: 'Model',
                    link: modelJsx,
                    clickHandler: () => downloadHyperlink.click()
                });
            }

            data.push({
                id: 'rfa',
                icon: 'products-and-services-24.svg',
                type: 'RFA',
                env: 'Model',
                link: deadEndLink('RFA'),
                clickHandler: async () => this.props.getDownloadLink('CreateRFAJob', project.id, project.hash, translations.rfaPreparation[this.props.language] || translations.rfaPreparation.en)
            });

            if (bomDownloadUrl && project.isAssembly) {

                let downloadHyperlink;
                const bomJsx = <a href={bomDownloadUrl} onClick={(e) => { e.stopPropagation(); }} ref = {(h) => {
                    downloadHyperlink = h;
                }}>BOM</a>;

                // register the row
                data.push({
                    id: 'bom',
                    icon: 'file-spreadsheet-24.svg',
                    type: 'BOM',
                    env: 'BOM',
                    link: bomJsx,
                    clickHandler: () => downloadHyperlink.click()
                });
            }
            // Add STEP file download option
            data.push({
                id: 'step',
                icon: 'products-and-services-24.svg',  // You can use the same icon or choose a different one
                type: 'STEP',
                env: 'Model',
                link: deadEndLink('STEP'),
                clickHandler: async () => this.props.getDownloadLink('CreateStepFileJob', project.id, project.hash, 'STEP file preparation')
            });
            // Add DWG3D file download option
            data.push({
                id: 'dwg',
                icon: 'products-and-services-24.svg',  // You can use the same icon or choose a different one
                type: 'DWG',
                env: 'Model',
                link: deadEndLink('DWG'),
                clickHandler: async () => this.props.getDownloadLink('CreateDWGFileJob', project.id, project.hash, '3D DWG file preparation')
            });

            const hasDrawingUrl = project.hasDrawing;
            if (hasDrawingUrl) {
                data.push(
                    {
                        id: 'drawing',
                        icon: 'products-and-services-24.svg',
                        type: 'IDW',
                        env: 'Drawing',
                        link: deadEndLink('Drawing'),
                        clickHandler: async () => this.props.getDownloadLink('CreateDrawingDownloadJob', project.id, project.hash, translations.drawingPreparation[this.props.language] || translations.drawingPreparation.en)
                    });
            }
        }

        return (

        <React.Fragment>
            <div width="grow">
                <Button id="buyButton"
                    style={{width: '400px'}}
                    type="primary"
                    size="standard"
                    title={translations.sendInquiry[language] || translations.sendInquiry.en} // Wybierz odpowiedni język
                    width="grow"
                    onClick={() => this.buyClicked(project)}/>
            </div>
            <AutoResizer>
                {({ width, height }) => {
                    // reduce size by 16 (twice the default border of tabContent)
                    const newWidth = width-16;
                    const newHeight = height-16;
                    return <BaseTable
                        width={newWidth}
                        height={newHeight}
                        columns={downloadColumns(this.props.language)}
                        data={data}
                        rowEventHandlers={{
                            onClick: ({ rowData }) => { rowData.clickHandler(); }
                        }}
                    />;
                }}
            </AutoResizer>
                {this.props.downloadProgressShowing && <ModalDownloadProgress
                    open={true}
                    title={ this.props.downloadProgressTitle }
                    label={project.id}
                    icon='/Archive.svg'
                    onClose={ () => this.props.showDownloadProgress(false) }
                    url={ this.props.downloadUrl } />}

                {this.props.downloadFailedShowing && <ModalFail
                    open={true}
                    title={ `${this.props.downloadProgressTitle} Failed` }
                    contentName="Project:"
                    label={project.id}
                    onClose={ () => this.props.showDownloadFailed(false) }
                    errorData={this.props.errorData}/>}

        </React.Fragment>
        );
    }
}

/* istanbul ignore next */
export default connect(function(store) {
    const activeProject = getActiveProject(store);
    return {
        activeProject: activeProject,
        downloadProgressShowing: downloadProgressShowing(store),
        downloadProgressTitle: downloadProgressTitle(store),
        downloadFailedShowing: downloadFailedShowing(store),
        downloadUrl: downloadUrl(store),
        errorData: errorData(store),
        drawingDownloadFailedShowing: downloadDrawingFailedShowing(store),
        language: store.uiFlags.language || 'en' // Dodanie języka
    };
}, { Downloads, getDownloadLink, showDownloadProgress, showDownloadFailed })(Downloads);
