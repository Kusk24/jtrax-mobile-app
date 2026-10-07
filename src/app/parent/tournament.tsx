/**
 * Registering a child for the academy's next tournament, and paying the fee.
 *
 * Four stages, as in the portal: the event, the entry, the payment, and what
 * came of it. The entry is the web's: the child's ID card is read for the
 * date of birth, which decides the category; the player's nickname and Thai
 * name; and the conditions of entry, accepted. The family's contact details
 * come from their record on the server, so they are not asked for again.
 *
 * The card option opens Stripe Checkout in the system browser; PromptPay and
 * bank transfer are taken at the front desk, and Pay later holds the place for
 * the fee to be paid by card here or at the desk — each says so rather than
 * pretending money moved.
 */
import { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import {
  CalendarClock, CalendarDays, Check, ChevronRight, FileText, MapPin,
} from "lucide-react-native";
import { useParentData } from "@/components/parent/ParentData";
import { TournamentIdCheck, type IdCardRead } from "@/components/parent/TournamentIdCheck";
import { TournamentBanner } from "@/components/parent/TournamentBanner";
import { BackHeader } from "@/components/parent/BackHeader";
import { usePalette } from "@/components/ThemeProvider";
import { API_BASE, api, getAuthToken } from "@/lib/api";
import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { ageFromDOB, categoryAllows, type PublicCategory } from "@/lib/registration";
import { heldBodyKey, payCtaKey, type PayChoice } from "@/lib/pay-choice";

/* "done" is a fee that has been settled; "held" is a place taken with the fee
   still owed — the screen used to show the first for both, and for the card
   path it showed it without charging anything at all.

   Each stage's scroll view has its own key, so moving between stages mounts
   a fresh tree. Without it React reused one stage's views for the next, and
   NativeWind cannot restyle a view that way after its first render: it
   remounts it, and in development its warning about doing so crashed the
   payment stage outright. */
type Step = "detail" | "register" | "payment" | "done" | "held";

const CARD = "rounded-card bg-pp-card p-4 shadow-clay";

/* The public form's conditions of entry, by message key. */
const TERMS = ["termsRegistration", "termsRefund", "termsChanges", "termsConduct", "termsLiability"] as const;

function longDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

/* A link the event offers — the regulation, the venue on a map. The uploaded
   regulation is the API's own file, which wants the session's token for an
   event that is not public. A token does not belong in a URL (it would sit in
   the browser's history), so that file is downloaded with the token in the
   header and handed to the share sheet, whose preview opens a PDF. Anything
   else — a pasted link, a map — opens as it is. */
async function openLink(url: string) {
  const token = getAuthToken();
  if (!url.startsWith(API_BASE)) {
    await Linking.openURL(url);
    return;
  }
  const file = await File.downloadFileAsync(url, new Directory(Paths.cache), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    idempotent: true,
  });
  await Sharing.shareAsync(file.uri);
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="font-pp-bold text-[11.5px] uppercase tracking-[1.6px] text-pp-sub">
      {children}
    </Text>
  );
}

function Radio({ selected }: { selected: boolean }) {
  const { pp } = usePalette();
  return (
    <View
      style={{ borderColor: selected ? pp.blue : pp.line }}
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
      <Text className="text-center font-pp-bold text-sm text-white">{label}</Text>
    </Pressable>
  );
}

