#!/usr/bin/env python3
import os
import base64
import subprocess
import shutil

DESKTOP_DIR = "/Users/tavarus/Desktop/StackUp_AppStore_Product_Assets"
ARTIFACT_DIR = "/Users/tavarus/.gemini/antigravity/brain/ef7e9963-21a9-44fa-9999-f918e06967e5"
CHROME_BIN = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SCRATCH_DIR = "/Users/tavarus/.gemini/antigravity/scratch/tipstack/scripts/temp_assets"

os.makedirs(DESKTOP_DIR, exist_ok=True)
os.makedirs(SCRATCH_DIR, exist_ok=True)

def to_base64(path):
    with open(path, "rb") as f:
        data = f.read()
    ext = os.path.splitext(path)[1].lower().replace(".", "")
    if ext == "jpg": ext = "jpeg"
    return f"data:image/{ext};base64,{base64.b64encode(data).decode('utf-8')}"

ICON_PATH = "/Users/tavarus/.gemini/antigravity/scratch/tipstack/assets/icon.png"
HOME_SCREEN = os.path.join(ARTIFACT_DIR, "01_home_dashboard.png")
ANALYTICS_SCREEN = os.path.join(ARTIFACT_DIR, "02_shift_intelligence.png")
TAX_SCREEN = os.path.join(ARTIFACT_DIR, "03_pro_intelligence_tax.png")
CALENDAR_SCREEN = os.path.join(ARTIFACT_DIR, "04_earnings_calendar.png")

print("Encoding images to base64...")
icon_b64 = to_base64(ICON_PATH)
home_b64 = to_base64(HOME_SCREEN)
analytics_b64 = to_base64(ANALYTICS_SCREEN)
tax_b64 = to_base64(TAX_SCREEN)
calendar_b64 = to_base64(CALENDAR_SCREEN)
print("Encoding complete.")

def render_html_to_png(html_content, output_png_path, width, height):
    html_file = os.path.join(SCRATCH_DIR, "temp_render.html")
    with open(html_file, "w", encoding="utf-8") as f:
        f.write(html_content)
    
    cmd = [
        CHROME_BIN,
        "--headless",
        "--hide-scrollbars",
        "--disable-gpu",
        f"--window-size={width},{height}",
        f"--screenshot={output_png_path}",
        html_file
    ]
    subprocess.run(cmd, check=True)
    print(f"Rendered: {output_png_path} ({width}x{height})")
    
    # Also copy to artifact directory
    artifact_copy = os.path.join(ARTIFACT_DIR, os.path.basename(output_png_path))
    shutil.copyfile(output_png_path, artifact_copy)
    print(f"Copied to artifacts: {artifact_copy}")

