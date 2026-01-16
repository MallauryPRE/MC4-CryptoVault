/**
 * CryptoVault - Application Module
 * UI Logic and Event Handling with Password Mode and Plausible Deniability
 */

(function () {
    // State
    let currentKey = null;
    let currentMode = 'standard'; // 'standard', 'password', 'deniable'
    let currentPassword = null;
    let encryptedFileData = null;
    let decryptedFileData = null;
    let decryptedFileName = null;

    // DOM Elements
    const elements = {
        // Mode selector
        modeStandard: document.getElementById('modeStandard'),
        modePassword: document.getElementById('modePassword'),
        modeDeniable: document.getElementById('modeDeniable'),

        // Mode sections
        standardModeSection: document.getElementById('standardModeSection'),
        passwordModeSection: document.getElementById('passwordModeSection'),
        deniableModeSection: document.getElementById('deniableModeSection'),
        mainTabs: document.getElementById('mainTabs'),

        // Key management (standard mode)
        generateKeyBtn: document.getElementById('generateKeyBtn'),
        exportKeyBtn: document.getElementById('exportKeyBtn'),
        importKeyBtn: document.getElementById('importKeyBtn'),
        keyStatus: document.getElementById('keyStatus'),
        keyDisplay: document.getElementById('keyDisplay'),
        keyValue: document.getElementById('keyValue'),
        copyKeyBtn: document.getElementById('copyKeyBtn'),
        keyImport: document.getElementById('keyImport'),
        importKeyValue: document.getElementById('importKeyValue'),
        confirmImportBtn: document.getElementById('confirmImportBtn'),

        // Password mode
        passwordInput: document.getElementById('passwordInput'),
        togglePassword: document.getElementById('togglePassword'),
        strengthFill: document.getElementById('strengthFill'),
        strengthText: document.getElementById('strengthText'),

        // Deniable mode
        realPassword: document.getElementById('realPassword'),
        decoyPassword: document.getElementById('decoyPassword'),
        realData: document.getElementById('realData'),
        decoyData: document.getElementById('decoyData'),
        createDeniableBtn: document.getElementById('createDeniableBtn'),
        deniableResult: document.getElementById('deniableResult'),
        deniableOutput: document.getElementById('deniableOutput'),
        deniableInput: document.getElementById('deniableInput'),
        openPassword: document.getElementById('openPassword'),
        openDeniableBtn: document.getElementById('openDeniableBtn'),
        openDeniableResult: document.getElementById('openDeniableResult'),
        openDeniableOutput: document.getElementById('openDeniableOutput'),

        // Tabs
        tabs: document.querySelectorAll('.tab'),
        tabContents: document.querySelectorAll('.tab-content'),

        // Message encryption
        plaintext: document.getElementById('plaintext'),
        encryptMsgBtn: document.getElementById('encryptMsgBtn'),
        encryptResult: document.getElementById('encryptResult'),
        ciphertext: document.getElementById('ciphertext'),
        ciphertextInput: document.getElementById('ciphertextInput'),
        decryptMsgBtn: document.getElementById('decryptMsgBtn'),
        decryptResult: document.getElementById('decryptResult'),
        decryptedText: document.getElementById('decryptedText'),

        // File encryption
        fileToEncrypt: document.getElementById('fileToEncrypt'),
        encryptDropZone: document.getElementById('encryptDropZone'),
        encryptFileName: document.getElementById('encryptFileName'),
        encryptFileBtn: document.getElementById('encryptFileBtn'),
        encryptFileResult: document.getElementById('encryptFileResult'),
        downloadEncryptedBtn: document.getElementById('downloadEncryptedBtn'),

        // File decryption
        fileToDecrypt: document.getElementById('fileToDecrypt'),
        decryptDropZone: document.getElementById('decryptDropZone'),
        decryptFileName: document.getElementById('decryptFileName'),
        decryptFileBtn: document.getElementById('decryptFileBtn'),
        decryptFileResult: document.getElementById('decryptFileResult'),
        downloadDecryptedBtn: document.getElementById('downloadDecryptedBtn'),

        // Notification & Loading
        notification: document.getElementById('notification'),
        loadingOverlay: document.getElementById('loadingOverlay')
    };

    // ===== Loading Overlay =====
    function showLoading(message = 'Dérivation de clé en cours...') {
        elements.loadingOverlay.querySelector('p').textContent = message;
        elements.loadingOverlay.classList.remove('hidden');
    }

    function hideLoading() {
        elements.loadingOverlay.classList.add('hidden');
    }

    // ===== Notification System =====
    function showNotification(message, type = 'success') {
        const notification = elements.notification;
        const icon = notification.querySelector('.notification-icon');
        const msg = notification.querySelector('.notification-message');

        notification.className = 'notification';
        notification.classList.add(type);

        const icons = { success: '✅', error: '❌', warning: '⚠️' };
        icon.textContent = icons[type] || '✅';
        msg.textContent = message;

        notification.classList.remove('hidden');
        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.classList.add('hidden'), 300);
        }, 3000);
    }

    // ===== Mode Switching =====
    function switchMode(mode) {
        currentMode = mode;

        // Update mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Show/hide sections
        elements.standardModeSection.classList.toggle('hidden', mode !== 'standard');
        elements.passwordModeSection.classList.toggle('hidden', mode !== 'password');
        elements.deniableModeSection.classList.toggle('hidden', mode !== 'deniable');

        // Show/hide main tabs (hide for deniable mode)
        elements.mainTabs.classList.toggle('hidden', mode === 'deniable');
        document.getElementById('messagesTab').classList.toggle('hidden', mode === 'deniable');
        document.getElementById('filesTab').classList.toggle('hidden', mode === 'deniable');

        // Reset state when switching modes
        currentKey = null;
        currentPassword = null;
        updateKeyStatus(false);
    }

    // ===== Password Strength =====
    function calculatePasswordStrength(password) {
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;

        if (score <= 1) return { class: 'weak', text: 'Faible' };
        if (score <= 2) return { class: 'fair', text: 'Moyen' };
        if (score <= 3) return { class: 'good', text: 'Bon' };
        return { class: 'strong', text: 'Fort' };
    }

    function updatePasswordStrength() {
        const password = elements.passwordInput.value;
        const strength = calculatePasswordStrength(password);

        elements.strengthFill.className = 'strength-fill ' + strength.class;
        elements.strengthText.textContent = password ? `Force: ${strength.text}` : 'Force du mot de passe';

        // Store password for encryption
        currentPassword = password || null;
    }

    // ===== Key Management (Standard Mode) =====
    function updateKeyStatus(hasKey) {
        elements.keyStatus.textContent = hasKey ? 'Clé active' : 'Aucune clé';
        elements.keyStatus.classList.toggle('active', hasKey);
        elements.exportKeyBtn.disabled = !hasKey;
    }

    async function handleGenerateKey() {
        try {
            currentKey = await CryptoModule.generateKey();
            const keyBase64 = await CryptoModule.exportKey(currentKey);

            elements.keyValue.value = keyBase64;
            elements.keyDisplay.classList.remove('hidden');
            elements.keyImport.classList.add('hidden');

            updateKeyStatus(true);
            showNotification('Nouvelle clé générée avec succès!');
        } catch (error) {
            showNotification('Erreur lors de la génération de la clé', 'error');
            console.error(error);
        }
    }

    function handleExportKey() {
        if (elements.keyValue.value) {
            navigator.clipboard.writeText(elements.keyValue.value);
            showNotification('Clé copiée dans le presse-papiers!');
        }
    }

    function handleImportKeyToggle() {
        elements.keyImport.classList.toggle('hidden');
        elements.keyDisplay.classList.add('hidden');
    }

    async function handleConfirmImport() {
        const keyBase64 = elements.importKeyValue.value.trim();
        if (!keyBase64) {
            showNotification('Veuillez entrer une clé valide', 'error');
            return;
        }

        try {
            currentKey = await CryptoModule.importKey(keyBase64);
            elements.keyValue.value = keyBase64;
            elements.keyDisplay.classList.remove('hidden');
            elements.keyImport.classList.add('hidden');
            elements.importKeyValue.value = '';

            updateKeyStatus(true);
            showNotification('Clé importée avec succès!');
        } catch (error) {
            showNotification('Clé invalide', 'error');
            console.error(error);
        }
    }

    // ===== Toggle Password Visibility =====
    function handleTogglePassword() {
        const input = elements.passwordInput;
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        elements.togglePassword.textContent = isPassword ? '🙈' : '👁️';
    }

    // ===== Tab Navigation =====
    function handleTabClick(e) {
        const tabName = e.currentTarget.dataset.tab;

        elements.tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        elements.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}Tab`);
        });
    }

    // ===== Message Encryption =====
    async function handleEncryptMessage() {
        const plaintext = elements.plaintext.value.trim();
        if (!plaintext) {
            showNotification('Veuillez entrer un message à chiffrer', 'error');
            return;
        }

        try {
            let encrypted;

            if (currentMode === 'standard') {
                if (!currentKey) {
                    showNotification('Veuillez d\'abord générer ou importer une clé', 'error');
                    return;
                }
                encrypted = await CryptoModule.encryptMessage(plaintext, currentKey);
            } else if (currentMode === 'password') {
                if (!currentPassword) {
                    showNotification('Veuillez entrer un mot de passe', 'error');
                    return;
                }
                showLoading('Dérivation de clé avec Argon2...');
                encrypted = await CryptoModule.encryptMessageWithPassword(plaintext, currentPassword);
                hideLoading();
            }

            elements.ciphertext.value = encrypted;
            elements.encryptResult.classList.remove('hidden');
            showNotification('Message chiffré avec succès!');
        } catch (error) {
            hideLoading();
            showNotification('Erreur lors du chiffrement', 'error');
            console.error(error);
        }
    }

    async function handleDecryptMessage() {
        const ciphertext = elements.ciphertextInput.value.trim();
        if (!ciphertext) {
            showNotification('Veuillez entrer un message chiffré', 'error');
            return;
        }

        try {
            let decrypted;

            if (currentMode === 'standard') {
                if (!currentKey) {
                    showNotification('Veuillez d\'abord générer ou importer une clé', 'error');
                    return;
                }
                decrypted = await CryptoModule.decryptMessage(ciphertext, currentKey);
            } else if (currentMode === 'password') {
                if (!currentPassword) {
                    showNotification('Veuillez entrer un mot de passe', 'error');
                    return;
                }
                showLoading('Dérivation de clé avec Argon2...');
                decrypted = await CryptoModule.decryptMessageWithPassword(ciphertext, currentPassword);
                hideLoading();
            }

            elements.decryptedText.value = decrypted;
            elements.decryptResult.classList.remove('hidden');
            showNotification('Message déchiffré avec succès!');
        } catch (error) {
            hideLoading();
            showNotification('Impossible de déchiffrer - clé/mot de passe incorrect', 'error');
            console.error(error);
        }
    }

    // ===== Deniable Encryption =====
    async function handleCreateDeniable() {
        const realPassword = elements.realPassword.value;
        const decoyPassword = elements.decoyPassword.value;
        const realData = elements.realData.value;
        const decoyData = elements.decoyData.value;

        if (!realPassword || !decoyPassword) {
            showNotification('Veuillez entrer les deux mots de passe', 'error');
            return;
        }
        if (realPassword === decoyPassword) {
            showNotification('Les mots de passe doivent être différents', 'error');
            return;
        }
        if (!realData || !decoyData) {
            showNotification('Veuillez entrer les deux types de données', 'error');
            return;
        }

        try {
            showLoading('Création du conteneur deniable...');
            const container = await CryptoModule.createDeniableContainer(
                realData, decoyData, realPassword, decoyPassword
            );
            hideLoading();

            elements.deniableOutput.value = container;
            elements.deniableResult.classList.remove('hidden');

            // Security: Clear sensitive fields from DOM
            elements.realPassword.value = '';
            elements.decoyPassword.value = '';
            elements.realData.value = '';
            elements.decoyData.value = '';

            showNotification('Conteneur deniable créé avec succès!');
        } catch (error) {
            hideLoading();
            showNotification('Erreur lors de la création du conteneur', 'error');
            console.error(error);
        }
    }

    async function handleOpenDeniable() {
        const container = elements.deniableInput.value.trim();
        const password = elements.openPassword.value;

        if (!container) {
            showNotification('Veuillez entrer le conteneur chiffré', 'error');
            return;
        }
        if (!password) {
            showNotification('Veuillez entrer un mot de passe', 'error');
            return;
        }

        try {
            showLoading('Ouverture du conteneur...');
            const result = await CryptoModule.openDeniableContainer(container, password);
            hideLoading();

            elements.openDeniableOutput.value = result.data;
            elements.openDeniableResult.classList.remove('hidden');

            // Security: Clear password from DOM
            elements.openPassword.value = '';

            // Don't reveal if it's decoy or not - that's the point of plausible deniability!
            showNotification('Conteneur ouvert avec succès!');
        } catch (error) {
            hideLoading();
            showNotification('Mot de passe incorrect', 'error');
            console.error(error);
        }
    }

    // ===== File Encryption =====
    function setupDropZone(dropZone, fileInput, fileNameEl) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('dragover');
            });
        });

        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                fileInput.dispatchEvent(new Event('change'));
            }
        });
    }

    function handleFileToEncryptChange() {
        const file = elements.fileToEncrypt.files[0];
        if (file) {
            elements.encryptFileName.textContent = file.name;
            elements.encryptFileBtn.disabled = false;
            elements.encryptFileResult.classList.add('hidden');
        }
    }

    function handleFileToDecryptChange() {
        const file = elements.fileToDecrypt.files[0];
        if (file) {
            elements.decryptFileName.textContent = file.name;
            elements.decryptFileBtn.disabled = false;
            elements.decryptFileResult.classList.add('hidden');
        }
    }

    async function handleEncryptFile() {
        const file = elements.fileToEncrypt.files[0];
        if (!file) {
            showNotification('Veuillez sélectionner un fichier', 'error');
            return;
        }

        try {
            elements.encryptFileBtn.disabled = true;
            elements.encryptFileBtn.innerHTML = '<span class="btn-icon">⏳</span> Chiffrement...';

            let result;
            if (currentMode === 'standard') {
                if (!currentKey) {
                    showNotification('Veuillez d\'abord générer ou importer une clé', 'error');
                    return;
                }
                result = await CryptoModule.encryptFile(file, currentKey);
            } else if (currentMode === 'password') {
                if (!currentPassword) {
                    showNotification('Veuillez entrer un mot de passe', 'error');
                    return;
                }
                showLoading('Chiffrement du fichier avec Argon2...');
                result = await CryptoModule.encryptFileWithPassword(file, currentPassword);
                hideLoading();
            }

            encryptedFileData = result.encryptedData;
            elements.encryptFileResult.classList.remove('hidden');
            showNotification('Fichier chiffré avec succès!');
        } catch (error) {
            hideLoading();
            showNotification('Erreur lors du chiffrement du fichier', 'error');
            console.error(error);
        } finally {
            elements.encryptFileBtn.disabled = false;
            elements.encryptFileBtn.innerHTML = '<span class="btn-icon">🔐</span> Chiffrer le fichier';
        }
    }

    async function handleDecryptFile() {
        const file = elements.fileToDecrypt.files[0];
        if (!file) {
            showNotification('Veuillez sélectionner un fichier', 'error');
            return;
        }

        try {
            elements.decryptFileBtn.disabled = true;
            elements.decryptFileBtn.innerHTML = '<span class="btn-icon">⏳</span> Déchiffrement...';

            const encryptedData = await file.arrayBuffer();
            let result;

            if (currentMode === 'standard') {
                if (!currentKey) {
                    showNotification('Veuillez d\'abord générer ou importer une clé', 'error');
                    return;
                }
                result = await CryptoModule.decryptFile(encryptedData, currentKey);
            } else if (currentMode === 'password') {
                if (!currentPassword) {
                    showNotification('Veuillez entrer un mot de passe', 'error');
                    return;
                }
                showLoading('Déchiffrement du fichier avec Argon2...');
                result = await CryptoModule.decryptFileWithPassword(encryptedData, currentPassword);
                hideLoading();
            }

            decryptedFileData = result.data;
            decryptedFileName = result.filename;

            elements.decryptFileResult.classList.remove('hidden');
            showNotification('Fichier déchiffré avec succès!');
        } catch (error) {
            hideLoading();
            showNotification('Impossible de déchiffrer - clé/mot de passe incorrect', 'error');
            console.error(error);
        } finally {
            elements.decryptFileBtn.disabled = false;
            elements.decryptFileBtn.innerHTML = '<span class="btn-icon">🔓</span> Déchiffrer le fichier';
        }
    }

    function downloadEncryptedFile() {
        if (!encryptedFileData) return;

        const originalName = elements.fileToEncrypt.files[0]?.name || 'file';
        const blob = new Blob([encryptedFileData], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${originalName}.encrypted`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showNotification('Téléchargement démarré!');
    }

    function downloadDecryptedFile() {
        if (!decryptedFileData || !decryptedFileName) return;

        const blob = new Blob([decryptedFileData]);
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = decryptedFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showNotification('Téléchargement démarré!');
    }

    // ===== Copy Buttons =====
    function handleCopyClick(e) {
        const targetId = e.currentTarget.dataset.target;
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
            navigator.clipboard.writeText(targetEl.value);
            showNotification('Copié dans le presse-papiers!');
        }
    }

    // ===== Initialize =====
    function init() {
        // Mode switching
        elements.modeStandard.addEventListener('click', () => switchMode('standard'));
        elements.modePassword.addEventListener('click', () => switchMode('password'));
        elements.modeDeniable.addEventListener('click', () => switchMode('deniable'));

        // Password mode
        elements.passwordInput.addEventListener('input', updatePasswordStrength);
        elements.togglePassword.addEventListener('click', handleTogglePassword);

        // Key management
        elements.generateKeyBtn.addEventListener('click', handleGenerateKey);
        elements.exportKeyBtn.addEventListener('click', handleExportKey);
        elements.importKeyBtn.addEventListener('click', handleImportKeyToggle);
        elements.confirmImportBtn.addEventListener('click', handleConfirmImport);
        elements.copyKeyBtn.addEventListener('click', handleExportKey);

        // Deniable mode
        elements.createDeniableBtn.addEventListener('click', handleCreateDeniable);
        elements.openDeniableBtn.addEventListener('click', handleOpenDeniable);

        // Tabs
        elements.tabs.forEach(tab => {
            tab.addEventListener('click', handleTabClick);
        });

        // Message encryption
        elements.encryptMsgBtn.addEventListener('click', handleEncryptMessage);
        elements.decryptMsgBtn.addEventListener('click', handleDecryptMessage);

        // File handling
        setupDropZone(elements.encryptDropZone, elements.fileToEncrypt, elements.encryptFileName);
        setupDropZone(elements.decryptDropZone, elements.fileToDecrypt, elements.decryptFileName);

        elements.fileToEncrypt.addEventListener('change', handleFileToEncryptChange);
        elements.fileToDecrypt.addEventListener('change', handleFileToDecryptChange);
        elements.encryptFileBtn.addEventListener('click', handleEncryptFile);
        elements.decryptFileBtn.addEventListener('click', handleDecryptFile);
        elements.downloadEncryptedBtn.addEventListener('click', downloadEncryptedFile);
        elements.downloadDecryptedBtn.addEventListener('click', downloadDecryptedFile);

        // Copy buttons
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', handleCopyClick);
        });
    }

    // Start app
    init();

    // ===== EASTER EGG: Konami Code =====
    // ↑↑↓↓←→←→BA triggers Matrix rain
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
        'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
        'KeyB', 'KeyA'];
    let konamiIndex = 0;

    document.addEventListener('keydown', (e) => {
        if (e.code === konamiCode[konamiIndex]) {
            konamiIndex++;
            if (konamiIndex === konamiCode.length) {
                activateMatrixMode();
                konamiIndex = 0;
            }
        } else {
            konamiIndex = 0;
        }
    });

    function activateMatrixMode() {
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.id = 'matrixCanvas';
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 99999;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.5s ease;
        `;
        document.body.appendChild(canvas);

        // Show notification
        showNotification('🔓 MATRIX MODE ACTIVATED - You found the easter egg!', 'success');

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Matrix characters
        const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';
        const fontSize = 14;
        const columns = canvas.width / fontSize;
        const drops = [];

        for (let i = 0; i < columns; i++) {
            drops[i] = Math.random() * -100;
        }

        // Fade in
        setTimeout(() => canvas.style.opacity = '0.9', 100);

        function draw() {
            ctx.fillStyle = 'rgba(13, 15, 16, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#4ade80';
            ctx.font = fontSize + 'px monospace';

            for (let i = 0; i < drops.length; i++) {
                const char = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(char, i * fontSize, drops[i] * fontSize);

                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        }

        const matrixInterval = setInterval(draw, 33);

        // Cleanup function
        function cleanup() {
            canvas.style.opacity = '0';
            setTimeout(() => {
                clearInterval(matrixInterval);
                canvas.remove();
                showNotification('Matrix mode deactivated', 'warning');
            }, 500);
        }

        // Remove after 8 seconds
        setTimeout(cleanup, 8000);

        // Click to dismiss early
        canvas.style.pointerEvents = 'auto';
        canvas.addEventListener('click', cleanup);
    }
})();

