#!/usr/bin/env python3
"""
Generate Voucher + Invoice PDF templates for RK Residency.

Outputs two sample/template PDFs in /home/z/my-project/download/:
  1. RK-Residency-Booking-Voucher-Template.pdf
  2. RK-Residency-Tax-Invoice-Template.pdf

These are TEMPLATE PDFs — they show the design with sample booking data
so the client can see what the voucher/invoice will look like when a
real booking is made.

Branding matches the website: teal (#0E4C4F) + gold (#C9A24A) on ivory.
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Frame, PageTemplate, BaseDocTemplate, KeepTogether
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.pdfgen import canvas

# ─── Font registration ───────────────────────────────────────────────
# Tinos files in /usr/share/fonts/truetype/english/ are corrupted (HTML content),
# so we use Liberation Serif (Times-compatible metric) instead.
LIB_DIR = '/usr/share/fonts/truetype/liberation'
ENG_DIR = '/usr/share/fonts/truetype/english'
pdfmetrics.registerFont(TTFont('LibSerif', f'{LIB_DIR}/LiberationSerif-Regular.ttf'))
pdfmetrics.registerFont(TTFont('LibSerif-Bold', f'{LIB_DIR}/LiberationSerif-Bold.ttf'))
pdfmetrics.registerFont(TTFont('LibSerif-Italic', f'{LIB_DIR}/LiberationSerif-Italic.ttf'))
pdfmetrics.registerFont(TTFont('LibSerif-BoldItalic', f'{LIB_DIR}/LiberationSerif-BoldItalic.ttf'))
pdfmetrics.registerFont(TTFont('LibSans', f'{LIB_DIR}/LiberationSans-Regular.ttf'))
pdfmetrics.registerFont(TTFont('LibSans-Bold', f'{LIB_DIR}/LiberationSans-Bold.ttf'))
pdfmetrics.registerFont(TTFont('LibSans-Italic', f'{LIB_DIR}/LiberationSans-Italic.ttf'))
pdfmetrics.registerFont(TTFont('LibSans-BoldItalic', f'{LIB_DIR}/LiberationSans-BoldItalic.ttf'))
pdfmetrics.registerFont(TTFont('Carlito', f'{ENG_DIR}/Carlito-Regular.ttf'))
pdfmetrics.registerFont(TTFont('Carlito-Bold', f'{ENG_DIR}/Carlito-Bold.ttf'))
pdfmetrics.registerFont(TTFont('Carlito-Italic', f'{ENG_DIR}/Carlito-Italic.ttf'))
pdfmetrics.registerFont(TTFont('Carlito-BoldItalic', f'{ENG_DIR}/Carlito-BoldItalic.ttf'))

registerFontFamily('LibSerif', normal='LibSerif', bold='LibSerif-Bold',
                   italic='LibSerif-Italic', boldItalic='LibSerif-BoldItalic')
registerFontFamily('LibSans', normal='LibSans', bold='LibSans-Bold',
                   italic='LibSans-Italic', boldItalic='LibSans-BoldItalic')
registerFontFamily('Carlito', normal='Carlito', bold='Carlito-Bold',
                   italic='Carlito-Italic', boldItalic='Carlito-BoldItalic')

SERIF = 'LibSerif'
SERIF_B = 'LibSerif-Bold'
SERIF_I = 'LibSerif-Italic'
SANS = 'Carlito'
SANS_B = 'Carlito-Bold'
SANS_I = 'Carlito-Italic'

# ─── Brand palette (matches website) ─────────────────────────────────
TEAL = colors.HexColor('#0E4C4F')       # primary
TEAL_DEEP = colors.HexColor('#0A3A3C')  # hover
GOLD = colors.HexColor('#C9A24A')       # accent
GOLD_SOFT = colors.HexColor('#D9B978')
IVORY = colors.HexColor('#F5F2ED')      # background
IVORY_DEEP = colors.HexColor('#EAE3D6')
CHARCOAL = colors.HexColor('#231F1C')   # text
CHARCOAL_SOFT = colors.HexColor('#5C534A')
MARSALA = colors.HexColor('#7A2E2E')    # errors
WHITE = colors.white

# ─── Sample booking data (template) ──────────────────────────────────
SAMPLE = {
    'brand_name': 'RK Residency',
    'tagline': 'Heritage Luxury in Vrindavan',
    'address': 'Krishna Janambhoomi Road, Vrindavan, Mathura, Uttar Pradesh 281121',
    'phone': '+91 565 234 5678',
    'email': 'reservations@rkresidencyvrindavan.in',
    'website': 'www.rkresidencyvrindavan.in',
    'gstin': '09AABCR1234M1Z5',

    'reference_code': 'RK-2026-0042',
    'booking_date': '24 July 2026',
    'voucher_date': '24 July 2026',
    'invoice_date': '24 July 2026',
    'invoice_no': 'INV-2026-0042',

    'guest_name': 'Mr. Rajesh Khanna',
    'guest_email': 'rajesh.khanna@example.com',
    'guest_phone': '+91 98765 43210',
    'guest_address': '12 Sundar Nagar, New Delhi 110003',

    'room_name': 'Yamuna Heritage Suite',
    'room_view': 'Garden View',
    'room_bed': '1 King Bed',
    'room_guests': 2,
    'room_size': '480 sq.ft',

    'check_in': '15 Aug 2026',
    'check_out': '18 Aug 2026',
    'nights': 3,
    'adults': 2,
    'children': 0,

    'rate_per_night': 12500,
    'room_total': 37500,
    'breakfast': 'Complimentary Satvik Breakfast included',
    'taxes_gst': 5625,         # 5% GST on room
    'service_charge': 0,
    'grand_total': 43125,

    'payment_status_voucher': 'Confirmed · Deposit Received',
    'payment_status_invoice': 'Partially Paid',
    'amount_paid': 15000,
    'balance_due': 28125,

    'special_requests': 'Early check-in requested. Airport pickup from DEL at 8:00 AM on 15 Aug.',
    'cancellation_policy': 'Free cancellation until 7 days before check-in. '
                           '50% refund for cancellations 3–6 days before. '
                           'No refund for cancellations within 48 hours of check-in.',
}

# ─── Styles ──────────────────────────────────────────────────────────
H_TITLE = ParagraphStyle('HTitle', fontName=SERIF_B, fontSize=22, leading=26,
                         textColor=TEAL, alignment=TA_LEFT, spaceAfter=2)
H_SUB = ParagraphStyle('HSub', fontName=SERIF_I, fontSize=10, leading=13,
                       textColor=GOLD, alignment=TA_LEFT, spaceAfter=4)
DOC_LABEL = ParagraphStyle('DocLabel', fontName=SANS_B, fontSize=9, leading=12,
                           textColor=GOLD_SOFT, alignment=TA_RIGHT, spaceAfter=2)
DOC_VALUE = ParagraphStyle('DocValue', fontName=SANS_B, fontSize=11, leading=14,
                           textColor=CHARCOAL, alignment=TA_RIGHT, spaceAfter=0)
LABEL = ParagraphStyle('Label', fontName=SANS_B, fontSize=8, leading=11,
                       textColor=CHARCOAL_SOFT, alignment=TA_LEFT, spaceAfter=1)
VALUE = ParagraphStyle('Value', fontName=SANS_B, fontSize=10, leading=13,
                       textColor=CHARCOAL, alignment=TA_LEFT, spaceAfter=0)
BODY = ParagraphStyle('Body', fontName=SERIF, fontSize=9.5, leading=14,
                      textColor=CHARCOAL, alignment=TA_LEFT, spaceAfter=2)
BODY_SM = ParagraphStyle('BodySm', fontName=SANS, fontSize=8, leading=11,
                         textColor=CHARCOAL_SOFT, alignment=TA_LEFT, spaceAfter=2)
SECTION_HEAD = ParagraphStyle('SecHead', fontName=SANS_B, fontSize=10, leading=13,
                              textColor=WHITE, alignment=TA_LEFT, spaceAfter=0)
TABLE_HEAD = ParagraphStyle('TblHead', fontName=SANS_B, fontSize=8.5, leading=11,
                            textColor=WHITE, alignment=TA_LEFT)
TABLE_HEAD_R = ParagraphStyle('TblHeadR', fontName=SANS_B, fontSize=8.5, leading=11,
                              textColor=WHITE, alignment=TA_RIGHT)
TABLE_CELL = ParagraphStyle('TblCell', fontName=SERIF, fontSize=9.5, leading=12,
                            textColor=CHARCOAL, alignment=TA_LEFT)
TABLE_CELL_R = ParagraphStyle('TblCellR', fontName=SERIF, fontSize=9.5, leading=12,
                              textColor=CHARCOAL, alignment=TA_RIGHT)
TABLE_CELL_B = ParagraphStyle('TblCellB', fontName=SERIF_B, fontSize=9.5, leading=12,
                              textColor=CHARCOAL, alignment=TA_LEFT)
TABLE_CELL_BR = ParagraphStyle('TblCellBR', fontName=SERIF_B, fontSize=9.5, leading=12,
                               textColor=TEAL, alignment=TA_RIGHT)
FOOT_NOTE = ParagraphStyle('FootNote', fontName=SANS_I, fontSize=7, leading=9,
                           textColor=CHARCOAL_SOFT, alignment=TA_CENTER)


# ─── Header band (shared by both PDFs) ───────────────────────────────
def header_band(label_text):
    """Teal header band with brand on left, doc label on right."""
    brand_para = Paragraph(
        f'<font name="{SERIF_B}" size="20" color="#F5F2ED">{SAMPLE["brand_name"]}</font><br/>'
        f'<font name="{SERIF_I}" size="9" color="#D9B978">{SAMPLE["tagline"]}</font>',
        ParagraphStyle('Brand', fontName=SERIF_B, fontSize=20, leading=22, alignment=TA_LEFT)
    )
    label_para = Paragraph(
        f'<font name="{SANS_B}" size="9" color="#D9B978">DOCUMENT</font><br/>'
        f'<font name="{SERIF_B}" size="18" color="#F5F2ED">{label_text}</font>',
        ParagraphStyle('DocLabelBig', fontName=SERIF_B, fontSize=18, leading=22, alignment=TA_RIGHT)
    )
    t = Table([[brand_para, label_para]], colWidths=[105*mm, 75*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), TEAL),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (0, 0), 14),
        ('RIGHTPADDING', (1, 0), (1, 0), 14),
        ('TOPPADDING', (0, 0), (-1, -1), 14),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 14),
        ('LINEBELOW', (0, 0), (-1, -1), 2, GOLD),
    ]))
    return t


def info_row(label, value, style_value=None):
    return [Paragraph(label.upper(), LABEL),
            Paragraph(value, style_value or VALUE)]


def info_block(title, rows):
    """A boxed info block with section header."""
    head = Table([[Paragraph(title, SECTION_HEAD)]], colWidths=[180*mm])
    head.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), TEAL),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    data = [info_row(l, v, s) for l, v, s in rows]
    body = Table(data, colWidths=[35*mm, 145*mm])
    body.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('BACKGROUND', (0, 0), (-1, -1), WHITE),
        ('LINEBELOW', (0, 0), (-1, -2), 0.3, colors.HexColor('#E5DDD0')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#C9A24A')),
    ]))
    return [head, body]


def format_inr(amount):
    """Format integer as Indian Rupees."""
    return f"\u20B9 {amount:,.0f}"


# ─── Footer drawing ──────────────────────────────────────────────────
def draw_page_footer(canv, doc):
    canv.saveState()
    # gold divider line
    canv.setStrokeColor(GOLD)
    canv.setLineWidth(0.6)
    canv.line(15*mm, 18*mm, 195*mm, 18*mm)

    # left: address
    canv.setFont(SANS, 7.5)
    canv.setFillColor(CHARCOAL_SOFT)
    canv.drawString(15*mm, 12*mm, f'{SAMPLE["brand_name"]}  ·  {SAMPLE["address"]}')
    canv.drawString(15*mm, 8*mm, f'Tel: {SAMPLE["phone"]}  ·  Email: {SAMPLE["email"]}  ·  Web: {SAMPLE["website"]}')

    # right: page number + GSTIN
    canv.setFont(SANS_B, 7.5)
    canv.setFillColor(TEAL)
    canv.drawRightString(195*mm, 12*mm, f'GSTIN: {SAMPLE["gstin"]}')
    canv.setFont(SANS, 7.5)
    canv.setFillColor(CHARCOAL_SOFT)
    canv.drawRightString(195*mm, 8*mm, f'Page {doc.page}')

    # tiny watermark text
    canv.setFont(SANS_I, 6.5)
    canv.setFillColor(colors.HexColor('#A39A8C'))
    canv.drawCentredString(105*mm, 4*mm,
        'This is a computer-generated document — no signature required.')
    canv.restoreState()


# ─── Build Voucher PDF ───────────────────────────────────────────────
def build_voucher(out_path):
    doc = SimpleDocTemplate(
        out_path,
        pagesize=A4,
        leftMargin=15*mm, rightMargin=15*mm,
        topMargin=15*mm, bottomMargin=22*mm,
        title=f'{SAMPLE["brand_name"]} — Booking Voucher',
        author=SAMPLE['brand_name'],
        subject='Booking Confirmation Voucher',
        creator='RK Residency Booking System',
    )

    story = []

    # 1. Header band
    story.append(header_band('BOOKING VOUCHER'))
    story.append(Spacer(1, 6))

    # 2. Reference + dates strip
    ref_data = [
        [Paragraph('BOOKING REFERENCE', LABEL),
         Paragraph('VOUCHER DATE', LABEL),
         Paragraph('BOOKING DATE', LABEL)],
        [Paragraph(f'<font name="{SANS_B}" size="13" color="#0E4C4F">{SAMPLE["reference_code"]}</font>', VALUE),
         Paragraph(SAMPLE['voucher_date'], VALUE),
         Paragraph(SAMPLE['booking_date'], VALUE)],
    ]
    ref_table = Table(ref_data, colWidths=[60*mm, 60*mm, 60*mm])
    ref_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), IVORY),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('BOX', (0, 0), (-1, -1), 0.5, GOLD),
        ('LINEAFTER', (0, 0), (0, -1), 0.3, colors.HexColor('#D9C8A0')),
        ('LINEAFTER', (1, 0), (1, -1), 0.3, colors.HexColor('#D9C8A0')),
    ]))
    story.append(ref_table)
    story.append(Spacer(1, 8))

    # 3. Payment status banner
    status_table = Table([[Paragraph(
        f'<font name="{SANS_B}" size="11" color="#F5F2ED">STATUS:  </font>'
        f'<font name="{SANS_B}" size="11" color="#D9B978">{SAMPLE["payment_status_voucher"]}</font>',
        ParagraphStyle('StatusBanner', fontName=SANS_B, fontSize=11, leading=14, alignment=TA_CENTER)
    )]], colWidths=[180*mm])
    status_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), TEAL_DEEP),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(status_table)
    story.append(Spacer(1, 8))

    # 4. Guest + Booking info side by side
    guest_block = info_block('GUEST DETAILS', [
        ('Guest Name', SAMPLE['guest_name'], VALUE),
        ('Email', SAMPLE['guest_email'], VALUE),
        ('Phone', SAMPLE['guest_phone'], VALUE),
        ('Address', SAMPLE['guest_address'], VALUE),
    ])

    booking_block = info_block('STAY DETAILS', [
        ('Room', f'{SAMPLE["room_name"]}  ({SAMPLE["room_view"]})', VALUE),
        ('Check-In', f'{SAMPLE["check_in"]}  (after 2:00 PM)', VALUE),
        ('Check-Out', f'{SAMPLE["check_out"]}  (before 11:00 AM)', VALUE),
        ('Nights', f'{SAMPLE["nights"]} night(s)  ·  {SAMPLE["adults"]} Adult(s), {SAMPLE["children"]} Child(ren)', VALUE),
    ])

    # Combine side by side using a 2-col outer table
    combined = Table(
        [[guest_block, booking_block]],
        colWidths=[88*mm, 88*mm]
    )
    combined.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(combined)
    story.append(Spacer(1, 8))

    # 5. Room specifications
    specs_data = [
        [Paragraph('ROOM SPECIFICATIONS', TABLE_HEAD),
         Paragraph('BED CONFIGURATION', TABLE_HEAD),
         Paragraph('MAX OCCUPANCY', TABLE_HEAD),
         Paragraph('ROOM SIZE', TABLE_HEAD)],
        [Paragraph(SAMPLE['room_name'], TABLE_CELL_B),
         Paragraph(SAMPLE['room_bed'], TABLE_CELL),
         Paragraph(f'{SAMPLE["room_guests"]} Guests', TABLE_CELL),
         Paragraph(SAMPLE['room_size'], TABLE_CELL)],
    ]
    specs_table = Table(specs_data, colWidths=[55*mm, 45*mm, 35*mm, 45*mm])
    specs_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), TEAL),
        ('BACKGROUND', (0, 1), (-1, 1), IVORY),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('BOX', (0, 0), (-1, -1), 0.5, TEAL),
        ('LINEBELOW', (0, 0), (-1, 0), 1, GOLD),
    ]))
    story.append(specs_table)
    story.append(Spacer(1, 8))

    # 6. Charges summary (voucher-style — totals only)
    charges_data = [
        [Paragraph('CHARGE DESCRIPTION', TABLE_HEAD),
         Paragraph('PER NIGHT', TABLE_HEAD_R),
         Paragraph('NIGHTS', TABLE_HEAD_R),
         Paragraph('AMOUNT', TABLE_HEAD_R)],
        [Paragraph(f'Room Tariff — {SAMPLE["room_name"]}', TABLE_CELL),
         Paragraph(format_inr(SAMPLE['rate_per_night']), TABLE_CELL_R),
         Paragraph(str(SAMPLE['nights']), TABLE_CELL_R),
         Paragraph(format_inr(SAMPLE['room_total']), TABLE_CELL_R)],
        [Paragraph('GST (5% on room tariff)', TABLE_CELL),
         Paragraph('—', TABLE_CELL_R),
         Paragraph('—', TABLE_CELL_R),
         Paragraph(format_inr(SAMPLE['taxes_gst']), TABLE_CELL_R)],
        [Paragraph(f'<b>Grand Total</b>', TABLE_CELL_B),
         Paragraph('', TABLE_CELL_R),
         Paragraph('', TABLE_CELL_R),
         Paragraph(f'<b>{format_inr(SAMPLE["grand_total"])}</b>', TABLE_CELL_BR)],
    ]
    charges_table = Table(charges_data, colWidths=[80*mm, 35*mm, 25*mm, 40*mm])
    charges_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), TEAL),
        ('BACKGROUND', (0, 1), (-1, 2), WHITE),
        ('BACKGROUND', (0, 3), (-1, 3), IVORY),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('BOX', (0, 0), (-1, -1), 0.5, TEAL),
        ('LINEBELOW', (0, 0), (-1, 0), 1, GOLD),
        ('LINEABOVE', (0, 3), (-1, 3), 0.8, TEAL),
        ('LINEBELOW', (0, 1), (-1, 1), 0.3, colors.HexColor('#E5DDD0')),
    ]))
    story.append(charges_table)
    story.append(Spacer(1, 6))

    # 7. Includes note
    story.append(Paragraph(
        f'<b>Inclusions:</b> . Complimentary Wi-Fi, '
        'daily housekeeping, assistance with temple visits, and all applicable taxes.',
        BODY
    ))
    story.append(Spacer(1, 8))

    # 8. Special requests
    if SAMPLE['special_requests']:
        sr_head = Table([[Paragraph('SPECIAL REQUESTS', SECTION_HEAD)]], colWidths=[180*mm])
        sr_head.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), GOLD),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        sr_body = Table([[Paragraph(SAMPLE['special_requests'], BODY)]], colWidths=[180*mm])
        sr_body.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), IVORY),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('BOX', (0, 0), (-1, -1), 0.5, GOLD),
        ]))
        story.append(KeepTogether([sr_head, sr_body]))
        story.append(Spacer(1, 8))

    # 9. Cancellation policy
    canc_head = Table([[Paragraph('CANCELLATION POLICY', SECTION_HEAD)]], colWidths=[180*mm])
    canc_head.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), MARSALA),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    canc_body = Table([[Paragraph(SAMPLE['cancellation_policy'], BODY)]], colWidths=[180*mm])
    canc_body.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FBF1F1')),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('BOX', (0, 0), (-1, -1), 0.5, MARSALA),
    ]))
    story.append(KeepTogether([canc_head, canc_body]))
    story.append(Spacer(1, 10))

    # 10. Thank you note + check-in instructions
    story.append(Paragraph(
        f'<font name="{SERIF_B}" size="11" color="#0E4C4F">'
        f'Dear {SAMPLE["guest_name"].split()[0]}, thank you for choosing {SAMPLE["brand_name"]}.'
        f'</font>',
        ParagraphStyle('Thanks', fontName=SERIF_B, fontSize=11, leading=14, alignment=TA_LEFT, spaceAfter=4)
    ))
    story.append(Paragraph(
        'Please present this voucher (printed or on your mobile) at the front desk upon arrival, '
        'along with a government-issued photo ID for each guest. Our concierge will assist with '
        'your luggage, temple tour bookings, and any special arrangements you may need during '
        'your stay in the holy land of Vrindavan.',
        BODY
    ))

    doc.build(story, onFirstPage=draw_page_footer, onLaterPages=draw_page_footer)
    return out_path


# ─── Build Invoice PDF ───────────────────────────────────────────────
def build_invoice(out_path):
    doc = SimpleDocTemplate(
        out_path,
        pagesize=A4,
        leftMargin=15*mm, rightMargin=15*mm,
        topMargin=12*mm, bottomMargin=20*mm,
        title=f'{SAMPLE["brand_name"]} — Tax Invoice',
        author=SAMPLE['brand_name'],
        subject='Tax Invoice (GST)',
        creator='RK Residency Booking System',
    )

    story = []

    # 1. Header band
    story.append(header_band('TAX INVOICE'))
    story.append(Spacer(1, 4))

    # 2. Invoice meta strip (Invoice No + dates)
    meta_data = [
        [Paragraph('INVOICE NO.', LABEL),
         Paragraph('INVOICE DATE', LABEL),
         Paragraph('BOOKING REF.', LABEL),
         Paragraph('GSTIN', LABEL)],
        [Paragraph(f'<font name="{SANS_B}" size="13" color="#0E4C4F">{SAMPLE["invoice_no"]}</font>', VALUE),
         Paragraph(SAMPLE['invoice_date'], VALUE),
         Paragraph(SAMPLE['reference_code'], VALUE),
         Paragraph(SAMPLE['gstin'], VALUE)],
    ]
    meta_table = Table(meta_data, colWidths=[45*mm, 45*mm, 45*mm, 45*mm])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), IVORY),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('BOX', (0, 0), (-1, -1), 0.5, GOLD),
        ('LINEAFTER', (0, 0), (0, -1), 0.3, colors.HexColor('#D9C8A0')),
        ('LINEAFTER', (1, 0), (1, -1), 0.3, colors.HexColor('#D9C8A0')),
        ('LINEAFTER', (2, 0), (2, -1), 0.3, colors.HexColor('#D9C8A0')),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 5))

    # 3. Bill From / Bill To side by side
    bill_from_para = Paragraph(
        f'<font name="{SANS_B}" size="8" color="#5C534A">BILLED FROM</font><br/>'
        f'<font name="{SERIF_B}" size="11" color="#0E4C4F">{SAMPLE["brand_name"]}</font><br/>'
        f'<font name="{SANS}" size="9" color="#231F1C">{SAMPLE["address"]}</font><br/>'
        f'<font name="{SANS}" size="9" color="#231F1C">Tel: {SAMPLE["phone"]}</font><br/>'
        f'<font name="{SANS}" size="9" color="#231F1C">Email: {SAMPLE["email"]}</font><br/>'
        f'<font name="{SANS}" size="9" color="#231F1C">GSTIN: {SAMPLE["gstin"]}</font>',
        ParagraphStyle('BillFrom', fontName=SANS, fontSize=9, leading=13, alignment=TA_LEFT)
    )
    bill_to_para = Paragraph(
        f'<font name="{SANS_B}" size="8" color="#5C534A">BILLED TO</font><br/>'
        f'<font name="{SERIF_B}" size="11" color="#0E4C4F">{SAMPLE["guest_name"]}</font><br/>'
        f'<font name="{SANS}" size="9" color="#231F1C">{SAMPLE["guest_address"]}</font><br/>'
        f'<font name="{SANS}" size="9" color="#231F1C">Tel: {SAMPLE["guest_phone"]}</font><br/>'
        f'<font name="{SANS}" size="9" color="#231F1C">Email: {SAMPLE["guest_email"]}</font>',
        ParagraphStyle('BillTo', fontName=SANS, fontSize=9, leading=13, alignment=TA_LEFT)
    )
    bill_table = Table([[bill_from_para, bill_to_para]], colWidths=[90*mm, 90*mm])
    bill_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('BACKGROUND', (0, 0), (-1, -1), WHITE),
        ('BOX', (0, 0), (-1, -1), 0.5, GOLD),
        ('LINEAFTER', (0, 0), (0, 0), 0.3, colors.HexColor('#D9C8A0')),
    ]))
    story.append(bill_table)
    story.append(Spacer(1, 5))

    # 4. Stay summary line
    story.append(Paragraph(
        f'<b>Stay:</b> {SAMPLE["room_name"]} ({SAMPLE["room_view"]})  ·  '
        f'Check-in: {SAMPLE["check_in"]}  ·  Check-out: {SAMPLE["check_out"]}  ·  '
        f'{SAMPLE["nights"]} night(s)  ·  {SAMPLE["adults"]} Adult(s)',
        BODY
    ))
    story.append(Spacer(1, 4))

    # 5. Line items table — proper GST invoice format
    items_head = [
        Paragraph('#', TABLE_HEAD),
        Paragraph('DESCRIPTION', TABLE_HEAD),
        Paragraph('HSN/SAC', TABLE_HEAD),
        Paragraph('QTY', TABLE_HEAD_R),
        Paragraph('RATE', TABLE_HEAD_R),
        Paragraph('AMOUNT', TABLE_HEAD_R),
    ]
    items_rows = [
        [
            Paragraph('1', TABLE_CELL_R),
            Paragraph(f'{SAMPLE["room_name"]} — {SAMPLE["room_view"]}<br/>'
                      f'<font size="8" color="#5C534A">Room tariff @ {format_inr(SAMPLE["rate_per_night"])}/night, '
                      f'{SAMPLE["nights"]} night(s)</font>', TABLE_CELL),
            Paragraph('996331', TABLE_CELL_R),  # SAC for hotel accommodation
            Paragraph(f'{SAMPLE["nights"]} N', TABLE_CELL_R),
            Paragraph(format_inr(SAMPLE['rate_per_night']), TABLE_CELL_R),
            Paragraph(format_inr(SAMPLE['room_total']), TABLE_CELL_R),
        ],
    ]
    # Subtotal row
    subtotal_row = [
        Paragraph('', TABLE_CELL),
        Paragraph('<b>Subtotal (Taxable Value)</b>', TABLE_CELL_BR),
        Paragraph('', TABLE_CELL),
        Paragraph('', TABLE_CELL),
        Paragraph('', TABLE_CELL),
        Paragraph(format_inr(SAMPLE['room_total']), TABLE_CELL_BR),
    ]
    # CGST row (5%)
    cgst_row = [
        Paragraph('', TABLE_CELL),
        Paragraph('CGST @ 5%', TABLE_CELL),
        Paragraph('', TABLE_CELL),
        Paragraph('', TABLE_CELL),
        Paragraph('', TABLE_CELL),
        Paragraph(format_inr(SAMPLE['taxes_gst'] // 2), TABLE_CELL_R),
    ]
    # SGST row (5%)
    sgst_row = [
        Paragraph('', TABLE_CELL),
        Paragraph('SGST @ 5%', TABLE_CELL),
        Paragraph('', TABLE_CELL),
        Paragraph('', TABLE_CELL),
        Paragraph('', TABLE_CELL),
        Paragraph(format_inr(SAMPLE['taxes_gst'] // 2), TABLE_CELL_R),
    ]
    # Grand total row
    grand_row = [
        Paragraph('', TABLE_CELL),
        Paragraph('<b>GRAND TOTAL</b>', TABLE_CELL_BR),
        Paragraph('', TABLE_CELL),
        Paragraph(f'<b>{SAMPLE["nights"]} N</b>', TABLE_CELL_R),
        Paragraph('', TABLE_CELL),
        Paragraph(f'<b>{format_inr(SAMPLE["grand_total"])}</b>', TABLE_CELL_BR),
    ]

    items_data = [items_head] + items_rows + [subtotal_row, cgst_row, sgst_row, grand_row]
    items_table = Table(items_data,
                        colWidths=[10*mm, 75*mm, 22*mm, 18*mm, 25*mm, 30*mm])
    items_table.setStyle(TableStyle([
        # header
        ('BACKGROUND', (0, 0), (-1, 0), TEAL),
        ('LINEBELOW', (0, 0), (-1, 0), 1, GOLD),
        # body
        ('BACKGROUND', (0, 1), (-1, 1), WHITE),
        # subtotal row
        ('BACKGROUND', (0, 2), (-1, 2), IVORY),
        ('LINEABOVE', (0, 2), (-1, 2), 0.5, TEAL),
        # tax rows
        ('BACKGROUND', (0, 3), (-1, 4), WHITE),
        ('LINEBELOW', (0, 3), (-1, 3), 0.2, colors.HexColor('#E5DDD0')),
        # grand total row
        ('BACKGROUND', (0, 5), (-1, 5), TEAL_DEEP),
        ('LINEABOVE', (0, 5), (-1, 5), 1, GOLD),
        # common
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('BOX', (0, 0), (-1, -1), 0.5, TEAL),
        # text colors on grand total row
        ('TEXTCOLOR', (0, 5), (-1, 5), GOLD_SOFT),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 5))

    # 6. Amount in words
    def amount_in_words(n):
        """Simple INR amount to words (good enough for template)."""
        ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
                'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
        tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
        def two_digits(num):
            if num < 20:
                return ones[num]
            return tens[num // 10] + ('' if num % 10 == 0 else ' ' + ones[num % 10])
        def three_digits(num):
            h = num // 100
            r = num % 100
            s = ''
            if h > 0:
                s += ones[h] + ' Hundred'
            if r > 0:
                s += (' ' if s else '') + two_digits(r)
            return s
        if n == 0:
            return 'Zero'
        crore = n // 10000000
        lakh = (n % 10000000) // 100000
        thousand = (n % 100000) // 1000
        remainder = n % 1000
        parts = []
        if crore: parts.append(f'{three_digits(crore)} Crore')
        if lakh: parts.append(f'{two_digits(lakh)} Lakh')
        if thousand: parts.append(f'{two_digits(thousand)} Thousand')
        if remainder: parts.append(three_digits(remainder))
        return ' '.join(parts)

    words = amount_in_words(SAMPLE['grand_total'])
    words_table = Table([[
        Paragraph(
            f'<font name="{SANS_B}" size="8" color="#5C534A">GRAND TOTAL (IN WORDS):</font>  '
            f'<font name="{SERIF_B}" size="11" color="#0E4C4F">Rupees {words} Only</font>',
            ParagraphStyle('Words', fontName=SERIF_B, fontSize=11, leading=14, alignment=TA_LEFT)
        )
    ]], colWidths=[180*mm])
    words_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), IVORY),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('BOX', (0, 0), (-1, -1), 0.5, GOLD),
    ]))
    story.append(words_table)
    story.append(Spacer(1, 5))

    # 7. Payment status block
    pay_data = [
        [Paragraph('PAYMENT STATUS', TABLE_HEAD),
         Paragraph('AMOUNT PAID', TABLE_HEAD_R),
         Paragraph('BALANCE DUE', TABLE_HEAD_R),
         Paragraph('TOTAL', TABLE_HEAD_R)],
        [Paragraph(SAMPLE['payment_status_invoice'], TABLE_CELL_B),
         Paragraph(format_inr(SAMPLE['amount_paid']), TABLE_CELL_R),
         Paragraph(f'<b><font color="#7A2E2E">{format_inr(SAMPLE["balance_due"])}</font></b>', TABLE_CELL_R),
         Paragraph(format_inr(SAMPLE['grand_total']), TABLE_CELL_BR)],
    ]
    pay_table = Table(pay_data, colWidths=[55*mm, 40*mm, 40*mm, 45*mm])
    pay_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), TEAL),
        ('BACKGROUND', (0, 1), (-1, 1), WHITE),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('BOX', (0, 0), (-1, -1), 0.5, TEAL),
        ('LINEBELOW', (0, 0), (-1, 0), 1, GOLD),
    ]))
    story.append(pay_table)
    story.append(Spacer(1, 5))

    # 8. Bank details + signature side by side
    bank_para = Paragraph(
        f'<font name="{SANS_B}" size="9" color="#0E4C4F">BANK DETAILS (for balance payment)</font><br/>'
        f'<font name="{SANS}" size="9" color="#231F1C">Beneficiary: <b>Shaheed RK Residency</b></font><br/>'
        f'<font name="{SANS}" size="9" color="#231F1C">Bank: Punjab National Bank, Vrindavan Branch</font><br/>'
        f'<font name="{SANS}" size="9" color="#231F1C">A/C No: 0378102100000965</font><br/>'
        f'<font name="{SANS}" size="9" color="#231F1C">IFSC: PUNB0037810</font><br/>'
        f'<font name="{SANS}" size="9" color="#231F1C">UPI: 8954289824m@pnb</font>',
        ParagraphStyle('Bank', fontName=SANS, fontSize=9, leading=14, alignment=TA_LEFT)
    )
    sig_para = Paragraph(
        f'<font name="{SANS_B}" size="9" color="#0E4C4F">AUTHORISED SIGNATORY</font><br/><br/><br/><br/>'
        f'<font name="{SERIF_I}" size="9" color="#5C534A">For {SAMPLE["brand_name"]}</font><br/>'
        f'<font name="{SANS_B}" size="9" color="#231F1C">_________________________</font><br/>'
        f'<font name="{SANS}" size="9" color="#231F1C">Front Office Manager</font>',
        ParagraphStyle('Sig', fontName=SANS, fontSize=9, leading=14, alignment=TA_LEFT)
    )
    bank_table = Table([[bank_para, sig_para]], colWidths=[100*mm, 80*mm])
    bank_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('BACKGROUND', (0, 0), (-1, -1), WHITE),
        ('BOX', (0, 0), (-1, -1), 0.5, GOLD),
        ('LINEAFTER', (0, 0), (0, 0), 0.3, colors.HexColor('#D9C8A0')),
    ]))
    story.append(bank_table)
    story.append(Spacer(1, 5))

    # 9. Terms & conditions
    story.append(Paragraph(
        f'<font name="{SANS_B}" size="9" color="#7A2E2E">TERMS &amp; CONDITIONS</font>',
        ParagraphStyle('TcHead', fontName=SANS_B, fontSize=9, leading=12, alignment=TA_LEFT, spaceAfter=2)
    ))
    tc_lines = [
        '1. Computer-generated tax invoice — valid without signature.  '
        '2. GST shown as per applicable rates; any change in tax law will be levied extra.',
        '3. Cancellation charges apply as per the booking voucher policy.  '
        '4. Check-in: 2:00 PM onwards · Check-out: before 11:00 AM.',
        '5. All disputes are subject to Vrindavan / Mathura jurisdiction only.',
    ]
    for line in tc_lines:
        story.append(Paragraph(line, BODY_SM))

    doc.build(story, onFirstPage=draw_page_footer, onLaterPages=draw_page_footer)
    return out_path


# ─── Main ────────────────────────────────────────────────────────────
if __name__ == '__main__':
    out_dir = '/home/z/my-project/download'
    os.makedirs(out_dir, exist_ok=True)

    voucher_path = os.path.join(out_dir, 'RK-Residency-Booking-Voucher-Template.pdf')
    invoice_path = os.path.join(out_dir, 'RK-Residency-Tax-Invoice-Template.pdf')

    print('Generating Voucher PDF...')
    build_voucher(voucher_path)
    print(f'  ✓ {voucher_path}')

    print('Generating Invoice PDF...')
    build_invoice(invoice_path)
    print(f'  ✓ {invoice_path}')

    # Sizes
    v_size = os.path.getsize(voucher_path) / 1024
    i_size = os.path.getsize(invoice_path) / 1024
    print(f'\nDone.')
    print(f'  Voucher: {v_size:.1f} KB')
    print(f'  Invoice: {i_size:.1f} KB')
