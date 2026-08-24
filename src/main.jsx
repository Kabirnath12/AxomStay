import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

const siteInfo = {
  name: 'AxomStay',
  tagline: 'Your Assam journey, thoughtfully planned.',
  description: 'Discover Assam with one trusted local team for tour planning, comfortable cabs, curated packages, and a peaceful stay at New Horizon Farm.',
  phone: '+91 60039 15793',
  whatsapp: 'https://wa.me/916003915793',
  location: 'Guwahati, Assam, India'
};

const services = [
  { title: 'Assam Tour Planning', text: 'Get practical local guidance for Guwahati, Kaziranga, Majuli, Sivasagar, Haflong, Shillong, and the wider Northeast.' },
  { title: 'Curated Travel Packages', text: 'Choose a relaxed wildlife escape, a culture-filled itinerary, or a flexible family holiday planned around your time and budget.' },
  { title: 'New Horizon Farm Stay', text: 'Stay close to nature with a warm local experience, fresh surroundings, and an easy base for exploring Assam.' },
  { title: 'Guwahati Cab Services', text: 'Book reliable airport transfers, local rides, sightseeing cars, and outstation vehicles with familiar local drivers.' }
];

const packages = [
  { title: 'Gateway to Assam', duration: '3 days / 2 nights', text: 'Guwahati highlights, Kamakhya Temple, river views, local food, and a comfortable New Horizon Farm stay.' },
  { title: 'Wild Assam Escape', duration: '4 days / 3 nights', text: 'Travel from Guwahati to Kaziranga with scenic stops, a wildlife-focused itinerary, and dependable transfers.' },
  { title: 'Culture & Countryside', duration: '5 days / 4 nights', text: 'Experience Sivasagar, tea country, village life, and the slower rhythm of Assam with a flexible local guide.' }
];

const destinations = ['Guwahati', 'Kaziranga', 'Majuli', 'Sivasagar', 'Haflong', 'Shillong'];

const destinationShowcase = [
  {
    name: 'Meghalaya',
    eyebrow: 'Waterfalls and living roots',
    text: 'Plan a refreshing hill escape through Shillong, Cherrapunji, Dawki, and the beautiful landscapes of Meghalaya.',
    image: 'https://images.unsplash.com/photo-1518002054494-3a6f94352e9d?auto=format&fit=crop&w=1200&q=85'
  },
  {
    name: 'Kaziranga',
    eyebrow: 'Wildlife and wetland country',
    text: 'Experience Assam’s iconic national park with a practical route, comfortable cab transfers, and time for a memorable safari.',
    image: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=1200&q=85'
  },
  {
    name: 'Arunachal Pradesh',
    eyebrow: 'High mountains and quiet valleys',
    text: 'Travel towards Tawang, Dirang, Bomdila, or Ziro with a route planned around permits, weather, distance, and your pace.',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85'
  }
];

