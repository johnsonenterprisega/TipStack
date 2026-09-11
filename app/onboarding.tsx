import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../src/theme';

export const ONBOARDING_SURVEY_KEY = '@tipstack_onboarding_survey';

const TOTAL_STEPS = 10;

interface SurveyState {
  hustle: string;
  shiftsPerWeek: string;
  moneyGoal: string;
  knowsHourly: string;
  weeklyTarget: number;
  planChoice: 'yearly' | 'monthly' | 'free';
}

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [survey, setSurvey] = useState<SurveyState>({
    hustle: 'Bar & Nightlife',
    shiftsPerWeek: 'Full-Time Grinder (5–6 shifts)',
    moneyGoal: 'Living Expenses & Peace of Mind',
    knowsHourly: 'I have a ballpark estimate',
    weeklyTarget: 800,
    planChoice: 'yearly',
  });

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.selectionAsync();
      } catch {}
    }
  };

  const saveAndAdvance = async (nextStep: number, updatedSurvey: SurveyState) => {
    setSurvey(updatedSurvey);
    try {
      await AsyncStorage.setItem(ONBOARDING_SURVEY_KEY, JSON.stringify(updatedSurvey));
    } catch {}

    triggerHaptic();

    setTimeout(() => {
      setStep(nextStep);
    }, 200);
  };

  const handleBack = () => {
    if (step > 1) {
      triggerHaptic();
      setStep(step - 1);
    }
  };

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_SURVEY_KEY, JSON.stringify(survey));
    } catch {}
    router.replace('/(auth)/signup');
  };

  const progressPercent = Math.min((step / TOTAL_STEPS) * 100, 100);
  const estimatedAnnualTips = Math.round(survey.weeklyTarget * 52);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <View style={styles.backSlot}>
          {step > 1 ? (
            <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 32 }} />
          )}
        </View>

        {/* Dynamic Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>

        {/* Step Indicator */}
        <Text style={styles.stepCounter}>{step}/{TOTAL_STEPS}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── STEP 1: WELCOME & EMPOWERMENT HOOK ────────────────────────── */}
        {step === 1 && (
          <View style={styles.stepWrapper}>
            <View style={styles.welcomeHero}>
              <Image
                source={require('../assets/logo.png')}
                style={styles.logoImg}
                resizeMode="contain"
              />
              <Text style={styles.brandTitle}>TipStack</Text>
              <Text style={styles.brandTagline}>EARN IT. TRACK IT. STACK IT.</Text>
            </View>

            <View style={styles.welcomeCard}>
              <Text style={styles.welcomeHeadline}>Stop guessing what you took home.</Text>
              <Text style={styles.welcomeDesc}>
                Tips are fast cash, but without tracking your true take-home after tip-outs, wages, and taxes,
                it's easy to wonder where the money went. TipStack gives you institutional clarity on your hustle.
              </Text>

              <View style={styles.welcomePillRow}>
                <View style={styles.welcomePill}>
                  <Text style={styles.welcomePillText}>⚡ Instant Shift Logging</Text>
                </View>
                <View style={styles.welcomePill}>
                  <Text style={styles.welcomePillText}>📊 True $/Hr Matrix</Text>
                </View>
                <View style={styles.welcomePill}>
                  <Text style={styles.welcomePillText}>🔒 256-Bit Bank-Grade Privacy</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.mainCtaBtn}
              onPress={() => setStep(2)}
              activeOpacity={0.88}
            >
              <Text style={styles.mainCtaBtnText}>Calibrate My Income Profile  →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── STEP 2: WHERE DO YOU MAKE YOUR MONEY? ─────────────────────── */}
        {step === 2 && (
          <View style={styles.stepWrapper}>
            <Text style={styles.questionTitle}>Where do you make your money?</Text>
            <Text style={styles.questionSubtitle}>We tailor industry tip-out norms and hourly benchmarks to your craft.</Text>

            <View style={styles.optionsList}>
              {[
                { label: 'Restaurant Dining', sub: 'Server, Food Runner, Host', emoji: '🍽️' },
                { label: 'Bar & Nightlife', sub: 'Bartender, Barback, Mixologist', emoji: '🍸' },
                { label: 'Café & Counter', sub: 'Barista, Fast-Casual Counter', emoji: '☕' },
                { label: 'Gig & Delivery', sub: 'Rideshare, DoorDash, Courier', emoji: '🚗' },
                { label: 'Stylist & Personal Care', sub: 'Hair, Nails, Tattoo, Massage', emoji: '✂️' },
                { label: 'Hospitality & Other', sub: 'Valet, Bellhop, Golf, Gaming', emoji: '💼' },
              ].map((item) => {
                const isSelected = survey.hustle === item.label;
                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      styles.optionCard,
                      isSelected && styles.optionCardSelected,
                    ]}
                    onPress={() => saveAndAdvance(3, { ...survey, hustle: item.label })}
                    activeOpacity={0.8}
                  >
                    <View style={styles.optionLeft}>
                      <Text style={styles.optionEmoji}>{item.emoji}</Text>
                      <View>
                        <Text style={styles.optionLabel}>{item.label}</Text>
                        <Text style={styles.optionSubLabel}>{item.sub}</Text>
                      </View>
                    </View>
                    {isSelected && (
                      <View style={styles.checkCircle}>
                        <Text style={styles.checkMark}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ─── STEP 3: WHAT DOES YOUR WEEKLY RHYTHM LOOK LIKE? ──────────── */}
        {step === 3 && (
          <View style={styles.stepWrapper}>
            <Text style={styles.questionTitle}>What does your weekly grind look like?</Text>
            <Text style={styles.questionSubtitle}>How many shifts do you typically work per week?</Text>

            <View style={styles.optionsList}>
              {[
                { label: 'Weekend Hustler', sub: '1–2 shifts · Supplemental side cash', emoji: '🌱' },
                { label: 'Balanced Part-Time', sub: '3–4 shifts · Reliable weekly rhythm', emoji: '⚡' },
                { label: 'Full-Time Pro', sub: '5–6 shifts · Your primary career income', emoji: '🔥' },
                { label: 'Iron Grinder', sub: '7+ shifts · Double shifts & maximum velocity', emoji: '🦾' },
              ].map((item) => {
                const isSelected = survey.shiftsPerWeek.startsWith(item.label);
                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      styles.optionCard,
                      isSelected && styles.optionCardSelected,
                    ]}
                    onPress={() => saveAndAdvance(4, { ...survey, shiftsPerWeek: `${item.label} (${item.sub.split('·')[0].trim()})` })}
                    activeOpacity={0.8}
                  >
                    <View style={styles.optionLeft}>
                      <Text style={styles.optionEmoji}>{item.emoji}</Text>
                      <View>
                        <Text style={styles.optionLabel}>{item.label}</Text>
                        <Text style={styles.optionSubLabel}>{item.sub}</Text>
                      </View>
                    </View>
                    {isSelected && (
                      <View style={styles.checkCircle}>
                        <Text style={styles.checkMark}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ─── STEP 4: WHAT ARE YOU STACKING FOR? ────────────────────────── */}
        {step === 4 && (
          <View style={styles.stepWrapper}>
            <Text style={styles.questionTitle}>What are you stacking your tips for?</Text>
            <Text style={styles.questionSubtitle}>Your mission powers your momentum on tough shifts.</Text>

            <View style={styles.optionsList}>
              {[
                { label: 'Living Expenses & Peace of Mind', sub: 'Cover rent, bills & never stress the 1st of the month', emoji: '🏡' },
                { label: 'A Major Life Milestone', sub: 'Down payment, new car, dream trip, or starting a business', emoji: '🎯' },
                { label: 'Total Debt Elimination', sub: 'Crushing credit cards, car notes & student loans for good', emoji: '🛡️' },
                { label: 'Building Long-Term Wealth', sub: 'Emergency cushion, investing & financial freedom', emoji: '📈' },
              ].map((item) => {
                const isSelected = survey.moneyGoal === item.label;
                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      styles.optionCard,
                      isSelected && styles.optionCardSelected,
                    ]}
                    onPress={() => saveAndAdvance(5, { ...survey, moneyGoal: item.label })}
                    activeOpacity={0.8}
                  >
                    <View style={styles.optionLeft}>
                      <Text style={styles.optionEmoji}>{item.emoji}</Text>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.optionLabel}>{item.label}</Text>
                        <Text style={styles.optionSubLabel}>{item.sub}</Text>
                      </View>
                    </View>
                    {isSelected && (
                      <View style={styles.checkCircle}>
                        <Text style={styles.checkMark}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ─── STEP 5: TIP-OUT & LEAKAGE AWARENESS ────────────────────────── */}
        {step === 5 && (
          <View style={styles.stepWrapper}>
            <Text style={styles.questionTitle}>
              Do you know how much disappears to tip-outs & fees?
            </Text>
            <Text style={styles.questionSubtitle}>Most workers lose 15%–30% of gross tips before cash ever hits their pocket.</Text>

            <View style={styles.optionsList}>
              {[
                { label: 'I track down to the penny', sub: 'I know my exact net hourly take-home', emoji: '🎯' },
                { label: 'I have a rough ballpark', sub: 'I estimate roughly 10%–20% in my head', emoji: '🧐' },
                { label: 'Honestly, cash just vanishes', sub: 'I take what they hand me and hope it adds up', emoji: '🤷' },
              ].map((item) => {
                const isSelected = survey.knowsHourly === item.label;
                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      styles.optionCard,
                      isSelected && styles.optionCardSelected,
                    ]}
                    onPress={() => saveAndAdvance(6, { ...survey, knowsHourly: item.label })}
                    activeOpacity={0.8}
                  >
                    <View style={styles.optionLeft}>
                      <Text style={styles.optionEmoji}>{item.emoji}</Text>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.optionLabel}>{item.label}</Text>
                        <Text style={styles.optionSubLabel}>{item.sub}</Text>
                      </View>
                    </View>
                    {isSelected && (
                      <View style={styles.checkCircle}>
                        <Text style={styles.checkMark}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ─── STEP 6: THE TIPSTACK REALITY CHECK ────────────────────────── */}
        {step === 6 && (
          <View style={[styles.stepWrapper, styles.insightWrapper]}>
            <Text style={styles.insightTag}>THE TIPSTACK REALITY CHECK</Text>
            <Text style={styles.insightHeadline}>
              Gross tips are vanity. Net take-home is sanity.
            </Text>
            <Text style={styles.insightBody}>
              Walking out with $300 feels great — until $60 goes to barbacks, $40 to bussers, and 20% is
              withheld for taxes. Suddenly an 8-hour shift was only $18/hr.
            </Text>
            <Text style={[styles.insightBody, { marginTop: SPACING.md }]}>
              TipStack automates your true net hourly math on every shift so you always know which jobs
              are making you rich, and which shifts are wasting your time.
            </Text>

            <View style={{ flex: 1, minHeight: 60 }} />

            <TouchableOpacity
              style={styles.mainCtaBtn}
              onPress={() => setStep(7)}
              activeOpacity={0.88}
            >
              <Text style={styles.mainCtaBtnText}>Unlock My Shift Intelligence  →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── STEP 7: BUILT DIFFERENTLY (CORE PILLARS) ──────────────────── */}
        {step === 7 && (
          <View style={styles.stepWrapper}>
            <Text style={styles.questionTitle}>
              Built differently than any other tracker.
            </Text>
            <Text style={styles.questionSubtitle}>
              No corporate surveillance. No clunky spreadsheets. Pure hustle power.
            </Text>

            <View style={styles.reviewsCardList}>
              <View style={styles.reviewPillar}>
                <Text style={styles.reviewPillarIcon}>⚡</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewPillarTitle}>10-Second Quick Shift Logging</Text>
                  <Text style={styles.reviewPillarDesc}>Log gross tips, tip-outs, and credit splits in seconds so you can get home.</Text>
                </View>
              </View>

              <View style={styles.reviewPillar}>
                <Text style={styles.reviewPillarIcon}>🛡️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewPillarTitle}>Bank-Grade 256-Bit TLS & RLS</Text>
                  <Text style={styles.reviewPillarDesc}>Your earnings are cryptographically isolated. Zero bank logins or SSN required.</Text>
                </View>
              </View>

              <View style={styles.reviewPillar}>
                <Text style={styles.reviewPillarIcon}>👑</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewPillarTitle}>Golden Shift™ Intelligence</Text>
                  <Text style={styles.reviewPillarDesc}>Algorithms analyze your schedule to pinpoint your highest-earning days and hours.</Text>
                </View>
              </View>

              <View style={styles.reviewPillar}>
                <Text style={styles.reviewPillarIcon}>💸</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewPillarTitle}>2026 "No Tax on Tips" Estimator</Text>
                  <Text style={styles.reviewPillarDesc}>Tracks proposed tax deductions so you keep maximum cash in your pocket.</Text>
                </View>
              </View>

              <View style={styles.reviewPillar}>
                <Text style={styles.reviewPillarIcon}>📸</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewPillarTitle}>Viral "Shift Flex" Story Generator</Text>
                  <Text style={styles.reviewPillarDesc}>Turn great shifts into 9:16 social cards for Instagram and TikTok with 1 tap.</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.mainCtaBtn}
              onPress={() => setStep(8)}
              activeOpacity={0.88}
            >
              <Text style={styles.mainCtaBtnText}>That's how tracking should be  →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── STEP 8: SET YOUR WEEKLY CASH TARGET ───────────────────────── */}
        {step === 8 && (
          <View style={styles.stepWrapper}>
            <Text style={styles.questionTitle}>Set your weekly cash target.</Text>
            <Text style={styles.questionSubtitle}>Watch your stack fill in real-time as you log shifts throughout the week.</Text>

            <View style={styles.optionsList}>
              {[
                { amount: 500, label: '$500 / week', note: '≈ $100–$125 per shift' },
                { amount: 800, label: '$800 / week', note: '≈ $160–$200 per shift' },
                { amount: 1200, label: '$1,200 / week', note: '≈ $240–$300 per shift' },
                { amount: 1800, label: '$1,800+ / week', note: 'Elite earner · $350+ per shift' },
              ].map((item) => {
                const isSelected = survey.weeklyTarget === item.amount;
                return (
                  <TouchableOpacity
                    key={item.amount}
                    style={[
                      styles.optionCard,
                      isSelected && styles.optionCardSelected,
                    ]}
                    onPress={() => {
                      triggerHaptic();
                      setSurvey({ ...survey, weeklyTarget: item.amount });
                    }}
                    activeOpacity={0.8}
                  >
                    <View>
                      <Text style={styles.targetAmountText}>{item.label}</Text>
                      <Text style={styles.targetNoteText}>{item.note}</Text>
                    </View>
                    {isSelected && (
                      <View style={styles.checkCircle}>
                        <Text style={styles.checkMark}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.targetHelperText}>You can adjust or toggle your target anytime in Settings.</Text>

            <TouchableOpacity
              style={styles.mainCtaBtn}
              onPress={() => setStep(9)}
              activeOpacity={0.88}
            >
              <Text style={styles.mainCtaBtnText}>Lock In My Target</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep(9)} style={styles.noGoalBtn}>
              <Text style={styles.noGoalText}>Skip target for now</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── STEP 9: YOUR STACK IS CALIBRATED ──────────────────────────── */}
        {step === 9 && (
          <View style={[styles.stepWrapper, { alignItems: 'center' }]}>
            <View style={styles.jarHeroWrapper}>
              <View style={styles.jarIconGlow}>
                <Text style={{ fontSize: 52 }}>💰</Text>
              </View>
            </View>

            <Text style={styles.jarTitle}>Your Stack is calibrated.</Text>
            <Text style={styles.jarSubtitle}>Here is your personalized income tracking blueprint:</Text>

            <View style={styles.jarSummaryCard}>
              <View style={styles.jarRow}>
                <Text style={styles.jarCheck}>✓</Text>
                <Text style={styles.jarRowText}>Optimized for {survey.hustle} standards</Text>
              </View>
              <View style={styles.jarRow}>
                <Text style={styles.jarCheck}>✓</Text>
                <Text style={styles.jarRowText}>Weekly target locked: ${survey.weeklyTarget.toLocaleString()}/wk</Text>
              </View>
              <View style={styles.jarRow}>
                <Text style={styles.jarCheck}>✓</Text>
                <Text style={styles.jarRowText}>True $/hr tip-out analyzer active</Text>
              </View>
              <View style={styles.jarRow}>
                <Text style={styles.jarCheck}>✓</Text>
                <Text style={styles.jarRowText}>100% Free 1-click migration (ServerLife, TipSee, Excel)</Text>
              </View>
              <View style={styles.jarRow}>
                <Text style={styles.jarCheck}>✓</Text>
                <Text style={styles.jarRowText}>256-bit Row-Level Security shield engaged</Text>
              </View>
            </View>

            <View style={{ flex: 1, minHeight: 50 }} />

            <TouchableOpacity
              style={[styles.mainCtaBtn, { width: '100%' }]}
              onPress={() => setStep(10)}
              activeOpacity={0.88}
            >
              <Text style={styles.mainCtaBtnText}>Reveal My Income Blueprint  →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── STEP 10: OWN YOUR INCOME (CONVERSION BLUEPRINT) ───────────── */}
        {step === 10 && (
          <View style={styles.stepWrapper}>
            <Text style={styles.paywallTag}>
              PROJECTED PACE · ${estimatedAnnualTips.toLocaleString()} / YEAR
            </Text>

            <View style={styles.paywallBadgeRow}>
              <View style={styles.paywallPill}>
                <Text style={styles.paywallPillText}>
                  ✨ {survey.hustle} · ${survey.weeklyTarget}/wk Target
                </Text>
              </View>
            </View>

            <Text style={styles.paywallTitle}>Own your income. Master your hustle.</Text>
            <Text style={styles.paywallSubtitle}>
              Stop wondering if a shift was worth it. Start stacking with mathematical certainty.
            </Text>

            <View style={styles.starsRow}>
              <Text style={styles.starsText}>⭐⭐⭐⭐⭐</Text>
              <Text style={styles.starsLabel}>Rated 5.0 by Service Industry Pros</Text>
            </View>

            {/* Feature Checklist */}
            <View style={styles.featureList}>
              {[
                { icon: '⏱️', text: 'True take-home $/hr calculated on every shift' },
                { icon: '📥', text: 'Free 1-click migration from ServerLife, TipSee, or Excel' },
                { icon: '📄', text: 'Official 1-tap CSV tax & apartment lease proofs' },
                { icon: '👑', text: 'Golden Shift™ matrix (pinpoints your best money shifts)' },
                { icon: '💼', text: 'Workplace Head-to-Head ROI comparison' },
                { icon: '📸', text: 'Luxury 9:16 "Shift Flex" story cards' },
                { icon: '💰', text: '2026 No-Tax-on-Tips savings tracker' },
              ].map((feat, idx) => (
                <View key={idx} style={styles.featureItem}>
                  <View style={styles.featureItemLeft}>
                    <Text style={styles.featureItemEmoji}>{feat.icon}</Text>
                    <Text style={styles.featureItemText}>{feat.text}</Text>
                  </View>
                  <Text style={styles.featureItemCheck}>✓</Text>
                </View>
              ))}
            </View>

            {/* 100% Free Reassurance Guarantee Banner */}
            <View style={styles.freeGuaranteeBanner}>
              <Text style={{ fontSize: 16 }}>🛡️</Text>
              <Text style={styles.freeGuaranteeText}>
                TipStack is <Text style={{ color: COLORS.primary, fontWeight: '800' }}>100% Free to Use</Text>. No credit card required.
              </Text>
            </View>

            {/* Free Migration Callout Banner */}
            <View style={styles.migrationCalloutBanner}>
              <Text style={{ fontSize: 16 }}>📥</Text>
              <Text style={styles.migrationCalloutText}>
                Switching apps? <Text style={{ color: COLORS.primary, fontWeight: '800' }}>Import your past shifts free</Text> via Settings → Migrate CSV anytime!
              </Text>
            </View>

            {/* Timeline Stepper */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineStep}>
                <Text style={styles.timelineIcon}>🔓</Text>
                <Text style={styles.timelineStepTitle}>Today</Text>
                <Text style={styles.timelineStepSub}>Full Access</Text>
              </View>
              <View style={styles.timelineStep}>
                <Text style={styles.timelineIcon}>🔔</Text>
                <Text style={styles.timelineStepTitle}>Day 12</Text>
                <Text style={styles.timelineStepSub}>Reminder</Text>
              </View>
              <View style={styles.timelineStep}>
                <Text style={styles.timelineIcon}>💳</Text>
                <Text style={styles.timelineStepTitle}>Day 14</Text>
                <Text style={styles.timelineStepSub}>$19.99/yr or cancel</Text>
              </View>
            </View>

            {/* Plan Tier Cards */}
            {/* 1. Free Hustler Plan (Unmissable) */}
            <TouchableOpacity
              style={[
                styles.planCard,
                styles.planCardFree,
                survey.planChoice === 'free' && styles.planCardActive,
              ]}
              onPress={() => {
                triggerHaptic();
                setSurvey({ ...survey, planChoice: 'free' });
              }}
              activeOpacity={0.85}
            >
              <View style={styles.planCardTop}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.planTitle}>Free Hustler Plan</Text>
                  <View style={styles.freeTierPill}>
                    <Text style={styles.freeTierPillText}>FREE FOREVER</Text>
                  </View>
                </View>
                <Text style={styles.freeTag}>NO CARD NEEDED</Text>
              </View>
              <Text style={[styles.planPriceText, { color: '#FFFFFF' }]}>
                $0 <Text style={{ fontSize: 13, color: '#8B91A7', fontWeight: '500' }}>/ free forever</Text>
              </Text>
              <Text style={styles.planPriceSub}>
                Unlimited shifts, free 1-click migration from other apps, calendar & 256-bit encryption (Ad-supported)
              </Text>
            </TouchableOpacity>

            {/* 2. Yearly Pro Pass (14-Day Free Trial) */}
            <TouchableOpacity
              style={[
                styles.planCard,
                survey.planChoice === 'yearly' && styles.planCardActive,
                { marginTop: 6 },
              ]}
              onPress={() => {
                triggerHaptic();
                setSurvey({ ...survey, planChoice: 'yearly' });
              }}
              activeOpacity={0.85}
            >
              <View style={styles.planCardTop}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.planTitle}>Yearly Pro Pass</Text>
                  <View style={styles.freeTrialPill}>
                    <Text style={styles.freeTrialPillText}>14 DAYS FREE</Text>
                  </View>
                </View>
                <Text style={styles.saveTag}>SAVE 45% ($1.66/MO)</Text>
              </View>
              <Text style={styles.planPriceText}>$19.99 / year</Text>
              <Text style={styles.planPriceSub}>
                ≈ 4¢ a shift — No ads, unlimited jobs, 2026 tax relief & Shift Flex stories
              </Text>
            </TouchableOpacity>

            {/* 3. Monthly Pro Pass */}
            <TouchableOpacity
              style={[
                styles.planCard,
                survey.planChoice === 'monthly' && styles.planCardActive,
                { marginTop: 6, marginBottom: SPACING.md },
              ]}
              onPress={() => {
                triggerHaptic();
                setSurvey({ ...survey, planChoice: 'monthly' });
              }}
              activeOpacity={0.85}
            >
              <View style={styles.planCardTop}>
                <Text style={styles.planTitle}>Monthly Pro Pass</Text>
                <Text style={{ fontSize: 11, color: '#8B91A7', fontWeight: '600' }}>NO COMMITMENT</Text>
              </View>
              <Text style={styles.planPriceText}>$2.99 / month</Text>
              <Text style={styles.planPriceSub}>Cancel anytime · Less than a coffee or single tip</Text>
            </TouchableOpacity>

            {/* Referral Callout Banner */}
            <View style={styles.referralCallout}>
              <Text style={styles.referralCalloutText}>
                🎁 Refer a fellow TipStacker & get 1 Month of Pro free!
              </Text>
            </View>

            {/* Dynamic CTA Button */}
            <TouchableOpacity
              style={styles.mainCtaBtn}
              onPress={handleFinish}
              activeOpacity={0.88}
            >
              <Text style={styles.mainCtaBtnText}>
                {survey.planChoice === 'free'
                  ? 'Continue with 100% Free Plan 🚀'
                  : survey.planChoice === 'yearly'
                  ? 'Start My 14-Day Free Trial 🚀'
                  : 'Continue with Monthly Pro 🚀'}
              </Text>
            </TouchableOpacity>

            {/* Reassurance text */}
            <Text style={styles.trialDisclaimer}>
              {survey.planChoice === 'free'
                ? 'Zero payment info ever requested on the Free plan.'
                : '14 days free on yearly, then $19.99/yr · Zero commitment, cancel anytime in Settings'}
            </Text>

            {/* Secondary Free Option if paid plan was clicked */}
            {survey.planChoice !== 'free' && (
              <TouchableOpacity
                style={styles.freeSecondaryBtn}
                onPress={() => {
                  setSurvey({ ...survey, planChoice: 'free' });
                  handleFinish();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.freeSecondaryBtnText}>
                  Prefer not to subscribe? Continue Free Forever →
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Bottom Skip & Sign In Links */}
        <View style={styles.footerNav}>
          {step < 10 && (
            <TouchableOpacity onPress={() => router.replace('/(auth)/signup')} style={styles.skipBtn}>
              <Text style={styles.skipBtnText}>Skip Questionnaire</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.signInBtn}>
            <Text style={styles.signInText}>
              Already have an account? <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0F14',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
  },
  backSlot: {
    width: 32,
    alignItems: 'flex-start',
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 28,
    color: '#F0F2F8',
    lineHeight: 28,
    fontWeight: '300',
  },
  progressBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#272C3A',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  stepCounter: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B91A7',
    width: 44,
    textAlign: 'right',
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING['2xl'],
  },
  stepWrapper: {
    flex: 1,
  },

  /* Welcome Screen */
  welcomeHero: {
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  logoImg: {
    width: 96,
    height: 96,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.base,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 1.5,
    marginTop: 4,
  },
  welcomeCard: {
    backgroundColor: '#161920',
    borderWidth: 1,
    borderColor: '#272C3A',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  welcomeHeadline: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 24,
  },
  welcomeDesc: {
    fontSize: 13,
    color: '#8B91A7',
    lineHeight: 20,
    marginBottom: SPACING.base,
  },
  welcomePillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  welcomePill: {
    backgroundColor: '#1E2230',
    borderColor: '#272C3A',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  welcomePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },

  /* Question Screens */
  questionTitle: {
    fontSize: 27,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  questionSubtitle: {
    fontSize: 14,
    color: '#8B91A7',
    marginBottom: SPACING.xl,
    lineHeight: 20,
  },
  optionsList: {
    gap: 12,
    marginBottom: SPACING.xl,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#161920',
    borderColor: '#272C3A',
    borderWidth: 1.5,
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    paddingHorizontal: SPACING.lg,
  },
  optionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#161920',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  optionEmoji: {
    fontSize: 22,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  optionSubLabel: {
    fontSize: 12,
    color: '#8B91A7',
    lineHeight: 16,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#0D0F14',
    fontSize: 13,
    fontWeight: '900',
  },

  /* Insight Screen */
  insightWrapper: {
    paddingTop: SPACING['2xl'],
  },
  insightTag: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.accent,
    marginBottom: SPACING.base,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  insightHeadline: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 36,
    letterSpacing: -0.5,
    marginBottom: SPACING.lg,
  },
  insightBody: {
    fontSize: 15,
    color: '#8B91A7',
    lineHeight: 23,
  },

  /* Reviews / Core Pillars Screen */
  reviewsCardList: {
    gap: 12,
    marginBottom: SPACING.xl,
  },
  reviewPillar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    backgroundColor: '#161920',
    borderWidth: 1,
    borderColor: '#272C3A',
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
  },
  reviewPillarIcon: {
    fontSize: 22,
    marginTop: 2,
  },
  reviewPillarTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  reviewPillarDesc: {
    fontSize: 12,
    color: '#8B91A7',
    lineHeight: 16,
  },

  /* Weekly Target Screen */
  targetAmountText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  targetNoteText: {
    fontSize: 12,
    color: '#8B91A7',
  },
  targetHelperText: {
    fontSize: 12,
    color: '#8B91A7',
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  noGoalBtn: {
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingVertical: 6,
  },
  noGoalText: {
    fontSize: 13,
    color: '#8B91A7',
  },

  /* Calibrated Readiness Screen */
  jarHeroWrapper: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  jarIconGlow: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary + '66',
    ...SHADOWS.glow,
  },
  jarTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  jarSubtitle: {
    fontSize: 13,
    color: '#8B91A7',
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  jarSummaryCard: {
    width: '100%',
    backgroundColor: '#161920',
    borderWidth: 1,
    borderColor: '#272C3A',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    gap: 16,
  },
  jarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  jarCheck: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  jarRowText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },

  /* Paywall Plan Screen */
  paywallTag: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.accent,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  paywallBadgeRow: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  paywallPill: {
    backgroundColor: '#1E2230',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#272C3A',
  },
  paywallPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  paywallTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  paywallSubtitle: {
    fontSize: 13,
    color: '#8B91A7',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: SPACING.lg,
  },
  starsText: {
    fontSize: 14,
  },
  starsLabel: {
    fontSize: 12,
    color: '#8B91A7',
    fontWeight: '600',
  },
  featureList: {
    gap: 10,
    marginBottom: SPACING.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  featureItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  featureItemEmoji: {
    fontSize: 16,
  },
  featureItemText: {
    fontSize: 13,
    color: '#F0F2F8',
    fontWeight: '500',
  },
  featureItemCheck: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#161920',
    borderWidth: 1,
    borderColor: '#272C3A',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  timelineStep: {
    alignItems: 'center',
    flex: 1,
  },
  timelineIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  timelineStepTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  timelineStepSub: {
    fontSize: 10,
    color: '#8B91A7',
    marginTop: 2,
    textAlign: 'center',
  },
  planCard: {
    backgroundColor: '#161920',
    borderWidth: 2,
    borderColor: '#272C3A',
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    marginBottom: SPACING.sm,
  },
  planCardActive: {
    borderColor: COLORS.primary,
  },
  planCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  freeTrialPill: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  freeTrialPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0D0F14',
  },
  saveTag: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  planPriceText: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 2,
  },
  planPriceSub: {
    fontSize: 11,
    color: '#8B91A7',
  },
  planSubRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.lg,
  },
  planCardMini: {
    flex: 1,
    backgroundColor: '#161920',
    borderWidth: 1.5,
    borderColor: '#272C3A',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  planCardMiniActive: {
    borderColor: COLORS.primary,
  },
  planMiniTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  planMiniPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  planMiniSub: {
    fontSize: 11,
    color: '#8B91A7',
  },
  referralCallout: {
    backgroundColor: '#FFD166' + '1A',
    borderColor: '#FFD166' + '55',
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  referralCalloutText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFD166',
    textAlign: 'center',
  },
  freeGuaranteeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary + '18',
    borderColor: COLORS.primary + '55',
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingVertical: 10,
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.md,
  },
  freeGuaranteeText: {
    fontSize: 12,
    color: '#F0F2F8',
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  migrationCalloutBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#00C9A7' + '12',
    borderColor: '#00C9A7' + '40',
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingVertical: 8,
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.md,
  },
  migrationCalloutText: {
    fontSize: 11,
    color: '#F0F2F8',
    fontWeight: '600',
    flex: 1,
    lineHeight: 15,
  },
  planCardFree: {
    borderColor: '#3F4556',
    borderStyle: 'solid',
  },
  freeTierPill: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  freeTierPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#0D0F14',
  },
  freeTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8B91A7',
  },
  freeSecondaryBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 6,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#272C3A',
    backgroundColor: '#161920',
  },
  freeSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  trialDisclaimer: {
    fontSize: 11,
    color: '#8B91A7',
    textAlign: 'center',
    marginTop: 8,
  },
  paywallLegalRow: {
    alignItems: 'center',
    marginTop: 12,
  },
  paywallLegalLink: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
  },

  /* CTA Buttons */
  mainCtaBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glow,
  },
  mainCtaBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0D0F14',
    letterSpacing: 0.2,
  },
  footerNav: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    gap: SPACING.sm,
  },
  skipBtn: {
    paddingVertical: 6,
  },
  skipBtnText: {
    fontSize: 13,
    color: '#8B91A7',
    fontWeight: '600',
  },
  signInBtn: {
    paddingVertical: 6,
  },
  signInText: {
    fontSize: 13,
    color: '#8B91A7',
  },
});
