const path = require('path')
const fs = require('fs')
const _ = require('lodash')
const table = require('markdown-table')
const markdownMagic = require('markdown-magic')
const npmTotal = require('npmtotal')
const pkg = require('./package.json')
const badgeStats = require('./stats.json')

const key = pkg['npm-stats']

if (!key) {
  throw new Error('Please add `npm-stats` to your package.json'); // eslint-disable-line
}

const exclude = [
  'fung-shway',
  '@vendia/serverless-express',
  'testing-lerna-usage',
  'testing-lerna-one',
  'testing-lerna-two',
  '@serverless/sdk',
  'micro-api-client',
  '@middy',
  'proto-jojo',
  'serviceful',
  '@middy/core',
  '@middy/error-logger',
  '@middy/http-partial-response',
  '@middy/http-content-negotiation',
  '@middy/input-output-logger',
  '@middy/s3-key-normalizer',
  'vue-cli-plugin-netlify-lambda',
  '@middy/function-shield',
  '@netlify/git-utils',
  '@netlify/run-utils',
  '@netlify/functions-utils',
  '@middy/ssm',
  '@middy/secrets-manager',
  '@middy/validator',
  'netlify-lambda',
  '@middy/cache',
  '@middy/http-error-handler',
  '@netlify/rules-proxy',
  'netlify-redirector',
  'netlify-cms',
  'netlify-cli-logo',
  '@netlify/open-api',
  'gotrue-js',
  'gocommerce-js',
  'netlify-lm-plugin',
  '@netlify/cli-utils',
  'netlify-setup-heuristics',
  '@serverless/emulator',
  'netlify',
  '@netlify/zip-it-and-ship-it',
  'netlify-identity-widget',
  'middy',
  'netlify-redirect-parser',
  '@netlify/config',
  'user-events',
  '@middy/http-urlencode-path-parser',
  '@middy/http-urlencode-body-parser',
  '@middy/do-not-wait-for-empty-event-loop',
  '@middy/http-multipart-body-parser',
  '@middy/http-cors',
  '@middy/http-header-normalizer',
  '@middy/http-json-body-parser',
  '@middy/http-event-normalizer',
  '@middy/http-response-serializer',
  '@middy/warmup',
  '@netlify/cache-utils',
  '@middy/http-security-headers',
  '@middy/db-manager',
  'phenomic-serverless',
  '@serverless/sdk',
  '@serverless/aws',
  '@netlify/parse-domain',
  '@netlify/plugin-sitemap',
  '@netlify/sitemap-plugin',
  '@serverless/ui-components',
  '@serverless/fdk',
  'netlify-dev-plugin',
  'npm-post-install-example',
  'netlifys_api_definition'
]

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function generateMarkdownTable(tableRows, sum) {
  const total = numberWithCommas(sum)
  const config = {
    transforms: {
      PACKAGES() {
        return table([
          ['Name', 'Downloads'],
          ['**Total**', `**${total}**`],
          ...tableRows,
          ['**Total**', `**${total}**`],
        ])
      }
    }
  }

  markdownMagic(path.join(__dirname, 'README.md'), config, d => {
    console.log(`Updated total downloads ${sum}`)
  })
}

(async () => {
  console.log(`Running npmTotal(${key}), This can take some time`)

  let stats
  try {
    stats = await npmTotal(key, {
      exclude: exclude
    })
  } catch (e) {
    console.error(e)
    process.exit(1)
  }

  if (!stats) {
    console.error('No stats found')
    process.exit(1)
  }

  const sortedStats = _.reverse(
    _.sortBy(stats.stats, [
      function(o) {
        return o[1]
      }
    ])
  ).filter((d) => {
    const [name, count] = d
    if (count === 0) {
      return false
    }
    if (name.match(/^@middy/)) {
      return false
    }
    return true
  }).map((d) => {
    const [name, count] = d
    return [
      `[${name}](https://www.npmjs.com/package/${name})`,
      numberWithCommas(count)
    ]
  })
  // '@serverless', '@netlify', 'netlify-', '@middy'

  badgeStats.message = `${numberWithCommas(stats.sum)} Downloads`

  await fs.writeFileSync('./stats.json', JSON.stringify(badgeStats, null, 2))

  generateMarkdownTable(sortedStats, stats.sum)
})()
