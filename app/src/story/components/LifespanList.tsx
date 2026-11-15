/**
 * Platform lifespans as plain text, for "Sources & notes" (the on-screen timeline is gone). Launch dates come from
 * the real satellites.json; end dates come from lifecycle.json and are unverified [verify]. Every date carries its claim.
 */
import { formatDate } from "../../globe/format";
import { nameKey, PLATFORM_IDS } from "../../globe/platforms";
import { useI18n } from "../../i18n";
import { useLaunchDates } from "../data/adapters";
import { LIFECYCLE } from "../data/handover";
import { useStoryText } from "../strings";
import { Claimed } from "./Claimed";

const lifecycle = LIFECYCLE.platforms as Record<string, { end?: string; firmsStart?: string; claim?: string }>;

export function LifespanList() {
  const { t, lang } = useI18n();
  const s = useStoryText();
  const launches = useLaunchDates();
  const launch = launches.status === "ok" ? launches.data : {};
  return (
    <>
      <h4>{s("timeline.title")}</h4>
      <ul className="story-notes-list">
        {PLATFORM_IDS.map((id) => {
          const lc = lifecycle[id] ?? {};
          return (
            <li key={id}>
              <strong>{t(nameKey(id))}</strong>
              {launch[id] ? (
                <>
                  {" · "}
                  <Claimed id="S-C10">{formatDate(launch[id], lang)}</Claimed>
                </>
              ) : launches.status !== "loading" ? (
                <> · {s("timeline.no_launch")}</>
              ) : null}
              {lc.end && lc.claim && (
                <>
                  {" → "}
                  <Claimed id={lc.claim}>{lc.end}</Claimed>
                </>
              )}
              {lc.firmsStart && lc.claim && (
                <>
                  {" · "}
                  {s("timeline.lit")} <Claimed id={lc.claim}>{lc.firmsStart}</Claimed>
                </>
              )}
            </li>
          );
        })}
      </ul>
      <p>{s("timeline.verify")}</p>
    </>
  );
}
