const dotEnv = require("dotenv")
const sysPath = require("path")
const process = require("process")

module.exports = function(data) {
  const t = data.types

  return {
    visitor: {
      ImportDeclaration: function(path, state) {
        const options = state.opts

        if (options.replacedModuleName === undefined) return

        const configDir = options.configDir ? options.configDir : "./"
        const configFile = options.filename ? options.filename : ".env"
        const env = process.env.BABEL_ENV || "development"

        if (path.node.source.value === options.replacedModuleName) {
          const config = dotEnv.config({
            path: sysPath.join(configDir, `${configFile}`),
            silent: true
          }) || {}

          const envConfig = Object.assign({}, config, dotEnv.config({
            path: sysPath.join(configDir, `${configFile}.${env}`),
            silent: true
          }))

          const iOSConfig = Object.assign({}, envConfig, dotEnv.config({
            path: sysPath.join(configDir, `${configFile}.${env}.ios`),
            silent: true
          }))

          const androidConfig = Object.assign({}, envConfig, dotEnv.config({
            path: sysPath.join(configDir, `${configFile}.${env}.android`),
            silent: true
          }))

          path.node.specifiers.forEach(function(specifier, idx) {
            if (specifier.type === "ImportDefaultSpecifier") {
              throw path
                .get("specifiers")
                [idx].buildCodeFrameError("Default imports are not supported")
            }
            const importedId = specifier.imported.name
            const localId = specifier.local.name

            if (!iOSConfig[importedId]) {
              throw path
                .get("specifiers")
                [idx].buildCodeFrameError(
                  `Import variable ${importedId} not found in any .env files`
                )
            }

            if (!androidConfig[importedId]) {
              throw path
                .get("specifiers")
                [idx].buildCodeFrameError(
                  `Import variable ${importedId} not found`
                )
            }            

            const binding = path.scope.getBinding(localId)
            binding.referencePaths.forEach(function(refPath) {
              if (iOSConfig[importedId] && androidConfig[importedId]) {
                const val = `require("Platform").OS === "ios" ? "${iOSConfig[
                  importedId
                ]}" : "${androidConfig[importedId]}"`
                refPath.replaceWithSourceString(val)
              }
            })
          })

          path.remove()
        }
      }
    }
  }
}
