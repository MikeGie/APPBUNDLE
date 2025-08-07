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
import { Column } from 'react-base-table';
import BaseTable, { AutoResizer, FrozenDirection } from 'react-base-table';
import 'react-base-table/styles.css';
import CheckboxTableHeader from './checkboxTableHeader';
import CheckboxTableRow from './checkboxTableRow';
import { checkedProjects } from '../reducers/mainReducer';
import { setProjectChecked, setCheckedProjects, clearCheckedProjects } from '../actions/uiFlagsActions';

import styled from 'styled-components';

const translations = {
    projects: {
        en: "",
        pl: "",
        de: ""
    },
    details: {
        en: "",
        pl: "",
        de: ""
    },
    languageGroups: {
        Polish: {
            en: "Polish",
            pl: "Polskie",
            de: "Polnisch"
        },
        English: {
            en: "English",
            pl: "English",
            de: "Englisch"
        },
        German: {
            en: "German",
            pl: "Deutsch",
            de: "Deutsch"
        }
    }
};

const CHECK_COLUMN = 'check_column';

const Icon = ({ iconname }) => (
    <div>
        <img src={iconname} alt='' width='16px' height='18px' />
    </div>
);

const iconRenderer = ({ cellData: iconname, rowData }) => {
    // Don't render icon for group headers
    if (rowData.isGroupHeader) {
        return null;
    }
    return <Icon iconname={iconname} />;
};

const cellBackgroundColor = 'white';
const cellHoverColor = '#f3f3f3';
const groupHeaderColor = '#f8f9fa';
const groupHeaderHoverColor = '#e9ecef';

const Cell = styled.div`
  background-color: ${cellBackgroundColor};
`;

const Row = styled.div`
  [id=checkbox_hover_visible] {
    display:none;
  }

  &:hover {
    [id=checkbox_hover_visible] {
      display:block;
    }
  }

  /* Group header styling */
  &.group-header-row {
    background-color: ${groupHeaderColor} !important;
    font-weight: bold;
    color: #0696d7;
    cursor: default;
    
    &:hover {
      background-color: ${groupHeaderHoverColor} !important;
    }
  }

  /* Indent regular project rows */
  &:not(.group-header-row) {
    padding-left: 20px;
  }
`;

const HeaderRow = styled.div`
  display: flex;
  background-color: ${cellBackgroundColor};
  width: inherit;
  height: calc(100% - 1px); // this keeps header underlined

  [id=checkbox_hover_visible] {
    display:none;
  }

  &:hover {
    background-color: ${cellHoverColor};

    [id=checkbox_hover_visible] {
      display:block;
    }
  }  
`;

const GroupHeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 12px;
  font-weight: bold;
  font-size: 14px;
  color: #0696d7;
  background-color: ${groupHeaderColor};
  border-bottom: 1px solid #e0e0e0;

  .project-count {
    font-size: 12px;
    color: #666;
    font-weight: normal;
  }
