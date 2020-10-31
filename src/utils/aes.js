export class AES {
    #key;
    #iv;
    #algorithm;

    constructor(key, iv, algorithm = 'AES-CBC') {
        this.#key = crypto.subtle.importKey(
            'raw',
            key,
            {
                name: algorithm,
            },
            false,
            ['encrypt', 'decrypt']
        );
        this.#iv = iv;
        this.#algorithm = algorithm;
    }

    async encrypt(plaintext) {
        return new Uint8Array(
            await crypto.subtle.encrypt(
                {
                    name: 'AES-CBC',
                    iv: this.#iv
                },
                await this.#key,
                new TextEncoder().encode(plaintext)
            ));
    }

    async decrypt(encrypted) {
        return new TextDecoder().decode(await crypto.subtle.decrypt(
            {
                name: 'AES-CBC',
                iv: this.#iv,
            },
            await this.#key,
            encrypted
        ));
    }
}
