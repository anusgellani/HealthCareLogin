// Global variables
let patients = [];
let staffMembers = [];
let adminUsers = [];
let currentUser = null;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function () {
  initApp();
  setupEventListeners();
  updateHomepageStats();
  if (document.getElementById('dashboardStats')) fetchDashboardStats();
});

// Initialize the application
async function initApp() {
  await fetchPatients();
  await fetchStaffMembers();
  await fetchAdminUsers();
  populatePatientTable();
  setupDatabaseListeners();
  if (localStorage.getItem('currentUser')) {
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
    document.querySelector('.admin-profile h3').textContent = currentUser.name || 'Admin User';
  }
}

// Fetch data from backend
async function fetchPatients() {
  try {
    const response = await fetch('/api/patients');
    patients = await response.json();
    localStorage.setItem('healthcarePatients', JSON.stringify(patients));
  } catch (error) {
    console.error('Error fetching patients:', error);
    patients = JSON.parse(localStorage.getItem('healthcarePatients')) || [];
  }
}

async function fetchStaffMembers() {
  try {
    const response = await fetch('/api/users');
    staffMembers = await response.json();
    localStorage.setItem('healthcareStaff', JSON.stringify(staffMembers));
  } catch (error) {
    console.error('Error fetching staff:', error);
    staffMembers = JSON.parse(localStorage.getItem('healthcareStaff')) || [];
  }
}

async function fetchAdminUsers() {
  try {
    const response = await fetch('/api/admins');
    adminUsers = await response.json();
    localStorage.setItem('healthcareAdmins', JSON.stringify(adminUsers));
  } catch (error) {
    console.error('Error fetching admins:', error);
    adminUsers = JSON.parse(localStorage.getItem('healthcareAdmins')) || [];
  }
}

async function fetchDashboardStats() {
  try {
    const response = await fetch('/api/dashboard-stats');
    const stats = await response.json();
    const statsDiv = document.getElementById('dashboardStats');
    statsDiv.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon primary"><i class="fas fa-users"></i></div>
        <div class="stat-info">
          <h3>Total Users</h3>
          <span>${stats.totalUsers || 0}</span>
          <p>${stats.newUsersToday || 0} new today</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon success"><i class="fas fa-user-md"></i></div>
        <div class="stat-info">
          <h3>Medical Staff</h3>
          <span>${stats.medicalStaff || 0}</span>
          <p>${stats.doctors || 0} doctors, ${stats.otherStaff || 0} staff</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon warning"><i class="fas fa-procedures"></i></div>
        <div class="stat-info">
          <h3>Active Patients</h3>
          <span>${stats.activePatients || 0}</span>
          <p>${stats.criticalPatients || 0} in critical care</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon danger"><i class="fas fa-bell"></i></div>
        <div class="stat-info">
          <h3>Alerts</h3>
          <span>${stats.alerts || 0}</span>
          <p>Require attention</p>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
  }
}

// Set up event listeners
function setupEventListeners() {
  // Patient Registration Form
  const patientForm = document.getElementById('patientForm');
  if (patientForm) {
    patientForm.addEventListener('submit', handlePatientRegistration);
    const clearButton = document.querySelector('.btn-clear');
    if (clearButton) clearButton.addEventListener('click', () => patientForm.reset());
  }

  // Doctor & Staff Login Form
  const doctorLoginForm = document.getElementById('doctorLoginForm');
  if (doctorLoginForm) {
    doctorLoginForm.addEventListener('submit', handleStaffLogin);
  }

  // Login Verification Buttons
  const verifyButtons = document.querySelectorAll('button[onclick^="verifyLogin"]');
  verifyButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const userType = e.target.getAttribute('onclick').match(/verifyLogin\('(.+)'\)/)[1];
      verifyLogin(userType);
    });
  });                  

  // Toggle password visibility
  const togglePasswordIcons = document.querySelectorAll('.toggle-password');
  togglePasswordIcons.forEach(icon => {
    icon.addEventListener('click', () => togglePasswordVisibility(icon.getAttribute('data-target') || 'password', icon));
  });

  // Navigation Links
  document.querySelectorAll('nav ul li a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = link.getAttribute('href');
    });
  });

  // Index Page "Get Started" Button
  const getStartedBtn = document.querySelector('.btn-hero');
  if (getStartedBtn) {
    getStartedBtn.addEventListener('click', () => (window.location.href = 'patient-registration.html'));
  }

  // Footer Quick Links
  const quickLinks = document.querySelectorAll('.footer-column ul li a');
  quickLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = link.getAttribute('href');
    });
  });
}