const stats = [
  { value: '2021', label: 'Local journey started' },
  { value: '1 team', label: 'Plan, stay, travel' },
  { value: '24/7', label: 'Trip support' },
  { value: 'Assam', label: 'Our home' }
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
            <span>{siteInfo.name}<small> Assam travel & stays</small></span>
          </div>
          <nav className="nav-links">
            <a href="#about">About AxomStay</a>
            <a href="#packages">Packages</a>
            <a href="#farm">New Horizon Farm</a>
            <a href="#services">Services</a>
            <a href="#gallery">Gallery</a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="nav-actions">
            <a className="ghost-btn" href="tel:+916003915793">Call now</a>
            <a className="primary-btn" href="#contact">Plan a trip</a>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container hero-content">
            <div className="eyebrow">Assam travel, stays, and local guidance</div>
            <h1>{siteInfo.name}</h1>
            <p className="hero-copy">{siteInfo.description}</p>
            <div className="hero-actions">
              <a className="cta-btn" href="#contact">Plan my Assam trip</a>
              <a className="ghost-btn hero-ghost" href="https://wa.me/916003915793" target="_blank" rel="noreferrer">WhatsApp</a>
            </div>
          </div>
        </section>

        <div className="container card-strip">
          <div className="booking-panel">
            <div className="field">
              <label>Starting point</label>
              <select value={booking.pickup} onChange={(event) => setBooking({ ...booking, pickup: event.target.value })}>
                <option>Guwahati Airport</option>
                <option>Guwahati Railway Station</option>
                <option>Silpukhuri</option>
              </select>
            </div>
            <div className="field">
              <label>Where to go</label>
              <select value={booking.destination} onChange={(event) => setBooking({ ...booking, destination: event.target.value })}>
                <option>Kaziranga</option>
                <option>Bhalukpong</option>
                <option>Majuli</option>
                <option>Shillong</option>
                <option>Local Guwahati</option>
              </select>
            </div>
            <div className="field">
              <label>What you need</label>
              <select onChange={(event) => setBooking({ ...booking, type: event.target.value })} defaultValue="Outstation">
                <option>Tour package</option>
                <option>Cab service</option>
                <option>Farm stay</option>
                <option>Travel guidance</option>
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
            <a className="primary-btn" href="#contact">Start planning</a>
          </div>
        </div>

        <section className="section" id="about">
          <div className="container split-grid">
            <div>
              <div className="eyebrow dark">About AxomStay</div>
              <h2>A local Assam travel companion, from the first question to the journey home.</h2>
            </div>
            <div>
              <p>
                AxomStay brings together the parts of an Assam holiday that are usually difficult to coordinate. We help visitors understand where to go, how long to stay, what to see, how to travel between places, and where to rest at the end of the day.
                Our journey began with Guwahati Cab Services in 2021 and grew into a broader hospitality idea through New Horizon Farm. Today, AxomStay connects local transport, honest tour guidance, flexible packages, and a personal farm stay experience.
              </p>
            </div>
          </div>
        </section>

        <section className="section destinations-section">
          <div className="container split-grid">
            <div>
              <div className="eyebrow dark">Explore Assam</div>
              <h2>One starting point for temples, wildlife, islands, hills, and tea country.</h2>
            </div>
            <div className="destination-list">
              {destinations.map((destination) => <span key={destination}>{destination}</span>)}
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

        <section className="section destination-showcase" id="destinations">
          <div className="container">
            <div className="section-head">
              <div className="eyebrow dark">Signature destinations</div>
              <h2>Start in Assam, then follow the landscape wherever your curiosity leads.</h2>
              <p>We can help you combine wildlife, hills, culture, and countryside into one comfortable Northeast journey.</p>
            </div>
            <div className="destination-cards">
              {destinationShowcase.map((destination, index) => (
                <article className="destination-card" style={{ '--card-delay': `${index * 180}ms` }} key={destination.name}>
                  <div className="destination-image-wrap">
                    <img src={destination.image} alt={`${destination.name} travel experience`} />
                    <span className="destination-number">0{index + 1}</span>
                  </div>
                  <div className="destination-card-body">
                    <div className="eyebrow dark">{destination.eyebrow}</div>
                    <h3>{destination.name}</h3>
                    <p>{destination.text}</p>
                    <a href="#contact">Plan this route →</a>
                  </div>
                </article>
              ))}
            </div>
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

        <section className="section alt" id="packages">
          <div className="container">
            <div className="section-head">
              <div className="eyebrow dark">Travel packages</div>
              <h2>Flexible Assam itineraries for first-time visitors and returning guests.</h2>
              <p>These are starting ideas, not fixed tours. Tell us your dates, group size, interests, and budget and we can shape the route around you.</p>
            </div>
            <div className="package-grid">
              {packages.map((item) => (
                <article className="package-card" key={item.title}>
                  <div className="package-duration">{item.duration}</div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  <a href="#contact">Discuss this package →</a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="farm">
          <div className="container experience-grid">
            <div className="experience-panel">
              <div className="eyebrow dark">New Horizon Farm</div>
              <h2>A calm place to stay, reset, and experience Assam more personally.</h2>
              <p>New Horizon Farm is the hospitality side of the AxomStay story. It is for guests who want more than a quick hotel stop: a quieter setting, local warmth, time to breathe, and a helpful base for their Assam trip.</p>
              <ul>
                <li>Peaceful surroundings for couples, families, and slow travelers</li>
                <li>A welcoming local stay connected to practical travel support</li>
                <li>Easy help arranging cabs, sightseeing, transfers, and day trips</li>
                <li>A natural choice for guests who want to combine stay and exploration</li>
              </ul>
              <a className="primary-btn" href="#contact">Ask about a farm stay</a>
            </div>
            <div className="image-panel">
              <img src="https://images.unsplash.com/photo-1507560461415-997cd00bfd45?auto=format&fit=crop&w=1000&q=80" alt="Green countryside near New Horizon Farm" />
            </div>
          </div>
        </section>

        <section className="section alt" id="experience">
          <div className="container experience-grid">
            <div className="experience-panel">
              <div className="eyebrow dark">Why choose us</div>
              <h2>Everything is designed to make Assam feel easier to explore.</h2>
              <ul>
                <li>Clear guidance before you arrive, so your days are planned with confidence</li>
                <li>Local cab support for airport transfers, sightseeing, and outstation routes</li>
                <li>Farm stay hospitality for a more personal and restful Assam experience</li>
                <li>Transparent communication with one team across your whole journey</li>
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
              <h2>Tell us what kind of Assam experience you want.</h2>
              <p>{siteInfo.location}</p>
              <p>Share your travel dates, places you want to visit, preferred pace, and whether you need a package, cab, guidance, or farm stay. We will help you turn the idea into a practical plan.</p>
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
