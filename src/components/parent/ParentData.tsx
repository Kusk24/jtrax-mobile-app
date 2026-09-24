/**
 * Live data for the parent portal, on the phone.
 *
 * The joins are the portal's, moved across unchanged — the two apps show one
 * family the same way or they do not agree about it. What differs is the I/O:
 * there is no same-origin proxy here, so every read goes through `lib/api`
 * with the bearer token the session holds.
 *
 * There is no mock fallback. The portal either shows what the academy has on
 * file or says the server is unreachable; sample children rendered as if they
 * were real is how a parent stops trusting the real ones.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, ApiError } from "@/lib/api";
import { useSession } from "@/lib/session";
import {
  CERT_SESSIONS, recentMonths, streakFrom, todayISO,
  type AnnouncementV2, type ChildKey, type ChildV2, type HistRow, type MonthDef,
  type InboxNotif, NOTIF_DEFAULTS, type NotifType, type SenderKind,
  type TournamentEntryV2, type TournamentV2,
} from "@/lib/parent-v2-data";
import { classesAttended } from "@/lib/classes-attended";
import { money } from "@/lib/money";

type Row = Record<string, unknown>;
const s = (r: Row, k: string) => (r[k] as string | null) ?? "";
const n = (r: Row, k: string) => Number(r[k] ?? 0);

const get = (path: string) => api.get<Row[]>(path);

function fmtDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? iso
    : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

/** Two decimal places with trailing zeros dropped — an hour of class costs an
    hour of credit, so balances are fractional and full of floating-point dust. */
const roundCredits = (v: number) => Math.round(v * 100) / 100;

function ageOf(dobISO: string, now: Date): number {
  if (!dobISO) return 0;
  const dob = new Date(dobISO);
  if (isNaN(dob.getTime())) return 0;
  let a = now.getFullYear() - dob.getFullYear();
  if (now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate())) a--;
  return Math.max(0, a);
}

type Prefs = Record<NotifType, boolean>;
type Status = "loading" | "live" | "error";

type ParentDataValue = {
  children: ChildV2[];
  parent: { name: string; phone: string; email: string };
  announcements: AnnouncementV2[];
  /** The backend inbox, newest first — the server already respected the
      parent's preferences when it sent (or did not send) each one. */
  notifs: InboxNotif[];
  unreadNotifs: number;
  isNotifRead: (id: string) => boolean;
  markNotifRead: (id: string) => void;
  markAllNotifsRead: () => void;
  isAnnRead: (id: string) => boolean;
  markAnnRead: (id: string) => void;
  tournament: TournamentV2 | null;
  /** The family's existing entries in that tournament, so the screen can offer
      to settle a fee instead of re-registering a child who already has a
      place — the second attempt fails on a unique index, which used to be the
      only way back after a card was declined. */
  tournamentEntries: TournamentEntryV2[];
  months: MonthDef[];
  att: Record<ChildKey, Record<number, { present: number[]; absent: number[] }>>;
  hist: HistRow[];
  todayActivity: { child: string; mins: number; done: boolean }[];
  /** Classes attended before a certificate is awarded — the academy's own
      figure from system_configuration, or the 50 default until it saves one. */
  certSessions: number;
  prefs: Prefs;
  parentId: string;
  savePref: (type: NotifType, enabled: boolean) => Promise<void>;
  /** Signs a child up and answers with the new registration's id, which is
      what `payCardFee` needs to collect the entry fee. */
  register: (input: {
    tournamentId: string; studentId: string; contact: string;
    medicalNotes: string; remarks: string;
  }) => Promise<string>;
  /** Opens (or reopens) the card checkout for a registration's entry fee and
      answers with the URL to send the parent to, or `null` when the academy
      has no card payments configured — in which case the place is still held
      and the desk takes the money. */
  payCardFee: (registrationId: string) => Promise<string | null>;
};

const ParentDataContext = createContext<ParentDataValue | null>(null);

/* Announcement read marks are local: announcements have no per-reader row in
   the backend. AsyncStorage rather than the Keychain — a read mark is not a
   credential, and SecureStore has a value-size limit this would eventually
   hit. Notification read marks are the server's (`read_at` on the inbox row). */
const readKey = (parentId: string) => `jtrax:parent:${parentId}:anns-read`;

