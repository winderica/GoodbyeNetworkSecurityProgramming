export const sha256 = async (message) => {
    return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message)));
};
