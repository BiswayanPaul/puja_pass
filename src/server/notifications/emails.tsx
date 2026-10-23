import { Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text } from "@react-email/components";
import type { CSSProperties, ReactNode } from "react";
import { formatDate, formatINR, formatPujaDate, formatTimeRange } from "@/lib/format";
import type { Booking } from "@/types";

// Email bodies. Email clients ignore most CSS, so styles are inline objects.

const orange = "#ea580c";
const stone = { 950: "#0c0a09", 600: "#57534e", 500: "#78716c", 200: "#e7e5e4", 50: "#fafaf9" };

const styles = {
  body: { backgroundColor: stone[50], fontFamily: "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif", margin: 0, padding: "24px 0" },
  container: { backgroundColor: "#ffffff", border: `1px solid ${stone[200]}`, borderRadius: 16, margin: "0 auto", maxWidth: 560, padding: 28 },
  brand: { color: stone[950], fontSize: 20, fontWeight: 700, margin: 0 },
  heading: { color: stone[950], fontFamily: "Georgia, serif", fontSize: 28, lineHeight: "34px", margin: "20px 0 8px" },
  text: { color: stone[600], fontSize: 15, lineHeight: "22px", margin: "0 0 12px" },
  small: { color: stone[500], fontSize: 13, lineHeight: "20px", margin: "0 0 8px" },
  button: { backgroundColor: orange, borderRadius: 999, color: "#ffffff", display: "inline-block", fontSize: 15, fontWeight: 700, padding: "12px 22px", textDecoration: "none" },
  pass: { border: `1px solid ${stone[200]}`, borderRadius: 12, margin: "12px 0", padding: 16, textAlign: "center" as const },
  passTier: { color: orange, fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", margin: "0 0 4px" },
  passName: { color: stone[950], fontFamily: "Georgia, serif", fontSize: 20, margin: "0 0 4px" },
  code: { color: stone[950], fontFamily: "Menlo, monospace", fontSize: 15, fontWeight: 700, letterSpacing: "0.08em", margin: "4px 0 0" },
} satisfies Record<string, CSSProperties>;

function Layout({ preview, children }: { preview: string; children: ReactNode }) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.brand}>
            Puja<span style={{ color: orange }}>Pass</span>
          </Text>
          {children}
          <Hr style={{ borderColor: stone[200], margin: "24px 0 16px" }} />
          <Text style={styles.small}>Free public entry is always available through the general gates of every pandal.</Text>
        </Container>
      </Body>
    </Html>
  );
}

export function BookingConfirmedEmail({
  booking,
  manageUrl,
  whatsappShareUrl,
  qrContentIds,
}: {
  booking: Booking;
  manageUrl: string;
  whatsappShareUrl: string;
  /** Pass code → content id of the inline QR image attachment. */
  qrContentIds: Record<string, string>;
}) {
  const visitors = booking.passes.reduce((total, pass) => total + pass.quantity, 0);
  return (
    <Layout preview={`Your ${booking.passes.length === 1 ? "pass" : "passes"} for booking ${booking.id}`}>
      <Heading style={styles.heading}>Your Puja passes are ready</Heading>
      <Text style={styles.text}>
        Namaskar {booking.contact.name}, your booking <strong style={{ whiteSpace: "nowrap" }}>{booking.id}</strong> is confirmed: {booking.passes.length}{" "}
        {booking.passes.length === 1 ? "pass" : "passes"} for {visitors} {visitors === 1 ? "visitor" : "visitors"}. Show each QR code at the
        PujaPass entry lane; one scan admits everyone on the pass.
      </Text>

      {booking.passes.map((pass) => (
        <Section key={pass.id} style={styles.pass}>
          <Text style={styles.passTier}>{pass.tierName.toUpperCase()}</Text>
          <Text style={styles.passName}>{pass.pandal.name}</Text>
          <Text style={styles.small}>
            {formatPujaDate(pass.date)} · {formatTimeRange(pass.startTime, pass.endTime)} · admits {pass.quantity}
          </Text>
          <Img src={`cid:${qrContentIds[pass.code]}`} width="168" height="168" alt={`QR code for pass ${pass.code}`} style={{ margin: "8px auto 0" }} />
          <Text style={styles.code}>{pass.code}</Text>
        </Section>
      ))}

      <Section style={{ margin: "20px 0 8px", textAlign: "center" }}>
        <Button href={manageUrl} style={styles.button}>View or print your passes</Button>
      </Section>
      <Text style={{ ...styles.small, textAlign: "center" }}>
        Going with family? <Link href={whatsappShareUrl} style={{ color: orange, fontWeight: 700 }}>Share the passes on WhatsApp</Link>. The shared link
        can view passes but can&apos;t cancel the booking.
      </Text>

      <Hr style={{ borderColor: stone[200], margin: "20px 0 12px" }} />
      <Text style={styles.small}>
        Total paid {formatINR(booking.total)} via {booking.paymentMethod} · booked on {formatDate(booking.createdAt)}
      </Text>
      <Text style={styles.small}>Keep this email: its button is the only link that can cancel this booking. Don&apos;t forward it.</Text>
    </Layout>
  );
}

export function BookingCancelledEmail({ booking }: { booking: Booking }) {
  return (
    <Layout preview={`Booking ${booking.id} has been cancelled`}>
      <Heading style={styles.heading}>Booking cancelled</Heading>
      <Text style={styles.text}>
        Namaskar {booking.contact.name}, your booking <strong>{booking.id}</strong> has been cancelled and all its passes are no longer valid.
      </Text>
      <Text style={styles.text}>
        A refund of <strong>{formatINR(booking.subtotal)}</strong> (excluding the convenience fee) will reach your original payment method within 5–7
        working days.
      </Text>
    </Layout>
  );
}
