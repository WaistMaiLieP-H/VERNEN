"""
VERNEN™ S.o.C. Audit Protocol — Published Methodology Document
© 2024–2026 Michael Vernen Thomas Hartmann. All Rights Reserved.
VERNEN™ is a trademark of Michael Vernen Thomas Hartmann.
IP manifest filed February 2, 2026.
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

# ============================================================
# COLORS
# ============================================================
NAVY = HexColor('#0a0b0d')
DARK = HexColor('#111318')
GOLD = HexColor('#c9a84c')
BLUE = HexColor('#4a7cff')
TEXT = HexColor('#1a1a2e')
MUTED = HexColor('#555570')
LIGHT_BG = HexColor('#f4f5f7')BORDER = HexColor('#d0d3dc')
WHITE = HexColor('#ffffff')

# ============================================================
# STYLES
# ============================================================
styles = {}

styles['cover_title'] = ParagraphStyle(
    'cover_title', fontName='Helvetica-Bold', fontSize=28,
    leading=34, textColor=NAVY, alignment=TA_LEFT,
    spaceAfter=8
)

styles['cover_sub'] = ParagraphStyle(
    'cover_sub', fontName='Helvetica', fontSize=14,
    leading=20, textColor=MUTED, alignment=TA_LEFT,
    spaceAfter=6
)

styles['cover_meta'] = ParagraphStyle(
    'cover_meta', fontName='Helvetica', fontSize=9,
    leading=14, textColor=MUTED, alignment=TA_LEFT,
    spaceAfter=4
)

styles['h1'] = ParagraphStyle(
    'h1', fontName='Helvetica-Bold', fontSize=18,
    leading=24, textColor=NAVY, alignment=TA_LEFT,
    spaceBefore=24, spaceAfter=10
)