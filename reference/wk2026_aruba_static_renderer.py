import pandas as pd
import math, html, os, textwrap, re, zipfile
from pathlib import Path
import cairosvg
from PIL import Image

CSV = Path('/mnt/data/world_cup_2026_master_schedule_aruba_time_data.csv')
OUT = Path('/mnt/data/wk2026_aruba_design_outputs')
OUT.mkdir(exist_ok=True)

W, H = 3840, 2160
M = 72
TOP = 176
FOOT = 84
GAP = 28
BG = '#07111f'
PANEL = '#0d1828'
PANEL2 = '#111f33'
TEXT = '#f3f7fb'
MUTED = '#9fb0c4'
DIM = '#6d7d91'
STROKE = '#22364f'
WHITE = '#ffffff'
ACCENTS = ['#18c4a3','#ff5a7d','#f6c945','#56a6ff','#ff8a3d','#26b7b1','#8f7cff','#47d7bd','#6d79ff','#ef8f8f','#ed4fa3','#d81b60']
STAGE_COL = {'Round of 32':'#ff9f43','Round of 16':'#39d7ff','Quarter-final':'#ffd95a','Semi-final':'#b493ff','Final':'#ffcf33','Bronze Final':'#c28954'}

flag_specs = {
 'MEX': [('v','#006847','#ffffff','#ce1126')], 'RSA':[('h','#e03c31','#ffffff','#007a4d','#002395','#ffb81c')],
 'KOR':[('h','#ffffff','#ffffff','#ffffff')], 'CZE':[('h','#ffffff','#d7141a','#11457e')], 'CAN':[('v','#d52b1e','#ffffff','#d52b1e')],
 'BIH':[('v','#002f6c','#fcd116','#002f6c')], 'QAT':[('v','#8a1538','#ffffff','#8a1538')], 'SUI':[('h','#d52b1e','#d52b1e','#d52b1e')],
 'BRA':[('h','#009b3a','#ffdf00','#002776')], 'MAR':[('h','#c1272d','#c1272d','#006233')], 'HAI':[('h','#00209f','#d21034')], 'SCO':[('h','#005eb8','#ffffff','#005eb8')],
 'USA':[('h','#b22234','#ffffff','#3c3b6e')], 'PAR':[('h','#d52b1e','#ffffff','#0038a8')], 'AUS':[('h','#012169','#012169','#ffffff')], 'TUR':[('h','#e30a17','#e30a17','#ffffff')],
 'GER':[('h','#000000','#dd0000','#ffce00')], 'CUW':[('h','#002b7f','#f9e814','#002b7f')], 'CIV':[('v','#f77f00','#ffffff','#009e60')], 'ECU':[('h','#ffdd00','#034ea2','#ed1c24')],
 'NED':[('h','#ae1c28','#ffffff','#21468b')], 'JPN':[('h','#ffffff','#bc002d','#ffffff')], 'SWE':[('h','#006aa7','#fecc00','#006aa7')], 'TUN':[('h','#e70013','#ffffff','#e70013')],
 'BEL':[('v','#000000','#fae042','#ed2939')], 'EGY':[('h','#ce1126','#ffffff','#000000')], 'IRN':[('h','#239f40','#ffffff','#da0000')], 'NZL':[('h','#00247d','#00247d','#cc142b')],
 'ESP':[('h','#aa151b','#f1bf00','#aa151b')], 'CPV':[('h','#003893','#ffffff','#cf2027','#f7d116')], 'KSA':[('h','#006c35','#006c35','#ffffff')], 'URU':[('h','#ffffff','#0038a8','#ffffff')],
 'FRA':[('v','#0055a4','#ffffff','#ef4135')], 'SEN':[('v','#00853f','#fdef42','#e31b23')], 'IRQ':[('h','#ce1126','#ffffff','#000000')], 'NOR':[('h','#ba0c2f','#ffffff','#00205b')],
 'ARG':[('h','#74acdf','#ffffff','#74acdf')], 'ALG':[('v','#006233','#ffffff','#d21034')], 'AUT':[('h','#ed2939','#ffffff','#ed2939')], 'JOR':[('h','#000000','#ffffff','#007a3d','#ce1126')],
 'POR':[('v','#006600','#ff0000')], 'COD':[('h','#00a3e0','#f7d618','#ce1021')], 'UZB':[('h','#0099b5','#ffffff','#1eb53a')], 'COL':[('h','#fcd116','#003893','#ce1126')],
 'ENG':[('h','#ffffff','#cf142b','#ffffff')], 'CRO':[('h','#ff0000','#ffffff','#171796')], 'GHA':[('h','#ce1126','#fcd116','#006b3f')], 'PAN':[('h','#ffffff','#d21034','#005293')]
}