// Load sample data (fallback)
function loadSampleData() {
  if (patients.length === 0) {
    patients = [
      { id: 'PT001', name: 'John Doe', age: 40, gender: 'Male', email: 'john.doe@example.com', phone: '03001234567', address: '123 Main Street', medicalHistory: 'Hypertension', insurance: 'ABC Insurance', registrationDate: '2025-01-15', status: 'active' },
      { id: 'PT002', name: 'Sana Malik', age: 27, gender: 'Female', email: 'sana.malik@example.com', phone: '03112223344', address: '456 Park Avenue', medicalHistory: 'None', insurance: 'XYZ Insurance', registrationDate: '2025-02-20', status: 'active' }
    ];
    localStorage.setItem('healthcarePatients', JSON.stringify(patients));
  }
  if (staffMembers.length === 0) { 
    staffMembers = [
      { id: 'ST001', name: 'Dr. Sarah Johnson', email: 'sarah.johnson@healthcare.org', password: 'doctor123', role: 'Doctor', specialization: 'Cardiology', phone: '03001112233' },
      { id: 'ST002', name: 'Nurse Robert Smith', email: 'robert.smith@healthcare.org', password: 'nurse123', role: 'Nurse', department: 'Emergency', phone: '03004445566' }
    ];
    localStorage.setItem('healthcareStaff', JSON.stringify(staffMembers));
  }
  if (adminUsers.length === 0) {
    adminUsers = [
      { id: 'AD001', name: 'Admin User', email: 'admin@healthcare.org', password: 'admin123', role: 'System Administrator', phone: '03009998877' }
    ];
    localStorage.setItem('healthcareAdmins', JSON.stringify(adminUsers));
  }
}

// Update homepage statistics
async function updateHomepageStats() {
  const patientCount = document.getElementById('patientCount');
  const doctorCount = document.getElementById('doctorCount');
  const appointmentCount = document.getElementById('appointmentCount');

  try {
    const response = await fetch('/api/dashboard-stats');
    const stats = await response.json();
    if (patientCount) patientCount.textContent = stats.activePatients || 0;
    if (doctorCount) doctorCount.textContent = stats.medicalStaff || 0;
    if (appointmentCount) appointmentCount.textContent = stats.appointments || Math.floor(Math.random() * 50) + 10;
  } catch (error) {
    console.error('Error fetching stats:', error);
    if (patientCount) patientCount.textContent = patients.length;
    if (doctorCount) doctorCount.textContent = staffMembers.filter(staff => staff.role === 'Doctor').length;
    if (appointmentCount) appointmentCount.textContent = Math.floor(Math.random() * 50) + 10;
  }
}

