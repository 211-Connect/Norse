'use server';

import { getPayloadSingleton } from '@/payload/getPayloadSingleton';

export async function getEnglishTopics(
  resourceDirectoryId: string,
): Promise<Record<string, string>> {
  const payload = await getPayloadSingleton();

  const resourceDirectory = await payload.findByID({
    collection: 'resource-directories',
    id: resourceDirectoryId,
    locale: 'en',
    depth: 2,
  });

  if (!resourceDirectory) {
    return {};
  }

  const topics = resourceDirectory.topics?.list || [];
  const englishMap: Record<string, string> = {};

  // Map all topic and subtopic IDs to their English names
  topics.forEach((topic) => {
    if (topic.id && topic.name) {
      englishMap[topic.id] = topic.name;
    }

    topic.subtopics?.forEach((subtopic) => {
      if (subtopic.id && subtopic.name) {
        englishMap[subtopic.id] = subtopic.name;
      }
    });
  });

  return englishMap;
}
