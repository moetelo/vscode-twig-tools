import * as fs from 'fs';

export class CachedMap<TKey, TValue> {
    private _map: Map<TKey, TValue>;
    private _jsonCachePath: string;

    constructor(jsonFilePath: string) {
        this._jsonCachePath = jsonFilePath;

        this._map = fs.existsSync(jsonFilePath)
            ? new Map<TKey, TValue>(JSON.parse(fs.readFileSync(jsonFilePath, 'utf8')))
            : new Map<TKey, TValue>();
    }

    get(key: TKey): TValue | undefined {
        return this._map.get(key);
    }

    set(key: TKey, value: TValue): void {
        this._map.set(key, value);
        this.save();
    }

    entries(): IterableIterator<[TKey, TValue]> {
        return this._map.entries();
    }

    hasAnyKeys(): boolean {
        return this._map.size > 0;
    }

    private save(): void {
        fs.writeFileSync(this._jsonCachePath, JSON.stringify(Array.from(this._map.entries())));
    }
}
