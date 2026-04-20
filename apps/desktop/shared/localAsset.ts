export const LOCAL_ASSET_PROTOCOL = 'atelier-asset';
export const LOCAL_ASSET_HOST = 'asset';
export const LEGACY_REDBOX_ASSET_PROTOCOL = 'redbox-asset';
export const LEGACY_LOCAL_FILE_PROTOCOL = 'local-file';

export function safeDecodeUriComponent(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

export function isWindowsAbsoluteLocalPath(value: string): boolean {
    return /^[a-zA-Z]:[\\/]/.test(String(value || '').trim());
}

export function isUncLocalPath(value: string): boolean {
    return String(value || '').trim().startsWith('\\\\');
}

export function isLikelyAbsoluteLocalPath(value: string): boolean {
    const raw = String(value || '').trim();
    if (!raw) return false;
    if (isWindowsAbsoluteLocalPath(raw) || isUncLocalPath(raw)) return true;
    return raw.startsWith('/');
}

export function isFileUrl(value: string): boolean {
    return /^file:\/\//i.test(String(value || '').trim());
}

export function isLegacyLocalFileUrl(value: string): boolean {
    return /^local-file:\/\//i.test(String(value || '').trim());
}

export function isLocalAssetUrl(value: string): boolean {
    return new RegExp(`^(?:${LOCAL_ASSET_PROTOCOL}|${LEGACY_REDBOX_ASSET_PROTOCOL}):\\/\\/`, 'i').test(String(value || '').trim());
}

export function isLocalAssetSource(value: string): boolean {
    const raw = String(value || '').trim();
    if (!raw) return false;
    return isLocalAssetUrl(raw) || isLegacyLocalFileUrl(raw) || isFileUrl(raw) || isLikelyAbsoluteLocalPath(raw);
}

function normalizeAssetPathForUrl(pathValue: string): string {
    const raw = String(pathValue || '').trim().replace(/\\/g, '/');
    if (!raw) return '';
    if (raw.startsWith('//')) return raw;
    if (/^\/[a-zA-Z]:\//.test(raw)) return raw.slice(1);
    if (isWindowsAbsoluteLocalPath(raw)) return raw;
    if (raw.startsWith('/')) return raw;
    return `/${raw.replace(/^\/+/, '')}`;
}

function normalizeUriForParsing(raw: string): string {
    return String(raw || '')
        .trim()
        .replace(/^local-file:\/\/localhost\//i, 'local-file:///')
        .replace(/^local-file:\/\/([a-zA-Z]:[\\/])/i, 'local-file:///$1')
        .replace(/^local-file:\/([a-zA-Z]:[\\/])/i, 'local-file:///$1')
        .replace(/^local-file:([a-zA-Z]:[\\/])/i, 'local-file:///$1')
        .replace(/\\/g, '/');
}

export function extractLocalAssetPathCandidate(value: string): string {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (isLikelyAbsoluteLocalPath(raw)) {
        return normalizeAssetPathForUrl(raw);
    }

    if (isLocalAssetUrl(raw) || isLegacyLocalFileUrl(raw) || isFileUrl(raw)) {
        const parseTarget = isLegacyLocalFileUrl(raw)
            ? normalizeUriForParsing(raw).replace(/^local-file:/i, 'file:')
            : normalizeUriForParsing(raw);
        try {
            const parsed = new URL(parseTarget);
            let pathname = safeDecodeUriComponent(parsed.pathname || '');
            const host = String(parsed.host || '').trim();
            if (/^\/[a-zA-Z]:/.test(pathname)) {
                pathname = pathname.slice(1);
            } else if (host && host !== LOCAL_ASSET_HOST && !/^localhost$/i.test(host)) {
                pathname = `//${host}${pathname.startsWith('/') ? '' : '/'}${pathname}`;
            }
            return normalizeAssetPathForUrl(pathname);
        } catch {
            if (isLocalAssetUrl(raw)) {
                return normalizeAssetPathForUrl(
                    safeDecodeUriComponent(
                        raw.replace(
                            new RegExp(`^(?:${LOCAL_ASSET_PROTOCOL}|${LEGACY_REDBOX_ASSET_PROTOCOL}):\\/\\/${LOCAL_ASSET_HOST}\\/?`, 'i'),
                            '',
                        ),
                    ),
                );
            }
            if (isLegacyLocalFileUrl(raw)) {
                return normalizeAssetPathForUrl(
                    safeDecodeUriComponent(normalizeUriForParsing(raw).replace(/^local-file:\/+/i, '')),
                );
            }
            return normalizeAssetPathForUrl(
                safeDecodeUriComponent(normalizeUriForParsing(raw).replace(/^file:\/+/i, '')),
            );
        }
    }

    return '';
}

export function toLocalAssetUrl(absolutePath: string): string {
    const normalized = normalizeAssetPathForUrl(absolutePath);
    if (!normalized) return '';
    return `${LOCAL_ASSET_PROTOCOL}://${LOCAL_ASSET_HOST}/${encodeURI(normalized)}`;
}

export function coerceToLocalAssetUrl(value: string): string {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (isLocalAssetUrl(raw)) {
        const pathCandidate = extractLocalAssetPathCandidate(raw);
        return pathCandidate ? toLocalAssetUrl(pathCandidate) : raw;
    }
    if (isLegacyLocalFileUrl(raw) || isFileUrl(raw) || isLikelyAbsoluteLocalPath(raw)) {
        const pathCandidate = extractLocalAssetPathCandidate(raw);
        return pathCandidate ? toLocalAssetUrl(pathCandidate) : '';
    }
    return raw;
}

// Backward-compatible aliases for imported RedBox-era naming.
export const REDBOX_ASSET_PROTOCOL = LEGACY_REDBOX_ASSET_PROTOCOL;
export const REDBOX_ASSET_HOST = LOCAL_ASSET_HOST;
export const isRedboxAssetUrl = isLocalAssetUrl;
export const toRedboxAssetUrl = toLocalAssetUrl;
export const coerceToRedboxAssetUrl = coerceToLocalAssetUrl;
