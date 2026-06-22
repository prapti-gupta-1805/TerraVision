import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Globe } from "../components/ui/globe";
import BeforeAfterSlider from "../components/BeforeAfterSlider";
import { generateImageWithDetails } from "../services/geminiService";
import { EncryptedText } from "../components/ui/encrypted-text";

const Landing: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [beforeImage, setBeforeImage] = useState<string>("");
  const [afterImage, setAfterImage] = useState<string>("");
  const [analysis, setAnalysis] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [toggles, setToggles] = useState({
    trees: true,
    solarPanels: false,
    greenRoofs: true,
    gardens: true,
    bikeInfra: false,
    vegetation: false,
  });

  const handleToggle = (key: string) => {
    setToggles((prev) => ({ ...prev, [key]: !(prev as any)[key] }));
  };

  const buildPrompt = (): string => {
    const interventions: string[] = [];
    if (toggles.trees) interventions.push("add lush green trees throughout");
    if (toggles.solarPanels) interventions.push("add solar panels on roofs");
    if (toggles.greenRoofs)
      interventions.push("add green roofs with vegetation");
    if (toggles.gardens)
      interventions.push("add community gardens and green spaces");
    if (toggles.bikeInfra)
      interventions.push("add bike lanes and cycling infrastructure");
    if (toggles.vegetation)
      interventions.push("add dense vegetation and plants");

    const basePrompt =
      interventions.length > 0
        ? `Transform this urban scene into a sustainable solarpunk city by: ${interventions.join(", ")}. Make it look professional, photorealistic, and vibrant.`
        : "Transform this urban scene into a sustainable solarpunk city with greenery, renewable energy, and eco-friendly infrastructure. Make it look professional and photorealistic.";

    return basePrompt;
  };

  const generateTransformation = async (file: File) => {
    try {
      setError("");
      setIsGenerating(true);

      const prompt = buildPrompt();
      const response = await generateImageWithDetails(file, prompt);

      if (response.success) {
        setAfterImage(response.generated_image_url);
        setAnalysis(response.analysis);
        setShowResult(true);
      } else {
        setError(`Generation failed: ${response.error || "Unknown error"}`);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate image.",
      );
      console.error("Error generating image:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadedFile(file);
      setShowResult(false);

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setBeforeImage(result);
      };
      reader.readAsDataURL(file);

      await generateTransformation(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process image.");
      console.error("Error processing file:", err);
    }
  };

  const handleRegenerate = () => {
    if (uploadedFile) {
      generateTransformation(uploadedFile);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background-light dark:bg-background-dark text-text-main font-display">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-12 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
              <div className="flex flex-col justify-center text-left">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-6">
                  <span className="material-symbols-outlined text-[16px]">
                    wb_sunny
                  </span>
                  <span>Future-Ready Urban Planning</span>
                </div>
                {/* <h1 className="text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl mb-6">
                  Design the Cities of{" "}
                  <span className="text-primary">Tomorrow</span>, Today
                </h1> */}
                <div className="text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl mb-6">
                  <p className="text-left">
                    Design the Cities of{" "}
                    <EncryptedText className="text-primary"
                      text="A Better Tomorrow"
                    />
                  </p>
                </div>
                <p className="text-lg  text-text-muted mb-8 max-w-xl leading-relaxed">
                  Visualize the future of urban living. Plan, design, and
                  measure sustainability improvements in real-time with our
                  Solarpunk-inspired toolkit.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    to="/map"
                    className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-bold text-[#0d1b10] shadow-lg shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <span>Explore the Map</span>
                    <span className="material-symbols-outlined">map</span>
                  </Link>
                  <button className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#cfe7d3] dark:border-[#2a4d31] bg-white/50 dark:bg-surface-dark/50 px-8 text-base font-bold text-text-main dark:text-text-main backdrop-blur-sm hover:bg-white/80 dark:hover:bg-surface-dark/80 transition-all duration-200">
                    <span className="material-symbols-outlined">
                      play_circle
                    </span>
                    <span>Watch Demo</span>
                  </button>
                </div>
                <div className="mt-10 flex items-center gap-4 text-sm text-text-muted">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="size-8 rounded-full border-2 border-background-light dark:border-surface-dark bg-gray-200 dark:bg-gray-700 bg-cover bg-center"
                        style={{
                          backgroundImage: `url('https://picsum.photos/32/32?random=${i}')`,
                        }}
                      />
                    ))}
                  </div>
                  <p>
                    Used by{" "}
                    <span className="font-bold text-text-main">2,000+</span>{" "}
                    urban planners
                  </p>
                </div>
              </div>

              {/* Hero Image / Composition */}
              <div className="relative lg:h-auto">
                <div className="absolute -top-10 -right-10 size-64 rounded-full bg-primary/20 blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-10 -left-10 size-64 rounded-full bg-blue-400/20 dark:bg-blue-900/20 blur-3xl pointer-events-none"></div>
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-2xl border border-white/20 dark:border-white/10 group">
                  <Globe />
                  {/* <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{
                      backgroundImage:
                        "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDFXXaLvynFtAcb_csL9JOj1zrRBRj50XA4fN3Jg0wZKckh6aWYabDFg_pZUocA4BM2NVF9pOmC1QKAUx_5GWAn-I6aqrpqkJIaRcdn57nNWgleL2TqiBZjQc2kX6upoYbkoYS8WupX5-tSebZwNIMU9LlU_5DzAFwZvx_ooUdAiGdpLbCqKu2Is50hmyw-p_SAC9ZfnBqGU-2_GTmhe7ZTWvuRXFIu2alXFORUh3c611ubzZJccnhwyGjFdcYEpcOIOnwyMryGtA')",
                    }}
                  /> */}
                  {/* Floating Card */}
                  {/* <div className="absolute bottom-6 left-6 right-6 rounded-xl bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md p-4 border border-white/20 dark:border-white/10 shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="flex size-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                          Live Simulation
                        </span>
                      </div>
                      <span className="text-xs font-medium text-text-main">
                        Neo-Kyoto District
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <p className="text-xs text-text-muted">Air Quality</p>
                        <p className="text-lg font-bold text-primary">98 AQI</p>
                      </div>
                      <div className="flex-1 border-l border-gray-200 dark:border-gray-700 pl-4">
                        <p className="text-xs text-text-muted">Green Cover</p>
                        <p className="text-lg font-bold text-primary">+24%</p>
                      </div>
                      <div className="flex-1 border-l border-gray-200 dark:border-gray-700 pl-4">
                        <p className="text-xs text-text-muted">Energy</p>
                        <p className="text-lg font-bold text-primary">
                          Net Zero
                        </p>
                      </div>
                    </div>
                  </div> */}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Metrics */}
        <section className="py-12 bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="rounded-lg bg-[var(--color-surface-light)] dark:bg-[var(--color-surface-dark)] p-6 border border-[var(--color-border-light)]">
                <div className="text-2xl font-extrabold text-primary">
                  2,000+
                </div>
                <div className="text-sm text-text-muted mt-1">
                  Urban planners
                </div>
              </div>
              <div className="rounded-lg bg-[var(--color-surface-light)] dark:bg-[var(--color-surface-dark)] p-6 border border-[var(--color-border-light)]">
                <div className="text-2xl font-extrabold text-primary">150K</div>
                <div className="text-sm text-text-muted mt-1">
                  Buildings modeled
                </div>
              </div>
              <div className="rounded-lg bg-[var(--color-surface-light)] dark:bg-[var(--color-surface-dark)] p-6 border border-[var(--color-border-light)]">
                <div className="text-2xl font-extrabold text-primary">24%</div>
                <div className="text-sm text-text-muted mt-1">
                  Avg. green cover gain
                </div>
              </div>
              <div className="rounded-lg bg-[var(--color-surface-light)] dark:bg-[var(--color-surface-dark)] p-6 border border-[var(--color-border-light)]">
                <div className="text-2xl font-extrabold text-primary">
                  98 AQI
                </div>
                <div className="text-sm text-text-muted mt-1">
                  Sample project air quality
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials / Case Studies */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight mb-4 sm:text-4xl text-text-main">
                What planners are saying
              </h2>
              <p className="text-lg text-text-muted">
                Real-world results from districts using TerraVision.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="p-6 rounded-xl bg-[var(--color-surface-light)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border-light)]">
                <p className="text-text-muted text-sm">
                  "TerraVision helped us visualize a 30% increase in green cover
                  across the pilot corridor — stakeholders could finally see the
                  impact."
                </p>
                <div className="mt-4 font-semibold text-text-main">
                  — Dr. Meera Kapoor, Urban Design Lead
                </div>
              </div>
              <div className="p-6 rounded-xl bg-[var(--color-surface-light)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border-light)]">
                <p className="text-text-muted text-sm">
                  "AI renders made community consultations productive and fast.
                  We shortened approval cycles by months."
                </p>
                <div className="mt-4 font-semibold text-text-main">
                  — Ajay Singh, Municipal Planner
                </div>
              </div>
              <div className="p-6 rounded-xl bg-[var(--color-surface-light)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border-light)]">
                <p className="text-text-muted text-sm">
                  "The impact dashboard gave us confidence to scale the program
                  city-wide."
                </p>
                <div className="mt-4 font-semibold text-text-main">
                  — Lina Rodriguez, Sustainability Director
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 bg-primary/5 dark:bg-primary/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-4 bg-[var(--color-surface-light)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border-light)]">
              <div>
                <h3 className="text-xl font-bold text-text-main">
                  Ready to plan sustainably at scale?
                </h3>
                <p className="text-text-muted">
                  Start a project, invite collaborators, and measure real
                  impact.
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  to="/map"
                  className="rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground"
                >
                  Get Started
                </Link>
                <Link
                  to="/signup"
                  className="rounded-xl border border-[var(--color-border-light)] px-6 py-3 font-semibold"
                >
                  Request Demo
                </Link>
              </div>
            </div>
          </div>
        </section>
        {/* Features Section */}
        <section className="py-16 sm:py-24 bg-white dark:bg-surface-dark">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4 sm:text-4xl text-text-main">
                Powerful Planning Tools
              </h2>
              <p className="text-lg text-text-muted">
                Everything you need to visualize, analyze, and implement
                sustainable urban solutions.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <Link
                to="/map"
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#e7f3e9] dark:border-[#2a4d31] bg-background-light dark:bg-background-dark p-8 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
              >
                <div className="mb-6 inline-flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-[#0d1b10] transition-colors">
                  <span className="material-symbols-outlined text-3xl">
                    map
                  </span>
                </div>
                <h3 className="mb-3 text-xl font-bold text-text-main">
                  Interactive Map
                </h3>
                <p className="text-base leading-relaxed text-text-muted">
                  Navigate real-world terrain with overlaid sustainability
                  zones. Import GIS data and visualize zoning changes instantly.
                </p>
                <div className="mt-auto pt-6 flex items-center gap-1 text-sm font-bold text-primary group-hover:underline">
                  Start Mapping{" "}
                  <span className="material-symbols-outlined text-sm">
                    arrow_forward
                  </span>
                </div>
              </Link>
              {/* Feature 2 */}
              <Link
                to="/transform"
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#e7f3e9] dark:border-[#2a4d31] bg-background-light dark:bg-background-dark p-8 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
              >
                <div className="mb-6 inline-flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-[#0d1b10] transition-colors">
                  <span className="material-symbols-outlined text-3xl">
                    auto_fix_high
                  </span>
                </div>
                <h3 className="mb-3 text-xl font-bold text-text-main">
                  AI-Powered Before/After
                </h3>
                <p className="text-base leading-relaxed text-text-muted">
                  Generate photorealistic renders of green infrastructure
                  instantly. See how a parking lot transforms into a park.
                </p>
                <div className="mt-auto pt-6 flex items-center gap-1 text-sm font-bold text-primary group-hover:underline">
                  Try AI Render{" "}
                  <span className="material-symbols-outlined text-sm">
                    arrow_forward
                  </span>
                </div>
              </Link>
              {/* Feature 3 */}
              <Link
                to="/dashboard"
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#e7f3e9] dark:border-[#2a4d31] bg-background-light dark:bg-background-dark p-8 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
              >
                <div className="mb-6 inline-flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-[#0d1b10] transition-colors">
                  <span className="material-symbols-outlined text-3xl">
                    monitoring
                  </span>
                </div>
                <h3 className="mb-3 text-xl font-bold text-text-main">
                  Impact Dashboard
                </h3>
                <p className="text-base leading-relaxed text-text-muted">
                  Track carbon reduction, air quality improvements, and energy
                  savings with real-time analytics.
                </p>
                <div className="mt-auto pt-6 flex items-center gap-1 text-sm font-bold text-primary group-hover:underline">
                  View Analytics{" "}
                  <span className="material-symbols-outlined text-sm">
                    arrow_forward
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* AI Transformation Section */}
        <section className="py-16 sm:py-24 bg-gradient-to-b from-background-light to-white dark:from-background-dark dark:to-surface-dark">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight mb-4 sm:text-4xl text-text-main">
                Transform Your City with AI
              </h2>
              <p className="text-lg text-text-muted">
                Upload an image of any urban area and watch it transform into a
                sustainable solarpunk paradise
              </p>
            </div>

            {!showResult ? (
              <div className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-surface-dark rounded-2xl border-2 border-dashed border-primary/30 p-12 text-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />

                  {!beforeImage ? (
                    <div>
                      <span className="material-symbols-outlined text-6xl text-primary mb-4 block">
                        cloud_upload
                      </span>
                      <h3 className="text-xl font-bold text-text-main mb-2">
                        Upload Your Image
                      </h3>
                      <p className="text-text-muted mb-6">
                        Drop an image of any street or urban area to transform
                      </p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-[#0d1b10] font-bold rounded-xl hover:bg-primary/90 transition-colors"
                      >
                        <span className="material-symbols-outlined">
                          add_photo_alternate
                        </span>
                        Choose Image
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-6">
                        <img
                          src={beforeImage}
                          alt="Uploaded"
                          className="max-h-96 mx-auto rounded-lg shadow-lg"
                        />
                      </div>

                      {/* Toggles */}
                      <div className="bg-background-light dark:bg-background-dark rounded-xl p-6 mb-6">
                        <h4 className="text-lg font-bold text-text-main mb-4">
                          Select Transformations
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {[
                            { key: "trees", label: "Add Trees", icon: "park" },
                            {
                              key: "solarPanels",
                              label: "Solar Panels",
                              icon: "solar_power",
                            },
                            {
                              key: "greenRoofs",
                              label: "Green Roofs",
                              icon: "roofing",
                            },
                            {
                              key: "gardens",
                              label: "Community Gardens",
                              icon: "yard",
                            },
                            {
                              key: "bikeInfra",
                              label: "Bike Infrastructure",
                              icon: "pedal_bike",
                            },
                            {
                              key: "vegetation",
                              label: "Dense Vegetation",
                              icon: "forest",
                            },
                          ].map(({ key, label, icon }) => (
                            <button
                              key={key}
                              onClick={() => handleToggle(key)}
                              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                                (toggles as any)[key]
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-gray-200 dark:border-gray-700 text-text-muted hover:border-primary/50"
                              }`}
                            >
                              <span className="material-symbols-outlined text-2xl">
                                {icon}
                              </span>
                              <span className="text-sm font-semibold">
                                {label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {isGenerating && (
                        <div className="flex items-center justify-center gap-3 text-primary">
                          <div className="animate-spin size-6 border-4 border-primary/30 border-t-primary rounded-full"></div>
                          <span className="font-semibold">
                            Generating your sustainable future...
                          </span>
                        </div>
                      )}

                      {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                          <p className="text-red-600 dark:text-red-400">
                            {error}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="max-w-6xl mx-auto">
                <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-2xl">
                  <BeforeAfterSlider
                    beforeImage={beforeImage}
                    afterImage={afterImage}
                  />

                  {analysis && (
                    <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-lg font-bold text-text-main mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">
                          auto_awesome
                        </span>
                        AI Analysis
                      </h4>
                      <p className="text-text-muted leading-relaxed">
                        {analysis}
                      </p>
                    </div>
                  )}

                  <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 justify-center">
                    <button
                      onClick={handleRegenerate}
                      disabled={isGenerating}
                      className="flex items-center gap-2 px-6 py-3 bg-primary text-[#0d1b10] font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined">refresh</span>
                      Regenerate
                    </button>
                    <button
                      onClick={() => {
                        setShowResult(false);
                        setBeforeImage("");
                        setAfterImage("");
                        setUploadedFile(null);
                        setError("");
                      }}
                      className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-surface-dark border-2 border-gray-200 dark:border-gray-700 text-text-main font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span className="material-symbols-outlined">upload</span>
                      Upload New Image
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <footer className="bg-background-light dark:bg-surface-dark border-t border-[#e7f3e9] dark:border-[#2a4d31] py-10">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-text-muted">
          © 2024 Sustainable City Planner. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Landing;
