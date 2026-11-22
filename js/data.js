/*
 * CityReads – demo content. PB-02: starter clubs are pre-loaded so the app
 * never feels empty on day one (CP2408 Iteration 2 finding).
 * All names, places and numbers are placeholders for the prototype.
 */
window.CityReadsData = {
  joinCode: 'READ26',

  clubs: [
    {
      id: 'central-library',
      name: 'Central Library Book Club',
      location: 'Central Library, Level 1',
      meets: 'Every second Tuesday, 6pm',
      members: 38,
      clubProgress: 40,
      description: 'The city’s longest-running club. Classics and new favourites, with tea afterwards.',
      book: { title: 'Pride and Prejudice', author: 'Jane Austen', pages: 432 }
    },
    {
      id: 'easy-reads',
      name: 'Easy Reads Circle',
      location: 'Northside Community Centre',
      meets: 'Thursdays, 11am',
      members: 14,
      clubProgress: 20,
      description: 'Short chapters and no pressure. A friendly place if you’re new to reading or getting back into it.',
      book: { title: 'The Secret Garden', author: 'Frances Hodgson Burnett', pages: 288 }
    },
    {
      id: 'riverside-mystery',
      name: 'Riverside Café Mystery Club',
      location: 'Riverside Café',
      meets: 'Every second Saturday, 10am',
      members: 21,
      clubProgress: 65,
      description: 'Whodunnits over coffee. Bring your theories.',
      book: { title: 'The Hound of the Baskervilles', author: 'Arthur Conan Doyle', pages: 256 }
    },
    {
      id: 'young-adults',
      name: 'Young Adult Readers',
      location: 'Online and at Central Library',
      meets: 'Wednesdays, 4pm',
      members: 27,
      clubProgress: 55,
      description: 'For readers aged 13 to 18. Adventure, fantasy and anything with a twist.',
      book: { title: 'Treasure Island', author: 'Robert Louis Stevenson', pages: 292 }
    },
    {
      id: 'family-story-time',
      name: 'Family Story Time',
      location: 'Westside Library',
      meets: 'Sundays, 10am',
      members: 32,
      clubProgress: 75,
      description: 'Parents, carers and kids reading aloud together.',
      book: { title: 'Alice’s Adventures in Wonderland', author: 'Lewis Carroll', pages: 192 }
    }
  ],

  updates: [
    { from: 'City Library', text: 'The Summer Reading Challenge starts on 1 December. Sign up at any branch or here in the app.' },
    { from: 'City Council', text: 'New book-swap shelves are now open at three community centres.' },
    { from: 'Easy Reads Circle', text: 'New members are welcome this Thursday. First-timers get a free coffee.' }
  ]
};
