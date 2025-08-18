import smtplib
import csv
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from PIL import Image
import os

# Gmail SMTP settings
smtp_server = "smtp.gmail.com"
smtp_port = 587
from_email = "info@investobar.com"
password = "yxzx ivqq wtkm sefx"

# Email details (customize text and subject)
subject = "Eveniment Investo Bar – 21 august, ora 17:00"
body_text = """Îți reamintim cu drag că pe 21 august, de la ora 17:00, te așteptăm la Investo Bar pentru o seară de networking, idei și inspirație.
Ne-ar bucura mult să ne revedem și să împărtășim această experiență împreună.
Locația: Ferdinand 22-26, ClujHub, etajul 3
(Plata la bar se face doar cu cardul)
"""
body_html = """
<html>
  <body>
    <p><img src="cid:image1" alt="Investo Bar Image" style="max-width: 100%; height: auto;"></p>
    <h2>Consumă inteligent. Cheltuie mai bine. Primul bar de educație financiară din România.</h2>
    <p>Un loc unde prietenia și educația financiară se întâlnesc pentru a modela un viitor mai bun.</p>
    <p>În parteneriat cu: Top Drinks | Banca Transilvania</p>
    <hr>
  </body>
</html>
"""

# Resize and attach image
image_path = "invite.jpg"  # Update with your image file path
output_path = "resized_image.jpg"  # Temporary resized image file
with Image.open(image_path) as img:
    max_width = 600  # Adjust width as needed
    ratio = max_width / img.width
    new_height = int(img.height * ratio)
    resized_img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
    resized_img.save(output_path, "JPEG", quality=85)

with open(output_path, "rb") as image_file:
    img = MIMEImage(image_file.read(), name=os.path.basename(output_path))
    img.add_header("Content-ID", "<image1>")
    img.add_header("Content-Disposition", "inline", filename=os.path.basename(output_path))

# Clean up temporary file
os.remove(output_path)

# Read recipient list from CSV and send emails
recipients = []
with open("./recipients.csv", "r") as file:
    reader = csv.DictReader(file)
    for row in reader:
        if row["email"]:
            recipients.append(row["email"])

# Send emails
try:
    with smtplib.SMTP(smtp_server, smtp_port) as server:
        server.starttls()
        server.login(from_email, password)
        for recipient in recipients:
            msg = MIMEMultipart()
            msg["Subject"] = subject
            msg["From"] = from_email
            msg["To"] = recipient
            msg.attach(MIMEText(body_text, "plain"))
            msg.attach(MIMEText(body_html, "html"))
            msg.attach(img)
            try:
                server.sendmail(from_email, recipient, msg.as_string())
                print(f"Email sent to {recipient}")
            except Exception as e:
                print(f"Error sending to {recipient}: {str(e)}")
except Exception as e:
    print(f"SMTP connection error: {str(e)}")

print("Done!")