const updated = 'July 10, 2026'

export default function PrivacyPolicy() {
  return <section className="legal-page section">
    <span className="eyebrow">Privacy Policy</span>
    <h1>How Allay House handles your information.</h1>
    <p className="legal-page__updated">Last updated: {updated}</p>
    <div className="legal-page__content">
      <h2>Introduction</h2>
      <p>Allay House uses personal information to operate bookings, customer accounts, waitlist communications, enquiries, and administrative services. This policy explains the information we collect and how we use it.</p>
      <h2>Information We Collect</h2>
      <p>We may collect your name, email address, phone number, booking selections, appointment date and time, customer notes, account details, waitlist preferences, contact-form messages, and basic technical information needed to keep the website reliable and secure.</p>
      <h2>Bookings, Accounts, And Waitlist</h2>
      <p>Booking information is used to schedule and administer appointments. Account information helps customers sign in and reuse booking details. Waitlist information is used to share launch access, service updates, and related transactional messages.</p>
      <h2>Messages And Transactional Email</h2>
      <p>Contact enquiries are used to respond to your message. Booking confirmations, waitlist messages, and administrative notifications may be delivered through Resend using backend-only credentials.</p>
      <h2>Images And Service Providers</h2>
      <p>Administrator-uploaded service and testimonial images are hosted with Cloudinary. Website data may be stored in PostgreSQL or Neon and served through the project hosting environment. These providers process information only as needed to support the website and services.</p>
      <h2>How We Use Information</h2>
      <p>We use information for booking administration, customer communication, service improvement, security, troubleshooting, legal obligations, and internal reporting. We do not sell personal information.</p>
      <h2>Data Sharing And Retention</h2>
      <p>Information is shared only with service providers, administrators, or where required to operate the website, protect the service, or comply with law. We keep information only as long as reasonably needed for these purposes.</p>
      <h2>Security</h2>
      <p>We use reasonable technical and organisational safeguards, but no online service can be guaranteed to be completely secure.</p>
      <h2>Your Choices</h2>
      <p>You may contact Allay House to ask about your information, request corrections, or discuss deletion where applicable. Some records may need to be retained for legitimate business or legal reasons.</p>
      <h2>Children, Third-Party Links, And Updates</h2>
      <p>The website is not intended for children. Third-party links are governed by their own policies. We may update this policy as Allay House services evolve.</p>
      <h2>Contact</h2>
      <p>For privacy questions, contact Allay House through the contact page or the details listed in the website footer.</p>
    </div>
  </section>
}
