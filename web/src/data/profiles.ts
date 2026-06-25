"use client";

// Sistema de perfiles 100% local. NO es seguridad real: el PIN es un cerrojo de
// conveniencia para separar datos entre usuarias en el mismo navegador. Los datos
// se guardan sin cifrar en localStorage; el PIN solo se almacena hasheado para no
// dejarlo en claro.

export interface Profile {
  username: string;
  pinHash: string;
}

const PROFILES_KEY = "ft_profiles";
const CURRENT_KEY = "ft_current_profile";

/** Claves de datos namespaced por perfil. */
export function dataKeys(username: string): { entries: string; settings: string } {
  return {
    entries: `ft_entries::${username.toLowerCase()}`,
    settings: `ft_settings::${username.toLowerCase()}`,
  };
}

export function listProfiles(): Profile[] {
  try {
    return JSON.parse(localStorage.getItem(PROFILES_KEY) || "[]") as Profile[];
  } catch {
    return [];
  }
}

function saveProfiles(p: Profile[]): void {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(p));
}

export function currentProfile(): string | null {
  return localStorage.getItem(CURRENT_KEY);
}

export function setCurrent(username: string): void {
  localStorage.setItem(CURRENT_KEY, username);
}

export function clearCurrent(): void {
  localStorage.removeItem(CURRENT_KEY);
}

export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

async function hashPin(username: string, pin: string): Promise<string> {
  const data = new TextEncoder().encode(`${username.toLowerCase()}:${pin}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createProfile(username: string, pin: string): Promise<void> {
  const name = username.trim();
  if (!name) throw new Error("El nombre no puede estar vacío.");
  if (!isValidPin(pin)) throw new Error("El PIN debe tener exactamente 4 dígitos.");

  const profiles = listProfiles();
  if (profiles.some((p) => p.username.toLowerCase() === name.toLowerCase())) {
    throw new Error("Ya existe un perfil con ese nombre.");
  }

  // Migración: si es el primer perfil y había datos previos sin perfil, los adopta.
  if (profiles.length === 0) {
    const legacyEntries = localStorage.getItem("ft_entries");
    const legacySettings = localStorage.getItem("ft_settings");
    const k = dataKeys(name);
    if (legacyEntries && !localStorage.getItem(k.entries)) {
      localStorage.setItem(k.entries, legacyEntries);
    }
    if (legacySettings && !localStorage.getItem(k.settings)) {
      localStorage.setItem(k.settings, legacySettings);
    }
  }

  const pinHash = await hashPin(name, pin);
  saveProfiles([...profiles, { username: name, pinHash }]);
}

export async function verifyPin(username: string, pin: string): Promise<boolean> {
  const profile = listProfiles().find(
    (p) => p.username.toLowerCase() === username.toLowerCase()
  );
  if (!profile) return false;
  return (await hashPin(username, pin)) === profile.pinHash;
}

export async function changePin(username: string, newPin: string): Promise<void> {
  if (!isValidPin(newPin)) throw new Error("El PIN debe tener 4 dígitos.");
  const profiles = listProfiles();
  const idx = profiles.findIndex(
    (p) => p.username.toLowerCase() === username.toLowerCase()
  );
  if (idx < 0) throw new Error("Perfil no encontrado.");
  profiles[idx] = { ...profiles[idx], pinHash: await hashPin(username, newPin) };
  saveProfiles(profiles);
}

export function deleteProfile(username: string): void {
  const k = dataKeys(username);
  localStorage.removeItem(k.entries);
  localStorage.removeItem(k.settings);
  saveProfiles(
    listProfiles().filter((p) => p.username.toLowerCase() !== username.toLowerCase())
  );
  if (currentProfile() === username) clearCurrent();
}
