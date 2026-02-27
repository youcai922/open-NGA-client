/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NGA_COOKIE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
