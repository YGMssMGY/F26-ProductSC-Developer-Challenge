"""Generate the project's original CC0 artwork and twelve original instrumental samples.
Run with Python 3 + NumPy. No downloaded samples or third-party compositions are used.
"""
from pathlib import Path
import wave
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'public/art'; AUDIO=ROOT/'public/audio'
ART.mkdir(parents=True,exist_ok=True); AUDIO.mkdir(parents=True,exist_ok=True)
noise='<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".65" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".13"/></feComponentTransfer><feBlend in="SourceGraphic" mode="multiply"/></filter>'
arts={
'morning':('A SOFTER','MORNING','#e5d3b4','''<rect width="600" height="600" fill="#dccdb0"/><circle cx="365" cy="236" r="123" fill="#b76040"/><path d="M0 460Q150 265 330 398T650 345V650H0" fill="#8f9875"/><path d="M-50 470Q185 356 320 496T700 445V650H0" fill="#5e705a"/><path d="M-30 552Q160 420 358 580T690 510V660H0" fill="#354d40"/><path d="M270 0V600M330 0V600" stroke="#f8e9cc" stroke-width="1" opacity=".14"/>'''),
'midnight':('MIDNIGHT','DRIVE','#dac9e5','''<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#23233e"/><stop offset="1" stop-color="#846170"/></linearGradient></defs><rect width="600" height="600" fill="url(#sky)"/><circle cx="428" cy="185" r="65" fill="#c1b3c7"/><path d="M0 370L60 340V272H107V400H138V318H178V355H235V280H277V390H319V340H362V400H412V289H450V360H485V310H545V400H600V600H0" fill="#242638"/><path d="M245 600L341 385H371L420 600" fill="#6c6177"/><path d="M329 600L351 407" stroke="#dfbaa8" stroke-width="4" stroke-dasharray="20 35"/><path d="M0 478H600" stroke="#a98696" opacity=".3"/><g stroke="#b693a0" opacity=".3"><path d="M160 600L343 385M520 600L368 385"/></g>'''),
'focus':('DEEP','FOCUS','#e2eed8','''<rect width="600" height="600" fill="#6e9180"/><circle cx="300" cy="315" r="235" fill="#83a48e"/><circle cx="300" cy="315" r="181" fill="#9eb9a0"/><circle cx="300" cy="315" r="128" fill="#b8cbb1"/><circle cx="300" cy="315" r="73" fill="#d7dec3"/><path d="M0 510Q300 360 600 510V600H0" fill="#35584e"/><path d="M0 553Q300 420 600 553V600H0" fill="#25463f"/>'''),
'good-days':('GOOD DAYS','AHEAD','#fff2bc','''<rect width="600" height="600" fill="#d3a968"/><circle cx="302" cy="273" r="159" fill="#f1cb70"/><g stroke="#f3cb72" stroke-width="2"><path d="M300 72V20M300 490V550M105 270H35M490 270H560M160 130L120 90M440 130L485 90"/></g><path d="M0 382Q155 339 300 394T600 370V600H0" fill="#748f86"/><path d="M0 441Q160 390 310 449T600 420V600H0" fill="#557b79"/><path d="M0 523Q220 400 600 540V600H0" fill="#dfc89c"/><path d="M300 393L255 465M335 402L324 452M371 409L390 465" stroke="#edc68a" opacity=".5" stroke-width="3"/>''')}
for name,(line1,line2,color,shapes) in arts.items():
 svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><defs>{noise}</defs><g filter="url(#grain)">{shapes}</g><text x="35" y="45" font-family="Arial,sans-serif" fill="{color}" font-size="12" letter-spacing="4">THE LISTENING ROOM</text><text x="35" y="510" font-family="Arial,sans-serif" font-weight="bold" fill="{color}" font-size="52" letter-spacing="-2">{line1}</text><text x="35" y="563" font-family="Arial,sans-serif" font-weight="bold" fill="{color}" font-size="52" letter-spacing="-2">{line2}</text><text x="560" y="44" text-anchor="end" font-family="Arial,sans-serif" fill="{color}" font-size="11">0{list(arts).index(name)+1}</text></svg>'''
 (ART/f'{name}.svg').write_text(svg)
 if name=='morning': (ART/'morning-scene.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><defs>{noise}</defs><g filter="url(#grain)">{shapes}</g></svg>')
SR=22050; seconds=32; N=SR*seconds
for group,name in enumerate(arts):
 for song in range(3):
  rng=np.random.default_rng(group*10+song); out=np.zeros(N,dtype=np.float64)
  root=[48,45,50,53][group]+song*2
  progression=[[0,4,7,11],[-3,0,4,7],[-5,-1,2,7],[-7,-3,0,4]]
  def tone(midi,start,duration,amp,soft=True):
   begin=int(start*SR); length=min(int(duration*SR),N-begin)
   if length<=0:return
   t=np.arange(length)/SR; hz=440*2**((midi-69)/12)
   env=(1-np.exp(-t*18))*np.exp(-t/(1.3 if soft else .35))*np.minimum(1,(duration-t)*8)
   signal=np.sin(2*np.pi*hz*t)+.24*np.sin(2*np.pi*hz*2*t)+.08*np.sin(2*np.pi*hz*3*t)
   out[begin:begin+length]+=signal*env*amp
  for bar in range(8):
   chord=progression[(bar+song)%4]
   for k,note in enumerate(chord):tone(root+note,bar*4+k*.06,3.9,.095)
   tone(root-12+chord[0],bar*4,3.7,.14)
   for step in range(8):
    note=chord[(step+bar+song)%4]+12+(12 if step%5==0 else 0)
    tone(root+note,bar*4+step*.5,1.4,.052,False)
   if group!=2:
    for beat in range(4):
     start=int((bar*4+beat)*SR);t=np.arange(int(.16*SR))/SR
     kick=np.sin(2*np.pi*(55*t+2*(1-np.exp(-t*22))))*np.exp(-t*28)*.13
     out[start:start+len(t)]+=kick
     start=int((bar*4+beat+.5)*SR);hat=rng.normal(0,.018,int(.07*SR))*np.exp(-np.arange(int(.07*SR))/SR*65)
     out[start:start+len(hat)]+=hat
  # Gentle room echo and fade; keep each file a complete, distinct miniature.
  delay=int(.24*SR);out[delay:]+=out[:-delay].copy()*.18
  out[:SR]*=np.linspace(0,1,SR);out[-SR*2:]*=np.linspace(1,0,SR*2)
  out=np.tanh(out*1.3)*.8
  with wave.open(str(AUDIO/f'{name}-{song+1}.wav'),'wb') as f:
   f.setnchannels(1);f.setsampwidth(2);f.setframerate(SR);f.writeframes((out*32767).astype('<i2').tobytes())
print('Generated 4 original covers and 12 original 32-second audio tracks.')
