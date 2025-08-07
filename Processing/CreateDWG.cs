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

using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using WebApplication.Definitions;
using WebApplication.Services;
using WebApplication.Utilities;

namespace WebApplication.Processing
{
    /// <summary>
    /// Export solids to DWG 2004 format.
    /// </summary>
    public class CreateDWG : ProcessingBase
    {
        public CreateDWG(ILogger<CreateDWG> logger, OssClient ossClient, UserResolver userResolver, IPostProcessing postProcessing) : base(logger, ossClient, userResolver, postProcessing)
        {
        }

        public override string Id => nameof(CreateDWG);
        public override string Description => "Generate DWG 2004";

        protected override string OutputUrl(ProcessingArgs projectData) => projectData.DwgUrl;

        protected override string OutputName => "exported_solids.dwg";

        public override async Task<ProcessingResult> ProcessAsync(ProcessingArgs args)
        {
            using var scope = Logger.BeginScope("Export DWG ({id}, {url})", Id, args.ProjectUrl);

            var fordaClient = await FdaClient.CreateAsync(OssClient.Configuration.ClientId, OssClient.Configuration.ClientSecret, Logger);

            await fordaClient.EnsureAppBundleExistsAsync(FdaClient.ExportSolidsToDWGAppBundleZip, Id);

            var activityId = $"{Id}Activity";
            await fordaClient.EnsureActivityExistsAsync(activityId, Id);

            var inputUrl = await OssClient.CreateSignedUrlAsync(args.ProjectUrl, ObjectAccess.Read);
            var outputUrl = await OssClient.CreateSignedUrlAsync(OutputUrl(args), ObjectAccess.ReadWrite);

            // Start activity
            var workItemStatus = await fordaClient.SubmitWorkItemAsync(activityId, inputUrl, outputUrl);
            Logger.LogInformation($"Submitted work item ({workItemStatus.Id})");

            var reportUrl = await fordaClient.GetWorkItemReportLogAsync(workItemStatus.Id);
            return new ProcessingResult
            {
                Success = (workItemStatus.Status == Status.Success),
                ReportUrl = reportUrl,
                ErrorMessage = workItemStatus.Status == Status.Success ? null : "DWG export failed"
            };
        }
    }
}