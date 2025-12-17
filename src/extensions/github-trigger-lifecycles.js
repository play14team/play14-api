/**
 * Global lifecycle hooks for GitHub Actions trigger
 * Triggers play14-ui build when content is published or unpublished
 *
 * Content types that trigger builds:
 * - Events (api::event.event)
 * - Players (api::player.player)
 * - Games (api::game.game)
 * - Articles (api::article.article)
 * - Home page (api::home.home)
 * - Venues (api::venue.venue)
 * - Hostings (api::hosting.hosting)
 */

const TRIGGER_CONTENT_TYPES = [
  "api::event.event",
  "api::player.player",
  "api::game.game",
  "api::article.article",
  "api::home.home",
  "api::venue.venue",
  "api::hosting.hosting",
];

module.exports = {
  /**
   * Register lifecycle hooks for all content types that should trigger builds
   * Uses database lifecycle hooks since Document Service lifecycle hooks
   * are not available for external subscription in Strapi 5
   */
  register({ strapi }) {
    // Get the github-trigger service
    const getGithubTrigger = () => {
      try {
        return strapi.service("api::github-trigger.github-trigger");
      } catch (error) {
        strapi.log.warn(
          "[GitHub Trigger Lifecycles] Service not available:",
          error.message,
        );
        return null;
      }
    };

    TRIGGER_CONTENT_TYPES.forEach((uid) => {
      try {
        // Subscribe to database lifecycle hooks
        strapi.db.lifecycles.subscribe({
          models: [uid],

          /**
           * Trigger when content is updated
           * Simplified to only check if publishedAt changed without extra DB query
           */
          async afterUpdate(event) {
            const githubTrigger = getGithubTrigger();
            if (!githubTrigger) return;

            const contentType = uid.split("::")[1].split(".")[1];
            const documentId = event.result?.documentId || event.result?.id;

            // Only trigger if publishedAt was included in the update
            // This indicates a publish/unpublish action
            if (event.params.data.publishedAt === undefined) return;

            // Determine action based on the new publishedAt value
            const currentPublishedAt = event.result.publishedAt;
            const action = currentPublishedAt !== null ? "published" : "unpublished";

            strapi.log.info(
              `[GitHub Trigger] Detected ${contentType} ${action}: ${documentId}`,
            );
            githubTrigger.debouncedTrigger(
              `${contentType} ${action}: ${documentId}`,
            );
          },

          /**
           * Trigger when content is deleted
           * This ensures the frontend removes deleted content
           */
          async afterDelete(event) {
            const githubTrigger = getGithubTrigger();
            if (!githubTrigger) return;

            const contentType = uid.split("::")[1].split(".")[1];
            const documentId = event.result?.documentId || event.result?.id;

            strapi.log.info(
              `[GitHub Trigger] Detected ${contentType} deleted: ${documentId}`,
            );
            githubTrigger.debouncedTrigger(
              `${contentType} deleted: ${documentId}`,
            );
          },
        });

        strapi.log.info(
          `[GitHub Trigger] Registered publish/unpublish lifecycle hooks for ${uid}`,
        );
      } catch (error) {
        strapi.log.error(
          `[GitHub Trigger] Failed to register lifecycle hooks for ${uid}:`,
          error.message,
        );
      }
    });
  },
};
