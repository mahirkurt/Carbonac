/**
 * Announcer Component
 * 
 * Screen reader announcements using aria-live regions.
 * Invisible to sighted users but announces content changes to screen readers.
 */

import React from 'react';

function Announcer() {
  return (
    <>
      {/* Polite announcements - wait for user to finish current task */}
      <div
        id="announcer-polite"
        aria-live="polite"
        aria-atomic="true"
        className="visually-hidden"
      />
      
      {/* Assertive announcements - interrupt immediately */}
      <div
        id="announcer-assertive"
        aria-live="assertive"
        aria-atomic="true"
        className="visually-hidden"
      />
    </>
  );
}

export default Announcer;
