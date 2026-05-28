import { Client, Databases, Query, type Models } from 'node-appwrite'
import { config } from '../config.js'

const client = new Client()
  .setEndpoint(config.APPWRITE_ENDPOINT)
  .setProject(config.APPWRITE_PROJECT_ID)
  .setKey(config.APPWRITE_API_KEY)

export const databases = new Databases(client)

/**
 * Lista todos los documentos de una colección usando paginación por cursor.
 */
export async function listAllDocuments(
  databaseId: string,
  collectionId: string,
  queries: string[] = []
): Promise<Models.Document[]> {
  const pageSize = 100
  const all: Models.Document[] = []
  let cursorAfter: string | null = null

  while (true) {
    const pageQueries = [...queries, Query.limit(pageSize)]
    if (cursorAfter) {
      pageQueries.push(Query.cursorAfter(cursorAfter))
    }

    const page = await databases.listDocuments(databaseId, collectionId, pageQueries)
    all.push(...page.documents)

    if (page.documents.length < pageSize) {
      break
    }

    const lastId = page.documents[page.documents.length - 1]?.$id
    if (!lastId) {
      break
    }
    cursorAfter = lastId
  }

  return all
}
