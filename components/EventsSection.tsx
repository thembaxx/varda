"use client";

import Image from "next/image";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import {
  ArrowRight,
  CalendarBlank,
  Clock,
  MapPin,
  ShareNetwork,
  Check,
} from "@/components/ui/icons";
import { events, type CommunityEvent } from "@/lib/community";
import { useLocalState, isStringArray } from "@/hooks/useLocalState";
import { useExperience } from "@/components/ExperienceProvider";
import EventCard from "@/components/EventCard";
import Dialog from "@/components/ui/Dialog";
import Reveal from "@/components/ui/Reveal";

export default function EventsSection({ expanded = false }: { expanded?: boolean }) {
  const [filter, setFilter] = useState("This week");
  const [selected, setSelected] = useState<CommunityEvent | null>(null);
  const [saved, setSaved] = useLocalState("varda.saved-events.v1", [] as string[], isStringArray);
  const [joined, setJoined] = useLocalState(
    "varda.joined-events.v1",
    [] as string[],
    isStringArray,
  );
  const { feedback, notify, offline } = useExperience();
  const visible = events.filter((event) =>
    filter === "Today" ? event.today : filter === "Saved" ? saved.includes(event.id) : true,
  );

  async function share() {
    if (!selected) return;
    try {
      const data = {
        title: selected.title,
        text: `${selected.title} · ${selected.date} at ${selected.time}, ${selected.location}. Come along!`,
        url: `${location.origin}/#community`,
      };
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(`${data.text} ${data.url}`);
        notify("Invite copied. Good company starts here.");
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        notify("Sharing isn’t available here. You can copy the page address.");
    }
  }

  return (
    <section id="events" className="events-section">
      <Reveal className="section-heading">
        <div>
          <span className="eyebrow">Make a little time</span>
          <h2>{expanded ? "Find your kind of together." : "Something to look forward to."}</h2>
        </div>
        <a className="text-button" href="#community">
          Explore community
          <ArrowRight size={17} />
        </a>
      </Reveal>
      <div className="filter-row" aria-label="Filter events">
        {["Today", "This week", "Saved"].map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => {
              setFilter(value);
              feedback();
            }}
          >
            {value}
            {value === "Saved" && saved.length > 0 && <span className="mono">{saved.length}</span>}
          </button>
        ))}
        <span className="filter-caption">
          <span className="status-dot" />A place for everyone
        </span>
      </div>
      <div className="events-grid grid grid-flow-dense grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {visible.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              saved={saved.includes(event.id)}
              joined={joined.includes(event.id)}
              onSave={() => {
                setSaved((current) =>
                  current.includes(event.id)
                    ? current.filter((id) => id !== event.id)
                    : [...current, event.id],
                );
                notify(
                  saved.includes(event.id)
                    ? "Event removed from your saved plans."
                    : "A good plan, saved for later.",
                );
              }}
              onOpen={() => {
                setSelected(event);
                feedback();
              }}
            />
          ))}
        </AnimatePresence>
      </div>
      {visible.length === 0 && (
        <div className="empty-state">
          <CalendarBlank size={36} weight="duotone" />
          <h3>Your next good plan starts here.</h3>
          <p>Tap the bookmark on an event to save it for later.</p>
          <button className="button button-green" onClick={() => setFilter("This week")}>
            Find something lovely
            <ArrowRight size={17} />
          </button>
        </div>
      )}
      {selected && (
        <Dialog title={selected.title} onClose={() => setSelected(null)}>
          <Image
            unoptimized
            className="dialog-photo"
            src={selected.image}
            alt="A little glimpse of your next community gathering"
            width={800}
            height={520}
          />
          <div className="event-detail-meta">
            <span>
              <CalendarBlank size={17} />
              {selected.date}
            </span>
            <span className="mono">
              <Clock size={17} />
              {selected.time}
            </span>
            <span>
              <MapPin size={17} />
              {selected.location}
            </span>
          </div>
          <p className="dialog-intro">{selected.description}</p>
          <p className="form-note">
            This is your personal plan on this device.
            {offline ? " It’s available offline." : " Invite a neighbour to come along."}
          </p>
          <div className="dialog-actions">
            <button
              className="button button-green"
              onClick={() => {
                const attending = joined.includes(selected.id);
                setJoined((current) =>
                  attending
                    ? current.filter((id) => id !== selected.id)
                    : [...current, selected.id],
                );
                feedback("success");
                notify(
                  attending
                    ? "Removed from your plans."
                    : "You’re on your own list. See you there!",
                );
              }}
            >
              {joined.includes(selected.id) ? (
                <>
                  <Check size={18} />
                  In my plans · undo
                </>
              ) : (
                <>
                  Add to my plans
                  <ArrowRight size={18} />
                </>
              )}
            </button>
            <button className="icon-button share-button" aria-label="Share event" onClick={share}>
              <ShareNetwork size={21} />
            </button>
          </div>
        </Dialog>
      )}
    </section>
  );
}
