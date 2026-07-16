const { logActivity } = require("../controllers/activityController");

/**
 * activityLogger middleware
 * Intercepts successful API creations/updates/deletions and logs them to ActivityLog.
 */
const activityLogger = (type, titleTemplate, descriptionTemplate, icon = "📌") => {
  return async (req, res, next) => {
    // We capture the original res.send/res.json to log only on success
    const originalJson = res.json;

    res.json = function (data) {
      // Call original json sender
      res.json = originalJson;
      res.json(data);

      // Perform logging in the background so it doesn't block the client response
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        try {
          // Resolve templates using request body, params, or response data
          let title = titleTemplate;
          let description = descriptionTemplate;

          // Simple templating e.g. {body.destination} or {data.destination}
          const resolver = (str) => {
            if (!str) return "";
            return str.replace(/{([^}]+)}/g, (match, path) => {
              const parts = path.split(".");
              let obj = { req, body: req.body, params: req.params, data };
              for (const part of parts) {
                if (obj && obj[part] !== undefined) {
                  obj = obj[part];
                } else {
                  return match;
                }
              }
              return obj;
            });
          };

          const finalTitle = resolver(title);
          const finalDescription = resolver(description);

          logActivity(req.user._id, {
            type,
            title: finalTitle,
            description: finalDescription,
            entityId: data?._id?.toString() || req.params.id || null,
            entityType: type.split("_")[0],
            icon,
          });
        } catch (err) {
          console.error("Activity logging failed:", err.message);
        }
      }
    };

    next();
  };
};

module.exports = activityLogger;
