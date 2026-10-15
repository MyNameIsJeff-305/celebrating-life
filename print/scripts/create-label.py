from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor, Color
from pathlib import Path
import json
from pypdf import PdfReader, PdfWriter
from pypdf.generic import RectangleObject

root=Path(__file__).resolve().parent.parent
out=root/'output'
for name,file in [('Script','allura-400'),('Serif','cormorant-garamond-500'),('Sans','dm-sans-400'),('Bold','dm-sans-600')]:
 pdfmetrics.registerFont(TTFont(name,str(out/(file+'.ttf'))))
W,H=6.5*72,2.255*72
GOLD=HexColor('#E9B965');WHITE=HexColor('#FFF8EB');BG=HexColor('#100E0B')
def centered(c,s,x,y,font,size,color=WHITE):
 c.setFillColor(color);c.setFont(font,size);c.drawCentredString(x,y,s)
def crown(c,x,y,scale=.52):
 c.saveState();c.translate(x-21*scale,y);c.scale(scale,scale);c.setStrokeColor(GOLD);c.setLineWidth(1.8)
 p=c.beginPath();p.moveTo(5,7);p.lineTo(2,23);p.lineTo(13,15);p.lineTo(21,29);p.lineTo(29,15);p.lineTo(40,23);p.lineTo(37,7);p.close();c.drawPath(p);c.line(6,1,36,1);c.restoreState()
def qr(c,lang,x,y,size):
 q=json.loads((out/'qr'/f'{lang}.json').read_text());n=q['size'];unit=size/(n+8)
 c.setFillColor(HexColor('#FFFFFF'));c.rect(x,y,size,size,fill=1,stroke=0);c.setFillColor(HexColor('#000000'))
 for row in range(n):
  for col in range(n):
   if q['data'][row*n+col]:c.rect(x+(col+4)*unit,y+(n+3-row)*unit,unit,unit,fill=1,stroke=0)

def render(filename,bleed=0):
 c=canvas.Canvas(str(out/filename),pagesize=(W+2*bleed,H+2*bleed));c.setTitle('Celebrating Life | 31 Oct 2026 | bilingual bottle label');c.setAuthor('Betesda Baptist Church')
 c.setFillColor(BG);c.rect(0,0,W+2*bleed,H+2*bleed,fill=1,stroke=0);c.translate(bleed,bleed)
 # Delicate warm vertical rules frame the central invitation.
 c.setStrokeColor(HexColor('#71502B'));c.setLineWidth(.4);c.line(119,20,119,H-20);c.line(W-119,20,W-119,H-20)
 # Two independent language invitations; QR white includes four-module quiet zone.
 for lang,x in [('es',62),('en',W-62)]:
  centered(c,'ESPAÑOL' if lang=='es' else 'ENGLISH',x,139,'Bold',7,GOLD)
  centered(c,'UN MENSAJE PARA TI' if lang=='es' else 'A MESSAGE FOR YOU',x,125,'Sans',6.8)
  qr(c,lang,x-38,43,76)
  centered(c,'Escanea y conecta' if lang=='es' else 'Scan & connect',x,31,'Sans',7)
  centered(c,'Esperanza · Oración' if lang=='es' else 'Hope · Prayer',x,20,'Sans',6.2,GOLD)
 crown(c,W/2,143,.35)
 centered(c,'CELEBRATING',W/2,126,'Serif',19)
 centered(c,'Life',W/2,83,'Script',56,GOLD)
 centered(c,'LA LUZ DEL MUNDO · THE LIGHT OF THE WORLD',W/2,57,'Sans',5.6)
 centered(c,'31 OCT 2026  ·  7:00 PM',W/2,43,'Bold',10)
 centered(c,'ENTRADA GRATUITA · FREE ADMISSION',W/2,32,'Bold',6.5,GOLD)
 centered(c,'BETESDA BAPTIST CHURCH',W/2,21,'Bold',7)
 centered(c,'12200 SW 56th Street · Miami, FL 33175',W/2,11.5,'Sans',6.4)
 c.showPage();c.save()
 reader=PdfReader(out/filename);writer=PdfWriter();page=reader.pages[0]
 page.trimbox=RectangleObject((bleed,bleed,W+bleed,H+bleed));page.bleedbox=RectangleObject((0,0,W+2*bleed,H+2*bleed));writer.add_page(page)
 writer.add_metadata({'/Title':'Celebrating Life — bilingual bottle label','/Author':'Betesda Baptist Church','/Subject':'Design proof. Verify live QR destinations and printer specifications before printing.'})
 with open(out/filename,'wb') as f:writer.write(f)
render('Celebrating-Life-Label-6.500x2.255.pdf')
render('Celebrating-Life-Label-with-Bleed.pdf',9)
print('Label PDFs: trim 6.500 x 2.255 in; bleed 0.125 in per edge.')