# ==============================================================================
# ASSET 1: App Store Product Page Header (16:9 Landscape - 1920 x 1080)
# ==============================================================================
HEADER_16X9_HTML = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    width: 1920px;
    height: 1080px;
    background: #06080D;
    background-image:
      radial-gradient(circle at 75% 35%, rgba(0, 201, 167, 0.24) 0%, rgba(0, 242, 254, 0.12) 35%, rgba(6, 8, 13, 0) 70%),
      radial-gradient(circle at 25% 75%, rgba(255, 209, 102, 0.15) 0%, rgba(6, 8, 13, 0) 55%),
      linear-gradient(180deg, #070A10 0%, #05070B 100%);
    color: #FFFFFF;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
    display: flex;
    overflow: hidden;
    position: relative;
  }}

  /* Ambient Grid Background */
  .grid-bg {{
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background-image: 
      linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 60px 60px;
    pointer-events: none;
  }}

  /* Ambient Glow Orbs */
  .orb-teal {{
    position: absolute;
    width: 600px;
    height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(0, 201, 167, 0.25) 0%, rgba(0, 201, 167, 0) 70%);
    top: -100px;
    right: 350px;
    filter: blur(80px);
  }}

  .orb-gold {{
    position: absolute;
    width: 450px;
    height: 450px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 209, 102, 0.20) 0%, rgba(255, 209, 102, 0) 70%);
    bottom: -100px;
    right: 50px;
    filter: blur(90px);
  }}

  /* Left Hero Content */
  .left-col {{
    width: 880px;
    height: 100%;
    padding: 100px 80px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    z-index: 10;
  }}

  .badge-tag {{
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(0, 201, 167, 0.12);
    border: 1px solid rgba(0, 201, 167, 0.4);
    border-radius: 999px;
    padding: 8px 18px;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #00C9A7;
    margin-bottom: 28px;
    align-self: flex-start;
  }}

  .app-identity {{
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 24px;
  }}

  .app-icon {{
    width: 88px;
    height: 88px;
    border-radius: 20px;
    box-shadow: 0 16px 36px rgba(0, 201, 167, 0.35);
    border: 1.5px solid rgba(255, 255, 255, 0.2);
  }}

  .app-title-group {{
    display: flex;
    flex-direction: column;
  }}

  .app-name {{
    font-size: 42px;
    font-weight: 900;
    letter-spacing: -0.5px;
    background: linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }}

  .app-category {{
    font-size: 15px;
    font-weight: 600;
    color: #94A3B8;
    margin-top: 2px;
  }}

  .headline {{
    font-size: 58px;
    font-weight: 900;
    line-height: 1.08;
    letter-spacing: -1.5px;
    margin-bottom: 20px;
  }}

  .headline-gradient {{
    background: linear-gradient(135deg, #00C9A7 0%, #00F2FE 45%, #FFD166 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }}

  .subhead {{
    font-size: 20px;
    line-height: 1.45;
    color: #94A3B8;
    margin-bottom: 36px;
    max-width: 720px;
    font-weight: 400;
  }}

  .pill-features {{
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 36px;
  }}

  .pill {{
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 12px;
    padding: 10px 18px;
    font-size: 14px;
    font-weight: 700;
    color: #F1F5F9;
    display: flex;
    align-items: center;
    gap: 8px;
    backdrop-filter: blur(10px);
  }}

  .rating-row {{
    display: flex;
    align-items: center;
    gap: 16px;
    padding-top: 10px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }}

  .stars {{
    color: #FFD166;
    font-size: 18px;
    letter-spacing: 2px;
  }}

  .rating-text {{
    font-size: 14px;
    font-weight: 700;
    color: #CBD5E1;
  }}

  .rating-sub {{
    font-size: 13px;
    color: #64748B;
  }}

  /* Right Device Showcase */
  .right-col {{
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }}

  /* Phone 1 (Back, tilted right) */
  .phone-back {{
    position: absolute;
    width: 440px;
    height: 890px;
    border-radius: 54px;
    background: #000000;
    border: 10px solid #282C35;
    box-shadow: 
      0 30px 80px rgba(0, 0, 0, 0.8),
      0 0 50px rgba(0, 242, 254, 0.25);
    overflow: hidden;
    right: 80px;
    top: 120px;
    transform: rotate(8deg) scale(0.92);
    z-index: 2;
    filter: brightness(0.85);
  }}

  /* Phone 2 (Front, tilted left) */
  .phone-front {{
    position: absolute;
    width: 460px;
    height: 930px;
    border-radius: 58px;
    background: #000000;
    border: 11px solid #3A3F4D;
    box-shadow: 
      0 40px 100px rgba(0, 0, 0, 0.95),
      0 0 70px rgba(0, 201, 167, 0.35);
    overflow: hidden;
    right: 320px;
    top: 75px;
    transform: rotate(-5deg);
    z-index: 5;
  }}

  .phone-screen {{
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
    display: block;
  }}

  /* Floating Metric Cards */
  .floating-card {{
    position: absolute;
    background: rgba(18, 24, 38, 0.88);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 18px;
    padding: 16px 22px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    gap: 14px;
    z-index: 10;
  }}

  .card-1 {{
    top: 110px;
    left: 20px;
    border-color: rgba(0, 201, 167, 0.4);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 201, 167, 0.2);
  }}

  .card-2 {{
    bottom: 120px;
    left: 80px;
    border-color: rgba(255, 209, 102, 0.4);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(255, 209, 102, 0.2);
  }}

  .card-3 {{
    top: 480px;
    right: 30px;
    border-color: rgba(0, 230, 118, 0.4);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 230, 118, 0.2);
  }}

  .card-icon {{
    font-size: 28px;
  }}

  .card-info {{
    display: flex;
    flex-direction: column;
  }}

  .card-label {{
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #94A3B8;
  }}

  .card-value {{
    font-size: 20px;
    font-weight: 900;
    color: #FFFFFF;
    margin-top: 2px;
  }}

  .card-sub {{
    font-size: 11px;
    color: #00E676;
    font-weight: 700;
    margin-top: 1px;
  }}
</style>
</head>
<body>
  <div class="grid-bg"></div>
  <div class="orb-teal"></div>
  <div class="orb-gold"></div>

  <!-- Left Branding & Value Prop -->
  <div class="left-col">
    <div class="badge-tag">⚡ #1 Shift & Tip Tracking Intelligence</div>
    
    <div class="app-identity">
      <img src="{icon_b64}" class="app-icon" alt="StackUp Icon" />
      <div class="app-title-group">
        <div class="app-name">StackUp</div>
        <div class="app-category">Smart Tip Tracker • Built for Hospitality Pros</div>
      </div>
    </div>

    <div class="headline">
      TRACK EVERY TIP.<br>
      <span class="headline-gradient">STACK YOUR CASH.</span>
    </div>

    <div class="subhead">
      Real-time hourly wage analytics, automated pre-tax payday estimates, AI "Golden Shift" discovery, and 2026 "No Tax on Tips" relief calculator.
    </div>

    <div class="pill-features">
      <div class="pill">💰 Estimated Payday Check</div>
      <div class="pill">👑 "Golden Shift" Matrix</div>
      <div class="pill">🏛️ 2026 Tax Relief Gauge</div>
      <div class="pill">💵 Cash vs. Credit Tracker</div>
      <div class="pill">⏱️ True $/Hour Velocity</div>
    </div>

    <div class="rating-row">
      <div class="stars">★★★★★</div>
      <div>
        <span class="rating-text">5.0 Star Rating</span>
        <span class="rating-sub"> • Trusted by Servers, Bartenders & Valets Nationwide</span>
      </div>
    </div>
  </div>

  <!-- Right Perspective Device Showcase -->
  <div class="right-col">
    <!-- Secondary Phone (Analytics Golden Shift) -->
    <div class="phone-back">
      <img src="{analytics_b64}" class="phone-screen" alt="Analytics Screen" />
    </div>

    <!-- Primary Phone (Home Dashboard) -->
    <div class="phone-front">
      <img src="{home_b64}" class="phone-screen" alt="Home Screen" />
    </div>

    <!-- Floating UI Badge 1: Payday Hero -->
    <div class="floating-card card-1">
      <div class="card-icon">💰</div>
      <div class="card-info">
        <span class="card-label">Estimated Payday Check</span>
        <span class="card-value">$1,845.50</span>
        <span class="card-sub">Base Wages + Tips Pre-Tax</span>
      </div>
    </div>

    <!-- Floating UI Badge 2: Golden Shift -->
    <div class="floating-card card-2">
      <div class="card-icon">👑</div>
      <div class="card-info">
        <span class="card-label">Your Golden Shift</span>
        <span class="card-value">Friday Nights</span>
        <span class="card-sub" style="color: #FFD166;">Avg $48.20 / Hour</span>
      </div>
    </div>

    <!-- Floating UI Badge 3: Cash in Pocket -->
    <div class="floating-card card-3">
      <div class="card-icon">🪙</div>
      <div class="card-info">
        <span class="card-label">Cash Take-Home</span>
        <span class="card-value">+$340.00</span>
        <span class="card-sub">Instant Cash in Pocket</span>
      </div>
    </div>
  </div>
</body>
</html>"""

# ==============================================================================
# ASSET 2: App Store Ultra-Wide Featuring Header Banner (4320 x 1080)
# ==============================================================================
HEADER_ULTRAWIDE_HTML = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    width: 4320px;
    height: 1080px;
    background: #06080D;
    background-image:
      radial-gradient(circle at 65% 40%, rgba(0, 201, 167, 0.28) 0%, rgba(0, 242, 254, 0.12) 35%, rgba(6, 8, 13, 0) 70%),
      radial-gradient(circle at 20% 60%, rgba(255, 209, 102, 0.16) 0%, rgba(6, 8, 13, 0) 55%),
      linear-gradient(180deg, #070A10 0%, #05070B 100%);
    color: #FFFFFF;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
    display: flex;
    overflow: hidden;
    position: relative;
    padding: 0 160px;
    align-items: center;
  }}

  .grid-bg {{
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background-image: 
      linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 80px 80px;
    pointer-events: none;
  }}

  /* Left Brand Section (Width: 1500px) */
  .brand-section {{
    width: 1450px;
    display: flex;
    flex-direction: column;
    z-index: 10;
  }}

  .badge-tag {{
    display: inline-flex;
    align-items: center;
    gap: 12px;
    background: rgba(0, 201, 167, 0.12);
    border: 2px solid rgba(0, 201, 167, 0.4);
    border-radius: 999px;
    padding: 12px 28px;
    font-size: 22px;
    font-weight: 800;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #00C9A7;
    margin-bottom: 32px;
    align-self: flex-start;
  }}

  .app-identity {{
    display: flex;
    align-items: center;
    gap: 32px;
    margin-bottom: 28px;
  }}

  .app-icon {{
    width: 130px;
    height: 130px;
    border-radius: 30px;
    box-shadow: 0 20px 50px rgba(0, 201, 167, 0.4);
    border: 2px solid rgba(255, 255, 255, 0.25);
  }}

  .app-name {{
    font-size: 68px;
    font-weight: 900;
    letter-spacing: -1px;
    color: #FFFFFF;
  }}

  .app-category {{
    font-size: 24px;
    font-weight: 600;
    color: #94A3B8;
    margin-top: 4px;
  }}

  .headline {{
    font-size: 86px;
    font-weight: 900;
    line-height: 1.05;
    letter-spacing: -2.5px;
    margin-bottom: 24px;
  }}

  .headline-gradient {{
    background: linear-gradient(135deg, #00C9A7 0%, #00F2FE 45%, #FFD166 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }}

  .subhead {{
    font-size: 28px;
    line-height: 1.45;
    color: #94A3B8;
    margin-bottom: 40px;
    max-width: 1250px;
  }}

  .pills-row {{
    display: flex;
    gap: 16px;
  }}

  .pill {{
    background: rgba(255, 255, 255, 0.06);
    border: 1.5px solid rgba(255, 255, 255, 0.15);
    border-radius: 16px;
    padding: 14px 26px;
    font-size: 20px;
    font-weight: 700;
    color: #FFFFFF;
  }}

  /* Center Device Triple Showcase */
  .device-section {{
    flex: 1;
    height: 100%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 40px;
  }}

  .phone-card {{
    width: 440px;
    height: 900px;
    border-radius: 56px;
    background: #000000;
    border: 11px solid #333842;
    box-shadow: 0 40px 100px rgba(0, 0, 0, 0.9);
    overflow: hidden;
    position: relative;
    flex-shrink: 0;
  }}

  .phone-1 {{
    transform: translateY(20px) rotate(-4deg);
    border-color: rgba(0, 201, 167, 0.5);
    box-shadow: 0 40px 100px rgba(0, 0, 0, 0.9), 0 0 60px rgba(0, 201, 167, 0.25);
  }}

  .phone-2 {{
    transform: translateY(-20px) scale(1.04);
    z-index: 5;
    border-color: rgba(255, 255, 255, 0.4);
    box-shadow: 0 50px 120px rgba(0, 0, 0, 0.95), 0 0 80px rgba(0, 242, 254, 0.3);
  }}

  .phone-3 {{
    transform: translateY(30px) rotate(4deg);
    border-color: rgba(255, 209, 102, 0.5);
    box-shadow: 0 40px 100px rgba(0, 0, 0, 0.9), 0 0 60px rgba(255, 209, 102, 0.25);
  }}

  .phone-screen {{
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
  }}

  /* Right Stats Panel */
  .stats-section {{
    width: 720px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    z-index: 10;
  }}

  .stat-card {{
    background: rgba(18, 24, 38, 0.85);
    backdrop-filter: blur(25px);
    border: 2px solid rgba(255, 255, 255, 0.12);
    border-radius: 24px;
    padding: 28px 36px;
    display: flex;
    align-items: center;
    gap: 24px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
  }}

  .stat-icon {{
    font-size: 48px;
  }}

  .stat-title {{
    font-size: 16px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #94A3B8;
  }}

  .stat-num {{
    font-size: 38px;
    font-weight: 900;
    color: #FFFFFF;
    margin-top: 4px;
  }}

  .stat-sub {{
    font-size: 16px;
    font-weight: 700;
    color: #00E676;
    margin-top: 2px;
  }}
</style>
</head>
<body>
  <div class="grid-bg"></div>

  <!-- Left Branding -->
  <div class="brand-section">
    <div class="badge-tag">⚡ Apple App Store Featured Product Page</div>
    <div class="app-identity">
      <img src="{icon_b64}" class="app-icon" alt="StackUp Icon" />
      <div>
        <div class="app-name">StackUp</div>
        <div class="app-category">Smart Shift & Tip Intelligence • iOS 18+</div>
      </div>
    </div>
    <div class="headline">
      TRACK EVERY TIP.<br>
      <span class="headline-gradient">STACK YOUR CASH.</span>
    </div>
    <div class="subhead">
      The complete shift companion: Real-time base wages, AI Golden Shift advisor, pre-tax estimated payday checks, and 2026 "No Tax on Tips" relief calculator.
    </div>
    <div class="pills-row">
      <div class="pill">💰 Payday Check Estimator</div>
      <div class="pill">👑 "Golden Shift" Matrix</div>
      <div class="pill">🏛️ 2026 Tax Relief</div>
      <div class="pill">💵 Instant Cash Log</div>
    </div>
  </div>

  <!-- Center 3-Phone Showcase -->
  <div class="device-section">
    <div class="phone-card phone-1">
      <img src="{home_b64}" class="phone-screen" alt="Home Dashboard" />
    </div>

    <div class="phone-card phone-2">
      <img src="{analytics_b64}" class="phone-screen" alt="Analytics Golden Shift" />
    </div>

    <div class="phone-card phone-3">
      <img src="{tax_b64}" class="phone-screen" alt="Tax & Payday Check" />
    </div>
  </div>

  <!-- Right Highlights Panel -->
  <div class="stats-section">
    <div class="stat-card" style="border-color: rgba(0, 201, 167, 0.4);">
      <div class="stat-icon">💰</div>
      <div>
        <div class="stat-title">Estimated Payday Check</div>
        <div class="stat-num">$1,845.50</div>
        <div class="stat-sub">Base Wages + Net Tips Pre-Tax</div>
      </div>
    </div>

    <div class="stat-card" style="border-color: rgba(255, 209, 102, 0.4);">
      <div class="stat-icon">👑</div>
      <div>
        <div class="stat-title">AI Golden Shift Matrix</div>
        <div class="stat-num">Friday Nights</div>
        <div class="stat-sub" style="color: #FFD166;">Average $48.20 / Hour</div>
      </div>
    </div>

    <div class="stat-card" style="border-color: rgba(0, 230, 118, 0.4);">
      <div class="stat-icon">🏛️</div>
      <div>
        <div class="stat-title">2026 IRS Tax Relief Gauge</div>
        <div class="stat-num">+$2,480.00</div>
        <div class="stat-sub">Estimated Annual Tax Exemption</div>
      </div>
    </div>
  </div>
</body>
</html>"""

# ==============================================================================
# ASSET 3: App Store Search Results Showcase (1920 x 1080)
# ==============================================================================
SEARCH_RESULTS_SHOWCASE_HTML = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    width: 1920px;
    height: 1080px;
    background: #000000;
    color: #FFFFFF;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    padding: 36px 90px;
  }}

  /* Top App Store Search Bar */
  .search-nav {{
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 24px;
  }}

  .search-input-box {{
    flex: 1;
    height: 52px;
    background: #1C1C1E;
    border-radius: 14px;
    display: flex;
    align-items: center;
    padding: 0 18px;
    gap: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }}

  .search-icon {{
    font-size: 20px;
    color: #8E8E93;
  }}

  .search-query {{
    font-size: 20px;
    color: #FFFFFF;
    font-weight: 500;
  }}

  .search-cancel {{
    font-size: 19px;
    color: #0A84FF;
    font-weight: 600;
    cursor: pointer;
  }}

  /* Search Result App Listing Card */
  .listing-card {{
    background: #12141A;
    border: 1px solid rgba(255, 255, 255, 0.10);
    border-radius: 28px;
    padding: 26px 36px;
    display: flex;
    flex-direction: column;
    flex: 1;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
  }}

  .listing-header {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }}

  .listing-app-info {{
    display: flex;
    align-items: center;
    gap: 24px;
  }}

  .app-icon {{
    width: 94px;
    height: 94px;
    border-radius: 22px;
    box-shadow: 0 12px 30px rgba(0, 201, 167, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.15);
  }}

  .app-titles {{
    display: flex;
    flex-direction: column;
  }}

  .app-name {{
    font-size: 30px;
    font-weight: 800;
    color: #FFFFFF;
    letter-spacing: -0.3px;
  }}

  .app-subtitle {{
    font-size: 16px;
    color: #8E8E93;
    font-weight: 500;
    margin-top: 3px;
  }}

  .app-meta-row {{
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 8px;
  }}

  .stars-row {{
    display: flex;
    align-items: center;
    gap: 6px;
  }}

  .stars {{
    color: #FFD166;
    font-size: 15px;
    letter-spacing: 1px;
  }}

  .rating-score {{
    font-size: 14px;
    font-weight: 700;
    color: #8E8E93;
  }}

  .badge-category {{
    background: rgba(255, 255, 255, 0.08);
    padding: 3px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 700;
    color: #CBD5E1;
  }}

  .get-cta-group {{
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }}

  .get-btn {{
    background: #0A84FF;
    color: #FFFFFF;
    font-size: 16px;
    font-weight: 800;
    padding: 12px 36px;
    border-radius: 999px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 4px 16px rgba(10, 132, 255, 0.4);
  }}

  .in-app-text {{
    font-size: 11px;
    color: #8E8E93;
  }}

  /* 3-Screenshot Showcase Container */
  .screens-showcase {{
    display: flex;
    justify-content: space-between;
    gap: 24px;
    flex: 1;
    margin-top: 6px;
  }}

  .screen-column {{
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #1A1D26;
    border-radius: 24px;
    padding: 18px 18px 0 18px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    overflow: hidden;
    position: relative;
  }}

  .screen-banner-label {{
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    margin-bottom: 4px;
  }}

  .screen-banner-title {{
    font-size: 18px;
    font-weight: 900;
    color: #FFFFFF;
    margin-bottom: 14px;
    text-align: center;
  }}

  .mini-phone {{
    width: 380px;
    height: 610px;
    border-top-left-radius: 36px;
    border-top-right-radius: 36px;
    background: #000000;
    border-top: 8px solid #333842;
    border-left: 8px solid #333842;
    border-right: 8px solid #333842;
    overflow: hidden;
    position: relative;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
  }}

  .mini-phone-screen {{
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
  }}

  /* Bottom Trust Strip */
  .trust-strip {{
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding-top: 18px;
    margin-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }}

  .trust-item {{
    font-size: 13px;
    font-weight: 700;
    color: #94A3B8;
    display: flex;
    align-items: center;
    gap: 8px;
  }}
