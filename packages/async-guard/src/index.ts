export interface MutationSnapshot<TScope = unknown> {
  key: string;
  version: number;
  scope?: TScope;
}

export interface StaleGuardOptions<TScope> {
  sameScope?: (current: TScope | undefined, snapshot: TScope | undefined) => boolean;
}

export class KeyedMutationVersion {
  readonly #versions = new Map<string, number>();

  begin(key: string): number {
    const next = (this.#versions.get(key) ?? 0) + 1;
    this.#versions.set(key, next);
    return next;
  }

  current(key: string): number {
    return this.#versions.get(key) ?? 0;
  }

  isCurrent(key: string, version: number): boolean {
    return this.current(key) === version;
  }

  snapshot<TScope>(key: string, scope?: TScope): MutationSnapshot<TScope> {
    const version = this.begin(key);
    return scope === undefined ? { key, version } : { key, version, scope };
  }

  clear(key?: string): void {
    if (key == null) {
      for (const [existingKey, version] of this.#versions) {
        this.#versions.set(existingKey, version + 1);
      }
      return;
    }
    this.#versions.set(key, this.current(key) + 1);
  }
}

export class StaleResponseGuard<TScope = unknown> {
  readonly #versions = new KeyedMutationVersion();
  readonly #sameScope: (current: TScope | undefined, snapshot: TScope | undefined) => boolean;
  #currentScope: TScope | undefined;

  constructor(options: StaleGuardOptions<TScope> = {}) {
    this.#sameScope = options.sameScope ?? Object.is;
  }

  setScope(scope: TScope | undefined): void {
    this.#currentScope = scope;
  }

  begin(key: string, scope = this.#currentScope): MutationSnapshot<TScope> {
    return this.#versions.snapshot(key, scope);
  }

  isCurrent(snapshot: MutationSnapshot<TScope>, scope = this.#currentScope): boolean {
    return (
      this.#versions.isCurrent(snapshot.key, snapshot.version) &&
      this.#sameScope(scope, snapshot.scope)
    );
  }

  accept<T>(
    snapshot: MutationSnapshot<TScope>,
    value: T,
    options: { fallback?: T; scope?: TScope } = {},
  ): T | undefined {
    if (this.isCurrent(snapshot, options.scope ?? this.#currentScope)) return value;
    return options.fallback;
  }

  clear(key?: string): void {
    this.#versions.clear(key);
  }
}

export function nextMutationVersion(versions: Map<string, number>, key: string): number {
  const next = (versions.get(key) ?? 0) + 1;
  versions.set(key, next);
  return next;
}

export function isCurrentMutation(
  versions: ReadonlyMap<string, number>,
  key: string,
  version: number,
): boolean {
  return (versions.get(key) ?? 0) === version;
}
