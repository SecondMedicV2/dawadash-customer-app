const products=[
 {
   id:'dolo',
   name:'Dolo 650',
   brand:'Micro Labs',
   detail:'Paracetamol · 15 tablets',
   price:27.5,
   mrp:33.5,
   category:'everyday',
   unit:'Strip of 15',
   pack:'strip',
   tone:'',
   badge:'Bestseller',
   rx:true,
   salt:'Paracetamol 650mg',
   strength:'650mg',
   dosageForm:'Tablet',
   packSize:'15 tablets',
   gstRatePercent:12,
   offers:[
     {storeId:'store-hazratganj',storeName:'Shree Ram Medicals',area:'Hazratganj',distanceKm:0.6,price:27.5,mrp:33.5,discount:6.0,stock:142,eta:'20–30 min'},
     {storeId:'store-gomti',storeName:'MedPlus Chemist',area:'Gomti Nagar',distanceKm:2.4,price:29.0,mrp:33.5,discount:4.5,stock:28,eta:'30–40 min'},
     {storeId:'store-aliganj',storeName:'Care Pharmacy',area:'Aliganj',distanceKm:3.8,price:31.0,mrp:33.5,discount:2.5,stock:15,eta:'35–45 min'}
   ]
 },
 {
   id:'vitc',
   name:'Vitamin C + Zinc',
   brand:'Cipla Health',
   detail:'Daily immune support · 20 tabs',
   price:112,
   mrp:140,
   category:'wellness',
   unit:'20 tablets',
   pack:'box',
   tone:'tone-yellow',
   badge:'Popular',
   rx:false,
   salt:'Ascorbic Acid (500mg) + Zinc (50mg)',
   strength:'550mg',
   dosageForm:'Tablet',
   packSize:'20 tablets',
   gstRatePercent:12,
   offers:[
     {storeId:'store-hazratganj',storeName:'Shree Ram Medicals',area:'Hazratganj',distanceKm:0.6,price:112,mrp:140,discount:28,stock:55,eta:'20–30 min'},
     {storeId:'store-gomti',storeName:'MedPlus Chemist',area:'Gomti Nagar',distanceKm:2.4,price:115,mrp:140,discount:25,stock:40,eta:'30–40 min'}
   ]
 },
 {
   id:'d3',
   name:'Uprise-D3 60K',
   brand:'Alkem',
   detail:'Cholecalciferol · 4 capsules',
   price:90,
   mrp:105,
   category:'wellness',
   unit:'Pack of 4',
   pack:'strip',
   tone:'tone-blue',
   badge:'',
   rx:true,
   salt:'Cholecalciferol 60,000 IU',
   strength:'60000 IU',
   dosageForm:'Capsule',
   packSize:'4 capsules',
   gstRatePercent:12,
   offers:[
     {storeId:'store-hazratganj',storeName:'Shree Ram Medicals',area:'Hazratganj',distanceKm:0.6,price:90,mrp:105,discount:15,stock:32,eta:'20–30 min'},
     {storeId:'store-aliganj',storeName:'Care Pharmacy',area:'Aliganj',distanceKm:3.8,price:92,mrp:105,discount:13,stock:18,eta:'35–45 min'}
   ]
 },
 {
   id:'gluco',
   name:'Glucon-D Tangy Orange',
   brand:'Zydus Wellness',
   detail:'Instant energy · 200 g',
   price:94,
   mrp:110,
   category:'chronic',
   unit:'200 g pack',
   pack:'jar',
   tone:'tone-pink',
   badge:'Local favourite',
   rx:false,
   salt:'Glucose + Sucrose + Vitamin C',
   strength:'200g',
   dosageForm:'Powder',
   packSize:'200 g',
   gstRatePercent:12,
   offers:[
     {storeId:'store-hazratganj',storeName:'Shree Ram Medicals',area:'Hazratganj',distanceKm:0.6,price:94,mrp:110,discount:16,stock:60,eta:'20–30 min'},
     {storeId:'store-gomti',storeName:'MedPlus Chemist',area:'Gomti Nagar',distanceKm:2.4,price:95,mrp:110,discount:15,stock:25,eta:'30–40 min'}
   ]
 },
 {
   id:'cetirizine',
   name:'Cetirizine 10 mg',
   brand:'Dr. Reddy’s',
   detail:'Allergy relief · 10 tablets',
   price:19,
   mrp:24,
   category:'everyday',
   unit:'Strip of 10',
   pack:'box',
   tone:'tone-purple',
   badge:'Good value',
   rx:true,
   salt:'Cetirizine Hydrochloride 10mg',
   strength:'10mg',
   dosageForm:'Tablet',
   packSize:'10 tablets',
   gstRatePercent:12,
   offers:[
     {storeId:'store-hazratganj',storeName:'Shree Ram Medicals',area:'Hazratganj',distanceKm:0.6,price:19,mrp:24,discount:5,stock:80,eta:'20–30 min'},
     {storeId:'store-aliganj',storeName:'Care Pharmacy',area:'Aliganj',distanceKm:3.8,price:20,mrp:24,discount:4,stock:42,eta:'35–45 min'}
   ]
 },
 {
   id:'ors',
   name:'Electral ORS',
   brand:'FDC Limited',
   detail:'Orange flavour · 21.8 g',
   price:22,
   mrp:25,
   category:'everyday',
   unit:'1 sachet',
   pack:'box',
   tone:'tone-yellow',
   badge:'',
   rx:false,
   salt:'Oral Rehydration Salts WHO Formula',
   strength:'21.8g',
   dosageForm:'Sachet',
   packSize:'1 sachet',
   gstRatePercent:12,
   offers:[
     {storeId:'store-hazratganj',storeName:'Shree Ram Medicals',area:'Hazratganj',distanceKm:0.6,price:22,mrp:25,discount:3,stock:120,eta:'20–30 min'},
     {storeId:'store-gomti',storeName:'MedPlus Chemist',area:'Gomti Nagar',distanceKm:2.4,price:22,mrp:25,discount:3,stock:90,eta:'30–40 min'}
   ]
 },
 {
   id:'calcium',
   name:'Shelcal 500',
   brand:'Torrent Pharma',
   detail:'Calcium + Vitamin D3 · 15 tabs',
   price:114,
   mrp:132,
   category:'wellness',
   unit:'Strip of 15',
   pack:'bottle',
   tone:'tone-blue',
   badge:'',
   rx:false,
   salt:'Elemental Calcium 500mg + Vitamin D3 250 IU',
   strength:'500mg',
   dosageForm:'Tablet',
   packSize:'15 tablets',
   gstRatePercent:12,
   offers:[
     {storeId:'store-hazratganj',storeName:'Shree Ram Medicals',area:'Hazratganj',distanceKm:0.6,price:114,mrp:132,discount:18,stock:45,eta:'20–30 min'},
     {storeId:'store-aliganj',storeName:'Care Pharmacy',area:'Aliganj',distanceKm:3.8,price:116,mrp:132,discount:16,stock:30,eta:'35–45 min'}
   ]
 },
 {
   id:'sugar',
   name:'Sugar Free Gold',
   brand:'Zydus Wellness',
   detail:'Aspartame sweetener · 100 tabs',
   price:65,
   mrp:75,
   category:'chronic',
   unit:'100 tablets',
   pack:'bottle',
   tone:'tone-purple',
   badge:'',
   rx:false,
   salt:'Aspartame Pellet Sweetener',
   strength:'100 tabs',
   dosageForm:'Pellet',
   packSize:'100 tablets',
   gstRatePercent:12,
   offers:[
     {storeId:'store-hazratganj',storeName:'Shree Ram Medicals',area:'Hazratganj',distanceKm:0.6,price:65,mrp:75,discount:10,stock:38,eta:'20–30 min'},
     {storeId:'store-gomti',storeName:'MedPlus Chemist',area:'Gomti Nagar',distanceKm:2.4,price:67,mrp:75,discount:8,stock:20,eta:'30–40 min'}
   ]
 },
 {
   id:'azithral',
   name:'Azithral 500mg Tablet',
   brand:'Alembic Pharma',
   detail:'Azithromycin (500mg) · 5 tablets',
   price:119,
   mrp:132,
   category:'everyday',
   unit:'Strip of 5',
   pack:'strip',
   tone:'tone-pink',
   badge:'Prescription',
   rx:true,
   salt:'Azithromycin (500mg)',
   strength:'500mg',
   dosageForm:'Tablet',
   packSize:'5 tablets',
   gstRatePercent:12,
   isOutOfStock:true,
   offers:[
     {storeId:'store-hazratganj',storeName:'Shree Ram Medicals',area:'Hazratganj',distanceKm:0.6,price:119,mrp:132,discount:13,stock:0,eta:'Out of Stock'}
   ]
 }
];