</style>
</head>
<body>
  <!-- App Store Search Navigation Bar -->
  <div class="search-nav">
    <div class="search-input-box">
      <span class="search-icon">🔍</span>
      <span class="search-query">tip tracker for servers & bartenders</span>
    </div>
    <div class="search-cancel">Cancel</div>
  </div>

  <!-- Search Result Card -->
  <div class="listing-card">
    <div class="listing-header">
      <div class="listing-app-info">
        <img src="{icon_b64}" class="app-icon" alt="StackUp Icon" />
        <div class="app-titles">
          <div class="app-name">StackUp: Tip & Shift Tracker</div>
          <div class="app-subtitle">Hourly Wage, Golden Shifts & Payday Estimator</div>
          <div class="app-meta-row">
            <div class="stars-row">
              <span class="stars">★★★★★</span>
              <span class="rating-score">5.0 (2.8K)</span>
            </div>
            <span class="badge-category">#1 in Finance / Shifts</span>
            <span class="badge-category">4+</span>
          </div>
        </div>
      </div>

      <div class="get-cta-group">
        <div class="get-btn">GET</div>
        <span class="in-app-text">In-App Purchases</span>
      </div>
    </div>

    <!-- 3-Screen Triple Showcase -->
    <div class="screens-showcase">
      <!-- Screen 1: Track Tips -->
      <div class="screen-column">
        <span class="screen-banner-label" style="color: #00C9A7;">⚡ LIVE SHIFT LOGGING</span>
        <div class="screen-banner-title">Track Cash & Credit Tips</div>
        <div class="mini-phone">
          <img src="{home_b64}" class="mini-phone-screen" alt="Home Dashboard" />
        </div>
      </div>

      <!-- Screen 2: Golden Shift AI Matrix -->
      <div class="screen-column" style="border-color: rgba(255, 209, 102, 0.3); background: #1B1E2B;">
        <span class="screen-banner-label" style="color: #FFD166;">🏆 AI PEAK PERFORMANCE</span>
        <div class="screen-banner-title">"Golden Shift" Matrix</div>
        <div class="mini-phone" style="border-color: #4A4535;">
          <img src="{analytics_b64}" class="mini-phone-screen" alt="Analytics Matrix" />
        </div>
      </div>

      <!-- Screen 3: Estimated Payday Check -->
      <div class="screen-column">
        <span class="screen-banner-label" style="color: #00E676;">💰 PRE-TAX GROSS EARNINGS</span>
        <div class="screen-banner-title">Estimated Payday Check</div>
        <div class="mini-phone">
          <img src="{tax_b64}" class="mini-phone-screen" alt="Tax & Payday" />
        </div>
      </div>
    </div>

    <!-- Bottom Highlights -->
    <div class="trust-strip">
      <div class="trust-item"><span>⚡</span> Instant Cash in Pocket vs. Credit Paycheck</div>
      <div class="trust-item"><span>🏢</span> Multi-Workplace Base Wage Calibration</div>
      <div class="trust-item"><span>🏛️</span> 2026 "No Tax on Tips" Relief Gauge</div>
      <div class="trust-item"><span>📄</span> One-Tap CSV & Tax Export</div>
    </div>
  </div>
