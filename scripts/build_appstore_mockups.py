#!/usr/bin/env python3
import os
import subprocess
import shutil

SCREENSHOTS_DIR = "/Users/tavarus/Desktop/StackUp_AppStore_Screenshots"
ARTIFACT_DIR = "/Users/tavarus/.gemini/antigravity/brain/ef7e9963-21a9-44fa-9999-f918e06967e5"
CHROME_BIN = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

SLIDES = [
    {
        "filename": "01_Track_Tips_Mockup.png",
        "input_screenshot": os.path.join(SCREENSHOTS_DIR, "IMG_0914.PNG"),
        "badge_icon": "⚡",
        "badge_text": "SMART SHIFT & TIP TRACKING",
        "headline_line1": "TRACK EVERY TIP.",
        "headline_gradient": "STACK YOUR CASH.",
        "subheadline": "Log cash, credit tips & hours in seconds. Live hourly wage, streak goals & pay day countdowns.",
        "primary_color": "#10B981",
        "secondary_color": "#00F2FE",
        "gradient": "linear-gradient(135deg, #10B981 0%, #34D399 45%, #00F2FE 100%)",
        "glow_rgb_1": "16, 185, 129",
        "glow_rgb_2": "6, 182, 212",
    },
    {
        "filename": "02_Golden_Shift_Mockup.png",
        "input_screenshot": os.path.join(SCREENSHOTS_DIR, "IMG_0916.PNG"),
        "badge_icon": "🏆",
        "badge_text": "AI SHIFT INTELLIGENCE",
        "headline_line1": "FIND YOUR",
        "headline_gradient": "GOLDEN SHIFT.",
        "subheadline": "Discover your peak earning days, true $/hr by shift & head-to-head workplace ROI.",
        "primary_color": "#06B6D4",
        "secondary_color": "#8B5CF6",
        "gradient": "linear-gradient(135deg, #00F2FE 0%, #3B82F6 50%, #8B5CF6 100%)",
        "glow_rgb_1": "6, 182, 212",
        "glow_rgb_2": "139, 92, 246",
    },
    {
        "filename": "03_Tax_Intelligence_Mockup.png",
        "input_screenshot": os.path.join(SCREENSHOTS_DIR, "IMG_0917.PNG"),
        "badge_icon": "💰",
        "badge_text": "PRO TAX & REVENUE SUITE",
        "headline_line1": "KEEP MORE OF",
        "headline_gradient": "WHAT YOU EARN.",
        "subheadline": "2026 \"No Tax on Tips\" relief gauge, tip-out leakage analyzer & hustle pace velocity.",
        "primary_color": "#F59E0B",
        "secondary_color": "#10B981",
        "gradient": "linear-gradient(135deg, #FBBF24 0%, #F59E0B 40%, #10B981 100%)",
        "glow_rgb_1": "245, 158, 11",
        "glow_rgb_2": "16, 185, 129",
    },
    {
        "filename": "04_Earnings_Calendar_Mockup.png",
        "input_screenshot": os.path.join(SCREENSHOTS_DIR, "IMG_0915.PNG"),
        "badge_icon": "📅",
        "badge_text": "VISUAL SHIFT CALENDAR",
        "headline_line1": "YOUR ENTIRE MONTH",
        "headline_gradient": "AT A GLANCE.",
        "subheadline": "Interactive heatmaps, shift breakdowns, best nights & monthly tip totals.",
        "primary_color": "#EC4899",
        "secondary_color": "#A855F7",
        "gradient": "linear-gradient(135deg, #F43F5E 0%, #EC4899 50%, #8B5CF6 100%)",
        "glow_rgb_1": "236, 72, 153",
        "glow_rgb_2": "168, 85, 247",
    },
    {
        "filename": "05_Multi_Job_Mockup.png",
        "input_screenshot": os.path.join(SCREENSHOTS_DIR, "IMG_0919.PNG"),
        "badge_icon": "🚀",
        "badge_text": "MULTI-JOB CALIBRATION",
        "headline_line1": "BUILT FOR THE",
        "headline_gradient": "MODERN HUSTLER.",
        "subheadline": "Multiple venues, custom base wages, tip-out % & export-ready tax summaries.",
        "primary_color": "#14B8A6",
        "secondary_color": "#38BDF8",
        "gradient": "linear-gradient(135deg, #00F2FE 0%, #14B8A6 50%, #10B981 100%)",
        "glow_rgb_1": "20, 184, 166",
        "glow_rgb_2": "56, 189, 248",
    }
]

