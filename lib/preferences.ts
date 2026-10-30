export const PREFERENCES_KEY = "varda.preferences.v2";

export interface Preferences {
  theme: "light" | "dark" | "system";
  accent: "sunflower" | "sage" | "coral";
  motion: boolean;
  haptics: boolean;
  sound: boolean;
  ambience: boolean;
  offline: boolean;
  nickname: string;
}

export const defaultPreferences: Preferences = {
  theme: "system",
  accent: "sunflower",
  motion: true,
  haptics: true,
  sound: false,
  ambience: false,
  offline: false,
  nickname: "",
};

export function readPreferences(value: string | null): Preferences {
  try {
    const saved = JSON.parse(value || "{}");
    if (!saved || typeof saved !== "object") return defaultPreferences;
    const result = { ...defaultPreferences };
    if (["light", "dark", "system"].includes(saved.theme)) result.theme = saved.theme;
    if (["sunflower", "sage", "coral"].includes(saved.accent)) result.accent = saved.accent;
    for (const key of ["motion", "haptics", "sound", "ambience", "offline"] as const) {
      if (typeof saved[key] === "boolean") result[key] = saved[key];
    }
    if (typeof saved.nickname === "string") result.nickname = saved.nickname.slice(0, 40);
    return result;
  } catch {
    return defaultPreferences;
  }
}