`;

export class CheckboxTable extends Component {

    constructor(props) {
        super(props);

        this.projectListColumns = (language) => [
            {
                width: 78,
                flexShrink: 0,
                locked: true,
                resizable: false,
                frozen: FrozenDirection.RIGHT,
                align: Column.Alignment.RIGHT,
                position: 1 - Number.MAX_VALUE,
                headerRenderer: () => (
                    <CheckboxTableHeader
                        onChange={(clearAll) => { this.onSelectAllChange(clearAll); }}
                        selectable={this.props.selectable}
                    />
                ),
                cellRenderer: ({ rowData }) => {
                    // Don't render checkbox for group headers
                    if (rowData.isGroupHeader) {
                        return null;
                    }
                    return (
                        <CheckboxTableRow
                            rowData={rowData}
                            onChange={(checked, rowData) => { this.onSelectChange(checked, rowData); }}
                            selectable={this.props.selectable}
                        />
                    );
                },
                key: CHECK_COLUMN
            },
            {
                key: 'icon',
                title: '',
                dataKey: 'icon',
                cellRenderer: iconRenderer,
                align: Column.Alignment.RIGHT,
                width: 32
            },
            {
                key: 'label',
                title: translations.projects[language] || translations.projects.en,
                dataKey: 'label',
                align: Column.Alignment.LEFT,
                flexGrow: 1,
                minWidth: 200,
                cellRenderer: ({ cellData, rowData }) => {
                    if (rowData.isGroupHeader) {
                        const translatedGroupName = translations.languageGroups[rowData.languageKey] ?
                            translations.languageGroups[rowData.languageKey][language] || translations.languageGroups[rowData.languageKey].en :
                            rowData.languageGroup;

                        return (
                            <GroupHeaderContent>
                                <span>{translatedGroupName}</span>
                                <span className="project-count">({rowData.projectCount})</span>
                            </GroupHeaderContent>
                        );
                    }
                    return cellData;
                }
            }
        ];
    }

    // Extract language from project label
    extractLanguage(label) {
        if (!label) return 'Other';

        const upperLabel = label.toUpperCase();
        if (upperLabel.startsWith('PL')) return 'Polish';
        if (upperLabel.startsWith('ENG') || upperLabel.startsWith('EN')) return 'English';
        if (upperLabel.startsWith('DE')) return 'German';


        return 'Other';
    }

    // Group projects by language and add group headers
    prepareGroupedData() {
        const { projects } = this.props.projectList || { projects: [] };

        if (!projects || projects.length === 0) {
            return [];
        }

        // Group projects by language
        const languageGroups = {};

        projects.forEach(project => {
            const language = this.extractLanguage(project.label);
            if (!languageGroups[language]) {
                languageGroups[language] = [];
            }
            languageGroups[language].push(project);
        });

        // Sort languages: Polish, English, German, then alphabetically
        const languageOrder = ['Polish', 'English', 'German'];
        const sortedLanguages = Object.keys(languageGroups).sort((a, b) => {
            const indexA = languageOrder.indexOf(a);
            const indexB = languageOrder.indexOf(b);

            if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB;
            }
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;

            return a.localeCompare(b);
        });

        // Create flattened data with group headers
        const flattenedData = [];

        sortedLanguages.forEach(language => {
            const projectsInGroup = languageGroups[language];

            // Add group header
            flattenedData.push({
                id: `group-${language}`,
                isGroupHeader: true,
                languageGroup: language,
                languageKey: language, // Keep original key for translations
                projectCount: projectsInGroup.length,
                label: language,
                icon: '',
                selectable: false
            });

            // Add ALL projects in this group (no limit)
            projectsInGroup.forEach(project => {
                flattenedData.push({
                    id: project.id,
                    label: project.label,
                    icon: project.adoptWarnings?.length ? 'alert-24.svg' : 'Archive.svg',
                    isGroupHeader: false,
                    language: language
                });
            });
        });

        return flattenedData;
    }

    onSelectAllChange(clearAll) {
        if (clearAll) {
            this.props.clearCheckedProjects();
        } else {
            // Only select actual projects, not group headers
            const data = this.prepareGroupedData();
            const projectIds = data
                .filter(item => !item.isGroupHeader && item.id.indexOf('group-') !== 0)
                .map(project => project.id);
            this.props.setCheckedProjects(projectIds);
        }
    }

    onSelectChange(checked, rowData) {
        this.props.setProjectChecked(rowData.id, checked);
    }

    render() {
        const data = this.prepareGroupedData();
        const columns = this.projectListColumns(this.props.language || 'en');

        return (
            <AutoResizer>
                {({ width, height }) => {
                    return <BaseTable
                        width={width}
                        height={height}
                        columns={columns}
                        data={data}
                        estimatedRowHeight={50}
                        rowEventHandlers={{
                            onClick: ({ rowData }) => {
                                // Don't allow clicking on group headers
                                if (rowData.isGroupHeader) {
                                    return;
                                }
                                this.props.onProjectClick(rowData.id);
                            }
                        }}
                        rowClassName={({ rowData }) => {
                            if (rowData.isGroupHeader) {
                                return 'group-header-row';
                            }
                            return '';
                        }}
                        cellProps={({ columnIndex, rowData }) => {
                            const baseProps = {};

                            if (columnIndex === 0) {
                                baseProps.tagName = Cell;
                                // Only add click prevention for non-group-header rows
                                if (!rowData.isGroupHeader) {
                                    baseProps.onClick = e => {
                                        // stop click on the first cell (checkbox) and do not select project
                                        e.preventDefault();
                                        e.stopPropagation();
                                    };
                                }
                            }

                            return baseProps;
                        }}
                        rowProps={({ rowData }) => ({
                            tagName: Row, // styled div to show/hide row checkbox when hover
                            className: rowData.isGroupHeader ? 'group-header-row' : ''
                        })}
                        headerRenderer={({ cells }) => {
                            // prepare the first checkbox cell and override
                            // background color to be consistent with row checkbox cells
                            const headerCheckboxCell = cells[0];
                            const updatedCell = React.cloneElement(headerCheckboxCell, {
                                style: { ...headerCheckboxCell.props.style, backgroundColor: cellBackgroundColor }
                            });

                            cells.shift(); // remove original item

                            // HeaderRow - styled row with hovering enabled - render checkbox cell + rest of columns
                            return (<HeaderRow id="checkbox_hover_visible">{updatedCell}{cells}</HeaderRow>);
                        }}
                    />;
                }}
            </AutoResizer>
        );
    }
}

/* istanbul ignore next */
export default connect(function (store) {
    return {
        projectList: store.projectList,
        checkedProjects: checkedProjects(store),
        language: store.uiFlags.language || 'en' // Domyœlny jêzyk
    };
}, { setProjectChecked, setCheckedProjects, clearCheckedProjects })(CheckboxTable);