"use client";

import Image from "next/image";

import dynamic from "next/dynamic";
import { Check, ArrowUpRight, Leaf, MapPin } from "@/components/ui/icons";
import { useState } from "react";
import { useLocalState, isStringArray } from "@/hooks/useLocalState";
import { useExperience } from "@/components/ExperienceProvider";
import Reveal from "@/components/ui/Reveal";
import Dialog from "@/components/ui/Dialog";

const ThreeGarden = dynamic(() => import("@/components/ThreeGarden"), {
  ssr: false,
  loading: () => (
    <div className="garden-scene scene-loading">
      <Leaf size={50} weight="duotone" />
    </div>
  ),
});
const steps = ["Take your reusable cup", "Walk somewhere local", "Give a plant a little care"];

export default function GoalsPanel() {
  const [done, setDone] = useLocalState("varda.green-steps.v1", [] as string[], isStringArray);
  const [guide, setGuide] = useState(false);
  const { feedback, notify } = useExperience();
  return (
    <section className="living-grid grid grid-flow-dense grid-cols-1 lg:grid-cols-5">
      <Reveal className="green-goal lg:col-span-3">
        <div className="goal-copy">
          <span className="eyebrow">
            <Leaf size={15} />A little greener, together
          </span>
          <h2>
            Small steps.
            <br />A happier planet.
          </h2>
          <p>Your greener week starts with one little thing.</p>
          <div className="goal-progress">
            <span className="mono">
              {done.length}
              <small> / 3</small>
            </span>
            <span>little acts of good</span>
          </div>
          <progress aria-label="Your greener week progress" value={done.length} max={3} />
          <div className="green-steps">
            {steps.map((step) => (
              <button
                key={step}
                aria-pressed={done.includes(step)}
                onClick={() => {
                  setDone((current) =>
                    current.includes(step)
                      ? current.filter((item) => item !== step)
                      : [...current, step],
                  );
                  feedback("success");
                  if (!done.includes(step))
                    notify("One small step. A little good goes a long way.");
                }}
              >
                <span className="step-check">
                  {done.includes(step) && <Check size={12} weight="bold" />}
                </span>
                {step}
              </button>
            ))}
          </div>
        </div>
        <ThreeGarden />
      </Reveal>
      <Reveal className="local-card lg:col-span-2" delay={0.08}>
        <span className="eyebrow">
          <MapPin size={15} />
          Right around the corner
        </span>
        <h2>
          A little local.
          <br />A lot to love.
        </h2>
        <p>Good coffee, fresh finds, and the places that make this neighbourhood ours.</p>
        <div className="local-image">
          <Image
            unoptimized
            src="/images/garden.webp"
            alt="A leafy corner of a local garden"
            width={500}
            height={400}
            loading="lazy"
          />
        </div>
        <button
          className="local-discover"
          onClick={() => {
            setGuide(true);
            feedback();
          }}
        >
          <span>Meet your neighbourhood</span>
          <span className="round-arrow">
            <ArrowUpRight size={21} />
          </span>
        </button>
      </Reveal>
      {guide && (
        <Dialog title="A little local love" onClose={() => setGuide(false)}>
          <p className="dialog-intro">
            A few Cape Town favourites for your next little adventure. Check opening hours before
            you go.
          </p>
          <div className="local-list">
            {[
              {
                name: "Truth Coffee",
                detail: "A good cup and a familiar face.",
                query: "Truth Coffee Cape Town",
              },
              {
                name: "Oranjezicht City Farm Market",
                detail: "Fresh, seasonal, and made with care.",
                query: "Oranjezicht City Farm Market Cape Town",
              },
              {
                name: "Woodstock Exchange",
                detail: "Independent makers, art, and little discoveries.",
                query: "Woodstock Exchange Cape Town",
              },
            ].map((place) => (
              <a
                key={place.name}
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.query)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>
                  <strong>{place.name}</strong>
                  <small>{place.detail}</small>
                </span>
                <ArrowUpRight size={21} />
              </a>
            ))}
          </div>
        </Dialog>
      )}
    </section>
  );
}
