"use client";

import { motion } from "motion/react";
import { useExperience } from "@/components/ExperienceProvider";

export default function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { reducedMotion } = useExperience();
  return (
    <motion.div
      className={className}
      initial={reducedMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.55, delay, type: "tween", ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
