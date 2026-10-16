import { ownerMailConfiguration } from "@/lib/owner-mail";
import { Resend } from "resend";
import { type SchoolContactMessage } from "./offer";

export function schoolContactDeliveryEnabled() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendSchoolContact(message: SchoolContactMessage): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const { data, error } = await new Resend(key).emails.send({
    ...ownerMailConfiguration(),
    replyTo: message.email,
    subject: `CVUnfold dla szkół: ${message.school}`,
    text: `Nowa wiadomość z formularza CVUnfold dla szkół.\n\nImię i nazwisko: ${message.name}\nE-mail: ${message.email}\nTelefon: ${message.phone || "Nie podano"}\nSzkoła lub bootcamp: ${message.school}\n\n${message.message || "Nie dodano wiadomości."}`,
  }, { idempotencyKey: `school-contact/${message.requestId}` });
  return !error && Boolean(data?.id);
}
