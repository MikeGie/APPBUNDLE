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
    public class ExportSTEPAutomation : AutomationBase
    {
        /// <summary>
        /// File name of output STEP file.
        /// The file name is expected by the corresponding Activity.
        /// </summary>
        private const string OutputStepName = "result.step";  // Changed from output.step

        public ExportSTEPAutomation(InventorServer inventorApp) : base(inventorApp)
        {
        }

        public override void Run(Document doc)
        {
            LogTrace("Processing " + doc.FullFileName);
            LogTrace("Starting ExportSTEPAutomation.Run");
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

                LogTrace("STEP export completed successfully.");
            }
            catch (Exception e)
            {
                LogError("Processing failed. " + e.ToString());
            }
        }

        public override void ExecWithArguments(Document doc, NameValueMap map)
        {
            // Zamiast zgłaszać błąd, po prostu wywołaj metodę Run
            LogTrace("ExecWithArguments called for " + doc.FullFileName);
            Run(doc);
        }

        private void ProcessPart(PartDocument doc)
        {
            using (new HeartBeat())
            {
                LogTrace("Exporting Part document to STEP format");

                // Get the STEP translator
                TranslatorAddIn stepTranslator = null;
                try
                {
                    string stepTranslatorId = "{90AF7F40-0C01-11D5-8E83-0010B541CD80}";
                    stepTranslator = (TranslatorAddIn)_inventorApplication.ApplicationAddIns.ItemById[stepTranslatorId];

                    if (stepTranslator == null)
                    {
                        LogError("Could not get STEP translator.");
                        return;
                    }
                }
                catch (Exception ex)
                {
                    LogError($"Error accessing STEP translator: {ex.Message}");
                    return;
                }

                TranslationContext context = _inventorApplication.TransientObjects.CreateTranslationContext();
                context.Type = IOMechanismEnum.kFileBrowseIOMechanism;

                NameValueMap options = _inventorApplication.TransientObjects.CreateNameValueMap();

                // First check if HasSaveCopyAsOptions is true
                bool hasSaveCopyAsOptions = false;
                try
                {
                    hasSaveCopyAsOptions = stepTranslator.HasSaveCopyAsOptions[doc, context, options];
                }
                catch (Exception ex)
                {
                    LogError($"Error checking HasSaveCopyAsOptions: {ex.Message}");
                }

                // Only set options if HasSaveCopyAsOptions is true
                if (hasSaveCopyAsOptions)
                {
                    LogTrace("Setting STEP export options");
                    // Set only the ApplicationProtocolType like in the VBA code
                    options.Value["ApplicationProtocolType"] = 3; // AP214 - automotive design


                }
                else
                {
                    LogTrace("STEP translator does not support options for this document");
                }

                DataMedium dataMedium = _inventorApplication.TransientObjects.CreateDataMedium();
                string currentDir = System.IO.Directory.GetCurrentDirectory();
                LogTrace($"Current directory: {currentDir}");
                dataMedium.FileName = System.IO.Path.Combine(currentDir, OutputStepName);
                LogTrace($"Output file path: {dataMedium.FileName}");

                // Perform the export
                try
                {
                    LogTrace("Calling SaveCopyAs to export STEP file");
                    stepTranslator.SaveCopyAs(doc, context, options, dataMedium);
                    LogTrace("SaveCopyAs completed successfully");
                }
                catch (Exception ex)
                {
                    LogError($"Error during STEP export: {ex.Message}");
                    return;
                }

                // After export, verify the file
                string exportedFilePath = dataMedium.FileName;
                if (System.IO.File.Exists(exportedFilePath))
                {
                    FileInfo fileInfo = new FileInfo(exportedFilePath);
                    LogTrace($"STEP file created with size: {fileInfo.Length} bytes");

                    // Read the first few bytes to verify it's a valid STEP file
                    try
                    {
                        using (StreamReader sr = new StreamReader(exportedFilePath))
                        {
                            string header = sr.ReadLine();
                            LogTrace($"STEP file header: {header}");
                        }
                    }
                    catch (Exception ex)
                    {
                        LogError($"Error verifying STEP file: {ex.Message}");
                    }
                }
                else
                {
                    LogError("STEP file was not created at the expected location");
                }
            }
        }

        private void ProcessAssembly(AssemblyDocument doc)
        {
            using (new HeartBeat())
            {
                LogTrace("Exporting Assembly document to STEP format");

                // Get the STEP translator
                TranslatorAddIn stepTranslator = null;
                try
                {
                    string stepTranslatorId = "{90AF7F40-0C01-11D5-8E83-0010B541CD80}";
                    stepTranslator = (TranslatorAddIn)_inventorApplication.ApplicationAddIns.ItemById[stepTranslatorId];

                    if (stepTranslator == null)
                    {
                        LogError("Could not get STEP translator.");
                        return;
                    }
                }
                catch (Exception ex)
                {
                    LogError($"Error accessing STEP translator: {ex.Message}");
                    return;
                }

                TranslationContext context = _inventorApplication.TransientObjects.CreateTranslationContext();
                context.Type = IOMechanismEnum.kFileBrowseIOMechanism;

                NameValueMap options = _inventorApplication.TransientObjects.CreateNameValueMap();

                // First check if HasSaveCopyAsOptions is true
                bool hasSaveCopyAsOptions = false;
                try
                {
                    hasSaveCopyAsOptions = stepTranslator.HasSaveCopyAsOptions[doc, context, options];
                }
                catch (Exception ex)
                {
                    LogError($"Error checking HasSaveCopyAsOptions: {ex.Message}");
                }

                // Only set options if HasSaveCopyAsOptions is true
                if (hasSaveCopyAsOptions)
                {
                    LogTrace("Setting STEP export options");
                    // Set only the ApplicationProtocolType like in the VBA code
                    options.Value["ApplicationProtocolType"] = 3; // AP214 - automotive design

                    // We can add these minimal additional options
                    options.Value["Author"] = System.Environment.UserName;
                    options.Value["Organization"] = "Autodesk";
                }
                else
                {
                    LogTrace("STEP translator does not support options for this document");
                }

                DataMedium dataMedium = _inventorApplication.TransientObjects.CreateDataMedium();
                string currentDir = System.IO.Directory.GetCurrentDirectory();
                LogTrace($"Current directory: {currentDir}");
                dataMedium.FileName = System.IO.Path.Combine(currentDir, OutputStepName);
                LogTrace($"Output file path: {dataMedium.FileName}");

                // Perform the export
                try
                {
                    LogTrace("Calling SaveCopyAs to export STEP file");
                    stepTranslator.SaveCopyAs(doc, context, options, dataMedium);
                    LogTrace("SaveCopyAs completed successfully");
                }
                catch (Exception ex)
                {
                    LogError($"Error during STEP export: {ex.Message}");
                    return;
                }

                // After export, verify the file
                string exportedFilePath = dataMedium.FileName;
                if (System.IO.File.Exists(exportedFilePath))
                {
                    FileInfo fileInfo = new FileInfo(exportedFilePath);
                    LogTrace($"STEP file created with size: {fileInfo.Length} bytes");

                    // Read the first few bytes to verify it's a valid STEP file
                    try
                    {
                        using (StreamReader sr = new StreamReader(exportedFilePath))
                        {
                            string header = sr.ReadLine();
                            LogTrace($"STEP file header: {header}");
                        }
                    }
                    catch (Exception ex)
                    {
                        LogError($"Error verifying STEP file: {ex.Message}");
                    }
                }
                else
                {
                    LogError("STEP file was not created at the expected location");
                }
            }
        }

        private TranslatorAddIn GetStepTranslator()
        {
            // Use the specific STEP translator ID from the VBA example
            string stepTranslatorId = "{90AF7F40-0C01-11D5-8E83-0010B541CD80}";

            ApplicationAddIns appAddIns = _inventorApplication.ApplicationAddIns;
            TranslatorAddIn stepTranslator = null;

            try
            {
                stepTranslator = (TranslatorAddIn)appAddIns.ItemById[stepTranslatorId];
                if (stepTranslator != null)
                {
                    LogTrace($"Found STEP translator with ID: {stepTranslatorId}");
                }
            }
            catch (Exception ex)
            {
                LogError($"Error finding STEP translator: {ex.Message}");
            }

            if (stepTranslator == null)
            {
                LogError("STEP translator not found or not activated.");

                // List all available translators for debugging
                LogTrace("Available translators:");
                foreach (ApplicationAddIn addIn in appAddIns)
                {
                    if (addIn is TranslatorAddIn)
                    {
                        LogTrace($"- {addIn.DisplayName} (ID: {addIn.ClassIdString})");
                    }
                }
            }

            return stepTranslator;
        }
    }
}