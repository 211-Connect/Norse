import { AppConfig } from './appConfig';

export type SubTopic = AppConfig['topics']['list'][number]['subtopics'][number];

export type Topic = AppConfig['topics']['list'][number];
