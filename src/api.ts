import axios from "axios";
import type { TriageResult } from "./types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
});

export async function triageTicket(text: string): Promise<TriageResult> {
  const { data } = await api.post("/api/tickets/triage", { text });
  console.log(data.result);
  return data.result;
}