// Persistent state across sessions
let savedBasket = {};
try {
  savedBasket = JSON.parse(localStorage.getItem('dawadash_basket') || '{}');
} catch (e) {
  savedBasket = {};
}
const basket = new Map(Object.entries(savedBasket));

let currentUser = null;
try {
  currentUser = JSON.parse(localStorage.getItem('dawadash_user') || 'null');
} catch (e) {
  currentUser = null;
}
if (!currentUser) {
  currentUser = { name: 'Amit', phone: '9876543210', address: 'Gomti Nagar, Lucknow' };
}

let activeStore = {
  id: 'store-hazratganj',
  name: 'Shree Ram Medical Store',
  area: 'Hazratganj, Lucknow',
  distanceKm: 0.8
};

let basketRevision = 0;
const money = value => '₹' + Number(value).toLocaleString('en-IN', {
  minimumFractionDigits: Number.isInteger(Number(value)) ? 0 : 2,
  maximumFractionDigits: 2
});

const toPaise = val => Math.round(Number(val) * 100);

const grid = document.getElementById('productGrid');

function renderProducts() {
  const search = (document.getElementById('searchInput').value || '').trim().toLowerCase();
  const category = document.getElementById('categoryFilter').value;
  const matches = products.filter(p =>
    (category === 'all' || p.category === category) &&
    (!search || `${p.name} ${p.brand} ${p.detail} ${p.category} ${p.salt || ''}`.toLowerCase().includes(search))
  );

  if (!matches.length) {
    grid.innerHTML = '<div class="no-results"><span class="material-symbols-rounded">search_off</span><h3>No exact match yet</h3><p>Try another name, or upload your prescription and a local pharmacist will help.</p></div>';
    return;
  }

  grid.innerHTML = matches.map(p => {
    const count = basket.get(p.id) || 0;
    const discount = Math.round((1 - p.price / p.mrp) * 100);
    const storeOffer = (p.offers || []).find(o => o.storeId === activeStore.id) || (p.offers || [])[0];
    const isOutOfStock = p.isOutOfStock || (storeOffer && storeOffer.stock <= 0);

    return `<article class="product-card" style="${isOutOfStock ? 'opacity:0.85;border:1px dashed #cbd5e1;' : ''}">
      <div class="product-visual ${p.tone}">
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
        <div class="product-pack ${p.pack}">
          <span class="pack-label">${p.id === 'dolo' ? 'DOLO 650' : p.id === 'vitc' ? 'C + ZINC' : p.id === 'd3' ? 'D3 60K' : p.id === 'gluco' ? 'GLUCON-D' : p.id === 'cetirizine' ? 'CETIRIZINE' : p.id === 'ors' ? 'ELECTRAL' : p.id === 'calcium' ? 'SHELCAL' : p.id === 'azithral' ? 'AZITHRAL' : 'SUGAR FREE'}<small>${p.brand.split(' ')[0]}</small></span>
        </div>
      </div>
      <div class="product-info">
        <div class="product-meta">
          <span>${p.brand}</span>
          ${isOutOfStock ? '<span style="background:#fee2e2;color:#b91c1c;font-size:9px;font-weight:700;padding:2px 6px;border-radius:8px;">Out of Stock</span>' : (p.rx ? '<span class="rx-badge">Rx may be needed</span>' : '')}
        </div>
        <h3>${p.name}</h3>
        <p>${p.detail}</p>
        <div class="product-offers-link">
          <button class="compare-btn" data-compare="${p.id}" aria-label="Compare pharmacy offers for ${p.name}">
            <span class="material-symbols-rounded">storefront</span> Compare ${p.offers ? p.offers.length : 1} stores
          </button>
        </div>
        <div class="product-bottom">
          <span>
            <span class="product-price">${money(p.price)} <del>${money(p.mrp)}</del></span>
            <small class="product-unit">${p.unit} · ${discount}% off</small>
          </span>
          ${isOutOfStock ? `
            <button style="background:#f1f5f9;color:#94a3b8;border:1px solid #cbd5e1;padding:6px 12px;border-radius:20px;font-size:11px;font-weight:700;cursor:not-allowed;" disabled>
              Out of Stock
            </button>
          ` : count ? `
            <span class="stepper">
              <button data-dec="${p.id}" aria-label="Remove one ${p.name}">−</button>
              <strong>${count}</strong>
              <button data-inc="${p.id}" aria-label="Add one ${p.name}">+</button>
            </span>
          ` : `
            <button class="add-button" data-add="${p.id}">
              <span class="material-symbols-rounded">add</span> Add
            </button>
          `}
        </div>
      </div>
    </article>`;
  }).join('');
}

