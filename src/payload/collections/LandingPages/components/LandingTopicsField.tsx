'use client';

import { Button, toast, useDocumentInfo, useFormFields } from '@payloadcms/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  type DirectorySources,
  type TopicSearch,
  type TopicSource,
  listTopicSources,
} from '@/app/(app)/features/landing-pages/lib/topicSources';

import './LandingTopicsField.css';

type TopicRow = {
  id: number;
  name: string;
  slug?: string | null;
  deletedAt?: string | null;
  search: TopicSearch;
  source?: { kind?: string | null; ref?: string | null } | null;
};

type Tab = 'subtopic' | 'suggestion' | 'custom';

const TABS: { id: Tab; label: string }[] = [
  { id: 'subtopic', label: 'From topic cards' },
  { id: 'suggestion', label: 'From suggestions' },
  { id: 'custom', label: 'Custom query' },
];

const sourceKey = (kind: string, ref: string) => `${kind}:${ref}`;

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) throw new Error(`Request failed with ${response.status}`);
  return (await response.json()) as T;
}

async function createTopic(body: Record<string, unknown>): Promise<void> {
  const response = await fetch('/api/landing-page-topics?locale=en', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      errors?: {
        message?: string;
        data?: { errors?: { message?: string }[] };
      }[];
    } | null;
    const error = payload?.errors?.[0];
    throw new Error(
      error?.data?.errors?.[0]?.message ??
        error?.message ??
        `HTTP ${response.status}`,
    );
  }
}

/**
 * The Topics section of the Landing Pages tab: the tenant's landing-page
 * topics, and an Add topics panel that copies a topic-card subtopic, a
 * search suggestion or a custom query into a new topic
 * (docs/landing-pages.md, Topics). Reads the saved Resource Directory, so
 * new cards or suggestions appear after a save.
 */
