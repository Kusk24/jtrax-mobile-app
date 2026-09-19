/**
 * Registering a child for the academy's next tournament, and paying the fee.
 *
 * Four stages, as in the portal: the event, the entry, the payment, and what
 * came of it. The card option opens Stripe Checkout in the system browser; the
 * other two methods are taken at the front desk, and say so rather than
 * pretending money moved.
 *
 * One thing the portal carries is deliberately not here: its "Regulations PDF"
 * and "Venue map" rows are `href="#"` — they go nowhere, and a row that does
 * nothing on a phone is just a mis-tap. The medical-notes and remarks boxes,
 * left out for the same reason, are back now that 0033 gave them columns.
 */
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import {
  CalendarClock, CalendarDays, Check, CircleDollarSign, Layers, MapPin, Trophy, UserRound,
} from "lucide-react-native";
import { useParentData } from "@/components/parent/ParentData";
import { TournamentBanner } from "@/components/parent/TournamentBanner";
import { BackHeader } from "@/components/parent/BackHeader";
import { PP } from "@/lib/colors";

/* "done" is a fee that has been settled; "held" is a place taken with the fee
   still owed — the screen used to show the first for both, and for the card
   path it showed it without charging anything at all. */
type Step = "detail" | "register" | "payment" | "done" | "held";

const CARD = "rounded-card bg-pp-card p-4 shadow-clay";

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="font-sans-bold text-[11.5px] uppercase tracking-[1.6px] text-pp-sub">
      {children}
    </Text>
  );
}

function Radio({ selected }: { selected: boolean }) {
  return (
    <View
      style={{ borderColor: selected ? PP.blue : PP.line }}
      className="size-5 items-center justify-center rounded-full border-[1.5px]"
    >
      {selected && <View className="size-[11px] rounded-full bg-pp-blue" />}
    </View>
  );
}

/* Stripe's card form, in the system browser sheet rather than a WebView.
   A payment page belongs where the address bar and the saved cards are: a
   WebView shows no origin, so a parent has nothing to check before typing a
   card number into it, and the browser's autofill will not offer to help. */
async function openCheckout(url: string) {
  await WebBrowser.openBrowserAsync(url, { dismissButtonStyle: "cancel" });
}

function Cta({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={{ opacity: disabled ? 0.6 : 1 }}
      className="rounded-[14px] bg-pp-blue py-3.5"
    >
      <Text className="text-center font-sans-bold text-sm text-white">{label}</Text>
    </Pressable>
  );
}

