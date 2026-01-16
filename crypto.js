/**
 * CryptoVault - Crypto Module
 * AES-256-GCM Encryption/Decryption with Argon2 Key Derivation
 * Includes Plausible Deniability support
 */

const CryptoModule = (() => {
    const ALGORITHM = 'AES-GCM';
    const KEY_LENGTH = 256;
    const IV_LENGTH = 12; // 96 bits recommended for GCM
    const SALT_LENGTH = 16; // 128 bits for Argon2

    // Argon2 parameters (tuned for browser performance)
    const ARGON2_CONFIG = {
        time: 3,        // iterations
        mem: 65536,     // 64 MB memory
        parallelism: 1,
        hashLen: 32,    // 256 bits for AES-256
        type: argon2.ArgonType.Argon2id // Most secure variant
    };

    /**
     * Generate a new AES-256 key (random)
     * @returns {Promise<CryptoKey>}
     */
    async function generateKey() {
        return await crypto.subtle.generateKey(
            {
                name: ALGORITHM,
                length: KEY_LENGTH
            },
            true, // extractable
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Derive a key from password using Argon2id
     * @param {string} password 
     * @param {Uint8Array} salt - Optional, will be generated if not provided
     * @returns {Promise<{key: CryptoKey, salt: Uint8Array}>}
     */
    async function deriveKeyFromPassword(password, salt = null) {
        if (!salt) {
            salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
        }

        // Use Argon2id to derive key material
        const result = await argon2.hash({
            pass: password,
            salt: salt,
            ...ARGON2_CONFIG
        });

        // Import the derived hash as an AES key
        const key = await crypto.subtle.importKey(
            'raw',
            result.hash,
            {
                name: ALGORITHM,
                length: KEY_LENGTH
            },
            false, // not extractable for security
            ['encrypt', 'decrypt']
        );

        return { key, salt };
    }

    /**
     * Export key to Base64 string
     * @param {CryptoKey} key 
     * @returns {Promise<string>}
     */
    async function exportKey(key) {
        const rawKey = await crypto.subtle.exportKey('raw', key);
        return arrayBufferToBase64(rawKey);
    }

    /**
     * Import key from Base64 string
     * @param {string} base64Key 
     * @returns {Promise<CryptoKey>}
     */
    async function importKey(base64Key) {
        const rawKey = base64ToArrayBuffer(base64Key);
        return await crypto.subtle.importKey(
            'raw',
            rawKey,
            {
                name: ALGORITHM,
                length: KEY_LENGTH
            },
            true,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Encrypt a message with password (includes salt in output)
     * @param {string} plaintext 
     * @param {string} password 
     * @returns {Promise<string>} Base64 encoded (salt + IV + ciphertext)
     */
    async function encryptMessageWithPassword(plaintext, password) {
        const { key, salt } = await deriveKeyFromPassword(password);
        const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
        const encoder = new TextEncoder();
        const data = encoder.encode(plaintext);

        const ciphertext = await crypto.subtle.encrypt(
            { name: ALGORITHM, iv: iv },
            key,
            data
        );

        // Combine salt + IV + ciphertext
        const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
        combined.set(salt, 0);
        combined.set(iv, salt.length);
        combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

        return arrayBufferToBase64(combined.buffer);
    }

    /**
     * Decrypt a message with password
     * @param {string} encryptedBase64 
     * @param {string} password 
     * @returns {Promise<string>}
     */
    async function decryptMessageWithPassword(encryptedBase64, password) {
        const combined = base64ToArrayBuffer(encryptedBase64);
        const combinedArray = new Uint8Array(combined);

        // Extract salt, IV and ciphertext
        const salt = combinedArray.slice(0, SALT_LENGTH);
        const iv = combinedArray.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
        const ciphertext = combinedArray.slice(SALT_LENGTH + IV_LENGTH);

        const { key } = await deriveKeyFromPassword(password, salt);

        const decrypted = await crypto.subtle.decrypt(
            { name: ALGORITHM, iv: iv },
            key,
            ciphertext
        );

        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    }

    /**
     * Encrypt a message (key-based, original functionality)
     * @param {string} plaintext 
     * @param {CryptoKey} key 
     * @returns {Promise<string>} Base64 encoded (IV + ciphertext)
     */
    async function encryptMessage(plaintext, key) {
        const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
        const encoder = new TextEncoder();
        const data = encoder.encode(plaintext);

        const ciphertext = await crypto.subtle.encrypt(
            { name: ALGORITHM, iv: iv },
            key,
            data
        );

        const combined = new Uint8Array(iv.length + ciphertext.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(ciphertext), iv.length);

        return arrayBufferToBase64(combined.buffer);
    }

    /**
     * Decrypt a message (key-based, original functionality)
     * @param {string} encryptedBase64 
     * @param {CryptoKey} key 
     * @returns {Promise<string>}
     */
    async function decryptMessage(encryptedBase64, key) {
        const combined = base64ToArrayBuffer(encryptedBase64);
        const combinedArray = new Uint8Array(combined);

        const iv = combinedArray.slice(0, IV_LENGTH);
        const ciphertext = combinedArray.slice(IV_LENGTH);

        const decrypted = await crypto.subtle.decrypt(
            { name: ALGORITHM, iv: iv },
            key,
            ciphertext
        );

        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    }

    /**
     * Encrypt file with password (includes salt in output)
     * @param {File} file 
     * @param {string} password 
     * @returns {Promise<{encryptedData: ArrayBuffer, originalName: string}>}
     */
    async function encryptFileWithPassword(file, password) {
        const { key, salt } = await deriveKeyFromPassword(password);
        const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
        const fileData = await file.arrayBuffer();

        // Create metadata (filename)
        const encoder = new TextEncoder();
        const filenameBytes = encoder.encode(file.name);
        const filenameLength = new Uint32Array([filenameBytes.length]);

        // Combine: filenameLength (4 bytes) + filename + fileData
        const combined = new Uint8Array(4 + filenameBytes.length + fileData.byteLength);
        combined.set(new Uint8Array(filenameLength.buffer), 0);
        combined.set(filenameBytes, 4);
        combined.set(new Uint8Array(fileData), 4 + filenameBytes.length);

        const ciphertext = await crypto.subtle.encrypt(
            { name: ALGORITHM, iv: iv },
            key,
            combined
        );

        // Combine salt + IV + ciphertext
        const result = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
        result.set(salt, 0);
        result.set(iv, salt.length);
        result.set(new Uint8Array(ciphertext), salt.length + iv.length);

        return {
            encryptedData: result.buffer,
            originalName: file.name
        };
    }

    /**
     * Decrypt file with password
     * @param {ArrayBuffer} encryptedData 
     * @param {string} password 
     * @returns {Promise<{data: ArrayBuffer, filename: string}>}
     */
    async function decryptFileWithPassword(encryptedData, password) {
        const encryptedArray = new Uint8Array(encryptedData);

        // Extract salt, IV and ciphertext
        const salt = encryptedArray.slice(0, SALT_LENGTH);
        const iv = encryptedArray.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
        const ciphertext = encryptedArray.slice(SALT_LENGTH + IV_LENGTH);

        const { key } = await deriveKeyFromPassword(password, salt);

        const decrypted = await crypto.subtle.decrypt(
            { name: ALGORITHM, iv: iv },
            key,
            ciphertext
        );

        const decryptedArray = new Uint8Array(decrypted);

        // Extract filename length
        const filenameLength = new Uint32Array(decryptedArray.slice(0, 4).buffer)[0];

        // Extract filename
        const decoder = new TextDecoder();
        const filename = decoder.decode(decryptedArray.slice(4, 4 + filenameLength));

        // Extract file data
        const fileData = decryptedArray.slice(4 + filenameLength);

        return {
            data: fileData.buffer,
            filename: filename
        };
    }

    /**
     * Encrypt a file (key-based, original functionality)
     * @param {File} file 
     * @param {CryptoKey} key 
     * @returns {Promise<{encryptedData: ArrayBuffer, originalName: string}>}
     */
    async function encryptFile(file, key) {
        const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
        const fileData = await file.arrayBuffer();

        const encoder = new TextEncoder();
        const filenameBytes = encoder.encode(file.name);
        const filenameLength = new Uint32Array([filenameBytes.length]);

        const combined = new Uint8Array(4 + filenameBytes.length + fileData.byteLength);
        combined.set(new Uint8Array(filenameLength.buffer), 0);
        combined.set(filenameBytes, 4);
        combined.set(new Uint8Array(fileData), 4 + filenameBytes.length);

        const ciphertext = await crypto.subtle.encrypt(
            { name: ALGORITHM, iv: iv },
            key,
            combined
        );

        const result = new Uint8Array(iv.length + ciphertext.byteLength);
        result.set(iv, 0);
        result.set(new Uint8Array(ciphertext), iv.length);

        return {
            encryptedData: result.buffer,
            originalName: file.name
        };
    }

    /**
     * Decrypt a file (key-based, original functionality)
     * @param {ArrayBuffer} encryptedData 
     * @param {CryptoKey} key 
     * @returns {Promise<{data: ArrayBuffer, filename: string}>}
     */
    async function decryptFile(encryptedData, key) {
        const encryptedArray = new Uint8Array(encryptedData);

        const iv = encryptedArray.slice(0, IV_LENGTH);
        const ciphertext = encryptedArray.slice(IV_LENGTH);

        const decrypted = await crypto.subtle.decrypt(
            { name: ALGORITHM, iv: iv },
            key,
            ciphertext
        );

        const decryptedArray = new Uint8Array(decrypted);
        const filenameLength = new Uint32Array(decryptedArray.slice(0, 4).buffer)[0];
        const decoder = new TextDecoder();
        const filename = decoder.decode(decryptedArray.slice(4, 4 + filenameLength));
        const fileData = decryptedArray.slice(4 + filenameLength);

        return {
            data: fileData.buffer,
            filename: filename
        };
    }

    // ===== Plausible Deniability =====

    /**
     * Create a deniable encrypted container with two passwords
     * Real password reveals real data, decoy password reveals decoy data
     * @param {string} realData - The real secret data
     * @param {string} decoyData - The fake/decoy data to show under duress
     * @param {string} realPassword - Password for real data
     * @param {string} decoyPassword - Password for decoy data
     * @returns {Promise<string>} Combined encrypted container (Base64)
     */
    async function createDeniableContainer(realData, decoyData, realPassword, decoyPassword) {
        // Encrypt both datasets separately
        const realEncrypted = await encryptMessageWithPassword(realData, realPassword);
        const decoyEncrypted = await encryptMessageWithPassword(decoyData, decoyPassword);

        // Create container with marker byte + lengths + data
        const realBytes = base64ToArrayBuffer(realEncrypted);
        const decoyBytes = base64ToArrayBuffer(decoyEncrypted);

        // Container format: 
        // [1 byte marker: 0xDE] + [4 bytes real length] + [4 bytes decoy length] + [real data] + [decoy data]
        const container = new Uint8Array(1 + 4 + 4 + realBytes.byteLength + decoyBytes.byteLength);
        container[0] = 0xDE; // Deniable Encryption marker

        const realLengthArr = new Uint32Array([realBytes.byteLength]);
        const decoyLengthArr = new Uint32Array([decoyBytes.byteLength]);

        container.set(new Uint8Array(realLengthArr.buffer), 1);
        container.set(new Uint8Array(decoyLengthArr.buffer), 5);
        container.set(new Uint8Array(realBytes), 9);
        container.set(new Uint8Array(decoyBytes), 9 + realBytes.byteLength);

        return arrayBufferToBase64(container.buffer);
    }

    /**
     * Open a deniable container with a password
     * Returns the data associated with that password
     * @param {string} containerBase64 
     * @param {string} password 
     * @returns {Promise<{data: string, isDecoy: boolean}>}
     */
    async function openDeniableContainer(containerBase64, password) {
        const container = new Uint8Array(base64ToArrayBuffer(containerBase64));

        // Verify marker
        if (container[0] !== 0xDE) {
            throw new Error('Invalid deniable container format');
        }

        // Extract lengths
        const realLength = new Uint32Array(container.slice(1, 5).buffer)[0];
        const decoyLength = new Uint32Array(container.slice(5, 9).buffer)[0];

        // Extract encrypted data
        const realEncrypted = arrayBufferToBase64(container.slice(9, 9 + realLength).buffer);
        const decoyEncrypted = arrayBufferToBase64(container.slice(9 + realLength, 9 + realLength + decoyLength).buffer);

        // Try real password first
        try {
            const data = await decryptMessageWithPassword(realEncrypted, password);
            return { data, isDecoy: false };
        } catch (e) {
            // Try decoy password
            try {
                const data = await decryptMessageWithPassword(decoyEncrypted, password);
                return { data, isDecoy: true };
            } catch (e2) {
                throw new Error('Mot de passe incorrect');
            }
        }
    }

    /**
     * Create a deniable file container
     * @param {File} realFile 
     * @param {File} decoyFile 
     * @param {string} realPassword 
     * @param {string} decoyPassword 
     * @returns {Promise<ArrayBuffer>}
     */
    async function createDeniableFileContainer(realFile, decoyFile, realPassword, decoyPassword) {
        const realResult = await encryptFileWithPassword(realFile, realPassword);
        const decoyResult = await encryptFileWithPassword(decoyFile, decoyPassword);

        const realData = new Uint8Array(realResult.encryptedData);
        const decoyData = new Uint8Array(decoyResult.encryptedData);

        // Container: [1 byte marker] + [4 bytes real length] + [4 bytes decoy length] + [real data] + [decoy data]
        const container = new Uint8Array(1 + 4 + 4 + realData.byteLength + decoyData.byteLength);
        container[0] = 0xDF; // Deniable File marker

        const realLengthArr = new Uint32Array([realData.byteLength]);
        const decoyLengthArr = new Uint32Array([decoyData.byteLength]);

        container.set(new Uint8Array(realLengthArr.buffer), 1);
        container.set(new Uint8Array(decoyLengthArr.buffer), 5);
        container.set(realData, 9);
        container.set(decoyData, 9 + realData.byteLength);

        return container.buffer;
    }

    /**
     * Open a deniable file container
     * @param {ArrayBuffer} containerData 
     * @param {string} password 
     * @returns {Promise<{data: ArrayBuffer, filename: string, isDecoy: boolean}>}
     */
    async function openDeniableFileContainer(containerData, password) {
        const container = new Uint8Array(containerData);

        if (container[0] !== 0xDF) {
            throw new Error('Invalid deniable file container format');
        }

        const realLength = new Uint32Array(container.slice(1, 5).buffer)[0];
        const decoyLength = new Uint32Array(container.slice(5, 9).buffer)[0];

        const realEncrypted = container.slice(9, 9 + realLength).buffer;
        const decoyEncrypted = container.slice(9 + realLength, 9 + realLength + decoyLength).buffer;

        // Try real password first
        try {
            const result = await decryptFileWithPassword(realEncrypted, password);
            return { ...result, isDecoy: false };
        } catch (e) {
            // Try decoy password
            try {
                const result = await decryptFileWithPassword(decoyEncrypted, password);
                return { ...result, isDecoy: true };
            } catch (e2) {
                throw new Error('Mot de passe incorrect');
            }
        }
    }

    // Utility functions
    function arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    function base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    // Public API
    return {
        // Key management
        generateKey,
        exportKey,
        importKey,
        deriveKeyFromPassword,

        // Key-based encryption
        encryptMessage,
        decryptMessage,
        encryptFile,
        decryptFile,

        // Password-based encryption (with Argon2)
        encryptMessageWithPassword,
        decryptMessageWithPassword,
        encryptFileWithPassword,
        decryptFileWithPassword,

        // Plausible deniability
        createDeniableContainer,
        openDeniableContainer,
        createDeniableFileContainer,
        openDeniableFileContainer
    };
})();
