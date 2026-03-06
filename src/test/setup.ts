import "@testing-library/jest-dom";

// Mock the Tauri IPC bridge — not available in jsdom/happy-dom.
// Each test file may call vi.mocked(commands.*).mockResolvedValue() to control return values.
vi.mock("@/bindings", () => ({
  commands: {
    fetchPostProcessModels: vi.fn(),
    getAvailableMicrophones: vi.fn(),
    getAvailableOutputDevices: vi.fn(),
    getHistoryEntries: vi.fn(),
    isLaptop: vi.fn().mockResolvedValue({ status: "ok", data: false }),
    addPostProcessAction: vi
      .fn()
      .mockResolvedValue({ status: "ok", data: null }),
    updatePostProcessAction: vi
      .fn()
      .mockResolvedValue({ status: "ok", data: null }),
    deletePostProcessAction: vi
      .fn()
      .mockResolvedValue({ status: "ok", data: null }),
  },
}));

// react-i18next: return the key as-is so tests assert on stable i18n keys,
// not on translated strings that change when copy changes.
vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: vi.fn() },
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: "en",
      changeLanguage: vi.fn().mockResolvedValue(undefined),
    },
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}));

// OS type — not available outside the Tauri runtime.
vi.mock("@tauri-apps/plugin-os", () => ({
  type: vi.fn().mockReturnValue("macos"),
}));

// sonner toast — avoid import errors; tests that need to assert on toasts
// can call vi.mocked(toast.error) directly.
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
  Toaster: () => null,
}));
