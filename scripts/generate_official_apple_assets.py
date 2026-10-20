#!/usr/bin/env python3
import os
import base64
import subprocess
import shutil

DESKTOP_DIR = "/Users/tavarus/Desktop/StackUp_AppStore_Product_Assets"
ARTIFACT_DIR = "/Users/tavarus/.gemini/antigravity/brain/ef7e9963-21a9-44fa-9999-f918e06967e5"
CHROME_BIN = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SCRATCH_DIR = "/Users/tavarus/.gemini/antigravity/scratch/tipstack/scripts/temp_apple_assets"

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
    
    # Verify dimensions with sips
    sips_out = subprocess.check_output(["sips", "-g", "pixelWidth", "-g", "pixelHeight", output_png_path]).decode()
    print(f"Verified {os.path.basename(output_png_path)}: {sips_out.strip()}")
    
    # Also copy to artifact directory
    artifact_copy = os.path.join(ARTIFACT_DIR, os.path.basename(output_png_path))
    shutil.copyfile(output_png_path, artifact_copy)

# ==============================================================================
# TEMPLATE 1: Header 16:9 (Base 1920 x 1080 -> Scaled to 5244 x 2950)
# ==============================================================================
def get_header_16x9_html(target_w=5244, target_h=2950):
    scale = target_w / 1920.0
    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    width: {target_w}px;
    height: {target_h}px;
    background: #06080D;
    overflow: hidden;
    position: relative;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
  }}

  .viewport-scale {{
    width: 1920px;
    height: 1080px;
    transform: scale({scale});
    transform-origin: 0 0;
    position: absolute;
    top: 0;
    left: 0;
    background: #06080D;
    background-image:
      radial-gradient(circle at 75% 35%, rgba(0, 201, 167, 0.24) 0%, rgba(0, 242, 254, 0.12) 35%, rgba(6, 8, 13, 0) 70%),
      radial-gradient(circle at 25% 75%, rgba(255, 209, 102, 0.15) 0%, rgba(6, 8, 13, 0) 55%),
      linear-gradient(180deg, #070A10 0%, #05070B 100%);
    color: #FFFFFF;
    display: flex;
    overflow: hidden;
  }}

  .grid-bg {{
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background-image: 
      linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 60px 60px;
    pointer-events: none;
  }}

  .orb-teal {{
    position: absolute;
    width: 600px; height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(0, 201, 167, 0.25) 0%, rgba(0, 201, 167, 0) 70%);
    top: -100px; right: 200px;
    pointer-events: none;
  }}

  .left-col {{
    width: 980px;
    padding: 90px 40px 90px 100px;
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
    margin-bottom: 24px;
    align-self: flex-start;
  }}

  .app-identity {{
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 24px;
  }}

  .app-icon {{
    width: 88px; height: 88px;
    border-radius: 20px;
    box-shadow: 0 12px 30px rgba(0, 201, 167, 0.35);
    border: 1.5px solid rgba(255, 255, 255, 0.2);
  }}

  .app-name {{
    font-size: 46px;
    font-weight: 900;
    letter-spacing: -0.5px;
    color: #FFFFFF;
  }}

  .app-tagline {{
    font-size: 16px;
    color: #94A3B8;
    font-weight: 600;
    margin-top: 2px;
  }}

  .headline {{
    font-size: 56px;
    font-weight: 900;
    line-height: 1.08;
    letter-spacing: -1.5px;
    margin-bottom: 20px;
  }}

  .headline-gradient {{
    background: linear-gradient(135deg, #00C9A7 0%, #00F2FE 50%, #FFD166 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }}

  .subhead {{
    font-size: 18px;
    line-height: 1.5;
    color: #94A3B8;
    margin-bottom: 30px;
    max-width: 760px;
  }}

  .pills-grid {{
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 36px;
  }}

  .pill {{
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 10px;
    padding: 10px 18px;
    font-size: 14px;
    font-weight: 700;
    color: #E2E8F0;
    display: flex;
    align-items: center;
    gap: 8px;
  }}

  .rating-row {{
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: auto;
  }}

  .stars {{
    color: #FFD166;
    font-size: 20px;
    letter-spacing: 2px;
  }}

  .rating-text {{
    font-size: 14px;
    font-weight: 700;
    color: #FFFFFF;
  }}

  .rating-sub {{
    font-size: 14px;
    color: #64748B;
  }}

  .right-col {{
    flex: 1;
    position: relative;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }}

  .phone-back {{
    position: absolute;
    width: 380px; height: 750px;
    border-radius: 52px;
    background: #000000;
    border: 10px solid #282C35;
    box-shadow: 0 40px 90px rgba(0, 0, 0, 0.85);
    overflow: hidden;
    right: 40px; top: 150px;
    transform: rotate(8deg) scale(0.95);
    z-index: 1;
    filter: brightness(0.85);
  }}

  .phone-front {{
    position: absolute;
    width: 410px; height: 810px;
    border-radius: 56px;
    background: #000000;
    border: 10px solid #333842;
    box-shadow: 0 50px 120px rgba(0, 0, 0, 0.95), 0 0 70px rgba(0, 201, 167, 0.35);
    overflow: hidden;
    right: 170px; top: 110px;
    transform: rotate(-4deg);
    z-index: 5;
  }}

  .phone-screen {{
    width: 100%; height: 100%;
    object-fit: cover;
    object-position: top center;
  }}

  .floating-card {{
    position: absolute;
    background: rgba(18, 24, 38, 0.88);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 18px;
    padding: 14px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    box-shadow: 0 20px 45px rgba(0, 0, 0, 0.6);
    z-index: 10;
  }}

  .card-1 {{
    top: 100px;
    right: 520px;
    border-color: rgba(0, 201, 167, 0.4);
  }}

  .card-2 {{
    bottom: 80px;
    right: 420px;
    border-color: rgba(255, 209, 102, 0.4);
  }}

  .card-3 {{
    top: 440px;
    right: 20px;
    border-color: rgba(0, 230, 118, 0.4);
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
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #94A3B8;
  }}

  .card-value {{
    font-size: 22px;
    font-weight: 900;
    color: #FFFFFF;
    margin-top: 1px;
  }}

  .card-sub {{
    font-size: 11px;
    font-weight: 700;
    color: #00E676;
    margin-top: 1px;
  }}
</style>
</head>
<body>
  <div class="viewport-scale">
    <div class="grid-bg"></div>
    <div class="orb-teal"></div>

    <div class="left-col">
      <div class="badge-tag">⚡ #1 SHIFT & TIP TRACKING INTELLIGENCE</div>
      <div class="app-identity">
        <img src="{icon_b64}" class="app-icon" alt="StackUp Icon" />
        <div>
          <div class="app-name">StackUp</div>
          <div class="app-tagline">Smart Tip Tracker • Built for Hospitality Pros</div>
        </div>
      </div>
      <div class="headline">
        TRACK EVERY TIP.<br>
        <span class="headline-gradient">STACK YOUR CASH.</span>
      </div>
      <div class="subhead">
        Real-time hourly wage analytics, automated pre-tax payday estimates, AI "Golden Shift" discovery, and 2026 "No Tax on Tips" relief calculator.
      </div>
      <div class="pills-grid">
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

    <div class="right-col">
      <div class="phone-back">
        <img src="{analytics_b64}" class="phone-screen" alt="Analytics Screen" />
      </div>
      <div class="phone-front">
        <img src="{home_b64}" class="phone-screen" alt="Home Screen" />
      </div>

      <div class="floating-card card-1">
        <div class="card-icon">💰</div>
        <div class="card-info">
          <span class="card-label">Estimated Payday Check</span>
          <span class="card-value">$1,845.50</span>
          <span class="card-sub">Base Wages + Tips Pre-Tax</span>
        </div>
      </div>

      <div class="floating-card card-2">
        <div class="card-icon">👑</div>
        <div class="card-info">
          <span class="card-label">Your Golden Shift</span>
          <span class="card-value">Friday Nights</span>
          <span class="card-sub" style="color: #FFD166;">Avg $48.20 / Hour</span>
        </div>
      </div>

      <div class="floating-card card-3">
        <div class="card-icon">🪙</div>
        <div class="card-info">
          <span class="card-label">Cash Take-Home</span>
          <span class="card-value">+$340.00</span>
          <span class="card-sub">Instant Cash in Pocket</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>"""

# ==============================================================================
# TEMPLATE 2: Header Ultra-Wide Banner (3840 x 1646)
# ==============================================================================
def get_header_banner_3840x1646_html():
    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    width: 3840px;
    height: 1646px;
    background: #06080D;
    overflow: hidden;
    position: relative;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
  }}

  .viewport-scale {{
    width: 1920px;
    height: 823px;
    transform: scale(2.0);
    transform-origin: 0 0;
    position: absolute;
    top: 0;
    left: 0;
    background: #06080D;
    background-image:
      radial-gradient(circle at 65% 35%, rgba(0, 201, 167, 0.26) 0%, rgba(0, 242, 254, 0.12) 35%, rgba(6, 8, 13, 0) 70%),
      radial-gradient(circle at 20% 65%, rgba(255, 209, 102, 0.16) 0%, rgba(6, 8, 13, 0) 55%),
      linear-gradient(180deg, #070A10 0%, #05070B 100%);
    color: #FFFFFF;
    display: flex;
    overflow: hidden;
    padding: 0 70px;
    align-items: center;
  }}

  .grid-bg {{
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background-image: 
      linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 50px 50px;
    pointer-events: none;
  }}

  /* Left Brand Section */
  .brand-col {{
    width: 780px;
    display: flex;
    flex-direction: column;
    z-index: 10;
  }}

  .badge-tag {{
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(0, 201, 167, 0.12);
    border: 1.5px solid rgba(0, 201, 167, 0.4);
    border-radius: 999px;
    padding: 7px 18px;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #00C9A7;
    margin-bottom: 18px;
    align-self: flex-start;
  }}

  .app-identity {{
    display: flex;
    align-items: center;
    gap: 18px;
    margin-bottom: 16px;
  }}

  .app-icon {{
    width: 76px; height: 76px;
    border-radius: 18px;
    box-shadow: 0 12px 30px rgba(0, 201, 167, 0.35);
    border: 1.5px solid rgba(255, 255, 255, 0.25);
  }}

  .app-name {{
    font-size: 42px;
    font-weight: 900;
    letter-spacing: -0.5px;
    color: #FFFFFF;
  }}

  .app-tagline {{
    font-size: 15px;
    font-weight: 600;
    color: #94A3B8;
    margin-top: 2px;
  }}

  .headline {{
    font-size: 50px;
    font-weight: 900;
    line-height: 1.05;
    letter-spacing: -1.5px;
    margin-bottom: 14px;
  }}

  .headline-gradient {{
    background: linear-gradient(135deg, #00C9A7 0%, #00F2FE 45%, #FFD166 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }}

  .subhead {{
    font-size: 15px;
    line-height: 1.45;
    color: #94A3B8;
    margin-bottom: 22px;
    max-width: 660px;
  }}

  .pills-row {{
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 24px;
  }}

  .pill {{
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 10px;
    padding: 8px 14px;
    font-size: 12px;
    font-weight: 700;
    color: #FFFFFF;
  }}

  .rating-strip {{
    display: flex;
    align-items: center;
    gap: 10px;
  }}

  .stars {{
    color: #FFD166;
    font-size: 18px;
    letter-spacing: 2px;
  }}

  .rating-label {{
    font-size: 13px;
    font-weight: 700;
    color: #E2E8F0;
  }}

  /* Center Device Triple Showcase */
  .device-section {{
    flex: 1;
    height: 100%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
  }}

  .phone-card {{
    width: 250px;
    height: 520px;
    border-radius: 38px;
    background: #000000;
    border: 7px solid #333842;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.85);
    overflow: hidden;
    position: relative;
    flex-shrink: 0;
  }}

  .phone-1 {{
    transform: translateY(15px) rotate(-4deg);
    border-color: rgba(0, 201, 167, 0.5);
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.85), 0 0 40px rgba(0, 201, 167, 0.25);
  }}

  .phone-2 {{
    transform: translateY(-10px) scale(1.05);
    z-index: 5;
    border-color: rgba(255, 255, 255, 0.4);
    box-shadow: 0 35px 80px rgba(0, 0, 0, 0.95), 0 0 50px rgba(0, 242, 254, 0.3);
  }}

  .phone-3 {{
    transform: translateY(20px) rotate(4deg);
    border-color: rgba(255, 209, 102, 0.5);
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.85), 0 0 40px rgba(255, 209, 102, 0.25);
  }}

  .phone-screen {{
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
  }}

  /* Right Stats Panel */
  .stats-col {{
    width: 320px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    z-index: 10;
  }}

  .stat-card {{
    background: rgba(18, 24, 38, 0.88);
    backdrop-filter: blur(20px);
    border: 1.5px solid rgba(255, 255, 255, 0.12);
    border-radius: 18px;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6);
  }}

  .stat-icon {{
    font-size: 32px;
  }}

  .stat-title {{
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #94A3B8;
  }}

  .stat-num {{
    font-size: 24px;
    font-weight: 900;
    color: #FFFFFF;
    margin-top: 2px;
  }}

  .stat-sub {{
    font-size: 11px;
    font-weight: 700;
    color: #00E676;
    margin-top: 1px;
  }}
</style>
</head>
<body>
  <div class="viewport-scale">
    <div class="grid-bg"></div>

    <div class="brand-col">
      <div class="badge-tag">⚡ Apple App Store Featured Product Page</div>
      <div class="app-identity">
        <img src="{icon_b64}" class="app-icon" alt="StackUp Icon" />
        <div>
          <div class="app-name">StackUp</div>
          <div class="app-tagline">Smart Shift & Tip Intelligence • iOS 18+</div>
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
      <div class="rating-strip">
        <span class="stars">★★★★★</span>
        <span class="rating-label">5.0 Star Rating • Trusted by 10,000+ Servers & Bartenders</span>
      </div>
    </div>

    <div class="device-section">
      <div class="phone-card phone-1">
        <img src="{home_b64}" class="phone-screen" alt="Home Screen" />
      </div>
      <div class="phone-card phone-2">
        <img src="{analytics_b64}" class="phone-screen" alt="Shift Intelligence" />
      </div>
      <div class="phone-card phone-3">
        <img src="{tax_b64}" class="phone-screen" alt="Tax Intelligence" />
      </div>
    </div>

    <div class="stats-col">
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
      <div class="stat-card" style="border-color: rgba(0, 242, 254, 0.4);">
        <div class="stat-icon">🏛️</div>
        <div>
          <div class="stat-title">2026 IRS Tax Relief Gauge</div>
          <div class="stat-num">+$2,480.00</div>
          <div class="stat-sub">Estimated Annual Exemption</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>"""

# ==============================================================================
# TEMPLATE 3: Search Results Showcase 16:9 (Scaled to 5244 x 2950)
# ==============================================================================
def get_search_results_16x9_html(target_w=5244, target_h=2950):
    scale = target_w / 1920.0
    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    width: {target_w}px;
    height: {target_h}px;
    background: #000000;
    overflow: hidden;
    position: relative;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
  }}

  .viewport-scale {{
    width: 1920px;
    height: 1080px;
    transform: scale({scale});
    transform-origin: 0 0;
    position: absolute;
    top: 0;
    left: 0;
    background: #050608;
    color: #FFFFFF;
    display: flex;
    flex-direction: column;
    padding: 36px 60px;
  }}

  .search-nav {{
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 24px;
  }}

  .search-input-box {{
    flex: 1;
    background: #1C1C1E;
    border-radius: 12px;
    height: 52px;
    display: flex;
    align-items: center;
    padding: 0 20px;
    gap: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }}

  .search-icon {{
    font-size: 20px;
    color: #8E8E93;
  }}

  .search-query {{
    font-size: 18px;
    font-weight: 500;
    color: #FFFFFF;
  }}

  .search-cancel {{
    font-size: 18px;
    color: #0A84FF;
    font-weight: 600;
  }}

  .listing-card {{
    background: #12141A;
    border-radius: 28px;
    padding: 28px 32px 24px 32px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
    display: flex;
    flex-direction: column;
    flex: 1;
  }}

  .listing-header {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }}

  .listing-app-info {{
    display: flex;
    align-items: center;
    gap: 22px;
  }}

  .app-icon {{
    width: 96px; height: 96px;
    border-radius: 22px;
    box-shadow: 0 10px 25px rgba(0, 201, 167, 0.4);
    border: 1.5px solid rgba(255, 255, 255, 0.2);
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
  <div class="viewport-scale">
    <div class="search-nav">
      <div class="search-input-box">
        <span class="search-icon">🔍</span>
        <span class="search-query">tip tracker for servers & bartenders</span>
      </div>
      <div class="search-cancel">Cancel</div>
    </div>

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

      <div class="screens-showcase">
        <div class="screen-column">
          <span class="screen-banner-label" style="color: #00C9A7;">⚡ LIVE SHIFT LOGGING</span>
          <div class="screen-banner-title">Track Cash & Credit Tips</div>
          <div class="mini-phone">
            <img src="{home_b64}" class="mini-phone-screen" alt="Home Dashboard" />
          </div>
        </div>

        <div class="screen-column" style="border-color: rgba(255, 209, 102, 0.3); background: #1B1E2B;">
          <span class="screen-banner-label" style="color: #FFD166;">🏆 AI PEAK PERFORMANCE</span>
          <div class="screen-banner-title">"Golden Shift" Matrix</div>
          <div class="mini-phone" style="border-color: #4A4535;">
            <img src="{analytics_b64}" class="mini-phone-screen" alt="Analytics Matrix" />
          </div>
        </div>

        <div class="screen-column">
          <span class="screen-banner-label" style="color: #00E676;">💰 PRE-TAX GROSS EARNINGS</span>
          <div class="screen-banner-title">Estimated Payday Check</div>
          <div class="mini-phone">
            <img src="{tax_b64}" class="mini-phone-screen" alt="Tax & Payday" />
          </div>
        </div>
      </div>

      <div class="trust-strip">
        <div class="trust-item"><span>⚡</span> Instant Cash in Pocket vs. Credit Paycheck</div>
        <div class="trust-item"><span>🏢</span> Multi-Workplace Base Wage Calibration</div>
        <div class="trust-item"><span>🏛️</span> 2026 "No Tax on Tips" Relief Gauge</div>
        <div class="trust-item"><span>📄</span> One-Tap CSV & Tax Export</div>
      </div>
    </div>
  </div>
</body>
</html>"""

# ==============================================================================
# TEMPLATE 4: Search Results 3:2 Ratio (Base 1920 x 1280 -> 1x and 2x for 3840 x 2560)
# ==============================================================================
def get_search_results_3x2_html(target_w=1920, target_h=1280):
    scale = target_w / 1920.0
    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    width: {target_w}px;
    height: {target_h}px;
    background: #000000;
    overflow: hidden;
    position: relative;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
  }}

  .viewport-scale {{
    width: 1920px;
    height: 1280px;
    transform: scale({scale});
    transform-origin: 0 0;
    position: absolute;
    top: 0;
    left: 0;
    background: #050608;
    color: #FFFFFF;
    display: flex;
    flex-direction: column;
    padding: 40px 60px;
  }}

  .search-nav {{
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 24px;
  }}

  .search-input-box {{
    flex: 1;
    background: #1C1C1E;
    border-radius: 14px;
    height: 56px;
    display: flex;
    align-items: center;
    padding: 0 22px;
    gap: 14px;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }}

  .search-icon {{
    font-size: 22px;
    color: #8E8E93;
  }}

  .search-query {{
    font-size: 20px;
    font-weight: 500;
    color: #FFFFFF;
  }}

  .search-cancel {{
    font-size: 20px;
    color: #0A84FF;
    font-weight: 600;
  }}

  .listing-card {{
    background: #12141A;
    border-radius: 32px;
    padding: 32px 36px 28px 36px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 25px 70px rgba(0, 0, 0, 0.85);
    display: flex;
    flex-direction: column;
    flex: 1;
  }}

  .listing-header {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
  }}

  .listing-app-info {{
    display: flex;
    align-items: center;
    gap: 24px;
  }}

  .app-icon {{
    width: 104px; height: 104px;
    border-radius: 24px;
    box-shadow: 0 12px 30px rgba(0, 201, 167, 0.4);
    border: 1.5px solid rgba(255, 255, 255, 0.2);
  }}

  .app-titles {{
    display: flex;
    flex-direction: column;
  }}

  .app-name {{
    font-size: 34px;
    font-weight: 800;
    color: #FFFFFF;
    letter-spacing: -0.3px;
  }}

  .app-subtitle {{
    font-size: 18px;
    color: #8E8E93;
    font-weight: 500;
    margin-top: 4px;
  }}

  .app-meta-row {{
    display: flex;
    align-items: center;
    gap: 18px;
    margin-top: 10px;
  }}

  .stars-row {{
    display: flex;
    align-items: center;
    gap: 6px;
  }}

  .stars {{
    color: #FFD166;
    font-size: 16px;
    letter-spacing: 1px;
  }}

  .rating-score {{
    font-size: 15px;
    font-weight: 700;
    color: #8E8E93;
  }}

  .badge-category {{
    background: rgba(255, 255, 255, 0.08);
    padding: 4px 12px;
    border-radius: 7px;
    font-size: 13px;
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
    font-size: 18px;
    font-weight: 800;
    padding: 14px 40px;
    border-radius: 999px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 4px 20px rgba(10, 132, 255, 0.4);
  }}

  .in-app-text {{
    font-size: 12px;
    color: #8E8E93;
  }}

  /* 3-Screenshot Showcase Container (Taller in 3:2 aspect ratio!) */
  .screens-showcase {{
    display: flex;
    justify-content: space-between;
    gap: 24px;
    margin-top: 4px;
  }}

  .screen-column {{
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #1A1D26;
    border-radius: 24px;
    padding: 16px 16px 0 16px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    overflow: hidden;
    position: relative;
  }}

  .screen-banner-label {{
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    margin-bottom: 2px;
  }}

  .screen-banner-title {{
    font-size: 18px;
    font-weight: 900;
    color: #FFFFFF;
    margin-bottom: 10px;
    text-align: center;
  }}

  .mini-phone {{
    width: 380px;
    height: 660px;
    border-top-left-radius: 36px;
    border-top-right-radius: 36px;
    background: #000000;
    border-top: 8px solid #333842;
    border-left: 8px solid #333842;
    border-right: 8px solid #333842;
    overflow: hidden;
    position: relative;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.85);
  }}

  .mini-phone-screen {{
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
  }}

  .trust-strip {{
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding-top: 16px;
    margin-top: 14px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }}

  .trust-item {{
    font-size: 14px;
    font-weight: 700;
    color: #94A3B8;
    display: flex;
    align-items: center;
    gap: 8px;
  }}
</style>
</head>
<body>
  <div class="viewport-scale">
    <div class="search-nav">
      <div class="search-input-box">
        <span class="search-icon">🔍</span>
        <span class="search-query">tip tracker for servers & bartenders</span>
      </div>
      <div class="search-cancel">Cancel</div>
    </div>

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

      <div class="screens-showcase">
        <div class="screen-column">
          <span class="screen-banner-label" style="color: #00C9A7;">⚡ LIVE SHIFT LOGGING</span>
          <div class="screen-banner-title">Track Cash & Credit Tips</div>
          <div class="mini-phone">
            <img src="{home_b64}" class="mini-phone-screen" alt="Home Dashboard" />
          </div>
        </div>

        <div class="screen-column" style="border-color: rgba(255, 209, 102, 0.3); background: #1B1E2B;">
          <span class="screen-banner-label" style="color: #FFD166;">🏆 AI PEAK PERFORMANCE</span>
          <div class="screen-banner-title">"Golden Shift" Matrix</div>
          <div class="mini-phone" style="border-color: #4A4535;">
            <img src="{analytics_b64}" class="mini-phone-screen" alt="Analytics Matrix" />
          </div>
        </div>

        <div class="screen-column">
          <span class="screen-banner-label" style="color: #00E676;">💰 PRE-TAX GROSS EARNINGS</span>
          <div class="screen-banner-title">Estimated Payday Check</div>
          <div class="mini-phone">
            <img src="{tax_b64}" class="mini-phone-screen" alt="Tax & Payday" />
          </div>
        </div>
      </div>

      <div class="trust-strip">
        <div class="trust-item"><span>⚡</span> Instant Cash in Pocket vs. Credit Paycheck</div>
        <div class="trust-item"><span>🏢</span> Multi-Workplace Base Wage Calibration</div>
        <div class="trust-item"><span>🏛️</span> 2026 "No Tax on Tips" Relief Gauge</div>
        <div class="trust-item"><span>📄</span> One-Tap CSV & Tax Export</div>
      </div>
    </div>
  </div>
</body>
</html>"""

# ==============================================================================
# EXECUTE RENDERS FOR ALL EXACT SIZES REQUESTED BY USER
# ==============================================================================

print("\n--- 1/5: Rendering Header (5244 x 2950) ---")
render_html_to_png(
    get_header_16x9_html(5244, 2950),
    os.path.join(DESKTOP_DIR, "Header_5244x2950.png"),
    5244, 2950
)

print("\n--- 2/5: Rendering Header Banner (3840 x 1646) ---")
render_html_to_png(
    get_header_banner_3840x1646_html(),
    os.path.join(DESKTOP_DIR, "Header_3840x1646.png"),
    3840, 1646
)

print("\n--- 3/5: Rendering Search Results (5244 x 2950) ---")
render_html_to_png(
    get_search_results_16x9_html(5244, 2950),
    os.path.join(DESKTOP_DIR, "SearchResults_5244x2950.png"),
    5244, 2950
)

print("\n--- 4/5: Rendering Search Results (3840 x 2560) ---")
render_html_to_png(
    get_search_results_3x2_html(3840, 2560),
    os.path.join(DESKTOP_DIR, "SearchResults_3840x2560.png"),
    3840, 2560
)

print("\n--- 5/5: Rendering Search Results (1920 x 1280) ---")
render_html_to_png(
    get_search_results_3x2_html(1920, 1280),
    os.path.join(DESKTOP_DIR, "SearchResults_1920x1280.png"),
    1920, 1280
)

print("\n✅ All 5 official Apple App Store sizes successfully generated!")
