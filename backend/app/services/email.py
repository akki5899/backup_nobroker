"""
Centralised, styled email service for RightVillaNest.

All outbound mail (OTP codes, welcome / signup notifications, and login
alerts) is rendered as branded, responsive HTML and dispatched through a
single SMTP sender. When SMTP credentials are missing or invalid, the
functions degrade gracefully: they log the content to the backend console
so development flows are never blocked.

Configure via .env:
    EMAIL_HOST=smtp.gmail.com
    EMAIL_PORT=587
    EMAIL_USER=you@example.com
    EMAIL_PASSWORD=<16-char Gmail App Password>   # NOT your normal password
"""

import smtplib
import socket
import ssl
import logging
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr

from ..core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Brand constants
# ---------------------------------------------------------------------------
BRAND_NAME = "RightVillaNest"
BRAND_TAGLINE = "Homes, the honest way — no brokerage, ever."
# Palette mirrors the frontend (warm primary + amber accent).
COLOR_PRIMARY = "#211b14"      # deep espresso
COLOR_ACCENT = "#d99a2b"       # amber
COLOR_ACCENT_DARK = "#b97f17"
COLOR_BG = "#f4efe7"           # warm paper
COLOR_CARD = "#ffffff"
COLOR_TEXT = "#2c2620"
COLOR_MUTED = "#857c6e"
SUPPORT_EMAIL = "support@rightvillanest.com"


# ---------------------------------------------------------------------------
# SMTP availability / sending
# ---------------------------------------------------------------------------
def _email_configured() -> bool:
    """True only when real (non-placeholder) SMTP credentials are present."""
    user = (settings.email_user or "").strip()
    pwd = (settings.email_password or "").strip()
    if not user or not pwd:
        return False
    placeholders = {"your-email@gmail.com", "your-app-password"}
    if user in placeholders or pwd in placeholders:
        return False
    return True


def _resolve_ipv4(host: str) -> str:
    """Resolve a hostname to an IPv4 address.

    Many Linux/WSL/container environments resolve smtp.gmail.com to an IPv6
    address first but have no IPv6 route, producing
    "[Errno 101] Network is unreachable". Forcing IPv4 avoids that. Falls back
    to the original host if no A record is found.
    """
    try:
        infos = socket.getaddrinfo(host, None, socket.AF_INET, socket.SOCK_STREAM)
        if infos:
            return infos[0][4][0]
    except socket.gaierror:
        pass
    return host


def _connect_smtp_ipv4(host: str, port: int, use_ssl: bool):
    """Open an SMTP(S) connection over IPv4 while keeping the real hostname for
    TLS certificate verification.

    We connect to the resolved IPv4 address (to dodge broken IPv6 routes) but
    set ``server._host`` to the real hostname so that STARTTLS / implicit SSL
    validate the certificate against ``smtp.gmail.com`` rather than the bare IP.
    """
    ipv4 = _resolve_ipv4(host)

    if use_ssl:
        # Build the TLS socket ourselves so server_hostname is the real host.
        context = ssl.create_default_context()
        raw_sock = socket.create_connection((ipv4, port), timeout=20)
        tls_sock = context.wrap_socket(raw_sock, server_hostname=host)
        server = smtplib.SMTP_SSL(timeout=20, context=context)
        server.sock = tls_sock
        server.file = None
        (code, msg) = server.getreply()
        if code != 220:
            try:
                server.close()
            finally:
                raise smtplib.SMTPConnectError(code, msg)
        server._host = host
        return server

    # Plain SMTP (STARTTLS upgrade happens after EHLO in the caller).
    server = smtplib.SMTP(timeout=20)
    server.connect(ipv4, port)
    # Override so starttls() verifies the cert against the real hostname.
    server._host = host
    return server