HTML_TEMPLATE = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    width: 1284px;
    height: 2778px;
    background-color: #06080D;
    background-image: 
      radial-gradient(circle at 50% 28%, rgba({glow_rgb_1}, 0.28) 0%, rgba({glow_rgb_2}, 0.16) 32%, rgba(6, 8, 13, 0) 65%),
      radial-gradient(circle at 50% 88%, rgba({glow_rgb_1}, 0.20) 0%, rgba(6, 8, 13, 0) 50%);
    color: #FFFFFF;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: hidden;
    position: relative;
  }}

  /* Decorative Ambient Grid */
  .grid-pattern {{
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-size: 64px 64px;
    background-image: 
      linear-gradient(to right, rgba(255, 255, 255, 0.025) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
    pointer-events: none;
  }}

  /* Ambient Flare Orbs */
  .ambient-flare {{
    position: absolute;
    top: 80px;
    width: 650px;
    height: 350px;
    background: radial-gradient(ellipse at center, rgba({glow_rgb_1}, 0.45) 0%, transparent 70%);
    filter: blur(55px);
    pointer-events: none;
    z-index: 1;
  }}

  /* Header Container */
  .header-container {{
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 135px;
    padding-left: 60px;
    padding-right: 60px;
    text-align: center;
  }}

  .badge {{
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 14px 34px;
    background: rgba({glow_rgb_1}, 0.12);
    border: 2px solid rgba({glow_rgb_1}, 0.55);
    border-radius: 999px;
    font-size: 26px;
    font-weight: 800;
    letter-spacing: 2.8px;
    text-transform: uppercase;
    color: {primary_color};
    box-shadow: 0 0 35px rgba({glow_rgb_1}, 0.35), inset 0 0 15px rgba({glow_rgb_1}, 0.15);
    margin-bottom: 26px;
  }}

  .headline {{
    font-size: 82px;
    font-weight: 900;
    line-height: 1.08;
    letter-spacing: -2px;
    text-transform: uppercase;
    margin-bottom: 22px;
    text-shadow: 0 4px 20px rgba(0, 0, 0, 0.85);
  }}

  .gradient-text {{
    background: {gradient};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 0 30px rgba({glow_rgb_1}, 0.4));
  }}

  .subheadline {{
    font-size: 36px;
    font-weight: 500;
    line-height: 1.4;
    color: #A0AEC0;
    max-width: 980px;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.85);
  }}

  /* Phone Mockup */
  .mockup-wrapper {{
    position: relative;
    z-index: 10;
    margin-top: 55px;
    display: flex;
    justify-content: center;
  }}

  /* Multi-tier Neon Aura */
  .phone-aura-1 {{
    position: absolute;
    width: 960px;
    height: 1800px;
    top: 40px;
    background: radial-gradient(ellipse at center, rgba({glow_rgb_1}, 0.45) 0%, rgba({glow_rgb_2}, 0.20) 45%, transparent 70%);
    filter: blur(80px);
    z-index: -1;
  }}

  .phone-aura-2 {{
    position: absolute;
    width: 1040px;
    height: 1200px;
    top: 300px;
    background: radial-gradient(ellipse at center, rgba({glow_rgb_2}, 0.25) 0%, transparent 65%);
    filter: blur(90px);
    z-index: -1;
  }}

  /* Titanium Chassis */
  .phone-chassis {{
    position: relative;
    width: 986px;
    background: linear-gradient(145deg, #3A4454 0%, #1E2530 50%, #141A24 100%);
    padding: 16px;
    border-radius: 74px;
    box-shadow: 
      0 0 0 3px rgba(255, 255, 255, 0.18),
      0 0 0 6px rgba(0, 0, 0, 0.8),
      0 0 75px rgba({glow_rgb_1}, 0.5),
      0 0 140px rgba({glow_rgb_2}, 0.25),
      0 40px 90px rgba(0, 0, 0, 0.95);
  }}

  /* Hardware Side Buttons */
  .btn-power {{
    position: absolute;
    right: -10px;
    top: 380px;
    width: 8px;
    height: 140px;
    background: #3A4454;
    border-radius: 0 4px 4px 0;
    box-shadow: 2px 0 6px rgba(0,0,0,0.5);
  }}
  .btn-vol-up {{
    position: absolute;
    left: -10px;
    top: 320px;
    width: 8px;
    height: 90px;
    background: #3A4454;
    border-radius: 4px 0 0 4px;
    box-shadow: -2px 0 6px rgba(0,0,0,0.5);
  }}
  .btn-vol-down {{
    position: absolute;
    left: -10px;
    top: 440px;
    width: 8px;
    height: 90px;
    background: #3A4454;
    border-radius: 4px 0 0 4px;
    box-shadow: -2px 0 6px rgba(0,0,0,0.5);
  }}

  .screen-glass {{
    border-radius: 58px;
    overflow: hidden;
    background: #000;
    box-shadow: inset 0 0 0 2px rgba(0, 0, 0, 0.95);
    position: relative;
  }}

  /* Sleek Glass Glare Reflection */
  .glass-glare {{
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 550px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.03) 40%, transparent 70%);
    pointer-events: none;
    z-index: 5;
  }}

  .screen-img {{
    width: 100%;
    display: block;
  }}