const LandingTopicsField = () => {
  const { id: directoryId } = useDocumentInfo();
  const tenantValue = useFormFields(([fields]) => fields.tenant?.value);
  const tenantId =
    tenantValue && typeof tenantValue === 'object' && 'id' in tenantValue
      ? String((tenantValue as { id: unknown }).id)
      : tenantValue
        ? String(tenantValue)
        : null;

  const [topics, setTopics] = useState<TopicRow[] | null>(null);
  const [sources, setSources] = useState<TopicSource[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('subtopic');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [custom, setCustom] = useState({
    name: '',
    queryType: 'text' as TopicSearch['queryType'],
    query: '',
  });

  const load = useCallback(async () => {
    if (!tenantId || !directoryId) return;
    try {
      const [directory, list] = await Promise.all([
        getJson<DirectorySources>(
          `/api/resource-directories/${directoryId}?depth=0&locale=en`,
        ),
        getJson<{ docs: TopicRow[] }>(
          `/api/landing-page-topics?where[tenant][equals]=${encodeURIComponent(tenantId)}&limit=0&depth=0&locale=en&sort=name&trash=true`,
        ),
      ]);
      setSources(listTopicSources(directory));
      setTopics(list.docs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [tenantId, directoryId]);

  useEffect(() => {
    void load();
  }, [load]);

  const added = useMemo(
    () =>
      new Set(
        (topics ?? [])
          .filter((t) => t.source?.kind && t.source.ref)
          .map((t) => sourceKey(t.source!.kind!, t.source!.ref!)),
      ),
    [topics],
  );

  const toggle = (key: string) =>
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  /** Keys that can still be ticked: have a search and aren't topics yet. */
  const selectableKeys = (list: TopicSource[]) =>
    list
      .filter((s) => s.search && !s.disabledReason)
      .map((s) => sourceKey(s.kind, s.ref))
      .filter((key) => !added.has(key));

  /** "Select all" for a list, or "Clear" once all of it is ticked. */
  const selectAllButton = (list: TopicSource[], label: string) => {
    const keys = selectableKeys(list);
    if (keys.length === 0) return null;
    const all = keys.every((key) => selected.has(key));
    return (
      <button
        type="button"
        className="landing-topics__select-all"
        onClick={() =>
          setSelected((previous) => {
            const next = new Set(previous);
            for (const key of keys) {
              if (all) next.delete(key);
              else next.add(key);
            }
            return next;
          })
        }
      >
        {all ? 'Clear' : label}
      </button>
    );
  };

  const addSelected = async () => {
    if (!tenantId) return;
    setSaving(true);
    const chosen = sources.filter(
      (s) => s.search && selected.has(sourceKey(s.kind, s.ref)),
    );
    const failures: string[] = [];
    for (const source of chosen) {
      try {
        await createTopic({
          tenant: tenantId,
          name: source.label,
          search: source.search,
          source: { kind: source.kind, ref: source.ref, label: source.label },
        });
      } catch (err) {
        failures.push(`${source.label}: ${(err as Error).message}`);
      }
    }
    setSaving(false);
    setSelected(new Set());
    if (failures.length) toast.error(failures.join('\n'));
    if (chosen.length > failures.length) {
      toast.success(
        `Added ${chosen.length - failures.length} topic(s). Names are being translated.`,
      );
    }
    await load();
  };

  const addCustom = async () => {
    if (!tenantId || !custom.name.trim() || !custom.query.trim()) return;
    setSaving(true);
    try {
      await createTopic({
        tenant: tenantId,
        name: custom.name.trim(),
        search: { queryType: custom.queryType, query: custom.query.trim() },
        source: { kind: 'custom' },
      });
      toast.success(`Added ${custom.name.trim()}.`);
      setCustom({ name: '', queryType: 'text', query: '' });
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!directoryId) {
    return (
      <p className="landing-topics__muted">
        Save the Resource Directory first.
      </p>
    );
  }

  const visible = sources.filter((s) => s.kind === tab);
  const groups = Array.from(new Set(visible.map((s) => s.group ?? '')));

  return (
    <section className="landing-topics">
      <header className="landing-topics__header">
        <div>
          <h3 className="landing-topics__title">Topics</h3>
          <p className="landing-topics__muted">
            Every selected region gets a page for every topic. Deleting a topic
            moves it to the trash. Changes take effect on Apply changes.
          </p>
        </div>
        <Button
          buttonStyle={open ? 'secondary' : 'primary'}
          size="small"
          onClick={() => setOpen(!open)}
        >
          {open ? 'Close' : 'Add topics'}
        </Button>
      </header>

      {error && <p className="landing-topics__error">{error}</p>}

      {open && (
        <div className="landing-topics__panel">
          <div className="landing-topics__tabs" role="tablist">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                className="landing-topics__tab"
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'custom' ? (
            <div className="landing-topics__custom">
              <label>
                <span>Name</span>
                <input
                  value={custom.name}
                  placeholder="Food pantries"
                  onChange={(e) =>
                    setCustom({ ...custom, name: e.target.value })
                  }
                />
              </label>
              <label>
                <span>Search by</span>
                <select
                  value={custom.queryType}
                  onChange={(e) =>
                    setCustom({
                      ...custom,
                      queryType: e.target.value as TopicSearch['queryType'],
                    })
                  }
                >
                  <option value="text">Text</option>
                  <option value="taxonomy">Taxonomy codes</option>
                </select>
              </label>
              <label className="landing-topics__wide">
                <span>
                  {custom.queryType === 'taxonomy'
                    ? 'Taxonomy codes, comma-separated'
                    : 'Search text'}
                </span>
                <input
                  value={custom.query}
                  placeholder={
                    custom.queryType === 'taxonomy'
                      ? 'BD-1800.2000, BD-1800.1900'
                      : 'food pantry'
                  }
                  onChange={(e) =>
                    setCustom({ ...custom, query: e.target.value })
                  }
                />
              </label>
              <Button
                size="small"
                disabled={saving || !custom.name.trim() || !custom.query.trim()}
                onClick={addCustom}
              >
                Add topic
              </Button>
            </div>
          ) : visible.length === 0 ? (
            <p className="landing-topics__muted">
              {tab === 'subtopic'
                ? 'This Resource Directory has no topic cards with subtopics.'
                : 'This Resource Directory has no search suggestions.'}
            </p>
          ) : (
            <>
              <div className="landing-topics__toolbar">
                {selectAllButton(
                  visible,
                  tab === 'subtopic'
                    ? 'Select all subtopics'
                    : 'Select all suggestions',
                )}
              </div>
              {groups.map((group) => {
                const inGroup = visible.filter(
                  (s) => (s.group ?? '') === group,
                );
                return (
                  <fieldset key={group} className="landing-topics__group">
                    {group && (
                      <legend>
                        {group}
                        {groups.length > 1 &&
                          selectAllButton(inGroup, 'Select all')}
                      </legend>
                    )}
                    {inGroup.map((source) => {
                      const key = sourceKey(source.kind, source.ref);
                      const isAdded = added.has(key);
                      const reason = isAdded
                        ? undefined
                        : source.disabledReason;
                      return (
                        <label
                          key={key}
                          className="landing-topics__option"
                          data-disabled={
                            isAdded || Boolean(reason) || undefined
                          }
                          title={isAdded ? 'Already a topic' : undefined}
                        >
                          <input
                            type="checkbox"
                            disabled={isAdded || Boolean(reason)}
                            checked={selected.has(key)}
                            onChange={() => toggle(key)}
                          />
                          <span>{source.label || '(no name)'}</span>
                          {isAdded && (
                            <span
                              className="landing-topics__added"
                              aria-label="Already a topic"
                            >
                              ✓
                            </span>
                          )}
                          {reason && (
                            <span className="landing-topics__reason">
                              {reason}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </fieldset>
                );
              })}
              <Button
                size="small"
                disabled={saving || selected.size === 0}
                onClick={addSelected}
              >
                {saving
                  ? 'Adding…'
                  : `Add ${selected.size || ''} topic${selected.size === 1 ? '' : 's'}`}
              </Button>
            </>
          )}
        </div>
      )}

      {topics === null ? (
        <p className="landing-topics__muted">Loading topics…</p>
      ) : topics.length === 0 ? (
        <p className="landing-topics__muted">No topics yet.</p>
      ) : (
        <table className="landing-topics__table">
          <thead>
            <tr>
              <th>Topic</th>
              <th>URL slug</th>
              <th>Search</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((topic) => (
              <tr
                key={topic.id}
                data-trashed={topic.deletedAt ? true : undefined}
              >
                <td>
                  <a
                    href={`/admin/collections/landing-page-topics/${topic.deletedAt ? 'trash/' : ''}${topic.id}`}
                  >
                    {topic.name}
                  </a>
                  {topic.deletedAt && (
                    <span className="landing-topics__trashed">
                      In the trash
                    </span>
                  )}
                </td>
                <td
                  className="landing-topics__slug"
                  title={topic.slug ? `/${topic.slug}/…` : undefined}
                >
                  <code>/{topic.slug ?? '…'}/…</code>
                </td>
                <td
                  className="landing-topics__search"
                  title={topic.search.query}
                >
                  {topic.search.queryType === 'taxonomy' ? 'Codes: ' : 'Text: '}
                  {topic.search.query}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};

export default LandingTopicsField;