// Handle patient registration
async function handlePatientRegistration(e) {
  e.preventDefault();
  const name = document.getElementById('pname').value;
  const age = document.getElementById('age').value;
  const gender = document.getElementById('gender').value;
  const email = document.getElementById('email').value;
  const phone = document.getElementById('phone').value;
  const address = document.getElementById('address').value;
  const medicalHistory = document.getElementById('medicalHistory').value;
  const insurance = document.getElementById('insurance').value;
  const outputDiv = document.getElementById('patientOutput');

  try {
    const editPatient = localStorage.getItem('editPatient');
    if (editPatient) {
      const patient = JSON.parse(editPatient);
      const response = await fetch(`/api/patients/${patient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, age, gender, email, phone, address, medicalHistory, insurance })
      });
      if (response.ok) {
        outputDiv.innerHTML = `<h3>Patient Updated</h3><p>Patient ${name} updated successfully!</p>`;
        localStorage.removeItem('editPatient');
      }
    } else {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, age, gender, email, phone, address, medicalHistory, insurance, registrationDate: new Date().toISOString().split('T')[0], status: 'active' })
      });
      const savedPatient = await response.json();
      outputDiv.innerHTML = `<h3>Registration Successful</h3><p>Patient ${name} registered with ID ${savedPatient.id}!</p>`;
    }
    e.target.reset();
    fetchPatients();
    updateHomepageStats();
    populatePatientTable();
  } catch (error) {
    console.error('Error saving patient:', error);
    outputDiv.innerHTML = '<p>Error saving patient.</p>';
  }
}

// Handle staff login
async function handleStaffLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const statusDiv = document.getElementById('login-message');

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (response.ok) {
      currentUser = data.user;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      statusDiv.innerHTML = `Login successful! Welcome, ${data.user.name}`;
      statusDiv.style.color = 'green';
      setTimeout(() => (window.location.href = 'admin-panel.html'), 2000);
    } else {
      statusDiv.innerHTML = `Login failed: ${data.error}`;
      statusDiv.style.color = 'red';
    }
  } catch (error) {
    statusDiv.innerHTML = 'Error connecting to server';
    statusDiv.style.color = 'red';
    console.error('Login error:', error);
  }
}

// Verify login
async function verifyLogin(userType) {
  const resultDiv = document.getElementById('verificationResult');
  try {
    const response = await fetch(`/api/verify-login/${userType}`);
    const data = await response.json();
    resultDiv.innerHTML = `
      <h3>Verification Results</h3>
      <div class="result-content ${data.success ? 'success' : 'error'}">
        <i class="fas ${data.success ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${data.message}
        <div class="verification-details">
          <p><strong>Verification Type:</strong> ${userType.charAt(0).toUpperCase() + userType.slice(1)}</p>
          <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Status:</strong> ${data.success ? 'Verified' : 'Failed'}</p>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Verification error:', error);
    resultDiv.innerHTML = '<p>Error during verification.</p>';
  }
}

// Toggle password visibility
function togglePasswordVisibility(inputId, iconElement) {
  const passwordInput = document.getElementById(inputId);
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    iconElement.classList.remove('fa-eye');
    iconElement.classList.add('fa-eye-slash');
  } else {
    passwordInput.type = 'password';
    iconElement.classList.remove('fa-eye-slash');
    iconElement.classList.add('fa-eye');
  }
}

// Admin panel functions
function showAdminSection(sectionId) {
  document.querySelectorAll('.admin-section').forEach(section => (section.style.display = 'none'));
  document.getElementById(`admin${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)}`).style.display = 'block';
  document.querySelectorAll('.admin-menu li').forEach(item => item.classList.remove('active'));
  document.querySelector(`.admin-menu li[onclick="showAdminSection('${sectionId}')"]`).classList.add('active');

  if (sectionId === 'users') manageUsers();
  else if (sectionId === 'reports') generateReports();
}

async function manageUsers() {
  const content = `
    <div class="user-management-container">
      <h4>Current Users</h4>
      <div class="search-container">
        <input type="text" id="userSearch" placeholder="Search users..." oninput="filterUsers()">
        <button class="btn-search" onclick="filterUsers()"><i class="fas fa-search"></i></button>
      </div>
      <div class="user-list">
        <table id="usersTable">
          <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Actions</th></tr></thead>
          <tbody id="usersTableBody">${await generateUserList()}</tbody>
        </table>
      </div>
      <button class="btn-add" onclick="addNewUser()">Add New User</button>
    </div>
  `;
  document.getElementById('userManagementContent').innerHTML = content;
}

async function generateUserList() {
  const allUsers = [...staffMembers, ...adminUsers];
  return allUsers.map(user => `
    <tr>
      <td>${user.name}</td>
      <td>${user.role}</td>
      <td>${user.email}</td>
      <td>
        <button class="btn-edit" onclick="editUser('${user.id}')"><i class="fas fa-edit"></i></button>
        <button class="btn-delete" onclick="deleteUser('${user.id}')"><i class="fas fa-trash-alt"></i></button>
      </td>
    </tr>
  `).join('');
}

function filterUsers() {
  const searchTerm = document.getElementById('userSearch').value.toLowerCase();
  const rows = document.querySelectorAll('#usersTableBody tr');
  rows.forEach(row => {
    const name = row.cells[0].textContent.toLowerCase();
    const role = row.cells[1].textContent.toLowerCase();
    const email = row.cells[2].textContent.toLowerCase();
    row.style.display = (name.includes(searchTerm) || role.includes(searchTerm) || email.includes(searchTerm)) ? '' : 'none';
  });
}

async function addNewUser() {
  const modalContent = `
    <div class="admin-modal">
      <div class="modal-header"><h3>Add New User</h3><button onclick="closeModal()"><i class="fas fa-times"></i></button></div>
      <div class="modal-body">
        <form id="addUserForm">
          <input type="hidden" id="userId">
          <div><label>Name</label><input type="text" id="userName" required></div>
          <div><label>Email</label><input type="email" id="userEmail" required></div>
          <div><label>Role</label><select id="userRole"><option value="Doctor">Doctor</option><option value="Nurse">Nurse</option><option value="Administrator">Administrator</option></select></div>
          <div><label>Password</label><input type="password" id="userPassword" required></div>
          <div><label>Phone</label><input type="tel" id="userPhone"></div>
          <button type="submit">Save</button>
        </form>
      </div>
    </div>
  `;
  document.getElementById('adminActions').innerHTML = modalContent;
  document.getElementById('adminActions').style.display = 'flex';
  document.getElementById('addUserForm').addEventListener('submit', handleUserFormSubmit);
}

async function editUser(userId) {
  const user = [...staffMembers, ...adminUsers].find(u => u.id === userId);
  if (user) {
    const modalContent = `
      <div class="admin-modal">
        <div class="modal-header"><h3>Edit User</h3><button onclick="closeModal()"><i class="fas fa-times"></i></button></div>
        <div class="modal-body">
          <form id="editUserForm">
            <input type="hidden" id="userId" value="${user.id}">
            <div><label>Name</label><input type="text" id="userName" value="${user.name}" required></div>
            <div><label>Email</label><input type="email" id="userEmail" value="${user.email}" required></div>
            <div><label>Role</label><select id="userRole"><option value="Doctor" ${user.role === 'Doctor' ? 'selected' : ''}>Doctor</option><option value="Nurse" ${user.role === 'Nurse' ? 'selected' : ''}>Nurse</option><option value="Administrator" ${user.role === 'Administrator' ? 'selected' : ''}>Administrator</option></select></div>
            <div><label>Password</label><input type="password" id="userPassword" value="${user.password}" required></div>
            <div><label>Phone</label><input type="tel" id="userPhone" value="${user.phone || ''}"></div>
            <button type="submit">Save</button>
          </form>
        </div>
      </div>
    `;
    document.getElementById('adminActions').innerHTML = modalContent;
    document.getElementById('adminActions').style.display = 'flex';
    document.getElementById('editUserForm').addEventListener('submit', handleUserFormSubmit);
  }
}

async function deleteUser(userId) {
  if (confirm('Are you sure you want to delete this user?')) {
    try {
      await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      fetchStaffMembers();
      fetchAdminUsers();
      document.getElementById('usersTableBody').innerHTML = await generateUserList();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  }
}

async function handleUserFormSubmit(e) {
  e.preventDefault();
  const userId = document.getElementById('userId').value;
  const name = document.getElementById('userName').value;
  const email = document.getElementById('userEmail').value;
  const role = document.getElementById('userRole').value;
  const password = document.getElementById('userPassword').value;
  const phone = document.getElementById('userPhone').value;

  try {
    const method = userId ? 'PUT' : 'POST';
    const url = userId ? `/api/users/${userId}` : '/api/users';
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, role, password, phone })
    });
    if (response.ok) {
      fetchStaffMembers();
      fetchAdminUsers();
      document.getElementById('usersTableBody').innerHTML = await generateUserList();
      closeModal();
      alert('User saved successfully!');
    }
  } catch (error) {
    console.error('Error saving user:', error);
    alert('Error saving user.');
  }
}