</style>
</head>
<body>
  <div class="grid-pattern"></div>
  <div class="ambient-flare"></div>
  
  <div class="header-container">
    <div class="badge">{badge_icon} {badge_text}</div>
    <h1 class="headline">{headline_line1}<br><span class="gradient-text">{headline_gradient}</span></h1>
    <p class="subheadline">{subheadline}</p>
  </div>

  <div class="mockup-wrapper">
    <div class="phone-aura-1"></div>
    <div class="phone-aura-2"></div>
    <div class="phone-chassis">
      <div class="btn-power"></div>
      <div class="btn-vol-up"></div>
      <div class="btn-vol-down"></div>
      <div class="screen-glass">
        <div class="glass-glare"></div>
        <img class="screen-img" src="file://{screenshot_path}">
      </div>
    </div>
  </div>
</body>
</html>
"""

def generate():
    os.makedirs(SCREENSHOTS_DIR, exist_ok=True)
    os.makedirs(ARTIFACT_DIR, exist_ok=True)

    for idx, slide in enumerate(SLIDES, start=1):
        out_desktop = os.path.join(SCREENSHOTS_DIR, slide["filename"])
        out_artifact = os.path.join(ARTIFACT_DIR, slide["filename"])
        html_path = f"/tmp/mockup_slide_{idx}.html"

        html_content = HTML_TEMPLATE.format(
            glow_rgb_1=slide["glow_rgb_1"],
            glow_rgb_2=slide["glow_rgb_2"],
            primary_color=slide["primary_color"],
            badge_icon=slide["badge_icon"],
            badge_text=slide["badge_text"],
            headline_line1=slide["headline_line1"],
            headline_gradient=slide["headline_gradient"],
            gradient=slide["gradient"],
            subheadline=slide["subheadline"],
            screenshot_path=slide["input_screenshot"]
        )

        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html_content)

        print(f"[{idx}/5] Rendering {slide['filename']}...")
        cmd = [
            CHROME_BIN,
            "--headless",
            "--disable-gpu",
            "--hide-scrollbars",
            "--window-size=1284,2778",
            f"--screenshot={out_desktop}",
            f"file://{html_path}"
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode != 0:
            print(f"Error rendering {slide['filename']}: {res.stderr}")
            continue

        # Copy to artifact dir
        shutil.copy2(out_desktop, out_artifact)
        print(f"✓ Generated {out_desktop} ({os.path.getsize(out_desktop):,} bytes)")

    print("All mockups successfully generated!")

if __name__ == "__main__":
    generate()