def _send(to_email: str, subject: str, html_body: str, text_body: str) -> bool:
    """Low-level send. Returns True if delivered (or logged in dev fallback).

    Tries STARTTLS (port 587) first, then implicit SSL (port 465) as a
    fallback so the configured port is honoured but a common misconfig
    still works.
    """
    if not to_email:
        return False

    if not _email_configured():
        logger.warning("SMTP not configured — email to %s logged only.", to_email)
        print("=====================================")
        print(f"[DEV EMAIL FALLBACK] To: {to_email}")
        print(f"Subject: {subject}")
        print(text_body.strip())
        print("(Set EMAIL_USER / EMAIL_PASSWORD in backend/.env to send real mail)")
        print("=====================================")
        return True

    msg = MIMEMultipart("alternative")
    msg["From"] = formataddr((BRAND_NAME, settings.email_user))
    msg["To"] = to_email
    msg["Subject"] = subject
    # Plain-text part first, HTML second (clients render the last supported part).
    msg.attach(MIMEText(text_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    host = settings.email_host
    port = int(settings.email_port)

    try:
        server = _connect_smtp_ipv4(host, port, use_ssl=(port == 465))
        try:
            if port != 465:
                server.ehlo()
                server.starttls(context=ssl.create_default_context())
                server.ehlo()
            server.login(settings.email_user, settings.email_password)
            server.send_message(msg)
        finally:
            try:
                server.quit()
            except Exception:
                pass
        logger.info("Email sent to %s (subject=%r)", to_email, subject)
        return True
    except smtplib.SMTPAuthenticationError as e:
        logger.error(
            "SMTP authentication failed for %s — check that EMAIL_PASSWORD is a "
            "valid app password (Gmail requires a 16-char App Password). %s",
            settings.email_user, e,
        )
    except (smtplib.SMTPException, socket.error, OSError) as e:
        logger.error("Email sending failed to %s: %s", to_email, e)

    # Fallback: never block the user flow in dev.
    print("=====================================")
    print(f"[EMAIL SEND FAILED — content for {to_email}]")
    print(f"Subject: {subject}")
    print(text_body.strip())
    print("=====================================")
    return False


# ---------------------------------------------------------------------------
# Shared HTML shell
# ---------------------------------------------------------------------------
def _wrap(title: str, inner_html: str, preheader: str = "") -> str:
    """Wrap content in the branded responsive shell."""
    year = datetime.utcnow().year
    return f"""\
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<title>{title}</title>
</head>
<body style="margin:0;padding:0;background:{COLOR_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;mso-hide:all;">{preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{COLOR_BG};padding:32px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:{COLOR_CARD};border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(33,27,20,0.10);">
        <!-- Header -->
        <tr>
          <td style="background:{COLOR_PRIMARY};padding:30px 36px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle;">
                  <span style="display:inline-block;width:38px;height:38px;line-height:38px;text-align:center;background:{COLOR_ACCENT};color:{COLOR_PRIMARY};border-radius:50%;font-size:19px;font-weight:700;font-style:italic;">R</span>
                </td>
                <td style="vertical-align:middle;padding-left:12px;">
                  <span style="color:#fbf8f2;font-size:20px;font-weight:600;letter-spacing:0.2px;">Right<span style="color:{COLOR_ACCENT};font-style:italic;">Villa</span>Nest</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:38px 36px 30px 36px;color:{COLOR_TEXT};">
            {inner_html}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:22px 36px 30px 36px;border-top:1px solid #efe8db;">
            <p style="margin:0 0 6px 0;font-size:12px;color:{COLOR_MUTED};line-height:1.6;">{BRAND_TAGLINE}</p>
            <p style="margin:0;font-size:12px;color:{COLOR_MUTED};line-height:1.6;">
              Need help? Reach us at <a href="mailto:{SUPPORT_EMAIL}" style="color:{COLOR_ACCENT_DARK};text-decoration:none;">{SUPPORT_EMAIL}</a>.
            </p>
            <p style="margin:14px 0 0 0;font-size:11px;color:#b3a896;">&copy; {year} {BRAND_NAME}. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>"""


def _button(label: str, href: str) -> str:
    return f"""\
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr><td style="border-radius:999px;background:{COLOR_PRIMARY};">
    <a href="{href}" style="display:inline-block;padding:14px 34px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:999px;">{label}</a>
  </td></tr>
</table>"""


def _info_table(rows: list) -> str:
    """Render a list of (label, value) pairs as a styled summary card.

    Rows whose value is falsy are skipped so optional fields stay tidy.
    """
    cells = ""
    for label, value in rows:
        if value in (None, ""):
            continue
        cells += (
            f'<tr><td style="padding:9px 0;font-size:13px;color:{COLOR_MUTED};'
            f'font-weight:600;width:38%;vertical-align:top;">{label}</td>'
            f'<td style="padding:9px 0;font-size:14px;color:{COLOR_TEXT};'
            f'vertical-align:top;">{value}</td></tr>'
        )
    return (
        f'<table role="presentation" cellpadding="0" cellspacing="0" '
        f'style="width:100%;margin:18px 0;background:{COLOR_BG};border-radius:12px;'
        f'padding:6px 18px;">{cells}</table>'
    )


# ---------------------------------------------------------------------------
# Public templates
# ---------------------------------------------------------------------------
def send_otp_email(to_email: str, otp: str, purpose: str = "verification") -> bool:
    """Styled one-time-password email."""
    subject = f"{BRAND_NAME} — Your {purpose} code: {otp}"
    digits = "".join(
        f'<span style="display:inline-block;min-width:38px;margin:0 4px;padding:12px 0;'
        f'background:{COLOR_BG};border-radius:10px;font-size:26px;font-weight:700;'
        f'letter-spacing:2px;color:{COLOR_PRIMARY};">{c}</span>'
        for c in otp
    )
    inner = f"""\
<p style="margin:0 0 6px 0;font-size:13px;text-transform:uppercase;letter-spacing:1.5px;color:{COLOR_ACCENT_DARK};font-weight:600;">Verification</p>
<h1 style="margin:0 0 14px 0;font-size:25px;font-weight:700;color:{COLOR_PRIMARY};">Here's your code</h1>
<p style="margin:0 0 8px 0;font-size:15px;line-height:1.6;color:{COLOR_TEXT};">
  Use the one-time code below to complete your {purpose}. It keeps your account secure.
</p>
<div style="text-align:center;margin:26px 0 10px 0;">{digits}</div>
<p style="margin:18px 0 0 0;font-size:14px;line-height:1.6;color:{COLOR_MUTED};">
  This code expires in <strong style="color:{COLOR_TEXT};">10 minutes</strong>. If you didn't request it,
  you can safely ignore this email — your account is still secure.
</p>"""
    text = (
        f"{BRAND_NAME}\n\n"
        f"Your {purpose} code is: {otp}\n"
        f"This code expires in 10 minutes.\n\n"
        f"If you didn't request this, you can ignore this email."
    )
    html = _wrap("Your verification code", inner, preheader=f"Your code is {otp}")
    return _send(to_email, subject, html, text)


def send_welcome_email(to_email: str, full_name: str = "") -> bool:
    """Styled welcome / signup notification."""
    name = (full_name or "").strip().split(" ")[0] if full_name else ""
    greeting = f"Welcome, {name}!" if name else "Welcome aboard!"
    subject = f"Welcome to {BRAND_NAME} 🏡"
    inner = f"""\
<p style="margin:0 0 6px 0;font-size:13px;text-transform:uppercase;letter-spacing:1.5px;color:{COLOR_ACCENT_DARK};font-weight:600;">Account created</p>
<h1 style="margin:0 0 14px 0;font-size:26px;font-weight:700;color:{COLOR_PRIMARY};">{greeting}</h1>
<p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:{COLOR_TEXT};">
  Your {BRAND_NAME} account is ready. You can now save homes you love, schedule visits,
  and connect directly with owners — with <strong>zero brokerage</strong>.
</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0;width:100%;">
  <tr><td style="padding:10px 0;font-size:14px;color:{COLOR_TEXT};">🔎&nbsp;&nbsp;Search verified listings near you</td></tr>
  <tr><td style="padding:10px 0;font-size:14px;color:{COLOR_TEXT};">❤️&nbsp;&nbsp;Save favourites to your wishlist</td></tr>
  <tr><td style="padding:10px 0;font-size:14px;color:{COLOR_TEXT};">📅&nbsp;&nbsp;Book site visits in a tap</td></tr>
</table>
{_button("Explore homes", "https://rightvillanest.com")}
<p style="margin:6px 0 0 0;font-size:13px;line-height:1.6;color:{COLOR_MUTED};">
  Glad to have you with us. Here's to finding the right place.
</p>"""
    text = (
        f"{greeting}\n\n"
        f"Your {BRAND_NAME} account is ready. Search verified listings, save favourites, "
        f"and book visits — with zero brokerage.\n\n"
        f"Explore homes: https://rightvillanest.com"
    )
    html = _wrap("Welcome to RightVillaNest", inner, preheader="Your account is ready.")
    return _send(to_email, subject, html, text)


def send_login_alert_email(to_email: str, full_name: str = "", when: str = "") -> bool:
    """Styled login notification / security alert."""
    name = (full_name or "").strip().split(" ")[0] if full_name else ""
    when = when or datetime.utcnow().strftime("%d %b %Y, %H:%M UTC")
    subject = f"{BRAND_NAME} — New sign-in to your account"
    inner = f"""\
<p style="margin:0 0 6px 0;font-size:13px;text-transform:uppercase;letter-spacing:1.5px;color:{COLOR_ACCENT_DARK};font-weight:600;">Security alert</p>
<h1 style="margin:0 0 14px 0;font-size:24px;font-weight:700;color:{COLOR_PRIMARY};">New sign-in detected</h1>
<p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:{COLOR_TEXT};">
  Hi{(' ' + name) if name else ''}, we noticed a successful sign-in to your {BRAND_NAME} account.
</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;width:100%;background:{COLOR_BG};border-radius:12px;">
  <tr><td style="padding:16px 18px;font-size:14px;color:{COLOR_TEXT};">
    <strong style="color:{COLOR_MUTED};font-weight:600;">When&nbsp;</strong> {when}
  </td></tr>
</table>
<p style="margin:14px 0 0 0;font-size:14px;line-height:1.6;color:{COLOR_MUTED};">
  If this was you, no action is needed. If you don't recognise this sign-in, please
  <a href="https://rightvillanest.com/forgot-password" style="color:{COLOR_ACCENT_DARK};text-decoration:none;font-weight:600;">reset your password</a> right away.
</p>"""
    text = (
        f"New sign-in to your {BRAND_NAME} account.\n"
        f"When: {when}\n\n"
        f"If this wasn't you, reset your password: https://rightvillanest.com/forgot-password"
    )
    html = _wrap("New sign-in detected", inner, preheader=f"Sign-in on {when}")
    return _send(to_email, subject, html, text)


def send_inquiry_owner_email(
    to_email: str,
    owner_name: str = "",
    property_title: str = "",
    property_location: str = "",
    inquirer_name: str = "",
    inquirer_phone: str = "",
    inquirer_email: str = "",
    message: str = "",
) -> bool:
    """Notify a property owner that someone has enquired about their listing."""
    name = (owner_name or "").strip().split(" ")[0] if owner_name else ""
    subject = f"New enquiry for your listing on {BRAND_NAME}"
    msg_block = ""
    if message:
        msg_block = f"""\
<p style="margin:18px 0 6px 0;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:{COLOR_MUTED};font-weight:600;">Their message</p>
<div style="padding:14px 18px;border-left:3px solid {COLOR_ACCENT};background:{COLOR_BG};border-radius:0 10px 10px 0;font-size:14px;line-height:1.6;color:{COLOR_TEXT};font-style:italic;">{message}</div>"""
    inner = f"""\
<p style="margin:0 0 6px 0;font-size:13px;text-transform:uppercase;letter-spacing:1.5px;color:{COLOR_ACCENT_DARK};font-weight:600;">New lead</p>
<h1 style="margin:0 0 14px 0;font-size:24px;font-weight:700;color:{COLOR_PRIMARY};">You have a new enquiry</h1>
<p style="margin:0 0 6px 0;font-size:15px;line-height:1.7;color:{COLOR_TEXT};">
  Hi{(' ' + name) if name else ''}, a prospective buyer/tenant is interested in your listing
  <strong>{property_title or 'your property'}</strong>{(' in ' + property_location) if property_location else ''}.
</p>
{_info_table([
    ("Interested in", property_title),
    ("Location", property_location),
    ("Name", inquirer_name),
    ("Phone", inquirer_phone),
    ("Email", inquirer_email),
])}
{msg_block}
{_button("View enquiry", "https://rightvillanest.com/dashboard")}
<p style="margin:6px 0 0 0;font-size:13px;line-height:1.6;color:{COLOR_MUTED};">
  Tip: responding within an hour dramatically improves your chances of closing.
</p>"""
    text = (
        f"You have a new enquiry on {BRAND_NAME}.\n\n"
        f"Property: {property_title}\n"
        f"Location: {property_location}\n"
        f"From: {inquirer_name} ({inquirer_phone}{', ' + inquirer_email if inquirer_email else ''})\n"
        + (f"Message: {message}\n" if message else "")
        + "\nView in dashboard: https://rightvillanest.com/dashboard"
    )
    html = _wrap("New enquiry received", inner, preheader=f"{inquirer_name or 'Someone'} is interested in {property_title or 'your listing'}")
    return _send(to_email, subject, html, text)


def send_inquiry_confirmation_email(
    to_email: str,
    inquirer_name: str = "",
    property_title: str = "",
    property_location: str = "",
    owner_name: str = "",
) -> bool:
    """Confirm to the inquirer that their enquiry has been sent to the owner."""
    name = (inquirer_name or "").strip().split(" ")[0] if inquirer_name else ""
    subject = f"Your enquiry has been sent — {BRAND_NAME}"
    inner = f"""\
<p style="margin:0 0 6px 0;font-size:13px;text-transform:uppercase;letter-spacing:1.5px;color:{COLOR_ACCENT_DARK};font-weight:600;">Enquiry sent</p>
<h1 style="margin:0 0 14px 0;font-size:24px;font-weight:700;color:{COLOR_PRIMARY};">We've passed it on</h1>
<p style="margin:0 0 6px 0;font-size:15px;line-height:1.7;color:{COLOR_TEXT};">
  Hi{(' ' + name) if name else ''}, your enquiry about <strong>{property_title or 'this property'}</strong> has been
  shared with the owner{(' (' + owner_name + ')') if owner_name else ''}. They typically respond within a day.
</p>
{_info_table([
    ("Property", property_title),
    ("Location", property_location),
])}
{_button("Browse more homes", "https://rightvillanest.com")}
<p style="margin:6px 0 0 0;font-size:13px;line-height:1.6;color:{COLOR_MUTED};">
  We'll nudge you here as soon as there's an update. No brokerage, ever.
</p>"""
    text = (
        f"Your enquiry about {property_title} has been sent to the owner"
        f"{(' (' + owner_name + ')') if owner_name else ''}.\n"
        f"Location: {property_location}\n\n"
        f"Browse more: https://rightvillanest.com"
    )
    html = _wrap("Enquiry sent", inner, preheader=f"Your enquiry about {property_title or 'the property'} is on its way")
    return _send(to_email, subject, html, text)


def send_payment_receipt_email(
    to_email: str,
    full_name: str = "",
    amount: float = 0.0,
    payment_type: str = "",
    order_id: str = "",
    payment_id: str = "",
    when: str = "",
) -> bool:
    """Styled payment receipt / confirmation."""
    name = (full_name or "").strip().split(" ")[0] if full_name else ""
    when = when or datetime.utcnow().strftime("%d %b %Y, %H:%M UTC")
    pretty_type = (payment_type or "Payment").replace("_", " ").title()
    amount_str = f"₹{amount:,.2f}"
    subject = f"Payment received — {amount_str} | {BRAND_NAME}"
    inner = f"""\
<p style="margin:0 0 6px 0;font-size:13px;text-transform:uppercase;letter-spacing:1.5px;color:{COLOR_ACCENT_DARK};font-weight:600;">Receipt</p>
<h1 style="margin:0 0 6px 0;font-size:24px;font-weight:700;color:{COLOR_PRIMARY};">Payment successful</h1>
<p style="margin:0 0 4px 0;font-size:15px;line-height:1.7;color:{COLOR_TEXT};">
  Thanks{(' ' + name) if name else ''} — we've received your payment.
</p>
<div style="text-align:center;margin:22px 0 6px 0;">
  <span style="display:inline-block;font-size:34px;font-weight:700;color:{COLOR_PRIMARY};">{amount_str}</span>
</div>
{_info_table([
    ("Paid for", pretty_type),
    ("Order ID", order_id),
    ("Payment ID", payment_id),
    ("Date", when),
    ("Status", "Successful ✓"),
])}
<p style="margin:14px 0 0 0;font-size:13px;line-height:1.6;color:{COLOR_MUTED};">
  Keep this email as your receipt. If you have any questions about this charge, just reply to us.
</p>"""
    text = (
        f"Payment successful — {amount_str}\n\n"
        f"Paid for: {pretty_type}\n"
        f"Order ID: {order_id}\n"
        f"Payment ID: {payment_id}\n"
        f"Date: {when}\n"
        f"Status: Successful\n\n"
        f"Keep this email as your receipt."
    )
    html = _wrap("Payment receipt", inner, preheader=f"Receipt for {amount_str} — {pretty_type}")
    return _send(to_email, subject, html, text)


def send_property_submitted_email(
    to_email: str,
    owner_name: str = "",
    property_title: str = "",
    property_location: str = "",
) -> bool:
    """Confirm to an owner/agent that their listing was received and is under review."""
    name = (owner_name or "").strip().split(" ")[0] if owner_name else ""
    subject = f"We've received your listing — {BRAND_NAME}"
    inner = f"""\
<p style="margin:0 0 6px 0;font-size:13px;text-transform:uppercase;letter-spacing:1.5px;color:{COLOR_ACCENT_DARK};font-weight:600;">Pending review</p>
<h1 style="margin:0 0 14px 0;font-size:24px;font-weight:700;color:{COLOR_PRIMARY};">Thanks — we're reviewing it</h1>
<p style="margin:0 0 6px 0;font-size:15px;line-height:1.7;color:{COLOR_TEXT};">
  Hi{(' ' + name) if name else ''}, your property has been submitted and is now waiting for a quick review by our team.
  We'll email you the moment it goes live — usually within a day.
</p>
{_info_table([
    ("Listing", property_title),
    ("Location", property_location),
    ("Status", "Pending review"),
])}
<p style="margin:14px 0 0 0;font-size:13px;line-height:1.6;color:{COLOR_MUTED};">
  You can track this listing anytime under <strong>My Listings</strong>. No brokerage, ever.
</p>"""
    text = (
        f"We've received your listing on {BRAND_NAME}.\n\n"
        f"Listing: {property_title}\n"
        f"Location: {property_location}\n"
        f"Status: Pending review\n\n"
        f"We'll email you the moment it goes live."
    )
    html = _wrap("Listing received", inner, preheader=f"{property_title or 'Your property'} is pending review")
    return _send(to_email, subject, html, text)


def send_property_rejected_email(
    to_email: str,
    owner_name: str = "",
    property_title: str = "",
    property_location: str = "",
    reason: str = "",
) -> bool:
    """Notify an owner/agent that their listing was not approved."""
    name = (owner_name or "").strip().split(" ")[0] if owner_name else ""
    subject = f"Update on your listing — {BRAND_NAME}"
    reason_block = ""
    if reason:
        reason_block = f"""\
<p style="margin:18px 0 6px 0;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:{COLOR_MUTED};font-weight:600;">Reason</p>
<div style="padding:14px 18px;border-left:3px solid {COLOR_ACCENT};background:{COLOR_BG};border-radius:0 10px 10px 0;font-size:14px;line-height:1.6;color:{COLOR_TEXT};">{reason}</div>"""
    inner = f"""\
<p style="margin:0 0 6px 0;font-size:13px;text-transform:uppercase;letter-spacing:1.5px;color:{COLOR_ACCENT_DARK};font-weight:600;">Listing review</p>
<h1 style="margin:0 0 14px 0;font-size:24px;font-weight:700;color:{COLOR_PRIMARY};">Your listing needs changes</h1>
<p style="margin:0 0 6px 0;font-size:15px;line-height:1.7;color:{COLOR_TEXT};">
  Hi{(' ' + name) if name else ''}, thanks for posting on {BRAND_NAME}. Unfortunately we couldn't publish your
  listing in its current form.
</p>
{_info_table([
    ("Listing", property_title),
    ("Location", property_location),
])}
{reason_block}
<p style="margin:18px 0 0 0;font-size:14px;line-height:1.6;color:{COLOR_MUTED};">
  You can edit and resubmit it anytime from <strong>My Listings</strong>. If you have questions, just reply to this email.
</p>"""
    text = (
        f"Update on your listing on {BRAND_NAME}.\n\n"
        f"Listing: {property_title}\n"
        f"Location: {property_location}\n"
        + (f"Reason: {reason}\n" if reason else "")
        + "\nYou can edit and resubmit it anytime from My Listings."
    )
    html = _wrap("Listing review", inner, preheader=f"Update on {property_title or 'your listing'}")
    return _send(to_email, subject, html, text)


def send_property_listed_email(
    to_email: str,
    owner_name: str = "",
    property_title: str = "",
    property_location: str = "",
    listing_type: str = "",
    price: float = None,
) -> bool:
    """Confirm to an owner/agent that their listing is now live."""
    name = (owner_name or "").strip().split(" ")[0] if owner_name else ""
    subject = f"Your listing is live on {BRAND_NAME} 🎉"
    price_str = ""
    if price not in (None, 0):
        suffix = "/mo" if (listing_type or "").lower() == "rent" else ""
        price_str = f"₹{price:,.0f}{suffix}"
    inner = f"""\
<p style="margin:0 0 6px 0;font-size:13px;text-transform:uppercase;letter-spacing:1.5px;color:{COLOR_ACCENT_DARK};font-weight:600;">Listing published</p>
<h1 style="margin:0 0 14px 0;font-size:24px;font-weight:700;color:{COLOR_PRIMARY};">You're live!</h1>
<p style="margin:0 0 6px 0;font-size:15px;line-height:1.7;color:{COLOR_TEXT};">
  Hi{(' ' + name) if name else ''}, your property is now published and visible to thousands of
  buyers and tenants on {BRAND_NAME}.
</p>
{_info_table([
    ("Listing", property_title),
    ("Location", property_location),
    ("Type", (listing_type or "").title()),
    ("Price", price_str),
])}
{_button("View your listing", "https://rightvillanest.com/dashboard")}
<p style="margin:6px 0 0 0;font-size:13px;line-height:1.6;color:{COLOR_MUTED};">
  Listings with clear photos and complete details get up to 5× more enquiries. We'll email you the moment someone's interested.
</p>"""
    text = (
        f"Your listing is live on {BRAND_NAME}!\n\n"
        f"Listing: {property_title}\n"
        f"Location: {property_location}\n"
        f"Type: {(listing_type or '').title()}\n"
        + (f"Price: {price_str}\n" if price_str else "")
        + "\nView it: https://rightvillanest.com/dashboard"
    )
    html = _wrap("Your listing is live", inner, preheader=f"{property_title or 'Your property'} is now visible to buyers")
    return _send(to_email, subject, html, text)
