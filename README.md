# 🔐 CryptoVault

Application de chiffrement et déchiffrement de fichiers et messages avec **AES-256-GCM** et dérivation de clé **Argon2id**.

![Version](https://img.shields.io/badge/version-2.0-blue)
![Sécurité](https://img.shields.io/badge/security-AES--256--GCM-green)
![KDF](https://img.shields.io/badge/KDF-Argon2id-purple)

---

## 📋 Table des Matières

- [Fonctionnalités](#-fonctionnalités)
- [Installation](#-installation)
- [Guide d'Utilisation](#-guide-dutilisation)
- [Modes de Fonctionnement](#-modes-de-fonctionnement)
- [Sécurité Technique](#-sécurité-technique)
- [Dénégation Plausible](#-dénégation-plausible)
- [Format des Données](#-format-des-données)

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

---

## 🚀 Installation

Aucune installation requise ! L'application fonctionne entièrement dans le navigateur.

```bash
# Cloner ou télécharger le projet
git clone <repository-url>

# Ouvrir index.html dans un navigateur moderne
open index.html    # macOS
xdg-open index.html  # Linux
start index.html   # Windows
```

### Prérequis

- Navigateur moderne (Chrome, Firefox, Safari, Edge)
- Support de Web Crypto API (tous les navigateurs modernes)

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

**Cas d'usage** : Partage sécurisé avec échange de clé préalable

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

**Cas d'usage** : Protection par mot de passe mémorisable

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

**Cas d'usage** : Protection en cas de contrainte physique

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
- Chiffrement authentifié (confidentialité + intégrité)
- Accélération matérielle (AES-NI)
- Standard NIST

### Argon2id

| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| Mémoire | 64 MB | Coût mémoire |
| Itérations | 3 | Coût temps |
| Parallélisme | 1 | Threads |
| Hash | 256 bits | Longueur sortie |
| Type | Argon2id | Hybride i/d |

**Avantages** :
- Résistant aux attaques GPU/ASIC
- Vainqueur de la Password Hashing Competition
- Protection contre attaques par canal auxiliaire

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

### Recommandations

> ⚠️ **Pour une sécurité optimale :**

1. **Données leurre crédibles** : Utilisez des données qui semblent légitimes
2. **Mots de passe différents** : Utilisez des mots de passe mémorisables mais distincts
3. **Pas de traces** : Ne stockez pas vos mots de passe
4. **Comportement cohérent** : Accédez régulièrement aux deux espaces

---

## 📦 Format des Données

### Message Chiffré (Standard)

```
┌────────────────────────────────────────┐
│ IV (12 bytes) │ Ciphertext │ GCM Tag  │
└────────────────────────────────────────┘
```

### Message Chiffré (Mot de Passe)

```
┌──────────────────────────────────────────────────┐
│ Salt (16 bytes) │ IV (12 bytes) │ Ciphertext... │
└──────────────────────────────────────────────────┘
```

### Fichier Chiffré

```
┌──────────────────────────────────────────────────────────────┐
│ [Salt] │ IV │ Encrypted(FilenameLen + Filename + FileData) │
└──────────────────────────────────────────────────────────────┘
```

### Conteneur Deniable

```
┌─────────────────────────────────────────────────────────────────────┐
│ Marker (1) │ RealLen (4) │ DecoyLen (4) │ RealData │ DecoyData    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📄 Fichiers du Projet

| Fichier | Description |
|---------|-------------|
| `index.html` | Interface utilisateur |
| `styles.css` | Styles et thème sombre |
| `crypto.js` | Module cryptographique |
| `app.js` | Logique applicative |

---

## ⚠️ Avertissements

1. **Sauvegardez vos clés/mots de passe** : Sans eux, vos données sont irrécupérables
2. **Ne partagez pas vos clés** : Utilisez des canaux sécurisés
3. **Usage responsable** : Cet outil est fourni à des fins éducatives

---

## 📜 Licence

MIT License - Libre d'utilisation, modification et distribution.

---

<p align="center">
  <strong>🔐 CryptoVault</strong> - Chiffrement sécurisé dans votre navigateur
</p>
