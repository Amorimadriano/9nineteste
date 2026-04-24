import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn (className merge)", () => {
  it("deve combinar classes simples", () => {
    expect(cn("class1", "class2")).toBe("class1 class2");
  });

  it("deve manter classes duplicadas (comportamento tailwind-merge)", () => {
    // tailwind-merge não remove duplicatas, apenas resolve conflitos
    expect(cn("class1", "class1")).toBe("class1 class1");
  });

  it("deve lidar com valores condicionais", () => {
    expect(cn("base", true && "conditional")).toBe("base conditional");
    expect(cn("base", false && "conditional")).toBe("base");
  });

  it("deve lidar com objetos de classes", () => {
    expect(cn("base", { active: true, disabled: false })).toBe("base active");
    expect(cn("base", { active: true, disabled: true })).toBe("base active disabled");
  });

  it("deve lidar com arrays", () => {
    expect(cn(["class1", "class2"])).toBe("class1 class2");
    expect(cn("base", ["class1", "class2"])).toBe("base class1 class2");
  });

  it("deve lidar com valores undefined/null", () => {
    expect(cn("class1", undefined, "class2", null)).toBe("class1 class2");
  });

  it("deve lidar com strings vazias", () => {
    expect(cn("class1", "", "class2")).toBe("class1 class2");
  });

  it("deve mesclar classes do Tailwind corretamente", () => {
    // Tailwind merge deve resolver conflitos
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("deve retornar string vazia quando nao ha classes", () => {
    expect(cn()).toBe("");
    expect(cn("", null, undefined)).toBe("");
  });

  it("deve lidar com combinacao complexa", () => {
    const result = cn(
      "base-class",
      { active: true, disabled: false },
      ["extra", "classes"],
      undefined,
      "final"
    );

    expect(result).toContain("base-class");
    expect(result).toContain("active");
    expect(result).toContain("extra");
    expect(result).toContain("classes");
    expect(result).toContain("final");
    expect(result).not.toContain("disabled");
  });
});
