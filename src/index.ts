import * as core from '@actions/core'
import * as https from 'https'
import {BitlyLink} from './types'

const run = async (): Promise<void> => {
  const longUrl: string = core.getInput('long_url')
  const bitlyToken: string = core.getInput('bitly_token')
  const customDomain: string = core.getInput('bitly_custom_domain')

  try {
    const bitlyLink = await bitly(bitlyToken, longUrl, customDomain)
    console.dir(bitlyLink, {depth: null})
    core.setOutput('bitly_link', bitlyLink.link)
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

const bitly = async (
  bitlyToken: string,
  longUrl: string,
  customDomain?: string
): Promise<BitlyLink> => {
  const data = JSON.stringify({
    long_url: longUrl,
    domain: customDomain || 'bit.ly'
  })
  

  const options = {
    hostname: 'api-ssl.bitly.com',
    path: '/v4/shorten',
    port: 443,
    method: 'POST',
    json: data,
    headers: {
      Authorization: `Bearer ${bitlyToken}`,
      'Content-Type': 'application/json'
    }
  }

  return new Promise<BitlyLink>((resolve, reject) => {
    
    core.info(`Requesting Bit.ly short URL for: ${longUrl}`)
    https.request(options, response => {
      let body = ''
      response
        .on('data', chunk => {
          body += chunk
        })
        .on('end', () => {
          const result = JSON.parse(body)
          
          core.info(`Status Code received from Bit.ly: ${result.status_code}`)

          if (result.status_code === 200) {
            resolve(result.data as BitlyLink)
          } else {
            reject(new Error(result.status_txt))
          }
        })
        .on('error', error => {
          core.error((error as Error).message)
          reject(error)
        })
        .on('timeout', () => {
          core.error('Request timed out')
          reject(new Error('Timeout'))
        })
        .setTimeout(10000)
    })
  })
}

run()
