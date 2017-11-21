var babel = require("babel-core");
var expect = require('expect.js');
var process = require('process');

var createPluginsWithConfigDir = function(configDir) {
  return ['babel-plugin-transform-es2015-modules-commonjs', ['../../../',
  {
    replacedModuleName: 'babel-dotenv',
    configDir: configDir,
  }]];
}

describe('all tests', function() {
  const FooExpected = `require("Platform").OS === "ios" ? "foo" : "foo"`
  const FooPlatformExpected = `require("Platform").OS === "ios" ? "ios_foo" : "android_foo"`
  const BarExpected = `require("Platform").OS === "ios" ? "bar" : "bar"`
  const BarPlatformExpected = `require("Platform").OS === "ios" ? "ios_bar" : "android_bar"`

  it('should throw if variable not exist', function() {
    expect(function(){
      babel.transformFileSync('test/fixtures/variable-not-exist/source.js')
    }).to.throwException(function (e) {
      expect(e.message).to.contain("not found");
    });
  });

  it('should throw if default is imported', function() {
    expect(function(){
      babel.transformFileSync('test/fixtures/default-imported/source.js')
    }).to.throwException(function (e) {
      expect(e.message).to.contain("imports");
    });
  });

  it('should load default env from .env', function(){
    var result = babel.transformFileSync('test/fixtures/default/source.js')
    console.log(result.code)
    expect(result.code).to.be(`'use strict';\n\nconsole.log(${FooExpected});\nconsole.log(${BarExpected});`)
  })

  it('should load let .env.development overwrite .env', function(){
    var result = babel.transformFileSync('test/fixtures/dev-env/source.js')
    expect(result.code).to.be(`'use strict';\n\nconsole.log(${FooExpected});\nconsole.log(${BarExpected});`)
  })

  it('should load custom env file "build.env" and its overwrites', function(){
    var result = babel.transformFileSync('test/fixtures/filename/source.js')
    expect(result.code).to.be(`'use strict';\n\nconsole.log(${FooExpected});\nconsole.log(${BarExpected});`)
  })

  it('should load ios and android platform .env files', function(){
    var result = babel.transformFileSync('test/fixtures/platform/source.js')
    expect(result.code).to.be(`'use strict';\n\nconsole.log(${FooPlatformExpected});\nconsole.log(${BarPlatformExpected});`)
  })

  it('should load let .env.production overwrite .env', function(){
    process.env['BABEL_ENV'] = 'production';
    var result = babel.transformFileSync('test/fixtures/prod-env/source.js')
    expect(result.code).to.be(`'use strict';\n\nconsole.log(${FooExpected});\nconsole.log(${BarExpected});`)
    process.env['BABEL_ENV'] = undefined;
  })

  it('should support `as alias` import syntax', function(){
    var result = babel.transformFileSync('test/fixtures/as-alias/source.js')
    expect(result.code).to.be(`'use strict';\n\nvar a = ${FooExpected};\nvar b = ${BarExpected};`)
  })

  it('should do nothing if no `replacedModuleName` provided', function(){
    var result = babel.transformFileSync('test/fixtures/replaced-module-name-not-provided/source.js')
    expect(result.code).to.be('\'use strict\';\n\nvar _fancyDotenv = require(\'fancy-dotenv\');\n\nvar _fancyDotenv2 = _interopRequireDefault(_fancyDotenv);\n\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }')
  })
});