async function loadAnnRead(parentId: string): Promise<Set<string>> {
  try {
    return new Set(JSON.parse((await AsyncStorage.getItem(readKey(parentId))) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

function storeAnnRead(parentId: string, ids: Set<string>) {
  AsyncStorage.setItem(readKey(parentId), JSON.stringify([...ids])).catch(() => {
    /* out of space, or a locked store — marks last for the session only */
  });
}

export function ParentDataProvider({ children: kids }: { children: ReactNode }) {
  const t = useTranslations("pv2");
  const { user } = useSession();
  const [status, setStatus] = useState<Status>("loading");
  const [childList, setChildList] = useState<ChildV2[]>([]);
  const [parent, setParent] = useState({ name: "", phone: "", email: "" });
  const [anns, setAnns] = useState<AnnouncementV2[]>([]);
  const [allNotifs, setAllNotifs] = useState<InboxNotif[]>([]);
  const [tour, setTour] = useState<TournamentV2 | null>(null);
  const [entries, setEntries] = useState<TournamentEntryV2[]>([]);
  const [months] = useState<MonthDef[]>(() => recentMonths());
  const [att, setAtt] = useState<ParentDataValue["att"]>({});
  const [hist, setHist] = useState<HistRow[]>([]);
  const [todayActivity, setTodayActivity] = useState<ParentDataValue["todayActivity"]>([]);
  const [certSessions, setCertSessions] = useState(CERT_SESSIONS);
  const [prefs, setPrefs] = useState<Prefs>(NOTIF_DEFAULTS);
  const [parentId, setParentId] = useState("");
  const [annRead, setAnnRead] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const [students, enrollments, classes, txs, teachers, attendance, sessions,
      announcements, tournaments, activities, parents, contacts, regs, payments,
      config] = await Promise.all([
      get("students"), get("enrollments"), get("classes"), get("credit-transactions"),
      get("teachers"), get("attendance"), get("class-sessions"),
      get("announcements"), get("tournaments"), get("practice-activities"),
      get("parents"), get("parent-contacts"),
      get("tournament-registrations"), get("payments"),
      /* Tolerant: a backend deployed before system-configuration was readable
         by parents answers 403, and the milestone has a default — that must
         not read as the whole server being down. */
      get("system-configuration").catch(() => [] as Row[]),
    ]);
    if (!user?.parentId) throw new Error("not a parent session");
    const pid = user.parentId;
    setParentId(pid);

    /* The academy's certificate milestone, or the default until it saves one. */
    const certRaw = Number(s(
      config.find((r) => s(r, "config_key") === "certificate_sessions") ?? {},
      "config_value",
    ));
    setCertSessions(Number.isFinite(certRaw) && certRaw > 0 ? certRaw : CERT_SESSIONS);
    setAnnRead(await loadAnnRead(pid));

    /* Who is signed in — the greeting, the nav, the profile screen and the
       registration prefill all read this instead of a sample name. */
    const own = parents.find((p) => s(p, "parent_id") === pid);
    const contact = (type: string) =>
      s(contacts.find((c) => s(c, "contact_type") === type) ?? {}, "value");
    setParent({
      name: own ? s(own, "name") : user.displayName ?? "",
      phone: contact("phone"),
      email: contact("email") || (own ? s(own, "email") : ""),
    });

    const today = new Date();
    const todayStr = todayISO(today);
    const sessionIds = new Set(sessions.map((x) => s(x, "session_id")));

    const mapped: ChildV2[] = students.map((st, i) => {
      const sid = s(st, "student_id");
      const enr = enrollments.find((e) => s(e, "student_id") === sid && (s(e, "status") || "Active") === "Active")
        ?? enrollments.find((e) => s(e, "student_id") === sid);
      const cls = enr ? classes.find((c) => s(c, "class_id") === s(enr, "class_id")) : undefined;
      const myTx = enr ? txs.filter((x) => s(x, "enrollment_id") === s(enr, "enrollment_id")) : [];
      const credits = roundCredits(myTx.reduce((sum, x) => sum + n(x, "amount"), 0));
      const bought = roundCredits(myTx.filter((x) => n(x, "amount") > 0).reduce((sum, x) => sum + n(x, "amount"), 0));
      const expiry = myTx.filter((x) => s(x, "expiry_date")).map((x) => s(x, "expiry_date")).sort().at(-1) ?? "";
      const daysRaw = expiry
        ? Math.ceil((new Date(expiry).getTime() - today.getTime()) / 86400_000)
        : 0;
      const daysLeft = Math.max(0, daysRaw);

      const attended = classesAttended(attendance.filter((a) => s(a, "student_id") === sid), sessionIds);
      const acts = activities.filter((a) => s(a, "student_id") === sid);
      const week = Array.from({ length: 7 }, (_, d) => {
        const day = todayISO(new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 - d)));
        return n(acts.find((a) => s(a, "activity_date") === day) ?? {}, "minutes_practiced");
      });
      return {
        key: sid as ChildKey,
        name: s(st, "name"),
        id: sid,
        level: s(st, "current_level"),
        age: ageOf(s(st, "date_of_birth"), today),
        /* No bundled photograph on the phone. The portal carries two for the
           seed children; shipping a child's face inside an app binary is a
           different thing from serving it, so everyone gets the tinted
           circle and their initial. */
        photo: "",
        avBg: i % 2 ? "#cfd9f0" : "#b4c5e4",
        clsTitle: cls ? s(cls, "name") : "—",
        enrolledSince: enr ? fmtDate(s(enr, "enrolled_date")) : "",
        credits,
        creditsBought: bought,
        valid: fmtDate(expiry),
        daysLeft,
        expiresAhead: daysRaw >= 0,
        attended,
        /* Counted from the days actually practised, by the same rule as the
           backend's `currentStreak`. `student.streak_count` is a number
           nothing recomputes, so a child who stopped in May still showed
           twelve days. */
        streak: streakFrom(acts.map((a) => s(a, "activity_date")), today),
        practiceWeek: week,
      };
    });
    setChildList(mapped);

    /* Attendance dots for the three calendar months. */
    const nextAtt: ParentDataValue["att"] = {};
    for (const child of mapped) {
      const per: Record<number, { present: number[]; absent: number[] }> = {};
      months.forEach((m, mi) => {
        const present: number[] = [];
        const absent: number[] = [];
        for (const a of attendance) {
          if (s(a, "student_id") !== child.id) continue;
          const ses = sessions.find((x) => s(x, "session_id") === s(a, "session_id"));
          if (!ses) continue;
          const d = new Date(s(ses, "session_date"));
          if (d.getFullYear() !== m.year || d.getMonth() !== m.month) continue;
          (s(a, "check_in_time") ? present : absent).push(d.getDate());
        }
        per[mi] = { present, absent };
      });
      nextAtt[child.key as ChildKey] = per;
    }
    setAtt(nextAtt);

    /* History rows: attendance joined to sessions, newest first. */
    const rows: HistRow[] = attendance
      .map((a) => {
        const ses = sessions.find((x) => s(x, "session_id") === s(a, "session_id"));
        const child = mapped.find((c) => c.id === s(a, "student_id"));
        if (!ses || !child) return null;
        const sesCls = classes.find((c) => s(c, "class_id") === s(ses, "class_id"));
        return {
          date: fmtDate(s(ses, "session_date")),
          iso: s(ses, "session_date"),
          child: child.key as ChildKey,
          status: (s(a, "check_in_time") ? "Present" : "Absent") as HistRow["status"],
          time: `${s(ses, "start_time")} – ${s(ses, "end_time")}`,
          /* The session's own class. Printing the child's current class here
             relabelled every old row the day they moved. */
          cls: sesCls ? s(sesCls, "name") : "—",
        };
      })
      .filter((r): r is HistRow => r !== null)
      .sort((a, b) => b.iso.localeCompare(a.iso));
    setHist(rows);

    /* The real inbox: what the backend actually sent this account, read marks
       included. */
    const inboxRows = await api
      .get<{ notifications?: Row[] }>("notifications")
      .then((r) => r.notifications ?? [])
      .catch(() => [] as Row[]);
    setAllNotifs(inboxRows.map((row) => {
      /* Deep link from the payload: a child event lands on that child, an
         announcement on the announcements screen, anything else stays here. */
      let href = "/parent/notifications";
      try {
        const data = JSON.parse(s(row, "data") || "{}") as { studentId?: string };
        const child = data.studentId ? mapped.find((c) => c.id === data.studentId) : undefined;
        if (child) href = `/parent/child/${child.key}`;
      } catch { /* unparseable payload: the row still shows, it just goes nowhere */ }
      if (s(row, "type") === "announcement") href = "/parent/announcements";
      return {
        id: s(row, "notification_id"),
        type: s(row, "type"),
        title: s(row, "title"),
        body: s(row, "body"),
        at: s(row, "created_at"),
        read: s(row, "read_at") !== "",
        href,
      };
    }));

    setAnns(announcements
      .sort((a, b) => s(b, "posted_at").localeCompare(s(a, "posted_at")))
      .map((a) => {
        const author = teachers.find((x) => s(x, "user_account_id") === s(a, "author_user_account_id"));
        const sender: SenderKind = author ? "teacher" : "admin";
        return {
          id: s(a, "announcement_id"),
          sender,
          senderName: author ? s(author, "name") : "JCA Head Office",
          title: s(a, "title"),
          msg: s(a, "body"),
          child: null,
          cls: null,
          attachment: n(a, "has_attachment") === 1,
          time: fmtDate(s(a, "posted_at")),
        };
      }));

    /* The next tournament, or nothing. The card only exists when an event
       does — the mock used to keep advertising Wellington 2026 forever. */
    const trn = tournaments.find((x) => s(x, "tournament_status") === "Upcoming");
    if (trn) {
      const deadline = s(trn, "registration_deadline");
      setTour({
        id: s(trn, "tournament_id"),
        name: s(trn, "name"),
        venue: s(trn, "venue_name"),
        date: fmtDate(s(trn, "start_date")),
        regDeadline: fmtDate(deadline),
        day: fmtDate(s(trn, "start_date")),
        /* What this family's child is charged, worked out by the server from
           the tournament's own pricing — the regular fee is only the
           fallback for a backend that does not send it yet. */
        fee: money("student_fee" in trn ? n(trn, "student_fee") : n(trn, "regular_fee")),
        closesInDays: deadline
          ? Math.max(0, Math.ceil((new Date(deadline).getTime() - today.getTime()) / 86400_000))
          : 0,
      });
      /* Which of this family's children already have a place, and whether the
         fee behind each has settled. Both lists arrive scoped to the family by
         the server, so nothing here needs to filter by parent — only by which
         tournament is being shown. */
      const tid = s(trn, "tournament_id");
      setEntries(regs
        .filter((r) => s(r, "tournament_id") === tid && s(r, "status") !== "Rejected")
        .map((r) => {
          const rid = s(r, "tournament_registration_id");
          const pay = payments.find((p) => s(p, "tournament_registration_id") === rid);
          return {
            registrationId: rid,
            studentId: s(r, "student_id"),
            name: s(r, "participant_name"),
            status: s(r, "status"),
            paid: s(pay ?? {}, "status") === "Paid",
          };
        }));
    } else {
      setTour(null);
      setEntries([]);
    }

    setTodayActivity(mapped.map((c) => {
      const mins = n(
        activities.find((a) => s(a, "student_id") === c.id && s(a, "activity_date") === todayStr) ?? {},
        "minutes_practiced",
      );
      return { child: c.name, mins, done: mins >= 30 };
    }));

    /* The per-type toggles: the backend stores only overrides, so start from
       the defaults and lay the saved choices over them. The in-app channel is
       the master switch for a type. */
    const saved = await api
      .get<{ settings?: Row[] }>("notification-settings")
      .then((r) => (r.settings ?? []).filter((row) => s(row, "channel") === "inapp"))
      .catch(() => [] as Row[]);
    const next = { ...NOTIF_DEFAULTS };
    for (const row of saved) {
      const typ = s(row, "type") as NotifType;
      if (typ in next) next[typ] = Boolean(row.enabled);
    }
    setPrefs(next);
    setStatus("live");
  }, [months, user]);

  useEffect(() => {
    load().catch(() => setStatus("error"));
  }, [load]);

  const retry = useCallback(() => {
    setStatus("loading");
    load().catch(() => setStatus("error"));
  }, [load]);

  const savePref = useCallback(async (type: NotifType, enabled: boolean) => {
    /* Optimistic: the switch answers the finger; a failed save is put back by
       the caller's catch. In-app is the type's master switch server-side. */
    setPrefs((prev) => ({ ...prev, [type]: enabled }));
    try {
      await api.put("notification-settings", { type, channel: "inapp", enabled });
    } catch (e) {
      setPrefs((prev) => ({ ...prev, [type]: !enabled }));
      throw e;
    }
  }, []);

  const register = useCallback(async (input: {
    tournamentId: string; studentId: string; contact: string;
    medicalNotes: string; remarks: string;
  }) => {
    /* No name, fee or status: the server takes the name from the academy's
       records and the price from the tournament. This used to send the fee,
       and the card payment charged whatever it said. */
    const row = await api.post<Row>(`tournaments/${input.tournamentId}/entries`, {
      student_id: input.studentId,
      participant_contact: input.contact,
      medical_notes: input.medicalNotes,
      remarks: input.remarks,
    });
    return s(row, "tournament_registration_id");
  }, []);

  /* The place comes first and the money second, on purpose: a declined card,
     a browser closed mid-payment or a family who decide to pay at the desk
     must not cost the child their entry. So this is a separate call, made
     after the registration exists, and a failure here leaves it standing. */
  const payCardFee = useCallback(async (registrationId: string) => {
    try {
      const res = await api.post<{ url?: string }>(
        `tournament-registrations/${registrationId}/stripe-link`);
      return res.url ?? null;
    } catch (e) {
      // 503 is the academy not having switched card payments on. That is a
      // supported state, not an error to show a parent: they pay at the desk.
      if (e instanceof ApiError && e.status === 503) return null;
      throw e;
    }
  }, []);

  const markNotifRead = useCallback((id: string) => {
    /* Optimistic, and fire-and-forget: a read mark that fails to save costs a
       bold dot on the next visit, nothing more. */
    setAllNotifs((prev) => prev.map((x) => (x.id === id ? { ...x, read: true } : x)));
    api.post(`notifications/${id}/read`).catch(() => {});
  }, []);

  const markAnnRead = useCallback((id: string) => {
    setAnnRead((prev) => {
      const next = new Set(prev).add(id);
      storeAnnRead(parentId, next);
      return next;
    });
  }, [parentId]);

  const value = useMemo<ParentDataValue>(() => ({
    children: childList, parent, announcements: anns,
    /* Unfiltered on purpose: the server applied the preferences when it sent.
       Filtering again here would hide history the moment a toggle changed. */
    notifs: allNotifs,
    unreadNotifs: allNotifs.filter((x) => !x.read).length,
    isNotifRead: (id) => allNotifs.find((x) => x.id === id)?.read ?? true,
    markNotifRead,
    markAllNotifsRead: () => {
      setAllNotifs((prev) => prev.map((x) => ({ ...x, read: true })));
      api.post("notifications/read-all").catch(() => {});
    },
    isAnnRead: (id) => annRead.has(id),
    markAnnRead,
    tournament: tour, tournamentEntries: entries, months, att, hist, todayActivity, certSessions,
    prefs, parentId, savePref, register, payCardFee,
  }), [childList, parent, anns, allNotifs, annRead, markNotifRead, markAnnRead,
    tour, entries, months, att, hist, todayActivity, certSessions, prefs, parentId, savePref,
    register, payCardFee]);

  /* No screen renders until the data is real. The old behaviour — sample
     children whenever the server was down — looked exactly like working
     software, which is the worst kind of broken. */
  if (status === "loading") {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-paper">
        <ActivityIndicator color="#4e5f7b" />
        <Text className="font-sans-bold text-[13.5px] text-muted">{t("loading")}</Text>
      </View>
    );
  }
  if (status === "error") {
    return (
      <View className="flex-1 items-center justify-center bg-paper px-5">
        <View className="w-full max-w-[380px] items-center gap-3 rounded-card border-[1.5px] border-line bg-card p-6">
          <Text className="text-center font-sans-extrabold text-lg text-ink">{t("serverDownTitle")}</Text>
          <Text className="text-center font-sans text-xs leading-relaxed text-muted">{t("serverDownBody")}</Text>
          <Pressable
            onPress={retry}
            accessibilityRole="button"
            className="mt-1 rounded-card bg-navy px-6 py-2.5"
          >
            <Text className="font-sans-bold text-sm text-white">{t("retry")}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return <ParentDataContext.Provider value={value}>{kids}</ParentDataContext.Provider>;
}

export function useParentData(): ParentDataValue {
  const ctx = useContext(ParentDataContext);
  if (!ctx) throw new Error("useParentData must be used inside <ParentDataProvider>");
  return ctx;
}
