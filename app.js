/* ============================================================
   BUSGO — script.js
   All JavaScript logic for the BusGo bus booking website
   ============================================================ */

/* ── APP STATE ──────────────────────────────────────────────── */
const state = {
  user:          null,          // { name, email }
  search:        { from: '', to: '', date: '' },
  selectedBus:   null,          // Bus object
  selectedSeats: [],            // Array of seat IDs e.g. ['1A','1B']
  pricePerSeat:  0,
  bookings:      [],            // Array of completed booking objects
};

/* ── MOCK DATA ───────────────────────────────────────────────── */
const BUSES = [
  { id: 1, operator: 'Patel Travels',    type: 'AC Sleeper',       dep: '06:00', arr: '14:30', dur: '8h 30m', price: 650,  seats: 24, rating: 4.5 },
  { id: 2, operator: 'Raj Express',      type: 'Non-AC Seater',    dep: '07:30', arr: '15:00', dur: '7h 30m', price: 350,  seats: 38, rating: 3.8 },
  { id: 3, operator: 'Shyam Roadways',   type: 'AC Semi-Sleeper',  dep: '09:00', arr: '17:30', dur: '8h 30m', price: 520,  seats: 12, rating: 4.2 },
  { id: 4, operator: 'Gujarat Travels',  type: 'Volvo AC',         dep: '10:30', arr: '18:00', dur: '7h 30m', price: 800,  seats: 6,  rating: 4.7 },
  { id: 5, operator: 'Mahadev Express',  type: 'Non-AC Sleeper',   dep: '14:00', arr: '22:30', dur: '8h 30m', price: 420,  seats: 40, rating: 3.5 },
  { id: 6, operator: 'Orange Travels',   type: 'AC Sleeper',       dep: '16:00', arr: '00:30', dur: '8h 30m', price: 700,  seats: 18, rating: 4.4 },
  { id: 7, operator: 'Star Bus Service', type: 'Volvo AC Sleeper', dep: '21:30', arr: '06:00', dur: '8h 30m', price: 900,  seats: 8,  rating: 4.8 },
  { id: 8, operator: 'Neeta Travels',    type: 'Non-AC Seater',    dep: '22:00', arr: '05:30', dur: '7h 30m', price: 300,  seats: 45, rating: 3.6 },
];

const POPULAR_ROUTES = [
  ['Ahmedabad', 'Mumbai'],
  ['Surat',     'Pune'],
  ['Rajkot',    'Ahmedabad'],
  ['Vadodara',  'Delhi'],
  ['Mumbai',    'Jaipur'],
  ['Delhi',     'Udaipur'],
];

// Fixed booked seats for consistent demo experience (seat numbers 1-40)
const BOOKED_SEAT_NUMBERS = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 3, 7, 13, 18, 24, 31, 38, 40];

/* ============================================================
   NAVIGATION
   ============================================================ */

/**
 * Switch between pages.
 * @param {string} pageId - The page identifier (e.g. 'home', 'login')
 */
