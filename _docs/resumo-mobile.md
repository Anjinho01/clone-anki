# Flashcards - Resumo do Projeto Mobile

> Aplicação de flashcards inspirada no Anki. Projeto completo com API, Web e Mobile.

## Status Atual

O projeto **Mobile** foi inicializado e está na fase inicial de setup. As pastas `Backend/` e `Frontend/` existem porém estão **vazias**. O desenvolvimento ativo até agora concentra-se exclusivamente no app mobile.

---

## Stack Tecnológica

| Tecnologia | Versão |
|---|---|
| React Native | 0.82.1 |
| React | 19.1.1 |
| TypeScript | 5.8.3 |
| Kotlin | 2.1.20 (Android nativo) |
| Swift | 5.0 (iOS nativo) |
| Node.js | >= 20 |
| Gradle | 9.0.0 |
| Hermes | Habilitado |
| New Architecture | Habilitada (Fabric + TurboModules) |

### Dependências Instaladas

**Produção:**
- `react-native-safe-area-context` — gerenciamento de safe areas
- `@react-native/new-app-screen` — tela inicial padrão do template

**Desenvolvimento:**
- Babel, ESLint, Prettier, Jest, TypeScript e presets padrão do React Native 0.82

---

## Estrutura do Projeto

```
Mobile/
├── src/
│   └── App.tsx                  # Componente principal (tela padrão do template)
├── index.js                     # Entry point do app
├── app.json                     # Configuração do nome do app
├── package.json                 # Dependências e scripts
├── tsconfig.json                # Configuração TypeScript
├── babel.config.js              # Configuração Babel
├── metro.config.js              # Configuração Metro bundler
├── jest.config.js               # Configuração Jest
├── Gemfile                      # Dependências Ruby (CocoaPods/iOS)
├── __tests__/
│   └── App.test.tsx             # Teste básico do componente App
├── android/
│   ├── build.gradle             # Config Gradle raiz
│   ├── settings.gradle          # Settings Gradle
│   ├── gradle.properties        # Propriedades Gradle (Hermes, New Arch, etc.)
│   └── app/
│       ├── build.gradle         # Config build do app Android
│       ├── proguard-rules.pro   # Regras ProGuard
│       └── src/main/
│           ├── AndroidManifest.xml
│           ├── java/com/flashcards/
│           │   ├── MainActivity.kt
│           │   └── MainApplication.kt
│           └── res/
│               ├── values/strings.xml
│               ├── values/styles.xml
│               ├── drawable/
│               └── mipmap-*/      # Ícones em diferentes densidades
├── ios/
│   ├── Podfile                  # Dependências CocoaPods
│   ├── Flashcards/
│   │   ├── AppDelegate.swift    # Entry point iOS
│   │   ├── Info.plist
│   │   ├── LaunchScreen.storyboard
│   │   ├── PrivacyInfo.xcprivacy
│   │   └── Images.xcassets/     # Assets do app (ícones)
│   └── Flashcards.xcodeproj/    # Projeto Xcode
├── localize/                    # Ferramenta auxiliar de automação
│   ├── main.py                  # OCR + template matching em screenshots
│   ├── requirements.txt         # pytesseract, opencv, numpy
│   └── setup.sh                 # Setup do venv Python
└── scripts shell
    ├── debug-and-install.sh     # Build debug + instalação + config automática no device
    ├── release.sh               # Build release (APK + AAB)
    ├── ip.sh                    # Mostra IP da interface Wi-Fi
    ├── keytool.sh               # Gera keystore de release
    └── config_ufw.sh            # Configura firewall (porta 8088)
```

---

## O Que Já Foi Feito

### 1. Inicialização do Projeto
- Projeto React Native **0.82.1** criado via CLI (`@react-native-community/cli`)
- **New Architecture habilitada** (Fabric + TurboModules)
- **Hermes** como engine JavaScript
- Configuração de **TypeScript** com preset oficial do React Native
- **Edge-to-edge** desabilitado por enquanto

### 2. App (`src/App.tsx`)
- Componente raiz com `SafeAreaProvider` do `react-native-safe-area-context`
- Renderiza a tela padrão do template (`NewAppScreen`)
- Suporte a dark/light mode via `useColorScheme`
- Estrutura básica pronta para receber as telas do app

### 3. Configuração Android
- **SDK:** compileSdk 36, minSdk 24, targetSdk 36
- **Namespace/ApplicationId:** `com.flashcards`
- **Kotlin:** 2.1.20
- **NDK:** 27.1.12297006
- **Gradle:** 9.0.0
- Signing configurado com keystore debug padrão
- ProGuard desabilitado em builds de release (por enquanto)

### 4. Configuração iOS
- **Deployment target:** iOS 15.1
- **Swift:** 5.0
- **CocoaPods** para gerenciamento de dependências nativas
- Privacy manifest (`PrivacyInfo.xcprivacy`) configurado
- LaunchScreen com storyboard simples

### 5. Scripts de Automação
- **`debug-and-install.sh`** — Script completo que:
  - Limpa e compila o APK debug
  - Instala no device via ADB
  - Configura o IP do Metro bundler automaticamente via OCR (pytesseract)
  - Recarrega o app
- **`release.sh`** — Compila APK e AAB de release
- **`ip.sh`** — Exibe o IP local (wlan0)
- **`keytool.sh`** — Gera keystore para assinatura de release
- **`config_ufw.sh`** — Configura firewall UFW para permitir a porta 8088

### 6. Ferramenta de Localização (`localize/`)
- Script Python para **OCR em screenshots** usando `pytesseract` + `opencv`
- Suporta busca por texto e por template matching em imagens
- Usado pelo `debug-and-install.sh` para automação de UI no device

### 7. Testes
- Jest configurado com preset `react-native`
- Teste básico de renderização do componente `App`

---

## Scripts NPM Disponíveis

| Script | Descrição |
|---|---|
| `npm start` | Inicia o Metro bundler na porta 8088 |
| `npm start:cache` | Inicia o Metro com reset de cache |
| `npm run android` | Roda o app no Android |
| `npm run android:build` | Build e install via Gradle |
| `npm run ios` | Roda o app no iOS |
| `npm run debug` | Executa `debug-and-install.sh` |
| `npm run release` | Executa `release.sh` |
| `npm run clean` | Remove node_modules e package-lock.json |
| `npm run clean:android` | Limpa build Android |
| `npm test` | Roda os testes com Jest |
| `npm run lint` | Roda ESLint |

---

## Configurações Notáveis

- **Porta do Metro:** `8088` (não a padrão 8081)
- **New Architecture:** habilitada (`newArchEnabled=true`)
- **Hermes:** habilitado (`hermesEnabled=true`)
- **minSdkVersion:** 24 (Android 7.0)
- **iOS Deployment Target:** 15.1

---

## Próximos Passos Sugeridos

- [ ] Definir nome final do projeto
- [ ] Implementar sistema de navegação (React Navigation)
- [ ] Criar estrutura de pastas para o app (screens, components, services, hooks, etc.)
- [ ] Implementar tela de listagem de baralhos (decks)
- [ ] Implementar tela de estudo com sistema de repetição espaçada
- [ ] Integrar com a API (Backend — ainda não iniciado)
- [ ] Configurar gerenciamento de estado (Zustand, Redux, etc.)
- [ ] Adicionar persistência local (AsyncStorage / MMKV / SQLite)
- [ ] Configurar CI/CD
- [ ] Iniciar desenvolvimento do Backend e Frontend (Web)
