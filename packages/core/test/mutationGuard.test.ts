import { describe, expect, it } from 'vitest';

import {
  KeyedMutationVersion,
  StaleResponseGuard,
  isCurrentMutation,
  nextMutationVersion,
} from '../src';

describe('keyed mutation versions', () => {
  it('increments and checks versions per key', () => {
    const versions = new Map<string, number>();

    const firstA = nextMutationVersion(versions, 'a');
    const firstB = nextMutationVersion(versions, 'b');
    const secondA = nextMutationVersion(versions, 'a');

    expect(firstA).toBe(1);
    expect(firstB).toBe(1);
    expect(secondA).toBe(2);
    expect(isCurrentMutation(versions, 'a', firstA)).toBe(false);
    expect(isCurrentMutation(versions, 'a', secondA)).toBe(true);
  });

  it('offers an object-oriented version tracker', () => {
    const versions = new KeyedMutationVersion();
    const first = versions.begin('resource:1');
    const second = versions.begin('resource:1');

    expect(versions.isCurrent('resource:1', first)).toBe(false);
    expect(versions.isCurrent('resource:1', second)).toBe(true);

    versions.clear('resource:1');
    expect(versions.current('resource:1')).toBe(3);
    expect(versions.isCurrent('resource:1', second)).toBe(false);
  });

  it('never revalidates an old snapshot after clearing and reusing a key', () => {
    const versions = new KeyedMutationVersion();
    const old = versions.snapshot('save');

    versions.clear('save');
    const current = versions.snapshot('save');

    expect(versions.isCurrent(old.key, old.version)).toBe(false);
    expect(versions.isCurrent(current.key, current.version)).toBe(true);
  });
});

describe('stale response guard', () => {
  it('rejects responses from older versions', () => {
    const guard = new StaleResponseGuard();

    const older = guard.begin('answer:1');
    const newer = guard.begin('answer:1');

    expect(guard.isCurrent(older)).toBe(false);
    expect(guard.isCurrent(newer)).toBe(true);
  });

  it('rejects responses captured under a previous scope', () => {
    const guard = new StaleResponseGuard<string>();

    guard.setScope('problem-a');
    const snapshot = guard.begin('check');
    guard.setScope('problem-b');

    expect(guard.accept(snapshot, 'stale')).toBeUndefined();
    expect(guard.accept(snapshot, 'stale', { fallback: 'fallback' })).toBe('fallback');
  });

  it('accepts custom scope comparators', () => {
    const guard = new StaleResponseGuard<{ id: number }>({
      sameScope: (left, right) => left?.id === right?.id,
    });

    const snapshot = guard.begin('save', { id: 1 });

    expect(guard.isCurrent(snapshot, { id: 1 })).toBe(true);
    expect(guard.isCurrent(snapshot, { id: 2 })).toBe(false);
  });
});