function closeModal() {
  document.getElementById('adminActions').style.display = 'none';
  document.getElementById('adminActions').innerHTML = '';
}

async function generateReports() {
  const content = '<h3>Generating Report...</h3><p>Reports will be displayed here soon.</p>';
  document.getElementById('reportContent').innerHTML = content;
  try {
    const response = await fetch('/api/reports');
    const reports = await response.json();
    document.getElementById('reportContent').innerHTML = `<pre>${JSON.stringify(reports, null, 2)}</pre>`;
  } catch (error) {
    console.error('Error generating reports:', error);
    document.getElementById('reportContent').innerHTML = '<p>Error generating reports.</p>';
  }
}

function createAppointment() {
  alert('Create Appointment functionality to be implemented.');
}

function sendNotification() {
  alert('Send Notification functionality to be implemented.');
}

function backupDatabase() {
  alert('Backup Database functionality to be implemented.');
}

function restoreBackup() {
  alert('Restore Backup functionality to be implemented.');
}

function saveSettings() {
  alert('Settings saved successfully!');
}

function forgotPassword() {
  alert('Forgot password functionality to be implemented.');
}

function signInWithGoogle() {
  alert('Google sign-in functionality to be implemented.');
}

// Patient Database Management
function populatePatientTable() {
  const patientTableBody = document.getElementById('patientTableBody');
  if (patientTableBody) {
    patientTableBody.innerHTML = patients.map(patient => `
      <tr>
        <td>${patient.id}</td><td>${patient.name}</td><td>${patient.age}</td><td>${patient.gender}</td><td>${patient.email}</td><td>${patient.phone}</td>
        <td><button onclick="viewPatient('${patient.id}')"><i class="fas fa-eye"></i></button><button onclick="editPatient('${patient.id}')"><i class="fas fa-edit"></i></button></td>
      </tr>
    `).join('');
  }
}

function viewPatient(patientId) {
  const patient = patients.find(p => p.id === patientId);
  if (patient) alert(`Patient Details: ${JSON.stringify(patient, null, 2)}`);
}

function editPatient(patientId) {
  const patient = patients.find(p => p.id === patientId);
  if (patient) {
    localStorage.setItem('editPatient', JSON.stringify(patient));
    window.location.href = 'patient-registration.html';
  }
}

function setupDatabaseListeners() {
  const patientSearch = document.getElementById('patientSearch');
  const genderFilter = document.getElementById('genderFilter');
  if (patientSearch) patientSearch.addEventListener('input', () => filterPatients(patientSearch.value));
  if (genderFilter) genderFilter.addEventListener('change', () => filterPatients(genderFilter.value, true));
}

function filterPatients(value, isGender = false) {
  const filtered = isGender ? patients.filter(p => p.gender === value) : patients.filter(p => p.name.toLowerCase().includes(value.toLowerCase()) || p.id.includes(value));
  populatePatientTable(filtered);
}