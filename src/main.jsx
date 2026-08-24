import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

const siteInfo = {
  name: 'New Horizon Farm',
  tagline: 'Guwahati Cab Services',
  description: 'Trusted intercity and local rides paired with a peaceful farm stay experience in the heart of Assam.',
  phone: '+91 60039 15793',
  whatsapp: 'https://wa.me/916003915793',
  location: 'Silpukhuri, Sarania Hills, Guwahati, Assam, India'
};

const services = [
  { title: 'Airport & Local Rides', text: 'Comfortable pickups and drop-offs for families, business travelers, and daily commuters in Guwahati.' },
  { title: 'Outstation Tours', text: 'Safe, affordable, and well-planned trips to Shillong, Kaziranga, Bhalukpong, and beyond.' },
  { title: 'Farm Stay Experience', text: 'A unique countryside stay with fresh air, warm hospitality, and a relaxing nature retreat.' },
  { title: 'Event & Family Travel', text: 'Dedicated support for family visits, events, functions, and special group journeys.' }
];

const stats = [
  { value: '2021', label: 'Business founded' },
  { value: '24/7', label: 'Support' },
  { value: '100%', label: 'Local care' },
  { value: 'Assam', label: 'Service area' }
];

const gallery = [
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=800&q=80'
];

function AdminPanel() {
  const [adminKey, setAdminKey] = useState('');
  const [enquiries, setEnquiries] = useState([]);
  const [status, setStatus] = useState('idle');

  const loadEnquiries = async (event) => {
    event.preventDefault();
    setStatus('loading');
    try {
      const response = await fetch('/api/enquiries', { headers: { 'x-admin-key': adminKey } });
      if (!response.ok) throw new Error('Unauthorized');
      const data = await response.json();
      setEnquiries(data.enquiries);
      setStatus('loaded');
    } catch (_error) {
      setStatus('error');
    }
  };

  return (
    <main className="admin-page">
      <div className="container admin-shell">
        <a className="back-link" href="/">← Back to website</a>
        <div className="eyebrow dark">Private workspace</div>
        <h1>Enquiries</h1>
        <p className="admin-intro">Review ride, farm stay, and general enquiries submitted through the website.</p>
        <form className="admin-login" onSubmit={loadEnquiries}>
          <input required type="password" placeholder="Admin key" value={adminKey} onChange={(event) => setAdminKey(event.target.value)} />
          <button className="primary-btn" type="submit">{status === 'loading' ? 'Loading...' : 'Load enquiries'}</button>
        </form>
        {status === 'error' && <p className="form-status error">The admin key was rejected or the database is unavailable.</p>}
        {status === 'loaded' && <div className="admin-list">
          {enquiries.length === 0 && <p>No enquiries yet.</p>}
          {enquiries.map((enquiry) => (
            <article className="enquiry-row" key={enquiry._id}>
              <div><strong>{enquiry.name}</strong><span>{enquiry.phone}</span></div>
              <div><span>{enquiry.type}</span><span>{enquiry.destination || 'General enquiry'}</span></div>
              <p>{enquiry.message}</p>
              <time>{new Date(enquiry.createdAt).toLocaleString()}</time>
            </article>
          ))}
        </div>}
      </div>
    </main>
  );
}