function saveBasketState() {
  try {
    const obj = Object.fromEntries(basket);
    localStorage.setItem('dawadash_basket', JSON.stringify(obj));
  } catch (e) {}
}

function updateBasket() {
  basketRevision++;
  saveBasketState();
  const count = [...basket.values()].reduce((a, b) => a + b, 0);
  const total = products.reduce((sum, p) => sum + p.price * (basket.get(p.id) || 0), 0);
  const dock = document.getElementById('cartDock');
  dock.hidden = count === 0;
  document.getElementById('cartCount').textContent = count;
  document.getElementById('cartTitle').textContent = count === 1 ? '1 item in your basket' : `${count} items in your basket`;
  document.getElementById('cartSummary').textContent = count === 1 ? 'Ready for checkout' : 'Your pharmacy will confirm your order';
  document.getElementById('cartTotal').textContent = money(total);
  renderProducts();
}

function changeBasket(id, delta) {
  const item = products.find(p => p.id === id);
  if (!item) return;
  if (delta > 0) {
    const storeOffer = (item.offers || []).find(o => o.storeId === activeStore.id) || (item.offers || [])[0];
    if (item.isOutOfStock || (storeOffer && storeOffer.stock <= 0)) {
      showToast(`${item.name} is currently out of stock at ${activeStore.name}`);
      return;
    }
  }
  const next = (basket.get(id) || 0) + delta;
  if (next <= 0) basket.delete(id);
  else basket.set(id, next);
  updateBasket();
  if (delta > 0) showToast(`${item.name} added to your basket`);
}

