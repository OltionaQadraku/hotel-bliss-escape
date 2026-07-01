import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

function About() {
  return (
    <div id="about" className="bg-white text-black">
      {/* Hero Section */}
      <section className="container text-center py-5">
        <h2 className="fw-bold mb-3">
          Setting New Standards in <span className="fst-italic text-primary">Luxury Hotel Experiences</span>
        </h2>
        <p className="text-muted mx-auto" style={{ maxWidth: "42rem" }}>
          At Hotel Bliss Escape, we craft more than stays—we create memories.
        </p>
        <img
          src="https://i.pinimg.com/474x/55/5c/3f/555c3f6b5050a0ddc53a603475bef89c.jpg"
          alt="Modern Hotel"
          className="img-fluid rounded-4 shadow mt-4 w-100"
        />
      </section>

      {/* Vision Section */}
      <section className="container py-5">
        <div className="row align-items-center g-4">
          <div className="col-md-4">
            <img
              src="https://i.pinimg.com/474x/55/5c/3f/555c3f6b5050a0ddc53a603475bef89c.jpg"
              alt="Our Vision"
              className="img-fluid rounded-4 shadow-sm"
            />
          </div>
          <div className="col-md-8 text-center text-md-start">
            <h3 className="fw-bold mb-3">
              If you can <span className="fst-italic text-primary">dream it</span>, we can <span className="fst-italic text-primary">build it</span>.
            </h3>
            <p className="text-secondary">
              Our hotel management philosophy revolves around excellence. From personalized guest services to tech-enabled room booking, we innovate to offer a truly unique experience.
            </p>
            <a href="#contact">
              <button className="btn btn-dark mt-3">
                Get in touch
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="bg-light py-5">
        <div className="container text-center">
          <h4 className="fw-semibold mb-3">Our Timeless <span className="fst-italic text-primary">Hospitality</span></h4>
          <p className="text-secondary mx-auto mb-4" style={{ maxWidth: "42rem" }}>
            We've been redefining hotel experiences with tech-savvy check-ins, curated local travel guides, and dedicated concierge support—all tailored for the modern traveler.
          </p>
          <img
            src="https://i.pinimg.com/474x/a9/cf/2e/a9cf2e0737c7c73a9b160e37107fe9a6.jpg"
            alt="Luxury Dining Area"
            className="img-fluid rounded-4 shadow w-100"
          />
        </div>
      </section>
    </div>
  );
}

export default About;