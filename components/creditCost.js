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
import Spacer from "@hig/spacer";
import { getStats } from '../reducers/mainReducer';


export class CreditCost extends Component {
    render() {

        const stats = this.props.statsKey == null ? this.props.stats : this.props.stats[this.props.statsKey];

        return (
            <div>
                {stats?.processing ?
                    <div>
                    </div>
                    :
                    <div>
                    </div>
                }
                <Spacer spacing='m'/>
            </div>
        );
    }
}

/* istanbul ignore next */
export default connect(function (store){
    return {
      stats: getStats(store)
    };
})(CreditCost);