grid.addEventListener('click', event => {
  const add = event.target.closest('[data-add]');
  const inc = event.target.closest('[data-inc]');
  const dec = event.target.closest('[data-dec]');
  const comp = event.target.closest('[data-compare]');
  if (add) changeBasket(add.dataset.add, 1);
  if (inc) changeBasket(inc.dataset.inc, 1);
  if (dec) changeBasket(dec.dataset.dec, -1);
  if (comp) openModal('compare', { id: comp.dataset.compare });
});

document.getElementById('searchInput').addEventListener('input', renderProducts);
document.getElementById('searchButton').addEventListener('click', () => {
  document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
  renderProducts();
});
document.getElementById('searchInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
    renderProducts();
  }
});

document.querySelectorAll('.search-suggestion').forEach(button =>
  button.addEventListener('click', () => {
    document.getElementById('searchInput').value = button.dataset.search;
    renderProducts();
    document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
  })
);

document.querySelectorAll('.category-card[data-search]').forEach(button =>
  button.addEventListener('click', () => {
    const filter = button.dataset.search === 'vitamin' ? 'wellness' : button.dataset.search === 'diabetes' ? 'chronic' : 'everyday';
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = filter;
    renderProducts();
    document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
  })
);

document.getElementById('categoryFilter').addEventListener('change', renderProducts);

const modal = document.getElementById('appModal');
const modalContent = document.getElementById('modalContent');
const fileInput = document.getElementById('prescriptionFile');

