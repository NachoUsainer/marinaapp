"use client";

import { useEffect, useState } from "react";
import {
  createProfile,
  isValidPin,
  listProfiles,
  Profile,
  verifyPin,
} from "@/data/profiles";

type Mode = "pick" | "login" | "create";

export function LockScreen({ onAuth }: { onAuth: (username: string) => void }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [mode, setMode] = useState<Mode>("pick");
  const [selected, setSelected] = useState<string>("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const list = listProfiles();
    setProfiles(list);
    setMode(list.length === 0 ? "create" : "pick");
  }, []);

  const resetFields = () => {
    setPin("");
    setPin2("");
    setError("");
  };

  const startLogin = (name: string) => {
    setSelected(name);
    resetFields();
    setMode("login");
  };

  const handleLogin = async () => {
    setBusy(true);
    setError("");
    const ok = await verifyPin(selected, pin);
    setBusy(false);
    if (ok) onAuth(selected);
    else {
      setError("PIN incorrecto.");
      setPin("");
    }
  };

  const handleCreate = async () => {
    setError("");
    if (pin !== pin2) {
      setError("Los PIN no coinciden.");
      return;
    }
    setBusy(true);
    try {
      await createProfile(username, pin);
      onAuth(username.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear el perfil.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center bg-ios-bg px-6">
      <div className="mb-8 text-center">
        <div className="mb-2 text-5xl">🌸</div>
        <h1 className="text-2xl font-bold text-ios-label">Fertility Tracker</h1>
        <p className="mt-1 text-sm text-ios-secondary">
          Método sintotérmico · 100% local
        </p>
      </div>

      <div className="rounded-2xl bg-ios-card p-6 shadow-sm">
        {mode === "pick" && (
          <>
            <h2 className="mb-3 text-center text-base font-semibold text-ios-label">
              Elige tu perfil
            </h2>
            <div className="space-y-2">
              {profiles.map((p) => (
                <button
                  key={p.username}
                  onClick={() => startLogin(p.username)}
                  className="flex w-full items-center justify-between rounded-xl border border-ios-sep px-4 py-3 text-left active:bg-black/5"
                >
                  <span className="font-medium text-ios-label">{p.username}</span>
                  <span className="text-ios-tertiary">›</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setUsername("");
                resetFields();
                setMode("create");
              }}
              className="mt-4 w-full text-sm font-medium text-brand-rose"
            >
              + Crear otro perfil
            </button>
          </>
        )}

        {mode === "login" && (
          <>
            <h2 className="mb-1 text-center text-base font-semibold text-ios-label">
              Hola, {selected}
            </h2>
            <p className="mb-4 text-center text-sm text-ios-secondary">
              Introduce tu PIN de 4 dígitos
            </p>
            <PinInput value={pin} onChange={setPin} onComplete={handleLogin} autoFocus />
            {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}
            <button
              onClick={handleLogin}
              disabled={!isValidPin(pin) || busy}
              className="mt-5 h-12 w-full rounded-xl bg-brand-rose font-semibold text-white disabled:opacity-40"
            >
              Entrar
            </button>
            <button
              onClick={() => {
                resetFields();
                setMode("pick");
              }}
              className="mt-3 w-full text-sm text-ios-secondary"
            >
              ← Volver
            </button>
          </>
        )}

        {mode === "create" && (
          <>
            <h2 className="mb-4 text-center text-base font-semibold text-ios-label">
              Crear perfil
            </h2>
            <label className="mb-1 block text-xs text-ios-secondary">Nombre</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tu nombre"
              maxLength={24}
              className="mb-4 w-full rounded-xl border border-ios-sep px-4 py-3 outline-none focus:border-brand-rose"
            />
            <label className="mb-1 block text-xs text-ios-secondary">PIN (4 dígitos)</label>
            <PinInput value={pin} onChange={setPin} />
            <label className="mb-1 mt-4 block text-xs text-ios-secondary">
              Repite el PIN
            </label>
            <PinInput value={pin2} onChange={setPin2} />
            {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}
            <button
              onClick={handleCreate}
              disabled={!username.trim() || !isValidPin(pin) || !isValidPin(pin2) || busy}
              className="mt-5 h-12 w-full rounded-xl bg-brand-rose font-semibold text-white disabled:opacity-40"
            >
              Crear y entrar
            </button>
            {profiles.length > 0 && (
              <button
                onClick={() => {
                  resetFields();
                  setMode("pick");
                }}
                className="mt-3 w-full text-sm text-ios-secondary"
              >
                ← Volver
              </button>
            )}
          </>
        )}
      </div>

      <p className="mt-6 px-2 text-center text-xs leading-snug text-ios-tertiary">
        El PIN es un cerrojo local para separar perfiles en este navegador, no un sistema
        de seguridad. Los datos no se cifran ni salen de tu dispositivo.
      </p>
    </main>
  );
}

function PinInput({
  value,
  onChange,
  onComplete,
  autoFocus = false,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: () => void;
  autoFocus?: boolean;
}) {
  return (
    <input
      type="password"
      inputMode="numeric"
      autoFocus={autoFocus}
      value={value}
      onChange={(e) => {
        const v = e.target.value.replace(/\D/g, "").slice(0, 4);
        onChange(v);
        if (v.length === 4 && onComplete) onComplete();
      }}
      placeholder="••••"
      className="w-full rounded-xl border border-ios-sep px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-brand-rose"
    />
  );
}
