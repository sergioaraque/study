import { Client, Databases } from 'node-appwrite'
import { config } from '../config.js'

const client = new Client()
  .setEndpoint(config.APPWRITE_ENDPOINT)
  .setProject(config.APPWRITE_PROJECT_ID)
  .setKey(config.APPWRITE_API_KEY)

export const databases = new Databases(client)