function openModal(type, data = {}) {
  if (type === 'upload') {
    modalContent.innerHTML = `<div class="modal-icon"><span class="material-symbols-rounded">document_scanner</span></div>
      <h2>Your prescription, please.</h2>
      <p>Take a clear photo or choose an image or PDF. A licensed pharmacist will review it before confirming your order.</p>
      <label class="upload-zone" id="uploadZone" for="prescriptionFile">
        <span class="material-symbols-rounded">cloud_upload</span>
        <strong>Choose a file or take a photo</strong>
        <small>JPG, PNG or PDF · Up to 10 MB</small>
      </label>
      <div class="upload-file-name" id="uploadFileName"></div>
      <div class="modal-note">
        <span class="material-symbols-rounded">lock</span>
        Your prescription is only shared with the pharmacy team fulfilling your order.
      </div>
      <div class="modal-actions">
        <button class="modal-secondary" data-modal-close>Not now</button>
        <button class="modal-primary" id="submitPrescription">
          <span class="material-symbols-rounded">upload</span> Continue
        </button>
      </div>`;

    document.getElementById('submitPrescription').addEventListener('click', () => {
      if (!fileInput.files.length) {
        fileInput.click();
        return;
      }
      closeModal();
      showToast('Prescription received. A pharmacist will review it shortly.');
    });

    fileInput.onchange = () => {
      const chosen = fileInput.files[0];
      if (chosen) {
        const label = document.getElementById('uploadFileName');
        if (chosen.size > 10 * 1024 * 1024) {
          fileInput.value = '';
          label.textContent = 'That file is larger than 10 MB. Choose a smaller file.';
          return;
        }
        if (!/^(image\/(jpeg|png|webp|heic)|application\/pdf)$/i.test(chosen.type)) {
          fileInput.value = '';
          label.textContent = 'Choose a JPG, PNG, WebP, HEIC or PDF file.';
          return;
        }
        label.textContent = `Selected: ${chosen.name} · ${(chosen.size / 1024 / 1024).toFixed(2)} MB`;
      }
    };
  }

  if (type === 'address') {
    modalContent.innerHTML = `<div class="modal-icon"><span class="material-symbols-rounded">location_on</span></div>
      <h2>Where should we deliver?</h2>
      <p>Choose your Lucknow neighbourhood or detect current GPS location to see nearby pharmacy stock and delivery estimates.</p>
      <select class="modal-field" id="localitySelect" aria-label="Choose a neighbourhood">
        <option>Gomti Nagar, Lucknow</option>
        <option>Hazratganj, Lucknow</option>
        <option>Aliganj, Lucknow</option>
        <option>Indira Nagar, Lucknow</option>
        <option>Alambagh, Lucknow</option>
      </select>
      <button class="modal-secondary modal-wide" id="useGpsLocation" style="margin-bottom: 12px; display: flex; align-items: center; justify-content: center; gap: 6px;">
        <span class="material-symbols-rounded">my_location</span> Use Current Location (GPS)
      </button>
      <button class="modal-primary modal-wide" id="saveAddress">
        Set delivery location <span class="material-symbols-rounded">arrow_forward</span>
      </button>`;

    const selectEl = document.getElementById('localitySelect');
    selectEl.value = document.getElementById('addressLabel').textContent;

    document.getElementById('useGpsLocation').addEventListener('click', () => {
      if (!navigator.geolocation) {
        showToast('Geolocation is not supported by your browser.');
        return;
      }
      showToast('Locating your position in Lucknow...');
      navigator.geolocation.getCurrentPosition(
        pos => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const detected = `${selectEl.value} (GPS ${lat.toFixed(3)}, ${lng.toFixed(3)})`;
          document.getElementById('addressLabel').textContent = selectEl.value;
          closeModal();
          showToast(`Delivering to ${selectEl.value} via GPS`);
        },
        err => {
          showToast('Location permission denied. Please choose your neighbourhood manually.');
        },
        { timeout: 8000 }
      );
    });

    document.getElementById('saveAddress').addEventListener('click', () => {
      document.getElementById('addressLabel').textContent = selectEl.value;
      closeModal();
      showToast('Delivery location updated');
    });
  }

  if (type === 'compare') {
    const med = products.find(p => p.id === data.id);
    if (!med) return;
    const offers = med.offers || [];
    modalContent.innerHTML = `<div class="modal-icon"><span class="material-symbols-rounded">storefront</span></div>
      <h2>Compare Pharmacy Offers</h2>
      <p><strong>${escapeHtml(med.name)}</strong> · ${escapeHtml(med.salt || med.detail)}<br><small style="color:var(--muted)">Exact pharmaceutical composition &amp; pack size</small></p>
      <div class="offers-list" style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px;max-height:280px;overflow-y:auto;">
        ${offers.map((o, idx) => {
          const isLowest = idx === 0;
          return `<div style="border:1px solid var(--line);border-radius:10px;padding:10px 12px;background:${isLowest ? '#f2f8f4' : '#fff'};display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-weight:700;font-size:12px;color:var(--ink);">${escapeHtml(o.storeName)} ${isLowest ? '<span style="background:var(--green);color:#fff;font-size:8px;padding:2px 6px;border-radius:10px;margin-left:4px;">BEST PRICE</span>' : ''}</div>
              <small style="color:var(--muted);">${escapeHtml(o.area)} · ${o.distanceKm} km · ${o.eta}</small>
              <div style="font-size:10px;color:#557061;margin-top:2px;">MRP: <del>₹${o.mrp}</del> · Discount: ₹${o.discount}</div>
            </div>
            <div style="text-align:right;">
              <strong style="font-size:15px;color:var(--green);display:block;">${money(o.price)}</strong>
              <small style="color:var(--muted);font-size:9px;">+12% GST incl.</small>
            </div>
          </div>`;
        }).join('')}
      </div>
      <div class="modal-note"><span class="material-symbols-rounded">verified</span> Prices computed from exact paise arithmetic after store GST and discounts.</div>
      <div class="modal-actions">
        <button class="modal-secondary" data-modal-close>Close</button>
        <button class="modal-primary" id="choosePrimaryOffer"><span class="material-symbols-rounded">check</span> Select Best Offer</button>
      </div>`;

    document.getElementById('choosePrimaryOffer').addEventListener('click', () => {
      changeBasket(med.id, 1);
      closeModal();
      showToast(`Added ${med.name} from best-priced local pharmacy`);
    });
  }

  if (type === 'help') {
    modalContent.innerHTML = `<div class="modal-icon"><span class="material-symbols-rounded">support_agent</span></div>
      <h2>A real person is here for you.</h2>
      <p>Questions about a prescription, a medicine or your delivery? Our Lucknow care team is happy to help.</p>
      <a class="modal-primary modal-wide" href="tel:+915222614890"><span class="material-symbols-rounded">call</span> Call Pharmacy (+91 522 2614890)</a>
      <div class="modal-note" style="margin-top:12px">
        <span class="material-symbols-rounded">schedule</span>
        Here every day, 8 am – 10 pm. For medical emergencies, contact your doctor or local emergency services.
      </div>`;
  }

  if (type === 'profile') {
    modalContent.innerHTML = `<div class="modal-icon"><span class="material-symbols-rounded">account_circle</span></div>
      <h2>Welcome back, ${escapeHtml(currentUser.name)}.</h2>
      <p>Your profile is ready. Manage your personal details, saved delivery addresses and order history.</p>
      <div class="modal-note"><span class="material-symbols-rounded">person</span> Signed in with +91 ${escapeHtml(currentUser.phone)}</div>
      <div class="modal-actions">
        <button class="modal-secondary" data-modal-close>Close</button>
        <button class="modal-primary" id="profileHistory">View order history</button>
      </div>`;
    document.getElementById('profileHistory').addEventListener('click', () => {
      closeModal();
      document.getElementById('order').scrollIntoView({ behavior: 'smooth' });
    });
  }

  if (type === 'tracking') {
    const orderId = (data.order || 'AWD-LKO-88219').trim();
    if (!orderId) {
      showToast('Enter your order ID to check its progress');
      return;
    }

    let savedOrders = [];
    try {
      savedOrders = JSON.parse(localStorage.getItem('dawadash_orders') || '[]');
    } catch (e) {}

    const orderRecord = savedOrders.find(o => o.id === orderId) || {
      id: orderId,
      status: 'out_for_delivery',
      riderName: 'Rahul Yadav',
      vehicle: 'Hero Splendor (UP 32 BK 7421)',
      eta: '14–20 min',
      lat: 26.8467,
      lng: 80.9462,
      lastUpdated: 'Just now',
      rating: null
    };

    renderTrackingModalContent(orderRecord);
  }

  if (type === 'checkout') {
    if (!basket.size) {
      showToast('Your basket is empty. Add an item to continue.');
      return;
    }
    const items = products.filter(p => basket.has(p.id));
    const rx = items.some(p => p.rx);
    const subtotal = items.reduce((s, p) => s + p.price * basket.get(p.id), 0);
    const gstTotal = subtotal * 0.12;
    const finalTotal = subtotal + gstTotal;

    modalContent.innerHTML = `<div class="modal-icon"><span class="material-symbols-rounded">shopping_bag</span></div>
      <h2>Looking good, ${escapeHtml(currentUser.name)}.</h2>
      <p>${items.length} ${items.length === 1 ? 'medicine' : 'medicines'} · Subtotal ${money(subtotal)}</p>
      
      <div class="checkout-summary" style="background:#f7faf8;border:1px solid var(--line);border-radius:10px;padding:12px;margin-bottom:12px;">
        <div style="font-size:11px;color:var(--muted);margin-bottom:6px;">Fulfilled by: <strong style="color:var(--ink);">${escapeHtml(activeStore.name)} (${escapeHtml(activeStore.area)})</strong></div>
        <div style="border-top:1px dashed var(--line);padding-top:6px;display:flex;flex-direction:column;gap:4px;font-size:11px;">
          <div style="display:flex;justify-content:space-between;"><span>Items Subtotal:</span><span>${money(subtotal)}</span></div>
          <div style="display:flex;justify-content:space-between;"><span>Estimated GST (12%):</span><span>${money(gstTotal)}</span></div>
          <div style="display:flex;justify-content:space-between;"><span>Delivery Fee:</span><span style="color:var(--green);font-weight:700;">FREE</span></div>
          <div style="display:flex;justify-content:space-between;font-weight:700;font-size:13px;border-top:1px solid var(--line);padding-top:4px;margin-top:2px;">
            <span>Total Payable:</span><span style="color:var(--green);">${money(finalTotal)}</span>
          </div>
        </div>
      </div>

      <div class="modal-note">
        <span class="material-symbols-rounded">${rx ? 'medical_information' : 'location_on'}</span>
        ${rx ? 'Some items may need a prescription. Your pharmacist will verify it before the order is confirmed.' : 'Your nearby licensed pharmacy will confirm availability and delivery shortly.'}
      </div>

      <div class="modal-actions">
        <button class="modal-secondary" data-modal-close>Keep browsing</button>
        <button class="modal-primary" id="confirmOrder">${rx ? 'Add prescription' : 'Continue'}</button>
      </div>`;

    document.getElementById('confirmOrder').addEventListener('click', () => {
      if (rx) {
        closeModal();
        openModal('upload');
        return;
      }
      // For Non-Rx, close current modal and process simulated Razorpay payment
      closeModal();
      processPaymentFlow({ items, subtotal, gstTotal, finalTotal });
    });
  }

  modal.showModal();
  modal.querySelectorAll('[data-modal-close]').forEach(button => button.addEventListener('click', closeModal));
}