function App() {
  const [booking, setBooking] = useState({ pickup: 'Guwahati Airport', destination: 'Shillong / Kaziranga', passengers: '2' });
  const [contact, setContact] = useState({ name: '', phone: '', message: '' });
  const [submitState, setSubmitState] = useState('idle');

  if (window.location.hash === '#admin') return <AdminPanel />;

  const submitEnquiry = async (event) => {
    event.preventDefault();
    setSubmitState('sending');
    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...contact, ...booking, type: 'ride' })
      });
      if (!response.ok) throw new Error('Request failed');
      setSubmitState('sent');
      setContact({ name: '', phone: '', message: '' });
    } catch (_error) {
      setSubmitState('error');
    }
  };

  return (
    <>
      <header className="topbar">
        <div className="container nav">
          <div className="brand">
            <span className="brand-mark">N</span>
            <span>{siteInfo.name}</span>
          </div>
          <nav className="nav-links">
            <a href="#about">About</a>
            <a href="#services">Services</a>
            <a href="#experience">Experience</a>
            <a href="#gallery">Gallery</a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="nav-actions">
            <a className="ghost-btn" href="tel:+916003915793">Call now</a>
            <a className="primary-btn" href="#contact">Book a ride</a>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container hero-content">
            <div className="eyebrow">Trusted transport and homestay care</div>
            <h1>{siteInfo.tagline}</h1>
            <p className="hero-copy">{siteInfo.description}</p>
            <div className="hero-actions">
              <a className="cta-btn" href="#contact">Plan my trip</a>
              <a className="ghost-btn hero-ghost" href="https://wa.me/916003915793" target="_blank" rel="noreferrer">WhatsApp</a>
            </div>
          </div>
        </section>

        <div className="container card-strip">
          <div className="booking-panel">
            <div className="field">
              <label>Pickup</label>
              <select value={booking.pickup} onChange={(event) => setBooking({ ...booking, pickup: event.target.value })}>
                <option>Guwahati Airport</option>
                <option>Guwahati Railway Station</option>
                <option>Silpukhuri</option>
              </select>
            </div>
            <div className="field">
              <label>Destination</label>
              <select value={booking.destination} onChange={(event) => setBooking({ ...booking, destination: event.target.value })}>
                <option>Shillong / Kaziranga</option>
                <option>Bhalukpong</option>
                <option>Local Guwahati</option>
              </select>
            </div>
            <div className="field">
              <label>Travel type</label>
              <select onChange={(event) => setBooking({ ...booking, type: event.target.value })} defaultValue="Outstation">
                <option>Outstation</option>
                <option>Airport pickup</option>
                <option>Farm stay</option>
              </select>
            </div>
            <div className="field">
              <label>Passengers</label>
              <select value={booking.passengers} onChange={(event) => setBooking({ ...booking, passengers: event.target.value })}>
                <option value="1">1 person</option>
                <option value="2">2 people</option>
                <option value="4">3-4 people</option>
                <option value="6">5+ people</option>
              </select>
            </div>
            <a className="primary-btn" href="#contact">Request quote</a>
          </div>
        </div>

        <section className="section" id="about">
          <div className="container split-grid">
            <div>
              <div className="eyebrow dark">Our story</div>
              <h2>Built from real service, trusted by families and travelers.</h2>
            </div>
            <div>
              <p>
                We started with a simple goal: make travel dependable, warm, and affordable for people in Assam.
                Over time, that service expanded into a more complete guest experience — combining trusted cab service with a welcoming farm stay for those who want comfort, nature, and genuine hospitality.
              </p>
            </div>
          </div>
        </section>

        <section className="stats-wrap">
          <div className="container stats-grid">
            {stats.map((item) => (
              <div className="stat-card" key={item.label}>
                <div className="stat-number">{item.value}</div>
                <div className="stat-label">{item.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="section" id="services">
          <div className="container">
            <div className="section-head">
              <div className="eyebrow dark">What we offer</div>
              <h2>Travel and hospitality services designed around your comfort.</h2>
            </div>
            <div className="service-grid">
              {services.map((service) => (
                <article className="service-card" key={service.title}>
                  <div className="service-icon">✦</div>
                  <h3>{service.title}</h3>
                  <p>{service.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section alt" id="experience">
          <div className="container experience-grid">
            <div className="experience-panel">
              <div className="eyebrow dark">Why choose us</div>
              <h2>Professional drivers, flexible plans, and a genuine service mindset.</h2>
              <ul>
                <li>Clean and comfortable rides for local and outstation travel</li>
                <li>Friendly support for family trips, work travel, and group bookings</li>
                <li>Farm stay hospitality with calm surroundings and personal care</li>
                <li>Transparent communication and dependable scheduling</li>
              </ul>
            </div>
            <div className="image-panel">
              <img src="https://images.unsplash.com/photo-1507560461415-997cd00bfd45?auto=format&fit=crop&w=1000&q=80" alt="Farm stay landscape" />
            </div>
          </div>
        </section>

        <section className="section" id="gallery">
          <div className="container">
            <div className="section-head">
              <div className="eyebrow dark">Gallery</div>
              <h2>Moments of travel, nature, and hospitality.</h2>
            </div>
            <div className="gallery-grid">
              {gallery.map((src, index) => (
                <img key={index} src={src} alt="New Horizon Farm and travel experience" />
              ))}
            </div>
          </div>
        </section>

        <section className="section contact-section" id="contact">
          <div className="container contact-box">
            <div>
              <div className="eyebrow dark">Contact</div>
              <h2>Let’s plan your next ride or stay.</h2>
              <p>{siteInfo.location}</p>
              <p><strong>Phone:</strong> {siteInfo.phone}</p>
              <p><strong>WhatsApp:</strong> <a href={siteInfo.whatsapp} target="_blank" rel="noreferrer">Chat instantly</a></p>
            </div>
            <form className="contact-form" onSubmit={submitEnquiry}>
              <input required type="text" placeholder="Your name" value={contact.name} onChange={(event) => setContact({ ...contact, name: event.target.value })} />
              <input required type="tel" placeholder="Phone number" value={contact.phone} onChange={(event) => setContact({ ...contact, phone: event.target.value })} />
              <textarea required rows="4" placeholder="Tell us about your trip or stay requirement" value={contact.message} onChange={(event) => setContact({ ...contact, message: event.target.value })} />
              <button type="submit" className="primary-btn" disabled={submitState === 'sending'}>{submitState === 'sending' ? 'Sending...' : 'Send enquiry'}</button>
              {submitState === 'sent' && <p className="form-status success">Thanks, your enquiry has been received.</p>}
              {submitState === 'error' && <p className="form-status error">Could not send right now. Please call or WhatsApp us.</p>}
            </form>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <span>© 2021–2026 {siteInfo.name}</span>
          <span>{siteInfo.tagline}</span>
          <a href="#admin">Owner login</a>
        </div>
      </footer>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
