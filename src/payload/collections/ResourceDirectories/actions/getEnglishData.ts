'use server';

export async function getEnglishData(
  resourceDirectoryId: string,
): Promise<Record<string, string>> {
  const { getPayloadSingleton } = await import('@/payload/getPayloadSingleton');
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

  const englishMap: Record<string, string> = {};

  const topics = resourceDirectory.topics?.list || [];
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

  const suggestions = resourceDirectory.suggestions || [];
  suggestions.forEach((suggestion) => {
    if (suggestion.id && suggestion.value) {
      englishMap[suggestion.id] = suggestion.value;
    }
  });

  return englishMap;
}