function renderTrackingModalContent(orderRecord) {
  const isDelivered = orderRecord.status === 'delivered';
  modalContent.innerHTML = `<div class="modal-icon"><span class="material-symbols-rounded">${isDelivered ? 'task_alt' : 'local_shipping'}</span></div>
    <h2>${isDelivered ? 'Order Delivered!' : 'Your order is in good hands.'}</h2>
    <p>Order <strong>${escapeHtml(orderRecord.id)}</strong> · Updated ${escapeHtml(orderRecord.lastUpdated || 'just now')}</p>
    
    <div style="background:#f7faf8;border:1px solid var(--line);border-radius:10px;padding:12px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <small style="color:var(--muted);display:block;">DELIVERY PARTNER</small>
          <strong style="font-size:12px;">${escapeHtml(orderRecord.riderName || 'Rahul Yadav')}</strong>
          <small style="color:var(--muted);display:block;">${escapeHtml(orderRecord.vehicle || 'Motorcycle UP 32 BK 7421')}</small>
        </div>
        <div style="display:flex;gap:4px;">
          <a href="tel:${(orderRecord.riderPhone || '+919876543211').replace(/\s+/g, '')}" class="outline-button" style="height:32px;padding:0 8px;font-size:9px;" aria-label="Call Rider">
            <span class="material-symbols-rounded">call</span> Call Rider
          </a>
          <a href="tel:+915222614890" class="outline-button" style="height:32px;padding:0 8px;font-size:9px;" aria-label="Call Store">
            <span class="material-symbols-rounded">store</span> Call Store
          </a>
        </div>
      </div>
      <div style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--line);display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:11px;color:var(--muted);">Live GPS: ${orderRecord.lat ? `${orderRecord.lat.toFixed(4)}, ${orderRecord.lng.toFixed(4)}` : 'Hazratganj Hub'}</span>
        <button id="refreshRiderLocation" style="background:none;border:0;color:var(--green);font-size:11px;font-weight:700;display:flex;align-items:center;gap:3px;cursor:pointer;">
          <span class="material-symbols-rounded" style="font-size:15px;">refresh</span> Refresh
        </button>
      </div>
    </div>

    ${isDelivered ? `
      <div class="review-box" style="background:#fff;border:1px solid var(--line);border-radius:10px;padding:12px;margin-bottom:12px;">
        <h3 style="margin:0 0 6px;font-size:12px;">Rate your delivery</h3>
        ${orderRecord.rating ? `
          <div style="color:var(--green);font-size:14px;">★ ${orderRecord.rating} / 5 Star Rating Recorded</div>
          <small style="color:var(--muted);">Thank you for your feedback!</small>
        ` : `
          <div class="star-rating" style="display:flex;gap:6px;margin-bottom:8px;font-size:20px;cursor:pointer;color:#e0bb6c;">
            <span data-star="1">★</span><span data-star="2">★</span><span data-star="3">★</span><span data-star="4">★</span><span data-star="5">★</span>
          </div>
          <button id="submitReviewBtn" class="modal-primary modal-wide" style="height:34px;font-size:10px;">Submit 5★ Rating</button>
        `}
      </div>
    ` : `
      <div class="modal-note"><span class="material-symbols-rounded">inventory_2</span> Local pharmacy has packed your order. ETA: <strong>${escapeHtml(orderRecord.eta || '14–20 min')}</strong>.</div>
    `}

    <div class="modal-actions">
      <button class="modal-secondary" data-modal-close>Close</button>
      <button class="modal-primary" data-modal-close>Got it</button>
    </div>`;

  modal.querySelectorAll('[data-modal-close]').forEach(button => button.addEventListener('click', closeModal));

  const refreshBtn = document.getElementById('refreshRiderLocation');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      orderRecord.lastUpdated = 'Just now (live refreshed)';
      orderRecord.lat = 26.8475 + (Math.random() - 0.5) * 0.005;
      orderRecord.lng = 80.9470 + (Math.random() - 0.5) * 0.005;
      renderTrackingModalContent(orderRecord);
      showToast('Live rider GPS location refreshed');
    });
  }

  const reviewBtn = document.getElementById('submitReviewBtn');
  if (reviewBtn) {
    reviewBtn.addEventListener('click', () => {
      orderRecord.rating = 5;
      try {
        const saved = JSON.parse(localStorage.getItem('dawadash_orders') || '[]');
        const updated = saved.map(o => o.id === orderRecord.id ? { ...o, rating: 5 } : o);
        localStorage.setItem('dawadash_orders', JSON.stringify(updated));
      } catch (e) {}
      renderTrackingModalContent(orderRecord);
      showToast('Thank you for rating your DawaDash delivery!');
    });
  }
}

