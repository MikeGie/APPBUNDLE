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
import { loadProfile } from '../actions/profileActions';
import { getProfile, loginFailedShowing } from '../reducers/mainReducer';
import UserDetails from './userDetails.js';
import Typography from "@hig/typography";
import ModalFail from './modalFail';
import { showLoginFailed } from '../actions/uiFlagsActions';
import './toolbar.css';
import { updateLanguage } from '../actions/uiFlagsActions';

import TopNav, {
    Logo,
    LogoText,
    Interactions,
    ProfileAction,
    NavAction,
    Separator
} from '@hig/top-nav';


import styled from 'styled-components';
import { Service24 } from "@hig/icons";

const PlaceCenterContainer = styled.div`
  align-items: center;
  display: flex;
`;
const LanguageSwitcherContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto; /* Wyœrodkowanie */
`;
const LanguageButton = styled.button`
  margin: 0 10px;
  padding: 5px 10px;
  background-color: #007ac1;
  color: #fff;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background-color: #005f91;
  }
`;

export class Toolbar extends Component {
    componentDidMount() {
        this.props.loadProfile();
    }

    onLoginFailedCloseClick() {
        this.props.showLoginFailed(false);
        this.logout();
    }

    logout() {
        const logoutFrame = document.getElementById('hiddenLogoutFrame');
        logoutFrame.onload = () => {
            logoutFrame.removeEventListener('load', this, false);
            window.location.reload(false);
        };
        logoutFrame.src = 'https://accounts.autodesk.com/Authentication/LogOut';
    }
    changeLanguage(language) {
        console.log(`Language changed to: ${language}`);
        this.props.updateLanguage(language);
    }

    render() {
        return (
            <div>
                <TopNav
                    logo={
                        <Logo link="https://konfigurator.pjk.com.pl/" label="Autodesk HIG">
                            <PlaceCenterContainer>
                                <img src={"logo.png"} alt="" />
                                <LogoText>
                                    <Typography style={{ fontSize: '16px' }}>PJK<sup> </sup> <strong>KONFIGURATOR</strong></Typography>
                                </LogoText>
                            </PlaceCenterContainer>
                        </Logo>
                    }
                    rightActions={
                        <React.Fragment>
                            <LanguageSwitcherContainer>
                                <LanguageButton onClick={() => this.changeLanguage('pl')}>PL</LanguageButton>
                                <LanguageButton onClick={() => this.changeLanguage('en')}>EN</LanguageButton>
                                <LanguageButton onClick={() => this.changeLanguage('de')}>DE</LanguageButton>
                            </LanguageSwitcherContainer>
                            <PlaceCenterContainer>
                                {this.props.children}
                            </PlaceCenterContainer>
                            <Interactions>
                                <Separator />
                                <NavAction title="Log" icon={<Service24 />}>
                                    <div>
                                        <h3>ZGLASZANIE BLEDOW</h3>
                                        <p>
                                            Wszystkie zarejestrowane bledy prosze zglaszac na email:michal.gierasimiuk@pierworys.pl

                                        </p>
                                    </div>
                                </NavAction>
                                <span id="ProfileActionHolder">
                                    <ProfileAction avatarName={this.props.profile.name} avatarImage={this.props.profile.avatarUrl}>
                                        <UserDetails profile={this.props.profile} logout={this.logout} />
                                    </ProfileAction>
                                </span>
                            </Interactions>
                        </React.Fragment>
                    }
                />
                {this.props.loginFailedShowing &&
                    <ModalFail
                        open={this.props.loginFailedShowing}
                        title="Logowanie nieudane"
                        label="Dostep do tej strony jest tylko dla usob upowa¿nionych"
                        onClose={() => this.onLoginFailedCloseClick()} />
                }
                {/* Use a hidden iframe to make a logout request to autodesk since it isn't supported in a better way yet */}
                <iframe id="hiddenLogoutFrame" />
            </div>
        );
    }
}

/* istanbul ignore next */
export default connect(function (store) {
    return {
        profile: getProfile(store),
        loginFailedShowing: loginFailedShowing(store)
    };
}, { loadProfile, showLoginFailed, updateLanguage })(Toolbar);

