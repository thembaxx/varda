"use client";

import Image from "next/image";

import { motion } from "motion/react";
import { ArrowUpRight, BookmarkSimple, Clock, MapPin, Check } from "@/components/ui/icons";
import type { CommunityEvent } from "@/lib/community";
import { useExperience } from "@/components/ExperienceProvider";

export default function EventCard({
  event,
  saved,
  joined,
  onSave,
  onOpen,
}: {
  event: CommunityEvent;
  saved: boolean;
  joined: boolean;
  onSave: () => void;
  onOpen: () => void;
}) {
  const { feedback } = useExperience();
  return (
    <motion.article
      layout
      className={`event-card ${event.tone}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
    >
      <div className="event-image">
        <Image
          unoptimized
          src={event.image}
          alt={
            event.id === "shared-table"
              ? "Colourful dishes laid out for a shared meal"
              : event.id === "slow-morning"
                ? "Sunlight falling through leafy green plants"
                : "A warm, plant-filled community living room"
          }
          width={800}
          height={600}
          loading="lazy"
        />
        <span className="event-category">{event.category}</span>
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
          className="save-button"
          aria-label={saved ? `Unsave ${event.title}` : `Save ${event.title}`}
          aria-pressed={saved}
          onClick={() => {
            feedback();
            onSave();
          }}
        >
          <BookmarkSimple size={21} weight={saved ? "fill" : "regular"} />
        </motion.button>
      </div>
      <div className="event-content">
        <div className="event-time mono">
          <span>{event.date}</span>
          <span>
            <Clock size={13} />
            {event.time}
          </span>
        </div>
        <h3>
          <button onClick={onOpen}>{event.title}</button>
        </h3>
        <p className="event-location">
          <MapPin size={15} />
          {event.location}
        </p>
        <div className="event-bottom">
          <div className="attendee-group">
            <span className="avatar tiny coral">L</span>
            <span className="avatar tiny sage">J</span>
            <span className="avatar tiny yellow">A</span>
            <span className="attending-count mono">+{event.attending + (joined ? 1 : 0)}</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onOpen}
            className={`round-arrow ${joined ? "joined" : ""}`}
            aria-label={`View ${event.title}`}
          >
            {joined ? <Check size={19} /> : <ArrowUpRight size={19} />}
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