function processPaymentFlow({ items, subtotal, gstTotal, finalTotal }) {
  const newOrderId = 'DD-LKO-' + Math.floor(1000 + Math.random() * 9000);
  const paymentRef = 'pay_sandbox_' + Date.now();
  const deliveryOtp = String(Math.floor(1000 + Math.random() * 9000));
  const hasRx = items.some(p => p.rx);

  const orderItems = items.map((p, idx) => ({
    id: `item-${newOrderId}-${idx + 1}`,
    orderId: newOrderId,
    medicineId: p.id,
    medicineName: p.name,
    dosageForm: p.dosageForm || 'Tablet',
    packSize: p.unit || 'Strip of 15',
    quantity: basket.get(p.id) || 1,
    pricePaise: toPaise(p.price * (basket.get(p.id) || 1)),
    isAvailable: true,
    isPacked: false,
  }));

  const newOrder = {
    id: newOrderId,
    orderNumber: newOrderId,
    storeId: activeStore.id || 'store-hazratganj',
    storeName: activeStore.name || 'Shree Ram Medical Store',
    storePhone: '+91 522 2614890',
    riderId: 'rider-rahul',
    riderName: 'Rahul Yadav',
    riderPhone: '+91 98765 43211',
    status: 'offered_to_store',
    paymentMode: 'online_prepaid',
    paymentStatus: 'paid_online',
    paymentProvider: 'razorpay',
    paymentOrderId: 'order_' + Date.now(),
    paymentId: paymentRef,
    subtotalPaise: toPaise(subtotal),
    deliveryFeePaise: 0,
    totalPaise: toPaise(finalTotal),
    customerName: currentUser.name,
    customerArea: (document.getElementById('addressLabel') && document.getElementById('addressLabel').textContent) || 'Hazratganj, Lucknow',
    customerPhone: '+91 ' + currentUser.phone,
    customerPhoneMasked: '+91 ' + currentUser.phone.slice(0, 2) + 'XXX XX' + currentUser.phone.slice(-3),
    deliveryOtpHex: deliveryOtp,
    prescriptionRequired: hasRx,
    prescriptionApproved: !hasRx,
    offerExpiresAt: new Date(Date.now() + 60000).toISOString(),
    vehicle: 'Hero Splendor (UP 32 BK 7421)',
    lat: 26.8467,
    lng: 80.9462,
    eta: '18–25 min',
    items: orderItems,
    events: [
      {
        id: 'evt-' + Date.now(),
        orderId: newOrderId,
        fromStatus: 'placed',
        toStatus: 'offered_to_store',
        triggeredByRole: 'system',
        triggeredByUserId: 'system',
        timestamp: new Date().toISOString()
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastUpdated: 'Just now'
  };

  try {
    const existing = JSON.parse(localStorage.getItem('dawadash_orders') || '[]');
    existing.unshift(newOrder);
    localStorage.setItem('dawadash_orders', JSON.stringify(existing));
    localStorage.setItem('dawadash_last_order', newOrderId);

    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('dawadash_channel');
      channel.postMessage({ type: 'NEW_ORDER', order: newOrder });
    }
  } catch (e) {}

  basket.clear();
  updateBasket();
  showToast(`Order ${newOrderId} placed! Sent to ${activeStore.name}. (OTP: ${deliveryOtp})`);

  // Update tracking input
  const orderInput = document.getElementById('orderInput');
  if (orderInput) orderInput.value = newOrderId;
}

function closeModal() {
  if (modal.open) modal.close();
}

function escapeHtml(value) {
  if (!value) return '';
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

document.querySelectorAll('[data-open-upload]').forEach(button => button.addEventListener('click', () => openModal('upload')));
document.getElementById('heroScan').addEventListener('click', () => openModal('upload'));
document.getElementById('addressButton').addEventListener('click', () => openModal('address'));
document.getElementById('helpButton').addEventListener('click', () => openModal('help'));
document.getElementById('footerHelp').addEventListener('click', () => openModal('help'));
document.getElementById('careButton').addEventListener('click', () => openModal('help'));
document.getElementById('profileButton').addEventListener('click', () => openModal('profile'));
document.getElementById('checkoutButton').addEventListener('click', () => openModal('checkout'));
document.getElementById('trackButton').addEventListener('click', () => openModal('tracking', { order: document.getElementById('orderInput').value }));
document.getElementById('orderInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    openModal('tracking', { order: e.currentTarget.value });
  }
});
document.querySelector('.track-form').addEventListener('submit', event => {
  event.preventDefault();
  openModal('tracking', { order: document.getElementById('orderInput').value });
});
document.getElementById('moreMedicines').addEventListener('click', () => {
  document.getElementById('searchInput').value = '';
  document.getElementById('categoryFilter').value = 'all';
  renderProducts();
  showToast('You’re seeing all available local essentials');
});
document.getElementById('mobileMenu').addEventListener('click', () => openModal('help'));

let toastTimer;
function showToast(text) {
  const toast = document.getElementById('toast');
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

renderProducts();