df = pd.read_csv(CSV)
# normalize strings
for col in df.columns:
    if df[col].dtype == object:
        df[col] = df[col].fillna('').astype(str)

def esc(s): return html.escape(str(s), quote=True)

def fmt_date(s):
    return s.replace('Thu','Thu').replace('Fri','Fri')

def venue_short(venue, city):
    v = venue.replace(' Stadium','').replace('New York New Jersey Stadium','NY/NJ').replace('San Francisco Bay Area Stadium','SF Bay Area')
    v = v.replace('Estadio ','').replace('BC Place Vancouver','BC Place')
    if len(v) > 25:
        v = v[:24] + '…'
    return v

def wrap(text, width):
    return textwrap.shorten(str(text), width=width, placeholder='…')

def svg_text(x,y,text,size=24,fill=TEXT,weight=500,anchor='start',opacity=1,cls='',font='Inter, Lato, Arial, sans-serif'):
    return f'<text x="{x:.1f}" y="{y:.1f}" fill="{fill}" font-size="{size}" font-weight="{weight}" text-anchor="{anchor}" opacity="{opacity}" class="{cls}" font-family="{font}">{esc(text)}</text>'

def rect(x,y,w,h,fill,stroke='none',sw=1,rx=0,opacity=1):
    return f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx:.1f}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" opacity="{opacity}"/>'

def line(x1,y1,x2,y2,stroke=STROKE,sw=2,opacity=1):
    return f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{stroke}" stroke-width="{sw}" opacity="{opacity}"/>'

def flag_svg(code, x, y, w=28, h=18, r=4):
    specs = flag_specs.get(code, [('h','#243b55','#2f80ed','#22c55e')])[0]
    orient = specs[0]; cols = specs[1:]
    out = [rect(x,y,w,h,'#102136','#3a516d',1,r)]
    clip_id = f'clip_{code}_{int(x)}_{int(y)}'.replace('.','_')
    out.append(f'<clipPath id="{clip_id}"><rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{r:.1f}"/></clipPath>')
    if orient == 'v':
        n=len(cols); ww=w/n
        for i,c in enumerate(cols): out.append(f'<rect x="{x+i*ww:.1f}" y="{y:.1f}" width="{ww+0.5:.1f}" height="{h:.1f}" fill="{c}" clip-path="url(#{clip_id})"/>')
    else:
        n=len(cols); hh=h/n
        for i,c in enumerate(cols): out.append(f'<rect x="{x:.1f}" y="{y+i*hh:.1f}" width="{w:.1f}" height="{hh+0.5:.1f}" fill="{c}" clip-path="url(#{clip_id})"/>')
    out.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{r:.1f}" fill="none" stroke="#ffffff" stroke-opacity="0.35"/>')
    return ''.join(out)

# group teams from group stage
teams_by_group = {}
for g, gdf in df[df.stage=='Group Stage'].groupby('group'):
    teams = {}
    for _,r in gdf.iterrows():
        teams[r.team_1_code] = r.team_1_name
        teams[r.team_2_code] = r.team_2_name
    teams_by_group[g] = list(teams.items())

