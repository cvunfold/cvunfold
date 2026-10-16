export function ownerMailConfiguration() {
  return { from: process.env.SCHOOL_CONTACT_FROM || "CVUnfold <onboarding@resend.dev>", to: ["pawelmaczkaczarnecki@gmail.com"] };
}
