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

using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using WebApplication.Definitions;

namespace WebApplication.Processing
{
    public class FdaClient
    {
        private readonly TransferData _transferData;
        private readonly CreateRFA _rfaWork;
        private readonly ExportDrawing _exportDrawingWork;
        private readonly UpdateDrawings _updateDrawingsWork;
        private readonly AdoptProject _adoptWork;
        private readonly UpdateProject _updateProjectWork;
        private readonly AppBundleZipPaths _paths;
        private readonly Publisher _publisher;
        private readonly CreateSTEP _stepWork;
        private readonly CreateDWG _dwgWork;

        public FdaClient(Publisher publisher, IOptions<AppBundleZipPaths> appBundleZipPathsOptionsAccessor)
        {
            _transferData = new TransferData(publisher);
            _rfaWork = new CreateRFA(publisher);
            _stepWork = new CreateSTEP(publisher); // Dodaj tę linię
            _dwgWork = new CreateDWG(publisher);
            _exportDrawingWork = new ExportDrawing(publisher);
            _updateDrawingsWork = new UpdateDrawings(publisher);
            _adoptWork = new AdoptProject(publisher);
            _updateProjectWork = new UpdateProject(publisher);
            _paths = appBundleZipPathsOptionsAccessor.Value;
            _publisher = publisher;
        }

        public async Task InitializeAsync()
        {
            // create bundles and activities
            await new DataChecker(_publisher).InitializeAsync(_paths.DataChecker);
            await new CreateSVF(_publisher).InitializeAsync(_paths.CreateSVF);
            await new CreateThumbnail(_publisher).InitializeAsync(_paths.CreateThumbnail);
            await new ExtractParameters(_publisher).InitializeAsync(_paths.ExtractParameters);
            await new UpdateParameters(_publisher).InitializeAsync(_paths.UpdateParameters);
            await new CreateBOM(_publisher).InitializeAsync(_paths.CreateBOM);
            await new CreateSTEP(_publisher).InitializeAsync(_paths.CreateSTEP);
            await new CreateDWG(_publisher).InitializeAsync(_paths.CreateSolidsToDWG);
            await new ExportDrawing(_publisher).InitializeAsync(_paths.ExportDrawing);

            await _transferData.InitializeAsync(_paths.EmptyExe);
            await _rfaWork.InitializeAsync(_paths.CreateRFA);
            await _publisher.CleanUpAsync(new CreateSTEP(_publisher));
            await _stepWork.InitializeAsync(_paths.CreateSTEP); // Dodaj tę linię
            await _exportDrawingWork.InitializeAsync(_paths.ExportDrawing);
            await _updateDrawingsWork.InitializeAsync(_paths.UpdateDrawings);

            await _adoptWork.InitializeAsync(null /* does not matter */);
            await _updateProjectWork.InitializeAsync(null /* does not matter */);
        }

        public async Task CleanUpAsync()
        {
            // delete bundles and activities
            await new DataChecker(_publisher).CleanUpAsync();
            await new CreateSVF(_publisher).CleanUpAsync();
            await new CreateThumbnail(_publisher).CleanUpAsync();
            await new ExtractParameters(_publisher).CleanUpAsync();
            await new UpdateParameters(_publisher).CleanUpAsync();
            await new CreateBOM(_publisher).CleanUpAsync();
            await new CreateSTEP(_publisher).CleanUpAsync();
            await new CreateDWG(_publisher).CleanUpAsync();
            await new ExportDrawing(_publisher).CleanUpAsync();

            await _transferData.CleanUpAsync();
            await _rfaWork.CleanUpAsync();
            await _exportDrawingWork.CleanUpAsync();
            await _updateDrawingsWork.CleanUpAsync();

            await _adoptWork.CleanUpAsync();
            await _updateProjectWork.CleanUpAsync();
        }

        public Task<ProcessingResult> AdoptAsync(AdoptionData projectData)
        {
            return _adoptWork.ProcessAsync(projectData);
        }

        public Task<ProcessingResult> UpdateAsync(UpdateData projectData)
        {
            return _updateProjectWork.ProcessAsync(projectData);
        }

        internal Task<ProcessingResult> TransferAsync(string source, string target)
        {
            return _transferData.ProcessAsync(source, target);
        }

        internal async Task<ProcessingResult> GenerateRfa(ProcessingArgs rfaData)
        {
            ProcessingResult rfaResult = await _rfaWork.ProcessAsync(rfaData);
            if (!rfaResult.Success)
            {
                rfaResult.ErrorMessage = "Failed to generate RFA file";
            }

            return rfaResult;
        }

        /// <summary>
        /// Generates STEP file for the document.
        /// </summary>
        public async Task<ProcessingResult> GenerateStep(ProcessingArgs stepData)
        {
            ProcessingResult stepResult = await _stepWork.ProcessAsync(stepData);
            if (!stepResult.Success)
            {
                stepResult.ErrorMessage = "Failed to generate STEP file";
            }

            return stepResult;
        }
        /// <summary>
        /// Generates DWG file for the document.
        /// </summary>
        public async Task<ProcessingResult> GenerateDwg(ProcessingArgs dwgData)
        {
            ProcessingResult dwgResult = await _dwgWork.ProcessAsync(dwgData);
            if (!dwgResult.Success)
            {
                dwgResult.ErrorMessage = "Failed to generate DWG file";
            }

            return dwgResult;
        }

        internal async Task<ProcessingResult> GenerateDrawing(ProcessingArgs data)
        {
            ProcessingResult result = await _updateDrawingsWork.ProcessAsync(data);
            if (!result.Success)
            {
                result.ErrorMessage = "Failed to update drawing file(s)";
            }

            return result;
        }

        internal async Task<ProcessingResult> ExportDrawingAsync(ProcessingArgs drawingData)
        {
            return await _exportDrawingWork.ProcessAsync(drawingData);
        }
    }
}
