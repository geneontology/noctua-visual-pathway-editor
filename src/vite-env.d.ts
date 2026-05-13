/// <reference types="vite/client" />

type AppEnv = 'dev' | 'beta' | 'prod'

interface ImportMetaEnv {
  readonly VITE_APP_ENV: AppEnv
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
