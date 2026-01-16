# 🔐 CryptoVault

Application de chiffrement et déchiffrement de fichiers et messages avec **AES-256-GCM** et dérivation de clé **Argon2id**.

![Version](https://img.shields.io/badge/version-2.0-blue)
![Sécurité](https://img.shields.io/badge/security-AES--256--GCM-green)
![KDF](https://img.shields.io/badge/KDF-Argon2id-purple)
![License](https://img.shields.io/badge/license-MIT-orange)

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5"/>
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3"/>
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript"/>
</p>

---

## 📋 Table des Matières

- [Fonctionnalités](#-fonctionnalités)
- [Démonstration](#-démonstration)
- [Installation](#-installation)
- [Guide d'Utilisation](#-guide-dutilisation)
- [Modes de Fonctionnement](#-modes-de-fonctionnement)
- [Sécurité Technique](#-sécurité-technique)
- [Dénégation Plausible](#-dénégation-plausible)
- [Audit de Sécurité](#-audit-de-sécurité)
- [Easter Egg](#-easter-egg)

---

## ✨ Fonctionnalités

| Fonctionnalité | Description |
|----------------|-------------|
| 🔐 **Chiffrement Messages** | Chiffrez vos messages texte avec AES-256-GCM |
| 📁 **Chiffrement Fichiers** | Tous types de fichiers supportés |
| 🔑 **Mode Clé Aléatoire** | Génération de clés cryptographiques aléatoires |
| 🔒 **Mode Mot de Passe** | Dérivation de clé avec Argon2id |
| 🛡️ **Dénégation Plausible** | Double mot de passe pour données réelles/factices |
| 📋 **Copie Rapide** | Copie dans le presse-papiers en un clic |
| 📥 **Export/Import** | Gestion des clés en Base64 |
| 🎮 **Easter Egg** | Code Konami pour une surprise ! |

---

## 🎬 Démonstration

L'application utilise un design **Chromia Dashboard** avec :
- Thème sombre élégant
- Accents verts (#4ade80)
- Interface responsive

---

## 🚀 Installation

### Option 1 : Cloner le dépôt

```bash
# Cloner le projet
git clone https://github.com/MallauryPRE/MC4-CryptoVault.git

# Aller dans le dossier
cd MC4-CryptoVault

# Ouvrir dans le navigateur
open index.html    # macOS
xdg-open index.html  # Linux
start index.html   # Windows
```

### Option 2 : Télécharger le ZIP

1. Cliquer sur **Code** > **Download ZIP**
2. Extraire l'archive
3. Ouvrir `index.html`

### Prérequis

- Navigateur moderne (Chrome, Firefox, Safari, Edge)
- Support de Web Crypto API (tous les navigateurs modernes)
- Aucune dépendance serveur requise

---

## 📖 Guide d'Utilisation

### Mode Standard (Clé Aléatoire)

1. **Générer une clé** : Cliquez sur "Générer une clé"
2. **Exporter** : Sauvegardez la clé en Base64 pour la réutiliser
3. **Chiffrer** : Entrez votre message ou sélectionnez un fichier
4. **Partager** : Envoyez le contenu chiffré et la clé séparément

### Mode Mot de Passe (Argon2)

1. **Sélectionner** : Cliquez sur "Mode Mot de Passe"
2. **Entrer le mot de passe** : Un indicateur affiche la force
3. **Chiffrer/Déchiffrer** : Le même mot de passe est utilisé pour les deux

> ⚠️ **Important** : Utilisez un mot de passe fort (12+ caractères, majuscules, chiffres, symboles)

### Mode Dénégation Plausible

1. **Sélectionner** : Cliquez sur "Dénégation Plausible"
2. **Définir les mots de passe** :
   - **Mot de passe RÉEL** : Pour vos vraies données
   - **Mot de passe LEURRE** : Pour les données factices
3. **Entrer les données** :
   - **Données RÉELLES** : Vos secrets
   - **Données LEURRE** : Ce que vous montrez sous contrainte
4. **Créer** : Générez le conteneur chiffré
5. **Ouvrir** : Utilisez l'un ou l'autre mot de passe

---

## 🔧 Modes de Fonctionnement

### 🔑 Mode Standard

```
┌──────────────────────────────────────────┐
│  Génération clé aléatoire (256 bits)     │
│              ↓                           │
│  AES-256-GCM (IV aléatoire 96 bits)      │
│              ↓                           │
│  Output: Base64(IV + Ciphertext + Tag)   │
└──────────────────────────────────────────┘
```

### 🔒 Mode Mot de Passe

```
┌──────────────────────────────────────────┐
│  Mot de passe utilisateur                │
│              ↓                           │
│  Argon2id (mem=64MB, t=3, p=1)           │
│              ↓                           │
│  Clé AES-256 dérivée                     │
│              ↓                           │
│  AES-256-GCM                             │
│              ↓                           │
│  Output: Base64(Salt + IV + Ciphertext)  │
└──────────────────────────────────────────┘
```

### 🛡️ Mode Dénégation Plausible

```
┌───────────────────────────────────────────────────────┐
│  Mot de passe RÉEL  →  Argon2id  →  Données RÉELLES   │
│                                                       │
│  Mot de passe LEURRE  →  Argon2id  →  Données LEURRE  │
│                                                       │
│             Conteneur combiné unique                  │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Marker │ Len1 │ Len2 │ Encrypted1 │ Encrypted2 │  │
│  └─────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────┘
```

---

## 🔒 Sécurité Technique

### AES-256-GCM

| Propriété | Valeur |
|-----------|--------|
| Algorithme | AES (Rijndael) |
| Taille de clé | 256 bits |
| Mode | GCM (Galois/Counter Mode) |
| IV | 96 bits (aléatoire) |
| Tag | 128 bits (authentification) |

**Avantages** :
- ✅ Chiffrement authentifié (confidentialité + intégrité)
- ✅ Accélération matérielle (AES-NI)
- ✅ Standard NIST

### Argon2id

| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| Mémoire | 64 MB | Coût mémoire |
| Itérations | 3 | Coût temps |
| Parallélisme | 1 | Threads |
| Hash | 256 bits | Longueur sortie |
| Type | Argon2id | Hybride i/d |

**Avantages** :
- ✅ Résistant aux attaques GPU/ASIC
- ✅ Vainqueur de la Password Hashing Competition (2015)
- ✅ Protection contre attaques par canal auxiliaire

---

## 🛡️ Dénégation Plausible

### Concept

La dénégation plausible permet de nier l'existence de données secrètes. En cas de contrainte (menace, obligation légale), vous pouvez révéler le mot de passe "leurre" qui déchiffre des données factices.

### Propriétés de Sécurité

| Propriété | Garantie |
|-----------|----------|
| **Indistinguabilité** | Impossible de distinguer un conteneur à un ou deux espaces |
| **Non-prouvabilité** | L'attaquant ne peut pas prouver l'existence du second espace |
| **Crédibilité** | Les données leurre doivent être crédibles |

---

## 🔍 Audit de Sécurité

Un audit de sécurité complet a été réalisé. Voir le fichier [AUDIT.md](AUDIT.md) pour les détails.

### Résumé

| Test | Résultat |
|------|----------|
| Variables globales exposées | ✅ Aucune |
| Persistance DOM | ✅ Nettoyage automatique |
| Clés extractables | ✅ Non-extractables |
| Logs sensibles | ✅ Aucun |

### Vulnérabilité Corrigée

- **CVE-LOCAL-001** : Persistance des données sensibles dans le DOM (CORRIGÉE)

---

## 🎮 Easter Egg

Un easter egg Matrix est caché dans l'application !

**Code Konami** : `↑ ↑ ↓ ↓ ← → ← → B A`

---

## 📁 Structure du Projet

```
MC4-CryptoVault/
├── index.html          # Interface utilisateur
├── styles.css          # Thème Chromia Dashboard
├── crypto.js           # Module cryptographique
├── app.js              # Logique applicative
├── README.md           # Documentation
├── AUDIT.md            # Rapport de sécurité
└── RAPPORT_PROJET.odt  # Rapport complet
```

---

## 🛠️ Technologies

- **Web Crypto API** : Opérations cryptographiques natives du navigateur
- **Argon2-browser** : Librairie WASM pour Argon2id
- **JavaScript ES6+** : Modules, Promises, async/await
- **CSS3** : Variables CSS, Flexbox, Grid

---

## ⚠️ Avertissements

1. **Sauvegardez vos clés/mots de passe** : Sans eux, vos données sont irrécupérables
2. **Ne partagez pas vos clés** : Utilisez des canaux sécurisés
3. **Usage responsable** : Cet outil est fourni à des fins éducatives

---

## 📚 Références

- [NIST SP 800-38D](https://csrc.nist.gov/publications/detail/sp/800-38d/final) - GCM Mode
- [RFC 9106](https://datatracker.ietf.org/doc/rfc9106/) - Argon2
- [Web Crypto API](https://www.w3.org/TR/WebCryptoAPI/) - W3C

---

## 📜 Licence

MIT License - Libre d'utilisation, modification et distribution.

---

## 👤 Auteur

**Mallaury PRE** - MC4 Cryptographie

---

<p align="center">
  <strong>🔐 CryptoVault</strong> - Chiffrement sécurisé dans votre navigateur
</p>
