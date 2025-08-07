/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Forge Partner Development
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

using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;

using Inventor;
using Autodesk.Forge.DesignAutomation.Inventor.Utils;
using Shared;

namespace ExportSolidsToDWGPlugin
{
    [ComVisible(true)]
    public class ExportSolidsToDWGAutomation : AutomationBase
    {
        /// <summary>
        /// File name of output DWG file.
        /// The file name is expected by the corresponding Activity.
        /// </summary>
        private const string OutputDwgName = "exported_solids.dwg";

        public ExportSolidsToDWGAutomation(InventorServer inventorApp) : base(inventorApp)
        {
        }

        public override void Run(Document doc)
        {
            LogTrace("Processing " + doc.FullFileName);
            LogTrace("Starting ExportSolidsToDWGAutomation.Run");
            LogTrace("Document type: " + doc.DocumentType.ToString());
            LogTrace("Document path: " + doc.FullFileName);
            try
            {
                switch (doc.DocumentType)
                {
                    case DocumentTypeEnum.kPartDocumentObject:
                        ProcessPart((PartDocument)doc);
                        break;

                    case DocumentTypeEnum.kAssemblyDocumentObject:
                        ProcessAssembly((AssemblyDocument)doc);
                        break;

                    // complain about non-supported document types
                    default:
                        throw new ArgumentOutOfRangeException(nameof(doc), "Unsupported document type");
                }

                LogTrace("DWG export completed successfully.");
            }
            catch (Exception e)
            {
                LogError("Processing failed. " + e.ToString());
            }
        }

        public override void ExecWithArguments(Document doc, NameValueMap map)
        {
            LogTrace("ExecWithArguments called for " + doc.FullFileName);
            Run(doc);
        }

        private void ProcessPart(PartDocument doc)
        {
            using (new HeartBeat())
            {
                LogTrace("Exporting Part document to DWG 2004 format");
                ExportToDWG(doc);
            }
        }

        private void ProcessAssembly(AssemblyDocument doc)
        {
            using (new HeartBeat())
            {
                LogTrace("Exporting Assembly document to DWG 2004 format");
                ExportToDWG(doc);
            }
        }

        private void ExportToDWG(Document doc)
        {
            // Get the DWG translator add-in
            TranslatorAddIn dwgTranslator = null;
            try
            {
                // DWG translator ID
                string dwgTranslatorId = "{C24E3AC4-122E-11D5-8E91-0010B541CD80}";
                dwgTranslator = (TranslatorAddIn)_inventorApplication.ApplicationAddIns.ItemById[dwgTranslatorId];

                if (dwgTranslator == null)
                {
                    LogError("Could not get DWG translator.");
                    return;
                }
            }
            catch (Exception ex)
            {
                LogError($"Error accessing DWG translator: {ex.Message}");
                return;
            }

            TranslationContext context = _inventorApplication.TransientObjects.CreateTranslationContext();
            context.Type = IOMechanismEnum.kFileBrowseIOMechanism;

            NameValueMap options = _inventorApplication.TransientObjects.CreateNameValueMap();

            // First check if HasSaveCopyAsOptions is true
            bool hasSaveCopyAsOptions = false;
            try
            {
                hasSaveCopyAsOptions = dwgTranslator.HasSaveCopyAsOptions[doc, context, options];
            }
            catch (Exception ex)
            {
                LogError($"Error checking HasSaveCopyAsOptions: {ex.Message}");
            }

            // Only set options if HasSaveCopyAsOptions is true
            if (hasSaveCopyAsOptions)
            {
                LogTrace("Setting DWG export options");
                try
                {
                    // Set DWG version to 2004
                    options.Value["ExportVersion"] = DWGExportVersionEnum.kDWG2004ExportVersion;

                    // Export only solids/3D geometry
                    options.Value["ExportUnits"] = ExportUnitsEnum.kExportInchUnits;
                    options.Value["ExportGeometry"] = true;
                    options.Value["Export3DGeometry"] = true;
                    options.Value["ExportSketches"] = false;
                    options.Value["ExportWorkFeatures"] = false;

                    LogTrace("DWG export options configured for solids only, DWG 2004 format");
                }
                catch (Exception ex)
                {
                    LogError($"Error setting DWG export options: {ex.Message}");
                    // Continue with default options
                }
            }
            else
            {
                LogTrace("DWG translator does not support options for this document");
            }

            DataMedium dataMedium = _inventorApplication.TransientObjects.CreateDataMedium();
            string currentDir = Directory.GetCurrentDirectory();
            LogTrace($"Current directory: {currentDir}");
            dataMedium.FileName = Path.Combine(currentDir, OutputDwgName);
            LogTrace($"Output file path: {dataMedium.FileName}");

            // Perform the export
            try
            {
                LogTrace("Calling SaveCopyAs to export DWG file");
                dwgTranslator.SaveCopyAs(doc, context, options, dataMedium);
                LogTrace("SaveCopyAs completed successfully");
            }
            catch (Exception ex)
            {
                LogError($"Error during DWG export: {ex.Message}");
                return;
            }

            // After export, verify the file
            string exportedFilePath = dataMedium.FileName;
            if (File.Exists(exportedFilePath))
            {
                FileInfo fileInfo = new FileInfo(exportedFilePath);
                LogTrace($"DWG file created with size: {fileInfo.Length} bytes");
            }
            else
            {
                LogError("DWG file was not created at the expected location");
            }
        }
    }
}