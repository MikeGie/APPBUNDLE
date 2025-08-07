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

import React, { Component } from 'react';
import { connect } from 'react-redux';
import Tabs, { Tab } from "@hig/tabs";
import ProjectList from './projectList';
import ForgeView from './forgeView';
import ParametersContainer from './parametersContainer';
import Bom from './bom';
import Downloads from './downloads';
import './tabs.css';
import { embeddedModeEnabled, activeTabIndex } from '../reducers/mainReducer';
import { updateActiveTabIndex } from '../actions/uiFlagsActions';
import Drawing from './drawing';
import { getLanguage } from '../reducers/uiFlagsReducer';

export class TabsContainer extends Component {

    onTabChange(index) {
      this.props.updateActiveTabIndex(index);
    }

    render() {

        const idx = this.props.activeTabIndex;
        const showProjectsTab = this.props.embeddedModeEnabled;
        const showParameters = this.props.embeddedModeEnabled;
        const currentLanguage = this.props.language || 'pl';
        const labels = {
            projects: { pl: "Projekty", en: "Projects", de: "Projekte" },
            model3D: { pl: "Model 3D", en: "3D Model", de: "3D-Modell" },
            bom: { pl: "BOM", en: "BOM", de: "Stuckliste" },
            drawings: { pl: "Rysunki", en: "Drawings", de: "Zeichnungen" },
            download: { pl: "Pobieranie", en: "Download", de: "Download" }
        };
        console.log("Current language:", currentLanguage);
        console.log("Labels:", labels.projects);
        console.log("Current label:", labels.projects[currentLanguage]);

        return (
            <div className="tabsContainer">
            <Tabs
              className="fullheight"
              align="center"
              showTabDivider={false}
              onTabChange={(index) => { this.onTabChange(index); }}
              onTabClose={() => {}}
              activeTabIndex={idx}
            >
              {!showProjectsTab &&
                        <Tab label={`1.${labels.projects[currentLanguage] || 'Projects'}`}>
                  <div id="project-list" className="tabContent fullheight">
                    <ProjectList/>
                  </div>
                </Tab>
              }
                    <Tab label={`2.${labels.model3D[currentLanguage]}`}>
                <div id="model" className='tabContent fullheight'>
                  <div className='inRow fullheight'>
                    { !showParameters &&
                      <ParametersContainer/>
                    }
                    <ForgeView/>
                  </div>
                </div>
              </Tab>
                    <Tab label={`3.${labels.bom[currentLanguage]}`}>
                <div id="bom" className="tabContent fullheight">
                  <Bom/>
                </div>
              </Tab>
                    <Tab label={`4.${labels.drawings[currentLanguage]}`}>
                <div id="drawing" className="tabContent fullheight">
                  <Drawing/>
                </div>
              </Tab>
                    <Tab label={`5.${labels.download[currentLanguage]}`}>
                <div id="downloads" className="tabContent fullheight">
                  <Downloads/>
                </div>
              </Tab>
            </Tabs>
          </div>
        );
    }
}

/* istanbul ignore next */
export default connect(function (store){
  return {
    activeTabIndex: activeTabIndex(store),
    embeddedModeEnabled: embeddedModeEnabled(store),
    language: getLanguage(store) || 'pl', // Pobranie jêzyka z globalnego stanu
  };
}, { updateActiveTabIndex } )(TabsContainer);