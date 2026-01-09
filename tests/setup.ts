import "@testing-library/jest-dom/vitest";

// Some components/tests stub fetch directly; keep a safe default.
if (!(globalThis as any).fetch) {
  (globalThis as any).fetch = async () => {
    throw new Error("global fetch is not mocked for this test");
  };
}

