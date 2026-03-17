module.exports = {
  // Use auto-detection for the HMR WebSocket URL so it works through
  // VS Code's dev container port forwarding
  devServer: {
    client: {
      webSocketURL: "auto://0.0.0.0:0/ws",
    },
  },

  webpack: {
    configure: (webpackConfig) => {
      // Remove ModuleScopePlugin to allow imports from outside the project root
      // (needed for @bcparks-staff-portal/shared)
      webpackConfig.resolve.plugins = webpackConfig.resolve.plugins.filter(
        (plugin) => plugin.constructor.name !== "ModuleScopePlugin",
      );

      webpackConfig.ignoreWarnings = [
        function ignoreSourcemapsloaderWarnings(warning) {
          return (
            warning.module &&
            warning.module.resource.includes("node_modules") &&
            warning.details &&
            warning.details.includes("source-map-loader")
          );
        },
      ];

      return webpackConfig;
    },
  },
};
