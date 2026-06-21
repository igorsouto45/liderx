// Registro do service worker do PWA com proteções:
// - nunca registra em dev, preview do Lovable, iframe ou quando ?sw=off
// - desregistra workers antigos nesses contextos
const SW_PATH = "/sw.js";

function isUnsafeContext(): boolean {
  if (typeof window === "undefined") return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const url = new URL(window.location.href);
  if (url.searchParams.get("sw") === "off") return true;
  const host = url.hostname;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;
  if (!import.meta.env.PROD) return true;
  return false;
}

async function unregisterAppSW() {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  for (const r of regs) {
    const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
    if (url.endsWith(SW_PATH)) {
      try {
        await r.unregister();
      } catch {}
    }
  }
}

export async function registerPWA() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  if (isUnsafeContext()) {
    await unregisterAppSW();
    return;
  }
  try {
    const reg = await navigator.serviceWorker.register(SW_PATH, { type: "classic" });
    // tenta sincronizar fila offline quando o controller estiver pronto
    if ("sync" in reg && typeof (reg as any).sync?.register === "function") {
      try {
        await (reg as any).sync.register("upload-fotos");
      } catch {}
    }
  } catch (e) {
    console.warn("[PWA] register failed", e);
  }
}
