import { ownerMailConfiguration } from "./owner-mail";
import { Resend } from "resend";
export type FeedbackNotification = { requestId: string; rating: number; accurate: "yes" | "partly" | "no"; comment?: string; source: "individual" | "school"; locale: string; version?: number; issueSpecific?: boolean };
export async function sendFeedbackNotification(message: FeedbackNotification): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const accuracy = { yes: "Tak", partly: "Częściowo", no: "Nie" };
  try {
    const { data, error } = await new Resend(key).emails.send({
      ...ownerMailConfiguration(),
      subject: `CVUnfold: feedback do raportu${message.source === "school" ? " szkoły" : ""} · ${message.rating}/5`,
      text: ["Nowy feedback z formularza na dole raportu CVUnfold.", "",
        `Źródło: ${message.source === "school" ? "Panel szkoły" : "Raport indywidualny"}`,
        `Język: ${message.locale}`, ...(message.version !== undefined ? [`Wersja CV: ${message.version + 1}`] : []),
        `Ocena: ${message.rating}/5`, `Czy analiza była trafna: ${accuracy[message.accurate]}`,
        `Zakres: ${message.issueSpecific ? "Wybrana uwaga w raporcie" : "Cały raport"}`, "", "Komentarz:", message.comment?.trim() || "Nie dodano komentarza.",
      ].join("\n"),
    }, { idempotencyKey: `report-feedback/${message.requestId}` });
    return !error && Boolean(data?.id);
  } catch { return false; }
}
