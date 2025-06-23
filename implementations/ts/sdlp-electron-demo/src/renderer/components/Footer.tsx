import React from 'react';

function Footer() {
  return (
    <footer className="text-center mt-8">
      <p className="text-gray-600">
        &copy; {new Date().getFullYear()} SDLP Project. All rights reserved.
      </p>
    </footer>
  );
}

export default Footer;
