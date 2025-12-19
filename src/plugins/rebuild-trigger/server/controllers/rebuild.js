"use strict";

const config = {
  githubToken: process.env.GITHUB_TOKEN,
  owner: "play14team",
  repo: "play14-ui",
};

const mapRun = (run) => ({
  id: run.id,
  status: run.status, // queued, in_progress, completed
  conclusion: run.conclusion, // success, failure, cancelled, skipped, etc.
  createdAt: run.created_at,
  updatedAt: run.updated_at,
  htmlUrl: run.html_url,
  runNumber: run.run_number,
  event: run.event,
  actor: run.actor?.login,
  workflowName: run.name,
});

module.exports = {
  async trigger(ctx) {
    try {
      const githubService = strapi.service("api::github-trigger.github-trigger");

      if (!githubService) {
        ctx.throw(500, "GitHub trigger service not available");
        return;
      }

      const success = await githubService.triggerWorkflow("Manual trigger from admin panel");

      if (success) {
        ctx.body = {
          success: true,
          message: "Website rebuild triggered successfully",
        };
      } else {
        ctx.throw(500, "Failed to trigger rebuild. Check server logs for details.");
      }
    } catch (error) {
      strapi.log.error("Rebuild trigger error:", error);
      ctx.throw(500, error.message || "Failed to trigger rebuild");
    }
  },

  async status(ctx) {
    try {
      if (!config.githubToken) {
        ctx.throw(500, "GitHub token not configured");
        return;
      }

      // Fetch the latest workflow runs for the repository (all workflows)
      const response = await fetch(
        `https://api.github.com/repos/${config.owner}/${config.repo}/actions/runs?per_page=20`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `token ${config.githubToken}`,
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        strapi.log.error("GitHub API error:", errorText);
        ctx.throw(response.status, "Failed to fetch workflow status");
        return;
      }

      const data = await response.json();
      const runs = data.workflow_runs || [];

      // Find the latest run (first in list)
      const latestRun = runs[0] ? mapRun(runs[0]) : null;

      // Find the latest successful run
      const successfulRun = runs.find(
        (run) => run.status === "completed" && run.conclusion === "success"
      );
      const latestSuccessfulRun = successfulRun ? mapRun(successfulRun) : null;

      ctx.body = {
        success: true,
        latestRun,
        latestSuccessfulRun,
      };
    } catch (error) {
      strapi.log.error("Workflow status error:", error);
      ctx.throw(500, error.message || "Failed to fetch workflow status");
    }
  },
};
