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

using System.Collections.Generic;
using WebApplication.Definitions;

namespace WebApplication.Processing
{
    public class CreateDWG : ForgeAppBase
    {
        public override string Id => nameof(CreateDWG);
        public override string Description => "Generate DWG 2004 file for Inventor document";

        // Register both AppBundle and Activity
        protected internal override ForgeRegistration Registration => ForgeRegistration.All;

        protected override string OutputUrl(ProcessingArgs projectData) => projectData.DwgUrl;

        // Output filename must match what the AppBundle generates
        protected override string OutputName => "exported_solids.dwg";

        public CreateDWG(Publisher publisher) : base(publisher) { }

        public override List<string> ActivityCommandLine =>
            new List<string>
            {
                $"$(engine.path)\\InventorCoreConsole.exe /al \"$(appbundles[{ActivityId}].path)\" /ilod \"$(args[{InputDocParameterName}].path)\""
            };
    }
}