function showPage(pageId) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(function (page) {
    page.classList.remove('active');
  });

  // Show target page
  const target = document.getElementById('page-' + pageId);
  if (target) {
    target.classList.add('active');
  }

  // Hide navbar on login page, show on all others
  const navbar = document.getElementById('navbar');
  navbar.style.display = (pageId === 'login') ? 'none' : 'flex';

  // Run page-specific setup
  if (pageId === 'bookings') {
    renderBookings();
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ============================================================
   TOAST NOTIFICATION
   ============================================================ */

/**
 * Show a brief toast message at the bottom of the screen.
 * @param {string} message
 */
function showToast(message) {
  var toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(function () {
    toast.classList.remove('show');
  }, 3000);
}

/* ============================================================
   HOME PAGE
   ============================================================ */

/**
 * Run once on page load to set up defaults and dynamic content.
 */
function initHome() {
  // Set today as default date and block past dates
  var today = new Date().toISOString().split('T')[0];
  var dateInput = document.getElementById('home-date');
  dateInput.value = today;
  dateInput.min   = today;

  // Build popular route chips dynamically
  buildPopularRoutes();
}

/**
 * Build the popular routes chips on the home page.
 */
function buildPopularRoutes() {
  var container = document.getElementById('popular-routes');
  container.innerHTML = '';

  POPULAR_ROUTES.forEach(function (route) {
    var from = route[0];
    var to   = route[1];

    var chip = document.createElement('div');
    chip.className = 'route-chip';
    chip.innerHTML =
      '<span class="cities">' + from + ' → ' + to + '</span>' +
      '<span class="arrow">→</span>';

    chip.addEventListener('click', function () {
      document.getElementById('home-from').value = from;
      document.getElementById('home-to').value   = to;
      showToast('Route set: ' + from + ' → ' + to);
    });

    container.appendChild(chip);
  });
}

/**
 * Swap the From and To city values.
 */
function swapCities() {
  var fromSelect = document.getElementById('home-from');
  var toSelect   = document.getElementById('home-to');
  var temp       = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value   = temp;
}

/**
 * Validate inputs and navigate to the search results page.
 */
function searchBuses() {
  var from = document.getElementById('home-from').value;
  var to   = document.getElementById('home-to').value;
  var date = document.getElementById('home-date').value;

  if (!from) {
    showToast('⚠️ Please select a departure city');
    return;
  }
  if (!to) {
    showToast('⚠️ Please select a destination city');
    return;
  }
  if (from === to) {
    showToast('⚠️ Departure and destination cannot be the same');
    return;
  }
  if (!date) {
    showToast('⚠️ Please select a journey date');
    return;
  }

  // Save search state
  state.search = { from: from, to: to, date: date };

  // Build the results page and navigate
  renderSearchResults();
  showPage('results');
}

/* ============================================================
   LOGIN PAGE
   ============================================================ */

/**
 * Switch between Login and Sign Up tabs.
 * @param {string} tab - 'login' or 'signup'
 */
function switchTab(tab) {
  var isLogin = (tab === 'login');

  document.getElementById('form-login').classList.toggle('active', isLogin);
  document.getElementById('form-signup').classList.toggle('active', !isLogin);
  document.getElementById('tab-login').classList.toggle('active', isLogin);
  document.getElementById('tab-signup').classList.toggle('active', !isLogin);
}

/**
 * Handle login form submission.
 */
function doLogin() {
  var email = (document.getElementById('login-email').value || '').trim();
  var pass  = (document.getElementById('login-pass').value  || '').trim();

  if (!email || !email.includes('@')) {
    showToast('⚠️ Please enter a valid email address');
    return;
  }
  if (!pass) {
    showToast('⚠️ Please enter your password');
    return;
  }

  // Use the part before @ as display name
  var name = email.split('@')[0];
  loginUser(name, email);
}

/**
 * Handle sign-up form submission.
 */
function doSignup() {
  var name  = (document.getElementById('signup-name').value  || '').trim();
  var email = (document.getElementById('signup-email').value || '').trim();
  var phone = (document.getElementById('signup-phone').value || '').trim();
  var pass  = (document.getElementById('signup-pass').value  || '').trim();

  if (!name) {
    showToast('⚠️ Please enter your full name');
    return;
  }
  if (!email || !email.includes('@')) {
    showToast('⚠️ Please enter a valid email address');
    return;
  }
  if (phone.length < 10) {
    showToast('⚠️ Please enter a valid 10-digit phone number');
    return;
  }
  if (pass.length < 6) {
    showToast('⚠️ Password must be at least 6 characters');
    return;
  }

  loginUser(name, email);
}

/**
 * Skip login and continue as a guest.
 */
function skipLogin() {
  loginUser('Guest', 'guest@busgo.com');
}

/**
 * Set the logged-in user and update the navbar.
 * @param {string} name
 * @param {string} email
 */
function loginUser(name, email) {
  state.user = { name: name, email: email };

  // Update navbar
  document.getElementById('nav-login-btn').style.display = 'none';
  document.getElementById('nav-user-btn').style.display  = 'inline-flex';
  document.getElementById('nav-user-name').textContent   = name;

  showToast('Welcome, ' + name + '! 🎉');
  showPage('home');
}

/* ============================================================
   SEARCH RESULTS PAGE
   ============================================================ */

/**
 * Build and render the search results page content.
 */
function renderSearchResults() {
  var from = state.search.from;
  var to   = state.search.to;
  var date = state.search.date;

  // Format the date nicely
  var dateObj     = new Date(date + 'T00:00:00'); // prevent timezone shift
  var dateDisplay = dateObj.toDateString();

  // Update header
  document.getElementById('res-route-title').textContent = from + '  →  ' + to;
  document.getElementById('res-meta-sub').textContent    = dateDisplay + '  •  ' + BUSES.length + ' buses available';
  document.getElementById('res-count').textContent       = BUSES.length + ' buses found';

  // Build bus cards
  var container = document.getElementById('bus-list-container');
  container.innerHTML = '';

  BUSES.forEach(function (bus) {
    var seatsClass = bus.seats <= 10 ? 'seats-low' : 'seats-ok';
    var seatsLabel = (bus.seats <= 10 ? '🔥 ' : '') + bus.seats + ' seats left';

    var card = document.createElement('div');
    card.className = 'bus-card';
    card.innerHTML =
      '<div class="bus-card-header">' +
        '<span class="bus-operator">' + bus.operator + '</span>' +
        '<span class="bus-type-badge">' + bus.type + '</span>' +
      '</div>' +
      '<div class="bus-card-body">' +
        '<div class="bus-timing">' +
          '<div class="time-block">' +
            '<div class="time">'  + bus.dep + '</div>' +
            '<div class="city">'  + from    + '</div>' +
          '</div>' +
          '<div class="duration-line">' +
            '<div class="dur-text">' + bus.dur + '</div>' +
            '<div class="dur-bar"></div>' +
          '</div>' +
          '<div class="time-block right">' +
            '<div class="time">' + bus.arr + '</div>' +
            '<div class="city">' + to      + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="bus-card-footer">' +
        '<div class="price-block">' +
          '<div class="price">₹'  + bus.price + '</div>' +
          '<div class="price-sub">per seat</div>' +
        '</div>' +
        '<div class="seats-rating">' +
          '<span class="seats-tag ' + seatsClass + '">' + seatsLabel + '</span>' +
          '<span class="rating-tag">★ ' + bus.rating + '</span>' +
        '</div>' +
        '<button class="btn btn-red" style="padding:10px 20px;font-size:0.86rem;" ' +
                'onclick="selectBus(' + bus.id + ')">Book Now →</button>' +
      '</div>';

    container.appendChild(card);
  });
}

/**
 * Toggle a sort button active state.
 * @param {HTMLElement} btn
 */
function setSortActive(btn) {
  document.querySelectorAll('.sort-btn').forEach(function (b) {
    b.classList.remove('active');
  });
  btn.classList.add('active');
  showToast('Sorted by: ' + btn.textContent);
}

/* ============================================================
   SEAT SELECTION PAGE
   ============================================================ */

/**
 * Select a bus and navigate to the seat selection page.
 * @param {number} busId
 */
function selectBus(busId) {
  state.selectedBus   = BUSES.find(function (b) { return b.id === busId; });
  state.selectedSeats = [];
  state.pricePerSeat  = state.selectedBus.price;

  buildSeatPage();
  showPage('seats');
}

/**
 * Build the seat selection page content.
 */
function buildSeatPage() {
  var bus  = state.selectedBus;
  var from = state.search.from;
  var to   = state.search.to;
  var date = new Date(state.search.date + 'T00:00:00').toDateString();

  // Update header
  document.getElementById('seat-bus-title').textContent = bus.operator + ' — ' + bus.type;
  document.getElementById('seat-bus-sub').textContent   = from + ' → ' + to + '  |  ' + date;

  // Update summary panel
  document.getElementById('sum-from').textContent  = from;
  document.getElementById('sum-to').textContent    = to;
  document.getElementById('sum-date').textContent  = date;
  document.getElementById('sum-op').textContent    = bus.operator;
  document.getElementById('sum-type').textContent  = bus.type;
  document.getElementById('sum-dep').textContent   = bus.dep;
  document.getElementById('sum-price').textContent = '₹' + bus.price;

  // Build seat grid
  buildSeatGrid();
  updateSummaryPanel();
}

/**
 * Build the 10-row × 4-seat interactive grid.
 */
function buildSeatGrid() {
  var grid   = document.getElementById('seat-grid');
  var labels = ['A', 'B', 'C', 'D'];
  grid.innerHTML = '';

  for (var row = 0; row < 10; row++) {
    var rowEl = document.createElement('div');
    rowEl.className = 'seat-row';

    for (var col = 0; col < 4; col++) {
      // Add aisle gap between columns B and C (after index 1)
      if (col === 2) {
        var aisleDiv = document.createElement('div');
        aisleDiv.className = 'aisle-num';
        aisleDiv.textContent = (row + 1);
        rowEl.appendChild(aisleDiv);
      }

      var seatNumber = row * 4 + col + 1;
      var seatId     = (row + 1) + labels[col];
      var isBooked   = BOOKED_SEAT_NUMBERS.indexOf(seatNumber) !== -1;

      var seatBtn = document.createElement('button');
      seatBtn.className    = 'seat' + (isBooked ? ' booked' : '');
      seatBtn.textContent  = seatId;
      seatBtn.disabled     = isBooked;
      seatBtn.dataset.id   = seatId;

      if (!isBooked) {
        (function (id) {
          seatBtn.addEventListener('click', function () {
            toggleSeat(this, id);
          });
        })(seatId);
      }

      rowEl.appendChild(seatBtn);
    }

    grid.appendChild(rowEl);
  }
}

/**
 * Toggle a seat's selected state.
 * @param {HTMLElement} btn
 * @param {string} seatId
 */
function toggleSeat(btn, seatId) {
  var index = state.selectedSeats.indexOf(seatId);

  if (index === -1) {
    // Select the seat
    state.selectedSeats.push(seatId);
    btn.classList.add('selected');
  } else {
    // Deselect the seat
    state.selectedSeats.splice(index, 1);
    btn.classList.remove('selected');
  }

  updateSummaryPanel();
}

/**
 * Refresh the booking summary sidebar based on current seat selection.
 */
function updateSummaryPanel() {
  var count       = state.selectedSeats.length;
  var total       = count * state.pricePerSeat;
  var proceedBtn  = document.getElementById('proceed-btn');
  var seatsRow    = document.getElementById('seats-row');
  var seatsList   = document.getElementById('sel-seats-list');

  document.getElementById('sum-total').textContent = '₹' + total;

  if (count > 0) {
    seatsRow.classList.remove('seat-row-hidden');
    seatsRow.style.display = 'flex';

    seatsList.innerHTML = state.selectedSeats.map(function (s) {
      return '<span class="seat-tag">' + s + '</span>';
    }).join('');

    proceedBtn.disabled     = false;
    proceedBtn.textContent  = 'Proceed  —  ' + count + ' seat(s)  ₹' + total;
  } else {
    seatsRow.style.display  = 'none';
    proceedBtn.disabled     = true;
    proceedBtn.textContent  = 'Select seats to proceed';
  }
}

/* ============================================================
   PASSENGER DETAILS PAGE
   ============================================================ */

/**
 * Navigate to the passenger details page and populate summary.
 */
function goToPassenger() {
  var bus   = state.selectedBus;
  var from  = state.search.from;
  var to    = state.search.to;
  var date  = new Date(state.search.date + 'T00:00:00').toDateString();
  var total = state.selectedSeats.length * state.pricePerSeat;

  // Populate trip summary panel
  document.getElementById('ps-route').textContent  = from + ' → ' + to;
  document.getElementById('ps-date').textContent   = date;
  document.getElementById('ps-op').textContent     = bus.operator + '  |  ' + bus.type;
  document.getElementById('ps-seats').textContent  = state.selectedSeats.join(', ');
  document.getElementById('ps-total').textContent  = '₹' + total;
  document.getElementById('sf-total').textContent  = '₹' + total;

  // Pre-fill name and email if user is logged in (and not a guest)
  if (state.user && state.user.name !== 'Guest') {
    document.getElementById('p-name').value  = state.user.name;
    document.getElementById('p-email').value = state.user.email;
  } else {
    document.getElementById('p-name').value  = '';
    document.getElementById('p-email').value = '';
  }

  showPage('passenger');
}

/* ============================================================
   BOOKING CONFIRMATION
   ============================================================ */

/**
 * Validate passenger form, create booking, and show confirmation.
 */
function confirmBooking() {
  var name   = (document.getElementById('p-name').value   || '').trim();
  var age    = (document.getElementById('p-age').value    || '').trim();
  var gender = (document.getElementById('p-gender').value || '').trim();
  var phone  = (document.getElementById('p-phone').value  || '').trim();
  var email  = (document.getElementById('p-email').value  || '').trim();

  // Validate all fields
  if (!name) {
    showToast('⚠️ Please enter the passenger name');
    return;
  }
  var ageNum = parseInt(age, 10);
  if (!age || isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
    showToast('⚠️ Please enter a valid age (1–120)');
    return;
  }
  if (!gender) {
    showToast('⚠️ Please select gender');
    return;
  }
  if (phone.length < 10) {
    showToast('⚠️ Please enter a valid 10-digit phone number');
    return;
  }
  if (!email || !email.includes('@')) {
    showToast('⚠️ Please enter a valid email address');
    return;
  }

  // Build booking object
  var bus       = state.selectedBus;
  var from      = state.search.from;
  var to        = state.search.to;
  var date      = state.search.date;
  var total     = state.selectedSeats.length * state.pricePerSeat;
  var bookingId = 'BG' + Math.floor(100000 + Math.random() * 900000);
  var bookedOn  = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  var booking = {
    id:        bookingId,
    operator:  bus.operator,
    busType:   bus.type,
    from:      from,
    to:        to,
    date:      date,
    dep:       bus.dep,
    arr:       bus.arr,
    seats:     state.selectedSeats.join(', '),
    seatCount: state.selectedSeats.length,
    total:     total,
    passenger: name,
    age:       age,
    gender:    gender,
    phone:     phone,
    email:     email,
    bookedOn:  bookedOn,
    status:    'Confirmed',
  };

  // Save booking to state
  state.bookings.unshift(booking);

  // Populate confirmation page
  populateConfirmationPage(booking);

  showPage('confirm');
  showToast('🎉 Booking confirmed! Have a safe journey!');
}

/**
 * Fill in all fields on the confirmation/ticket page.
 * @param {Object} booking
 */
function populateConfirmationPage(booking) {
  var dateDisplay = new Date(booking.date + 'T00:00:00').toDateString();

  document.getElementById('conf-id').textContent       = booking.id;
  document.getElementById('conf-operator').textContent = booking.operator;
  document.getElementById('conf-bustype').textContent  = booking.busType;
  document.getElementById('conf-from').textContent     = booking.from.substring(0, 3).toUpperCase();
  document.getElementById('conf-to').textContent       = booking.to.substring(0, 3).toUpperCase();
  document.getElementById('conf-dep').textContent      = booking.dep;
  document.getElementById('conf-arr').textContent      = booking.arr;
  document.getElementById('conf-date').textContent     = dateDisplay;
  document.getElementById('conf-seats').textContent    = booking.seats;
  document.getElementById('conf-pax').textContent      = booking.passenger + ', ' + booking.gender + ', ' + booking.age + 'yrs';
  document.getElementById('conf-phone').textContent    = booking.phone;
  document.getElementById('conf-booked-on').textContent = 'Booked on ' + booking.bookedOn;
  document.getElementById('conf-total').textContent    = '₹' + booking.total;
}

/* ============================================================
   MY BOOKINGS PAGE
   ============================================================ */

/**
 * Render all past bookings on the My Bookings page.
 */
function renderBookings() {
  var name = state.user ? state.user.name : 'Guest';
  document.getElementById('bk-user-name').textContent =
    'Hi ' + name + ' 👋  —  All your trips in one place';

  var emptyState   = document.getElementById('bookings-empty');
  var bookingsList = document.getElementById('bookings-list');

  if (state.bookings.length === 0) {
    emptyState.style.display   = 'block';
    bookingsList.innerHTML = '';
    return;
  }

  emptyState.style.display = 'none';

  bookingsList.innerHTML = state.bookings.map(function (b) {
    var dateDisplay = new Date(b.date + 'T00:00:00').toDateString();
    var statusClass = b.status === 'Confirmed' ? 'status-confirmed' : 'status-cancelled';

    return (
      '<div class="booking-item">' +
        '<div class="bi-header">' +
          '<span class="bi-operator">' + b.operator + ' — ' + b.busType + '</span>' +
          '<span class="bi-status ' + statusClass + '">✓ ' + b.status + '</span>' +
        '</div>' +
        '<div class="bi-route">' +
          '<div>' +
            '<div class="bi-city">' + b.from + '</div>' +
            '<div class="bi-time">' + b.dep  + ' Departure</div>' +
          '</div>' +
          '<span class="bi-arrow">→</span>' +
          '<div class="bi-arr">' +
            '<div class="bi-city">' + b.to  + '</div>' +
            '<div class="bi-time">' + b.arr + ' Arrival</div>' +
          '</div>' +
        '</div>' +
        '<div class="bi-footer">' +
          '<div class="bi-detail">' +
            '<div class="lbl">Date</div>' +
            '<div class="val">' + dateDisplay + '</div>' +
          '</div>' +
          '<div class="bi-detail">' +
            '<div class="lbl">Seat(s)</div>' +
            '<div class="val">' + b.seats + '</div>' +
          '</div>' +
          '<div class="bi-detail">' +
            '<div class="lbl">Total Paid</div>' +
            '<div class="val price">₹' + b.total + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="bi-booking-id">' +
          'Booking ID: ' + b.id + '  |  ' + b.bookedOn +
        '</div>' +
      '</div>'
    );
  }).join('');
}

/* ============================================================
   INITIALISE ON PAGE LOAD
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  initHome();
});
