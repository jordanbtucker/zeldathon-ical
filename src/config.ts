import 'dotenv/config'

const DEFAULT_OUT_FILE = 'data/schedule.ics'

export const graphQLEndpoint = requireEnv('GRAPHQL_ENDPOINT')
export const apiKey = requireEnv('API_KEY')
export const eventID = requireEnv('EVENT_ID')
export const eventName = requireEnv('EVENT_NAME')
export const outFile = process.env.OUT_FILE || DEFAULT_OUT_FILE

function requireEnv(name: string): string {
  const value = process.env[name]
  if (value == null || value === '') {
    throw new Error(`${name} is required`)
  }

  return value
}
