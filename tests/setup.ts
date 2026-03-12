import '@testing-library/jest-dom';

// Mock import.meta.env for tests
if (!(globalThis as any).import_meta_env_set) {
  (globalThis as any).import_meta_env_set = true;
}
