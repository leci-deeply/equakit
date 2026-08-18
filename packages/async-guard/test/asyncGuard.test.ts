import { describe, expect, it } from 'vitest';

import {
  KeyedMutationVersion,
  StaleResponseGuard,
  isCurrentMutation,
  nextMutationVersion,
} from '../src';

describe('按键管理的变更版本', () => {
  it('按 key 递增并检查版本', () => {
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

  it('提供面向对象的版本追踪器', () => {
    const versions = new KeyedMutationVersion();
    const first = versions.begin('resource:1');
    const second = versions.begin('resource:1');

    expect(versions.isCurrent('resource:1', first)).toBe(false);
    expect(versions.isCurrent('resource:1', second)).toBe(true);

    versions.clear('resource:1');
    expect(versions.current('resource:1')).toBe(3);
    expect(versions.isCurrent('resource:1', second)).toBe(false);
  });

  it('清理并复用 key 后不会重新认可旧快照', () => {
    const versions = new KeyedMutationVersion();
    const old = versions.snapshot('save');

    versions.clear('save');
    const current = versions.snapshot('save');

    expect(versions.isCurrent(old.key, old.version)).toBe(false);
    expect(versions.isCurrent(current.key, current.version)).toBe(true);
  });
});

describe('过期响应保护器', () => {
  it('拒绝旧版本响应', () => {
    const guard = new StaleResponseGuard();

    const older = guard.begin('answer:1');
    const newer = guard.begin('answer:1');

    expect(guard.isCurrent(older)).toBe(false);
    expect(guard.isCurrent(newer)).toBe(true);
  });

  it('拒绝旧作用域下捕获的响应', () => {
    const guard = new StaleResponseGuard<string>();

    guard.setScope('problem-a');
    const snapshot = guard.begin('check');
    guard.setScope('problem-b');

    expect(guard.accept(snapshot, '过期')).toBeUndefined();
    expect(guard.accept(snapshot, '过期', { fallback: '回退' })).toBe('回退');
  });

  it('接受自定义作用域比较器', () => {
    const guard = new StaleResponseGuard<{ id: number }>({
      sameScope: (left, right) => left?.id === right?.id,
    });

    const snapshot = guard.begin('save', { id: 1 });

    expect(guard.isCurrent(snapshot, { id: 1 })).toBe(true);
    expect(guard.isCurrent(snapshot, { id: 2 })).toBe(false);
  });
});