export default function TournamentFlow() {
  const t = useTranslations("pv2");
  const router = useRouter();
  const {
    children: childList, tournament, tournamentEntries, parent, register, payCardFee,
  } = useParentData();
  const [submitting, setSubmitting] = useState(false);
  /* Whatever the server said stays in the log. A parent gets one sentence
     they can act on, in their own language, beside the button. */
  const [registerFailed, setRegisterFailed] = useState(false);
  /* Separate from registerFailed because they mean different things to a
     parent: one says the child has no place, the other says the child has a
     place and the fee is still owed. */
  const [payFailed, setPayFailed] = useState(false);
  const [step, setStep] = useState<Step>("detail");
  const [child, setChild] = useState(childList[0]?.key ?? "");
  const [pay, setPay] = useState<"card" | "promptpay" | "bank">("card");
  /* Prefilled with the signed-in parent, still editable: the contact for the
     day is not always the account holder. */
  /* Both boxes are sent now. They were left out of this port entirely while
     the portal's own were uncontrolled and read by nobody — a parent typing an
     allergy into them was telling the browser. */
  const [notes, setNotes] = useState({ medical: "", remarks: "" });
  const [contact, setContact] = useState({
    name: parent.name,
    phone: parent.phone,
    email: parent.email,
  });

  const participant = childList.find((c) => c.key === child) ?? childList[0];
  /* A child with a place cannot be registered again — the second attempt is
     refused by a unique index, which is what a family who had a card declined
     used to hit. They get the fee button instead. */
  const entered = new Set(tournamentEntries.map((e) => e.studentId));
  const available = childList.filter((c) => !entered.has(c.key));
  const input =
    "rounded-[13px] border-[1.5px] border-pp-line bg-pp-card px-3.5 py-3 font-sans text-[13px] text-pp-ink";

  /* No event open — nothing to register for. Home only links here while a
     tournament exists, but a deep link can always arrive. */
  if (!tournament || !participant) {
    return (
      <ScrollView className="flex-1 bg-pp-bg" contentContainerClassName="gap-4 px-4 pb-10 pt-4">
        <BackHeader title={t("tournamentTitle")} onBack={() => router.replace("/parent")} />
        <View className="rounded-card border-[1.5px] border-dashed border-pp-dash p-6">
          <Text className="text-center font-sans text-[12.5px] text-pp-muted">
            ♞ {t("noTournament")}
          </Text>
        </View>
      </ScrollView>
    );
  }

  if (step === "done" || step === "held") {
    const settled = step === "done";
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-pp-bg px-5">
        <View
          className={`size-16 items-center justify-center rounded-full ${
            settled ? "bg-pp-green-soft" : "bg-pp-amber-soft"
          }`}
        >
          {settled
            ? <Check size={30} color={PP.green} strokeWidth={2} />
            : <CalendarClock size={30} color={PP.amber} strokeWidth={2} />}
        </View>
        <Text className="text-center font-display-semibold text-[22px] text-pp-ink">
          {settled ? t("regConfirmed") : t("placeHeld")}
        </Text>
        <Text className="text-center font-sans text-[13.5px] leading-relaxed text-pp-sub">
          {settled
            ? t("regConfirmedBody", { name: participant.name, event: tournament.name })
            : t("placeHeldBody", {
              name: participant.name,
              event: tournament.name,
              fee: tournament.fee,
            })}
        </Text>
        <Pressable
          onPress={() => router.replace("/parent")}
          accessibilityRole="button"
          className="rounded-[14px] bg-pp-blue px-7 py-3.5"
        >
          <Text className="font-sans-bold text-sm text-white">{t("done")}</Text>
        </Pressable>
      </View>
    );
  }

  if (step === "register") {
    return (
      <ScrollView
        className="flex-1 bg-pp-bg"
        contentContainerClassName="gap-4 px-4 pb-10 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <BackHeader title={t("registration")} onBack={() => setStep("detail")} />

        <View className="gap-2">
          <SectionLabel>{t("selectChild")}</SectionLabel>
          <View className="gap-2.5">
            {available.map((c) => (
              <Pressable
                key={c.key}
                onPress={() => setChild(c.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: child === c.key }}
                style={{ borderColor: child === c.key ? PP.blue : PP.line }}
                className="flex-row items-center gap-3 rounded-card border-[1.5px] bg-pp-card p-4"
              >
                <Radio selected={child === c.key} />
                <View>
                  <Text className="font-sans-bold text-sm text-pp-ink">{c.name}</Text>
                  <Text className="font-sans text-[11.5px] text-pp-muted">{c.clsTitle}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="gap-1.5">
          <Text className="font-sans-bold text-[11px] uppercase tracking-[1.1px] text-pp-sub">
            {t("medicalNotes")}
          </Text>
          <TextInput
            value={notes.medical}
            onChangeText={(v) => setNotes({ ...notes, medical: v })}
            placeholder={t("none")}
            placeholderTextColor={PP.faint}
            accessibilityLabel={t("medicalNotes")}
            multiline
            numberOfLines={3}
            maxLength={2000}
            className={`${input} h-[74px]`}
            textAlignVertical="top"
          />
        </View>

        <View className="gap-1.5">
          <Text className="font-sans-bold text-[11px] uppercase tracking-[1.1px] text-pp-sub">
            {t("remarks")}
          </Text>
          <TextInput
            value={notes.remarks}
            onChangeText={(v) => setNotes({ ...notes, remarks: v })}
            placeholder={t("remarksPh")}
            placeholderTextColor={PP.faint}
            accessibilityLabel={t("remarks")}
            multiline
            numberOfLines={3}
            maxLength={2000}
            className={`${input} h-[74px]`}
            textAlignVertical="top"
          />
        </View>

        <View className="gap-2.5">
          <SectionLabel>{t("contactInfo")}</SectionLabel>
          <TextInput
            value={contact.name}
            onChangeText={(v) => setContact({ ...contact, name: v })}
            placeholder={t("fullName")}
            placeholderTextColor={PP.faint}
            accessibilityLabel={t("fullName")}
            className={input}
          />
          <TextInput
            value={contact.phone}
            onChangeText={(v) => setContact({ ...contact, phone: v })}
            placeholder={t("phoneNumber")}
            placeholderTextColor={PP.faint}
            accessibilityLabel={t("phoneNumber")}
            keyboardType="phone-pad"
            className={input}
          />
          <TextInput
            value={contact.email}
            onChangeText={(v) => setContact({ ...contact, email: v })}
            placeholder={t("emailAddress")}
            placeholderTextColor={PP.faint}
            accessibilityLabel={t("emailAddress")}
            keyboardType="email-address"
            autoCapitalize="none"
            className={input}
          />
        </View>

        <Cta label={t("continuePayment")} onPress={() => setStep("payment")} />
      </ScrollView>
    );
  }

  if (step === "payment") {
    return (
      <ScrollView
        className="flex-1 bg-pp-bg"
        contentContainerClassName="gap-4 px-4 pb-10 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <BackHeader title={t("payment")} onBack={() => setStep("register")} />

        <View className={`${CARD} gap-3.5`}>
          <View className="gap-0.5">
            <Text className="font-sans-bold text-[10.5px] uppercase tracking-[1.2px] text-pp-faint">
              {t("tournamentTitle")}
            </Text>
            <Text className="font-sans-bold text-sm text-pp-ink">{tournament.name}</Text>
          </View>
          <View className="border-t border-pp-line" />
          <View className="gap-0.5">
            <Text className="font-sans-bold text-[10.5px] uppercase tracking-[1.2px] text-pp-faint">
              {t("participant")}
            </Text>
            <Text className="font-sans-bold text-sm text-pp-ink">{participant.name}</Text>
          </View>
          <View className="border-t border-pp-line" />
          <View className="flex-row items-center justify-between">
            <Text className="font-sans text-[12.5px] text-pp-muted">{t("tournamentFee")}</Text>
            <Text className="font-sans-bold text-[13px] text-pp-ink">{tournament.fee}</Text>
          </View>
        </View>

        <View className="gap-2">
          <SectionLabel>{t("paymentMethod")}</SectionLabel>
          <View className="gap-2.5">
            {(
              [
                ["card", t("creditCard")],
                ["promptpay", t("promptpay")],
                ["bank", t("bankTransfer")],
              ] as const
            ).map(([k, lbl]) => (
              <Pressable
                key={k}
                onPress={() => setPay(k)}
                accessibilityRole="radio"
                accessibilityState={{ selected: pay === k }}
                style={{ borderColor: pay === k ? PP.blue : PP.line }}
                className="flex-row items-center gap-3 rounded-card border-[1.5px] bg-pp-card px-4 py-3.5"
              >
                <Radio selected={pay === k} />
                <Text className="font-sans-bold text-[13.5px] text-pp-ink">{lbl}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className={`${CARD} flex-row items-center justify-between`}>
          <Text className="font-sans-bold text-[13px] text-pp-ink">{t("total")}</Text>
          <Text className="font-display-semibold text-[19px] text-pp-blue">{tournament.fee}</Text>
        </View>

        {registerFailed && (
          <Text accessibilityRole="alert" className="font-sans-bold text-[12.5px] text-pp-danger">
            {t("registerFailed")}
          </Text>
        )}

        {payFailed && (
          <Text accessibilityRole="alert" className="font-sans-bold text-[12.5px] text-pp-danger">
            {t("payFailed")}
          </Text>
        )}

        <Cta
          label={submitting && pay === "card" ? t("openingPayment") : t("payNow")}
          disabled={submitting}
          onPress={async () => {
            setSubmitting(true);
            setRegisterFailed(false);
            setPayFailed(false);
            let registrationId = "";
            try {
              registrationId = await register({
                tournamentId: tournament.id,
                studentId: participant.id,
                contact: contact.phone,
                medicalNotes: notes.medical.trim(),
                remarks: notes.remarks.trim(),
              });
            } catch {
              setRegisterFailed(true);
              setSubmitting(false);
              return;
            }
            /* The place exists from here on, whatever happens to the money.
               PromptPay and bank transfer are taken at the front desk, so
               choosing either means exactly that and nothing is charged — which
               is what the screen now says instead of claiming a payment went
               through. */
            if (pay !== "card") {
              setStep("held");
              setSubmitting(false);
              return;
            }
            try {
              const url = await payCardFee(registrationId);
              if (!url) {
                setStep("held");
                return;
              }
              await openCheckout(url);
              /* The card form is Stripe's and the "paid" mark is the webhook's,
                 not this app's: closing the browser says nothing about whether
                 the charge went through. So the honest screen is the one that
                 says a place is held — a settled fee shows as paid on the event
                 screen the next time the portal loads. */
              setStep("held");
            } catch {
              setPayFailed(true);
            } finally {
              setSubmitting(false);
            }
          }}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-pp-bg"
      contentContainerClassName="gap-4 px-4 pb-10 pt-4"
      showsVerticalScrollIndicator={false}
    >
      <BackHeader title={t("tournamentTitle")} onBack={() => router.replace("/parent")} />
      <TournamentBanner height={200} rounded={20} />
      <Text className="font-display-semibold text-xl leading-snug text-pp-ink">
        {tournament.name}
      </Text>

      <View className={`${CARD} gap-3`}>
        <View className="flex-row items-center gap-2.5">
          <MapPin size={16} color={PP.blue} strokeWidth={1.8} />
          <Text className="flex-1 font-sans text-[13px] text-pp-ink">{tournament.venue}</Text>
        </View>
        <View className="flex-row items-center gap-2.5">
          <CalendarDays size={16} color={PP.blue} strokeWidth={1.8} />
          <Text className="flex-1 font-sans text-[13px] text-pp-ink">{tournament.date}</Text>
        </View>
        {/* A time-of-day row sat here showing "9:00 AM – 5:00 PM" for every
            event; the backend records no such times. */}
        <View className="flex-row items-center justify-between gap-2.5 border-t border-pp-line pt-3">
          <View className="flex-row items-center gap-2">
            <CalendarClock size={15} color={PP.amber} strokeWidth={1.8} />
            <Text className="font-sans-bold text-[12.5px] text-pp-amber">{t("regCloses")}</Text>
          </View>
          <Text className="font-sans-bold text-[12.5px] text-pp-amber">
            {tournament.regDeadline}
          </Text>
        </View>
      </View>

      <View className="gap-2">
        <SectionLabel>{t("eventInfo")}</SectionLabel>
        <View className={`${CARD} flex-row flex-wrap`}>
          {(
            [
              [Layers, t("swiss"), ""],
              [Trophy, t("trophyMedal"), ""],
              [UserRound, t("openTo"), ""],
              [CircleDollarSign, t("entryFee"), tournament.fee],
            ] as const
          ).map(([Icon, text, strong], i) => (
            <View key={i} className="w-1/2 gap-1 pb-3.5 pr-3.5">
              <Icon size={18} color={PP.blue} strokeWidth={1.8} />
              <Text className="font-sans text-[12.5px] text-pp-ink">{text}</Text>
              {!!strong && (
                <Text className="font-sans-bold text-[12.5px] text-pp-ink">{strong}</Text>
              )}
            </View>
          ))}
        </View>
      </View>

      <View className="gap-2">
        <SectionLabel>{t("importantDates")}</SectionLabel>
        <View className={`${CARD} gap-2.5`}>
          <View className="flex-row items-center justify-between">
            <Text className="font-sans text-[12.5px] text-pp-muted">{t("regDeadline")}</Text>
            <Text className="font-sans-bold text-[12.5px] text-pp-ink">
              {tournament.regDeadline}
            </Text>
          </View>
          <View className="border-t border-pp-line" />
          <View className="flex-row items-center justify-between">
            <Text className="font-sans text-[12.5px] text-pp-muted">{t("tournamentDay")}</Text>
            <Text className="font-sans-bold text-[12.5px] text-pp-ink">{tournament.day}</Text>
          </View>
        </View>
      </View>

      {tournamentEntries.length > 0 && (
        <View className="gap-2">
          <SectionLabel>{t("yourEntries")}</SectionLabel>
          <View className={`${CARD} gap-3`}>
            {tournamentEntries.map((e, i) => (
              <View key={e.registrationId} className="gap-2.5">
                {i > 0 && <View className="border-t border-pp-line" />}
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="flex-1 font-sans-bold text-[13px] text-pp-ink">{e.name}</Text>
                  <View
                    className={`rounded-full px-2.5 py-1 ${
                      e.paid ? "bg-pp-green-soft" : "bg-pp-amber-soft"
                    }`}
                  >
                    <Text
                      style={{ color: e.paid ? PP.green : PP.amber }}
                      className="font-sans-bold text-[11px]"
                    >
                      {e.paid ? t("feePaid") : t("feeUnpaid")}
                    </Text>
                  </View>
                </View>
                {!e.paid && (
                  <Cta
                    label={submitting ? t("openingPayment") : t("payByCard")}
                    disabled={submitting}
                    onPress={async () => {
                      setSubmitting(true);
                      setPayFailed(false);
                      try {
                        const url = await payCardFee(e.registrationId);
                        if (url) await openCheckout(url);
                        else setPayFailed(true);
                      } catch {
                        setPayFailed(true);
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                  />
                )}
              </View>
            ))}
            {tournamentEntries.some((e) => !e.paid) && (
              <Text className="font-sans text-[11.5px] leading-relaxed text-pp-muted">
                {t("paidAtDeskNote")}
              </Text>
            )}
          </View>
          {payFailed && (
            <Text accessibilityRole="alert" className="font-sans-bold text-[12.5px] text-pp-danger">
              {t("payFailed")}
            </Text>
          )}
        </View>
      )}
      {available.length > 0 ? (
        <Cta
          label={tournamentEntries.length > 0 ? t("registerAnother") : t("registerMyChild")}
          onPress={() => {
            setChild(available[0].key);
            setStep("register");
          }}
        />
      ) : (
        <Text className="text-center font-sans text-[12.5px] text-pp-muted">
          {t("allChildrenEntered")}
        </Text>
      )}
    </ScrollView>
  );
}