def match_label(r, maxname=13):
    t1 = r.team_1_code if r.team_1_code else r.slot_1
    t2 = r.team_2_code if r.team_2_code else r.slot_2
    if r.status == 'completed' and r.score:
        return f'{t1} {r.score} {t2}'
    return f'{t1} v {t2}'

parts=[]
parts.append(f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#07111f"/><stop offset="60%" stop-color="#0b1727"/><stop offset="100%" stop-color="#10101d"/></linearGradient>
  <radialGradient id="glow" cx="68%" cy="5%" r="80%"><stop offset="0%" stop-color="#134e6b" stop-opacity="0.45"/><stop offset="60%" stop-color="#07111f" stop-opacity="0"/></radialGradient>
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000000" flood-opacity="0.24"/></filter>
</defs>
<style>
  .tiny {{ letter-spacing: .02em; }}
  .section {{ letter-spacing: .12em; text-transform: uppercase; }}
</style>
{rect(0,0,W,H,'url(#bg)')}{rect(0,0,W,H,'url(#glow)')}
''')
# top bar
parts.append(rect(M,48,W-2*M,100,'#0e1b2e','#254261',2,26,0.92))
parts.append(svg_text(M+34,104,'WORLD CUP 2026 SCHEDULE',38,'#ffffff',800))
parts.append(svg_text(M+34,137,'Aruba Time | AST / UTC-4 | 24-hour match times',22,'#b9c7d7',500))
parts.append(svg_text(W-M-34,104,'GROUP POOLS + KNOCKOUT BRACKET',28,'#ffffff',700,'end'))
parts.append(svg_text(W-M-34,137,'Version 01 | Data-driven overview | no official FIFA marks',18,'#b9c7d7',500,'end'))
# section headers
left_x, left_y = M, TOP+48
left_w = 2200
right_x = left_x + left_w + 64
right_w = W - right_x - M
parts.append(svg_text(left_x,TOP+10,'GROUP STAGE - 12 POOLS',24,'#85e7d5',800,cls='section'))
parts.append(svg_text(right_x,TOP+10,'KNOCKOUT STAGE - MATCH NUMBER SPINE',24,'#ffca4f',800,cls='section'))

# group cards
cols, rows = 4,3
card_gap_x, card_gap_y = 24,26
card_w = (left_w - card_gap_x*(cols-1))/cols
card_h = 555
row_y = left_y
for idx,g in enumerate(list('ABCDEFGHIJKL')):
    col = idx%cols; row = idx//cols
    x = left_x + col*(card_w+card_gap_x)
    y = row_y + row*(card_h+card_gap_y)
    accent=ACCENTS[idx]
    parts.append(f'<g filter="url(#shadow)">')
    parts.append(rect(x,y,card_w,card_h,PANEL,'#203a55',1.4,24,0.98))
    parts.append(rect(x,y,card_w,52,accent,'none',0,24,1))
    parts.append(rect(x,y+28,card_w,28,accent,'none',0,0,1))
    parts.append(svg_text(x+20,y+35,f'GROUP {g}',24,'#06111f',900))
    parts.append(svg_text(x+card_w-20,y+35,f'1{g}   2{g}   3{g}*',17,'#06111f',800,'end'))
    # teams
    ty=y+78
    for i,(code,name) in enumerate(teams_by_group[g]):
        parts.append(flag_svg(code,x+20,ty-15,30,20,4))
        parts.append(svg_text(x+60,ty,code,17,'#ffffff',800))
        parts.append(svg_text(x+112,ty,wrap(name,24),17,'#d8e3ef',550))
        ty += 28
    # divider
    parts.append(rect(x+18,y+188,card_w-36,1,'#2a415b','none'))
    # matches
    my=y+216
    gmatches=df[(df.stage=='Group Stage') & (df.group==g)].sort_values('match_no')
    for _,r in gmatches.iterrows():
        done = (r.status=='completed')
        row_fill = '#14263c' if done else '#0f1b2d'
        border = '#2e536f' if done else '#263c56'
        parts.append(rect(x+16,my-22,card_w-32,48,row_fill,border,1,10,1))
        parts.append(svg_text(x+28,my-2,f'M{int(r.match_no):02d}',15,'#ffffff',850))
        parts.append(svg_text(x+84,my-2,f'{r.date_ast}  {r.kickoff_ast} AST',14,'#aab9cb',600))
        parts.append(flag_svg(r.team_1_code,x+28,my+8,22,14,3))
        parts.append(svg_text(x+58,my+21,match_label(r),16,'#f5f8fb',780))
        parts.append(svg_text(x+card_w-30,my+21,venue_short(r.venue,r.city),12,'#8395aa',500,'end'))
        my += 54
    parts.append(svg_text(x+20,y+card_h-20,f'Qualifiers: 1{g} | 2{g} | 3{g}*',14,accent,750))
    parts.append('</g>')

# knockout bracket layout
kdf = df[df.stage!='Group Stage'].sort_values('match_no')
rounds = [
    ('Round of 32', list(range(73,89))),
    ('Round of 16', list(range(89,97))),
    ('Quarter-final', list(range(97,101))),
    ('Semi-final', list(range(101,103))),
]
col_w=226
col_gap=35
kx0=right_x
ky_top=left_y+35
ky_bot=left_y+3*card_h+2*card_gap_y-70
# headers
for ci,(name,nums) in enumerate(rounds):
    x=kx0+ci*(col_w+col_gap)
    parts.append(svg_text(x,ky_top-30,name.upper(),18,STAGE_COL[name],850,cls='section'))

# match positions
positions={}
cardh=64
for ci,(name,nums) in enumerate(rounds):
    x=kx0+ci*(col_w+col_gap)
    n=len(nums)
    avail=ky_bot-ky_top
    if n==16:
        gap=14; h=58; start=ky_top
    else:
        h=66
        # align between groups by taking every second/fourth R32 middle
        start=ky_top + (avail/(n*2)) - h/2
        gap=(avail - n*h)/(n-1) if n>1 else 0
    for i,mn in enumerate(nums):
        y=start+i*(h+gap)
        positions[mn]=(x,y,col_w,h)
        r=kdf[kdf.match_no==mn].iloc[0]
        color=STAGE_COL[name]
        parts.append(rect(x,y,col_w,h,'#101d31',color,1.4,12,0.96))
        parts.append(rect(x,y,6,h,color,'none',0,12,1))
        parts.append(svg_text(x+16,y+23,f'M{mn}',16,'#ffffff',850))
        parts.append(svg_text(x+58,y+23,f'{r.date_ast.split()[0]} {r.date_ast.split()[1]} {r.date_ast.split()[2]}  {r.kickoff_ast} AST',12,'#aebed0',600))
        parts.append(svg_text(x+16,y+46,match_label(r),17,'#f8fbff',800))
        parts.append(svg_text(x+col_w-14,y+46,venue_short(r.venue,r.city),11,'#8495aa',500,'end'))
# connectors approximate by winner mapping given in prompt hardcoded pairs based on known bracket path
pairs=[(74,77,89),(73,75,90),(76,78,91),(79,80,92),(83,84,93),(81,82,94),(86,88,95),(85,87,96),(89,90,97),(93,94,98),(91,92,99),(95,96,100),(97,98,101),(99,100,102)]
for a,b,c in pairs:
    if a in positions and b in positions and c in positions:
        xa,ya,wa,ha=positions[a]; xb,yb,wb,hb=positions[b]; xc,yc,wc,hc=positions[c]
        xmid=xa+wa+12
        y1=ya+ha/2; y2=yb+hb/2; yt=yc+hc/2
        parts.append(line(xa+wa,y1,xmid,y1,'#39526c',2,0.8))
        parts.append(line(xb+wb,y2,xmid,y2,'#39526c',2,0.8))
        parts.append(line(xmid,min(y1,y2),xmid,max(y1,y2),'#39526c',2,0.8))
        parts.append(line(xmid,yt,xc,yt,'#39526c',2,0.8))
# finals at far right
fx = kx0+4*(col_w+col_gap)+12
fw = right_x+right_w - fx
if fw < 250:
    fw=250
parts.append(svg_text(fx,ky_top-30,'FINALS',18,'#ffcf33',850,cls='section'))
for label, mn, yy, color in [('FINAL',104,ky_top+520,'#ffcf33'),('BRONZE FINAL',103,ky_top+730,'#c28954')]:
    r=kdf[kdf.match_no==mn].iloc[0]
    h=118 if mn==104 else 90
    parts.append(rect(fx,yy,fw,h,'#121c2f',color,2,18,0.98))
    parts.append(rect(fx,yy,8,h,color,'none',0,18,1))
    parts.append(svg_text(fx+22,yy+30,label,15,color,900,cls='section'))
    parts.append(svg_text(fx+22,yy+62,f'M{mn}  {r.date_ast}  {r.kickoff_ast} AST',18,'#ffffff',800))
    parts.append(svg_text(fx+22,yy+94 if mn==104 else yy+80,match_label(r),26 if mn==104 else 20,'#f8fbff',900))
    parts.append(svg_text(fx+fw-24,yy+h-20,venue_short(r.venue,r.city),14,'#a9b8c9',600,'end'))
# connectors finals
if 101 in positions and 102 in positions:
    x101,y101,w101,h101=positions[101]; x102,y102,w102,h102=positions[102]
    final_mid=ky_top+520+59
    bronze_mid=ky_top+730+45
    xmid=x101+w101+18
    parts.append(line(x101+w101,y101+h101/2,xmid,y101+h101/2,'#546b86',2,0.8))
    parts.append(line(x102+w102,y102+h102/2,xmid,y102+h102/2,'#546b86',2,0.8))
    parts.append(line(xmid,y101+h101/2,xmid,y102+h102/2,'#546b86',2,0.8))
    parts.append(line(xmid,final_mid,fx,final_mid,'#ffcf33',2.6,0.9))
    parts.append(line(xmid,bronze_mid,fx,bronze_mid,'#c28954',2.2,0.8))

# footer
fy=H-96
parts.append(rect(M,fy,W-2*M,48,'#0e1b2e','#243b55',1,14,0.95))
legend='AST = Atlantic Standard Time, UTC-4   |   1A = Group A winner   |   2A = Group A runner-up   |   3A* = third place if among best eight   |   W = winner   |   L = loser'
parts.append(svg_text(M+26,fy+31,legend,17,'#cbd5e1',650))
parts.append(svg_text(W-M-26,fy+31,'Source: structured FIFA schedule seed. Verify live results before publication.',15,'#8092a7',500,'end'))

parts.append('</svg>')
svg=''.join(parts)
svg_path=OUT/'wk2026_aruba_master_overview.svg'
svg_path.write_text(svg,encoding='utf-8')
# Render high-res PNG/PDF
png_path=OUT/'wk2026_aruba_master_overview_3840x2160.png'
pdf_path=OUT/'wk2026_aruba_master_overview.pdf'
cairosvg.svg2png(bytestring=svg.encode('utf-8'), write_to=str(png_path), output_width=W, output_height=H)
cairosvg.svg2pdf(bytestring=svg.encode('utf-8'), write_to=str(pdf_path), output_width=W, output_height=H)

# create a knockout-only poster for readability
# Simple copy: crop? create separate with larger bracket only
# Use same SVG generation but simpler - use full width for knockout.
# For now skip, but create a ZIP package
zip_path=Path('/mnt/data/wk2026_aruba_master_overview_package.zip')
with zipfile.ZipFile(zip_path,'w',zipfile.ZIP_DEFLATED) as z:
    for p in [svg_path,png_path,pdf_path]: z.write(p,arcname=p.name)
# validate image diversity
im=Image.open(png_path).convert('RGB')
small=im.resize((384,216))
colors=len(small.getcolors(maxcolors=10_000_000))
print('Wrote', svg_path, png_path, pdf_path, zip_path, 'colors', colors)