export default function TournamentFlow() {
  const { pp } = usePalette();
  const t = useTranslations("pv2");
  const tReg = useTranslations("register");
  const router = useRouter();
  const {
    children: childList, tournament, tournamentEntries, register, payCardFee,
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
  const [pay, setPay] = useState<PayChoice>("card");
  /* What the public form asks too. The family's contact details are on
     file, so they are not asked for again. */
  const [nickname, setNickname] = useState("");
  const [nameTh, setNameTh] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  /* The ID card step: what the card said, for the child it was read for,
     and the category that birth year allows. */
  const [idRead, setIdRead] = useState<IdCardRead | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const tournamentId = tournament?.id ?? "";
  useEffect(() => {
    if (!tournamentId) return;
    let live = true;
    api
      .get<Record<string, string>[]>("tournament-categories")
      .then((rows) => {
        if (!live) return;
        setCategories(
          rows
            .filter((r) => r.tournament_id === tournamentId)
            .map((r) => ({ id: r.tournament_category_id, name: r.name })),
        );
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [tournamentId]);

  const participant = childList.find((c) => c.key === child) ?? childList[0];
  const verified = idRead && idRead.studentId === participant?.id ? idRead : null;
  const chosenCategory = categories.find((c) => c.id === categoryId);
  const categoryOk =
    categories.length === 0 ||
    Boolean(chosenCategory && verified && categoryAllows(chosenCategory.name, verified.dateOfBirth, tournament?.startDate ?? "").allowed);
  /* What is still needed, in the order the form asks for it. */
  const missing = !verified
    ? t("verifyIdFirst")
    : !categoryOk
      ? t("chooseCategoryFirst")
      : !nickname.trim()
        ? tReg("needNickname")
        : !acceptTerms
          ? tReg("needTerms")
          : "";
  /* A child with a place cannot be registered again — the second attempt is
     refused by a unique index, which is what a family who had a card declined
     used to hit. They get the fee button instead. */
  const entered = new Set(tournamentEntries.map((e) => e.studentId));
  const available = childList.filter((c) => !entered.has(c.key));
  const input =
    "rounded-[13px] border-[1.5px] border-pp-line bg-pp-card px-3.5 py-3 font-pp text-[13px] text-pp-ink";

  /* No event open — nothing to register for. Home only links here while a
     tournament exists, but a deep link can always arrive. */
  if (!tournament || !participant) {
    return (
      <ScrollView className="flex-1 bg-pp-bg" contentContainerClassName="gap-4 px-4 pb-10 pt-4">
        <BackHeader title={t("tournamentTitle")} onBack={() => router.replace("/parent")} />
        <View className="rounded-card border-[1.5px] border-dashed border-pp-dash p-6">
          <Text className="text-center font-pp text-[12.5px] text-pp-muted">
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
            ? <Check size={30} color={pp.green} strokeWidth={2} />
            : <CalendarClock size={30} color={pp.amber} strokeWidth={2} />}
        </View>
        <Text className="text-center font-pp-display-semibold text-[22px] text-pp-ink">
          {settled ? t("regConfirmed") : t("placeHeld")}
        </Text>
        <Text className="text-center font-pp text-[13.5px] leading-relaxed text-pp-sub">
          {settled
            ? t("regConfirmedBody", { name: participant.name, event: tournament.name })
            : t(heldBodyKey(pay), {
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
          <Text className="font-pp-bold text-sm text-white">{t("done")}</Text>
        </Pressable>
      </View>
    );
  }

  if (step === "register") {
    return (
      <ScrollView
        key="register"
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
                onPress={() => {
                  setChild(c.key);
                  /* The card and the category belong to the child they were for. */
                  if (c.key !== child) {
                    setIdRead(null);
                    setCategoryId("");
                  }
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: child === c.key }}
                style={{ borderColor: child === c.key ? pp.blue : pp.line }}
                className="flex-row items-center gap-3 rounded-card border-[1.5px] bg-pp-card p-4"
              >
                <Radio selected={child === c.key} />
                <View>
                  <Text className="font-pp-bold text-sm text-pp-ink">{c.name}</Text>
                  <Text className="font-pp text-[11.5px] text-pp-muted">{c.clsTitle}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <TournamentIdCheck
          tournamentId={tournament.id}
          studentId={participant.id}
          startDate={tournament.startDate}
          categories={categories}
          read={verified}
          onRead={(r) => {
            setIdRead(r);
            /* The Thai name off the card, unless one was typed. */
            if (r?.thaiName && !nameTh) setNameTh(r.thaiName);
          }}
          categoryId={categoryId}
          onCategory={setCategoryId}
        >
          {/* The player's names, before the category. A passport prints no
              Thai name, so the field is left out after one is read. */}
          {(!verified || verified.documentType !== "passport") && (
            <View className="gap-1.5">
              <SectionLabel>{tReg("nameThai")}</SectionLabel>
              <TextInput
                value={nameTh}
                onChangeText={setNameTh}
                maxLength={80}
                placeholder={tReg("nameThaiPlaceholder")}
                placeholderTextColor={pp.faint}
                accessibilityLabel={tReg("nameThai")}
                className={input}
              />
            </View>
          )}
          <View className="gap-1.5">
            <Text className="font-pp-bold text-[11.5px] uppercase tracking-[1.6px] text-pp-sub">
              {tReg("nickname")}
              <Text className="text-pp-danger"> *</Text>
            </Text>
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              maxLength={80}
              placeholder={tReg("nicknamePlaceholder")}
              placeholderTextColor={pp.faint}
              accessibilityLabel={tReg("nickname")}
              className={input}
            />
          </View>
          {/* Read off the ID card, not typed: it decides the category. */}
          <View className="flex-row gap-3">
            <View className="min-w-0 flex-1 gap-1.5">
              <SectionLabel>{tReg("dateOfBirth")}</SectionLabel>
              <Text className={`${input} bg-pp-panel ${verified ? "" : "text-pp-faint"}`}>
                {verified ? longDate(verified.dateOfBirth) : tReg("dobFromCard")}
              </Text>
            </View>
            <View className="w-24 gap-1.5">
              <SectionLabel>{tReg("age")}</SectionLabel>
              <Text className={`${input} bg-pp-panel ${verified ? "" : "text-pp-faint"}`}>
                {verified ? String(ageFromDOB(verified.dateOfBirth)) : "—"}
              </Text>
            </View>
          </View>
        </TournamentIdCheck>

        <View className="gap-2">
          <SectionLabel>{tReg("termsTitle")}</SectionLabel>
          <View className="gap-2.5 rounded-card border-[1.5px] border-pp-line bg-pp-card p-4">
            {TERMS.map((k, i) => (
              <Text key={k} className="font-pp text-[12.5px] leading-relaxed text-pp-sub">
                {i + 1}. <Text className="font-pp-semibold text-pp-ink">{tReg(`${k}Title`)}</Text> — {tReg(`${k}Body`)}
              </Text>
            ))}
            <Pressable
              onPress={() => setAcceptTerms((v) => !v)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: acceptTerms }}
              className="flex-row items-start gap-2.5 border-t border-pp-line pt-3"
            >
              <View
                style={{ borderColor: acceptTerms ? pp.blue : pp.faint, backgroundColor: acceptTerms ? pp.blue : "transparent" }}
                className="mt-0.5 size-[18px] items-center justify-center rounded-[5px] border-[1.5px]"
              >
                {acceptTerms && <Check size={12} color="#ffffff" strokeWidth={3} />}
              </View>
              <Text className="flex-1 font-pp-semibold text-[13px] text-pp-ink">
                {tReg("termsAccept")}
                <Text className="text-pp-danger"> *</Text>
              </Text>
            </Pressable>
          </View>
        </View>

        {missing !== "" && <Text className="text-center font-pp text-[12px] text-pp-muted">{missing}</Text>}

        <Cta label={t("continuePayment")} disabled={missing !== ""} onPress={() => setStep("payment")} />
      </ScrollView>
    );
  }

  if (step === "payment") {
    return (
      <ScrollView
        key="payment"
        className="flex-1 bg-pp-bg"
        contentContainerClassName="gap-4 px-4 pb-10 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <BackHeader title={t("payment")} onBack={() => setStep("register")} />

        <View className={`${CARD} gap-3.5`}>
          <View className="gap-0.5">
            <Text className="font-pp-bold text-[10.5px] uppercase tracking-[1.2px] text-pp-faint">
              {t("tournamentTitle")}
            </Text>
            <Text className="font-pp-bold text-sm text-pp-ink">{tournament.name}</Text>
          </View>
          <View className="border-t border-pp-line" />
          <View className="gap-0.5">
            <Text className="font-pp-bold text-[10.5px] uppercase tracking-[1.2px] text-pp-faint">
              {t("participant")}
            </Text>
            <Text className="font-pp-bold text-sm text-pp-ink">{participant.name}</Text>
          </View>
          {chosenCategory && (
            <>
              <View className="border-t border-pp-line" />
              <View className="gap-0.5">
                <Text className="font-pp-bold text-[10.5px] uppercase tracking-[1.2px] text-pp-faint">
                  {t("category")}
                </Text>
                <Text className="font-pp-bold text-sm text-pp-ink">{chosenCategory.name}</Text>
              </View>
            </>
          )}
          <View className="border-t border-pp-line" />
          <View className="flex-row items-center justify-between">
            <Text className="font-pp text-[12.5px] text-pp-muted">{t("tournamentFee")}</Text>
            <Text className="font-pp-bold text-[13px] text-pp-ink">{tournament.fee}</Text>
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
                ["later", t("payLater")],
              ] as const
            ).map(([k, lbl]) => (
              <Pressable
                key={k}
                onPress={() => setPay(k)}
                accessibilityRole="radio"
                accessibilityState={{ selected: pay === k }}
                style={{ borderColor: pay === k ? pp.blue : pp.line }}
                className="flex-row items-center gap-3 rounded-card border-[1.5px] bg-pp-card px-4 py-3.5"
              >
                <Radio selected={pay === k} />
                <View className="flex-1">
                  <Text className="font-pp-bold text-[13.5px] text-pp-ink">{lbl}</Text>
                  {k === "later" && <Text className="font-pp text-[12px] text-pp-muted">{t("payLaterHint")}</Text>}
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View className={`${CARD} flex-row items-center justify-between`}>
          <Text className="font-pp-bold text-[13px] text-pp-ink">{t("total")}</Text>
          <Text className="font-pp-display-semibold text-[19px] text-pp-blue">{tournament.fee}</Text>
        </View>

        {registerFailed && (
          <Text accessibilityRole="alert" className="font-pp-bold text-[12.5px] text-pp-danger">
            {t("registerFailed")}
          </Text>
        )}

        {payFailed && (
          <Text accessibilityRole="alert" className="font-pp-bold text-[12.5px] text-pp-danger">
            {t("payFailed")}
          </Text>
        )}

        <Cta
          label={t(payCtaKey(pay, submitting))}
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
                idCheck: verified?.checkId ?? "",
                categoryId,
                nickname: nickname.trim(),
                nameTh: nameTh.trim(),
                acceptTerms,
              });
            } catch {
              setRegisterFailed(true);
              setSubmitting(false);
              return;
            }
            /* The place exists from here on, whatever happens to the money.
               PromptPay and bank transfer are taken at the front desk, and Pay
               later leaves the fee for later, so choosing any of them means
               exactly that and nothing is charged — which is what the screen
               now says instead of claiming a payment went through. */
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
      key="detail"
      className="flex-1 bg-pp-bg"
      contentContainerClassName="gap-4 px-4 pb-10 pt-4"
      showsVerticalScrollIndicator={false}
    >
      <BackHeader title={t("tournamentTitle")} onBack={() => router.replace("/parent")} />
      <TournamentBanner
        name={tournament.name}
        when={tournament.date}
        venue={tournament.venue}
        tournamentId={tournament.id}
        hasBanner={tournament.hasBanner}
        height={200}
        rounded={20}
      />
      <Text className="font-pp-display-semibold text-xl leading-snug text-pp-ink">
        {tournament.name}
      </Text>

      <View className={`${CARD} gap-3`}>
        <View className="flex-row items-center gap-2.5">
          <MapPin size={16} color={pp.blue} strokeWidth={1.8} />
          <Text className="flex-1 font-pp text-[13px] text-pp-ink">{tournament.venue}</Text>
        </View>
        <View className="flex-row items-center gap-2.5">
          <CalendarDays size={16} color={pp.blue} strokeWidth={1.8} />
          <Text className="flex-1 font-pp text-[13px] text-pp-ink">{tournament.date}</Text>
        </View>
        {/* A time-of-day row sat here showing "9:00 AM – 5:00 PM" for every
            event; the backend records no such times. */}
        <View className="flex-row items-center justify-between gap-2.5 border-t border-pp-line pt-3">
          <View className="flex-row items-center gap-2">
            <CalendarClock size={15} color={pp.amber} strokeWidth={1.8} />
            <Text className="font-pp-bold text-[12.5px] text-pp-amber">{t("regCloses")}</Text>
          </View>
          <Text className="font-pp-bold text-[12.5px] text-pp-amber">
            {tournament.regDeadline}
          </Text>
        </View>
      </View>

      <View className="gap-2">
        <SectionLabel>{t("importantDates")}</SectionLabel>
        <View className={`${CARD} gap-2.5`}>
          <View className="flex-row items-center justify-between">
            <Text className="font-pp text-[12.5px] text-pp-muted">{t("regDeadline")}</Text>
            <Text className="font-pp-bold text-[12.5px] text-pp-ink">
              {tournament.regDeadline}
            </Text>
          </View>
          <View className="border-t border-pp-line" />
          <View className="flex-row items-center justify-between">
            <Text className="font-pp text-[12.5px] text-pp-muted">{t("tournamentDay")}</Text>
            <Text className="font-pp-bold text-[12.5px] text-pp-ink">{tournament.day}</Text>
          </View>
        </View>
      </View>

      {/* Only what there is to open: the regulation the organiser uploaded
          (or linked), and the venue on a map. A row with nothing behind it is
          left out rather than drawn as a link that goes nowhere. */}
      {(tournament.regulationUrl || tournament.mapUrl) && (
        <View className="gap-2">
          <SectionLabel>{t("viewDetailsOn")}</SectionLabel>
          <View className="overflow-hidden rounded-card bg-pp-card shadow-clay">
            {(
              [
                [tournament.regulationUrl, FileText, t("regulationsPdf")],
                [tournament.mapUrl, MapPin, t("venueMap")],
              ] as const
            )
              .filter(([url]) => url)
              .map(([url, Icon, text], i) => (
                <Pressable
                  key={text}
                  onPress={() => void openLink(url).catch(() => {})}
                  accessibilityRole="link"
                  className={`flex-row items-center gap-3 px-4 py-3.5 active:bg-pp-soft ${i > 0 ? "border-t border-pp-line" : ""}`}
                >
                  <Icon size={17} color={pp.blue} strokeWidth={1.8} />
                  <Text className="flex-1 font-pp text-[13px] text-pp-ink">{text}</Text>
                  <ChevronRight size={16} color={pp.muted} />
                </Pressable>
              ))}
          </View>
        </View>
      )}

      {tournamentEntries.length > 0 && (
        <View className="gap-2">
          <SectionLabel>{t("yourEntries")}</SectionLabel>
          <View className={`${CARD} gap-3`}>
            {tournamentEntries.map((e, i) => (
              <View key={e.registrationId} className="gap-2.5">
                {i > 0 && <View className="border-t border-pp-line" />}
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="flex-1 font-pp-bold text-[13px] text-pp-ink">{e.name}</Text>
                  <View
                    className={`rounded-full px-2.5 py-1 ${
                      e.paid ? "bg-pp-green-soft" : "bg-pp-amber-soft"
                    }`}
                  >
                    <Text
                      style={{ color: e.paid ? pp.green : pp.amber }}
                      className="font-pp-bold text-[11px]"
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
              <Text className="font-pp text-[11.5px] leading-relaxed text-pp-muted">
                {t("paidAtDeskNote")}
              </Text>
            )}
          </View>
          {payFailed && (
            <Text accessibilityRole="alert" className="font-pp-bold text-[12.5px] text-pp-danger">
              {t("payFailed")}
            </Text>
          )}
        </View>
      )}
      {tournament.registration !== "open" ? (
        /* Closed by the academy or past its closing date: the server would
           refuse the entry, so there is no button to start one. */
        <View accessibilityRole="summary" className="rounded-card bg-pp-panel px-4 py-3">
          <Text className="text-center font-pp-semibold text-[13px] text-pp-sub">
            {tournament.registration === "closed" ? t("registrationClosed") : t("registrationDeadlinePassed")}
          </Text>
        </View>
      ) : available.length > 0 ? (
        <Cta
          label={tournamentEntries.length > 0 ? t("registerAnother") : t("registerMyChild")}
          onPress={() => {
            setChild(available[0].key);
            setStep("register");
          }}
        />
      ) : (
        <Text className="text-center font-pp text-[12.5px] text-pp-muted">
          {t("allChildrenEntered")}
        </Text>
      )}
    </ScrollView>
  );
}
