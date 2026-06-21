// Fila offline de fotos de reunião usando IndexedDB.
// Cada item guarda blob da foto + GPS + timestamp; envia ao Storage e
// insere uma linha em fotos_reuniao quando há internet.
import { openDB, type IDBPDatabase } from "idb";
import { supabase } from "@/integrations/supabase/client";

const DB_NAME = "liderx-offline";
const STORE = "outbox_fotos";

export interface OutboxFoto {
  id?: number;
  userId: string;
  reuniaoId: string | null;
  blob: Blob;
  filename: string;
  contentType: string;
  latitude: number | null;
  longitude: number | null;
  capturadaEm: string; // ISO
  observacao?: string | null;
  tentativas: number;
  criadoEm: number;
}

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      }
    },
  });
}

export async function enqueueFoto(item: Omit<OutboxFoto, "id" | "tentativas" | "criadoEm">) {
  const db = await getDB();
  await db.add(STORE, { ...item, tentativas: 0, criadoEm: Date.now() } as OutboxFoto);
  notifyChange();
  // dispara upload imediato (se online)
  void flushFotos();
}

export async function listFotosPendentes(): Promise<OutboxFoto[]> {
  const db = await getDB();
  return (await db.getAll(STORE)) as OutboxFoto[];
}

export async function countFotosPendentes(): Promise<number> {
  const db = await getDB();
  return db.count(STORE);
}

async function removeFoto(id: number) {
  const db = await getDB();
  await db.delete(STORE, id);
  notifyChange();
}

async function bumpTentativa(item: OutboxFoto) {
  const db = await getDB();
  await db.put(STORE, { ...item, tentativas: (item.tentativas ?? 0) + 1 });
}

let flushing = false;
export async function flushFotos(): Promise<{ enviadas: number; falharam: number }> {
  if (flushing) return { enviadas: 0, falharam: 0 };
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { enviadas: 0, falharam: 0 };
  }
  flushing = true;
  let enviadas = 0;
  let falharam = 0;
  try {
    const items = await listFotosPendentes();
    for (const item of items) {
      try {
        const path = `${item.userId}/${Date.now()}-${item.filename}`;
        const up = await supabase.storage
          .from("fotos-reunioes")
          .upload(path, item.blob, { contentType: item.contentType, upsert: false });
        if (up.error) throw up.error;

        const ins = await supabase.from("fotos_reuniao").insert({
          reuniao_id: item.reuniaoId,
          lideranca_user_id: item.userId,
          storage_path: path,
          latitude: item.latitude,
          longitude: item.longitude,
          capturada_em: item.capturadaEm,
          observacao: item.observacao ?? null,
        });
        if (ins.error) throw ins.error;

        if (item.id != null) await removeFoto(item.id);
        enviadas++;
      } catch (e) {
        console.warn("[offline-fotos] falha ao enviar", e);
        await bumpTentativa(item);
        falharam++;
      }
    }
  } finally {
    flushing = false;
  }
  return { enviadas, falharam };
}

// -------- pub/sub simples para badge na UI --------
type Listener = () => void;
const listeners = new Set<Listener>();
function notifyChange() {
  for (const l of listeners) {
    try { l(); } catch {}
  }
}
export function subscribeOutbox(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

// Quando voltar online, tenta enviar
if (typeof window !== "undefined") {
  window.addEventListener("online", () => { void flushFotos(); });
}
