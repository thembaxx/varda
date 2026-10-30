"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ArrowClockwise, FlowerTulip } from "@/components/ui/icons";
import { useExperience } from "@/components/ExperienceProvider";

/** A small, self-contained scene. The render loop sleeps outside the viewport. */
export default function ThreeGarden() {
  const mount = useRef<HTMLDivElement>(null);
  const impulse = useRef(0);
  const [available, setAvailable] = useState(true);
  const { feedback, reducedMotion } = useExperience();
  useEffect(() => {
    const container = mount.current;
    if (!container) return;
    const qualityMedia = window.matchMedia("(max-width: 760px), (pointer: coarse)");
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !qualityMedia.matches,
        powerPreference: "low-power",
      });
    } catch {
      const pending = window.setTimeout(() => setAvailable(false), 0);
      return () => window.clearTimeout(pending);
    }
    const updateQuality = () => {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, qualityMedia.matches ? 1 : 1.5));
    };
    updateQuality();
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
    camera.position.set(0, 0.2, 6.4);
    scene.add(new THREE.AmbientLight("#fff7de", 2.5));
    const light = new THREE.DirectionalLight("#fffbe5", 4);
    light.position.set(-3, 5, 4);
    scene.add(light);
    const group = new THREE.Group();
    group.rotation.z = -0.12;
    scene.add(group);
    const green = new THREE.MeshStandardMaterial({ color: "#29634d", roughness: 0.8 });
    const yellow = new THREE.MeshStandardMaterial({ color: "#f5d969", roughness: 0.65 });
    const pollen = new THREE.MeshStandardMaterial({ color: "#aa582f", roughness: 0.9 });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.07, 2.1, 12), green);
    stem.position.y = -0.7;
    group.add(stem);
    const leaves: THREE.Mesh[] = [];
    [-1, 1].forEach((side, index) => {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 16), green);
      leaf.scale.set(1, 0.38, 0.24);
      leaf.position.set(side * 0.3, -0.9 + index * 0.4, 0);
      leaf.rotation.z = side * 0.5;
      group.add(leaf);
      leaves.push(leaf);
    });
    const bloom = new THREE.Group();
    bloom.position.y = 0.45;
    group.add(bloom);
    const petals: THREE.Mesh[] = [];
    for (let index = 0; index < 8; index++) {
      const angle = (index / 8) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.37, 24, 16), yellow);
      petal.scale.set(0.75, 1.65, 0.36);
      petal.position.set(Math.sin(angle) * 0.48, Math.cos(angle) * 0.48, -0.05);
      petal.rotation.z = -angle;
      bloom.add(petal);
      petals.push(petal);
    }
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.27, 24, 20), pollen);
    center.scale.z = 0.45;
    center.position.z = 0.14;
    bloom.add(center);
    let frame = 0,
      visible = false,
      last = 0,
      rotation = 0,
      velocity = 0,
      scale = 1,
      scaleVelocity = 0;
    let pointerX = 0,
      pointerY = 0;
    function render(time: number) {
      if (!visible || document.hidden) {
        frame = 0;
        return;
      }
      const dt = Math.min((time - last) / 1000 || 0.016, 0.032);
      last = time;
      const target = reducedMotion ? 0 : pointerX * 0.3 + Math.sin(time * 0.00065) * 0.035;
      velocity += ((target - rotation) * 70 - velocity * 9) * dt;
      rotation += velocity * dt;
      if (impulse.current) {
        scaleVelocity += reducedMotion ? 0 : impulse.current;
        impulse.current = 0;
      }
      scaleVelocity += ((1 - scale) * 95 - scaleVelocity * 7) * dt;
      scale += scaleVelocity * dt;
      group.rotation.y = rotation;
      group.rotation.x = reducedMotion ? 0 : pointerY * 0.08;
      bloom.scale.setScalar(scale);
      leaves.forEach((leaf, index) => {
        leaf.rotation.y = reducedMotion ? 0 : Math.sin(time * 0.001 + index) * 0.1;
      });
      renderer.render(scene, camera);
      if (!reducedMotion) frame = requestAnimationFrame(render);
      else frame = 0;
    }
    function start() {
      if (!frame && visible && !document.hidden) {
        last = performance.now();
        frame = requestAnimationFrame(render);
      }
    }
    const observe = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible) start();
      else {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    observe.observe(container);
    const onQualityChange = () => {
      updateQuality();
      start();
    };
    qualityMedia.addEventListener("change", onQualityChange);
    const resize = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      start();
    });
    resize.observe(container);
    const move = (event: PointerEvent) => {
      const bounds = container.getBoundingClientRect();
      pointerX = (event.clientX - bounds.left) / bounds.width - 0.5;
      pointerY = (event.clientY - bounds.top) / bounds.height - 0.5;
    };
    const leave = () => {
      pointerX = 0;
      pointerY = 0;
    };
    container.addEventListener("pointermove", move);
    container.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", start);
    return () => {
      cancelAnimationFrame(frame);
      observe.disconnect();
      resize.disconnect();
      qualityMedia.removeEventListener("change", onQualityChange);
      document.removeEventListener("visibilitychange", start);
      container.removeEventListener("pointermove", move);
      container.removeEventListener("pointerleave", leave);
      scene.traverse((node) => {
        if (node instanceof THREE.Mesh) node.geometry.dispose();
      });
      [green, yellow, pollen].forEach((material) => material.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [reducedMotion]);
  return (
    <div className="garden-scene">
      <div ref={mount} className="garden-canvas" aria-hidden="true" />
      {!available && <FlowerTulip className="garden-fallback" size={110} weight="duotone" />}
      <button
        className="garden-play"
        aria-label="Give the flower a little bounce"
        onClick={() => {
          impulse.current = 4;
          feedback();
        }}
      >
        <ArrowClockwise size={16} />
        <span>A little joy</span>
      </button>
    </div>
  );
}
