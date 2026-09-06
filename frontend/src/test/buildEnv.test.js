import { describe, expect, it } from "vitest";
import config from "../../vite.config.js";

describe("vite.config: VITE_API_URL", () => {
  it("derruba o build de produção quando a variável não existe", () => {
    delete process.env.VITE_API_URL;
    expect(() => config({ command: "build", mode: "production" })).toThrow(
      /VITE_API_URL não definida/,
    );
  });

  it("aceita o build quando a variável existe", () => {
    process.env.VITE_API_URL = "https://api.exemplo.com/api";
    expect(() => config({ command: "build", mode: "production" })).not.toThrow();
    delete process.env.VITE_API_URL;
  });

  it("não exige a variável no servidor de desenvolvimento", () => {
    delete process.env.VITE_API_URL;
    expect(() => config({ command: "serve", mode: "development" })).not.toThrow();
  });
});