</body>
</html>"""

# ==============================================================================
# ASSET 4: Apple Search Ads & CPP Landscape Card (1200 x 628)
# ==============================================================================
SEARCH_CARD_1200X628_HTML = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    width: 1200px;
    height: 628px;
    background: #06080D;
    background-image:
      radial-gradient(circle at 75% 30%, rgba(0, 201, 167, 0.28) 0%, rgba(0, 242, 254, 0.12) 40%, rgba(6, 8, 13, 0) 70%),
      radial-gradient(circle at 20% 70%, rgba(255, 209, 102, 0.16) 0%, rgba(6, 8, 13, 0) 55%),
      linear-gradient(180deg, #070A10 0%, #05070B 100%);
    color: #FFFFFF;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
    display: flex;
    overflow: hidden;
    position: relative;
    padding: 50px 60px;
    align-items: center;
  }}

  .left-content {{
    width: 620px;
    display: flex;
    flex-direction: column;
    z-index: 10;
  }}

  .badge {{
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(0, 201, 167, 0.12);
    border: 1px solid rgba(0, 201, 167, 0.4);
    border-radius: 999px;
    padding: 6px 14px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #00C9A7;
    margin-bottom: 16px;
    align-self: flex-start;
  }}

  .brand-row {{
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
  }}

  .icon {{
    width: 64px;
    height: 64px;
    border-radius: 16px;
    box-shadow: 0 10px 25px rgba(0, 201, 167, 0.35);
    border: 1.5px solid rgba(255, 255, 255, 0.2);
  }}

  .title {{
    font-size: 32px;
    font-weight: 900;
    color: #FFFFFF;
  }}

  .headline {{
    font-size: 42px;
    font-weight: 900;
    line-height: 1.1;
    letter-spacing: -1px;
    margin-bottom: 14px;
  }}

  .headline-gradient {{
    background: linear-gradient(135deg, #00C9A7 0%, #00F2FE 45%, #FFD166 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }}

  .sub {{
    font-size: 15px;
    line-height: 1.45;
    color: #94A3B8;
    margin-bottom: 22px;
  }}

  .pills {{
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }}

  .pill {{
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 11px;
    font-weight: 700;
    color: #F1F5F9;
  }}

  .right-phones {{
    flex: 1;
    position: relative;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }}

  .phone-main {{
    width: 270px;
    height: 550px;
    border-radius: 38px;
    background: #000000;
    border: 7px solid #333842;
    box-shadow: 0 30px 70px rgba(0, 0, 0, 0.9), 0 0 50px rgba(0, 201, 167, 0.3);
    overflow: hidden;
    position: absolute;
    right: 130px;
    top: 35px;
    transform: rotate(-6deg);
    z-index: 5;
  }}

  .phone-sec {{
    width: 250px;
    height: 510px;
    border-radius: 34px;
    background: #000000;
    border: 6px solid #282C35;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
    overflow: hidden;
    position: absolute;
    right: 10px;
    top: 60px;
    transform: rotate(8deg);
    z-index: 2;
    filter: brightness(0.85);
  }}

  .phone-img {{
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
  }}
</style>
</head>
<body>
  <div class="left-content">
    <div class="badge">⚡ Apple Search Ads Creative</div>
    <div class="brand-row">
      <img src="{icon_b64}" class="icon" alt="StackUp" />
      <div>
        <div class="title">StackUp</div>
        <div style="font-size: 13px; color: #94A3B8; font-weight: 600;">#1 Tip Tracker on App Store</div>
      </div>
    </div>
    <div class="headline">
      TRACK EVERY TIP.<br>
      <span class="headline-gradient">STACK YOUR CASH.</span>
    </div>
    <div class="sub">
      Pre-tax payday estimates, AI Golden Shift advisor, real-time hourly wages, and 2026 "No Tax on Tips" relief gauge.
    </div>
    <div class="pills">
      <div class="pill">💰 Payday Check Estimator</div>
      <div class="pill">👑 "Golden Shift" Matrix</div>
      <div class="pill">🏛️ 2026 Tax Relief</div>
    </div>
  </div>

  <div class="right-phones">
    <div class="phone-sec">
      <img src="{analytics_b64}" class="phone-img" alt="Analytics" />
    </div>
    <div class="phone-main">
      <img src="{home_b64}" class="phone-img" alt="Home Screen" />
    </div>
  </div>
</body>
</html>"""

print("Rendering Asset 1: Header 16x9 (1920x1080)...")
render_html_to_png(
    HEADER_16X9_HTML,
    os.path.join(DESKTOP_DIR, "01_AppStore_ProductPage_Header_16x9_1920x1080.png"),
    1920,
    1080
)

print("Rendering Asset 2: Ultra-Wide Header (4320x1080)...")
render_html_to_png(
    HEADER_ULTRAWIDE_HTML,
    os.path.join(DESKTOP_DIR, "02_AppStore_ProductPage_Header_Banner_4320x1080.png"),
    4320,
    1080
)

print("Rendering Asset 3: Search Results Showcase (1920x1080)...")
render_html_to_png(
    SEARCH_RESULTS_SHOWCASE_HTML,
    os.path.join(DESKTOP_DIR, "03_AppStore_SearchResults_Showcase_1920x1080.png"),
    1920,
    1080
)

print("Rendering Asset 4: Search Results Ad Card (1200x628)...")
render_html_to_png(
    SEARCH_CARD_1200X628_HTML,
    os.path.join(DESKTOP_DIR, "04_AppStore_SearchResults_Card_1200x628.png"),
    1200,
    628
)

print("All App Store product assets successfully generated and saved to Desktop & Brain artifacts!")
