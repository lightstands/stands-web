/**
 * Open an external url.
 * This function tries to deal with privacy and security concern.
 * @param url the url
 */
export function openExternalUrl(url: string | URL) {
    window.open(url, "_blank", "noopener,noreferrer");
}
